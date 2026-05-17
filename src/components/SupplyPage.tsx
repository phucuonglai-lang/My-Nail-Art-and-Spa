import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderHistory } from '../types';
import { 
  Package, Plus, Trash2, Edit2, AlertTriangle, 
  CheckCircle2, Search, ArrowLeft, Lock, ArrowRight,
  Filter, Tag, Box, BatteryWarning, Loader2, Sparkles,
  Calendar, User, ClipboardList, CheckSquare, Square, PlusCircle, MinusCircle, Clock, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function SupplyPage() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [branchFilter, setBranchFilter] = useState<'all' | 'kendall' | 'cutlerbay'>('all');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [creatorName, setCreatorName] = useState('');
  const [orderBranch, setOrderBranch] = useState<'kendall' | 'cutlerbay'>('kendall');
  const [items, setItems] = useState<PurchaseOrderItem[]>([{ name: '', quantity: 1, isPurchased: false }]);

  // Local changes state before clicking save
  const [localChanges, setLocalChanges] = useState<Record<string, PurchaseOrderItem[]>>({});

  const BRANCH_INFO = {
    kendall: { name: 'Kendall', icon: '🏢', color: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20' },
    cutlerbay: { name: 'Cutler Bay', icon: '🌴', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
      const orderData: any = {
        branch: orderBranch,
        creatorName: creatorName.trim(),
        items: validItems.map(item => ({
          name: item.name.trim(),
          quantity: Number(item.quantity) || 1,
          isPurchased: !!item.isPurchased
        })),
        createdAt: editingId ? (orders.find(o => o.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: creatorName.trim()
      };

      if (editingId) {
        // Append new edit to history
        const oldOrder = orders.find(o => o.id === editingId);
        const newHistory = [...(oldOrder?.history || [])];
        newHistory.push({
          updatedBy: creatorName.trim(),
          updatedAt: new Date()
        });
        orderData.history = newHistory;

        await updateDoc(doc(db, 'purchase_orders', editingId), orderData);
      } else {
        orderData.history = [];
        await addDoc(collection(db, 'purchase_orders'), orderData);
      }

      setIsAdding(false);
      setEditingId(null);
      setCreatorName('');
      setOrderBranch('kendall');
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

  const handleToggleItemPurchasedLocal = (orderId: string, itemIdx: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const currentItems = localChanges[orderId]
      ? [...localChanges[orderId]]
      : order.items.map(item => ({ ...item }));

    currentItems[itemIdx].isPurchased = !currentItems[itemIdx].isPurchased;

    setLocalChanges(prev => ({
      ...prev,
      [orderId]: currentItems
    }));
  };

  const handleSaveLocalChanges = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    const updatedItems = localChanges[orderId];
    if (!order || !updatedItems) return;

    const updaterName = prompt("Nhập tên của bạn để xác nhận hành động mua/sửa:", order.updatedBy || "");
    if (updaterName === null) return; // User cancelled
    if (!updaterName.trim()) {
      alert("Bạn phải nhập tên để lưu thay đổi!");
      return;
    }

    try {
      const newHistory = [...(order.history || [])];
      newHistory.push({
        updatedBy: updaterName.trim(),
        updatedAt: new Date()
      });

      await updateDoc(doc(db, 'purchase_orders', orderId), {
        items: updatedItems,
        updatedAt: serverTimestamp(),
        updatedBy: updaterName.trim(),
        history: newHistory
      });

      setLocalChanges(prev => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });

      fetchOrders();
    } catch (error: any) {
      console.error("Save Local Changes Error:", error);
      alert("Lỗi khi cập nhật trạng thái mua: " + (error.message || "Không rõ"));
    }
  };

  const handleCancelLocalChanges = (orderId: string) => {
    setLocalChanges(prev => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    // 1. Branch filter
    if (branchFilter !== 'all' && (order.branch || 'kendall') !== branchFilter) return false;

    // 2. Search matches creator name or item names
    const displayItems = localChanges[order.id] || order.items;
    const matchesSearch = order.creatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          displayItems.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // 3. Status filter
    const allPurchased = displayItems.every(item => item.isPurchased);
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

  return (
    <div className="min-h-screen bg-transparent pt-24 pb-24 px-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-brand-blue/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <Link 
                to="/"
                className="p-2 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all"
               >
                 <ArrowLeft size={16} />
               </Link>
               <span className="text-[10px] font-black text-brand-blue uppercase tracking-[3px] bg-brand-blue/10 px-3 py-1 rounded-full">
                 Bảng điều khiển chung
               </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              <ClipboardList className="text-brand-blue size-10 md:size-12 animate-pulse" />
              PHIẾU HÀNG CẦN MUA
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setEditingId(null);
                setCreatorName('');
                setOrderBranch('kendall');
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
        <div className="bg-brand-card border border-brand-border rounded-[24px] p-4 flex flex-col gap-4 mb-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Branch Filter Tabs */}
            <div className="flex bg-white/5 p-1 rounded-[18px] w-full md:w-auto overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setBranchFilter('all')}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all whitespace-nowrap",
                  branchFilter === 'all' ? "bg-white text-brand-bg shadow-md" : "text-white/40 hover:text-white"
                )}
              >
                Tất cả chi nhánh
              </button>
              <button 
                onClick={() => setBranchFilter('kendall')}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-1.5 whitespace-nowrap",
                  branchFilter === 'kendall' ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20" : "text-white/40 hover:text-white"
                )}
              >
                🏢 Kendall
              </button>
              <button 
                onClick={() => setBranchFilter('cutlerbay')}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-1.5 whitespace-nowrap",
                  branchFilter === 'cutlerbay' ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-white/40 hover:text-white"
                )}
              >
                🌴 Cutler Bay
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-white/5 p-1 rounded-[18px] w-full md:w-auto overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setFilter('all')}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all whitespace-nowrap",
                  filter === 'all' ? "bg-white text-brand-bg shadow-md" : "text-white/40 hover:text-white"
                )}
              >
                Tất cả trạng thái
              </button>
              <button 
                onClick={() => setFilter('pending')}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 whitespace-nowrap",
                  filter === 'pending' ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" : "text-rose-500/60 hover:text-rose-500"
                )}
              >
                Chưa mua xong
              </button>
              <button 
                onClick={() => setFilter('completed')}
                className={cn(
                  "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 whitespace-nowrap",
                  filter === 'completed' ? "bg-green-500 text-white shadow-md shadow-green-500/20" : "text-green-500/60 hover:text-green-500"
                )}
              >
                Đã mua xong
              </button>
            </div>

          </div>

          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 size-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm phiếu theo tên người tạo hoặc tên sản phẩm cần mua..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[18px] pl-12 pr-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-blue transition-colors"
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
                const displayItems = localChanges[order.id] || order.items;
                const isAllPurchased = displayItems.every(item => item.isPurchased);
                const hasChanges = !!localChanges[order.id];
                const branch = order.branch || 'kendall';
                const branchObj = BRANCH_INFO[branch] || BRANCH_INFO.kendall;

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
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-2">
                              Phiếu Mua Hàng #{order.id.substring(0, 5).toUpperCase()}
                            </h3>
                            <span className={cn(
                              "text-[9px] px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider",
                              branchObj.color
                            )}>
                              {branchObj.icon} {branchObj.name}
                            </span>
                            {isAllPurchased ? (
                              <span className="text-[9px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Hoàn tất</span>
                            ) : (
                              <span className="text-[9px] bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Đang chờ</span>
                            )}
                          </div>
                          <p className="text-white/40 text-xs mt-1.5 flex items-center gap-2 font-medium">
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
                            setOrderBranch(order.branch || 'kendall');
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
                        {displayItems.map((item, itemIdx) => (
                          <div 
                            key={itemIdx}
                            onClick={() => handleToggleItemPurchasedLocal(order.id, itemIdx)}
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

                      {/* Local Changes Save / Reset Banner */}
                      {hasChanges && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 flex items-center justify-end gap-3 border-t border-white/5 pt-4"
                        >
                          <button 
                            onClick={() => handleCancelLocalChanges(order.id)}
                            className="px-4 py-2.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/5 active:scale-95"
                          >
                            Hủy bỏ thay đổi
                          </button>
                          <button 
                            onClick={() => handleSaveLocalChanges(order.id)}
                            className="px-5 py-2.5 rounded-xl bg-brand-blue text-white hover:bg-brand-blue/90 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-blue/20 flex items-center gap-2 active:scale-95 animate-pulse hover:animate-none"
                          >
                            <CheckCircle2 size={12} /> Lưu thay đổi
                          </button>
                        </motion.div>
                      )}
                    </div>

                    {/* Card Footer: History Log */}
                    <div className="flex flex-col gap-4">
                      {/* Creation Log */}
                      <div className="text-[10px] text-white/30 font-bold tracking-wider uppercase flex items-center gap-2 bg-transparent pt-2">
                        <Calendar size={12} className="text-brand-blue" />
                        <span>Ngày tạo phiếu: </span>
                        <span className="text-white/60">{formatDate(order.createdAt)}</span>
                        <span>bởi</span>
                        <span className="text-white/60">{order.creatorName}</span>
                      </div>

                      {/* History Log List */}
                      {order.history && order.history.length > 0 ? (
                        <div className="border-t border-white/5 pt-4">
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2.5">Lịch sử sửa đổi ({order.history.length}):</p>
                          <div className="grid gap-2 max-h-36 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/10">
                            {order.history.map((hist, histIdx) => (
                              <div key={histIdx} className="flex items-center justify-between text-[10px] text-white/40 font-bold bg-white/[0.02] px-3.5 py-2 rounded-xl border border-white/5">
                                <div className="flex items-center gap-1.5">
                                  <User size={10} className="text-brand-blue" />
                                  <span>{hist.updatedBy}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Clock size={10} className="text-cyan-400" />
                                  <span>{formatDate(hist.updatedAt)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : order.updatedAt ? (
                        /* Backward compatibility log */
                        <div className="border-t border-white/5 pt-4 text-[10px] text-white/30 font-bold tracking-wider uppercase flex items-center gap-2">
                          <Clock size={12} className="text-cyan-400" />
                          <span>Cập nhật cuối: </span>
                          <span className="text-white/60">{formatDate(order.updatedAt)}</span>
                          {order.updatedBy && (
                            <>
                              <span>bởi</span>
                              <span className="text-white/60">{order.updatedBy}</span>
                            </>
                          )}
                        </div>
                      ) : null}
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
              </header>

              <div className="space-y-6 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 flex-1 mb-8">
                
                {/* Branch Selection & Creator Name Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  
                  {/* Branch selector */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-white/40 block mb-2">Chi nhánh yêu cầu</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <select 
                        value={orderBranch}
                        onChange={(e) => setOrderBranch(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-white focus:border-brand-blue focus:outline-none transition-colors font-bold text-sm appearance-none"
                      >
                        <option value="kendall">🏢 Kendall</option>
                        <option value="cutlerbay">🌴 Cutler Bay</option>
                      </select>
                    </div>
                  </div>

                  {/* Creator input */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[2px] text-white/40 block mb-2">Người yêu cầu (Nhập tên của bạn)</label>
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
