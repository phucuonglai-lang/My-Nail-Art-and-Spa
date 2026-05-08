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
  Users,
  Pencil,
  RotateCcw,
  Eraser,
  Download,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

// --- Annotation Component ---
const ImageAnnotator = ({ imageUrl, onSave, onClose }: { imageUrl: string, onSave: (dataUrl: string) => void, onClose: () => void }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#ff2d55');
  const [brushSize, setBrushSize] = useState(4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      // Set canvas size to match image aspect ratio but fit in viewport
      const maxWidth = window.innerWidth * 0.8;
      const maxHeight = window.innerHeight * 0.7;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = height * (maxWidth / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = width * (maxHeight / height);
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Set initial brush style
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
  }, [imageUrl]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.beginPath(); // Reset path
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      const rect = canvas.getBoundingClientRect();
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/jpeg', 0.8));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
      <div className="w-full max-w-4xl flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Khoanh tròn lỗi kỹ thuật</h2>
        <div className="flex gap-4">
          <button onClick={clearCanvas} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
            <RotateCcw size={20} />
          </button>
          <button onClick={handleSave} className="px-8 py-3 bg-brand-accent text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-accent/30">
            Lưu ảnh đã vẽ
          </button>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative bg-white/5 p-2 rounded-[32px] border border-white/10 shadow-2xl overflow-hidden cursor-crosshair">
        <canvas 
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="rounded-[24px] touch-none"
        />
      </div>
      
      <div className="mt-8 flex gap-6 bg-white/5 p-4 rounded-3xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Màu sắc</div>
          {['#ff2d55', '#ffcc00', '#007aff', '#4cd964'].map(c => (
            <button 
              key={c} 
              onClick={() => setBrushColor(c)}
              className={cn("w-8 h-8 rounded-full border-2", brushColor === c ? "border-white scale-110 shadow-lg" : "border-transparent opacity-50")}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex items-center gap-3">
          <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Cỡ bút</div>
          {[2, 4, 8, 12].map(s => (
            <button 
              key={s} 
              onClick={() => setBrushSize(s)}
              className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs transition-all", brushSize === s ? "bg-white/10 text-brand-accent" : "text-white/20 hover:text-white")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function PortfolioPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [works, setWorks] = useState<PortfolioWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'timeline' | 'analytics'>('timeline');
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Hierarchical States
  const [technicians, setTechnicians] = useState<{uid: string, name: string}[]>([]);
  const [selectedTech, setSelectedTech] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Form states
  const [newWork, setNewWork] = useState<Partial<PortfolioWork>>({
    imageUrl: '',
    tags: [],
    duration: '',
    notes: '',
    category: 'Manicure',
    level: 1,
    technicianId: '',
    technicianName: ''
  });

  const categories = ['Manicure', 'Pedicure', 'Gel-X', 'Acrylic', 'Dipping'];
  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    fetchWorks();
  }, [selectedTech, selectedMonth, selectedYear]);

  const fetchTechnicians = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ uid: doc.id, name: doc.data().displayName }));
      setTechnicians(list);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWorks = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'portfolios'), orderBy('createdAt', 'desc'));
      
      if (selectedTech !== 'all') {
        q = query(collection(db, 'portfolios'), where('technicianId', '==', selectedTech), orderBy('createdAt', 'desc'));
      }
      
      const snap = await getDocs(q);
      let allWorks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioWork));
      
      // Filter by month/year on client side for simplicity or use complex query
      const filtered = allWorks.filter(w => {
        const date = w.createdAt?.toDate ? w.createdAt.toDate() : new Date(w.createdAt);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });

      setWorks(filtered);
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
    if (!newWork.imageUrl || !newWork.technicianId) {
      alert("Vui lòng chọn nhân viên và tải ảnh lên");
      return;
    }

    setUploading(true);
    try {
      const selectedTechnician = technicians.find(t => t.uid === newWork.technicianId);
      
      await addDoc(collection(db, 'portfolios'), {
        ...newWork,
        technicianName: selectedTechnician?.name || 'Technician',
        createdAt: serverTimestamp(),
        evaluations: []
      });
      setIsAdding(false);
      setNewWork({ imageUrl: '', tags: [], duration: '', notes: '', category: 'Manicure', level: 1, technicianId: '', technicianName: '' });
      fetchWorks();
    } catch (error) {
      alert("Error saving work");
    } finally {
      setUploading(false);
    }
  };

  const [selectedWork, setSelectedWork] = useState<PortfolioWork | null>(null);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [evaluationForm, setEvaluationForm] = useState({
    shape: 5,
    cuticle: 5,
    durability: 5,
    aesthetics: 5,
    feedback: '',
    annotatedImageUrl: ''
  });

  const handleAddEvaluation = async (workId: string) => {
    setUploading(true);
    try {
      const workRef = doc(db, 'portfolios', workId);
      const newEval: WorkEvaluation = {
        id: crypto.randomUUID(),
        evaluatorId: profile?.uid || 'admin-local',
        evaluatorName: profile?.displayName || 'Quản lý',
        ratings: {
          shape: evaluationForm.shape,
          cuticle: evaluationForm.cuticle,
          durability: evaluationForm.durability,
          aesthetics: evaluationForm.aesthetics
        },
        feedback: evaluationForm.feedback,
        annotatedImageUrl: evaluationForm.annotatedImageUrl,
        createdAt: new Date().toISOString()
      };

      const work = works.find(w => w.id === workId);
      const updatedEvals = [...(work?.evaluations || []), newEval];
      
      await updateDoc(workRef, { evaluations: updatedEvals });
      setSelectedWork(null);
      setEvaluationForm({ shape: 5, cuticle: 5, durability: 5, aesthetics: 5, feedback: '', annotatedImageUrl: '' });
      fetchWorks();
    } catch (error) {
      console.error(error);
      alert("Lỗi lưu đánh giá. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddTechnician = async () => {
    const name = prompt("Nhập tên nhân viên mới:");
    if (!name) return;
    
    setUploading(true);
    try {
      const newId = 'tech-' + Date.now();
      await addDoc(collection(db, 'users'), {
        uid: newId,
        displayName: name,
        role: 'student',
        createdAt: new Date().toISOString(),
        enrolledCourses: []
      });
      fetchTechnicians();
    } catch (e) {
      alert("Lỗi thêm nhân viên");
    } finally {
      setUploading(false);
    }
  };

  const getAverageRating = (work: PortfolioWork) => {
    if (!work.evaluations || work.evaluations.length === 0) return 0;
    const total = work.evaluations.reduce((acc, curr) => {
      const avg = (curr.ratings.shape + curr.ratings.cuticle + curr.ratings.durability + curr.ratings.aesthetics) / 4;
      return acc + avg;
    }, 0);
    return total / work.evaluations.length;
  };

  if (loading && works.length === 0 && technicians.length === 0) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 max-w-full">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Sidebar: Technicians */}
        <aside className="lg:w-80 shrink-0">
          <div className="bg-white/5 rounded-[40px] p-8 border border-white/5 sticky top-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <Users className="text-brand-accent" /> Nhân Viên
              </h2>
              <button 
                onClick={handleAddTechnician}
                className="w-8 h-8 bg-brand-accent/20 text-brand-accent rounded-full flex items-center justify-center hover:bg-brand-accent hover:text-white transition-all"
                title="Thêm nhân viên mới"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => setSelectedTech('all')}
                className={cn(
                  "w-full text-left p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                  selectedTech === 'all' ? "bg-brand-accent text-white shadow-lg" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                Tất cả nhân viên
              </button>
              {technicians.map(tech => (
                <button 
                  key={tech.uid}
                  onClick={() => setSelectedTech(tech.uid)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                    selectedTech === tech.uid ? "bg-brand-accent text-white shadow-lg" : "text-white/40 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {tech.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">
                {selectedTech === 'all' ? 'Tổng Hợp Hồ Sơ' : technicians.find(t => t.uid === selectedTech)?.name}
              </h1>
              <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
                Quản lý tay nghề theo tháng & nhân viên
              </p>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-xl overflow-x-auto max-w-md no-scrollbar">
              {months.map((m, idx) => (
                <button 
                  key={m}
                  onClick={() => setSelectedMonth(idx)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    selectedMonth === idx ? "bg-brand-accent text-white shadow-lg" : "text-white/40 hover:text-white"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </header>

          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white/50 uppercase tracking-widest flex items-center gap-3">
                <ImageIcon size={20} className="text-brand-accent" /> Tác Phẩm {months[selectedMonth]}
              </h2>
              <button 
                onClick={() => setIsAdding(true)}
                className="bg-brand-accent text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-brand-accent/20"
              >
                <Plus size={16} /> Đăng Tác Phẩm Mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence>
                {works.map((work, idx) => (
                  <motion.div
                    key={work.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white/5 rounded-[32px] border border-white/5 overflow-hidden group hover:border-brand-accent/30 transition-all hover:shadow-2xl cursor-pointer"
                    onClick={() => setSelectedWork(work)}
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
                          <Star key={s} size={10} className={cn(s <= Math.round(getAverageRating(work)) ? "text-amber-400 fill-amber-400" : "text-white/10")} />
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
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Chọn Nhân Viên</label>
                  <select 
                    required
                    value={newWork.technicianId}
                    onChange={e => setNewWork({...newWork, technicianId: e.target.value})}
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-brand-accent transition-colors"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {technicians.map(tech => <option key={tech.uid} value={tech.uid}>{tech.name}</option>)}
                  </select>
                </div>

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

      {/* Detail & Evaluation Modal */}
      <AnimatePresence>
        {selectedWork && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWork(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#121212] w-full max-w-4xl rounded-[40px] p-8 border border-white/10 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] grid grid-cols-1 md:grid-cols-2 gap-10"
            >
              <button 
                onClick={() => setSelectedWork(null)}
                className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              {/* Left: Image & Info */}
              <div>
                <div className="aspect-square rounded-[32px] overflow-hidden mb-6">
                  <img src={selectedWork.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-brand-accent px-3 py-1 rounded-full text-white">{selectedWork.category}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full text-white/40">Cấp {selectedWork.level}</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-6">
                  {selectedWork.notes || "Không có ghi chú thêm từ thợ."}
                </p>
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/20">Thực hiện bởi</h4>
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center font-black text-white">
                      {selectedWork.technicianName[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{selectedWork.technicianName}</div>
                      <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Technician</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Evaluations */}
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
                  <Star className="text-amber-400 fill-amber-400" /> Đánh giá & Góp ý
                </h3>

                <div className="flex-1 space-y-6 overflow-y-auto pr-2 max-h-[400px]">
                  {selectedWork.evaluations && selectedWork.evaluations.length > 0 ? (
                    selectedWork.evaluations.map((evalItem) => (
                      <div key={evalItem.id} className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="text-[10px] font-black text-brand-accent uppercase tracking-widest">{evalItem.evaluatorName}</div>
                          <div className="text-[9px] text-white/20">{new Date(evalItem.createdAt).toLocaleDateString()}</div>
                        </div>
                        
                        {evalItem.annotatedImageUrl && (
                          <div className="aspect-video rounded-2xl overflow-hidden mb-4 border border-white/10">
                            <img src={evalItem.annotatedImageUrl} alt="Góp ý hình ảnh" className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {Object.entries(evalItem.ratings).map(([key, val]) => (
                            <div key={key} className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-white/40 uppercase">{key}</span>
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => <div key={s} className={cn("w-1.5 h-1.5 rounded-full", s <= val ? "bg-amber-400" : "bg-white/10")} />)}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-white/70 italic">"{evalItem.feedback}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                      <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Chưa có đánh giá nào.</p>
                    </div>
                  )}
                </div>

                {/* Admin Grading Form */}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Chấm điểm & Nhận xét</h4>
                      <button 
                        onClick={() => setShowAnnotator(true)}
                        className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-brand-accent transition-all"
                      >
                        <Pencil size={12} /> {evaluationForm.annotatedImageUrl ? 'Sửa hình đã vẽ' : 'Vẽ/Góp ý trên ảnh'}
                      </button>
                    </div>
                    
                    {evaluationForm.annotatedImageUrl && (
                      <div className="mb-6 relative group">
                        <img src={evaluationForm.annotatedImageUrl} className="w-full aspect-video object-cover rounded-2xl border border-brand-accent/50" alt="" />
                        <button 
                          onClick={() => setEvaluationForm({...evaluationForm, annotatedImageUrl: ''})}
                          className="absolute top-2 right-2 p-1 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      {['shape', 'cuticle', 'durability', 'aesthetics'].map((field) => (
                        <div key={field}>
                          <label className="text-[9px] font-bold text-white/40 uppercase mb-2 block">{field}</label>
                          <div className="flex gap-2">
                            {[1,2,3,4,5].map(s => (
                              <button 
                                key={s}
                                onClick={() => setEvaluationForm({...evaluationForm, [field]: s})}
                                className={cn(
                                  "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                  (evaluationForm as any)[field] >= s ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20" : "bg-white/5 text-white/20"
                                )}
                              >
                                <Star size={12} fill={ (evaluationForm as any)[field] >= s ? "currentColor" : "none" } />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <textarea 
                      value={evaluationForm.feedback}
                      onChange={e => setEvaluationForm({...evaluationForm, feedback: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white mb-4 outline-none focus:border-brand-accent transition-colors"
                      placeholder="Viết lời khuyên hoặc góp ý kỹ thuật..."
                    />
                    <button 
                      onClick={() => handleAddEvaluation(selectedWork.id)}
                      disabled={uploading}
                      className="w-full bg-brand-accent text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-accent/20 flex items-center justify-center gap-2"
                    >
                      {uploading ? <Loader2 size={16} className="animate-spin" /> : <MessageSquare size={16} />}
                      Gửi Đánh Giá
                    </button>
                  </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Image Annotator Tool */}
      {showAnnotator && selectedWork && (
        <ImageAnnotator 
          imageUrl={selectedWork.imageUrl}
          onClose={() => setShowAnnotator(false)}
          onSave={(dataUrl) => {
            setEvaluationForm({ ...evaluationForm, annotatedImageUrl: dataUrl });
            setShowAnnotator(false);
          }}
        />
      )}
        </div>
      </div>
    </div>
  );
}
