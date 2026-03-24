import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Settings, Users, ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function BottomNav() {
  const { user } = useAuth();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/chat', icon: MessageSquare, label: 'Chat' },
    ...(user?.role === 'parent' || user?.role === 'admin' ? [{ to: '/parental', icon: Users, label: 'Parental' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', icon: ShieldAlert, label: 'Admin' }] : []),
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-panel border-t border-border/50 pb-safe">
      <nav className="flex items-center justify-around p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-colors",
              isActive ? "text-primary" : "text-text-secondary hover:text-text-primary"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 bg-primary/10 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn("w-6 h-6 mb-1 relative z-10", isActive && "fill-primary/20")} />
                <span className="text-[10px] font-medium relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
