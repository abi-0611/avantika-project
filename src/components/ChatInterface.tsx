import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, AlertTriangle, Shield, Info, LogOut, Settings, Image as ImageIcon, X, Users, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, writeBatch, getDocs } from 'firebase/firestore';
import { classifyRisk, logSafetyEvent, classifyImageRisk } from '../services/safetyService';
import { ChatMessage, RiskLevel } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SettingsPanel, { UserSettings } from './SettingsPanel';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const defaultSettings: UserSettings = {
  darkMode: true,
  fontSize: 'md',
  notifications: true,
  displayName: '',
};

function loadSettings(): UserSettings {
  try {
    const saved = localStorage.getItem('shieldbot_settings');
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch { return defaultSettings; }
}

import { handleFirestoreError, OperationType } from '../services/errorService';

export default function ChatInterface({ onOpenAdmin, onOpenParental }: { onOpenAdmin: () => void, onOpenParental: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>(loadSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = auth.currentUser;

  // Apply dark/light mode to body
  useEffect(() => {
    document.body.classList.toggle('light', !userSettings.darkMode);
  }, [userSettings.darkMode]);

  useEffect(() => {
    if (!user) return;

    // Try with orderBy first, fallback to simple query if index is missing
    let q = query(
      collection(db, 'chats'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);
    }, (error) => {
      if (error.code === 'failed-precondition') {
        // Fallback: fetch without orderBy and sort in memory
        const fallbackQ = query(collection(db, 'chats'), where('uid', '==', user.uid));
        onSnapshot(fallbackQ, (snapshot) => {
          const msgs = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
            .sort((a, b) => a.timestamp - b.timestamp);
          setMessages(msgs);
        });
      } else {
        handleFirestoreError(error, OperationType.LIST, 'chats');
      }
    });

    return () => unsubscribe();
  }, [user]);

  const clearHistory = async () => {
    if (!user || !window.confirm("Are you sure you want to clear your chat history? This cannot be undone.")) return;
    try {
      const q = query(collection(db, 'chats'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'chats (clear history)');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    if (!user) return;

    setIsLoading(true);
    const userMsg: ChatMessage = {
      uid: user.uid,
      text: imageBase64 ? `${text} [Image Attached]` : text,
      sender: 'user',
      timestamp: Date.now(),
      riskLevel: 'Safe',
    };

    try {
      let safetyResult;
      if (imageBase64) {
        safetyResult = await classifyImageRisk(imageBase64, user.uid, text);
      } else {
        safetyResult = await classifyRisk(text, user.uid);
      }

      userMsg.riskLevel = safetyResult.riskLevel;
      userMsg.riskCategory = safetyResult.category;
      userMsg.explanation = safetyResult.explanation;

      await addDoc(collection(db, 'chats'), userMsg).catch(err => handleFirestoreError(err, OperationType.CREATE, 'chats'));
      await logSafetyEvent(user.uid, userMsg.text, safetyResult);

      const botResponseText = safetyResult.suggestedResponse;

      const botMsg: ChatMessage = {
        uid: user.uid,
        text: botResponseText,
        sender: 'bot',
        timestamp: Date.now() + 100,
        riskLevel: 'Safe',
      };

      await addDoc(collection(db, 'chats'), botMsg).catch(err => handleFirestoreError(err, OperationType.CREATE, 'chats'));
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
      setInput('');
      setSelectedImage(null);
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };
    recognition.start();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-luxury-black font-sans text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-4 glass-header z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-light tracking-tight">Shield<span className="font-medium">Bot</span></h1>
            <p className="luxury-label hidden sm:block">Prestige Safety AI</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onOpenParental} 
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white"
            title="Parental Dashboard"
          >
            <Users className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)} 
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white"
            title="Admin Panel"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={clearHistory} 
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-red-400"
            title="Clear Chat History"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1" />
          <button 
            onClick={() => auth.signOut()} 
            className="p-2 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex w-full", msg.sender === 'user' ? "justify-end" : "justify-start")}
              >
                <div className={cn(
                  "max-w-[75%] px-6 py-4 relative group transition-all",
                  msg.sender === 'user' 
                    ? "bg-white text-luxury-black rounded-2xl rounded-tr-none font-medium" 
                    : "glass-card rounded-2xl rounded-tl-none"
                )}>
                  {msg.riskLevel !== 'Safe' && msg.sender === 'user' && (
                    <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-orange-400">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{msg.riskLevel} Risk Detected</span>
                    </div>
                  )}
                  
                  <p className={cn(
                    "leading-relaxed whitespace-pre-wrap font-medium",
                    `chat-text-${userSettings.fontSize}`
                  )}>
                    {msg.text}
                  </p>

                  {msg.explanation && (
                    <div className="absolute -top-12 left-0 hidden group-hover:flex bg-white text-luxury-black text-[10px] px-3 py-1.5 rounded-lg shadow-2xl z-10 w-56 font-medium border border-stone-200">
                      <Info className="w-3 h-3 mr-2 shrink-0" />
                      {msg.explanation}
                    </div>
                  )}

                  <div className={cn(
                    "text-[9px] mt-3 opacity-40 uppercase tracking-widest",
                    msg.sender === 'user' ? "text-luxury-black/60" : "text-white/40"
                  )}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="px-4 sm:px-8 py-4 glass-header shrink-0">
        <div className="max-w-3xl mx-auto">
          {selectedImage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 relative inline-block"
            >
              <img src={selectedImage} alt="Selected" className="h-24 w-24 object-cover rounded-2xl border border-white/20 shadow-2xl" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-3 -right-3 bg-white text-luxury-black rounded-full p-1.5 shadow-xl hover:scale-110 transition-transform"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}
          
          <div className="relative flex items-center gap-4">
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="p-3.5 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white border border-white/10"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            
            <button 
              onClick={startVoiceInput} 
              className={cn(
                "p-3.5 rounded-full transition-all border border-white/10",
                isListening ? "bg-red-500/20 text-red-500 border-red-500/50 animate-pulse" : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <Mic className="w-6 h-6" />
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend(input, selectedImage || undefined)}
                placeholder="Compose a message..."
                className="w-full bg-white/5 border border-white/10 rounded-full px-8 py-4 focus:ring-1 focus:ring-white/30 focus:bg-white/10 outline-none transition-all text-sm placeholder:text-white/20"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            <button 
              onClick={() => handleSend(input, selectedImage || undefined)}
              disabled={(!input.trim() && !selectedImage) || isLoading}
              className="w-14 h-14 bg-white text-luxury-black rounded-full hover:bg-stone-200 disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-2xl shadow-white/10"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-white/10" />
            <p className="luxury-label">Shielded Session Active</p>
            <div className="h-px w-8 bg-white/10" />
          </div>
        </div>
      </footer>

      {/* Settings Panel */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel
            onClose={() => setIsSettingsOpen(false)}
            settings={userSettings}
            onSettingsChange={setUserSettings}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
