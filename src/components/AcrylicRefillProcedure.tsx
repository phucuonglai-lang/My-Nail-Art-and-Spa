import React, { useState } from 'react';
import { 
  RefreshCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Box, 
  Paintbrush, 
  Gem,
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const AcrylicRefillProcedure = () => {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const steps = [
    {
      id: 1,
      phase: t.acrylicRefill.phases.check,
      color: "bg-cyan-50",
      borderColor: "border-cyan-200",
      textColor: "text-cyan-700",
      icon: <RefreshCcw className="w-6 h-6 text-cyan-500" />,
      items: [
        t.acrylicRefill.steps.s1,
        t.acrylicRefill.steps.s2,
        t.acrylicRefill.steps.s3
      ]
    },
    {
      id: 2,
      phase: t.acrylicRefill.phases.refill,
      color: "bg-teal-50",
      borderColor: "border-teal-200",
      textColor: "text-teal-700",
      icon: <Box className="w-6 h-6 text-teal-500" />,
      items: [
        t.acrylicRefill.steps.s4,
        t.acrylicRefill.steps.s5,
        t.acrylicRefill.steps.s6
      ]
    },
    {
      id: 3,
      phase: t.acrylicRefill.phases.finish,
      color: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-700",
      icon: <Paintbrush className="w-6 h-6 text-emerald-500" />,
      items: [
        t.acrylicRefill.steps.s7,
        t.acrylicRefill.steps.s8,
        t.acrylicRefill.steps.s9,
        t.acrylicRefill.steps.s10
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
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 uppercase tracking-tight">
          {t.acrylicRefill.subtitle}
        </h1>
        <p className="text-teal-600 font-semibold tracking-widest uppercase mb-4">
          {t.acrylicRefill.title}
        </p>
        <div className="h-1 w-24 bg-teal-400 mx-auto rounded-full"></div>
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
                    activeStep === item.title ? "border-teal-400 shadow-md ring-1 ring-teal-400/20" : "border-white hover:border-gray-300"
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

      {/* Critical Refill Notes */}
      <div className="max-w-5xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 border border-red-200 p-5 rounded-xl flex gap-4 items-start shadow-sm">
          <div className="bg-red-500 p-2 rounded-lg text-white shadow-md">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-red-900 uppercase text-sm">{t.acrylicRefill.tips_lifting_title}</h4>
            <p className="text-sm text-red-800 leading-relaxed">
              {t.acrylicRefill.tips_lifting_desc}
            </p>
          </div>
        </div>
        
        <div className="bg-teal-50 border border-teal-200 p-5 rounded-xl flex gap-4 items-start shadow-sm">
          <div className="bg-teal-500 p-2 rounded-lg text-white shadow-md">
            <Gem className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-teal-900 uppercase text-sm">{t.acrylicRefill.tips_drilling_title}</h4>
            <p className="text-sm text-teal-800 leading-relaxed">
              {t.acrylicRefill.tips_drilling_desc}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 text-center text-gray-400 text-xs uppercase tracking-widest">
        <p>{t.acrylicRefill.copyright}</p>
      </div>
    </div>
  );
};

export default AcrylicRefillProcedure;
