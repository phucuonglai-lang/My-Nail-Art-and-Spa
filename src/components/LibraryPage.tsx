import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course, Policy } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Play, ChevronRight, Layout, FileText, File, Code, Download, ExternalLink, X, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { query, orderBy } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function LibraryPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const coursesSnap = await getDocs(collection(db, 'courses'));
        setCourses(coursesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Course)));

        const policiesSnap = await getDocs(query(collection(db, 'policies'), orderBy('createdAt', 'desc')));
        setPolicies(policiesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Policy)));
      } catch (error) {
        console.error("Fetch Data Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto relative min-h-screen">
      {/* Decorative background shapes */}
      <div className="fixed top-[-100px] right-[-100px] w-80 h-80 rounded-full border border-brand-blue/30 bg-brand-blue/5 z-[-1] blur-3xl opacity-20" />
      <div className="fixed bottom-[10%] left-[-50px] w-40 h-40 border border-brand-purple/30 rotate-12 bg-brand-purple/5 z-[-1] blur-2xl opacity-20" />

      <header className="mb-12 flex items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold mb-2 uppercase tracking-tighter text-white">{t.nav.library}</h1>
          <div className="h-1 w-12 bg-gradient-to-r from-brand-blue to-brand-purple rounded-full" />
        </div>
        {profile?.role === 'admin' && (
          <Link to="/admin" className="md:hidden p-2 bg-brand-accent text-white rounded-xl shadow-lg flex-shrink-0">
            <Layout size={18} />
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length > 0 ? courses.map((course, idx) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={`/course/${course.id}`} className="group block h-full">
              <div className="bg-brand-card rounded-[24px] overflow-hidden shadow-xl hover:shadow-brand-blue/5 transition-all duration-500 border border-brand-border h-full flex flex-col group-hover:border-brand-blue/30">
                <div className="relative aspect-[16/10] overflow-hidden bg-white/5">
                  <img 
                    src={course.thumbnail || undefined} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 filter brightness-90 group-hover:brightness-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-bg/90 selection:via-brand-bg/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-brand-blue shadow-2xl">
                      <Play size={24} fill="currentColor" className="translate-x-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[3px] text-brand-blue mb-2">
                    {course.category}
                  </span>
                  <h3 className="text-base font-bold text-white mb-3 line-clamp-2 leading-snug uppercase tracking-tight group-hover:text-brand-blue transition-colors">
                    {course.title}
                  </h3>
                  <div className="mt-auto pt-4 border-t border-brand-border/50 flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[2px] text-white/30">
                      {t.home[course.level as keyof typeof t.home]}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-brand-blue group-hover:text-white transition-all">
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )) : (
          <div className="col-span-full py-32 text-center bg-white/5 rounded-[32px] border border-dashed border-brand-border">
             <p className="text-white/20 font-serif italic uppercase tracking-widest">{t.home.no_courses}</p>
          </div>
        )}
      </div>

      <section className="mt-24">
        <header className="mb-10 flex items-center justify-between gap-4 border-b border-brand-border pb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2 uppercase tracking-widest text-white">QUY ĐỊNH TIỆM - CHÍNH SÁCH</h2>
            <div className="h-1 w-8 bg-brand-accent rounded-full" />
          </div>
          <Info size={18} className="text-brand-accent/40" />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policies.length > 0 ? policies.map((policy, idx) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-brand-card p-5 rounded-2xl border border-brand-border hover:border-brand-purple/50 hover:shadow-xl transition-all group flex items-center gap-4"
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                policy.type === 'pdf' ? "bg-rose-500/10 text-rose-500" : 
                policy.type === 'doc' ? "bg-brand-blue/10 text-brand-blue" : "bg-emerald-500/10 text-emerald-500"
              )}>
                {policy.type === 'pdf' && <FileText size={22} />}
                {policy.type === 'doc' && <File size={22} />}
                {policy.type === 'html' && <Code size={22} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-white truncate uppercase tracking-wide group-hover:text-brand-purple transition-colors">{policy.title}</h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[2px] mt-1">{policy.type} document</p>
              </div>

              {policy.type === 'html' ? (
                <button 
                  onClick={() => setSelectedPolicy(policy)}
                  className="w-10 h-10 bg-white/5 text-brand-purple rounded-xl hover:bg-brand-purple hover:text-white transition-all shadow-xl flex items-center justify-center"
                >
                  <Play size={16} />
                </button>
              ) : (
                <a 
                  href={policy.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-10 h-10 bg-white/5 text-brand-blue rounded-xl hover:bg-brand-blue hover:text-white transition-all shadow-xl flex items-center justify-center"
                >
                  <ExternalLink size={16} />
                </a>
              )}
            </motion.div>
          )) : (
            <div className="col-span-full py-16 text-center bg-white/5 rounded-3xl border border-dashed border-brand-border">
               <p className="text-white/20 italic text-sm uppercase tracking-widest font-bold">Chưa có quy định được đăng tải.</p>
            </div>
          )}
        </div>
      </section>

      {/* HTML Content Preview Modal */}
      <AnimatePresence>
        {selectedPolicy && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-bg/90 backdrop-blur-md z-[200] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-brand-card w-full max-w-2xl rounded-[40px] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.8)] relative max-h-[85vh] flex flex-col border border-brand-border"
            >
              <button 
                onClick={() => setSelectedPolicy(null)} 
                className="absolute top-8 right-8 p-3 text-white/20 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <X size={24} />
              </button>

              <div className="mb-8 pr-12">
                <span className="text-[10px] font-bold uppercase tracking-[4px] text-brand-purple mb-2 block">Policy Preview</span>
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight">
                  {selectedPolicy.title}
                </h3>
              </div>

              <div className="overflow-y-auto flex-1 prose prose-invert prose-sm max-w-none scrollbar-hide">
                <div 
                  className="whitespace-pre-wrap text-white/60 leading-relaxed font-sans"
                  dangerouslySetInnerHTML={{ __html: selectedPolicy.content || '' }}
                />
              </div>

              <div className="mt-10 pt-8 border-t border-brand-border flex justify-end">
                <button 
                  onClick={() => setSelectedPolicy(null)}
                  className="px-10 py-4 bg-brand-purple text-white rounded-2xl font-bold uppercase tracking-[3px] text-[10px] hover:shadow-2xl hover:shadow-brand-purple/20 transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  Confirm & Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
