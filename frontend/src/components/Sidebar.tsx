import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, MessageSquare, Home, Settings, Users, ShieldAlert, PlusCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { apiClient } from '../services/apiClient';

type ConversationListItem = {
  id: string;
  title: string | null;
  createdAt: number;
  updatedAt: number;
  lastMessageText?: string | null;
  lastMessageTimestamp?: number | null;
};

export default function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);

  const activeConversationId = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get('c');
  }, [location.search]);

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    ...(user?.role === 'parent' || user?.role === 'admin' ? [{ to: '/parental', icon: Users, label: 'Parental' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: ShieldAlert, label: 'Admin' }] : []),
  ];

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const load = async () => {
      try {
        const rows = await apiClient.get<ConversationListItem[]>('/conversations');
        if (!cancelled) setConversations(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setConversations([]);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const handleNewChat = async () => {
    try {
      const created = await apiClient.post<{ id: string }>('/conversations', {});
      navigate(`/chat?c=${encodeURIComponent(created.id)}`);
    } catch (err) {
      // Fall back to chat route if conversation creation fails.
      navigate('/chat');
    }
  };

  return (
    <div className="w-[280px] h-full glass-panel border-r border-border/50 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-wide">ShieldBot</span>
      </div>

      <div className="px-4 mb-6">
        <button
          type="button"
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-primary/20"
        >
          <PlusCircle className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Conversation History */}
      <div className="px-4 mb-4">
        <p className="text-xs font-medium text-text-secondary px-2 mb-2">Chat History</p>
        <div className="space-y-1 max-h-[35vh] overflow-y-auto no-scrollbar">
          {conversations.map((c) => {
            const title = (c.title && c.title.trim().length > 0 ? c.title : c.lastMessageText) || 'New Conversation';
            const isActive = activeConversationId === c.id;
            return (
              <NavLink
                key={c.id}
                to={{ pathname: '/chat', search: `?c=${encodeURIComponent(c.id)}` }}
                className={() => cn(
                  'block px-3 py-2 rounded-xl border transition-colors',
                  isActive
                    ? 'bg-surface border-border text-text-primary'
                    : 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-surface/60'
                )}
              >
                <p className="text-sm font-medium truncate">{title}</p>
                {c.lastMessageText && (
                  <p className="text-xs text-text-secondary truncate">{c.lastMessageText}</p>
                )}
              </NavLink>
            );
          })}

          {conversations.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-secondary">
              No chats yet.
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
              isActive 
                ? "bg-primary/10 text-primary" 
                : "text-text-secondary hover:text-text-primary hover:bg-surface"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-border/50">
        <NavLink 
          to="/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all",
            isActive ? "bg-surface" : "hover:bg-surface"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-border text-primary font-bold">
            {user?.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-text-primary">{user?.displayName}</p>
            <p className="text-xs text-text-secondary truncate capitalize">{user?.role}</p>
          </div>
          <Settings className="w-5 h-5 text-text-secondary" />
        </NavLink>
      </div>
    </div>
  );
}
