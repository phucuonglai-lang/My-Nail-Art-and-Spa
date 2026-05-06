import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Policy } from '../types';
import { useState, useEffect } from 'react';
import { ChevronLeft, Printer, Share2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

export default function PolicyViewer() {
  const { policyId } = useParams();
  const { t, language } = useLanguage();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      if (!policyId) return;
      try {
        const docRef = doc(db, 'policies', policyId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPolicy({ id: docSnap.id, ...docSnap.data() } as Policy);
        }
      } catch (error) {
        console.error("Error fetching policy:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, [policyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
      </div>
    );
  }

  if (!policy || policy.type !== 'html') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 px-4 uppercase tracking-tighter">
          {t.procedures.not_found}
        </h2>
        <Link to="/procedures" className="text-brand-purple font-bold uppercase tracking-widest text-xs">
          {t.nav.back}
        </Link>
      </div>
    );
  }

  const translatedTitle = language === 'vi' ? policy.title : (policy.translations?.[language]?.title || policy.title);
  const translatedContent = language === 'vi' ? policy.content : (policy.translations?.[language]?.content || policy.content);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Policy Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/procedures" 
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
            >
              <ChevronLeft size={24} />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={14} className="text-brand-purple" />
                <span className="text-[10px] font-bold uppercase tracking-[2px] text-brand-purple">
                  {t.procedures.official_policy}
                </span>
              </div>
              <h1 className="text-sm md:text-lg font-bold text-gray-900 line-clamp-1 uppercase tracking-tight">
                {translatedTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.print()}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hidden sm:block"
              title="Print"
            >
              <Printer size={20} />
            </button>
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: translatedTitle,
                    url: window.location.href
                  });
                }
              }}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
              title="Share"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Policy Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-16 min-h-[80vh]"
        >
          <div 
            className="policy-content text-gray-800 leading-relaxed font-sans text-base max-w-none"
            dangerouslySetInnerHTML={{ __html: translatedContent || '' }}
          />
        </motion.div>
        
        <footer className="py-12 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[3px]">
          &copy; {new Date().getFullYear()} NailPro Academy &bull; {t.procedures.internal_document}
        </footer>
      </main>

      <style>{`
        @media print {
          header, footer { display: none !important; }
          main { padding: 0 !important; }
          .bg-gray-50 { background-color: white !important; }
          .rounded-3xl { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
          .policy-content { font-size: 12pt !important; }
        }
      `}</style>
    </div>
  );
}
