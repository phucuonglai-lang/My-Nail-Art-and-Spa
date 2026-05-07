import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Replace with your actual Gemini API key or use environment variables
const API_KEY = "AIzaSyAv3NMMowOlwNdRdyt3smhQQY9xYA0kQDE";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Xin chào! Mình là trợ lý ảo của NailPro Academy. Mình có thể giúp gì cho bạn hôm nay?', isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now().toString(), text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const prompt = `Bạn là trợ lý ảo tư vấn khách hàng cho tiệm làm nail và học viện NailPro Academy. Hãy trả lời ngắn gọn, thân thiện và nhiệt tình.\n\nKhách hỏi: ${input}`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) throw new Error("API call failed");
      const data = await response.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, hiện tại mình đang bận một chút, bạn thử lại sau nhé!";
      
      setMessages(prev => [...prev, { id: Date.now().toString(), text: replyText, isUser: false }]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "Rất tiếc, đã có lỗi kết nối. Vui lòng thử lại sau.", isUser: false }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: isOpen ? 0 : 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-brand-accent to-brand-purple rounded-full flex items-center justify-center text-white shadow-lg shadow-brand-accent/30 z-50 hover:scale-110 transition-transform"
      >
        <MessageCircle size={24} />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[500px] bg-brand-card border border-brand-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="h-16 bg-gradient-to-r from-brand-accent to-brand-purple px-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Trợ lý NailPro</h3>
                  <p className="text-[10px] text-white/70 uppercase tracking-wider">Online 24/7</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-brand-bg/50">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.isUser 
                        ? 'bg-brand-blue text-white rounded-tr-sm' 
                        : 'bg-brand-card border border-brand-border text-brand-text rounded-tl-sm'
                    }`}
                    dangerouslySetInnerHTML={{ 
                      __html: msg.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/\n/g, '<br/>')
                    }}
                  />
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-4 rounded-2xl bg-brand-card border border-brand-border text-brand-text/50 rounded-tl-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-brand-purple" />
                    <span className="text-xs italic">Trợ lý đang gõ...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-brand-card border-t border-brand-border shrink-0">
              <div className="relative flex items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  className="w-full bg-brand-bg border border-brand-border rounded-xl pl-4 pr-12 py-3 text-sm text-brand-text placeholder-brand-text/30 focus:outline-none focus:border-brand-purple resize-none"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 w-8 h-8 bg-brand-purple rounded-lg flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
