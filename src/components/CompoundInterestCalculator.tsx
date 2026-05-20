import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, Calendar, BarChart3, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function CompoundInterestCalculator() {
  const [annualDeposit, setAnnualDeposit] = useState(12000);
  const [interestRate, setInterestRate] = useState(10);

  // Tính toán dữ liệu theo từng năm
  const data = useMemo(() => {
    let results = [];
    let totalBalance = 0;
    let totalInvested = 0;
    const rate = interestRate / 100;

    for (let i = 1; i <= 40; i++) {
      // Giả định nộp tiền vào đầu năm để hưởng lãi trọn năm
      totalInvested += annualDeposit;
      totalBalance = (totalBalance + annualDeposit) * (1 + rate);
      
      results.push({
        year: i,
        invested: totalInvested,
        balance: totalBalance,
        interest: totalBalance - totalInvested
      });
    }
    return results;
  }, [annualDeposit, interestRate]);

  const milestones = [5, 10, 20, 30];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans text-slate-800 pt-24 pb-12 max-w-7xl mx-auto">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <TrendingUp className="text-emerald-500" />
            Máy Tính Sức Mạnh Lãi Kép
          </h1>
          <p className="text-white/50">Lập kế hoạch tài chính cho tương lai của bạn</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cài đặt thông số */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-card p-6 rounded-3xl shadow-xl border border-brand-border"
            >
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                <BarChart3 size={20} className="text-brand-accent" />
                Tùy chỉnh thông số
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Số tiền đầu tư mỗi năm ($)
                  </label>
                  <input
                    type="number"
                    value={annualDeposit}
                    onChange={(e) => setAnnualDeposit(Number(e.target.value))}
                    className="w-full bg-brand-bg px-4 py-3 rounded-xl border border-brand-border focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-white font-bold"
                  />
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={annualDeposit}
                    onChange={(e) => setAnnualDeposit(Number(e.target.value))}
                    className="w-full h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer mt-4 accent-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Lãi suất kỳ vọng (%/năm)
                  </label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full bg-brand-bg px-4 py-3 rounded-xl border border-brand-border focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all text-white font-bold"
                  />
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="0.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full h-2 bg-brand-bg rounded-lg appearance-none cursor-pointer mt-4 accent-brand-accent"
                  />
                </div>
              </div>

              <div className="mt-8 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <div className="flex gap-3 text-emerald-400 text-sm leading-relaxed">
                  <Info size={18} className="shrink-0 mt-0.5" />
                  <p>Công thức tính: Gửi tiền định kỳ vào <strong>đầu mỗi năm</strong> để tối ưu hóa lãi suất.</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Kết quả & Milestones */}
          <div className="lg:col-span-2 space-y-6">
            {/* Thẻ Milestone */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {milestones.map((m, index) => {
                const milestoneData = data.find(d => d.year === m);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    key={m} 
                    className="bg-brand-card p-5 rounded-3xl shadow-xl border border-brand-border flex flex-col items-center text-center"
                  >
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{m} Năm</span>
                    <span className="text-xl font-bold text-white mb-2">{formatCurrency(milestoneData?.balance || 0)}</span>
                    <div className="mt-auto w-full bg-brand-bg h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${((milestoneData?.invested || 0) / (milestoneData?.balance || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Biểu đồ tăng trưởng đơn giản bằng Tailwind */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-brand-card p-6 md:p-8 rounded-3xl shadow-xl border border-brand-border"
            >
              <h2 className="text-lg font-semibold mb-8 flex items-center gap-2 text-white">
                <TrendingUp size={20} className="text-emerald-500" />
                Biểu đồ tăng trưởng tài sản (30 năm)
              </h2>
              <div className="w-full overflow-hidden pb-6">
                <div className="w-full h-72 flex items-end justify-between gap-1 mt-4 border-b border-white/10 pb-2 px-1 md:px-2">
                  {data.slice(0, 30).map((d, i) => {
                  const maxVal = data[29].balance;
                  const heightPerc = (d.balance / maxVal) * 100;
                  const investedPerc = (d.invested / d.balance) * 100;

                  return (
                    <div key={i} className="group relative flex-1 flex flex-col items-center justify-end h-full">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-10 hidden group-hover:block z-20 w-40 bg-brand-bg border border-brand-border text-white text-xs p-3 rounded-xl shadow-2xl pointer-events-none text-left">
                        <div className="font-bold text-white/50 mb-1 border-b border-white/10 pb-1">Năm {d.year}</div>
                        <div className="text-emerald-400 font-bold mb-1">{formatCurrency(d.balance)}</div>
                        <div className="text-white/60">Gốc: {formatCurrency(d.invested)}</div>
                        <div className="text-brand-accent">Lãi: {formatCurrency(d.interest)}</div>
                      </div>
                      
                      {/* Number Label */}
                      <div className="text-[8px] md:text-[10px] text-white/90 font-mono mb-2 whitespace-nowrap -rotate-90 origin-bottom translate-y-[-10px] opacity-100 transition-opacity">
                        ${Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(d.balance)}
                      </div>

                      {/* Bar */}
                      <div 
                        className="w-full max-w-[4px] md:max-w-[8px] bg-brand-accent/20 rounded-t-sm transition-all group-hover:bg-brand-accent/40 relative overflow-hidden mx-auto"
                        style={{ height: `${heightPerc}%` }}
                      >
                        {/* Invested part */}
                        <div 
                          className="absolute bottom-0 left-0 w-full bg-emerald-500/60 transition-all"
                          style={{ height: `${investedPerc}%` }}
                        ></div>
                      </div>
                      <span className="text-[8px] text-white/30 mt-2 font-mono hidden md:block">
                        {d.year % 5 === 0 ? d.year : ''}
                      </span>
                    </div>
                  );
                })}
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-8 text-xs font-bold text-white/50 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500/60 rounded-sm"></div>
                  Vốn gốc
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-brand-accent/20 rounded-sm"></div>
                  Lãi tích lũy
                </div>
              </div>
            </motion.div>

            {/* Bảng chi tiết */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-brand-card rounded-3xl shadow-xl border border-brand-border overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-brand-bg border-b border-brand-border">
                    <tr>
                      <th className="px-6 py-5 text-[10px] font-bold text-white/40 uppercase tracking-widest">Năm</th>
                      <th className="px-6 py-5 text-[10px] font-bold text-white/40 uppercase tracking-widest">Tổng Vốn ($)</th>
                      <th className="px-6 py-5 text-[10px] font-bold text-white/40 uppercase tracking-widest">Tiền Lãi ($)</th>
                      <th className="px-6 py-5 text-[10px] font-bold text-white/40 uppercase tracking-widest">Tổng Tài Sản ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border/50">
                    {milestones.map((m) => {
                      const d = data.find(item => item.year === m);
                      if (!d) return null;
                      return (
                        <tr key={m} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-white">Năm thứ {m}</td>
                          <td className="px-6 py-4 text-sm text-white/60 font-mono">{formatCurrency(d.invested)}</td>
                          <td className="px-6 py-4 text-sm text-brand-accent font-bold font-mono">+{formatCurrency(d.interest)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-emerald-400 font-mono">{formatCurrency(d.balance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
