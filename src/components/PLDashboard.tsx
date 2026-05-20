import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Settings,
  RefreshCw,
  Plus,
  PlusCircle,
  Calendar,
  Tag,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle,
  Trash2,
  X
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Cấu hình cứng danh sách email được phép xem P/L
const ALLOWED_EMAILS = ['phucuonglai@gmail.com', 'tieuboisgs@gmail.com'];
const API_TOKEN = 'STE_PL_483be52_PRO';

interface Income {
  date: string;
  source: string;
  amount: number;
  type: 'Check' | 'Cash';
  notes: string;
}

interface FixedExpense {
  month: string;
  category: string;
  amount: number;
  status: 'Paid' | 'Unpaid';
  notes: string;
}

interface OtherExpense {
  date: string;
  category: string;
  amount: number;
  source: 'Bank' | 'Cash';
  notes: string;
}

interface PLData {
  initialBank: number;
  initialCash: number;
  currentBank: number;
  currentCash: number;
  totalCheckIncome: number;
  totalCashIncome: number;
  totalPaidFixed: number;
  totalOtherBank: number;
  totalOtherCash: number;
  incomes: Income[];
  fixedExpenses: FixedExpense[];
  otherExpenses: OtherExpense[];
}

export default function PLDashboard() {
  const { user } = useAuth();
  const [gasUrl, setGasUrl] = useState<string>(() => localStorage.getItem('STE_PL_GAS_URL') || '');
  const [sheetUrl, setSheetUrl] = useState<string>(() => localStorage.getItem('STE_PL_SHEET_URL') || '');
  
  const [data, setData] = useState<PLData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showConfig, setShowConfig] = useState<boolean>(!localStorage.getItem('STE_PL_GAS_URL'));
  const [tempGasUrl, setTempGasUrl] = useState<string>(gasUrl);
  const [tempSheetUrl, setTempSheetUrl] = useState<string>(sheetUrl);
  
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [formRows, setFormRows] = useState<Array<{
    id: string;
    category: string;
    amount: string;
    method: string;
    notes: string;
  }>>([
    { id: '1', category: '', amount: '', method: 'Bank', notes: '' }
  ]);
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Thao tác với danh sách dòng nhập liệu giao dịch
  const addRow = () => {
    setFormRows(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        category: '',
        amount: '',
        method: txType === 'income' ? 'Check' : 'Bank',
        notes: ''
      }
    ]);
  };

  const removeRow = (id: string) => {
    setFormRows(prev => {
      const filtered = prev.filter(row => row.id !== id);
      return filtered.length === 0 ? [{ id: Math.random().toString(), category: '', amount: '', method: txType === 'income' ? 'Check' : 'Bank', notes: '' }] : filtered;
    });
  };

  const updateRow = (id: string, field: string, value: string) => {
    setFormRows(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleSetTxType = (type: 'income' | 'expense') => {
    setTxType(type);
    setFormRows(prev => prev.map(row => ({
      ...row,
      method: type === 'income' ? 'Check' : 'Bank'
    })));
  };

  // 1. Kiểm tra quyền truy cập (Firewall)
  const isAuthorized = user && ALLOWED_EMAILS.includes(user.email || '');

  // 2. Fetch dữ liệu từ GAS
  const fetchData = async (targetUrl = gasUrl) => {
    if (!targetUrl) {
      setError('Vui lòng cấu hình URL Google Apps Script Web App để tiếp tục.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${targetUrl}?token=${API_TOKEN}&action=getData`);
      if (!response.ok) {
        throw new Error(`Lỗi kết nối API: ${response.status}`);
      }
      const json = await response.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setData(json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Không thể tải dữ liệu từ Google Sheet. Vui lòng kiểm tra lại URL Apps Script.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized && gasUrl) {
      fetchData();
    }
  }, [isAuthorized, gasUrl]);

  // 3. Xử lý lưu cấu hình URL
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('STE_PL_GAS_URL', tempGasUrl.trim());
    localStorage.setItem('STE_PL_SHEET_URL', tempSheetUrl.trim());
    setGasUrl(tempGasUrl.trim());
    setSheetUrl(tempSheetUrl.trim());
    setShowConfig(false);
    
    if (tempGasUrl.trim()) {
      fetchData(tempGasUrl.trim());
    }
  };

  // 4. Xử lý thêm giao dịch mới
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gasUrl) {
      alert('Vui lòng cấu hình URL Apps Script trước.');
      return;
    }
    
    // Lọc ra các dòng hợp lệ (có danh mục và số tiền)
    const validRows = formRows.filter(row => row.category.trim() !== '' && row.amount.trim() !== '');
    if (validRows.length === 0) {
      alert('Vui lòng nhập ít nhất một dòng giao dịch hợp lệ (có Danh mục/Nguồn thu và Số tiền).');
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        token: API_TOKEN,
        action: 'addTransactions',
        data: validRows.map(row => ({
          type: txType,
          date: formDate,
          category: row.category.trim(),
          amount: parseFloat(row.amount),
          method: row.method,
          notes: row.notes.trim()
        }))
      };

      // Dùng text/plain để tránh CORS preflight OPTIONS request
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Lỗi kết nối: ${response.status}`);
      }

      const resJson = await response.json();
      if (resJson.error) {
        throw new Error(resJson.error);
      }

      setSuccessMsg(`Đã thêm thành công ${validRows.length} giao dịch!`);
      setShowAddModal(false);
      
      // Reset form về một dòng trống
      setFormRows([
        { id: Math.random().toString(), category: '', amount: '', method: txType === 'income' ? 'Check' : 'Bank', notes: '' }
      ]);
      setFormDate(new Date().toISOString().substring(0, 10));

      // Refresh dữ liệu
      await fetchData();

      setTimeout(() => {
        setSuccessMsg(null);
      }, 3000);
      
    } catch (err: any) {
      console.error(err);
      alert(`Không thể thêm giao dịch: ${err.message || err.toString()}`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Trích xuất danh sách tất cả các tháng khả dụng từ dữ liệu
  const availableMonths = useMemo(() => {
    if (!data) return [];
    const months = new Set<string>();
    
    if (data.incomes) {
      data.incomes.forEach(inc => {
        if (inc.date) months.add(inc.date.substring(0, 7));
      });
    }
    if (data.otherExpenses) {
      data.otherExpenses.forEach(exp => {
        if (exp.date) months.add(exp.date.substring(0, 7));
      });
    }
    if (data.fixedExpenses) {
      data.fixedExpenses.forEach(fix => {
        if (fix.month) months.add(fix.month);
      });
    }
    
    return Array.from(months).sort((a, b) => b.localeCompare(a.month));
  }, [data]);

  // Lọc và tính toán các chỉ số tóm tắt theo tháng đã chọn
  const filteredStats = useMemo(() => {
    if (!data) {
      return {
        checkIncome: 0,
        cashIncome: 0,
        paidFixed: 0,
        otherExpenses: 0,
      };
    }

    if (selectedMonth === 'all') {
      return {
        checkIncome: data.totalCheckIncome,
        cashIncome: data.totalCashIncome,
        paidFixed: data.totalPaidFixed,
        otherExpenses: data.totalOtherBank + data.totalOtherCash,
      };
    }

    let checkIncome = 0;
    let cashIncome = 0;
    let paidFixed = 0;
    let otherExpenses = 0;

    if (data.incomes) {
      data.incomes.forEach(inc => {
        if (inc.date && inc.date.substring(0, 7) === selectedMonth) {
          if (inc.type === 'Check') {
            checkIncome += inc.amount;
          } else {
            cashIncome += inc.amount;
          }
        }
      });
    }

    if (data.fixedExpenses) {
      data.fixedExpenses.forEach(fix => {
        if (fix.month === selectedMonth && fix.status === 'Paid') {
          paidFixed += fix.amount;
        }
      });
    }

    if (data.otherExpenses) {
      data.otherExpenses.forEach(exp => {
        if (exp.date && exp.date.substring(0, 7) === selectedMonth) {
          otherExpenses += exp.amount;
        }
      });
    }

    return {
      checkIncome,
      cashIncome,
      paidFixed,
      otherExpenses,
    };
  }, [data, selectedMonth]);

  // 5. Chuẩn bị dữ liệu cho biểu đồ Doanh thu Check vs Cash hàng tháng
  const barChartData = useMemo(() => {
    if (!data || !data.incomes) return [];
    
    const monthlyMap: Record<string, { month: string; Check: number; Cash: number }> = {};
    
    data.incomes.forEach(inc => {
      if (!inc.date) return;
      const month = inc.date.substring(0, 7); // Định dạng YYYY-MM
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month: month, Check: 0, Cash: 0 };
      }
      if (inc.type === 'Check') {
        monthlyMap[month].Check += inc.amount;
      } else {
        monthlyMap[month].Cash += inc.amount;
      }
    });

    return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  // 6. Chuẩn bị dữ liệu cho biểu đồ tròn chi tiêu khác theo Danh mục
  const pieChartData = useMemo(() => {
    if (!data || !data.otherExpenses) return [];
    
    const catMap: Record<string, number> = {};
    data.otherExpenses.forEach(exp => {
      if (selectedMonth !== 'all' && exp.date && exp.date.substring(0, 7) !== selectedMonth) return;
      const cat = exp.category || 'Chi phí khác';
      catMap[cat] = (catMap[cat] || 0) + exp.amount;
    });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data, selectedMonth]);

  // Gom nhóm danh sách tất cả các giao dịch gần đây để hiển thị
  const recentTransactions = useMemo(() => {
    if (!data) return [];
    
    const all: { date: string; type: 'income' | 'expense'; category: string; amount: number; method: string; notes: string }[] = [];
    
    if (data.incomes) {
      data.incomes.forEach(i => {
        if (selectedMonth !== 'all' && i.date && i.date.substring(0, 7) !== selectedMonth) return;
        all.push({
          date: i.date,
          type: 'income',
          category: i.source,
          amount: i.amount,
          method: i.type,
          notes: i.notes
        });
      });
    }
    
    if (data.otherExpenses) {
      data.otherExpenses.forEach(e => {
        if (selectedMonth !== 'all' && e.date && e.date.substring(0, 7) !== selectedMonth) return;
        all.push({
          date: e.date,
          type: 'expense',
          category: e.category,
          amount: e.amount,
          method: e.source,
          notes: e.notes
        });
      });
    }

    return all.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);
  }, [data, selectedMonth]);

  // Tính toán dữ liệu tổng quan theo tháng (Thu nhập, Chi phí, Thặng dư, Saving Rate)
  const monthlySummaryData = useMemo(() => {
    if (!data) return [];

    const summaryMap: Record<string, {
      month: string;
      income: number;
      expense: number;
    }> = {};

    // 1. Cộng thu nhập
    if (data.incomes) {
      data.incomes.forEach(inc => {
        if (!inc.date) return;
        const month = inc.date.substring(0, 7); // YYYY-MM
        if (!summaryMap[month]) {
          summaryMap[month] = { month, income: 0, expense: 0 };
        }
        summaryMap[month].income += inc.amount;
      });
    }

    // 2. Cộng chi phí phát sinh
    if (data.otherExpenses) {
      data.otherExpenses.forEach(exp => {
        if (!exp.date) return;
        const month = exp.date.substring(0, 7); // YYYY-MM
        if (!summaryMap[month]) {
          summaryMap[month] = { month, income: 0, expense: 0 };
        }
        summaryMap[month].expense += exp.amount;
      });
    }

    // 3. Cộng chi phí cố định (chỉ tính khoản đã thanh toán 'Paid')
    if (data.fixedExpenses) {
      data.fixedExpenses.forEach(fix => {
        if (!fix.month) return;
        // fixedExpenses lưu month dạng YYYY-MM
        const month = fix.month;
        if (!summaryMap[month]) {
          summaryMap[month] = { month, income: 0, expense: 0 };
        }
        if (fix.status === 'Paid') {
          summaryMap[month].expense += fix.amount;
        }
      });
    }

    // Chuyển sang array, tính toán các chỉ số và sort theo tháng giảm dần (mới nhất lên đầu)
    const result = Object.values(summaryMap)
      .map(item => {
        const net = item.income - item.expense;
        const savingRate = item.income > 0 ? (net / item.income) * 100 : 0;
        return {
          ...item,
          net,
          savingRate
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));

    if (selectedMonth !== 'all') {
      return result.filter(item => item.month === selectedMonth);
    }
    return result;
  }, [data, selectedMonth]);

  // Danh mục chi tiêu gợi ý
  const expenseSuggestions = ['Ăn uống 🍔', 'Di chuyển 🚗', 'Mua sắm 🛍️', 'Hóa đơn ⚡', 'Nhà cửa 🏠', 'Bảo hiểm 🛡️', 'Du lịch ✈️', 'Chi phí khác 🏷️'];
  const incomeSuggestions = ['Steven Salary 1 💼', 'Steven Salary 2 💼', 'Katie Salary 1 💼', 'Katie Salary 2 💼', 'Shop Management 💅', 'Tips 💵', 'Khác 🪙'];

  const PIE_COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#64748b'];

  // Giao diện khi chưa đăng nhập hoặc đăng nhập sai email
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-transparent px-6 py-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-purple/20 blur-[120px] rounded-full pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-brand-card w-full max-w-lg rounded-[40px] p-8 md:p-12 border border-brand-border shadow-2xl relative z-10 text-center"
        >
          <div className="w-20 h-20 bg-brand-bg rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-2xl">
            <Lock className="w-10 h-10 text-brand-purple animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider mb-4">Hệ Thống P/L Bảo Mật</h1>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Trang thông tin tài chính cá nhân và gia đình được bảo vệ nghiêm ngặt. Chỉ các tài khoản quản trị được phân quyền cụ thể mới có thể truy cập.
          </p>
          {!user ? (
            <p className="text-brand-accent text-xs font-bold uppercase tracking-widest bg-brand-accent/10 px-6 py-4 rounded-2xl border border-brand-accent/20">
              Vui lòng Đăng nhập bằng Google bằng nút ở góc phải trên.
            </p>
          ) : (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 text-left">
              <p className="text-rose-400 text-xs font-bold uppercase tracking-widest mb-2">Truy cập bị từ chối (Access Denied)</p>
              <p className="text-white/60 text-xs font-mono leading-relaxed break-all">
                Tài khoản: {user.email}<br />
                Trạng thái: Không có quyền xem dữ liệu P/L cá nhân.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 md:px-8 max-w-7xl mx-auto relative">
      {/* Thông báo Thành công dạng Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-bold uppercase tracking-widest text-xs px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400/20"
          >
            <CheckCircle size={16} />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Dashboard */}
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-2 flex items-center gap-3">
            <TrendingUp className="text-brand-purple w-9 h-9" />
            Hệ Thống P/L Gia Đình ✨
          </h1>
          <p className="text-white/30 uppercase tracking-[0.2em] text-xs font-bold">
            Steven & Katie Personal Cashflow & Financial Dashboard
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors bg-white/5 border border-brand-border px-5 py-3 rounded-2xl hover:bg-white/10"
            >
              Google Sheet <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={cn(
              "p-3 rounded-2xl border transition-all flex items-center justify-center",
              showConfig 
                ? "bg-brand-purple text-white border-brand-purple shadow-lg" 
                : "bg-white/5 text-white/60 border-brand-border hover:bg-white/10"
            )}
            title="Cấu hình kết nối Google Sheets"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => fetchData()}
            disabled={loading || !gasUrl}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-brand-border rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-widest"
            title="Đồng bộ dữ liệu từ Google Sheet"
          >
            <RefreshCw size={16} className={cn(loading && "animate-spin")} /> Làm mới
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={!gasUrl}
            className="flex items-center gap-2 bg-gradient-to-r from-brand-accent to-brand-purple text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest hover:opacity-95 transition-all shadow-lg shadow-brand-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus size={16} /> Giao dịch
          </button>
        </div>
      </header>

      {/* Panel Cấu Hình Google Apps Script (GAS) */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 shadow-2xl relative">
              <div className="absolute top-6 right-6">
                <button
                  onClick={() => setShowConfig(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Settings className="text-brand-purple" size={18} />
                Cấu hình kết nối Google Sheet
              </h2>
              
              <form onSubmit={handleSaveConfig} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      Google Apps Script Web App URL
                    </label>
                    <input
                      type="url"
                      required
                      value={tempGasUrl}
                      onChange={(e) => setTempGasUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full bg-brand-bg border border-brand-border rounded-2xl px-5 py-4 text-sm font-mono text-white focus:outline-none focus:border-brand-purple transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      Đường dẫn Google Sheet (Mở nhanh)
                    </label>
                    <input
                      type="url"
                      value={tempSheetUrl}
                      onChange={(e) => setTempSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                      className="w-full bg-brand-bg border border-brand-border rounded-2xl px-5 py-4 text-sm font-mono text-white focus:outline-none focus:border-brand-purple transition-all"
                    />
                  </div>
                </div>

                <div className="bg-brand-bg/50 border border-white/5 rounded-2xl p-5 text-xs text-white/50 space-y-2">
                  <p className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-2 text-[10px]">
                    <HelpCircle size={14} className="text-brand-purple" /> Hướng dẫn nhanh:
                  </p>
                  <p>1. Copy mã Apps Script từ file <code className="text-brand-purple font-mono bg-white/5 px-1.5 py-0.5 rounded">src/lib/pl-gas-script.js</code> vào Google Sheets Apps Script.</p>
                  <p>2. Thiết lập token bảo mật <code className="text-brand-purple font-mono bg-white/5 px-1.5 py-0.5 rounded">API_TOKEN</code> trong script để khớp với cấu hình của bạn.</p>
                  <p>3. Chọn Deploy &rarr; New Deployment dưới dạng <b>Web App</b>, chạy dưới quyền của bạn (Execute as: Me) và cho phép mọi người truy cập (Who has access: Anyone).</p>
                  <p>4. Copy địa chỉ Web App URL nhận được và dán vào ô cấu hình phía trên.</p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTempGasUrl(gasUrl);
                      setTempSheetUrl(sheetUrl);
                      setShowConfig(false);
                    }}
                    className="px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] border border-brand-border text-white/60 hover:bg-white/5"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="bg-brand-purple text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all shadow-lg shadow-brand-purple/20"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hiển thị thông tin lỗi nếu có */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-[32px] p-6 mb-8 text-rose-400 text-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p>{error}</p>
          <button 
            onClick={() => setShowConfig(true)}
            className="bg-rose-500/20 hover:bg-rose-500 text-white rounded-2xl px-6 py-2 font-bold uppercase tracking-widest text-[10px] transition-all"
          >
            Sửa cấu hình
          </button>
        </div>
      )}

      {/* Nếu chưa nạp được dữ liệu và đang load */}
      {loading && !data && (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-purple/20 border-t-brand-purple rounded-full animate-spin" />
          <p className="text-white/40 uppercase tracking-widest text-[10px] font-bold">Đang kết nối & tải dữ liệu tài chính...</p>
        </div>
      )}

      {/* Hiển thị Dashboard chính */}
      {data && (
        <div className="space-y-8">
          {/* Hàng 1: Thống Kê Số Dư & Assets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Bank Balance */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 relative overflow-hidden group hover:border-brand-blue/30 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[2px] text-white/40">Tài khoản Bank (Check)</span>
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                  <Wallet size={18} />
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-2 leading-none">
                ${data.currentBank.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-[10px] text-white/30 flex items-center gap-1">
                Số dư ban đầu: ${data.initialBank.toLocaleString('en-US')}
              </p>
              <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-brand-blue/5 rounded-full blur-xl group-hover:bg-brand-blue/10 transition-colors" />
            </motion.div>

            {/* Card 2: Cash Balance */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[2px] text-white/40">Tiền Mặt (Cash)</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <DollarSign size={18} />
                </div>
              </div>
              <h2 className="text-3xl font-black text-emerald-400 mb-2 leading-none">
                ${data.currentCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-[10px] text-white/30">
                Số dư ban đầu: ${data.initialCash.toLocaleString('en-US')}
              </p>
              <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-colors" />
            </motion.div>

            {/* Card 3: Total Asset */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 relative overflow-hidden group hover:border-brand-purple/30 transition-all shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-[2px] text-white/40">Tổng tài sản ròng</span>
                <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                  <Sparkles size={18} />
                </div>
              </div>
              <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-purple mb-2 leading-none">
                ${(data.currentBank + data.currentCash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-[10px] text-white/30">
                Tổng cộng Bank + Cash thực tế
              </p>
              <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-brand-purple/5 rounded-full blur-xl group-hover:bg-brand-purple/10 transition-colors" />
            </motion.div>
          </div>

          {/* Hàng Phụ: Tóm Tắt Thu Chi Lũy Kế / Theo Tháng */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-4">
              <span className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Thu nhập Check</span>
              <span className="text-base font-bold text-white">${filteredStats.checkIncome.toLocaleString('en-US')}</span>
            </div>
            <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-4">
              <span className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Thu nhập Cash</span>
              <span className="text-base font-bold text-emerald-400">${filteredStats.cashIncome.toLocaleString('en-US')}</span>
            </div>
            <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-4">
              <span className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Cố định đã chi</span>
              <span className="text-base font-bold text-rose-400">${filteredStats.paidFixed.toLocaleString('en-US')}</span>
            </div>
            <div className="bg-brand-card/40 border border-white/5 rounded-2xl p-4">
              <span className="block text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1">Chi phát sinh</span>
              <span className="text-base font-bold text-rose-400">
                ${filteredStats.otherExpenses.toLocaleString('en-US')}
              </span>
            </div>
          </div>

          {/* Hàng 2: Biểu Đồ Phân Tích */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Biểu Đồ 1: Monthly Income Stacked Bar */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 shadow-2xl flex flex-col min-h-[450px]"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp className="text-brand-purple" size={16} />
                Doanh thu Check vs Cash hàng tháng
              </h3>
              
              <div className="flex-1 min-h-[300px]">
                {barChartData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-xs italic">
                    Chưa có dữ liệu doanh thu tháng.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barChartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#ffffff40" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#ffffff40" 
                        fontSize={10} 
                        fontWeight="bold"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111',
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '16px',
                          color: '#fff'
                        }}
                        formatter={(value) => [`$${value}`, '']}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                      />
                      {/* Check Income - Purple */}
                      <Bar dataKey="Check" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                      {/* Cash Income - Emerald */}
                      <Bar dataKey="Cash" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </motion.div>

            {/* Biểu Đồ 2: Other Expenses Category Pie */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 shadow-2xl flex flex-col min-h-[450px]"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingDown className="text-rose-500" size={16} />
                Tỷ lệ chi tiêu phát sinh theo mục
              </h3>
              
              <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full h-[250px] relative">
                  {pieChartData.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-xs italic">
                      Chưa có dữ liệu chi tiêu phát sinh.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#111',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '16px',
                            color: '#fff'
                          }}
                          formatter={(value) => [`$${value}`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {pieChartData.length > 0 && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <span className="block text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none">Tổng chi</span>
                      <span className="text-lg font-black text-white leading-none">
                        ${(data.totalOtherBank + data.totalOtherCash).toLocaleString('en-US')}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Labels Legend */}
                <div className="w-full md:w-48 max-h-[250px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {pieChartData.slice(0, 7).map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} 
                        />
                        <span className="text-white/60 truncate font-semibold">{item.name}</span>
                      </div>
                      <span className="text-white font-bold font-mono">${item.value.toLocaleString('en-US')}</span>
                    </div>
                  ))}
                  {pieChartData.length > 7 && (
                    <div className="text-[10px] text-white/30 italic text-center pt-1 border-t border-white/5">
                      Và {pieChartData.length - 7} hạng mục khác...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hàng 3: Bảng Tổng Quan Theo Tháng */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                  <TrendingUp className="text-brand-purple" size={16} />
                  Bảng tổng quan tài chính theo tháng
                </h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">
                  Tổng hợp thu nhập, chi phí cố định đã trả, chi phí phát sinh và tỷ lệ tiết kiệm hàng tháng
                </p>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Lọc hiển thị:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-brand-purple transition-all cursor-pointer hover:bg-white/10"
                >
                  <option value="all" className="bg-[#121214] text-white">Tất cả các tháng</option>
                  {availableMonths.map(m => {
                    const [year, month] = m.split('-');
                    return (
                      <option key={m} value={m} className="bg-[#121214] text-white">
                        Tháng {month}/{year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
              {monthlySummaryData.length === 0 ? (
                <div className="p-8 text-center text-white/20 text-xs italic">
                  Chưa có dữ liệu tổng quan theo tháng.
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider w-36">Tháng</th>
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider">Tổng Thu Nhập</th>
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider">Tổng Chi Tiêu</th>
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider">Thặng Dư / Tiết Kiệm</th>
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider w-40">Tỷ Lệ Tiết Kiệm</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-semibold text-white/80">
                    {monthlySummaryData.map((row, idx) => {
                      const isPositive = row.net >= 0;
                      // Format month: YYYY-MM -> Tháng MM/YYYY
                      const [year, month] = row.month.split('-');
                      const formattedMonth = `Tháng ${month}/${year}`;
                      
                      return (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white font-bold flex items-center gap-2">
                            <Calendar className="text-white/20" size={13} />
                            {formattedMonth}
                          </td>
                          <td className="p-4 text-emerald-400 font-mono text-xs">
                            +${row.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-rose-400 font-mono text-xs">
                            -${row.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={cn("p-4 font-black font-mono text-xs", isPositive ? "text-emerald-400" : "text-rose-400")}>
                            {isPositive ? '+' : '-'}${Math.abs(row.net).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border",
                              row.savingRate >= 20
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : row.savingRate > 0
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            )}>
                              {row.savingRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>

          {/* Hàng 4: Bảng Giao Dịch Gần Đây */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-1 flex items-center gap-2">
                  <FileText className="text-brand-accent" size={16} />
                  Lịch sử giao dịch gần đây (Max 15)
                </h3>
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-wider">Đối chiếu dữ liệu đồng bộ với Google Sheets</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Thu nhập Check/Cash
                </span>
                <span className="flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Chi phí biến động
                </span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
              {recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-white/20 text-xs italic">
                  Chưa ghi nhận giao dịch nào.
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider w-32">Ngày</th>
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider">Hạng mục / Nguồn</th>
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider w-32">Số tiền</th>
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider w-32">Phương thức</th>
                      <th className="p-4 text-white/40 font-bold uppercase text-[9px] tracking-wider">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] font-semibold text-white/80">
                    {recentTransactions.map((tx, idx) => {
                      const isInc = tx.type === 'income';
                      return (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-white/30 font-mono">{tx.date}</td>
                          <td className="p-4 text-white font-bold">{tx.category}</td>
                          <td className={cn("p-4 font-black text-sm", isInc ? "text-emerald-400" : "text-rose-400")}>
                            {isInc ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest border",
                              tx.method === 'Cash' 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : tx.method === 'Check'
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            )}>
                              {tx.method}
                            </span>
                          </td>
                          <td className="p-4 text-white/40 italic font-medium">{tx.notes}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal: Thêm Giao Dịch Nhanh */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-brand-card w-full max-w-2xl rounded-[36px] border border-brand-border p-6 shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="absolute top-6 right-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <h2 className="text-md font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2 pb-3 border-b border-white/5">
                <Plus className="text-brand-purple" size={18} />
                Ghi chép giao dịch hàng loạt
              </h2>

              {/* Tab chuyển loại Giao dịch */}
              <div className="grid grid-cols-2 bg-brand-bg p-1 rounded-2xl border border-brand-border mb-4">
                <button
                  type="button"
                  onClick={() => handleSetTxType('expense')}
                  className={cn(
                    "py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    txType === 'expense' 
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  Khoản Chi (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetTxType('income')}
                  className={cn(
                    "py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                    txType === 'income' 
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                      : "text-white/40 hover:text-white"
                  )}
                >
                  Thu Nhập (Income)
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="flex flex-col flex-1 overflow-hidden">
                <div className="space-y-4 overflow-y-auto pr-1 flex-1 pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  {/* 1. Date */}
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-white/40 mb-1.5 flex items-center gap-1.5">
                      <Calendar size={12} /> Ngày giao dịch chung
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-purple transition-all"
                    />
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-white/40">
                        Danh sách mục ghi chép
                      </label>
                      <button
                        type="button"
                        onClick={addRow}
                        className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-brand-purple hover:text-brand-purple/80 transition-colors"
                      >
                        <PlusCircle size={14} /> Thêm dòng mới
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formRows.map((row, index) => (
                        <div key={row.id} className="p-4 bg-white/5 border border-brand-border rounded-2xl space-y-3 relative group">
                          {formRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              className="absolute top-3 right-3 text-white/20 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                              title="Xóa dòng"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          
                          <div className="text-[9px] font-bold text-white/40 uppercase tracking-wider">
                            Giao dịch #{index + 1}
                          </div>

                          <div className="grid grid-cols-12 gap-3">
                            {/* Category input */}
                            <div className="col-span-8">
                              <label className="block text-[8px] font-bold uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1">
                                <Tag size={10} /> {txType === 'income' ? 'Nguồn thu' : 'Danh mục chi'}
                              </label>
                              <input
                                type="text"
                                required
                                value={row.category}
                                onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                                placeholder={txType === 'income' ? 'Ví dụ: Lương Steven' : 'Ví dụ: Ăn trưa'}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple transition-all"
                              />
                              {/* Suggestions for this category */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {(txType === 'income' ? incomeSuggestions : expenseSuggestions).map((sug) => (
                                  <button
                                    key={sug}
                                    type="button"
                                    onClick={() => updateRow(row.id, 'category', sug.split(' ')[0])}
                                    className="px-2 py-0.5 bg-white/5 border border-white/5 hover:border-brand-purple rounded-md text-[9px] text-white/50 hover:text-white transition-all"
                                  >
                                    {sug}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Amount input */}
                            <div className="col-span-4">
                              <label className="block text-[8px] font-bold uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1">
                                <DollarSign size={10} /> Số tiền ($)
                              </label>
                              <input
                                type="number"
                                required
                                step="0.01"
                                min="0.01"
                                value={row.amount}
                                onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple transition-all font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-3">
                            {/* Method dropdown */}
                            <div className="col-span-5">
                              <label className="block text-[8px] font-bold uppercase tracking-widest text-white/40 mb-1">
                                Nguồn tiền
                              </label>
                              <select
                                value={row.method}
                                onChange={(e) => updateRow(row.id, 'method', e.target.value)}
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple transition-all cursor-pointer"
                              >
                                {txType === 'income' ? (
                                  <>
                                    <option value="Check">Check (Bank)</option>
                                    <option value="Cash">Cash (Tiền mặt)</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="Bank">Bank (Thẻ/TK)</option>
                                    <option value="Cash">Cash (Tiền mặt)</option>
                                  </>
                                )}
                              </select>
                            </div>

                            {/* Notes input */}
                            <div className="col-span-7">
                              <label className="block text-[8px] font-bold uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1">
                                <FileText size={10} /> Ghi chú
                              </label>
                              <input
                                type="text"
                                value={row.notes}
                                onChange={(e) => updateRow(row.id, 'notes', e.target.value)}
                                placeholder="Không bắt buộc..."
                                className="w-full bg-brand-bg border border-brand-border rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-purple transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit action */}
                <div className="pt-4 border-t border-white/5 flex justify-between items-center mt-2">
                  <div className="text-[10px] text-white/40">
                    Sẵn sàng ghi nhận: <span className="text-white font-mono font-bold">{formRows.filter(r => r.category.trim() !== '' && r.amount.trim() !== '').length}</span> mục
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-5 py-2 rounded-xl font-bold uppercase tracking-widest text-[9px] border border-brand-border text-white/60 hover:bg-white/5 transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className={cn(
                        "text-white px-7 py-2 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all shadow-lg",
                        txType === 'income' 
                          ? "bg-emerald-500 hover:opacity-90 shadow-emerald-500/20" 
                          : "bg-rose-500 hover:opacity-90 shadow-rose-500/20",
                        submitLoading && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {submitLoading ? 'Đang gửi...' : 'Ghi nhận tất cả'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
