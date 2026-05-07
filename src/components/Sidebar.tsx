import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight,
  ClipboardList, 
  ShieldCheck, 
  Bell, 
  Menu, 
  X,
  Target,
  FlaskConical,
  Sparkles,
  Zap,
  RefreshCw,
  Package
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>('nails');

  const menuItems = [
    {
      id: 'nails',
      label: t.nav.sidebar.nails,
      icon: ClipboardList,
      color: 'text-brand-accent',
      children: [
        { label: t.manicure.nav, path: '/manicure', icon: Target },
        { label: t.pedicure.nav, path: '/pedicure', icon: FlaskConical },
        { label: t.gelX.nav, path: '/gel-x', icon: Sparkles },
        { label: t.acrylic.nav, path: '/acrylic', icon: Zap },
        { label: t.acrylicRefill.nav, path: '/refill', icon: RefreshCw },
      ]
    },
    {
      id: 'rules',
      label: t.nav.sidebar.rules,
      icon: ShieldCheck,
      color: 'text-brand-secondary',
      path: '/procedures', // Add direct path
      children: [] // No children needed if it's a direct hub
    },
    {
      id: 'reports',
      label: 'Báo cáo',
      icon: ClipboardList, // Will use a standard icon for now
      color: 'text-emerald-500',
      path: '/reports',
      children: []
    },
    {
      id: 'supply',
      label: 'Kho & Vật tư',
      icon: Package,
      color: 'text-brand-blue',
      path: '/supply',
      children: []
    },
    {
      id: 'news',
      label: t.nav.sidebar.news,
      icon: Bell,
      color: 'text-amber-500',
      children: [
        { label: 'Latest News', path: '/', icon: Bell },
      ]
    }
  ];

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-4 z-50 p-3 bg-brand-card border border-brand-border rounded-2xl shadow-2xl lg:hidden text-white"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content */}
      <motion.aside
        className={cn(
          "fixed top-20 left-4 bottom-4 w-72 bg-brand-card/70 backdrop-blur-2xl border border-white/5 rounded-[32px] overflow-hidden z-40 flex flex-col transition-all duration-300 shadow-[0_32px_64px_rgba(0,0,0,0.5)]",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-8 flex-1 overflow-y-auto scrollbar-hide">
          <div className="mb-10">
            <span className="text-[10px] font-bold uppercase tracking-[4px] text-white/20 block mb-3">Main Menu</span>
            <div className="h-[1px] w-8 bg-brand-accent/50" />
          </div>

          <nav className="space-y-6">
            {menuItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isRule = item.id === 'rules';
              const isNews = item.id === 'news';
              const activeColor = isRule ? 'text-brand-blue' : isNews ? 'text-brand-purple' : 'text-brand-accent';
              
              const ButtonContent = (
                <div className="flex items-center gap-4">
                  <item.icon size={20} className={cn(expanded === item.id ? activeColor : "text-white/20")} />
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-[2px] transition-colors",
                    expanded === item.id ? "text-white" : "text-white/40 group-hover:text-white"
                  )}>
                    {item.label}
                  </span>
                </div>
              );

              if (!hasChildren && (item as any).path) {
                return (
                  <Link
                    key={item.id}
                    to={(item as any).path}
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl transition-all group border border-transparent hover:bg-white/5 active:scale-95"
                  >
                    {ButtonContent}
                    <ChevronRight size={16} className="text-white/10 group-hover:text-brand-blue group-hover:translate-x-1 transition-all" />
                  </Link>
                );
              }

              return (
                <div key={item.id} className="space-y-3">
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all group",
                      expanded === item.id 
                        ? "bg-white/5 border border-white/5" 
                        : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    {ButtonContent}
                    <ChevronDown 
                      size={16} 
                      className={cn(
                        "text-white/10 transition-transform duration-500",
                        expanded === item.id && "rotate-180 text-white/40 shadow-glow"
                      )} 
                    />
                  </button>

                  <AnimatePresence>
                    {expanded === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-6 space-y-2 py-2">
                          {item.children.map((child, cIdx) => (
                            <Link
                              key={cIdx}
                              to={child.path}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-4 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white hover:bg-white/5 transition-all group/item"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover/item:bg-brand-accent transition-colors" />
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="p-8 border-t border-brand-border bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-accent to-brand-purple text-white flex items-center justify-center text-[11px] font-bold shadow-lg shadow-brand-accent/20">
              US
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white">Active User</p>
              <p className="text-[9px] text-white/30 uppercase tracking-[3px]">Nail Tech</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
