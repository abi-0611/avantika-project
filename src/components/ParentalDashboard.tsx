import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Eye, AlertTriangle, X, Plus, Trash2, ChevronRight, MessageSquare } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';
import { SupervisionLink, ChildSettings, ChatMessage, SafetyLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError, OperationType } from '../services/errorService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ParentalDashboard({ onClose }: { onClose: () => void }) {
  const [links, setLinks] = useState<SupervisionLink[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [childChats, setChildChats] = useState<ChatMessage[]>([]);
  const [childLogs, setChildLogs] = useState<SafetyLog[]>([]);
  const [childSettings, setChildSettings] = useState<ChildSettings | null>(null);
  const [newChildEmail, setNewChildEmail] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'supervision'), where('guardianUid', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setLinks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SupervisionLink)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'supervision'));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!selectedChild) return;

    // Fetch child settings
    const settingsUnsub = onSnapshot(doc(db, 'childSettings', selectedChild), (doc) => {
      if (doc.exists()) {
        setChildSettings(doc.data() as ChildSettings);
      } else {
        setChildSettings({ childUid: selectedChild, blockedKeywords: [], blockedTopics: [] });
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `childSettings/${selectedChild}`));

    // Fetch child chats
    const chatsQuery = query(collection(db, 'chats'), where('uid', '==', selectedChild));
    const chatsUnsub = onSnapshot(chatsQuery, (snapshot) => {
      setChildChats(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)).sort((a, b) => b.timestamp - a.timestamp));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `chats (child: ${selectedChild})`));

    // Fetch child logs
    const logsQuery = query(collection(db, 'logs'), where('uid', '==', selectedChild));
    const logsUnsub = onSnapshot(logsQuery, (snapshot) => {
      setChildLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SafetyLog)).sort((a, b) => b.timestamp - a.timestamp));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `logs (child: ${selectedChild})`));

    return () => {
      settingsUnsub();
      chatsUnsub();
      logsUnsub();
    };
  }, [selectedChild]);

  const linkChild = async () => {
    if (!newChildEmail || !user) return;
    setIsLinking(true);
    
    try {
      // Find child by email
      const usersQuery = query(collection(db, 'users'), where('email', '==', newChildEmail.trim().toLowerCase()));
      const userSnap = await getDocs(usersQuery);
      
      if (userSnap.empty) {
        alert("Child account not found. Please ensure they have logged in once and their email matches exactly.");
        return;
      }

      const childUid = userSnap.docs[0].id;
      const linkId = `${user.uid}_${childUid}`;
      
      await setDoc(doc(db, 'supervision', linkId), {
        guardianUid: user.uid,
        childUid: childUid,
        childEmail: newChildEmail.trim().toLowerCase(),
        status: 'active'
      });

      setNewChildEmail('');
      alert("Account linked successfully!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'supervision');
    } finally {
      setIsLinking(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword || !selectedChild) return;
    try {
      const updatedKeywords = [...(childSettings?.blockedKeywords || []), newKeyword.trim()];
      await setDoc(doc(db, 'childSettings', selectedChild), {
        childUid: selectedChild,
        blockedKeywords: updatedKeywords,
        blockedTopics: childSettings?.blockedTopics || []
      });
      setNewKeyword('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `childSettings/${selectedChild}`);
    }
  };

  const removeKeyword = async (keyword: string) => {
    if (!selectedChild) return;
    try {
      const updatedKeywords = (childSettings?.blockedKeywords || []).filter(k => k !== keyword);
      await updateDoc(doc(db, 'childSettings', selectedChild), {
        blockedKeywords: updatedKeywords
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `childSettings/${selectedChild}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-stone-50 z-50 flex flex-col overflow-hidden text-stone-900"
    >
        <header className="px-4 sm:px-8 py-4 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-600 shrink-0" />
            <div>
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-stone-900">Parental Supervision</h2>
              <p className="text-xs sm:text-sm text-stone-500">Monitor and protect your child's digital experience</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors shrink-0 text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-hidden flex">
          <aside className="w-64 sm:w-72 border-r border-stone-200 bg-white overflow-y-auto p-5 flex flex-col">
            <div className="mb-6">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Linked Accounts</h3>
              <div className="space-y-2">
                {links.map(link => (
                  <button
                    key={link.id}
                    onClick={() => { setSelectedChild(link.childUid); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      selectedChild === link.childUid 
                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' 
                        : 'hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-indigo-600">{link.childEmail[0].toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-medium truncate">{link.childEmail}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </button>
                ))}
                {links.length === 0 && (
                  <p className="text-xs text-stone-400 italic px-2">No linked accounts yet</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Link New Child</h3>
              <div className="space-y-3">
                <input 
                  type="email"
                  placeholder="Child's email address"
                  value={newChildEmail}
                  onChange={e => setNewChildEmail(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-indigo-300 transition-colors"
                />
                <button 
                  onClick={linkChild}
                  disabled={isLinking || !newChildEmail}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold disabled:opacity-50"
                >
                  {isLinking ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {isLinking ? 'Linking...' : 'Link Account'}
                </button>
              </div>
            </div>

            <div className="mt-auto">
              <button 
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 bg-stone-800 text-white py-3 rounded-xl hover:bg-stone-900 transition-all text-sm font-semibold"
              >
                <X className="w-4 h-4" />
                Exit Dashboard
              </button>
            </div>
          </aside>

          <div className="flex-1 overflow-y-auto p-6 sm:p-10">
            <AnimatePresence mode="wait">
              {!selectedChild ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center"
                >
                  <Shield className="w-20 h-20 mb-4 text-stone-200" />
                  <p className="text-sm text-stone-400 font-medium">Select a child account to monitor</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-stone-800">
                        {links.find(l => l.childUid === selectedChild)?.childEmail}
                      </h2>
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mt-1">Active Supervision</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Live</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 text-stone-400 mb-3">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-widest">Total Chats</span>
                      </div>
                      <span className="text-3xl font-bold text-stone-800">{childChats.length}</span>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 text-orange-500 mb-3">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-widest">Safety Alerts</span>
                      </div>
                      <span className="text-3xl font-bold text-orange-600">{childLogs.length}</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 text-indigo-500 mb-3">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-widest">Active Filters</span>
                      </div>
                      <span className="text-3xl font-bold text-indigo-600">{childSettings?.blockedKeywords.length || 0}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <section>
                      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> Custom Content Filters
                      </h3>
                      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm">
                        <div className="flex gap-3 mb-4">
                          <input 
                            placeholder="Add keyword to block..."
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addKeyword()}
                            className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:border-indigo-300 transition-colors"
                          />
                          <button onClick={addKeyword} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shrink-0">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {childSettings?.blockedKeywords.map(k => (
                            <span key={k} className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                              {k}
                              <button onClick={() => removeKeyword(k)} className="text-red-400 hover:text-red-600 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {(!childSettings?.blockedKeywords || childSettings.blockedKeywords.length === 0) && (
                            <p className="text-xs text-stone-400 italic">No custom filters active</p>
                          )}
                        </div>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" /> Recent Safety Alerts
                      </h3>
                      <div className="space-y-3 max-h-72 overflow-y-auto">
                        {childLogs.map(log => (
                          <div key={log.id} className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">{log.riskLevel} Risk</span>
                              <span className="text-xs text-stone-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-stone-700 font-medium">"{log.text}"</p>
                            <div className="mt-2 text-xs text-orange-500 font-semibold">Category: {log.riskCategory}</div>
                          </div>
                        ))}
                        {childLogs.length === 0 && (
                          <div className="p-6 bg-white border border-stone-200 rounded-2xl text-center">
                            <p className="text-sm text-stone-400">No safety alerts recorded</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  <section>
                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" /> Full Chat Transcript
                    </h3>
                    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="max-h-96 overflow-y-auto p-5 space-y-4">
                        {childChats.map(chat => (
                          <div key={chat.id} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={cn(
                              "max-w-[70%] px-4 py-3 rounded-2xl text-sm font-medium",
                              chat.sender === 'user' 
                                ? "bg-indigo-600 text-white rounded-tr-none" 
                                : "bg-stone-100 text-stone-800 rounded-tl-none"
                            )}>
                              {chat.riskLevel !== 'Safe' && chat.sender === 'user' && (
                                <div className="text-[10px] font-bold text-orange-300 mb-1 uppercase tracking-widest">⚠ Flagged: {chat.riskLevel}</div>
                              )}
                              {chat.text}
                            </div>
                          </div>
                        ))}
                        {childChats.length === 0 && (
                          <p className="text-center text-stone-400 text-sm">No conversation history available</p>
                        )}
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
    </motion.div>
  );
}
