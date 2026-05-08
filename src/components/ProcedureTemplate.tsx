import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import { 
  Scissors, 
  Sparkles, 
  CheckCircle2, 
  Paintbrush, 
  HeartHandshake,
  Trash2,
  ArrowLeft,
  X,
  Brush,
  Zap,
  RefreshCw,
  ClipboardList
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Procedure, ProcedureStep } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ProcedureTemplateProps {
  procedureId?: string;
  defaultIcon?: React.ReactNode;
  defaultColor?: string;
  defaultTitle?: string;
  defaultSubtitle?: string;
}

const ProcedureTemplate: React.FC<ProcedureTemplateProps> = ({ 
  procedureId: propProcedureId,
  defaultIcon,
  defaultColor = "text-rose-500",
  defaultTitle,
  defaultSubtitle
}) => {
  const { procedureId: paramProcedureId } = useParams<{ procedureId: string }>();
  const procedureId = propProcedureId || paramProcedureId;
  const { t, language } = useLanguage();
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [dbProcedure, setDbProcedure] = useState<Procedure | null>(null);
  const [dbSteps, setDbSteps] = useState<ProcedureStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!procedureId) {
        setLoading(false);
        return;
      }
      try {
        const procDoc = await getDoc(doc(db, 'procedures', procedureId));
        if (procDoc.exists()) {
          setDbProcedure({ id: procDoc.id, ...procDoc.data() } as Procedure);
          
          const stepsSnap = await getDocs(query(collection(db, 'procedures', procedureId, 'steps'), orderBy('order')));
          setDbSteps(stepsSnap.docs.map(d => ({ id: d.id, ...d.data() } as ProcedureStep)));
        }
      } catch (err) {
        console.error("Error fetching procedure data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [procedureId]);

  const getVideoId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  // Get icons based on procedure ID or from props
  const getIcon = (id: string) => {
    switch (id) {
      case 'manicure': return <Scissors className="w-6 h-6 text-rose-500" />;
      case 'pedicure': return <Brush className="w-6 h-6 text-emerald-500" />;
      case 'gel-x': return <Sparkles className="w-6 h-6 text-purple-500" />;
      case 'acrylic': return <Zap className="w-6 h-6 text-amber-500" />;
      case 'refill': return <RefreshCw className="w-6 h-6 text-blue-500" />;
      default: return defaultIcon || <ClipboardList className="w-6 h-6 text-brand-accent" />;
    }
  };

  // If we have DB data, use it. Otherwise, we might want to fallback or show loading
  // For this app, let's assume if it exists in DB, that's the truth.
  
  const title = dbProcedure?.translations?.[language]?.title || defaultTitle;
  const subtitle = dbProcedure?.translations?.[language]?.subtitle || defaultSubtitle;
  const phases = dbProcedure?.translations?.[language]?.phases || {};
  
  // Group steps by phase if possible, or just show them in order
  // Existing procedures used phases. If DB steps don't have phases, we'll just show them in one list or try to map.
  
  // For now, let's just render the steps in a clean list if we have DB steps
  
  return (
    <div className="min-h-screen bg-brand-bg p-4 md:p-8 font-sans pt-24">
      <div className="max-w-5xl mx-auto mb-10">
        <Link to="/procedures" className="text-brand-accent flex items-center gap-3 font-bold uppercase tracking-[4px] text-[10px] hover:opacity-70 transition-all group w-fit">
          <div className="w-8 h-8 rounded-full border border-brand-accent/20 flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all">
            <ArrowLeft size={16} />
          </div>
          {t.nav.back}
        </Link>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-40 bg-brand-accent/10 blur-[100px] -z-10 rounded-full" />
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter leading-tight">
          {subtitle}
        </h1>
        <p className={cn("font-bold tracking-[0.3em] uppercase mb-6 text-xs", dbProcedure?.color || defaultColor)}>
          {title}
        </p>
        <div className={cn("h-1 w-24 mx-auto rounded-full shadow-lg", dbProcedure?.color?.replace('text-', 'bg-') || defaultColor.replace('text-', 'bg-'))}></div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {dbSteps.length > 0 ? (
          <div className="grid gap-4">
            {dbSteps.map((step, idx) => {
              const isActive = activeStep === step.id;
              const videoId = step.videoUrl ? getVideoId(step.videoUrl) : '';
              
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "bg-brand-card p-6 md:p-8 rounded-[40px] border transition-all cursor-pointer group shadow-2xl relative overflow-hidden",
                    isActive ? "border-brand-accent shadow-[0_32px_64px_rgba(255,45,85,0.1)]" : "border-brand-border hover:border-brand-accent/30"
                  )}
                  onClick={() => setActiveStep(isActive ? null : step.id)}
                >
                  <div className="flex items-start gap-6 md:gap-8 relative z-10">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 transition-all duration-500 transform group-hover:rotate-6",
                      isActive ? "bg-brand-accent text-white shadow-xl shadow-brand-accent/20" : "bg-white/5 text-white/20"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-xl text-white uppercase tracking-tight group-hover:text-brand-accent transition-colors">{step.title}</h3>
                        <CheckCircle2 className={cn(
                          "w-6 h-6 transition-all duration-500",
                          isActive ? "opacity-100 scale-125 text-emerald-500" : "opacity-0 group-hover:opacity-10"
                        )} />
                      </div>
                      <p className="text-white/40 leading-relaxed text-sm font-medium">{step.desc}</p>
                      
                      {isActive && videoId && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative mt-10 aspect-video rounded-[32px] overflow-hidden bg-black shadow-2xl border-4 border-white/5"
                        >
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
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {isActive && <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full -translate-y-16 translate-x-16 blur-3xl" />}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[48px] border-2 border-dashed border-brand-border">
            <p className="text-white/10 italic text-sm uppercase tracking-[0.2em] font-bold">No dynamic procedures found.</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <p className="mt-20 text-center text-white/20 text-[10px] font-bold uppercase tracking-[0.4em]">
        My Nail Art & Spa — Digital Training Center — v2.0
      </p>
    </div>
  );
};

export default ProcedureTemplate;
