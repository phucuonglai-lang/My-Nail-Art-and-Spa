import React, { useState } from 'react';
import { 
  Ruler, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  Paintbrush, 
  Search,
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const GelXProcedure = () => {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const steps = [
    {
      id: 1,
      phase: t.gelX.phases.prep,
      color: "bg-indigo-50",
      borderColor: "border-indigo-200",
      textColor: "text-indigo-700",
      icon: <Ruler className="w-6 h-6 text-indigo-500" />,
      items: [
        t.gelX.steps.s1,
        t.gelX.steps.s2,
        t.gelX.steps.s3,
        t.gelX.steps.s4
      ]
    },
    {
      id: 2,
      phase: t.gelX.phases.bonding,
      color: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      icon: <Flame className="w-6 h-6 text-purple-500" />,
      items: [
        t.gelX.steps.s5,
        t.gelX.steps.s6,
        t.gelX.steps.s7,
        t.gelX.steps.s8
      ]
    },
    {
      id: 3,
      phase: t.gelX.phases.finish,
      color: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      icon: <Paintbrush className="w-6 h-6 text-emerald-500" />,
      items: [
        t.gelX.steps.s9,
        t.gelX.steps.s10,
        t.gelX.steps.s11,
        t.gelX.steps.s12
      ]
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

        {steps.map((phase, idx) => (
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
              {phase.items.map((item, i) => (
                <div 
                  key={i}
                  className={cn(
                    "bg-white/80 p-3 rounded-lg border transition-all cursor-pointer group",
                    activeStep === item.title ? "border-indigo-400 shadow-md ring-1 ring-indigo-400/20" : "border-white hover:border-gray-300"
                  )}
                  onClick={() => setActiveStep(item.title)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 leading-tight">{item.title}</span>
                    <CheckCircle2 className={cn(
                      "w-4 h-4 transition-opacity",
                      activeStep === item.title ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      phase.textColor
                    )} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
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
    </div>
  );
};

export default GelXProcedure;
