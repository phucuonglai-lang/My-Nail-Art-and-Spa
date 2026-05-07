import React, { useState } from 'react';
import { Lock, ArrowRight, TrendingUp, DollarSign, Users, Store, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// You can replace these with your actual Google Sheets embed URLs
const BRANCH_SHEETS = [
  {
    id: 'branch-1',
    name: 'Chi nhánh 1',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID_1/pubhtml?widget=true&headers=false',
    realUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_1/edit'
  },
  {
    id: 'branch-2',
    name: 'Chi nhánh 2',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID_2/pubhtml?widget=true&headers=false',
    realUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_2/edit'
  },
  {
    id: 'branch-3',
    name: 'Chi nhánh 3',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/e/YOUR_SHEET_ID_3/pubhtml?widget=true&headers=false',
    realUrl: 'https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_3/edit'
  }
];

export default function ReportsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState(BRANCH_SHEETS[0].id);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '305801') {
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-24 px-6 flex items-center justify-center bg-transparent relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-accent/20 blur-[100px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-card w-full max-w-md rounded-[40px] p-10 border border-brand-border shadow-2xl relative z-10"
        >
          <div className="w-16 h-16 bg-brand-bg rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-xl">
            <Lock className="w-8 h-8 text-brand-accent" />
          </div>
          
          <h1 className="text-2xl font-bold text-white text-center uppercase tracking-widest mb-2">Báo Cáo Mật</h1>
          <p className="text-white/40 text-center text-sm mb-8">Vui lòng nhập mã truy cập để xem báo cáo doanh thu các chi nhánh.</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="Nhập mật khẩu..."
                className={cn(
                  "w-full bg-brand-bg border rounded-2xl px-6 py-4 text-center text-xl font-mono tracking-[0.5em] text-white focus:outline-none transition-all",
                  error ? "border-rose-500/50 focus:border-rose-500 text-rose-500" : "border-brand-border focus:border-brand-accent"
                )}
                autoFocus
              />
              {error && <p className="text-rose-500 text-xs text-center mt-3 uppercase tracking-widest font-bold">Mật khẩu không đúng!</p>}
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-brand-accent to-brand-purple text-white rounded-2xl py-4 font-bold uppercase tracking-[0.2em] text-sm hover:opacity-90 transition-all flex items-center justify-center gap-3"
            >
              Truy cập <ArrowRight size={16} />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const activeBranch = BRANCH_SHEETS.find(b => b.id === activeTab);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 bg-transparent max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4 flex items-center gap-4">
          <TrendingUp className="text-brand-accent w-10 h-10" />
          Báo Cáo Kinh Doanh
        </h1>
        <p className="text-white/30 uppercase tracking-[0.2em] text-xs font-bold">
          Theo dõi Doanh thu, Chi phí & Lợi nhuận các chi nhánh
        </p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {BRANCH_SHEETS.map(branch => (
          <button
            key={branch.id}
            onClick={() => setActiveTab(branch.id)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all",
              activeTab === branch.id 
                ? "bg-brand-accent text-white shadow-[0_10px_30px_rgba(255,45,85,0.3)]" 
                : "bg-brand-card text-white/40 border border-brand-border hover:bg-white/5 hover:text-white"
            )}
          >
            <Store size={16} />
            {branch.name}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 flex flex-col min-h-[600px] shadow-2xl relative overflow-hidden"
        >
          {/* Top stats placeholders - can be removed if relying 100% on sheets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-brand-bg rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 text-white/40 mb-2 text-xs font-bold uppercase tracking-widest">
                <DollarSign size={14} className="text-emerald-500" /> Doanh Thu
              </div>
              <div className="text-2xl font-black text-white">Xem file</div>
            </div>
            <div className="bg-brand-bg rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 text-white/40 mb-2 text-xs font-bold uppercase tracking-widest">
                <Users size={14} className="text-rose-500" /> Chi Phí Lương
              </div>
              <div className="text-2xl font-black text-white">Xem file</div>
            </div>
            <div className="bg-brand-bg rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-3 text-white/40 mb-2 text-xs font-bold uppercase tracking-widest">
                <TrendingUp size={14} className="text-brand-accent" /> Lợi Nhuận
              </div>
              <div className="text-2xl font-black text-white">Xem file</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Store className="text-brand-purple" />
              Bảng Tính: {activeBranch?.name}
            </h2>
            <a 
              href={activeBranch?.realUrl} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold text-brand-purple hover:text-white uppercase tracking-widest transition-colors bg-white/5 px-4 py-2 rounded-xl"
            >
              Mở Google Sheets <ExternalLink size={14} />
            </a>
          </div>

          {/* Google Sheets Iframe Placeholder */}
          <div className="flex-1 bg-white rounded-2xl overflow-hidden border border-white/10 relative min-h-[400px]">
            {/* 
              Hướng dẫn: 
              Thay URL trong mảng BRANCH_SHEETS bằng URL nhúng (embed URL) của file Google Sheets của bạn. 
              Cách lấy link nhúng: File > Share > Publish to web > Chọn Embed > Copy link trong <iframe src="...">
            */}
            {activeBranch?.sheetUrl.includes('YOUR_SHEET_ID') ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-8 text-center">
                <Store size={48} className="text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa liên kết Google Sheets</h3>
                <p className="text-gray-500 max-w-md text-sm">
                  Vào file <code>src/components/ReportsPage.tsx</code> và thay thế <b>YOUR_SHEET_ID</b> bằng đường link file Google Sheets của bạn.
                </p>
              </div>
            ) : (
              <iframe 
                src={activeBranch?.sheetUrl} 
                className="w-full h-full border-0"
                title={`Báo cáo ${activeBranch?.name}`}
              ></iframe>
            )}
          </div>

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
