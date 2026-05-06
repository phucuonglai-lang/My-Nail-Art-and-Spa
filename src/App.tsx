/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route, Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Globe, LogOut, BookOpen, User, Play, ChevronRight, CheckCircle2, Award, Layout, ArrowLeft, ArrowRight, Sparkles, ChevronDown, ClipboardList, LogIn } from 'lucide-react';
import { auth, db } from './lib/firebase';
import { signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
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
import ProcedureTemplate from './components/ProcedureTemplate';
import PolicyViewer from './components/PolicyViewer';
import YouTube from 'react-youtube';
import HomePage from './components/HomePage';
import LibraryPage from './components/LibraryPage';
import ProceduresPage from './components/ProceduresPage';
import Sidebar from './components/Sidebar';

// --- Layouts ---

function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <Navbar />
      <Sidebar />
      <main className="lg:pl-80 pt-16 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}

// --- Components ---

function Navbar() {
  const { user, profile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add custom parameter to force account selection and help with some pop-up issues
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      console.log("Login success:", result.user.email);
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép hiện pop-up và thử lại.");
      } else if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to alert
      } else {
        alert("Đăng nhập thất bại: " + error.message);
      }
    }
  };

  const { loading: authLoading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-brand-bg/80 backdrop-blur-xl border-b border-brand-border z-50 flex items-center justify-between px-6">
      {/* Left: Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-accent/40">
          <Award size={18} />
        </div>
        <span className="font-serif font-bold text-lg text-brand-text tracking-[2px] uppercase hidden sm:inline">NailPro Academy</span>
      </Link>

      {/* Center: Navigation Links */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
        <Link 
          to="/library" 
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-text/60 px-3 py-2 hover:text-brand-blue transition-all"
        >
          <BookOpen size={14} className="text-brand-blue" />
          <span className="hidden sm:inline">{t.nav.library}</span>
        </Link>
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        {profile?.role === 'admin' && (
          <Link 
            to="/admin" 
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-brand-purple px-3 py-1 border border-brand-purple/20 rounded-lg hover:bg-brand-purple hover:text-white transition-all shadow-lg shadow-brand-purple/10"
          >
            <Layout size={14} className="md:hidden" />
            <span className="hidden md:inline">{t.nav.admin}</span>
          </Link>
        )}
        
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-bold text-brand-text">{profile?.displayName}</p>
              <p className="text-[9px] text-brand-purple uppercase tracking-widest">{profile?.role}</p>
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors text-brand-text/60 hover:text-brand-accent"
              title={t.nav.logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button 
            onClick={handleLogin}
            disabled={authLoading}
            className={cn(
              "flex items-center gap-2 bg-gradient-to-r from-brand-accent to-brand-purple text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-brand-accent/20",
              authLoading && "opacity-50 cursor-not-allowed"
            )}
          >
            {authLoading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <LogIn size={14} />
            )}
            <span>{authLoading ? '...' : t.nav.login}</span>
          </button>
        )}

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-brand-border ml-2">
          {(['vi', 'en', 'es'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={cn(
                "w-7 h-7 rounded-lg text-[10px] font-bold uppercase transition-all",
                language === lang ? "bg-brand-card text-brand-text border border-brand-border shadow-md" : "hover:bg-white/5 text-brand-text/30"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-12 h-12 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
    </div>
  );
  if (!user || profile?.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-12 h-12 border-4 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/" />;
}

// --- Pages ---

function CourseDetailsPage() {
  const { courseId } = useParams();
  const { t, language } = useLanguage();
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

        <div className="bg-brand-card rounded-[32px] p-8 md:p-12 shadow-2xl mb-10 overflow-hidden relative border border-brand-border">
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="h-1 w-8 bg-brand-blue rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-[2px] text-brand-blue">{course.category}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 max-w-2xl leading-[1.1] uppercase tracking-tight text-white">
              {course.translations?.[language]?.title || course.title}
            </h1>
            <p className="text-brand-text/50 text-base leading-relaxed mb-10 max-w-xl">
              {course.translations?.[language]?.description || course.description}
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <button className="bg-brand-accent text-white px-10 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs hover:shadow-xl hover:shadow-brand-accent/30 transition-all active:scale-95">
                {t.course.start}
              </button>
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest px-5 py-3 border border-brand-border rounded-2xl bg-white/5">
                <Play size={14} />
                {lessons.length} {t.course.lessons}
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -bottom-20 w-80 h-80 border border-brand-blue/10 rounded-full opacity-30 bg-brand-blue/5 rotate-12" />
        </div>

        <section>
          <h2 className="text-xl font-bold mb-8 flex items-center gap-3 text-white">
            {t.course.curriculum}
            <span className="h-[1px] flex-1 bg-brand-border" />
          </h2>
          <div className="space-y-4">
            {lessons.map((lesson, idx) => {
              const lessonTitle = lesson.translations?.[language]?.title || lesson.title;
              return (
                <Link key={lesson.id} to={`/lesson/${lesson.id}`}>
                  <div className="group bg-brand-card p-5 rounded-2xl border border-brand-border hover:border-brand-purple hover:shadow-lg transition-all flex items-center gap-6">
                    <div className="w-14 h-14 rounded-xl bg-brand-bg flex items-center justify-center font-bold text-white/20 group-hover:bg-brand-purple group-hover:text-white transition-all transform group-hover:rotate-6">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm mb-1 text-white group-hover:text-brand-purple transition-colors">{lessonTitle}</h4>
                      <span className="text-[9px] text-white/20 uppercase tracking-widest font-bold">15 MINS</span>
                    </div>
                    <div className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-brand-border group-hover:border-brand-purple group-hover:text-brand-purple group-hover:scale-110 transition-all">
                      <Play size={14} fill="currentColor" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function LessonPage() {
  const { lessonId } = useParams();
  const { t, language } = useLanguage();
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
    if (!url) return '';
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
          
          <h1 className="text-2xl font-bold mb-4 tracking-tight leading-tight uppercase tracking-wide">
            {lesson.translations?.[language]?.title || lesson.title}
          </h1>
          <div className="prose prose-sm prose-stone text-brand-text/70 leading-relaxed mb-12">
            <p>{lesson.translations?.[language]?.content || lesson.content}</p>
          </div>
          
          <div className="pt-10 border-t border-brand-border">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-6 bg-brand-blue rounded-full" />
              <h3 className="font-bold text-sm uppercase tracking-widest text-white">{t.lesson.exercises}</h3>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 text-white/60 text-sm leading-relaxed border border-brand-border shadow-sm italic">
              {t.lesson.instructions}
            </div>
          </div>
        </div>
        
        {/* Geometric detail */}
        <div className="absolute bottom-[-50px] right-[-50px] w-40 h-40 border border-brand-blue/20 rounded-full bg-brand-blue/5" />
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <HashRouter>
          <div className="min-h-screen bg-brand-bg text-brand-text selection:bg-brand-accent/30 font-sans">
            <Routes>
              <Route path="/admin" element={
                <AdminRoute>
                   <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/" element={
                <SharedLayout>
                  <HomePage />
                </SharedLayout>
              } />
              <Route path="/library" element={
                <SharedLayout>
                  <LibraryPage />
                </SharedLayout>
              } />
              <Route path="/procedures" element={
                <SharedLayout>
                  <ProceduresPage />
                </SharedLayout>
              } />
              <Route path="/course/:courseId" element={
                <SharedLayout>
                  <CourseDetailsPage />
                </SharedLayout>
              } />
              <Route path="/lesson/:lessonId" element={
                <LessonPage />
              } />
              <Route path="/manicure" element={
                <SharedLayout>
                  <ManicureProcedure />
                </SharedLayout>
              } />
              <Route path="/pedicure" element={
                <SharedLayout>
                  <PedicureProcedure />
                </SharedLayout>
              } />
              <Route path="/gel-x" element={
                <SharedLayout>
                  <GelXProcedure />
                </SharedLayout>
              } />
              <Route path="/acrylic" element={
                <SharedLayout>
                  <AcrylicProcedure />
                </SharedLayout>
              } />
              <Route path="/refill" element={
                <SharedLayout>
                  <AcrylicRefillProcedure />
                </SharedLayout>
              } />
              <Route path="/procedure/:procedureId" element={
                <SharedLayout>
                  <ProcedureTemplate />
                </SharedLayout>
              } />
              <Route path="/policy/:policyId" element={
                <PolicyViewer />
              } />
            </Routes>
          </div>
        </HashRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

