import React, { useState } from 'react';
import { Lock, ArrowRight, TrendingUp, DollarSign, Users, Store, ExternalLink, FileText, File } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

// Linked to the user provided Google Sheet
const BRANCH_SHEETS = [
  {
    id: 'kendall',
    name: 'Kendall',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1pZwSqVYBtxwtyatnf-0tjjJJsFGahGivY-qSk3qH_GQ/preview?gid=0',
    realUrl: 'https://docs.google.com/spreadsheets/d/1pZwSqVYBtxwtyatnf-0tjjJJsFGahGivY-qSk3qH_GQ/edit',
    stats: {
      revenue: '$291.467,00',
      salary: '$212.855,00',
      profit: '$63.046,00'
    }
  },
  {
    id: 'cutlerbay',
    name: 'Cutlerbay',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1pZwSqVYBtxwtyatnf-0tjjJJsFGahGivY-qSk3qH_GQ/preview?gid=712613942',
    realUrl: 'https://docs.google.com/spreadsheets/d/1pZwSqVYBtxwtyatnf-0tjjJJsFGahGivY-qSk3qH_GQ/edit',
    stats: {
      revenue: '$61.766,96',
      salary: '$39.621,31',
      profit: '$194.165,00'
    }
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
            <div className="bg-brand-bg rounded-2xl p-5 border border-white/5 group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3 text-white/40 mb-2 text-xs font-bold uppercase tracking-widest">
                <DollarSign size={14} className="text-emerald-500" /> Doanh Thu
              </div>
              <div className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
                {(activeBranch as any)?.stats?.revenue || '---'}
              </div>
            </div>
            <div className="bg-brand-bg rounded-2xl p-5 border border-white/5 group hover:border-rose-500/30 transition-all">
              <div className="flex items-center gap-3 text-white/40 mb-2 text-xs font-bold uppercase tracking-widest">
                <Users size={14} className="text-rose-500" /> Chi Phí Lương
              </div>
              <div className="text-2xl font-black text-white group-hover:text-rose-400 transition-colors">
                {(activeBranch as any)?.stats?.salary || '---'}
              </div>
            </div>
            <div className="bg-brand-bg rounded-2xl p-5 border border-white/5 group hover:border-brand-accent/30 transition-all">
              <div className="flex items-center gap-3 text-white/40 mb-2 text-xs font-bold uppercase tracking-widest">
                <TrendingUp size={14} className="text-brand-accent" /> Lợi Nhuận
              </div>
              <div className="text-2xl font-black text-white group-hover:text-brand-accent transition-colors">
                {(activeBranch as any)?.stats?.profit || '---'}
              </div>
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

          {/* Google Sheets Iframe */}
          <div className="flex-1 bg-white rounded-2xl overflow-hidden border border-white/10 relative min-h-[500px] mb-8">
            <iframe 
              src={activeBranch?.sheetUrl} 
              className="w-full h-full border-0"
              title={`Báo cáo ${activeBranch?.name}`}
            ></iframe>
          </div>

          <div className="flex items-center justify-between mb-4 mt-8 border-t border-white/5 pt-8">
            <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <FileText className="text-brand-accent" />
              Mẫu Báo Cáo Excel
            </h2>
            <button 
              onClick={() => {
                const headers = ['Kỳ', 'CASH', 'Lợi Nhuận', 'Doanh thu', 'Lương Nhân Viên'];
                const data = [
                  ['TỔNG', '$8.510,00', '$63.046,00', '$291.467,00', '$212.855,00'],
                  ['12/8-12/21', '$1.368,00', '$7.583,00', '$25.486,00', '$18.603,00'],
                  ['12/22-1/11', '$3.074,00', '$11.057,00', '$31.968,00', '$20.911,00'],
                  ['1/12-1/25', '$2.120,00', '$5.627,00', '$24.310,00', '$18.682,00'],
                  ['1/26-02/8', '$525,00', '$5.505,00', '$21.853,00', '$16.348,00'],
                  ['02/09-02/22', '$659,00', '$4.744,00', '$29.118,00', '$25.074,00'],
                  ['02/23-03/08', '$145,00', '$836,00', '$29.615,00', '$29.615,00'],
                  ['03/09-03/22', '$2.953,00', '$11.228,00', '$30.565,00', '$20.037,00'],
                  ['03/23-04/05', '$2.392,00', '$11.584,00', '$32.018,00', '$21.133,00'],
                  ['04/06-04/19', '$1.834,00', '$11.592,00', '$30.057,00', '$19.265,00'],
                  ['4/25 chia lợi nhuận', '-$10.000,00', '-$20.000,00', '', ''],
                  ['04/20-05/03', '$3.440,00', '$13.290,00', '$36.477,00', '$23.187,00']
                ];
                let csvContent = "data:text/csv;charset=utf-8," 
                  + headers.join(",") + "\n"
                  + data.map(e => e.join(",")).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `Mau_Bao_Cao_${activeBranch?.name || 'Chi_Nhanh'}.csv`);
                document.body.appendChild(link);
                link.click();
              }}
              className="flex items-center gap-2 text-xs font-bold text-emerald-500 hover:text-white uppercase tracking-widest transition-colors bg-white/5 px-4 py-2 rounded-xl"
            >
              Tải File Mẫu (.csv) <File size={14} />
            </button>
          </div>

          <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 mb-8 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-yellow-400">
                  <th className="p-3 border border-black/20 text-black font-black uppercase text-[10px]">Kỳ</th>
                  <th className="p-3 border border-black/20 text-black font-black uppercase text-[10px]">CASH</th>
                  <th className="p-3 border border-black/20 text-black font-black uppercase text-[10px]">Lợi Nhuận</th>
                  <th className="p-3 border border-black/20 text-black font-black uppercase text-[10px]">Doanh thu</th>
                  <th className="p-3 border border-black/20 text-black font-black uppercase text-[10px]">Lương Nhân Viên</th>
                </tr>
              </thead>
              <tbody className="text-white/80 text-[11px] font-medium">
                <tr className="bg-white/5 font-bold text-white">
                  <td className="p-3 border border-white/10 uppercase">TỔNG</td>
                  <td className="p-3 border border-white/10 text-emerald-400">$8.510,00</td>
                  <td className="p-3 border border-white/10 text-emerald-400">$63.046,00</td>
                  <td className="p-3 border border-white/10">$291.467,00</td>
                  <td className="p-3 border border-white/10 text-rose-400">$212.855,00</td>
                </tr>
                {[
                  ['12/8-12/21', '$1.368,00', '$7.583,00', '$25.486,00', '$18.603,00'],
                  ['12/22-1/11', '$3.074,00', '$11.057,00', '$31.968,00', '$20.911,00'],
                  ['1/12-1/25', '$2.120,00', '$5.627,00', '$24.310,00', '$18.682,00'],
                  ['1/26-02/8', '$525,00', '$5.505,00', '$21.853,00', '$16.348,00'],
                  ['02/09-02/22', '$659,00', '$4.744,00', '$29.118,00', '$25.074,00'],
                  ['02/23-03/08', '$145,00', '$836,00', '$29.615,00', '$29.615,00'],
                  ['03/09-03/22', '$2.953,00', '$11.228,00', '$30.565,00', '$20.037,00'],
                  ['03/23-04/05', '$2.392,00', '$11.584,00', '$32.018,00', '$21.133,00'],
                  ['04/06-04/19', '$1.834,00', '$11.592,00', '$30.057,00', '$19.265,00'],
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 border border-white/5 font-mono">{row[0]}</td>
                    <td className="p-3 border border-white/5 text-emerald-500/80">{row[1]}</td>
                    <td className="p-3 border border-white/5 text-emerald-500/80">{row[2]}</td>
                    <td className="p-3 border border-white/5">{row[3]}</td>
                    <td className="p-3 border border-white/5 text-rose-500/80">{row[4]}</td>
                  </tr>
                ))}
                <tr className="bg-rose-500/10">
                  <td className="p-3 border border-white/10 text-rose-500 font-bold uppercase">4/25 chia lợi nhuận</td>
                  <td className="p-3 border border-white/10 text-rose-500 font-bold">-$10.000,00</td>
                  <td className="p-3 border border-white/10 text-rose-500 font-bold">-$20.000,00</td>
                  <td className="p-3 border border-white/10"></td>
                  <td className="p-3 border border-white/10"></td>
                </tr>
                <tr>
                  <td className="p-3 border border-white/5 font-mono">04/20-05/03</td>
                  <td className="p-3 border border-white/5 text-emerald-500/80">$3.440,00</td>
                  <td className="p-3 border border-white/5 text-emerald-500/80">$13.290,00</td>
                  <td className="p-3 border border-white/5">$36.477,00</td>
                  <td className="p-3 border border-white/5 text-rose-500/80">$23.187,00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
