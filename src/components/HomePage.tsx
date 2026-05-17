import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Video, ShieldCheck, MessageSquare, ArrowRight, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
  size?: 'md' | 'lg';
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}

const Button = ({ children, className, variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-gradient-to-r from-brand-accent to-brand-purple text-white shadow-lg shadow-brand-accent/20 hover:opacity-90",
    outline: "border border-brand-border bg-white/5 hover:bg-white/10 text-white shadow-xl shadow-black/50",
  };
  const sizes = {
    lg: "px-10 py-5 text-xs",
    md: "px-6 py-3 text-[10px]",
  };
  
  return (
    <button 
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold uppercase tracking-[3px] transition-all active:scale-95",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default function HomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-32 px-6 sm:py-56">
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md">
                <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">New Era of Nail Training</span>
             </div>
            <h1 className="text-6xl sm:text-9xl font-serif font-black tracking-tight mb-8 text-white leading-[0.95] uppercase">
              {t.home.title}
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-sm sm:text-lg text-white/40 max-w-2xl mx-auto mb-16 uppercase tracking-[0.2em] leading-relaxed font-medium"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {t.home.subtitle}
          </motion.p>
          
          <motion.div 
            className="flex flex-wrap justify-center gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <Link to="/library">
              <Button size="lg">
                {t.nav.library} <ArrowRight className="ml-3 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/portfolio">
               <Button size="lg" variant="outline" className="border-brand-accent/50 text-brand-accent">
                 {t.portfolio.title}
               </Button>
            </Link>
            <Link to="/procedures">
               <Button size="lg" variant="outline">
                 {t.nav.procedures}
               </Button>
            </Link>
          </motion.div>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-brand-accent/10 rounded-full blur-[160px] -z-10 opacity-30" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 left-0 w-120 h-120 bg-brand-purple/10 rounded-full blur-[140px] -z-10" />
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            className="group bg-brand-card p-10 rounded-[40px] border border-brand-border flex flex-col items-center text-center hover:border-brand-blue/50 transition-all duration-500 relative overflow-hidden"
            whileHover={{ y: -12 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-10 group-hover:bg-brand-blue group-hover:text-white transition-all duration-500 shadow-xl shadow-brand-blue/10">
              <Video className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold mb-5 uppercase tracking-[4px] text-white underline-offset-8 decoration-brand-blue">{t.nav.library}</h3>
            <p className="text-white/30 text-xs leading-relaxed uppercase tracking-widest font-medium">
              Truy cập thư viện video bài giảng kỹ thuật từ cơ bản đến nâng cao.
            </p>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          <motion.div 
            className="group bg-brand-card p-10 rounded-[40px] border border-brand-border flex flex-col items-center text-center hover:border-brand-purple/50 transition-all duration-500 relative overflow-hidden"
            whileHover={{ y: -12 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-brand-purple/10 text-brand-purple flex items-center justify-center mb-10 group-hover:bg-brand-purple group-hover:text-white transition-all duration-500 shadow-xl shadow-brand-purple/10">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold mb-5 uppercase tracking-[4px] text-white">{t.nav.policies}</h3>
            <p className="text-white/30 text-xs leading-relaxed uppercase tracking-widest font-medium">
              Hệ thống SOP và quy định nội bộ chuẩn hóa quy trình vận hành chi nhánh.
            </p>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          <motion.div 
            className="group bg-brand-card p-10 rounded-[40px] border border-brand-border flex flex-col items-center text-center hover:border-brand-accent/50 transition-all duration-500 relative overflow-hidden"
            whileHover={{ y: -12 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-brand-accent/10 text-brand-accent flex items-center justify-center mb-10 group-hover:bg-brand-accent group-hover:text-white transition-all duration-500 shadow-xl shadow-brand-accent/10">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold mb-5 uppercase tracking-[4px] text-white">{t.nav.scenarios}</h3>
            <p className="text-white/30 text-xs leading-relaxed uppercase tracking-widest font-medium">
              Các kịch bản ứng biến tình huống khách hàng thực tế giúp nâng cao dịch vụ.
            </p>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>

          <motion.div 
            className="group bg-brand-card p-10 rounded-[40px] border border-brand-border flex flex-col items-center text-center hover:border-amber-500/50 transition-all duration-500 relative overflow-hidden"
            whileHover={{ y: -12 }}
          >
            <Link to="/portfolio" className="absolute inset-0 z-10" />
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-10 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-xl shadow-amber-500/10">
              <Award className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold mb-5 uppercase tracking-[4px] text-white">{t.portfolio.title}</h3>
            <p className="text-white/30 text-xs leading-relaxed uppercase tracking-widest font-medium">
              Xem và đăng các tác phẩm nail nghệ thuật từ đội ngũ chuyên viên của chúng tôi.
            </p>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-40 px-6 bg-transparent border-y border-white/5 overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
          <div>
            <span className="text-brand-accent font-bold uppercase tracking-[6px] text-[10px] mb-8 block px-3 py-1 border border-brand-accent/20 rounded-full w-fit">About Us</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-10 font-serif leading-[1] text-white uppercase tracking-tighter">Xây dựng thương hiệu & Vận hành xuất sắc</h2>
            <div className="space-y-8 mb-16">
              <p className="text-white/50 leading-relaxed text-sm uppercase tracking-widest font-medium">
                Học viện Nail Academy Web Hub không chỉ là nơi đào tạo nghề, mà còn là trung tâm điều phối và chuẩn hóa quy trình cho các chi nhánh Cutler Bay, Kendall và Homestead.
              </p>
              <p className="text-white/50 leading-relaxed text-sm uppercase tracking-widest font-medium">
                Chúng tôi tập trung vào việc số hóa kiến thức và dữ liệu, giúp nhân viên dễ dàng tiếp cận tài liệu đào tạo và kịch bản phục vụ khách hàng mọi lúc, mọi nơi.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-12 pt-12 border-t border-brand-border">
              <div>
                <div className="text-5xl font-bold text-white mb-3">03</div>
                <div className="text-[10px] text-white/30 font-bold uppercase tracking-[4px]">Chi nhánh</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-3">50+</div>
                <div className="text-[10px] text-white/30 font-bold uppercase tracking-[4px]">Bài giảng</div>
              </div>
              <div>
                <div className="text-5xl font-bold text-white mb-3">24/7</div>
                <div className="text-[10px] text-white/30 font-bold uppercase tracking-[4px]">Hỗ trợ</div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <motion.div 
              className="aspect-square sm:aspect-video rounded-[48px] overflow-hidden shadow-2xl relative z-10 border border-white/10"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.6 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=1200" 
                alt="Nail Academy" 
                className="w-full h-full object-cover filter contrast-125 brightness-75"
              />
            </motion.div>
            
            {/* Design detail */}
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-brand-blue/20 rounded-full blur-[100px] -z-10" />
            <div className="absolute -top-16 -right-16 w-80 h-80 bg-brand-purple/20 rounded-full blur-[100px] -z-10" />
            
            <motion.div 
              className="absolute -bottom-16 -right-12 bg-white p-12 rounded-[40px] max-w-xs hidden sm:block shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/5"
              initial={{ rotate: 3 }}
              whileHover={{ rotate: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="italic text-lg font-serif leading-relaxed mb-6 text-black">"Chất lượng đào tạo là ưu tiên hàng đầu của chúng tôi."</p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-[2px] bg-brand-accent" />
                <p className="font-bold text-[10px] uppercase tracking-[3px] text-black/60">— Steven, Founder</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
