import React, { useState, useEffect } from 'react';
import { 
  Ruler, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Paintbrush, 
  Search,
  ArrowLeft,
  Edit2,
  Save,
  Loader2,
  X
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { collection, getDocs, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProcedureStep } from '../types';
import YouTube from 'react-youtube';

const GelXProcedure = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [dbSteps, setDbSteps] = useState<ProcedureStep[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcedureStep | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const fetchData = async () => {
    const q = query(collection(db, 'procedures', 'gel-x', 'steps'), orderBy('order'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setDbSteps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcedureStep)));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getVideoId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  const getPhaseSteps = (stepIndices: number[]) => {
    return stepIndices.map(i => {
      const dbStep = dbSteps.find(s => s.id === `s${i}`);
      if (dbStep) return dbStep;

      const staticStep = (t.gelX.steps as any)[`s${i}`];
      return {
        id: `s${i}`,
        title: staticStep.title,
        desc: staticStep.desc,
        videoUrl: staticStep.videoUrl,
        order: i
      } as ProcedureStep;
    });
  };

  const handleEditClick = (e: React.MouseEvent, step: ProcedureStep) => {
    e.stopPropagation();
    setEditingStep(step);
    setIsEditing(true);
  };

  const handleSaveStep = async () => {
    if (!editingStep) return;
    setSaving(true);
    try {
      const stepRef = doc(db, 'procedures', 'gel-x', 'steps', editingStep.id);
      await setDoc(stepRef, editingStep, { merge: true });
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error("Save Step Error:", error);
      alert("Error saving step.");
    } finally {
      setSaving(false);
    }
  };

  const phases = [
    {
      id: 1,
      phase: t.gelX.phases.prep,
      color: "bg-indigo-50",
      borderColor: "border-indigo-200",
      textColor: "text-indigo-700",
      icon: <Ruler className="w-6 h-6 text-indigo-500" />,
      items: getPhaseSteps([1, 2, 3, 4])
    },
    {
      id: 2,
      phase: t.gelX.phases.bonding,
      color: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      icon: <Flame className="w-6 h-6 text-purple-500" />,
      items: getPhaseSteps([5, 6, 7, 8])
    },
    {
      id: 3,
      phase: t.gelX.phases.finish,
      color: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      icon: <Paintbrush className="w-6 h-6 text-emerald-500" />,
      items: getPhaseSteps([9, 10, 11, 12])
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans pt-24">
      <div className="max-w-5xl mx-auto mb-6">
        <Link to="/" className="text-brand-accent flex items-center gap-2 font-bold uppercase tracking-widest text-xs hover:opacity-70 transition-all">
          <ArrowLeft size={16} /> {t.nav.back}
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          {t.gelX.subtitle}
        </h1>
        <p className="text-indigo-600 font-semibold tracking-widest uppercase mb-4">
          {t.gelX.title}
        </p>
        <div className="h-1 w-24 bg-indigo-400 mx-auto rounded-full"></div>
      </div>

      {/* Mind Map Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        
        {/* Connection Lines (Desktop only) */}
        <div className="hidden md:block absolute top-[150px] left-0 w-full h-0.5 bg-gray-200 -z-10"></div>

        {phases.map((phase, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex flex-col gap-4 p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${phase.borderColor} ${phase.color}`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-inherit">
                {phase.icon}
              </div>
              <h2 className={`font-bold text-lg leading-tight ${phase.textColor}`}>
                {phase.phase}
              </h2>
            </div>

            <div className="space-y-3">
              {phase.items.map((item, i) => {
                const isActive = activeStep === item.title;
                const videoId = item.id ? getVideoId(item.videoUrl) : '';

                return (
                  <div 
                    key={i}
                    className={cn(
                      "bg-white/80 p-3 rounded-lg border transition-all cursor-pointer group",
                      isActive ? "border-indigo-400 shadow-md ring-1 ring-indigo-400/20" : "border-white hover:border-gray-300"
                    )}
                    onClick={() => setActiveStep(isActive ? null : item.title)}
                  >
                    <div className="flex items-center justify-between group/title">
                      <span className="font-bold text-gray-700 leading-tight text-sm">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button 
                            onClick={(e) => handleEditClick(e, item)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded opacity-0 group-hover/title:opacity-100 transition-opacity"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}
                        <CheckCircle2 className={cn(
                          "w-4 h-4 transition-all",
                          isActive ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100",
                          phase.textColor
                        )} />
                      </div>
                    </div>
                    <p className={`text-xs text-gray-500 mt-1 leading-relaxed transition-all ${isActive ? 'mb-3' : ''}`}>
                      {item.desc}
                    </p>

                    {isActive && videoId && (
                      <div className="relative mt-2 aspect-video rounded-lg overflow-hidden bg-black shadow-inner">
                        <YouTube
                          videoId={videoId}
                          containerClassName="w-full h-full"
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
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Professional Tips Section */}
      <div className="max-w-5xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl flex gap-4 items-start shadow-sm">
          <div className="bg-amber-400 p-2 rounded-lg text-white">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 uppercase text-sm">{t.gelX.tips_selection_title}</h4>
            <p className="text-sm text-amber-800">{t.gelX.tips_selection_desc}</p>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl flex gap-4 items-start shadow-sm">
          <div className="bg-blue-400 p-2 rounded-lg text-white">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 uppercase text-sm">{t.gelX.tips_prep_title}</h4>
            <p className="text-sm text-blue-800">{t.gelX.tips_prep_desc}</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-gray-400 text-xs uppercase tracking-widest">
        <p>{t.gelX.copyright}</p>
      </div>

      {/* Quick Edit Modal */}
      <AnimatePresence>
        {isEditing && editingStep && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-text/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative"
            >
              <button onClick={() => setIsEditing(false)} className="absolute top-6 right-6 p-2 text-brand-text/30 hover:text-brand-text transition-colors">
                <X size={24} />
              </button>

              <h3 className="text-xl font-bold mb-6 text-brand-text uppercase tracking-widest text-indigo-600">
                Edit Gel-X Step
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40 mb-1 block">Title</label>
                  <input 
                    type="text"
                    value={editingStep.title}
                    onChange={e => setEditingStep({...editingStep, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40 mb-1 block">Description</label>
                  <textarea 
                    value={editingStep.desc}
                    onChange={e => setEditingStep({...editingStep, desc: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 transition-colors min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40 mb-1 block">YouTube Video URL</label>
                  <input 
                    type="text"
                    value={editingStep.videoUrl || ''}
                    onChange={e => setEditingStep({...editingStep, videoUrl: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={handleSaveStep}
                  disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Changes
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-brand-border rounded-xl font-bold uppercase tracking-widest text-brand-text/60 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GelXProcedure;
