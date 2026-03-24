import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import ChatInterface from './components/ChatInterface';
import AdminDashboard from './components/AdminDashboard';
import ParentalDashboard from './components/ParentalDashboard';
import { Shield, Lock, LogIn, AlertCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { handleFirestoreError, OperationType } from './services/errorService';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isParentalOpen, setIsParentalOpen] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            setShowRoleSelection(true);
          } else if (!userSnap.data().role) {
            setShowRoleSelection(true);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async (intendedRole?: 'parent' | 'child') => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists() || !userSnap.data().role) {
        await setDoc(userRef, {
          email: currentUser.email?.toLowerCase(),
          displayName: currentUser.displayName,
          role: intendedRole || 'user',
          createdAt: Date.now()
        }, { merge: true });
        setShowRoleSelection(false);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectRole = async (role: 'parent' | 'child' | 'user') => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { role }, { merge: true });
      setShowRoleSelection(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-stone-500 font-medium animate-pulse">Initializing ShieldBot...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-luxury-black flex items-center justify-center p-6 font-sans overflow-hidden relative">
        {/* Atmospheric Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="w-full max-w-md text-center z-10"
        >
          <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-12 relative">
            <Shield className="w-10 h-10 text-white" />
            <div className="absolute inset-0 rounded-full border border-white/5 animate-ping" />
          </div>
          
          <h1 className="text-5xl font-light text-white tracking-tighter mb-4">
            Shield<span className="font-medium">Bot</span>
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="h-px w-8 bg-white/10" />
            <p className="luxury-label">Prestige Safety AI</p>
            <div className="h-px w-8 bg-white/10" />
          </div>

          <p className="text-white/40 mb-12 leading-relaxed font-light text-sm px-4">
            A refined intelligence designed to protect, guide, and ensure digital well-being through advanced risk classification.
          </p>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-red-500/10 text-red-400 text-xs rounded-2xl flex items-center gap-3 border border-red-500/20"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-left">{error}</p>
            </motion.div>
          )}

          <div className="space-y-4">
            <button 
              onClick={() => handleLogin('parent')}
              className="w-full flex items-center justify-center gap-4 bg-white text-luxury-black py-5 rounded-full font-semibold hover:bg-stone-200 transition-all shadow-2xl shadow-white/5 group"
            >
              <Users className="w-5 h-5" />
              Parent Portal
            </button>
            <button 
              onClick={() => handleLogin('child')}
              className="w-full flex items-center justify-center gap-4 bg-white/5 border border-white/10 text-white py-5 rounded-full font-semibold hover:bg-white/10 transition-all group"
            >
              <Shield className="w-5 h-5" />
              Child Sanctuary
            </button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-3 text-white/20 text-[10px] font-medium uppercase tracking-[0.3em]">
            <Lock className="w-3 h-3" />
            <span>End-to-End Encrypted</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showRoleSelection) {
    return (
      <div className="h-screen bg-luxury-black flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <h2 className="text-3xl font-light text-white mb-8">Choose Your Path</h2>
          <div className="grid grid-cols-1 gap-6">
            <button 
              onClick={() => selectRole('parent')}
              className="p-8 glass-card rounded-3xl hover:bg-white/10 transition-all group text-left"
            >
              <Users className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">I am a Parent</h3>
              <p className="text-sm text-white/40">Monitor and protect your child's digital experience.</p>
            </button>
            <button 
              onClick={() => selectRole('child')}
              className="p-8 glass-card rounded-3xl hover:bg-white/10 transition-all group text-left"
            >
              <Shield className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">I am a Child</h3>
              <p className="text-sm text-white/40">Safe, guided exploration with AI companionship.</p>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <ChatInterface 
        onOpenAdmin={() => setIsAdminOpen(true)} 
        onOpenParental={() => setIsParentalOpen(true)}
      />
      <AnimatePresence>
        {isAdminOpen && (
          <AdminDashboard onClose={() => setIsAdminOpen(false)} />
        )}
        {isParentalOpen && (
          <ParentalDashboard onClose={() => setIsParentalOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
