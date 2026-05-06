import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardList, Loader2, ShieldCheck, FileText, File, Code, ExternalLink, X, Play } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Procedure, Policy } from '../types';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

export default function ProceduresPage() {
  const { t, language } = useLanguage();
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, 'procedures')).catch(err => {
          handleFirestoreError(err, OperationType.LIST, 'procedures');
          return { docs: [] };
        });
        setProcedures(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Procedure)));

        const policiesSnap = await getDocs(query(collection(db, 'policies'), orderBy('createdAt', 'desc'))).catch(err => {
          handleFirestoreError(err, OperationType.LIST, 'policies');
          return { docs: [] };
        });
        setPolicies(policiesSnap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Policy)));
      } catch (error) {
        console.error("Fetch Data Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg">
      <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
    </div>
  );

  return (
    <div className="pt-24 pb-12 px-6 max-w-4xl mx-auto min-h-screen">
      <header className="mb-12 md:mb-16 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-accent/10 blur-[80px] -z-10 rounded-full" />
        <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4 px-4">
          {t.procedures.center_title}
        </h1>
        <p className="text-white/30 uppercase tracking-[0.3em] text-[11px] md:text-[12px] font-bold max-w-sm mx-auto leading-relaxed px-6">
          {t.procedures.center_subtitle}
        </p>
      </header>

      <section className="mb-16 md:mb-24">
        <header className="mb-8 flex items-center gap-4 border-b border-brand-border pb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center text-brand-blue shadow-lg shadow-brand-blue/10">
            <ClipboardList size={24} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-white">{t.nav.procedures}</h2>
          <div className="h-[1px] flex-1 bg-brand-border" />
        </header>

        <div className="grid gap-4">
          {procedures.length > 0 ? procedures.map((proc, idx) => {
            const knownIds = ['manicure', 'pedicure', 'gel-x', 'acrylic', 'refill'];
            const path = knownIds.includes(proc.id) ? `/${proc.id}` : `/procedure/${proc.id}`;
            const name = proc.translations?.[language]?.nav || proc.id;

            return (
              <motion.div
                key={proc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link 
                  to={path}
                  className="group bg-brand-card p-5 md:p-6 rounded-[28px] md:rounded-3xl border border-brand-border hover:border-brand-blue/50 hover:shadow-2xl transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-bold text-white/20 group-hover:bg-brand-blue group-hover:text-white transition-all transform group-hover:rotate-6 text-sm md:text-base">
                      {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                    </div>
                    <h3 className="font-bold text-sm md:text-base uppercase tracking-[2px] md:tracking-[3px] text-white group-hover:text-brand-blue transition-colors">
                      {name}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-brand-border flex items-center justify-center text-white/20 group-hover:border-brand-blue group-hover:text-brand-blue group-hover:translate-x-1 transition-all">
                    <ChevronRight size={20} />
                  </div>
                </Link>
              </motion.div>
            );
          }) : (
            <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-brand-border italic text-white/10 text-sm uppercase tracking-widest font-bold">
              {t.admin.no_procedures || t.procedures.no_policies}
            </div>
          )}
        </div>
      </section>

      <section>
        <header className="mb-8 md:mb-10 border-b border-brand-border pb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight flex items-center gap-4 text-white">
              <ShieldCheck className="text-brand-purple w-8 h-8 md:w-10 md:h-10" />
              {t.procedures.policies_title}
            </h2>
            <p className="text-white/20 mt-3 uppercase tracking-[0.2em] text-[11px] md:text-[12px] font-bold">
              {t.procedures.policies_subtitle}
            </p>
          </div>
        </header>

        <div className="space-y-4">
          {policies.length > 0 ? policies.map((policy, idx) => {
            const isExpanded = expandedPolicyId === policy.id;
            
            return (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "bg-brand-card rounded-[28px] md:rounded-[32px] border transition-all overflow-hidden",
                  isExpanded ? "border-brand-purple shadow-2xl ring-1 ring-brand-purple/20" : "border-brand-border hover:border-brand-purple/30"
                )}
              >
                <div 
                  className="p-5 md:p-6 flex items-center gap-4 cursor-pointer group"
                  onClick={() => {
                    if (policy.type === 'html') {
                      window.open(`/#/policy/${policy.id}`, '_blank');
                    } else if (policy.url) {
                      window.open(policy.url, '_blank');
                    }
                  }}
                >
                  <div className={cn(
                    "w-14 h-14 md:w-12 md:h-12 rounded-2xl md:rounded-xl flex items-center justify-center shrink-0 shadow-xl transition-all",
                    isExpanded ? "bg-brand-purple text-white rotate-6" : 
                    policy.type === 'pdf' ? "bg-rose-500/10 text-rose-500" : 
                    policy.type === 'doc' ? "bg-brand-blue/10 text-brand-blue" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {policy.type === 'pdf' && <FileText size={28} className="md:size-6" />}
                    {policy.type === 'doc' && <File size={28} className="md:size-6" />}
                    {policy.type === 'html' && <Code size={28} className="md:size-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-bold text-sm md:text-base truncate uppercase tracking-widest transition-colors",
                      isExpanded ? "text-brand-purple" : "text-white group-hover:text-brand-purple"
                    )}>
                      {language === 'vi' ? policy.title : (policy.translations?.[language]?.title || policy.title)}
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-white/20 font-bold uppercase tracking-[2px] mt-1.5">{policy.type} doc</p>
                  </div>
    
                  {policy.type === 'html' ? (
                    <div className="w-10 h-10 rounded-xl transition-all flex items-center justify-center bg-white/5 text-brand-purple group-hover:bg-brand-purple group-hover:text-white">
                      <ExternalLink size={20} />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-white/5 text-brand-blue rounded-xl flex items-center justify-center">
                      <ExternalLink size={16} />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          }) : (
            <div className="py-20 text-center bg-white/5 rounded-[40px] border border-dashed border-brand-border">
               <p className="text-white/10 italic text-sm uppercase tracking-widest font-bold">{t.procedures.no_policies}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
