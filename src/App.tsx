import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import AdminDashboard from './components/AdminDashboard';
import ParentalDashboard from './components/ParentalDashboard';
import { Shield, Lock, LogIn, AlertCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import type { AppRole } from './services/authService';

export default function App() {
  const { user, loading, login, register } = useAuth();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isParentalOpen, setIsParentalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AppRole>('parent');

  const submit = async () => {
    setError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, displayName, role);
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
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

          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setMode('login')}
              className={
                mode === 'login'
                  ? 'px-6 py-2 rounded-full bg-white text-luxury-black text-sm font-semibold'
                  : 'px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all'
              }
            >
              <LogIn className="w-4 h-4 inline-block mr-2" />
              Login
            </button>
            <button
              onClick={() => setMode('register')}
              className={
                mode === 'register'
                  ? 'px-6 py-2 rounded-full bg-white text-luxury-black text-sm font-semibold'
                  : 'px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all'
              }
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Register
            </button>
          </div>

          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="luxury-label">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/10"
                placeholder="you@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="luxury-label">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/10"
                placeholder="••••••••"
              />
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <label className="luxury-label">Display Name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    type="text"
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/10"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="luxury-label">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AppRole)}
                    className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:ring-2 focus:ring-white/10"
                  >
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                  </select>
                </div>
              </>
            )}

            <button
              disabled={loading}
              onClick={submit}
              className="w-full flex items-center justify-center gap-4 bg-white text-luxury-black py-5 rounded-full font-semibold hover:bg-stone-200 transition-all shadow-2xl shadow-white/5 disabled:opacity-60"
            >
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              {mode === 'login' ? 'Login' : 'Create Account'}
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
