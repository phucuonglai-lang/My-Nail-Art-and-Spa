/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Globe, LogOut, BookOpen, User, Play, ChevronRight, CheckCircle2, Award, Layout, ArrowLeft, ArrowRight, Sparkles, ChevronDown, ClipboardList } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, getDocs, doc, getDoc, query, orderBy } from 'firebase/firestore';
import { Course, Lesson } from './types';
import { motion } from 'motion/react';
import { cn } from './lib/utils';
import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import ManicureProcedure from './components/ManicureProcedure';
import PedicureProcedure from './components/PedicureProcedure';
import GelXProcedure from './components/GelXProcedure';
import AcrylicProcedure from './components/AcrylicProcedure';
import AcrylicRefillProcedure from './components/AcrylicRefillProcedure';
import YouTube from 'react-youtube';

// --- Components ---

function Navbar() {
  const { user, profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-brand-border z-50 flex items-center justify-between px-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-accent/20">
          <Award size={18} />
        </div>
        <span className="font-serif font-bold text-lg text-brand-accent tracking-[2px] uppercase hidden sm:inline">NailPro Academy</span>
      </Link>
      
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-brand-bg p-1 rounded-xl border border-brand-border">
          {(['vi', 'en', 'es'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "w-7 h-7 rounded-lg text-[10px] font-bold uppercase transition-all",
                language === lang ? "bg-brand-accent text-white shadow-sm" : "hover:bg-white text-brand-text/40"
              )}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="relative group hidden md:block">
          <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-text/60 px-3 py-1 hover:text-brand-accent transition-all">
            <ClipboardList size={14} className="text-brand-accent" />
            <span>{t.nav.procedures}</span>
            <ChevronDown size={12} className="opacity-40" />
          </button>
          
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-brand-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
             <Link 
               to="/manicure" 
               className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text/60 hover:bg-brand-bg hover:text-brand-accent transition-all border-b border-brand-border last:border-0"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
               {t.manicure.nav}
             </Link>
             <Link 
               to="/pedicure" 
               className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text/60 hover:bg-brand-bg hover:text-brand-accent transition-all border-b border-brand-border last:border-0"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
               {t.pedicure.nav}
             </Link>
             <Link 
               to="/gel-x" 
               className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text/60 hover:bg-brand-bg hover:text-brand-accent transition-all border-b border-brand-border last:border-0"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
               {t.gelX.nav}
             </Link>
             <Link 
               to="/acrylic" 
               className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text/60 hover:bg-brand-bg hover:text-brand-accent transition-all border-b border-brand-border last:border-0"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
               {t.acrylic.nav}
             </Link>
             <Link 
               to="/refill" 
               className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-brand-text/60 hover:bg-brand-bg hover:text-brand-accent transition-all border-b border-brand-border last:border-0"
             >
               <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
               {t.acrylicRefill.nav}
             </Link>
          </div>
        </div>

        {profile?.role === 'admin' && (
          <Link 
            to="/admin" 
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-accent px-3 py-1 border border-brand-accent/20 rounded-lg hover:bg-brand-accent hover:text-white transition-all"
          >
            <Layout size={14} className="md:hidden" />
            <span className="hidden md:inline">{t.nav.admin}</span>
          </Link>
        )}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-brand-text">{profile?.displayName}</p>
              <p className="text-[9px] text-brand-accent uppercase tracking-widest">{profile?.role}</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-brand-bg rounded-xl transition-colors text-brand-accent"
              title={t.nav.logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]">
      <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/" />;
}

// --- Pages ---

function HomePage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCourses() {
      try {
        const coursesSnap = await getDocs(collection(db, 'courses'));
        setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
      } catch (error) {
        console.error("Fetch Courses Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCourses();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="fixed top-[-100px] right-[-100px] w-80 h-80 rounded-full border border-brand-border/30 bg-brand-secondary/5 z-[-1]" />
      <div className="fixed bottom-[10%] left-[-50px] w-40 h-40 border border-brand-border/30 rotate-12 bg-brand-accent/5 z-[-1]" />

      <header className="mb-12 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 uppercase tracking-wide">{t.home.title}</h1>
          <div className="h-1 w-12 bg-brand-secondary rounded-full" />
        </div>
        {profile?.role === 'admin' && (
          <Link to="/admin" className="md:hidden p-2 bg-brand-accent text-white rounded-xl shadow-lg flex-shrink-0">
            <Layout size={18} />
          </Link>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {courses.length > 0 ? courses.map((course, idx) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={`/course/${course.id}`} className="group block h-full">
              <div className="bg-brand-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-border h-full flex flex-col">
                <div className="relative aspect-square overflow-hidden bg-brand-border/20">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-accent/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-brand-accent shadow-lg shadow-black/5">
                      <Play size={20} fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-brand-accent mb-1">
                    {course.category}
                  </span>
                  <h3 className="text-sm font-bold text-brand-text mb-2 line-clamp-1 group-hover:text-brand-accent transition-colors uppercase">
                    {course.title}
                  </h3>
                  <div className="mt-auto flex items-center justify-between opacity-60">
                    <span className="text-[9px] font-bold uppercase tracking-widest">
                      {t.home[course.level as keyof typeof t.home]}
                    </span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 text-center">
             <p className="text-brand-text/40 font-serif italic">{t.home.no_courses}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CourseDetailsPage() {
  const { courseId } = useParams();
  const { t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      if (!courseId) return;
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
          
          const lessonsQuery = query(collection(db, 'courses', courseId, 'lessons'), orderBy('order'));
          const lessonsSnap = await getDocs(lessonsQuery);
          setLessons(lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)));
        }
      } catch (error) {
        console.error("Fetch Details Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [courseId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg gap-4">
      <p className="text-brand-text/60">{t.course.not_found}</p>
      <Link to="/" className="text-brand-accent font-bold uppercase tracking-widest text-xs">{t.course.go_home}</Link>
    </div>
  );

  return (
    <div className="pt-24 pb-12 min-h-screen px-6">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-brand-text/40 hover:text-brand-accent mb-8 transition-colors">
          <ChevronRight size={14} className="rotate-180" />
          {t.course.back}
        </Link>

        <div className="bg-brand-white rounded-[32px] p-8 md:p-12 shadow-2xl shadow-brand-text/5 mb-10 overflow-hidden relative border border-brand-border">
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="h-1 w-8 bg-brand-secondary rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[2px]">{course.category}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 max-w-2xl leading-[1.1] uppercase tracking-tight">
              {course.title}
            </h1>
            <p className="text-brand-text/70 text-base leading-relaxed mb-10 max-w-xl">
              {course.description}
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <button className="bg-brand-accent text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs hover:shadow-xl hover:shadow-brand-accent/20 transition-all active:scale-95">
                {t.course.start}
              </button>
              <div className="flex items-center gap-2 text-brand-text/40 text-[10px] font-bold uppercase tracking-widest px-5 py-3 border border-brand-border rounded-2xl bg-brand-bg/50">
                <Play size={14} />
                {lessons.length} {t.course.lessons}
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 border border-brand-border/20 rounded-full opacity-30 bg-brand-secondary/5 rotate-12" />
        </div>

        <section>
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
            {t.course.curriculum}
            <span className="h-[1px] flex-1 bg-brand-border/50" />
          </h2>
          <div className="space-y-4">
            {lessons.map((lesson, idx) => (
              <Link key={lesson.id} to={`/lesson/${lesson.id}`}>
                <div className="group bg-brand-white p-5 rounded-2xl border border-brand-border hover:border-brand-accent hover:shadow-lg transition-all flex items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-brand-bg flex items-center justify-center font-bold text-brand-accent/30 group-hover:bg-brand-accent group-hover:text-brand-white transition-all transform group-hover:rotate-6">
                    {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm mb-1">{lesson.title}</h4>
                    <span className="text-[9px] text-brand-text/40 uppercase tracking-widest font-bold">15 MINS</span>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-border group-hover:border-brand-accent group-hover:text-brand-accent group-hover:scale-110 transition-all">
                    <Play size={14} fill="currentColor" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function LessonPage() {
  const { lessonId } = useParams();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLesson() {
      if (!lessonId) return;
      try {
        const coursesSnap = await getDocs(collection(db, 'courses'));
        for(const cDoc of coursesSnap.docs) {
          const lDoc = await getDoc(doc(db, 'courses', cDoc.id, 'lessons', lessonId));
          if(lDoc.exists()) {
             setLesson({ id: lDoc.id, ...lDoc.data() } as Lesson);
             break;
          }
        }
      } catch (error) {
        console.error("Fetch Lesson Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLesson();
  }, [lessonId]);

  useEffect(() => {
    if (lesson?.courseId) {
       const fetchAll = async () => {
         const q = query(collection(db, 'courses', lesson.courseId, 'lessons'), orderBy('order'));
         const snap = await getDocs(q);
         setAllLessons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson)));
       }
       fetchAll();
    }
  }, [lesson?.courseId]);

  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const nextLesson = allLessons[currentIndex + 1];
  const prevLesson = allLessons[currentIndex - 1];

  const handleEnd = () => {
    if (nextLesson) {
      navigate(`/lesson/${nextLesson.id}`);
    }
  };

  const getVideoId = (url: string) => {
    const watchRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(watchRegExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
    </div>
  );

  if (!lesson) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg gap-4">
      <p className="text-brand-text/60">{t.lesson.not_found}</p>
      <Link to="/" className="text-brand-accent font-bold uppercase tracking-widest text-xs">{t.course.go_home}</Link>
    </div>
  );

  return (
    <div className="pt-16 min-h-screen bg-brand-text flex flex-col md:flex-row relative">
      <div className="flex-1 bg-black flex flex-col overflow-hidden">
        <div className="flex-1 min-h-[300px] md:min-h-0 relative">
          <YouTube
            videoId={getVideoId(lesson.videoUrl)}
            onEnd={handleEnd}
            containerClassName="w-full h-full absolute inset-0"
            className="w-full h-full"
            opts={{
              width: '100%',
              height: '100%',
              playerVars: {
                autoplay: 1,
                modestbranding: 1,
              },
            }}
          />
        </div>
        
        {/* Navigation Bar inside the video area (mobile) or just below */}
        <div className="bg-brand-text/50 backdrop-blur-md p-4 flex items-center justify-between border-t border-white/5">
          <button 
            disabled={!prevLesson}
            onClick={() => navigate(`/lesson/${prevLesson!.id}`)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all disabled:opacity-0"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{t.admin.prev_lesson}</span>
          </button>
          
          <div className="text-white/20 font-bold text-[10px] uppercase tracking-[4px]">
             {currentIndex + 1} / {allLessons.length}
          </div>

          <button 
            disabled={!nextLesson}
            onClick={() => navigate(`/lesson/${nextLesson!.id}`)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white hover:text-brand-secondary transition-all disabled:opacity-0"
          >
            <span className="hidden sm:inline">{t.admin.next_lesson}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
      
      <div className="w-full md:w-[400px] bg-brand-bg overflow-y-auto border-l border-brand-border relative">
        <div className="p-8">
          <Link to={`/course/${lesson.courseId}`} className="text-brand-accent text-[10px] font-bold uppercase tracking-[2px] flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
            <ChevronRight size={14} className="rotate-180" />
            {t.lesson.back}
          </Link>
          
          <h1 className="text-2xl font-bold mb-4 tracking-tight leading-tight uppercase tracking-wide">{lesson.title}</h1>
          <div className="prose prose-sm prose-stone text-brand-text/70 leading-relaxed mb-12">
            <p>{lesson.content}</p>
          </div>
          
          <div className="pt-10 border-t border-brand-border">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-brand-secondary rounded-full" />
              <h3 className="font-bold text-sm uppercase tracking-widest">{t.lesson.exercises}</h3>
            </div>
            <div className="bg-brand-white rounded-2xl p-6 text-brand-text/80 text-sm leading-relaxed border border-brand-border shadow-sm italic">
              {t.lesson.instructions}
            </div>
          </div>
        </div>
        
        {/* Geometric detail */}
        <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 border border-brand-border/20 rounded-full bg-brand-secondary/5" />
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-[#f5f5f0] text-gray-900 selection:bg-amber-100 font-sans">
            <Routes>
              <Route path="/admin" element={
                <PrivateRoute>
                   <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/" element={
                <>
                  <Navbar />
                  <HomePage />
                </>
              } />
              <Route path="/course/:courseId" element={
                <>
                  <Navbar />
                  <CourseDetailsPage />
                </>
              } />
              <Route path="/lesson/:lessonId" element={
                <LessonPage />
              } />
              <Route path="/manicure" element={
                <>
                  <Navbar />
                  <ManicureProcedure />
                </>
              } />
              <Route path="/pedicure" element={
                <>
                  <Navbar />
                  <PedicureProcedure />
                </>
              } />
              <Route path="/gel-x" element={
                <>
                  <Navbar />
                  <GelXProcedure />
                </>
              } />
              <Route path="/acrylic" element={
                <>
                  <Navbar />
                  <AcrylicProcedure />
                </>
              } />
              <Route path="/refill" element={
                <>
                  <Navbar />
                  <AcrylicRefillProcedure />
                </>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

