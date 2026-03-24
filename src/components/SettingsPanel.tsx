import React, { useState, useEffect } from 'react';
import { X, Sun, Moon, Type, Bell, BellOff, Download, Trash2, User, Check, AlertTriangle } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';

export interface UserSettings {
  darkMode: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  notifications: boolean;
  displayName: string;
}

interface Props {
  onClose: () => void;
  settings: UserSettings;
  onSettingsChange: (s: UserSettings) => void;
}

export default function SettingsPanel({ onClose, settings, onSettingsChange }: Props) {
  const [displayName, setDisplayName] = useState(settings.displayName || auth.currentUser?.displayName || '');
  const [nameStatus, setNameStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const user = auth.currentUser;

  const update = (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    onSettingsChange(next);
    localStorage.setItem('shieldbot_settings', JSON.stringify(next));
  };

  const saveName = async () => {
    if (!user || !displayName.trim()) return;
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      await updateDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() });
      update({ displayName: displayName.trim() });
      setNameStatus('saved');
      setTimeout(() => setNameStatus('idle'), 2000);
    } catch {
      setNameStatus('error');
      setTimeout(() => setNameStatus('idle'), 2000);
    }
  };

  const exportChats = async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const q = query(collection(db, 'chats'), where('uid', '==', user.uid));
      const snap = await getDocs(q);
      const msgs = snap.docs
        .map(d => d.data())
        .sort((a, b) => a.timestamp - b.timestamp);

      const text = msgs.map(m => {
        const time = new Date(m.timestamp).toLocaleString();
        const sender = m.sender === 'user' ? (user.displayName || 'You') : 'ShieldBot';
        return `[${time}] ${sender}: ${m.text}`;
      }).join('\n');

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shieldbot-chat-export-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const deleteAccount = async () => {
    if (!user || deleteInput !== 'DELETE') return;
    setIsDeleting(true);
    try {
      // Delete all user data from Firestore
      const batch = writeBatch(db);
      const collections = ['chats', 'logs'];
      for (const col of collections) {
        const q = query(collection(db, col), where('uid', '==', user.uid));
        const snap = await getDocs(q);
        snap.docs.forEach(d => batch.delete(d.ref));
      }
      // Delete user doc
      batch.delete(doc(db, 'users', user.uid));
      await batch.commit();
      // Delete Firebase Auth account
      await deleteUser(user);
    } catch (e: any) {
      setIsDeleting(false);
      if (e.code === 'auth/requires-recent-login') {
        alert('For security, please sign out and sign back in, then try deleting your account again.');
      } else {
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  const isLight = !settings.darkMode;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={`relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden ${isLight ? 'bg-white text-stone-900' : 'bg-[#111] text-white'}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${isLight ? 'border-stone-100' : 'border-white/10'}`}>
          <h2 className="text-lg font-bold">Settings</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isLight ? 'hover:bg-stone-100' : 'hover:bg-white/10'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[75vh] px-6 py-4 space-y-6">

          {/* Display Name */}
          <section>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isLight ? 'text-stone-400' : 'text-white/40'}`}>Profile</p>
            <div className={`flex items-center gap-2 p-1 rounded-2xl border ${isLight ? 'border-stone-200 bg-stone-50' : 'border-white/10 bg-white/5'}`}>
              <div className={`p-2.5 rounded-xl ${isLight ? 'bg-white' : 'bg-white/10'}`}>
                <User className="w-4 h-4" />
              </div>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your display name"
                className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:opacity-40"
              />
              <button
                onClick={saveName}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  nameStatus === 'saved' ? 'bg-green-500 text-white' :
                  nameStatus === 'error' ? 'bg-red-500 text-white' :
                  'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {nameStatus === 'saved' ? '✓ Saved' : nameStatus === 'error' ? 'Error' : 'Save'}
              </button>
            </div>
          </section>

          {/* Appearance */}
          <section>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isLight ? 'text-stone-400' : 'text-white/40'}`}>Appearance</p>
            <div className={`rounded-2xl border divide-y ${isLight ? 'border-stone-200 divide-stone-100' : 'border-white/10 divide-white/5'}`}>

              {/* Dark/Light mode */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  {settings.darkMode ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                  <span className="text-sm font-medium">{settings.darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                </div>
                <button
                  onClick={() => update({ darkMode: !settings.darkMode })}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.darkMode ? 'bg-blue-500' : 'bg-stone-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.darkMode ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Font Size */}
              <div className="px-4 py-3.5">
                <div className="flex items-center gap-3 mb-3">
                  <Type className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium">Chat Font Size</span>
                </div>
                <div className={`flex gap-2 rounded-xl p-1 ${isLight ? 'bg-stone-100' : 'bg-white/5'}`}>
                  {(['sm', 'md', 'lg'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => update({ fontSize: size })}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        settings.fontSize === size
                          ? 'bg-white text-stone-900 shadow'
                          : isLight ? 'text-stone-500 hover:text-stone-700' : 'text-white/40 hover:text-white'
                      }`}
                    >
                      {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isLight ? 'text-stone-400' : 'text-white/40'}`}>Notifications</p>
            <div className={`rounded-2xl border ${isLight ? 'border-stone-200' : 'border-white/10'}`}>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  {settings.notifications ? <Bell className="w-5 h-5 text-green-400" /> : <BellOff className="w-5 h-5 opacity-40" />}
                  <div>
                    <p className="text-sm font-medium">Safety Alerts</p>
                    <p className={`text-xs ${isLight ? 'text-stone-400' : 'text-white/40'}`}>Notify on high-risk messages</p>
                  </div>
                </div>
                <button
                  onClick={() => update({ notifications: !settings.notifications })}
                  className={`w-12 h-6 rounded-full transition-all relative ${settings.notifications ? 'bg-green-500' : isLight ? 'bg-stone-300' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${settings.notifications ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Data */}
          <section>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${isLight ? 'text-stone-400' : 'text-white/40'}`}>Data</p>
            <div className={`rounded-2xl border divide-y ${isLight ? 'border-stone-200 divide-stone-100' : 'border-white/10 divide-white/5'}`}>
              <button
                onClick={exportChats}
                disabled={isExporting}
                className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left ${isLight ? 'hover:bg-stone-50' : 'hover:bg-white/5'}`}
              >
                <Download className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm font-medium">{isExporting ? 'Exporting...' : 'Export Chat History'}</p>
                  <p className={`text-xs ${isLight ? 'text-stone-400' : 'text-white/40'}`}>Download as .txt file</p>
                </div>
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="pb-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-red-400">Danger Zone</p>
            <div className="rounded-2xl border border-red-500/20">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-500/10 transition-colors text-left rounded-2xl"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-400">Delete Account</p>
                  <p className={`text-xs ${isLight ? 'text-stone-400' : 'text-white/40'}`}>Permanently delete all your data</p>
                </div>
              </button>
            </div>
          </section>
        </div>
      </motion.div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10 p-6"
          >
            <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl ${isLight ? 'bg-white' : 'bg-[#1a1a1a]'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold">Delete Account</h3>
                  <p className={`text-xs ${isLight ? 'text-stone-400' : 'text-white/40'}`}>This cannot be undone</p>
                </div>
              </div>
              <p className={`text-sm mb-4 ${isLight ? 'text-stone-600' : 'text-white/60'}`}>
                All your messages, logs, and account data will be permanently deleted. Type <strong>DELETE</strong> to confirm.
              </p>
              <input
                value={deleteInput}
                onChange={e => setDeleteInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className={`w-full px-4 py-3 rounded-xl border text-sm font-mono mb-4 outline-none ${isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'}`}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                  className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${isLight ? 'bg-stone-100 hover:bg-stone-200' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  Cancel
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleteInput !== 'DELETE' || isDeleting}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
