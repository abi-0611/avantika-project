import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-mesh z-0 pointer-events-none"></div>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block z-10">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar pb-20 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden z-20">
        <BottomNav />
      </div>
    </div>
  );
}
