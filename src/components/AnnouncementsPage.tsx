import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, File, Code, Image as ImageIcon, ExternalLink, X, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnn, setSelectedAnn] = useState<any | null>(null);

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setAnnouncements(data);
      } catch (error) {
        console.error("Fetch Announcements Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="w-10 h-10 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="pt-24 pb-12 px-6 max-w-5xl mx-auto relative min-h-screen">
      {/* Decorative background shapes */}
      <div className="fixed top-[-100px] right-[-100px] w-80 h-80 rounded-full border border-brand-accent/30 bg-brand-accent/5 z-[-1] blur-3xl opacity-20" />
      <div className="fixed bottom-[10%] left-[-50px] w-40 h-40 border border-brand-purple/30 rotate-12 bg-brand-purple/5 z-[-1] blur-2xl opacity-20" />

      <header className="mb-12 border-b border-brand-border pb-6">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 uppercase tracking-tighter text-white font-sans">THÔNG BÁO BÀI ĐĂNG</h1>
        <div className="h-1 w-12 bg-gradient-to-r from-brand-accent to-brand-purple rounded-full" />
      </header>

      {announcements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {announcements.map((ann, idx) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedAnn(ann)}
              className="bg-brand-card p-8 rounded-[40px] border border-brand-border hover:border-brand-accent/50 hover:shadow-2xl transition-all group flex flex-col justify-between cursor-pointer min-h-[220px]"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                    ann.type === 'pdf' ? "bg-rose-500/10 text-rose-500" : 
                    ann.type === 'image' ? "bg-brand-blue/10 text-brand-blue" :
                    ann.type === 'html' ? "bg-purple-500/10 text-purple-500" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {ann.type === 'pdf' && <FileText size={22} />}
                    {ann.type === 'image' && <ImageIcon size={22} />}
                    {ann.type === 'html' && <Code size={22} />}
                    {ann.type === 'text' && <File size={22} />}
                  </div>
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 group-hover:bg-brand-accent group-hover:text-white transition-all shadow-xl">
                    <Eye size={16} />
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-white uppercase tracking-tight mb-2 group-hover:text-brand-accent transition-colors line-clamp-2 leading-snug">{ann.title}</h3>
                {ann.desc && <p className="text-white/40 text-xs mb-4 line-clamp-2 leading-relaxed">{ann.desc}</p>}
              </div>

              <div className="flex items-center gap-3 mt-6 border-t border-white/5 pt-4">
                <span className="text-[9px] font-black uppercase tracking-[3px] px-3 py-1 bg-white/5 rounded-full text-white/40">
                  {ann.type === 'pdf' ? 'PDF FILE' :
                   ann.type === 'image' ? 'HÌNH ẢNH' :
                   ann.type === 'html' ? 'HTML PAGE' : 'VĂN BẢN'}
                </span>
                <span className="text-[9px] text-white/20 font-bold ml-auto font-mono">
                  {ann.createdAt ? new Date(ann.createdAt.seconds * 1000).toLocaleDateString('vi-VN') : 'Đang xử lý...'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-white/5 rounded-[40px] border border-dashed border-brand-border">
          <p className="text-white/20 italic text-sm uppercase tracking-widest font-bold">Hiện tại chưa có thông báo nào được đăng tải.</p>
        </div>
      )}

      {/* Announcement Detail Modal */}
      <AnimatePresence>
        {selectedAnn && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-bg/95 backdrop-blur-md z-[200] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-brand-card w-full max-w-3xl rounded-[48px] p-10 shadow-[0_32px_120px_rgba(0,0,0,0.8)] relative max-h-[85vh] flex flex-col border border-brand-border"
            >
              <button 
                onClick={() => setSelectedAnn(null)} 
                className="absolute top-8 right-8 p-3 text-white/20 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <X size={24} />
              </button>

              <div className="mb-8 pr-12">
                <span className="text-[10px] font-bold uppercase tracking-[4px] text-brand-accent mb-2 block">Thông báo chi tiết</span>
                <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                  {selectedAnn.title}
                </h3>
                {selectedAnn.createdAt && (
                  <p className="text-[10px] text-white/30 font-bold uppercase tracking-[2px] mt-2 font-mono">
                    Ngày đăng: {new Date(selectedAnn.createdAt.seconds * 1000).toLocaleDateString('vi-VN')}
                  </p>
                )}
              </div>

              <div className="overflow-y-auto flex-1 prose prose-invert prose-sm max-w-none scrollbar-hide">
                {selectedAnn.type === 'text' && (
                  <div className="whitespace-pre-wrap text-white/70 leading-relaxed text-sm font-sans">
                    {selectedAnn.content}
                  </div>
                )}

                {selectedAnn.type === 'html' && (
                  <div 
                    className="whitespace-pre-wrap text-white/70 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: selectedAnn.content || '' }}
                  />
                )}

                {selectedAnn.type === 'image' && (
                  <div className="flex flex-col items-center gap-6">
                    {selectedAnn.content ? (
                      <img 
                        src={selectedAnn.content} 
                        alt={selectedAnn.title} 
                        className="max-w-full max-h-[50vh] rounded-3xl object-contain border border-white/10 shadow-2xl" 
                      />
                    ) : (
                      <p className="text-white/20 italic">Không có hình ảnh để hiển thị.</p>
                    )}
                    {selectedAnn.desc && (
                      <p className="text-white/50 text-xs text-center font-bold tracking-wide uppercase">{selectedAnn.desc}</p>
                    )}
                  </div>
                )}

                {selectedAnn.type === 'pdf' && (
                  <div className="w-full h-[50vh] rounded-2xl overflow-hidden border border-white/10 bg-black/20 flex flex-col items-center justify-center p-8">
                    {selectedAnn.content ? (
                      selectedAnn.content.startsWith('data:application/pdf') ? (
                        <iframe 
                          src={selectedAnn.content} 
                          title={selectedAnn.title}
                          className="w-full h-full rounded-2xl"
                        />
                      ) : (
                        <div className="text-center space-y-6">
                          <FileText size={48} className="text-rose-500 mx-auto animate-pulse" />
                          <p className="text-white/60 text-sm max-w-md mx-auto">Tệp PDF này được lưu trữ bên ngoài. Vui lòng bấm vào liên kết dưới đây để mở xem chi tiết.</p>
                          <a 
                            href={selectedAnn.content} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-3 bg-rose-500 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-500/20"
                          >
                            <ExternalLink size={16} /> Mở Tệp PDF Ngoài
                          </a>
                        </div>
                      )
                    ) : (
                      <p className="text-white/20 italic">Không tìm thấy tài liệu PDF.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-brand-border flex justify-end">
                <button 
                  onClick={() => setSelectedAnn(null)}
                  className="px-10 py-4 bg-brand-accent text-white rounded-2xl font-black uppercase tracking-[3px] text-[10px] hover:shadow-2xl hover:shadow-brand-accent/20 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95"
                >
                  Xác nhận & Đóng
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
