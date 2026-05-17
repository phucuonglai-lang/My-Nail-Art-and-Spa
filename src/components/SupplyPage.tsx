import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PurchaseOrder, PurchaseOrderItem } from '../types';
import { 
  Package, Plus, Trash2, Edit2, AlertTriangle, 
  CheckCircle2, Search, ArrowLeft, Lock, ArrowRight,
  Filter, Tag, Box, BatteryWarning, Loader2, Sparkles,
  Calendar, User, ClipboardList, CheckSquare, Square, PlusCircle, MinusCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function SupplyPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  const [currentBranch, setCurrentBranch] = useState<'kendall' | 'cutlerbay' | null>(null);
  const [loginBranch, setLoginBranch] = useState<'kendall' | 'cutlerbay' | null>(null);
  const [branchPass, setBranchPass] = useState('');
  const [authError, setAuthError] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [creatorName, setCreatorName] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([{ name: '', quantity: 1, isPurchased: false }]);

  const BRANCHES = {
    kendall: { name: 'Kendall', pass: '19742', icon: '🏢' },
    cutlerbay: { name: 'Cutler Bay', pass: '18163', icon: '🌴' }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleBranchLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginBranch) return;
    
    if (branchPass === BRANCHES[loginBranch].pass) {
      setCurrentBranch(loginBranch);
      setLoginBranch(null);
      setBranchPass('');
      setAuthError('');
    } else {
      setAuthError('Mật mã không đúng!');
      setTimeout(() => setAuthError(''), 3000);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'purchase_orders'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder)));
    } catch (error) {
      console.error("Fetch Orders Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { name: '', quantity: 1, isPurchased: false }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSaveOrder = async () => {
    if (!creatorName.trim()) {
      alert("Vui lòng nhập tên người yêu cầu!");
      return;
    }
    const validItems = items.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      alert("Vui lòng nhập ít nhất một mặt hàng cần mua!");
      return;
    }

    try {
      const orderData = {
        branch: currentBranch,
        creatorName: creatorName.trim(),
        items: validItems.map(item => ({
          name: item.name.trim(),
          quantity: Number(item.quantity) || 1,
          isPurchased: !!item.isPurchased
        })),
        createdAt: editingId ? (orders.find(o => o.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: editingId ? creatorName.trim() : (orders.find(o => o.id === editingId)?.updatedBy || '')
      };

      if (editingId) {
        await updateDoc(doc(db, 'purchase_orders', editingId), orderData);
      } else {
        await addDoc(collection(db, 'purchase_orders'), orderData);
      }

      setIsAdding(false);
      setEditingId(null);
      setCreatorName('');
      setItems([{ name: '', quantity: 1, isPurchased: false }]);
      fetchOrders();
    } catch (error: any) {
      console.error("Save Order Error:", error);
      alert("Lỗi khi lưu phiếu hàng: " + (error.message || "Không rõ nguyên nhân"));
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm("Xác nhận xóa phiếu mua hàng này?")) return;
    try {
      await deleteDoc(doc(db, 'purchase_orders', id));
      fetchOrders();
    } catch (error: any) {
      console.error("Delete Order Error:", error);
      alert("Lỗi khi xóa: " + (error.message || "Không rõ nguyên nhân"));
    }
  };

  const handleToggleItemPurchased = async (orderId: string, itemIdx: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updaterName = prompt("Nhập tên của bạn để xác nhận hành động mua/sửa:", order.updatedBy || "");
    if (updaterName === null) return; // User cancelled
    if (!updaterName.trim()) {
      alert("Bạn phải nhập tên để cập nhật trạng thái!");
      return;
    }

    try {
      const updatedItems = [...order.items];
      updatedItems[itemIdx] = {
        ...updatedItems[itemIdx],
        isPurchased: !updatedItems[itemIdx].isPurchased
      };

      await updateDoc(doc(db, 'purchase_orders', orderId), {
        items: updatedItems,
        updatedAt: serverTimestamp(),
        updatedBy: updaterName.trim()
      });

      fetchOrders();
    } catch (error: any) {
      console.error("Toggle Item Purchased Error:", error);
      alert("Lỗi khi cập nhật trạng thái mua: " + (error.message || "Không rõ"));
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    if ((order.branch || 'kendall') !== currentBranch) return false;

    const matchesSearch = order.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const allPurchased = order.items.every(item => item.isPurchased);
    const matchesFilter = filter === 'all' || 
                          (filter === 'completed' && allPurchased) ||
                          (filter === 'pending' && !allPurchased);

    return matchesSearch && matchesFilter;
  });

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Chưa ghi nhận';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
    }
    return new Date(timestamp).toLocaleString('vi-VN');
  };

  // RENDERING LOGIC

  // 1. Branch Selector Dashboard
  if (!currentBranch) {
    return (
      <div className="min-h-screen bg-transparent pt-24 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-brand-blue/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full mb-6"
            >
              <Sparkles size={16} className="text-brand-blue" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-[3px]">Hệ Thống Phiếu Hàng Yêu Cầu</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">
              CHỌN <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-cyan-400">CHI NHÁNH</span>
            </h1>
            <p className="text-white/30 font-bold uppercase tracking-widest text-xs">Vui lòng chọn cơ sở để xem và tạo phiếu hàng cần mua</p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 mb-20">
            {Object.entries(BRANCHES).map(([id, info], idx) => (
              <motion.button
                key={id}
                initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileActive={{ scale: 0.98 }}
                onClick={() => setLoginBranch(id as any)}
                className="group relative bg-brand-card/50 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] text-left transition-all hover:border-brand-blue/50 hover:shadow-[0_20px_50px_rgba(59,130,246,0.1)]"
              >
                <div className="text-6xl mb-6 grayscale group-hover:grayscale-0 transition-all transform group-hover:scale-110 duration-500">{info.icon}</div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Chi Nhánh {info.name}</h2>
                <p className="text-white/30 text-sm font-medium uppercase tracking-widest mb-8">Yêu cầu mua hàng & Đánh dấu đã mua</p>
                <div className="flex items-center gap-2 text-brand-blue font-black text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                  Truy cập ngay <ArrowRight size={16} />
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/" className="text-white/20 hover:text-white transition-colors uppercase text-[10px] font-black tracking-[4px] flex items-center justify-center gap-3">
              <ArrowLeft size={14} /> Quay lại trang chủ
            </Link>
          </div>
        </div>

        {/* Password Modal */}
        <AnimatePresence>
          {loginBranch && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setLoginBranch(null); setBranchPass(''); setAuthError(''); }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-brand-card border border-white/10 p-10 rounded-[40px] w-full max-w-md relative z-10 shadow-2xl"
              >
                <div className="w-20 h-20 bg-brand-blue/10 rounded-3xl flex items-center justify-center text-4xl mb-8 mx-auto">
                  {BRANCHES[loginBranch].icon}
                </div>
                <h2 className="text-2xl font-black text-white text-center uppercase tracking-tight mb-2">Đăng Nhập {BRANCHES[loginBranch].name}</h2>
                <p className="text-white/30 text-center text-sm font-medium uppercase tracking-widest mb-8">Vui lòng nhập mật mã truy cập</p>

                <form onSubmit={handleBranchLogin} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                    <input 
                      type="password" 
                      value={branchPass}
                      onChange={(e) => setBranchPass(e.target.value)}
                      placeholder="Mật mã..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-white placeholder-white/10 focus:border-brand-blue focus:outline-none transition-all text-xl tracking-[1em] text-center"
                      autoFocus
                    />
                  </div>
                  
                  {authError && <p className="text-rose-500 text-center text-sm font-bold uppercase tracking-widest">{authError}</p>}

                  <button 
                    type="submit"
                    className="w-full bg-brand-blue text-white font-black py-5 rounded-2xl uppercase tracking-[3px] shadow-lg shadow-brand-blue/20 hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                    Mở Cửa Kho <ArrowRight size={18} />
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => { setLoginBranch(null); setBranchPass(''); setAuthError(''); }}
                    className="w-full text-white/20 hover:text-white transition-colors py-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    Hủy bỏ
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-24 px-6 relative overflow-hidden">
      <div className={cn(
        "absolute top-0 left-0 w-full h-full -z-10 opacity-30 pointer-events-none",
        currentBranch === 'kendall' ? "bg-brand-blue/5" : "bg-cyan-500/5"
      )} />

      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <button 
                onClick={() => setCurrentBranch(null)}
                className="p-2 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
               >
                 <ArrowLeft size={16} />
               </button>
               <span className="text-[10px] font-black text-brand-blue uppercase tracking-[3px] bg-brand-blue/10 px-3 py-1 rounded-full">
                 Chi Nhánh: {BRANCHES[currentBranch!].name}
               </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              <ClipboardList className="text-brand-blue size-10 md:size-12" />
              PHIẾU HÀNG CẦN MUA
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setEditingId(null);
                setCreatorName('');
                setItems([{ name: '', quantity: 1, isPurchased: false }]);
                setIsAdding(true);
              }}
              className="flex items-center gap-2 bg-brand-blue text-white px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:scale-105 transition-all active:scale-95"
            >
              <Plus size={16} /> Tạo phiếu mới
            </button>
          </div>
        </header>

        {/* Filters & Search */}
        <div className="bg-brand-card border border-brand-border rounded-[24px] p-2 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 shadow-2xl">
          <div className="flex bg-white/5 p-1 rounded-[18px] w-full md:w-auto overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => setFilter('all')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all whitespace-nowrap",
                filter === 'all' ? "bg-white text-brand-bg shadow-md" : "text-white/40 hover:text-white"
              )}
            >
              Tất cả phiếu
            </button>
            <button 
              onClick={() => setFilter('pending')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 whitespace-nowrap",
                filter === 'pending' ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" : "text-rose-500/60 hover:text-rose-500"
              )}
            >
              Chưa hoàn thành
            </button>
            <button 
              onClick={() => setFilter('completed')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 whitespace-nowrap",
                filter === 'completed' ? "bg-green-500 text-white shadow-md shadow-green-500/20" : "text-green-500/60 hover:text-green-500"
              )}
            >
              Đã mua xong
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 size-4" />
            <input 
              type="text" 
              placeholder="Tìm theo người tạo hoặc sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[18px] pl-12 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
        </div>

        {/* Content list of orders */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-brand-blue size-10" />
          </div>
        ) : (
          <div className="grid gap-6">
            <AnimatePresence>
              {filteredOrders.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="py-16 text-center bg-brand-card rounded-[32px] border border-dashed border-white/10"
                >
                  <Box className="mx-auto size-12 text-white/10 mb-4" />
                  <p className="text-white/30 text-sm font-medium uppercase tracking-widest">Không tìm thấy phiếu yêu cầu mua hàng nào</p>
                </motion.div>
              )}

              {filteredOrders.map((order, idx) => {
                const isAllPurchased = order.items.every(item => item.isPurchased);
                return (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "bg-brand-card p-6 md:p-8 rounded-[32px] border transition-all flex flex-col justify-between gap-6 shadow-2xl relative overflow-hidden",
                      isAllPurchased ? "border-green-500/20 bg-green-500/[0.02]" : "border-brand-border hover:border-brand-blue/30"
                    )}
                  >
                    {/* Status accent glow */}
                    <div className={cn(
                      "absolute top-0 left-0 w-full h-[3px]",
                      isAllPurchased ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-gradient-to-r from-rose-500 to-orange-400"
                    )} />

                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg",
                          isAllPurchased ? "bg-green-500/10 text-green-500" : "bg-rose-500/10 text-rose-500"
                        )}>
                          <ClipboardList size={22} />
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-2">
                            Phiếu Mua Hàng #{order.id.substring(0, 5).toUpperCase()}
                            {isAllPurchased ? (
                              <span className="text-[9px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Hoàn tất</span>
                            ) : (
                              <span className="text-[9px] bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Đang chờ</span>
                            )}
                          </h3>
                          <p className="text-white/40 text-xs mt-0.5 flex items-center gap-2 font-medium">
                            <User size={12} className="text-brand-blue" />
                            <span>Người yêu cầu: </span>
                            <span className="text-white font-bold">{order.creatorName}</span>
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button 
                          onClick={() => {
                            setEditingId(order.id);
                            setCreatorName(order.creatorName);
                            setItems(order.items);
                            setIsAdding(true);
                          }}
                          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-md active:scale-95"
                          title="Sửa phiếu"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-md active:scale-95"
                          title="Xóa phiếu"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Card Content: List of Items to Buy */}
                    <div className="bg-black/20 rounded-2xl p-4 md:p-6 border border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-[2px] text-white/30 mb-4 block">Mặt hàng cần mua (Click để gạch ngang khi đã mua)</p>
                      
                      <div className="grid gap-3 sm:grid-cols-2">
                        {order.items.map((item, itemIdx) => (
                          <div 
                            key={itemIdx}
                            onClick={() => handleToggleItemPurchased(order.id, itemIdx)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] select-none",
                              item.isPurchased 
                                ? "bg-green-500/5 border-green-500/20 text-white/40" 
                                : "bg-white/5 border-white/5 text-white hover:bg-white/10 hover:border-white/10"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {item.isPurchased ? (
                                <CheckCircle2 className="text-green-500 shrink-0" size={18} />
                              ) : (
                                <div className="w-[18px] h-[18px] rounded-md border border-white/20 shrink-0" />
                              )}
                              <span className={cn(
                                "font-bold text-sm",
                                item.isPurchased && "line-through text-white/30"
                              )}>
                                {item.name}
                              </span>
                            </div>
                            <span className={cn(
                              "text-xs px-2.5 py-1 rounded-lg font-black shrink-0",
                              item.isPurchased ? "bg-green-500/10 text-green-500" : "bg-brand-blue/20 text-brand-blue"
                            )}>
                              SL: {item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer: History Log */}
                    <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between gap-4 text-[10px] text-white/30 font-bold tracking-wider uppercase bg-transparent">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-brand-blue" />
                        <span>Ngày tạo: </span>
                        <span className="text-white/60">{formatDate(order.createdAt)}</span>
                        <span>bởi</span>
                        <span className="text-white/60">{order.creatorName}</span>
                      </div>
                      
                      {order.updatedAt && (
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-cyan-400" />
                          <span>Ngày sửa: </span>
                          <span className="text-white/60">{formatDate(order.updatedAt)}</span>
                          {order.updatedBy && (
                            <>
                              <span>bởi</span>
                              <span className="text-white/60">{order.updatedBy}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create/Edit Sheet Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-white/10 rounded-[32px] p-8 w-full max-w-2xl relative z-10 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <header className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                  <ClipboardList className="text-brand-blue" />
                  {editingId ? 'Chỉnh sửa phiếu mua hàng' : 'Tạo phiếu mua hàng mới'}
                </h2>
                <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full font-black tracking-widest uppercase">
                  Chi nhánh: {BRANCHES[currentBranch!].name}
                </span>
              </header>

              <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 flex-1 mb-8">
                {/* Creator Input */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[2px] text-white/40 block mb-2">Người tạo phiếu (Nhập tên của bạn)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <input 
                      type="text" 
                      value={creatorName} 
                      onChange={(e) => setCreatorName(e.target.value)}
                      placeholder="Nhập tên đầy đủ..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-white/20 focus:border-brand-blue focus:outline-none transition-colors font-bold text-sm"
                    />
                  </div>
                </div>

                {/* Items rows input */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-white/40">Danh sách sản phẩm cần mua</label>
                    <button 
                      type="button"
                      onClick={handleAddItemRow}
                      className="flex items-center gap-1.5 text-brand-blue hover:text-brand-blue/80 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                      <PlusCircle size={14} /> Thêm sản phẩm
                    </button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/5">
                        <span className="text-white/20 font-black text-xs min-w-[1.5rem] text-center">{idx + 1}</span>
                        <input 
                          type="text" 
                          value={item.name} 
                          onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                          placeholder="Tên sản phẩm cần mua..."
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/20 focus:border-brand-blue focus:outline-none transition-colors text-sm font-semibold"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/30 hidden sm:inline">Số lượng</label>
                          <input 
                            type="number" 
                            min="1" 
                            value={item.quantity} 
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-16 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-brand-blue focus:outline-none transition-colors text-center font-bold text-sm"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          disabled={items.length === 1}
                          className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl disabled:opacity-20 disabled:pointer-events-none transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 border-t border-white/5 pt-6">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-colors text-xs uppercase tracking-widest border border-white/10"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleSaveOrder}
                  className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-4 rounded-2xl transition-colors text-xs uppercase tracking-widest shadow-lg shadow-brand-blue/20"
                >
                  Lưu Phiếu Hàng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
