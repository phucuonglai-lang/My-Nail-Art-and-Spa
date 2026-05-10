import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, writeBatch, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Course, Lesson, Procedure, ProcedureStep, Policy } from '../types';
import { Plus, Trash2, Edit2, Video, Image as ImageIcon, Layout, ArrowLeft, Save, X, GripVertical, ClipboardList, Settings, Sparkles, RefreshCw, FileText, File, Code, Globe, ShieldCheck } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../lib/utils';
import { serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Language, translations } from '../translations';

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
  const { t } = useLanguage();
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
        "bg-brand-card p-5 rounded-[24px] border border-brand-border flex items-center gap-5 transition-all relative group",
        isDragging ? "shadow-[0_32px_64px_rgba(0,0,0,0.8)] ring-2 ring-brand-accent/50 z-50 opacity-90 scale-[1.02]" : "hover:border-brand-accent/30 hover:shadow-xl"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-white/10 hover:text-brand-accent transition-colors shrink-0 bg-white/5 rounded-xl"
      >
        <GripVertical size={20} />
      </div>
      
      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-black text-white/20 shrink-0 select-none group-hover:text-brand-accent transition-colors">
        {(index + 1).toString().padStart(2, '0')}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-base text-white truncate uppercase tracking-tight">{lesson.title}</h4>
        <div className="flex items-center gap-2 mt-1.5">
          {lesson.videoUrl ? (
            <div className="flex items-center gap-2 bg-rose-500/10 px-2 py-0.5 rounded-md">
              <Video size={10} className="text-rose-500" />
              <p className="text-[9px] text-rose-500/80 truncate max-w-[200px] font-bold uppercase tracking-widest">{lesson.videoUrl}</p>
            </div>
          ) : (
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/10">No Video Attached</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(lesson); }}
          className="p-3 bg-white/5 text-brand-blue hover:bg-brand-blue hover:text-white rounded-xl transition-all"
          title={t.admin.edit_lesson}
        >
          <Edit2 size={18} />
        </button>
        <button 
          onClick={(e) => { 
            e.preventDefault();
            e.stopPropagation(); 
            onDelete(lesson.id); 
          }}
          className="p-3 bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
          title={t.admin.delete_confirm_lesson}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t, language } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [steps, setSteps] = useState<ProcedureStep[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'courses' | 'lessons' | 'procedures' | 'steps' | 'policies'>('courses');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    title: '', description: '', thumbnail: '', category: 'Gel Art', level: 'beginner'
  });
  const [newLesson, setNewLesson] = useState<Partial<Lesson>>({
    title: '', videoUrl: '', content: '', order: 1
  });
  const [newProcedure, setNewProcedure] = useState<Partial<Procedure>>({
    id: '', icon: 'ClipboardList', color: 'text-brand-accent', difficulty: 'Normal'
  });
  const [newStep, setNewStep] = useState<Partial<ProcedureStep>>({
    title: '', desc: '', videoUrl: '', order: 1
  });
  const [newPolicy, setNewPolicy] = useState<Partial<Policy>>({
    title: '', type: 'pdf', url: '', content: ''
  });
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (Firestore limit is 1MB total, so let's cap file at 800KB for safety)
    if (file.size > 800 * 1024) {
      alert("Tệp quá lớn. Vui lòng chọn tệp dưới 800KB để đảm bảo hiệu suất.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNewPolicy({ ...newPolicy, url: base64 });
      setUploading(false);
    };
    reader.onerror = () => {
      alert("Lỗi khi đọc tệp.");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCourseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert("Hình ảnh quá lớn. Vui lòng chọn ảnh dưới 800KB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setNewCourse({ ...newCourse, thumbnail: base64 });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

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
      // Fetch Courses
      try {
        const coursesSnap = await getDocs(collection(db, 'courses'));
        const coursesData = coursesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course));
        setCourses(coursesData);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'courses');
      }

      // Fetch Procedures
      try {
        const proceduresSnap = await getDocs(collection(db, 'procedures'));
        const proceduresData = proceduresSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Procedure));
        setProcedures(proceduresData);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'procedures');
      }

      // Fetch Policies
      try {
        const policiesSnap = await getDocs(query(collection(db, 'policies'), orderBy('createdAt', 'desc')));
        const policiesData = policiesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Policy));
        setPolicies(policiesData);
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'policies');
      }
    } catch (error) {
      console.error("Fetch Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async (courseId: string) => {
    if (!courseId) return;
    const q = query(collection(db, 'courses', courseId, 'lessons'), orderBy('order'));
    const lessonsSnap = await getDocs(q);
    const lessonsData = lessonsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lesson));
    setLessons(lessonsData);
  };

  const fetchSteps = async (procedureId: string) => {
    if (!procedureId) return;
    const q = query(collection(db, 'procedures', procedureId, 'steps'), orderBy('order'));
    const stepsSnap = await getDocs(q);
    const stepsData = stepsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as ProcedureStep));
    setSteps(stepsData);
  };

  const handleAddProcedure = async () => {
    if (!newProcedure.id) return;
    try {
      const docId = newProcedure.id.toLowerCase().replace(/\s+/g, '-');
      const procedureData = {
        ...newProcedure,
        id: docId,
        translations: {
          [language]: {
            nav: newProcedure.id,
            title: newProcedure.id.toUpperCase(),
            subtitle: 'Procedure Details',
            steps: {}
          }
        }
      };

      if (editingProcedureId) {
        await updateDoc(doc(db, 'procedures', editingProcedureId), newProcedure);
      } else {
        await setDoc(doc(db, 'procedures', docId), procedureData);
      }
      setIsAdding(false);
      setEditingProcedureId(null);
      setNewProcedure({ id: '', icon: 'ClipboardList', color: 'text-brand-accent', difficulty: 'Normal' });
      fetchData();
    } catch (error) {
      alert("Error saving procedure: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleAddStep = async () => {
    if (!selectedProcedureId || !newStep.title) return;
    
    const processedStep = {
      ...newStep,
      videoUrl: convertToEmbedUrl(newStep.videoUrl || '')
    };

    try {
      if (editingStepId) {
        await updateDoc(doc(db, 'procedures', selectedProcedureId, 'steps', editingStepId), processedStep);
      } else {
        await addDoc(collection(db, 'procedures', selectedProcedureId, 'steps'), {
          ...processedStep,
          order: steps.length + 1
        });
      }
      setIsAdding(false);
      setEditingStepId(null);
      setNewStep({ title: '', desc: '', videoUrl: '', order: steps.length + 1 });
      fetchSteps(selectedProcedureId);
    } catch (error) {
      alert("Error saving step");
    }
  };

  const handleImportStaticProcedures = async () => {
    if (!window.confirm("Import static procedure data from translations to Firestore?")) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      // Map IDs to original translation keys
      const staticProcs = [
        { id: 'manicure', langKey: 'manicure', icon: 'Scissors', color: 'text-rose-500' },
        { id: 'pedicure', langKey: 'pedicure', icon: 'Brush', color: 'text-emerald-500' },
        { id: 'gel-x', langKey: 'gelX', icon: 'Sparkles', color: 'text-purple-500' },
        { id: 'acrylic', langKey: 'acrylic', icon: 'Zap', color: 'text-amber-500' },
        { id: 'refill', langKey: 'acrylicRefill', icon: 'RefreshCw', color: 'text-blue-500' },
      ];

      for (const proc of staticProcs) {
        const procRef = doc(db, 'procedures', proc.id);
        
        // Build translations for all supported languages
        const procTranslations: any = {};
        const availableLangs: Language[] = ['vi', 'en', 'es'];
        
        availableLangs.forEach(lang => {
          const langData = (translations as any)[lang]?.[proc.langKey];
          if (langData) {
            procTranslations[lang] = {
              nav: langData.nav || proc.id,
              title: langData.title || proc.id.toUpperCase(),
              subtitle: langData.subtitle || 'Procedure Details',
              phases: langData.phases || {},
              steps: langData.steps || {}
            };
          }
        });

        batch.set(procRef, {
          id: proc.id,
          icon: proc.icon,
          color: proc.color,
          difficulty: 'Normal',
          translations: procTranslations
        }, { merge: true });

        // Add steps as sub-collection
        const stepsData = (translations as any).vi[proc.langKey]?.steps;
        if (stepsData) {
          Object.keys(stepsData).forEach((key, index) => {
            const stepRef = doc(db, 'procedures', proc.id, 'steps', key);
            batch.set(stepRef, {
              ...stepsData[key],
              id: key,
              order: index + 1
            }, { merge: true });
          });
        }
      }

      await batch.commit();
      alert("Imported successfully!");
      fetchData();
    } catch (error) {
      console.error("Import Error:", error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(error, OperationType.WRITE, 'procedures/batch');
      }
      alert("Error importing data: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcedure = async (id: string) => {
    console.log("ATTEMPTING DELETE PROCEDURE:", id);
    const confirmMessage = t.admin.delete_confirm_procedure || "Xác nhận xóa quy trình này?";
    if (!window.confirm(confirmMessage)) return;
    try {
      await deleteDoc(doc(db, 'procedures', id));
      alert("Đã xóa quy trình thành công");
      fetchData();
    } catch (error) {
      console.error("Delete Procedure Error:", error);
      const isPermissionError = error instanceof Error && error.message.toLowerCase().includes('permission');
      if (isPermissionError) {
        alert("Lỗi: Không có quyền xóa. Vui lòng kiểm tra xem email của bạn đã được xác thực chưa.");
      } else {
        alert("Lỗi khi xóa quy trình: " + (error instanceof Error ? error.message : String(error)));
      }
      try {
        handleFirestoreError(error, OperationType.DELETE, `procedures/${id}`);
      } catch (e) {
        // Error already logged by handleFirestoreError
      }
    }
  };

  const handleDeleteStep = async (procId: string, stepId: string) => {
    console.log("handleDeleteStep triggered:", { procId, stepId });
    const confirmMessage = t.admin.delete_confirm_step || "Xác nhận xóa bước này?";
    if (!window.confirm(confirmMessage)) return;
    try {
      await deleteDoc(doc(db, 'procedures', procId, 'steps', stepId));
      fetchSteps(procId);
    } catch (error) {
      console.error("Delete Step Error:", error);
      const isPermissionError = error instanceof Error && error.message.toLowerCase().includes('permission');
      if (isPermissionError) {
        alert("Lỗi: Không có quyền xóa. Vui lòng kiểm tra email xác thực.");
      } else {
        alert("Lỗi khi xóa bước: " + (error instanceof Error ? error.message : String(error)));
      }
      try {
        handleFirestoreError(error, OperationType.DELETE, `procedures/${procId}/steps/${stepId}`);
      } catch (e) {}
    }
  };

  const handleAddPolicy = async () => {
    if (!newPolicy.title) {
      alert("Vui lòng nhập tên tài liệu");
      return;
    }
    setLoading(true);
    try {
      // Clean up the data before saving
      const cleanData: any = {
        title: newPolicy.title,
        type: newPolicy.type || 'pdf',
        updatedAt: serverTimestamp()
      };

      if (newPolicy.type === 'html') {
        cleanData.content = newPolicy.content || '';
        cleanData.url = ''; // Reset url for HTML type
      } else {
        cleanData.url = newPolicy.url || '';
        cleanData.content = ''; // Reset content for non-HTML
      }

      if (editingPolicyId) {
        await updateDoc(doc(db, 'policies', editingPolicyId), cleanData);
      } else {
        await addDoc(collection(db, 'policies'), {
          ...cleanData,
          createdAt: serverTimestamp()
        });
      }
      setIsAdding(false);
      setEditingPolicyId(null);
      setNewPolicy({ title: '', type: 'pdf', url: '', content: '' });
      setUploading(false);
      fetchData();
    } catch (error) {
      console.error("Save Policy Error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert("Lỗi khi lưu tài liệu: " + errorMessage);
      
      // Specifically handle permission denied errors which are common
      if (errorMessage.toLowerCase().includes('permission-denied') || errorMessage.toLowerCase().includes('permissions')) {
        alert("Lỗi: Bạn không có quyền thực hiện thao tác này. Vui lòng kiểm tra email đã được xác thực chưa hoặc liên hệ quản trị viên.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    console.log("handleDeletePolicy triggered:", id);
    if (!window.confirm("Xác nhận xóa tài liệu/chính sách này?")) return;
    try {
      await deleteDoc(doc(db, 'policies', id));
      fetchData();
    } catch (error) {
       console.error("Delete Policy Error:", error);
       const isPermissionError = error instanceof Error && error.message.toLowerCase().includes('permission');
       if (isPermissionError) {
         alert("Lỗi: Không có quyền xóa. Vui lòng xác thực email.");
       } else {
         alert("Lỗi khi xóa tài liệu: " + (error instanceof Error ? error.message : String(error)));
       }
       try {
         handleFirestoreError(error, OperationType.DELETE, `policies/${id}`);
       } catch (e) {}
    }
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

  const handleCancel = () => {
    setIsAdding(false);
    setEditingCourseId(null);
    setEditingLessonId(null);
    setEditingProcedureId(null);
    setEditingStepId(null);
    setEditingPolicyId(null);
    setNewCourse({ title: '', description: '', thumbnail: '', category: 'Gel Art', level: 'beginner' });
    setNewLesson({ title: '', videoUrl: '', content: '', order: 0 });
    setNewProcedure({ id: '', icon: 'ClipboardList', color: 'text-brand-accent' });
    setNewStep({ title: '', desc: '', videoUrl: '', order: 0 });
    setNewPolicy({ title: '', type: 'pdf', url: '', content: '' });
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
    if (!newCourse.title) {
      alert("Vui lòng nhập tên khóa học");
      return;
    }
    if (!newCourse.description) {
      alert("Vui lòng nhập mô tả khóa học");
      return;
    }
    
    setLoading(true);
    try {
      if (editingCourseId) {
        await updateDoc(doc(db, 'courses', editingCourseId), newCourse);
      } else {
        await addDoc(collection(db, 'courses'), newCourse);
      }
      setIsAdding(false);
      setEditingCourseId(null);
      setNewCourse({ title: '', description: '', thumbnail: '', category: 'Gel Art', level: 'beginner' });
      fetchData();
    } catch (error) {
      console.error("Save Course Error:", error);
      alert("Lỗi khi lưu khóa học: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const convertToEmbedUrl = (url: string) => {
    if (!url) return '';
    // If it's already an embed link, return as is
    if (url.includes('youtube.com/embed/')) return url;
    
    let videoId = '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      videoId = match[2];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  const handleAddLesson = async () => {
    if (!selectedCourseId) return;
    if (!newLesson.title) {
      alert("Vui lòng nhập tiêu đề bài học");
      return;
    }
    
    setLoading(true);
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
      console.error("Save Lesson Error:", error);
      alert("Lỗi khi lưu bài học");
    } finally {
      setLoading(false);
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

  const handleEditCourse = (course: Course) => {
    setNewCourse({
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
      category: course.category,
      level: course.level
    });
    setEditingCourseId(course.id);
    setIsAdding(true);
  };

  const handleEditProcedure = (proc: Procedure) => {
    setNewProcedure({
      id: proc.id,
      icon: proc.icon,
      color: proc.color,
      difficulty: proc.difficulty
    });
    setEditingProcedureId(proc.id);
    setIsAdding(true);
  };

  const handleDeleteCourse = async (id: string) => {
    console.log("handleDeleteCourse triggered:", id);
    const confirmMessage = t.admin.delete_confirm_course || "Xác nhận xóa khóa học này?";
    if (!window.confirm(confirmMessage)) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
      fetchData();
    } catch (error) {
      console.error("Delete Course Error:", error);
      const isPermissionError = error instanceof Error && error.message.toLowerCase().includes('permission');
      if (isPermissionError) {
        alert("Lỗi: Không có quyền xóa. Vui lòng xác thực email.");
      } else {
        alert("Lỗi khi xóa khóa học: " + (error instanceof Error ? error.message : String(error)));
      }
      try {
        handleFirestoreError(error, OperationType.DELETE, `courses/${id}`);
      } catch (e) {}
    }
  };

  const handleDeleteLesson = async (courseId: string, lessonId: string) => {
    console.log("handleDeleteLesson triggered:", { courseId, lessonId });
    
    if (!courseId || !lessonId) {
      console.error("Missing courseId or lessonId:", { courseId, lessonId });
      alert("System error: Missing IDs for deletion");
      return;
    }
    
    const confirmMessage = t.admin.delete_confirm_lesson || "Xác nhận xóa bài học?";
    if (!window.confirm(confirmMessage)) return;
    
    try {
      console.log("Attempting to delete lesson document...");
      const lessonRef = doc(db, 'courses', courseId, 'lessons', lessonId);
      await deleteDoc(lessonRef);
      console.log("Lesson deleted successfully from Firestore");
      
      await fetchLessons(courseId);
      console.log("Lessons refreshed for course:", courseId);
    } catch (error) {
      console.error("Delete Lesson Error:", error);
      alert("Error deleting lesson: " + (error instanceof Error ? error.message : String(error)));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-12 h-12 border-4 border-brand-accent/10 border-t-brand-accent rounded-full animate-spin shadow-[0_0_20px_rgba(255,45,85,0.2)]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg font-sans pt-24 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-16 relative">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-accent/5 blur-[120px] rounded-full -z-10" />
          
          {auth.currentUser && !auth.currentUser.emailVerified && (
            <div className="absolute top-0 left-0 right-0 -translate-y-16 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-4 animate-pulse">
              <ShieldCheck className="text-rose-500 shrink-0" size={20} />
              <p className="text-[10px] text-rose-500 font-black uppercase tracking-[2px]">
                Email chưa được xác thực. Bạn có thể không thực hiện được các thao tác quản trị.
              </p>
            </div>
          )}
          <div>
            <Link to="/" className="text-[10px] font-black uppercase tracking-[5px] text-brand-accent flex items-center gap-3 mb-6 hover:opacity-70 transition-all group w-fit">
              <div className="w-8 h-8 rounded-full border border-brand-accent/20 flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all">
                <ArrowLeft size={14} />
              </div>
              {t.nav.back}
            </Link>
            <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">
              {t.admin.title}
            </h1>
            <p className="text-white/20 mt-4 text-[10px] font-bold uppercase tracking-[0.4em]">System Control Panel — Authority Access Only</p>
          </div>
          
          <div className="flex bg-white/5 p-1.5 rounded-[28px] border border-white/5 backdrop-blur-xl overflow-x-auto scrollbar-hide">
            {[
              { id: 'courses', label: t.admin.courses },
              { id: 'procedures', label: t.admin.procedures_tab },
              { id: 'policies', label: 'QUY ĐỊNH' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => { setView(tab.id as any); setSelectedCourseId(null); setSelectedProcedureId(null); }}
                className={cn(
                  "px-8 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[2px] transition-all shrink-0 active:scale-95",
                  view === tab.id || (tab.id === 'procedures' && view === 'steps') 
                    ? "bg-gradient-to-r from-brand-accent to-brand-purple text-white shadow-xl shadow-brand-accent/20" 
                    : "text-white/30 hover:text-white hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            ))}
            
            {selectedCourseId && (
              <button 
                onClick={() => setView('lessons')}
                className={cn(
                  "px-8 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[2px] transition-all shrink-0 active:scale-95 border-l border-white/5 ml-1.5 pl-10",
                  view === 'lessons' ? "text-brand-blue" : "text-white/20"
                )}
              >
                {t.admin.lessons}
              </button>
            )}
            
            {selectedProcedureId && (
              <button 
                onClick={() => setView('steps')}
                className={cn(
                  "px-8 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-[2px] transition-all shrink-0 active:scale-95 border-l border-white/5 ml-1.5 pl-10",
                  view === 'steps' ? "text-brand-purple" : "text-white/20"
                )}
              >
                {t.admin.manage_steps}
              </button>
            )}
          </div>
        </header>

        {view === 'courses' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold uppercase tracking-widest text-white/50">{t.admin.courses}</h2>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-3 bg-gradient-to-r from-brand-accent to-brand-purple text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-2xl shadow-brand-accent/20 hover:scale-105 transition-all active:scale-95"
              >
                <Plus size={18} /> {t.admin.add_course}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map(course => (
                <div key={course.id} className="bg-brand-card rounded-[40px] border border-brand-border overflow-hidden shadow-2xl hover:shadow-[0_32px_80px_rgba(0,0,0,0.6)] transition-all group border-white/5">
                  <div className="aspect-[16/10] bg-white/5 relative overflow-hidden">
                    <img src={course.thumbnail || undefined} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm flex items-center justify-center gap-4">
                        <button 
                          onClick={() => { setSelectedCourseId(course.id); setView('lessons'); fetchLessons(course.id); }}
                          className="w-14 h-14 bg-white text-brand-accent rounded-2xl hover:scale-110 transition-transform shadow-2xl flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 duration-500" title={t.admin.lessons}
                        >
                          <Video size={24} />
                        </button>
                        <button 
                          onClick={() => handleEditCourse(course)}
                          className="w-14 h-14 bg-white text-brand-blue rounded-2xl hover:scale-110 transition-transform shadow-2xl flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 duration-500 delay-[50ms]" title={t.admin.edit_course}
                        >
                          <Edit2 size={24} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="w-14 h-14 bg-white text-rose-500 rounded-2xl hover:scale-110 transition-transform shadow-2xl flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 duration-500 delay-100" title={t.admin.delete_confirm_course}
                        >
                          <Trash2 size={24} />
                        </button>
                      </div>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-[3px] text-brand-blue py-1 px-3 bg-brand-blue/10 rounded-full">{course.category}</span>
                      <span className="text-[10px] font-black uppercase tracking-[3px] text-white/30">{course.level}</span>
                    </div>
                    <h3 className="font-bold text-xl text-white tracking-tight leading-tight group-hover:text-brand-accent transition-colors">{course.title}</h3>
                  </div>
                </div>
              ))}

              {/* Quick Add Course Card */}
              <button 
                onClick={() => setIsAdding(true)}
                className="aspect-[16/10] bg-white/5 rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group hover:bg-white/10 hover:border-brand-accent/50 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-brand-accent group-hover:text-white transition-all shadow-xl">
                  <Plus size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[4px] text-white/20 group-hover:text-white transition-all">{t.admin.add_course}</span>
              </button>
            </div>
          </div>
        )}

        {view === 'lessons' && (
          <div>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-6">
                 <button onClick={() => setView('courses')} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft size={20} />
                 </button>
                 <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-white leading-none mb-2">{t.admin.lessons}</h2>
                    <p className="text-[10px] text-white/20 uppercase tracking-[4px] font-bold font-mono">{courses.find(c => c.id === selectedCourseId)?.title}</p>
                 </div>
              </div>
              <button 
                onClick={() => { setIsAdding(true); setEditingLessonId(null); setNewLesson({ title: '', videoUrl: '', content: '', order: lessons.length + 1 }); }}
                className="flex items-center gap-3 bg-gradient-to-r from-brand-accent to-brand-purple text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-2xl shadow-brand-accent/20 hover:scale-105 transition-all active:scale-95"
              >
                <Plus size={18} /> {t.admin.add_lesson}
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-brand-blue/10 p-4 rounded-2xl border border-brand-blue/20 flex items-center gap-3">
                <Sparkles size={16} className="text-brand-blue" />
                <p className="text-[10px] text-brand-blue font-bold uppercase tracking-[3px]">
                  {t.admin.reorder_tip}
                </p>
              </div>
              
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
                      <div className="text-center py-32 bg-white/5 rounded-[48px] border border-brand-border border-dashed">
                        <p className="text-white/20 italic text-sm font-bold uppercase tracking-widest">{t.admin.no_lessons}</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}

        {view === 'procedures' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold uppercase tracking-widest text-white/50">{t.admin.procedures_tab}</h2>
              <div className="flex gap-4">
                <button 
                  onClick={handleImportStaticProcedures}
                  className="flex items-center gap-3 bg-white/5 text-white/40 border border-white/10 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[2px] hover:bg-white/10 transition-all active:scale-95"
                >
                  <RefreshCw size={16} /> Import Static
                </button>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-3 bg-gradient-to-r from-brand-accent to-brand-purple text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-2xl shadow-brand-accent/20 hover:scale-105 transition-all active:scale-95"
                >
                  <Plus size={18} /> {t.admin.add_procedure}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {procedures.length > 0 ? procedures.map(proc => (
                <div key={proc.id} className="bg-brand-card p-8 rounded-[40px] border border-brand-border hover:border-brand-purple/50 shadow-2xl transition-all group relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className={cn("w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center shadow-inner", proc.color)}>
                      <ClipboardList size={32} />
                    </div>
                    <div className="flex items-center gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedProcedureId(proc.id); 
                           setView('steps'); 
                           fetchSteps(proc.id); 
                         }}
                         className="w-12 h-12 bg-white/5 text-brand-purple hover:bg-brand-purple hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-lg"
                         title="Manage Steps"
                       >
                         <Settings size={20} />
                       </button>
                       <button 
                         onClick={() => handleEditProcedure(proc)}
                         className="w-12 h-12 bg-white/5 text-brand-blue hover:bg-brand-blue hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-lg"
                         title="Edit Procedure"
                       >
                         <Edit2 size={20} />
                       </button>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           handleDeleteProcedure(proc.id);
                         }}
                         className="w-12 h-12 bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-lg"
                         title="Xóa"
                       >
                         <Trash2 size={20} />
                       </button>
                    </div>
                  </div>
                  <h3 className="font-black text-2xl text-white uppercase tracking-tight mb-2 relative z-10">{proc.id}</h3>
                  <p className="text-[10px] text-white/20 font-black uppercase tracking-[5px] relative z-10">
                    {Object.keys(proc.translations || {}).length} LOCALIZATIONS
                  </p>
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-brand-purple/5 blur-[40px] rounded-full group-hover:bg-brand-purple/10 transition-colors" />
                </div>
              )) : null}

              {/* Quick Add Procedure Card */}
              <button 
                onClick={() => setIsAdding(true)}
                className="p-8 bg-white/5 rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group hover:bg-white/10 hover:border-brand-purple/50 transition-all cursor-pointer min-h-[200px]"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-brand-purple group-hover:text-white transition-all shadow-xl">
                  <Plus size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[4px] text-white/20 group-hover:text-white transition-all">{t.admin.add_procedure}</span>
              </button>

              {procedures.length === 0 && (
                <div className="col-span-full py-40 text-center bg-white/5 rounded-[60px] border-2 border-dashed border-brand-border mt-8">
                  <p className="text-white/10 italic mb-8 uppercase tracking-[0.3em] font-black">{t.admin.no_procedures || "No procedures found"}</p>
                  <button 
                    onClick={handleImportStaticProcedures}
                    className="inline-flex items-center gap-4 bg-white/5 text-white border border-white/10 px-10 py-5 rounded-3xl font-black uppercase tracking-[4px] text-[10px] hover:bg-white/10 transition-all active:scale-95"
                  >
                    <RefreshCw size={18} /> Import from static data
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'steps' && (
          <div>
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-6 text-white">
                 <button onClick={() => setView('procedures')} className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl text-white flex items-center justify-center hover:bg-white/10 transition-all">
                    <ArrowLeft size={20} />
                 </button>
                 <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight leading-none mb-2">{t.admin.manage_steps}</h2>
                    <p className="text-[10px] text-white/20 uppercase tracking-[4px] font-bold font-mono">{selectedProcedureId}</p>
                 </div>
              </div>
              <button 
                onClick={() => { setIsAdding(true); setEditingStepId(null); }}
                className="flex items-center gap-3 bg-gradient-to-r from-brand-accent to-brand-purple text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-2xl shadow-brand-accent/20 hover:scale-105 transition-all active:scale-95"
              >
                <Plus size={18} /> {t.admin.add_step}
              </button>
            </div>

            <div className="grid gap-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="bg-brand-card p-6 rounded-[32px] border border-brand-border flex items-center gap-8 group hover:border-brand-purple/30 transition-all shadow-xl">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-xl text-white/20 shrink-0 group-hover:text-brand-purple transition-colors">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-lg text-white uppercase tracking-tight">{step.title}</h4>
                    <p className="text-[11px] text-white/40 mt-1.5 line-clamp-2 leading-relaxed">{step.desc}</p>
                    {step.videoUrl && (
                      <div className="flex items-center gap-2 mt-3 text-rose-500 bg-rose-500/5 px-2 py-1 rounded-lg w-fit">
                        <Video size={10} />
                        <span className="text-[9px] font-black uppercase tracking-widest truncate max-w-sm">{step.videoUrl}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => {
                        setEditingStepId(step.id);
                        setNewStep({ title: step.title, desc: step.desc, videoUrl: step.videoUrl, order: step.order });
                        setIsAdding(true);
                      }}
                      className="w-12 h-12 bg-white/5 text-brand-blue hover:bg-brand-blue hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-lg"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteStep(selectedProcedureId!, step.id)}
                      className="w-12 h-12 bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'policies' && (
          <div>
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-xl font-bold uppercase tracking-widest text-white/50">QUY ĐỊNH & CHÍNH SÁCH</h2>
              <button 
                onClick={() => { setIsAdding(true); setEditingPolicyId(null); setNewPolicy({ title: '', type: 'pdf', url: '', content: '' }); }}
                className="flex items-center gap-3 bg-gradient-to-r from-brand-accent to-brand-purple text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[3px] shadow-2xl shadow-brand-accent/20 hover:scale-105 transition-all active:scale-95"
              >
                <Plus size={18} /> THÊM TÀI LIỆU
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {policies.length > 0 ? policies.map(policy => (
                <div key={policy.id} className="bg-brand-card p-8 rounded-[40px] border border-brand-border hover:border-brand-blue/50 shadow-2xl transition-all group relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className={cn(
                      "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl",
                      policy.type === 'pdf' ? "bg-rose-500/10 text-rose-500" : 
                      policy.type === 'doc' ? "bg-brand-blue/10 text-brand-blue" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {policy.type === 'pdf' && <FileText size={28} />}
                      {policy.type === 'doc' && <File size={28} />}
                      {policy.type === 'html' && <Code size={28} />}
                    </div>
                    <div className="flex items-center gap-2 opacity-100 xl:opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 duration-300">
                       <button 
                         onClick={() => {
                           setEditingPolicyId(policy.id);
                           setNewPolicy({ title: policy.title, type: policy.type, url: policy.url, content: policy.content });
                           setIsAdding(true);
                         }}
                         className="w-12 h-12 bg-white/5 text-brand-blue hover:bg-brand-blue hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-lg"
                         title="Sửa"
                       >
                         <Edit2 size={18} />
                       </button>
                       <button 
                         onClick={() => handleDeletePolicy(policy.id)}
                         className="w-12 h-12 bg-white/5 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all flex items-center justify-center shadow-lg"
                         title="Xóa"
                       >
                         <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-white uppercase tracking-tight mb-4 relative z-10">{policy.title}</h3>
                  <div className="flex items-center gap-4 relative z-10 mt-auto">
                    <span className="text-[10px] font-black uppercase tracking-[3px] px-3 py-1 bg-white/5 rounded-full text-white/40">
                      {policy.type} File
                    </span>
                    {policy.url && (
                      <a href={policy.url} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-[3px] text-brand-blue hover:text-white transition-colors flex items-center gap-2">
                        <Globe size={12} /> External Access
                      </a>
                    )}
                  </div>
                </div>
              )) : null}

              {/* Quick Add Policy Card */}
              <button 
                onClick={() => { setIsAdding(true); setEditingPolicyId(null); setNewPolicy({ title: '', type: 'pdf', url: '', content: '' }); }}
                className="aspect-[16/10] bg-white/5 rounded-[40px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-4 group hover:bg-white/10 hover:border-brand-blue/50 transition-all cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-brand-blue group-hover:text-white transition-all shadow-xl">
                  <Plus size={32} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[4px] text-white/20 group-hover:text-white transition-all">THÊM TÀI LIỆU</span>
              </button>

              {policies.length === 0 && (
                <div className="col-span-full py-40 text-center bg-white/5 rounded-[60px] border-2 border-dashed border-brand-border mt-8">
                  <p className="text-white/10 italic uppercase tracking-[0.3em] font-black">Chưa có quy định nào được thiết lập.</p>
                </div>
              )}
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
              className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 40 }}
                className="bg-brand-card w-full max-w-2xl rounded-[48px] p-12 shadow-[0_32px_120px_rgba(0,0,0,1)] overflow-hidden relative border border-white/5 flex flex-col max-h-[90vh]"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-accent via-brand-purple to-brand-blue" />
                
                <button onClick={handleCancel} className="absolute top-10 right-10 p-4 text-white/20 hover:text-white hover:bg-white/10 rounded-full transition-all">
                  <X size={28} />
                </button>

                <div className="mb-10">
                  <span className="text-[10px] font-black uppercase tracking-[5px] text-brand-accent mb-3 block">Administrator Panel</span>
                  <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
                    {view === 'courses' && (editingCourseId ? t.admin.edit_course : t.admin.add_course)}
                    {view === 'lessons' && (editingLessonId ? t.admin.edit_lesson : t.admin.add_lesson)}
                    {view === 'procedures' && (editingProcedureId ? 'Sửa quy trình' : t.admin.add_procedure)}
                    {view === 'steps' && (editingStepId ? t.admin.edit_step : t.admin.add_step)}
                    {view === 'policies' && (editingPolicyId ? 'Sửa tài liệu' : 'Thêm tài liệu')}
                  </h2>
                </div>

                <div className="space-y-8 overflow-y-auto flex-1 pr-2 scrollbar-hide">
                  {view === 'courses' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.course_name}</label>
                        <input 
                          type="text" 
                          value={newCourse.title} 
                          onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                          placeholder="e.g., Advanced Acrylic Sculpting"
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-bold transition-all placeholder:text-white/10"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.course_desc}</label>
                        <textarea 
                          value={newCourse.description} 
                          onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                          placeholder="Provide a detailed overview..."
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-bold transition-all placeholder:text-white/10 min-h-[140px] resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.category}</label>
                          <select 
                             value={newCourse.category} 
                             onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                             className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none text-white font-bold appearance-none cursor-pointer"
                          >
                            <option className="bg-brand-card">Gel Art</option>
                            <option className="bg-brand-card">Art Design</option>
                            <option className="bg-brand-card">Basic Care</option>
                            <option className="bg-brand-card">Accents</option>
                          </select>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.level}</label>
                          <select 
                             value={newCourse.level} 
                             onChange={e => setNewCourse({...newCourse, level: e.target.value as any})}
                             className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none text-white font-bold appearance-none cursor-pointer"
                          >
                            <option className="bg-brand-card" value="beginner">{t.home.beginner}</option>
                            <option className="bg-brand-card" value="intermediate">{t.home.intermediate}</option>
                            <option className="bg-brand-card" value="advanced">{t.home.advanced}</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.thumbnail}</label>
                        <div className="flex flex-col gap-4">
                          {newCourse.thumbnail ? (
                            <div className="relative aspect-video rounded-[32px] overflow-hidden border border-white/10 group">
                              <img src={newCourse.thumbnail} className="w-full h-full object-cover" alt="Preview" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                                <button 
                                  onClick={() => setNewCourse({...newCourse, thumbnail: ''})}
                                  className="p-4 bg-rose-500 text-white rounded-2xl hover:scale-110 transition-all shadow-xl"
                                >
                                  <Trash2 size={24} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleCourseFileChange}
                                className="hidden"
                                id="course-thumb-upload"
                              />
                              <label 
                                htmlFor="course-thumb-upload"
                                className={cn(
                                  "w-full flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-[32px] cursor-pointer transition-all active:scale-[0.98]",
                                  uploading ? "border-brand-accent bg-brand-accent/5 opacity-50" : "border-white/10 bg-white/5 text-white/10 hover:border-brand-accent/30 hover:text-brand-accent"
                                )}
                              >
                                {uploading ? (
                                  <RefreshCw className="animate-spin" size={32} />
                                ) : (
                                  <>
                                    <ImageIcon size={32} />
                                    <span className="text-[10px] font-black uppercase tracking-[3px]">Chọn ảnh bìa từ máy</span>
                                  </>
                                )}
                              </label>
                            </div>
                          )}
                          
                          <div className="relative flex items-center justify-center py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                            <span className="relative px-6 bg-brand-card text-[9px] font-black uppercase tracking-[4px] text-white/20">Hoặc dán URL ảnh</span>
                          </div>

                          <input 
                            type="text" 
                            value={newCourse.thumbnail} 
                            onChange={e => setNewCourse({...newCourse, thumbnail: e.target.value})}
                            placeholder="HTTPS Image URL"
                            className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-mono text-xs transition-all placeholder:text-white/10"
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4 mt-6 border-t border-white/5">
                        <button 
                          onClick={() => setIsAdding(false)}
                          className="flex-1 px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[3px] text-white/40 hover:bg-white/5 transition-all"
                        >
                          {t.admin.cancel}
                        </button>
                        <button 
                          onClick={handleAddCourse}
                          disabled={loading}
                          className="flex-[2] bg-gradient-to-r from-brand-accent to-brand-purple text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[4px] shadow-2xl shadow-brand-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {loading && <RefreshCw size={16} className="animate-spin" />}
                          {t.admin.save_course}
                        </button>
                      </div>
                    </>
                  )}

                  {view === 'lessons' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.lesson_title}</label>
                        <input 
                          type="text" 
                          value={newLesson.title} 
                          onChange={e => setNewLesson({...newLesson, title: e.target.value})}
                          placeholder="Step Name"
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-bold transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.video_url}</label>
                        <input 
                          type="text" 
                          value={newLesson.videoUrl} 
                          onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})}
                          placeholder="YouTube Link"
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-mono text-xs transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.notes}</label>
                        <textarea 
                          value={newLesson.content} 
                          onChange={e => setNewLesson({...newLesson, content: e.target.value})}
                          placeholder="Instructional details..."
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-bold transition-all min-h-[140px] resize-none"
                        />
                      </div>
                      <div className="flex gap-4 pt-4 mt-6 border-t border-white/5">
                        <button 
                          onClick={handleCancel}
                          className="flex-1 px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[3px] text-white/40 hover:bg-white/5 transition-all"
                        >
                          {t.admin.cancel}
                        </button>
                        <button 
                          onClick={handleAddLesson}
                          className="flex-[2] bg-gradient-to-r from-brand-accent to-brand-purple text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[4px] shadow-2xl shadow-brand-accent/20 active:scale-95 transition-all"
                        >
                          {t.admin.save_lesson}
                        </button>
                      </div>
                    </>
                  )}

                  {view === 'procedures' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.procedure_id}</label>
                        <input 
                          type="text" 
                          value={newProcedure.id} 
                          onChange={e => setNewProcedure({...newProcedure, id: e.target.value})}
                          placeholder="e.g., gel-nails"
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-black uppercase transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">Icon Reference</label>
                          <input 
                             type="text"
                             value={newProcedure.icon} 
                             onChange={e => setNewProcedure({...newProcedure, icon: e.target.value})}
                             placeholder="ClipboardList"
                             className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none text-white font-bold"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">Theme Color</label>
                          <input 
                             type="text"
                             value={newProcedure.color} 
                             onChange={e => setNewProcedure({...newProcedure, color: e.target.value})}
                             placeholder="text-brand-blue"
                             className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none text-white font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4 mt-6 border-t border-white/5">
                        <button 
                          onClick={handleCancel}
                          className="flex-1 px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[3px] text-white/40 hover:bg-white/5 transition-all"
                        >
                          {t.admin.cancel}
                        </button>
                        <button 
                          onClick={handleAddProcedure}
                          className="flex-[2] bg-gradient-to-r from-brand-accent to-brand-purple text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[4px] shadow-2xl shadow-brand-accent/20 active:scale-95 transition-all"
                        >
                          {t.admin.add_procedure}
                        </button>
                      </div>
                    </>
                  )}

                  {view === 'steps' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.step_title}</label>
                        <input 
                          type="text" 
                          value={newStep.title} 
                          onChange={e => setNewStep({...newStep, title: e.target.value})}
                          placeholder="Phase Name"
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-bold transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.step_desc}</label>
                        <textarea 
                          value={newStep.desc} 
                          onChange={e => setNewStep({...newStep, desc: e.target.value})}
                          placeholder="Execution details..."
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-bold transition-all min-h-[120px] resize-none"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">{t.admin.video_url}</label>
                        <input 
                          type="text" 
                          value={newStep.videoUrl} 
                          onChange={e => setNewStep({...newStep, videoUrl: e.target.value})}
                          placeholder="YouTube URL"
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-mono text-xs transition-all"
                        />
                      </div>
                      <div className="flex gap-4 pt-4 mt-6 border-t border-white/5">
                        <button 
                          onClick={handleCancel}
                          className="flex-1 px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[3px] text-white/40 hover:bg-white/5 transition-all"
                        >
                          {t.admin.cancel}
                        </button>
                        <button 
                          onClick={handleAddStep}
                          className="flex-[2] bg-gradient-to-r from-brand-accent to-brand-purple text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[4px] shadow-2xl shadow-brand-accent/20 active:scale-95 transition-all"
                        >
                          {editingStepId ? t.admin.edit_step : t.admin.add_step}
                        </button>
                      </div>
                    </>
                  )}

                  {view === 'policies' && (
                    <>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">Tên tài liệu / Chính sách</label>
                        <input 
                          type="text" 
                          value={newPolicy.title} 
                          onChange={e => setNewPolicy({...newPolicy, title: e.target.value})}
                          placeholder="Quy định nghỉ phép..."
                          className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-bold transition-all"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">Loại tài liệu</label>
                        <div className="grid grid-cols-3 gap-4">
                          {(['pdf', 'doc', 'html'] as const).map(ti => (
                            <button
                              key={ti}
                              type="button"
                              onClick={() => setNewPolicy({...newPolicy, type: ti})}
                              className={cn(
                                "py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[3px] border transition-all active:scale-95",
                                newPolicy.type === ti ? "bg-gradient-to-r from-brand-accent to-brand-purple text-white border-transparent" : "bg-white/5 text-white/20 border-white/5 hover:text-white hover:bg-white/10"
                              )}
                            >
                              {ti}
                            </button>
                          ))}
                        </div>
                      </div>

                      {newPolicy.type === 'html' ? (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">Nội dung Chính sách (HTML)</label>
                          <textarea 
                            value={newPolicy.content} 
                            onChange={e => setNewPolicy({...newPolicy, content: e.target.value})}
                            className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white text-sm leading-relaxed transition-all min-h-[300px] font-mono resize-none"
                            placeholder="Nhập nội dung quy định chi tiết hoặc mã HTML..."
                          />
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">Upload Source File (.pdf / .doc)</label>
                            <div className="relative">
                              <input 
                                type="file" 
                                accept={newPolicy.type === 'pdf' ? '.pdf' : '.doc,.docx'}
                                onChange={handleFileChange}
                                className="hidden"
                                id="policy-file-upload"
                              />
                              <label 
                                htmlFor="policy-file-upload"
                                className={cn(
                                  "w-full flex flex-col items-center justify-center gap-4 p-12 border-2 border-dashed rounded-[32px] cursor-pointer transition-all active:scale-[0.98]",
                                  newPolicy.url ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "border-white/10 bg-white/5 text-white/10 hover:border-white/30 hover:text-white/30"
                                )}
                              >
                                {uploading ? (
                                  <RefreshCw className="animate-spin" size={32} />
                                ) : newPolicy.url ? (
                                  <>
                                    <ShieldCheck size={32} />
                                    <span className="text-[10px] font-black uppercase tracking-[3px]">Tệp đã được xử lý thành công</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus size={32} />
                                    <span className="text-[10px] font-black uppercase tracking-[3px]">Chọn tệp từ thiết bị</span>
                                  </>
                                )}
                              </label>
                            </div>
                          </div>

                          <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                            <span className="relative px-6 bg-brand-card text-[9px] font-black uppercase tracking-[4px] text-white/20">OR PROVIDE ACCESS LINK</span>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">Hệ thống lưu trữ ngoài (GDrive/Dropbox)</label>
                            <input 
                              type="text" 
                              value={newPolicy.url?.startsWith('data:') ? '' : newPolicy.url} 
                              onChange={e => setNewPolicy({...newPolicy, url: e.target.value})}
                              placeholder="https://drive.google.com/..."
                              className="w-full bg-white/5 border border-white/5 p-5 rounded-[22px] outline-none focus:border-brand-accent/50 text-white font-mono text-xs transition-all"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4 pt-4 mt-10 border-t border-white/5">
                         <button 
                           onClick={() => { setIsAdding(false); setEditingPolicyId(null); setNewPolicy({title: '', type: 'pdf', url: '', content: ''}); }}
                           className="flex-1 px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[3px] text-white/40 hover:bg-white/5 transition-all"
                         >
                           {t.admin.cancel}
                         </button>
                         <button 
                           onClick={handleAddPolicy}
                           disabled={loading}
                           className="flex-[2] bg-gradient-to-r from-brand-accent to-brand-purple text-white py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[4px] shadow-2xl shadow-brand-accent/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                         >
                           {loading ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                           {editingPolicyId ? 'Lưu thay đổi' : 'Thêm tài liệu'}
                         </button>
                      </div>
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
