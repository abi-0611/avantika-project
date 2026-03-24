import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'child' as 'child' | 'parent' | 'admin'
  });
  const { login, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        showToast('Welcome back!', 'success');
      } else {
        await register(formData);
        showToast('Account created successfully!', 'success');
      }
      navigate('/');
    } catch (error: any) {
      showToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden relative">
      {/* Abstract Visual Left Side (Desktop) */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-50"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float-delayed"></div>
        
        <div className="relative z-10 text-center max-w-md">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl shadow-primary/30"
          >
            <Shield className="w-16 h-16 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-5xl font-display font-bold mb-6 text-white"
          >
            Neon Noir <br/> <span className="text-gradient">Intelligence</span>
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl text-text-secondary font-medium"
          >
            The premium safety-aware AI platform for the next generation.
          </motion.p>
        </div>
      </div>

      {/* Form Right Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-border/50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-text-secondary">
              {isLogin ? 'Enter your credentials to access your dashboard.' : 'Join ShieldBot and start exploring safely.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                      type="text"
                      name="displayName"
                      placeholder="Display Name"
                      value={formData.displayName}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'child' })}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all",
                        formData.role === 'child' 
                          ? "bg-primary/20 border-primary text-primary" 
                          : "bg-surface/50 border-border text-text-secondary hover:border-text-secondary/50"
                      )}
                    >
                      <UserIcon className="w-6 h-6" />
                      <span className="font-medium">Child</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'parent' })}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all",
                        formData.role === 'parent' 
                          ? "bg-secondary/20 border-secondary text-secondary" 
                          : "bg-surface/50 border-border text-text-secondary hover:border-text-secondary/50"
                      )}
                    >
                      <Shield className="w-6 h-6" />
                      <span className="font-medium">Parent</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-text-secondary hover:text-white transition-colors text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
