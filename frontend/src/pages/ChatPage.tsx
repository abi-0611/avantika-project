import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Paperclip, Smile, Settings, Edit3, MoreVertical, Share, Brain, StopCircle, Mic } from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';
import { usePreferences } from '../context/PreferencesContext';
import ChatBubble from '../components/ChatBubble';
import VoiceWaveform from '../components/VoiceWaveform';
import { cn } from '../lib/utils';

export default function ChatPage() {
  const { user } = useAuth();
  const { memoryEnabled, setMemoryEnabled } = usePreferences();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await apiClient.get<any[]>('/chats');
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch chats', error);
      }
    };
    fetchChats();

    const fetchMemoryStatus = async () => {
      try {
        const status = await apiClient.get<{ enabled: boolean }>('/memory/status');
        if (typeof status?.enabled === 'boolean') {
          setMemoryEnabled(status.enabled);
        }
      } catch {
        // Ignore: memory is optional and may fail if not logged in or server down.
      }
    };
    fetchMemoryStatus();

    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
  }, [setMemoryEnabled]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() && !recording) return;

    const now = Date.now();

    const userMsg = {
      id: now.toString(),
      text: input,
      sender: 'user',
      timestamp: now,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const classifyRes = await apiClient.post<any>('/safety/classify', { text: userMsg.text });
      
      const botMsg = {
        id: (now + 1).toString(),
        text: classifyRes.suggestedResponse || 'I am here to help.',
        sender: 'bot',
        timestamp: Date.now(),
        riskLevel: classifyRes.riskLevel,
        riskCategory: classifyRes.category,
        explanation: classifyRes.explanation
      };

      await apiClient.post('/chats', { ...userMsg, riskLevel: 'Safe' });
      await apiClient.post('/chats', botMsg);

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    setRecording(!recording);
    if (recording) {
      handleSend();
    }
  };

  const toggleMemory = async () => {
    try {
      const next = !memoryEnabled;
      await apiClient.post('/memory/toggle', { enabled: next });
      setMemoryEnabled(next);
    } catch (error) {
      console.error('Failed to toggle memory', error);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <header className="glass-panel border-b border-border/50 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-display font-bold text-white">New Conversation</h1>
          <button className="text-text-secondary hover:text-white transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleMemory}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              memoryEnabled 
                ? "bg-primary/10 text-primary border-primary/20" 
                : "bg-surface text-text-secondary border-border"
            )}
            title="Toggle Memory"
          >
            <Brain className="w-4 h-4" />
            <div className={cn("w-2 h-2 rounded-full", memoryEnabled ? "bg-primary animate-pulse" : "bg-text-secondary")} />
          </button>
          <button className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
            <Share className="w-4 h-4" /> Share
          </button>
          <button className="text-text-secondary hover:text-white transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar">
        <AnimatePresence initial={false}>
          {messages.length === 0 && !isTyping && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center text-center text-text-secondary space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-2">How can I help you today?</h3>
                <p className="max-w-md mx-auto">I'm ShieldBot, your safe and smart AI assistant. Ask me anything, or try voice chat!</p>
              </div>
            </motion.div>
          )}

          {messages.map((msg, idx) => (
            <ChatBubble key={msg.id || idx} message={msg} />
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex justify-start"
            >
              <div className="glass-panel rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-text-secondary rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-text-secondary rounded-full" />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-text-secondary rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 glass-panel border-t border-border/50 z-10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end gap-2 bg-surface/80 backdrop-blur-md border border-border rounded-3xl p-2 shadow-inner">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-text-secondary hover:text-primary transition-colors rounded-full hover:bg-primary/10 shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
          
          <div className="flex-1 relative min-h-[44px] flex items-center">
            {recording ? (
              <div className="w-full flex items-center gap-4 px-4">
                <VoiceWaveform isRecording={recording} />
                <span className="text-danger text-sm font-medium animate-pulse">Recording...</span>
              </div>
            ) : (
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask or search anything..."
                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-text-secondary py-3 px-2"
              />
            )}
          </div>

          <button type="button" className="p-3 text-text-secondary hover:text-primary transition-colors rounded-full hover:bg-primary/10 shrink-0 hidden sm:block">
            <Smile className="w-5 h-5" />
          </button>

          {isTyping ? (
            <button type="button" className="p-3 bg-danger text-white rounded-full hover:bg-danger/80 transition-colors shrink-0 shadow-lg shadow-danger/20">
              <StopCircle className="w-5 h-5" />
            </button>
          ) : input.trim() ? (
            <button type="submit" className="p-3 bg-primary text-white rounded-full hover:bg-primary-hover transition-colors shrink-0 shadow-lg shadow-primary/20">
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button 
              type="button" 
              onClick={toggleRecording}
              className={cn(
                "p-3 rounded-full transition-colors shrink-0 shadow-lg",
                recording ? "bg-danger text-white shadow-danger/20 animate-pulse" : "bg-surface border border-border text-text-primary hover:bg-primary/20 hover:text-primary hover:border-primary/50"
              )}
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-text-secondary">AI can make mistakes. Please verify important information.</p>
        </div>
      </div>
    </div>
  );
}
