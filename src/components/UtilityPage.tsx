import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function UtilityPage() {
  const { id } = useParams();
  const [htmlCode, setHtmlCode] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUtility() {
      if (!id) return;
      try {
        const docRef = doc(db, 'utilities', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHtmlCode(data.code);
          setTitle(data.title || 'Tiện ích');
        } else {
          setHtmlCode('<div style="color:black; font-family:sans-serif; text-align:center; padding: 2rem;">Không tìm thấy tiện ích này.</div>');
          setTitle('Lỗi');
        }
      } catch (error) {
        console.error("Error fetching utility:", error);
        setHtmlCode('<div style="color:red; font-family:sans-serif; text-align:center; padding: 2rem;">Lỗi tải dữ liệu.</div>');
      } finally {
        setLoading(false);
      }
    }

    fetchUtility();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] pt-16">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-white/60">Đang tải tiện ích...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col bg-brand-bg">
      <div className="px-6 py-4 bg-brand-bg/80 border-b border-brand-border backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <h1 className="text-xl font-bold text-white tracking-wide">{title}</h1>
      </div>
      <div className="flex-1 bg-white relative w-full overflow-hidden">
        {htmlCode && (
          <iframe 
            srcDoc={htmlCode}
            title={title}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  );
}
