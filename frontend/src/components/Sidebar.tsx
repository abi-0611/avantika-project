import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'motion/react';
import { Shield, MessageSquare, Home, Settings, Users, ShieldAlert, PlusCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { user } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    ...(user?.role === 'parent' || user?.role === 'admin' ? [{ to: '/parental', icon: Users, label: 'Parental' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: ShieldAlert, label: 'Admin' }] : []),
  ];

  return (
    <div className="w-[280px] h-full glass-panel border-r border-border/50 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-wide">ShieldBot</span>
      </div>

      <div className="px-4 mb-6">
        <NavLink to="/chat" className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-primary/20">
          <PlusCircle className="w-5 h-5" />
          New Chat
        </NavLink>
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
