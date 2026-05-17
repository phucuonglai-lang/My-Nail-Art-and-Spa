import React, { useState, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { 
  Scissors, 
  Sparkles, 
  CheckCircle2, 
  Paintbrush, 
  HeartHandshake,
  Trash2,
  ArrowLeft,
  X,
  Edit2,
  Save,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProcedureStep } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const ManicureProcedure = () => {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [dbSteps, setDbSteps] = useState<ProcedureStep[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcedureStep | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const fetchData = async () => {
    try {
      const q = query(collection(db, 'procedures', 'manicure', 'steps'), orderBy('order'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setDbSteps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProcedureStep)));
      }
    } catch (error) {
      console.error("Fetch Manicure Steps Error:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getVideoId = (url: string) => {
    return url || '';
  };

  // Combine static phases with potential dynamic steps
  const getPhaseSteps = (phaseName: string, stepIndices: number[]) => {
    return stepIndices.map(i => {
      // Check if we have this specific step in DB
      const dbStep = dbSteps.find(s => s.id === `s${i}`);
      if (dbStep) return dbStep;
      
      const staticStep = (t.manicure.steps as any)[`s${i}`];
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
      const stepRef = doc(db, 'procedures', 'manicure', 'steps', editingStep.id);
      // Use setDoc with merge to handle cases where the document might not exist yet if it's from static
      await setDoc(stepRef, editingStep, { merge: true });
      setIsEditing(false);
      fetchData();
    } catch (error) {
      console.error("Save Step Error:", error);
      alert("Error saving step. Please check your permissions.");
    } finally {
      setSaving(false);
    }
  };

  const phases = [
    {
      id: 1,
      phase: t.manicure.phases.prep,
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      icon: <Trash2 className="w-6 h-6 text-blue-500" />,
      items: getPhaseSteps(t.manicure.phases.prep, [1, 2, 3])
    },
    {
      id: 2,
      phase: t.manicure.phases.treatment,
      color: "bg-rose-50",
      borderColor: "border-rose-200",
      textColor: "text-rose-700",
      icon: <Scissors className="w-6 h-6 text-rose-500" />,
      items: getPhaseSteps(t.manicure.phases.treatment, [4, 5, 6, 7])
    },
    {
      id: 3,
      phase: t.manicure.phases.finish,
      color: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      icon: <Paintbrush className="w-6 h-6 text-emerald-500" />,
      items: getPhaseSteps(t.manicure.phases.finish, [8, 9, 10])
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
          {t.manicure.subtitle}
        </h1>
        <p className="text-rose-500 font-semibold tracking-widest uppercase mb-4">
          {t.manicure.title}
        </p>
        <div className="h-1 w-24 bg-rose-400 mx-auto rounded-full"></div>
      </div>

      {/* Mind Map Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        
        {/* Connection Lines (Desktop only) */}
        <div className="hidden md:block absolute top-[150px] left-0 w-full h-0.5 bg-gray-200 -z-10"></div>

        {phases.map((phase, idx) => (
          <div 
            key={idx} 
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
                const videoId = item.videoUrl ? getVideoId(item.videoUrl) : '';

                return (
                  <div 
                    key={i}
                    className={cn(
                      "bg-white/80 p-3 rounded-xl border transition-all cursor-pointer group",
                      isActive ? "border-brand-accent shadow-lg ring-1 ring-brand-accent/20" : "border-white hover:border-brand-accent/30"
                    )}
                    onClick={() => setActiveStep(isActive ? null : item.title)}
                  >
                    <div className="flex items-center justify-between group/title">
                      <span className="font-bold text-gray-700 text-sm">{item.title}</span>
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button 
                            onClick={(e) => handleEditClick(e, item)}
                            className="p-1 text-brand-accent hover:bg-brand-accent/10 rounded opacity-0 group-hover/title:opacity-100 transition-opacity"
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
                    <p className={cn("text-xs text-gray-500 mt-1 leading-relaxed transition-all", isActive && "mb-3")}>
                      {item.desc}
                    </p>
                    
                    {isActive && videoId && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 rounded-xl overflow-hidden aspect-video bg-black"
                      >
                        <VideoPlayer
                          videoUrl={videoId}
                          containerClassName="w-full h-full"
                          className="w-full h-full"
                        />
                      </motion.div>
                    )}
                    {isActive && !videoId && (
                      <div className="mt-2 p-3 bg-slate-100 rounded-lg border border-dashed border-slate-300 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                        Video coming soon
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pro Tips Footer */}
      <div className="max-w-5xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-4 items-start">
          <div className="bg-amber-400 p-2 rounded-lg text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900">{t.manicure.rule_121_title}</h4>
            <p className="text-sm text-amber-800">{t.manicure.rule_121_desc}</p>
          </div>
        </div>
        
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex gap-4 items-start">
          <div className="bg-rose-400 p-2 rounded-lg text-white">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-rose-900">{t.manicure.satisfaction_title}</h4>
            <p className="text-sm text-rose-800">{t.manicure.satisfaction_desc}</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-gray-400 text-sm">
        <p>{t.manicure.copyright}</p>
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

              <h3 className="text-xl font-bold mb-6 text-brand-text uppercase tracking-widest">
                Edit Step Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40 mb-1 block">Title</label>
                  <input 
                    type="text"
                    value={editingStep.title}
                    onChange={e => setEditingStep({...editingStep, title: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40 mb-1 block">Description</label>
                  <textarea 
                    value={editingStep.desc}
                    onChange={e => setEditingStep({...editingStep, desc: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-brand-accent transition-colors min-h-[80px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text/40 mb-1 block">Video URL (YouTube/Bunny.net)</label>
                  <input 
                    type="text"
                    value={editingStep.videoUrl || ''}
                    onChange={e => setEditingStep({...editingStep, videoUrl: e.target.value})}
                    placeholder="YouTube or Bunny.net URL"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={handleSaveStep}
                  disabled={saving}
                  className="flex-1 bg-brand-accent text-white py-3 rounded-xl font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-brand-accent/20 transition-all flex items-center justify-center gap-2"
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

export default ManicureProcedure;
