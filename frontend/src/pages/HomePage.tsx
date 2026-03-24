import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Mic, ShieldAlert, Users, ArrowRight, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import RiskBadge from '../components/RiskBadge';

export default function HomePage() {
  const { user } = useAuth();
  const [recentChats, setRecentChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const chats = await apiClient.get<any[]>('/chats');
        setRecentChats(chats.slice(0, 5)); // Get latest 5
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const quickActions = [
    { title: 'AI Chat', icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10', to: '/chat' },
    { title: 'Voice Chat', icon: Mic, color: 'text-secondary', bg: 'bg-secondary/10', to: '/chat' },
    ...(user?.role === 'parent' || user?.role === 'admin' ? [
      { title: 'Parental', icon: Users, color: 'text-success', bg: 'bg-success/10', to: '/parental' }
    ] : []),
    ...(user?.role === 'admin' ? [
      { title: 'Admin', icon: ShieldAlert, color: 'text-danger', bg: 'bg-danger/10', to: '/admin' }
    ] : []),
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
            Good morning, <span className="text-gradient">{user?.displayName || user?.email || 'there'}</span>!
          </h1>
          <p className="text-text-secondary font-medium">Ready to explore safely today?</p>
        </div>
        <div className="hidden md:flex w-14 h-14 rounded-full bg-surface border border-border items-center justify-center text-xl font-bold text-primary shadow-lg shadow-primary/10">
          {(user?.displayName || user?.email || 'U')?.charAt(0).toUpperCase()}
        </div>
      </motion.div>

      {/* Stats Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium">Total Chats</p>
            <p className="text-2xl font-bold text-white">128</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center text-success">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium">Safe Messages</p>
            <p className="text-2xl font-bold text-white">98%</p>
          </div>
        </div>
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300 col-span-2 md:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center text-warning">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium">Alerts Today</p>
            <p className="text-2xl font-bold text-white">2</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-display font-bold text-white mb-4">Quick Actions</h2>
        <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-4 pb-4 no-scrollbar">
          {quickActions.map((action, idx) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="min-w-[140px] md:min-w-0"
            >
              <Link 
                to={action.to}
                className="glass-panel p-6 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-surface-hover transition-colors group"
              >
                <div className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110", action.bg, action.color)}>
                  <action.icon className="w-7 h-7" />
                </div>
                <span className="font-medium text-text-primary">{action.title}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Conversations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display font-bold text-white">Recent Conversations</h2>
          <Link to="/chat" className="text-primary hover:text-primary-hover font-medium flex items-center gap-1 text-sm">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="glass-panel rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
            </div>
          ) : recentChats.length > 0 ? (
            <div className="divide-y divide-border/50">
              {recentChats.map((chat, idx) => (
                <motion.div 
                  key={chat.id || idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="p-4 hover:bg-surface/50 transition-colors flex items-center gap-4 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-text-secondary shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{chat.text || 'New Conversation'}</p>
                    <p className="text-sm text-text-secondary truncate">
                      {new Date(chat.timestamp || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                  <RiskBadge level={chat.riskLevel || 'Safe'} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-text-secondary flex flex-col items-center gap-3">
              <MessageSquare className="w-12 h-12 opacity-20" />
              <p>No recent conversations found.</p>
              <Link to="/chat" className="text-primary font-medium hover:underline mt-2">Start a new chat</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
