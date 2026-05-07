import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SupplyItem } from '../types';
import { 
  Package, Plus, Trash2, Edit2, AlertTriangle, 
  CheckCircle2, Search, ArrowLeft, Lock, ArrowRight,
  Filter, Tag, Box, BatteryWarning, Loader2, Download, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export default function SupplyPage() {
  const { t } = useLanguage();
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [newItem, setNewItem] = useState<Partial<SupplyItem>>({
    name: '',
    category: 'Sơn Gel',
    quantity: 0,
    minThreshold: 5,
    unit: 'chai',
    updatedBy: '',
    isPurchased: false
  });

  const CATEGORIES = ['Sơn Gel', 'Bột Acrylic', 'Hóa chất', 'Dụng cụ', 'Phụ kiện', 'Khác'];
  const UNITS = ['chai', 'hộp', 'set', 'cái', 'thùng', 'gói'];

  useEffect(() => {
    fetchSupplies();
  }, []);

  const fetchSupplies = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'supplies'), orderBy('name'));
      const snap = await getDocs(q);
      setSupplies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupplyItem)));
    } catch (error) {
      console.error("Fetch Supplies Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Tên vật tư,Danh mục,Số lượng,Mức cảnh báo,Đơn vị\nSơn Gel OPI Đỏ,Sơn Gel,15,5,chai\nBột đắp móng trong suốt,Bột Acrylic,8,3,hộp\nNước rửa móng Acetone,Hóa chất,10,2,chai\nDũa móng loại dày,Dụng cụ,50,20,cái\nĐá đính móng size nhỏ,Phụ kiện,200,50,gói";
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "mau_du_lieu_kho.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        // Skip header line (index 0)
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length >= 5) {
            const itemData = {
              name: cols[0],
              category: cols[1],
              quantity: parseInt(cols[2]) || 0,
              minThreshold: parseInt(cols[3]) || 5,
              unit: cols[4],
              lastUpdated: serverTimestamp()
            };
            await addDoc(collection(db, 'supplies'), itemData);
          }
        }
        alert("Nhập dữ liệu thành công!");
        fetchSupplies();
      } catch (error: any) {
        console.error("Import Error:", error);
        alert("Lỗi khi đọc file CSV hoặc lưu dữ liệu: " + (error.message || "Không xác định"));
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!newItem.name) return;
    try {
      // Remove 'id' from newItem if it exists so we don't save it in document fields during addDoc
      const { id, ...dataToSave } = newItem as any;
      
      const itemData = {
        ...dataToSave,
        quantity: Number(newItem.quantity),
        minThreshold: Number(newItem.minThreshold),
        lastUpdated: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'supplies', editingId), itemData);
      } else {
        await addDoc(collection(db, 'supplies'), itemData);
      }
      
      setIsAdding(false);
      setEditingId(null);
      setNewItem({ name: '', category: 'Sơn Gel', quantity: 0, minThreshold: 5, unit: 'chai' });
      fetchSupplies();
    } catch (error: any) {
      console.error("Save Error:", error);
      alert("Lỗi khi lưu dữ liệu: " + (error.message || "Không rõ nguyên nhân"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xác nhận xóa vật tư này?")) return;
    try {
      await deleteDoc(doc(db, 'supplies', id));
      fetchSupplies();
    } catch (error: any) {
      console.error("Delete Error:", error);
      alert("Lỗi khi xóa: " + (error.message || "Không rõ nguyên nhân"));
    }
  };

  const updateQuantity = async (id: string, current: number, amount: number) => {
    const newQty = Math.max(0, current + amount);
    try {
      await updateDoc(doc(db, 'supplies', id), { 
        quantity: newQty,
        lastUpdated: serverTimestamp()
      });
      fetchSupplies();
    } catch (error: any) {
      console.error("Update Qty Error:", error);
      alert("Lỗi khi cập nhật số lượng: " + (error.message || "Không rõ nguyên nhân"));
    }
  };

  const togglePurchased = async (id: string, currentStatus: boolean, itemName: string) => {
    const updaterName = prompt(`Ai đang đánh dấu mua vật tư "${itemName}"?`, "Tên của bạn...");
    if (!updaterName) return; // User cancelled
    
    try {
      await updateDoc(doc(db, 'supplies', id), { 
        isPurchased: !currentStatus,
        updatedBy: updaterName,
        lastUpdated: serverTimestamp()
      });
      fetchSupplies();
    } catch (error: any) {
      console.error("Update Purchase Status Error:", error);
      alert("Lỗi khi cập nhật trạng thái mua: " + (error.message || "Không rõ nguyên nhân"));
    }
  };

  const filteredSupplies = supplies.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'low' && item.quantity <= item.minThreshold);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-brand-bg pt-24 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-blue/5 blur-[120px] rounded-full -z-10" />
          
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
              <Package className="text-brand-blue size-10 md:size-12" />
              QUẢN LÝ SUPPLY
            </h1>
            <p className="text-white/30 mt-3 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">
              Theo dõi tồn kho & Cảnh báo nhập hàng
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={downloadTemplate}
              className="flex items-center gap-2 bg-white/5 text-white px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all active:scale-95"
            >
              <Download size={16} /> Mẫu CSV
            </button>
            <label className="flex items-center gap-2 bg-white/5 text-white px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all active:scale-95 cursor-pointer">
              <Upload size={16} /> Nhập File
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleImportCSV} 
                className="hidden" 
                ref={fileInputRef} 
              />
            </label>
            <button 
              onClick={() => {
                setEditingId(null);
                setNewItem({ name: '', category: 'Sơn Gel', quantity: 0, minThreshold: 5, unit: 'chai' });
                setIsAdding(true);
              }}
              className="flex items-center gap-2 bg-brand-blue text-white px-6 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-blue/20 hover:scale-105 transition-all active:scale-95"
            >
              <Plus size={16} /> Thêm vật tư
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
              Tất cả
            </button>
            <button 
              onClick={() => setFilter('low')}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all flex items-center gap-2 whitespace-nowrap",
                filter === 'low' ? "bg-rose-500 text-white shadow-md shadow-rose-500/20" : "text-rose-500/60 hover:text-rose-500"
              )}
            >
              <BatteryWarning size={14} /> Sắp hết
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 size-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm vật tư..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-[18px] pl-12 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-brand-blue transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="animate-spin text-brand-blue size-10" />
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredSupplies.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="py-16 text-center bg-brand-card rounded-[32px] border border-dashed border-white/10"
                >
                  <Box className="mx-auto size-12 text-white/10 mb-4" />
                  <p className="text-white/30 text-sm font-medium uppercase tracking-widest">Không có dữ liệu</p>
                </motion.div>
              )}

              {filteredSupplies.map((item, idx) => {
                const isLow = item.quantity <= item.minThreshold;
                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "bg-brand-card p-5 rounded-[24px] border flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all group hover:shadow-2xl",
                      isLow ? "border-rose-500/30 bg-rose-500/5" : "border-brand-border hover:border-brand-blue/30"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition-all hover:scale-110",
                        item.isPurchased 
                          ? "bg-green-500/20 text-green-500 shadow-green-500/20" 
                          : isLow ? "bg-rose-500/10 text-rose-500 shadow-rose-500/10" : "bg-white/5 text-brand-blue"
                      )}
                      onClick={() => togglePurchased(item.id, !!item.isPurchased, item.name)}
                      title="Click để đánh dấu đã mua/chưa mua"
                      >
                        {item.isPurchased ? <CheckCircle2 size={24} /> : isLow ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg text-white mb-1.5 flex items-center gap-2">
                          {item.name}
                          {item.isPurchased && (
                            <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Đã mua</span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-white/40 bg-white/5 px-2 py-1 rounded-md">
                            <Tag size={10} /> {item.category}
                          </span>
                          {isLow && !item.isPurchased && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md animate-pulse">
                              CẦN NHẬP HÀNG
                            </span>
                          )}
                          {item.updatedBy && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-md">
                              Sửa bởi: {item.updatedBy}
                            </span>
                          )}
                          {item.lastUpdated && item.lastUpdated.toDate && (
                            <span className="text-[9px] font-bold text-white/30 bg-white/5 px-2 py-1 rounded-md">
                              {item.lastUpdated.toDate().toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-8 bg-black/20 md:bg-transparent p-4 md:p-0 rounded-2xl">
                      <div className="text-center md:text-right flex-1 md:flex-none">
                        <p className="text-[10px] font-bold uppercase tracking-[2px] text-white/30 mb-1">Số lượng</p>
                        <div className="flex items-center justify-center md:justify-end gap-3">
                          <button onClick={() => updateQuantity(item.id, item.quantity, -1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 text-white/50 hover:text-white transition-colors">-</button>
                          <span className={cn(
                            "text-2xl font-black min-w-[3rem] text-center",
                            isLow ? "text-rose-500" : "text-white"
                          )}>
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQuantity(item.id, item.quantity, 1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 active:scale-95 text-white/50 hover:text-white transition-colors">+</button>
                        </div>
                        <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">{item.unit}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingId(item.id);
                            setNewItem(item);
                            setIsAdding(true);
                          }}
                          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-brand-blue hover:bg-brand-blue hover:text-white transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-brand-card border border-white/10 rounded-[32px] p-8 w-full max-w-lg relative z-10 shadow-2xl"
            >
              <h2 className="text-2xl font-bold uppercase tracking-tight text-white mb-6">
                {editingId ? 'Sửa thông tin vật tư' : 'Thêm vật tư mới'}
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Tên vật tư</label>
                    <input 
                      type="text" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="VD: Sơn Gel OPI Đỏ..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-blue focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Người thêm/sửa</label>
                    <input 
                      type="text" value={newItem.updatedBy} onChange={(e) => setNewItem({...newItem, updatedBy: e.target.value})}
                      placeholder="Tên của bạn..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-blue focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Danh mục</label>
                    <select 
                      value={newItem.category} onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-blue focus:outline-none transition-colors appearance-none"
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Đơn vị</label>
                    <select 
                      value={newItem.unit} onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-blue focus:outline-none transition-colors appearance-none"
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Số lượng hiện tại</label>
                    <input 
                      type="number" min="0" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: Number(e.target.value)})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-blue focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 block mb-2">Mức cảnh báo (Tối thiểu)</label>
                    <input 
                      type="number" min="0" value={newItem.minThreshold} onChange={(e) => setNewItem({...newItem, minThreshold: Number(e.target.value)})}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-blue focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 rounded-xl transition-colors text-sm uppercase tracking-widest"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3.5 rounded-xl transition-colors text-sm uppercase tracking-widest shadow-lg shadow-brand-blue/20"
                >
                  Lưu lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
