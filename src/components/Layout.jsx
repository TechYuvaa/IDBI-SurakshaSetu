import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Shield, Activity, ShieldCheck, HelpCircle, Bell, Settings, ShieldAlert, LogOut, Check, Info, AlertTriangle, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSecurity } from '../context/SecurityContext';
import ErrorBoundary from './ErrorBoundary';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifications, markAllNotificationsRead } = useSecurity();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  // Close notifications panel on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { name: 'COMMAND CENTER', path: '/', icon: LayoutDashboard },
    { name: 'SCAM CHECKER', path: '/check', icon: Shield },
    { name: 'TRANSACTION MONITOR', path: '/monitor', icon: Activity },
    { name: 'SAFETY PROFILE', path: '/profile', icon: ShieldCheck },
  ];

  // Append Admin Console if role matches (Phase 8 Admin features)
  if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
    navItems.push({ name: 'ADMIN SECURITY', path: '/admin/auth', icon: ShieldAlert });
  }

  const topNavItems = [
    { label: 'PROTOCOL', path: '/' },
    { label: 'MONITOR', path: '/monitor' },
    { label: 'VAULT', path: '/vault' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-bg text-brand-text font-sans">
      
      {/* Left Sidebar */}
      <aside className="w-64 bg-[#0d1411] border-r border-brand-primary/10 flex flex-col h-screen sticky top-0 shrink-0">
        
        {/* Logo Area */}
        <div className="p-6 pb-8 border-b border-brand-primary/10">
          <h1 className="font-display font-extrabold text-2xl text-brand-primary mb-6">SuRakshaSetu</h1>
          <div>
            <h2 className="font-display text-3xl text-brand-primary leading-tight animate-pulse">CYBER<br/>COMMAND</h2>
            <div className="text-[10px] font-mono text-brand-text-muted mt-2 tracking-widest">ACTIVE PROTOCOL: V4.2</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center gap-4 px-6 py-4 text-xs font-mono tracking-widest transition-all focus:ring-2 focus:ring-brand-primary focus:outline-none
                      ${isActive 
                        ? 'bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary shadow-[inset_20px_0_20px_-20px_rgba(117,230,204,0.3)]' 
                        : 'text-brand-text-muted hover:bg-brand-surface border-l-2 border-transparent hover:text-brand-text'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Bottom Sidebar area */}
        <div className="p-6 border-t border-brand-primary/10 space-y-6">
          <NavLink
            to="/help"
            className={({ isActive }) => `flex items-center gap-3 text-xs font-mono tracking-widest transition-colors w-full focus:ring-2 focus:ring-brand-primary focus:outline-none ${
              isActive ? 'text-brand-primary' : 'text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            HELP CENTER
          </NavLink>
          
          <div className="cyber-panel p-3 bg-brand-surface-light/50 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest">
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              SYSTEM SECURE
            </div>
            <div className="h-0.5 w-full bg-brand-primary/30 rounded-full overflow-hidden">
              <div className="h-full bg-brand-primary w-11/12"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-brand-primary/10 bg-[#0d1411]/80 backdrop-blur flex items-center justify-between px-8 shrink-0">
          <div className="flex gap-8 text-[11px] font-mono tracking-widest text-brand-text-muted">
            {topNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`hover:text-brand-text transition-colors focus:ring-1 focus:ring-brand-primary focus:outline-none ${isActive ? 'text-brand-primary font-bold' : ''}`}
                >
                  {item.label}
                </NavLink>
              );
            })}
          </div>
          <div className="flex items-center gap-5 text-brand-text-muted">
            {/* Notifications Menu Trigger */}
            <div className="relative flex items-center" ref={notifRef}>

              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="hover:text-brand-text transition-colors focus:ring-1 focus:ring-brand-primary focus:outline-none relative p-1.5 rounded-lg hover:bg-brand-surface/40" 
                title="Security Notifications Feed"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-brand-danger rounded-full ring-2 ring-[#0d1411] animate-pulse"></span>
                )}
              </button>

              {/* Notification dropdown card */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-80 max-h-[420px] cyber-panel bg-brand-surface/95 backdrop-blur-xl border border-brand-primary/20 rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 flex flex-col"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-brand-primary/10 flex justify-between items-center bg-[#0d1411]/80">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-brand-primary" />
                        <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-brand-text">SECURITY ALERTS</span>
                        {unreadCount > 0 && (
                          <span className="bg-brand-danger/25 text-brand-danger border border-brand-danger/30 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsRead}
                          className="text-[9px] font-mono text-brand-primary hover:underline flex items-center gap-1 uppercase font-bold"
                        >
                          <Check className="w-3 h-3" /> READ ALL
                        </button>
                      )}
                    </div>

                    {/* Feed Content */}
                    <div className="flex-1 overflow-y-auto divide-y divide-brand-primary/5 max-h-[320px]">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs font-mono text-brand-text-muted uppercase">
                          No Notifications Received
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isUnread = !notif.read;
                          return (
                            <div 
                              key={notif.id} 
                              className={`p-3.5 space-y-1 transition-colors text-left ${
                                isUnread ? 'bg-brand-primary/5 border-l-2 border-brand-primary' : 'hover:bg-brand-surface-light/35'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <h4 className={`text-xs font-bold font-mono tracking-wide ${
                                  notif.severity === 'critical' ? 'text-brand-danger' :
                                  notif.severity === 'warning' ? 'text-brand-warning' : 'text-brand-text'
                                }`}>
                                  {notif.title}
                                </h4>
                                <span className="text-[8px] font-mono text-brand-text-muted whitespace-nowrap ml-2">
                                  {notif.timestamp}
                                </span>
                              </div>
                              <p className="text-[10px] text-brand-text-muted leading-relaxed font-sans">
                                {notif.message}
                              </p>
                              <div className="flex items-center gap-1.5 pt-1">
                                {notif.severity === 'critical' ? (
                                  <span className="text-[7px] font-mono text-brand-danger bg-brand-danger/10 border border-brand-danger/20 px-1 rounded uppercase tracking-wider font-bold">CRITICAL</span>
                                ) : notif.severity === 'warning' ? (
                                  <span className="text-[7px] font-mono text-brand-warning bg-brand-warning/10 border border-brand-warning/20 px-1 rounded uppercase tracking-wider font-bold">WARNING</span>
                                ) : (
                                  <span className="text-[7px] font-mono text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-1 rounded uppercase tracking-wider font-bold">SECURE</span>
                                )}
                                <span className="text-[7px] font-mono text-brand-text-muted uppercase">{notif.type}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <button className="hover:text-brand-text transition-colors focus:ring-1 focus:ring-brand-primary focus:outline-none" title="Settings">
              <Settings className="w-4 h-4" />
            </button>

            {/* Sign Out Button (Phase 2 / Force & Global Logout UI) */}
            <button 
              onClick={logout}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono tracking-wider border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95"
              title="Force terminate current login session"
            >
              <LogOut className="w-3 h-3" /> LOGOUT
            </button>

            <NavLink to="/profile" className="w-7 h-7 rounded-full overflow-hidden border border-brand-primary/30 ml-2 block focus:ring-2 focus:ring-brand-primary focus:outline-none">
              <img src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user?.fullName || 'Guest'}&backgroundColor=0A1512`} alt="Profile" className="w-full h-full object-cover" />
            </NavLink>
          </div>
        </header>

        {/* Scrollable Content with Route Transitions */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto">
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </div>
        </main>
      </div>
      
    </div>
  );
};


export default Layout;
