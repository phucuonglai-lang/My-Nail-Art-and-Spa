import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course, Lesson } from '../types';
import { Plus, Trash2, Edit2, Video, Image as ImageIcon, Layout, ArrowLeft, Save, X, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableLessonItemProps {
  lesson: Lesson;
  index: number;
  onEdit: (lesson: Lesson) => void;
  onDelete: (id: string) => void;
}

const SortableLessonItem: React.FC<SortableLessonItemProps> = ({ lesson, index, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "bg-white p-4 rounded-2xl border border-brand-border flex items-center gap-4 transition-shadow relative group",
        isDragging ? "shadow-2xl ring-2 ring-brand-accent/50 z-50 opacity-90" : "hover:shadow-md"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-brand-text/20 hover:text-brand-accent transition-colors shrink-0"
      >
        <GripVertical size={20} />
      </div>
      
      <div className="w-10 h-10 bg-brand-bg rounded-xl flex items-center justify-center font-bold text-brand-accent shrink-0 select-none">
        {index + 1}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-sm text-brand-text truncate">{lesson.title}</h4>
        <p className="text-[10px] text-brand-text/40 truncate max-w-sm">{lesson.videoUrl}</p>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit(lesson)}
          className="p-2 text-brand-accent hover:bg-brand-accent hover:text-white rounded-lg transition-all"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => onDelete(lesson.id)}
          className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'courses' | 'lessons'>('courses');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '', description: '', thumbnail: '', category: 'Gel Art', level: 'beginner'
  });
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({
    title: '', videoUrl: '', content: '', order: 1
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const coursesSnap = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(coursesData);
    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async (courseId: string) => {
    const q = query(collection(db, 'courses', courseId, 'lessons'), orderBy('order'));
    const lessonsSnap = await getDocs(q);
    const lessonsData = lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
    setLessons(lessonsData);
  };

  const handleLessonOrderUpdate = async (newLessons: Lesson[]) => {
    if (!selectedCourseId) return;
    
    // Optimistic UI update
    setLessons(newLessons);

    try {
      const batch = writeBatch(db);
      newLessons.forEach((lesson, index) => {
        const lessonRef = doc(db, 'courses', selectedCourseId, 'lessons', lesson.id);
        batch.update(lessonRef, { order: index + 1 });
      });
      await batch.commit();
    } catch (error) {
      console.error("Order Update Error:", error);
      alert("Failed to save new order. Please refresh.");
      fetchLessons(selectedCourseId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((item) => item.id === active.id);
      const newIndex = lessons.findIndex((item) => item.id === over.id);

      const reorderedLessons = arrayMove(lessons, oldIndex, newIndex) as Lesson[];
      handleLessonOrderUpdate(reorderedLessons);
    }
  };

  const handleAddCourse = async () => {
    if (!newCourse.title || !newCourse.description) return;
    try {
      await addDoc(collection(db, 'courses'), newCourse);
      setIsAdding(false);
      setNewCourse({ title: '', description: '', thumbnail: '', category: 'Gel Art', level: 'beginner' });
      fetchData();
    } catch (error) {
      alert("Lỗi khi thêm khóa học");
    }
  };

  const convertToEmbedUrl = (url: string) => {
    if (!url) return '';
    // If it's already an embed link, return as is
    if (url.includes('youtube.com/embed/')) return url;
    
    let videoId = '';
    const watchRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(watchRegExp);
    
    if (match && match[2].length === 11) {
      videoId = match[2];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  const handleAddLesson = async () => {
    if (!selectedCourseId || !newLesson.title) return;
    
    const processedLesson = {
      ...newLesson,
      videoUrl: convertToEmbedUrl(newLesson.videoUrl || '')
    };

    try {
      if (editingLessonId) {
        // Update existing
        await updateDoc(doc(db, 'courses', selectedCourseId, 'lessons', editingLessonId), processedLesson);
      } else {
        // Create new
        await addDoc(collection(db, 'courses', selectedCourseId, 'lessons'), {
          ...processedLesson,
          courseId: selectedCourseId,
          order: lessons.length + 1
        });
      }
      setIsAdding(false);
      setEditingLessonId(null);
      setNewLesson({ title: '', videoUrl: '', content: '', order: lessons.length + 1 });
      fetchLessons(selectedCourseId);
    } catch (error) {
      alert("Error saving lesson");
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setNewLesson({
      title: lesson.title,
      videoUrl: lesson.videoUrl,
      content: lesson.content,
      order: lesson.order
    });
    setEditingLessonId(lesson.id);
    setIsAdding(true);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm("Xác nhận xóa khóa học này?")) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
      fetchData();
    } catch (error) {
      alert(t.admin.delete_confirm_course);
    }
  };

  const handleDeleteLesson = async (courseId: string, lessonId: string) => {
    if (!window.confirm(t.admin.delete_confirm_lesson)) return;
    try {
      await deleteDoc(doc(db, 'courses', courseId, 'lessons', lessonId));
      fetchLessons(courseId);
    } catch (error) {
      alert("Error deleting lesson");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg font-sans pt-20 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <Link to="/" className="text-[10px] font-bold uppercase tracking-widest text-brand-accent flex items-center gap-2 mb-2 hover:opacity-70">
              <ArrowLeft size={14} /> {t.nav.back}
            </Link>
            <h1 className="text-3xl font-bold text-brand-text">{t.admin.title}</h1>
          </div>
          
          <div className="flex bg-white p-1 rounded-2xl border border-brand-border">
            <button 
              onClick={() => { setView('courses'); setSelectedCourseId(null); }}
              className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", view === 'courses' ? "bg-brand-accent text-white" : "text-brand-text/40")}
            >
              {t.admin.courses}
            </button>
            <button 
              disabled={!selectedCourseId}
              onClick={() => setView('lessons')}
              className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", view === 'lessons' ? "bg-brand-accent text-white" : "text-brand-text/40", !selectedCourseId && "opacity-30")}
            >
              {t.admin.lessons}
            </button>
          </div>
        </header>

        {view === 'courses' ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold uppercase tracking-widest text-brand-accent/50">{t.admin.courses}</h2>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-brand-accent/20 transition-all"
              >
                <Plus size={16} /> {t.admin.add_course}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map(course => (
                <div key={course.id} className="bg-white rounded-[24px] border border-brand-border overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                  <div className="aspect-[16/9] bg-brand-bg relative overflow-hidden">
                    <img src={course.thumbnail} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={() => { setSelectedCourseId(course.id); setView('lessons'); fetchLessons(course.id); }}
                        className="p-3 bg-white rounded-xl text-brand-accent hover:scale-110 transition-transform" title={t.admin.lessons}
                      >
                        <Video size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-3 bg-brand-white rounded-xl text-rose-500 hover:scale-110 transition-transform" title={t.admin.delete_confirm_course}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-brand-accent/50 mb-1">{course.category}</div>
                    <h3 className="font-bold text-brand-text line-clamp-1">{course.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6 text-brand-text">
              <div className="flex items-center gap-4">
                 <button onClick={() => setView('courses')} className="p-2 bg-white border border-brand-border rounded-xl text-brand-accent">
                    <ArrowLeft size={18} />
                 </button>
                 <div>
                    <h2 className="text-lg font-bold uppercase tracking-widest leading-none">{t.admin.lessons}</h2>
                    <p className="text-xs opacity-50 mt-1">{courses.find(c => c.id === selectedCourseId)?.title}</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-brand-accent/20 transition-all"
              >
                <Plus size={16} /> {t.admin.add_lesson}
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-brand-text/30 font-bold uppercase tracking-widest px-4 italic">
                {t.admin.reorder_tip}
              </p>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={lessons.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4 relative">
                    {lessons.length > 0 ? lessons.map((lesson, idx) => (
                      <SortableLessonItem 
                        key={lesson.id} 
                        lesson={lesson} 
                        index={idx}
                        onEdit={handleEditLesson}
                        onDelete={(id) => handleDeleteLesson(selectedCourseId!, id)}
                      />
                    )) : (
                      <div className="text-center py-20 bg-white rounded-3xl border border-brand-border border-dashed">
                        <p className="text-brand-text/30 italic text-sm font-serif">{t.admin.no_lessons}</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}

        {/* Modal-like Overlay for Forms */}
        <AnimatePresence>
          {isAdding && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-brand-text/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-brand-bg w-full max-w-xl rounded-[32px] p-8 shadow-2xl overflow-hidden relative"
              >
                <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 p-2 text-brand-text/30 hover:text-brand-text transition-colors">
                  <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-8 uppercase tracking-widest text-brand-accent">
                  {view === 'courses' 
                    ? t.admin.add_course 
                    : (editingLessonId ? t.admin.edit_lesson : t.admin.add_lesson)}
                </h2>

                <div className="space-y-6">
                  {view === 'courses' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/50 block">{t.admin.course_name}</label>
                        <input 
                          type="text" 
                          value={newCourse.title} 
                          onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                          placeholder="Example: Nail Polish technique..."
                          className="w-full bg-white border border-brand-border p-4 rounded-2xl outline-none focus:border-brand-accent transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/50 block">{t.admin.course_desc}</label>
                        <textarea 
                          value={newCourse.description} 
                          onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                          className="w-full bg-white border border-brand-border p-4 rounded-2xl outline-none focus:border-brand-accent transition-colors min-h-[100px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/50 block">{t.admin.category}</label>
                          <select 
                             value={newCourse.category} 
                             onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                             className="w-full bg-white border border-brand-border p-4 rounded-2xl outline-none"
                          >
                            <option>Gel Art</option>
                            <option>Art Design</option>
                            <option>Basic Care</option>
                            <option>Accents</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/50 block">{t.admin.level}</label>
                          <select 
                             value={newCourse.level} 
                             onChange={e => setNewCourse({...newCourse, level: e.target.value as any})}
                             className="w-full bg-white border border-brand-border p-4 rounded-2xl outline-none"
                          >
                            <option value="beginner">{t.home.beginner}</option>
                            <option value="intermediate">{t.home.intermediate}</option>
                            <option value="advanced">{t.home.advanced}</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/50 block">{t.admin.thumbnail}</label>
                        <input 
                          type="text" 
                          value={newCourse.thumbnail} 
                          onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})}
                          className="w-full bg-white border border-brand-border p-4 rounded-2xl outline-none focus:border-brand-accent transition-colors font-mono text-xs"
                        />
                      </div>
                      <button 
                        onClick={handleAddCourse}
                        className="w-full bg-brand-accent text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-brand-accent/20"
                      >
                        {t.admin.save_course}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/50 block">{t.admin.lesson_title}</label>
                        <input 
                          type="text" 
                          value={newLesson.title} 
                          onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                          className="w-full bg-white border border-brand-border p-4 rounded-2xl outline-none focus:border-brand-accent transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/50 block">{t.admin.video_url}</label>
                        <input 
                          type="text" 
                          value={newLesson.videoUrl} 
                          onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})}
                          className="w-full bg-white border border-brand-border p-4 rounded-2xl outline-none focus:border-brand-accent transition-colors font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/50 block">{t.admin.notes}</label>
                        <textarea 
                          value={newLesson.content} 
                          onChange={e => setNewLesson({...newLesson, content: e.target.value})}
                          className="w-full bg-white border border-brand-border p-4 rounded-2xl outline-none focus:border-brand-accent transition-colors min-h-[100px]"
                        />
                      </div>
                      <button 
                        onClick={handleAddLesson}
                        className="w-full bg-brand-accent text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-brand-accent/20"
                      >
                        {t.admin.save_lesson}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
