import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import { PortfolioWork, WorkEvaluation } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Clock, 
  Tag, 
  Star, 
  TrendingUp, 
  History, 
  ChevronRight, 
  Plus,
  Filter,
  MessageSquare,
  Award,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  BarChart3,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

export default function PortfolioPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timeline' | 'upload' | 'analytics'>('timeline');
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form states
  const [newWork, setNewWork] = useState<Partial<PortfolioWork>>({
    imageUrl: '',
    tags: [],
    duration: '',
    notes: '',
    category: 'Manicure',
    level: 1
  });

  const categories = ['Manicure', 'Pedicure', 'Gel-X', 'Acrylic', 'Dipping'];
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchWorks();
  }, [profile]);

  const fetchWorks = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // If admin, fetch all, if student, fetch own
      const q = profile.role === 'admin' 
        ? query(collection(db, 'portfolios'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'portfolios'), where('technicianId', '==', profile.uid), orderBy('createdAt', 'desc'));
      
      const snap = await getDocs(q);
      setWorks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioWork)));
    } catch (error) {
      console.error("Fetch Portfolio Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewWork({ ...newWork, imageUrl: event.target?.result as string });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!newWork.tags?.includes(tagInput.trim())) {
        setNewWork({ ...newWork, tags: [...(newWork.tags || []), tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNewWork({ ...newWork, tags: newWork.tags?.filter(t => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newWork.imageUrl) return;

    setUploading(true);
    try {
      await addDoc(collection(db, 'portfolios'), {
        ...newWork,
        technicianId: profile.uid,
        technicianName: profile.displayName || 'Technician',
        createdAt: serverTimestamp(),
        evaluations: []
      });
      setIsAdding(false);
      setNewWork({ imageUrl: '', tags: [], duration: '', notes: '', category: 'Manicure', level: 1 });
      fetchWorks();
    } catch (error) {
      alert("Error saving work");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mb-6">
        <Award size={40} className="text-white/20" />
      </div>
      <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Truy cập bị hạn chế</h2>
      <p className="text-white/40 text-xs font-bold uppercase tracking-widest max-w-xs mb-8">
        Vui lòng đăng nhập để xem hồ sơ tay nghề và bảng đánh giá của bạn.
      </p>
      <button 
        onClick={async () => {
          try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
          } catch (error: any) {
            console.error("Login Error:", error);
            alert("Lỗi đăng nhập: " + (error.message || "Vui lòng kiểm tra lại kết nối mạng hoặc trình duyệt (cho phép cửa sổ bật lên - popup)"));
          }
        }}
        className="bg-brand-accent text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-accent/20 hover:scale-105 transition-all"
      >
        Đăng nhập ngay
      </button>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-6xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
            Hồ Sơ Tay Nghề
          </h1>
          <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
            Technician Portfolio & Evaluation System
          </p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl">
          <button 
            onClick={() => setView('timeline')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              view === 'timeline' ? "bg-brand-accent text-white shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            <History size={14} className="inline mr-2" /> Timeline
          </button>
          <button 
            onClick={() => setView('analytics')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              view === 'analytics' ? "bg-brand-accent text-white shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            <TrendingUp size={14} className="inline mr-2" /> Tiến Độ
          </button>
        </div>
      </header>

      {view === 'timeline' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white/50 uppercase tracking-widest flex items-center gap-3">
              <ImageIcon size={20} className="text-brand-accent" /> Tác Phẩm Gần Đây
            </h2>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-brand-accent text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-brand-accent/20"
            >
              <Plus size={16} /> Đăng Tác Phẩm
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {works.map((work, idx) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 rounded-[32px] border border-white/5 overflow-hidden group hover:border-brand-accent/30 transition-all hover:shadow-2xl"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img src={work.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1.5 border border-white/10">
                      <Clock size={10} className="text-brand-accent" /> {work.duration}
                    </div>
                    {work.level && (
                      <div className="absolute top-4 left-4 bg-brand-accent px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg">
                        Cấp {work.level}
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded text-white/60">{work.category}</span>
                      {work.tags?.map(tag => (
                        <span key={tag} className="text-[9px] font-bold text-brand-accent">#{tag}</span>
                      ))}
                    </div>
                    <h3 className="text-white font-bold text-sm mb-2 line-clamp-1">{work.notes || "Không có ghi chú"}</h3>
                    <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Users size={10} /> {work.technicianName}
                    </p>
                    
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={10} className={cn(s <= 4 ? "text-amber-400 fill-amber-400" : "text-white/10")} />
                        ))}
                      </div>
                      <button className="text-[9px] font-black uppercase tracking-widest text-brand-accent hover:underline flex items-center gap-1">
                        Chi tiết <ChevronRight size={10} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {works.length === 0 && (
              <div className="col-span-full py-24 text-center bg-white/5 rounded-[40px] border border-dashed border-white/10">
                <p className="text-white/20 font-bold uppercase tracking-widest text-sm">Chưa có tác phẩm nào được đăng.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/5 rounded-[40px] p-8 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <TrendingUp className="text-brand-accent" /> Phân Tích Kỹ Thuật
            </h2>
            <div className="space-y-6">
              {[
                { label: 'Form móng (Shape)', value: 85, color: 'bg-brand-accent' },
                { label: 'Làm sạch da (Cuticle)', value: 70, color: 'bg-brand-blue' },
                { label: 'Độ bền (Durability)', value: 95, color: 'bg-emerald-500' },
                { label: 'Thẩm mỹ (Aesthetics)', value: 80, color: 'bg-brand-purple' }
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{stat.label}</span>
                    <span className="text-[10px] font-black text-white">{stat.value}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      className={cn("h-full rounded-full", stat.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-[40px] p-8 border border-white/5 flex flex-col items-center justify-center text-center">
            <div className="w-32 h-32 rounded-full border-4 border-brand-accent flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,45,85,0.2)]">
              <div className="text-4xl font-black text-white">4.2</div>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Chuyên Viên Cấp 4</h3>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest max-w-xs">
              Bạn cần thêm 5 tác phẩm được đánh giá 5 sao để tiến tới Cấp 5 (Master).
            </p>
            <div className="mt-8 flex gap-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className={cn("w-3 h-3 rounded-full", i <= 4 ? "bg-brand-accent shadow-lg shadow-brand-accent/50" : "bg-white/10")} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#121212] w-full max-w-xl rounded-[40px] p-8 border border-white/10 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Đăng Tác Phẩm Mới</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="aspect-square bg-white/5 rounded-[32px] border-2 border-dashed border-white/10 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
                  {newWork.imageUrl ? (
                    <img src={newWork.imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <>
                      <Camera size={48} className="text-white/20 mb-4 group-hover:text-brand-accent transition-colors" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Chọn hoặc chụp ảnh</p>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Danh mục</label>
                    <select 
                      value={newWork.category}
                      onChange={e => setNewWork({...newWork, category: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-white text-xs font-bold outline-none"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Thời gian (phút)</label>
                    <input 
                      type="text"
                      placeholder="VD: 60"
                      value={newWork.duration}
                      onChange={e => setNewWork({...newWork, duration: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-brand-accent transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Kỹ thuật (Enter để thêm)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newWork.tags?.map(tag => (
                      <span key={tag} className="bg-brand-accent/20 text-brand-accent px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2">
                        {tag} <X size={10} className="cursor-pointer" onClick={() => removeTag(tag)} />
                      </span>
                    ))}
                  </div>
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-brand-accent transition-colors"
                    placeholder="VD: Ombre, French..."
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Ghi chú kỹ thuật</label>
                  <textarea 
                    value={newWork.notes}
                    onChange={e => setNewWork({...newWork, notes: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-white text-xs font-bold outline-none focus:border-brand-accent transition-colors min-h-[100px]"
                    placeholder="Những lưu ý khi thực hiện mẫu này..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-brand-accent text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-accent/20 flex items-center justify-center gap-2"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    Tải Tác Phẩm Lên
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-8 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:bg-white/5 transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size, className, onClick }: { size: number, className?: string, onClick?: () => void }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      onClick={onClick}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
