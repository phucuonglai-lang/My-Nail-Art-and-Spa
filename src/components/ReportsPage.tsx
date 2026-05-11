import React, { useState, useMemo } from 'react';
import { Lock, ArrowRight, TrendingUp, DollarSign, Users, Store, ExternalLink, FileText, File, BarChart3, Table as TableIcon } from 'lucide-react';
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
    },
    chartData: [25486, 31968, 24310, 21853, 29118, 29615, 30565, 32018, 30057, 36477],
    labels: ['12/8', '12/22', '1/12', '1/26', '2/9', '2/23', '3/9', '3/23', '4/6', '4/20']
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
    },
    chartData: [54468, 48438, 45975, 51356, 55011, 53322, 56081, 49507, 60681, 61497],
    labels: ['12/22', '1/5', '1/19', '2/2', '2/16', '3/2', '3/16', '3/30', '4/13', '4/27']
  }
];

function SimpleAreaChart({ data, labels, color }: { data: number[], labels: string[], color: string }) {
  const height = 350;
  const width = 850;
  const paddingLeft = 80;
  const paddingBottom = 60;
  const paddingTop = 40;
  const paddingRight = 40;
  
  const max = Math.max(...data) * 1.2;
  const min = 0; // Start from 0 for clear scale
  
  const points = useMemo(() => {
    return data.map((val, i) => ({
      x: (i / (data.length - 1)) * (width - paddingLeft - paddingRight) + paddingLeft,
      y: height - ((val - min) / (max - min)) * (height - paddingTop - paddingBottom) - paddingBottom
    }));
  }, [data, min, max]);

  const pathData = useMemo(() => {
    return points.reduce((acc, point, i) => {
      return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
    }, "");
  }, [points]);

  const areaData = useMemo(() => {
    return `${pathData} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }, [pathData, points]);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-2xl">
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Y-Axis Labels (Amount) */}
        {[0, 1, 2, 3, 4].map((i) => {
          const val = Math.round((max / 4) * i);
          const y = height - paddingBottom - (i / 4) * (height - paddingTop - paddingBottom);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="white" strokeOpacity="0.05" strokeDasharray="4 4" />
              <text x={paddingLeft - 10} y={y + 4} textAnchor="end" fill="white" fillOpacity="0.3" fontSize="10" className="font-bold">
                ${val.toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Axis Titles */}
        <text x={paddingLeft - 70} y={height / 2} transform={`rotate(-90, ${paddingLeft - 70}, ${height / 2})`} textAnchor="middle" fill={color} fillOpacity="0.5" fontSize="10" className="font-black uppercase tracking-[3px]">Số Tiền ($)</text>
        <text x={width / 2} y={height - 5} textAnchor="middle" fill={color} fillOpacity="0.5" fontSize="10" className="font-black uppercase tracking-[3px]">Kỳ Báo Cáo</text>

        {/* Area fill */}
        <motion.path
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          d={areaData}
          fill="url(#gradient)"
        />

        {/* Line path */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points and Labels */}
        {points.map((point, i) => (
          <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * i }}>
            {/* Value Label */}
            <text
              x={point.x}
              y={point.y - 15}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              className="font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              ${data[i].toLocaleString()}
            </text>
            
            <circle cx={point.x} cy={point.y} r="6" fill="#111" stroke={color} strokeWidth="3" />
            
            <text
              x={point.x}
              y={height - paddingBottom + 25}
              textAnchor="middle"
              fill="white"
              fillOpacity="0.4"
              fontSize="10"
              className="font-bold uppercase tracking-tighter"
              transform={`rotate(-30, ${point.x}, ${height - paddingBottom + 25})`}
            >
              {labels[i]}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

export default function ReportsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState(BRANCH_SHEETS[0].id);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

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
      <header className="mb-12">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-white mb-4 flex items-center gap-4">
          <TrendingUp className="text-brand-accent w-10 h-10" />
          Báo Cáo Kinh Doanh
        </h1>
        <p className="text-white/30 uppercase tracking-[0.2em] text-xs font-bold">
          Phân tích Doanh thu & Xu hướng tăng trưởng
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-3">
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

        <div className="flex bg-brand-card p-1 rounded-2xl border border-brand-border">
          <button 
            onClick={() => setViewMode('chart')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              viewMode === 'chart' ? "bg-brand-accent text-white shadow-lg" : "text-white/30 hover:text-white"
            )}
          >
            <BarChart3 size={14} /> Biểu đồ
          </button>
          <button 
            onClick={() => setViewMode('table')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
              viewMode === 'table' ? "bg-brand-accent text-white shadow-lg" : "text-white/30 hover:text-white"
            )}
          >
            <TableIcon size={14} /> Trang tính
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab + viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-brand-card border border-brand-border rounded-[32px] p-6 md:p-8 flex flex-col min-h-[600px] shadow-2xl relative overflow-hidden"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-brand-bg rounded-2xl p-5 border border-white/5 group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3 text-white/40 mb-2 text-xs font-bold uppercase tracking-widest">
                <DollarSign size={14} className="text-emerald-500" /> Doanh Thu
              </div>
              <div className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
                {activeBranch?.stats?.revenue || '---'}
              </div>
            </div>
            <div className="bg-brand-bg rounded-2xl p-5 border border-white/5 group hover:border-rose-500/30 transition-all">
              <div className="flex items-center gap-3 text-white/40 mb-2 text-xs font-bold uppercase tracking-widest">
                <Users size={14} className="text-rose-500" /> Chi Phí Lương
              </div>
              <div className="text-2xl font-black text-white group-hover:text-rose-400 transition-colors">
                {activeBranch?.stats?.salary || '---'}
              </div>
            </div>
            <div className="bg-brand-bg rounded-2xl p-5 border border-white/5 group hover:border-brand-accent/30 transition-all">
              <div className="flex items-center gap-3 text-white/40 mb-2 text-xs font-bold uppercase tracking-widest">
                <TrendingUp size={14} className="text-brand-accent" /> Lợi Nhuận
              </div>
              <div className="text-2xl font-black text-white group-hover:text-brand-accent transition-colors">
                {activeBranch?.stats?.profit || '---'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Store className="text-brand-purple" />
              {viewMode === 'chart' ? 'Xu hướng Doanh thu' : 'Dữ liệu Trang tính'}: {activeBranch?.name}
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

          {viewMode === 'chart' ? (
            <div className="flex-1 flex flex-col justify-center bg-brand-bg/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden mb-8">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,45,85,0.05),transparent)] pointer-events-none" />
              <SimpleAreaChart 
                data={activeBranch?.chartData || []} 
                labels={activeBranch?.labels || []}
                color={activeTab === 'kendall' ? '#10b981' : '#f43f5e'} 
              />
            </div>
          ) : (
            <div className="flex-1 bg-white rounded-2xl overflow-hidden border border-white/10 relative min-h-[500px] mb-8">
              <iframe 
                src={activeBranch?.sheetUrl} 
                className="w-full h-full border-0"
                title={`Báo cáo ${activeBranch?.name}`}
              ></iframe>
            </div>
          )}

          {/* Detailed Data Table - Always visible or at least detailed */}
          <div className="mt-8 border-t border-white/5 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <FileText className="text-brand-accent" />
                Chi Tiết Báo Cáo: {activeBranch?.name}
              </h2>
              <button 
                onClick={() => {
                  const headers = ['Kỳ', 'CASH', 'Lợi Nhuận', 'Doanh thu', 'Lương Nhân Viên'];
                  const dataRows = [
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
                    ['04/20-05/03', '$3.440,00', '$13.290,00', '$36.477,00', '$23.187,00']
                  ];
                  let csvContent = "data:text/csv;charset=utf-8," 
                    + headers.join(",") + "\n"
                    + dataRows.map(e => e.join(",")).join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `Bao_Cao_Chi_Tiet_${activeBranch?.name}.csv`);
                  document.body.appendChild(link);
                  link.click();
                }}
                className="flex items-center gap-2 text-xs font-bold text-emerald-500 hover:text-white uppercase tracking-widest transition-colors bg-white/5 px-4 py-2 rounded-xl"
              >
                Xuất CSV <File size={14} />
              </button>
            </div>

            <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 overflow-x-auto">
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
                    ['04/20-05/03', '$3.440,00', '$13.290,00', '$36.477,00', '$23.187,00']
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 border border-white/5 font-mono">{row[0]}</td>
                      <td className="p-3 border border-white/5 text-emerald-500/80">{row[1]}</td>
                      <td className="p-3 border border-white/5 text-emerald-500/80">{row[2]}</td>
                      <td className="p-3 border border-white/5">{row[3]}</td>
                      <td className="p-3 border border-white/5 text-rose-500/80">{row[4]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
