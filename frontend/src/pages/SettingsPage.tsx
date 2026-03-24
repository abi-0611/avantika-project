import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Moon, Sun, Type, Bell, Brain, Download, Trash2, Save, X, AlertTriangle, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { useToast } from '../components/Toast';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [notifications, setNotifications] = useState(true);
  const [memory, setMemory] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleSaveProfile = async () => {
    try {
      const updated = await authService.updateProfile({ displayName });
      updateUser(updated);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    try {
      await authService.deleteAccount();
      showToast('Account deleted', 'success');
      navigate('/auth');
    } catch (error) {
      showToast('Failed to delete account', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 pb-24">
      <h1 className="text-3xl font-display font-bold text-white mb-8">Settings</h1>

      {/* Profile Section */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-border/50">
        <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Profile
        </h2>
        
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-primary/20 shrink-0">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full max-w-md bg-surface border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full max-w-md bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-text-secondary cursor-not-allowed"
              />
            </div>
            <button 
              onClick={handleSaveProfile}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-border/50">
        <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-secondary" /> Preferences
        </h2>

        <div className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Appearance</p>
              <p className="text-sm text-text-secondary">Choose your preferred theme</p>
            </div>
            <div className="flex bg-surface border border-border rounded-xl p-1">
              <button 
                onClick={() => setTheme('dark')}
                className={cn("p-2 rounded-lg transition-all flex items-center gap-2", theme === 'dark' ? "bg-primary text-white" : "text-text-secondary hover:text-white")}
              >
                <Moon className="w-4 h-4" /> <span className="text-sm font-medium hidden sm:block">Dark</span>
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={cn("p-2 rounded-lg transition-all flex items-center gap-2", theme === 'light' ? "bg-primary text-white" : "text-text-secondary hover:text-white")}
              >
                <Sun className="w-4 h-4" /> <span className="text-sm font-medium hidden sm:block">Light</span>
              </button>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Font Size</p>
              <p className="text-sm text-text-secondary">Adjust text size in chat</p>
            </div>
            <div className="flex bg-surface border border-border rounded-xl p-1">
              {['sm', 'md', 'lg'].map((size) => (
                <button 
                  key={size}
                  onClick={() => setFontSize(size as any)}
                  className={cn("px-4 py-2 rounded-lg transition-all text-sm font-medium uppercase", fontSize === size ? "bg-primary text-white" : "text-text-secondary hover:text-white")}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-border/50" />

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Notifications</p>
              <p className="text-sm text-text-secondary">Receive alerts and updates</p>
            </div>
            <button 
              onClick={() => setNotifications(!notifications)}
              className={cn("w-12 h-6 rounded-full transition-colors relative", notifications ? "bg-primary" : "bg-surface border border-border")}
            >
              <motion.div 
                layout
                className={cn("w-4 h-4 rounded-full bg-white absolute top-1", notifications ? "right-1" : "left-1")}
              />
            </button>
          </div>

          <hr className="border-border/50" />

          {/* Memory */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white flex items-center gap-2">
                AI Memory <Brain className="w-4 h-4 text-primary" />
              </p>
              <p className="text-sm text-text-secondary">Allow AI to remember past conversations</p>
            </div>
            <button 
              onClick={() => setMemory(!memory)}
              className={cn("w-12 h-6 rounded-full transition-colors relative", memory ? "bg-primary" : "bg-surface border border-border")}
            >
              <motion.div 
                layout
                className={cn("w-4 h-4 rounded-full bg-white absolute top-1", memory ? "right-1" : "left-1")}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Data & Danger Zone */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-border/50">
        <h2 className="text-xl font-display font-bold text-white mb-6">Data & Privacy</h2>
        
        <div className="space-y-4">
          <button className="w-full bg-surface hover:bg-surface-hover border border-border text-white px-6 py-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p>Export Chat History</p>
                <p className="text-xs text-text-secondary font-normal">Download a copy of your data</p>
              </div>
            </div>
          </button>

          <button 
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-danger/10 hover:bg-danger/20 border border-danger/30 text-danger px-6 py-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5" />
              <div className="text-left">
                <p>Delete Account</p>
                <p className="text-xs opacity-80 font-normal">Permanently remove your account and data</p>
              </div>
            </div>
          </button>
        </div>
      </section>

      <div className="flex justify-center pt-4">
        <button 
          onClick={logout}
          className="text-text-secondary hover:text-white transition-colors font-medium"
        >
          Sign Out
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 rounded-3xl max-w-md w-full border border-danger/30"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-display font-bold text-danger flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" /> Delete Account
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-text-secondary hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-text-primary mb-4">
              This action cannot be undone. All your data, chat history, and settings will be permanently deleted.
            </p>
            <p className="text-sm text-text-secondary mb-4">
              Please type <span className="font-mono text-white font-bold bg-surface px-1 py-0.5 rounded">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-danger/50 mb-6"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-surface hover:bg-surface-hover text-white py-2.5 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 bg-danger text-white py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Forever
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
