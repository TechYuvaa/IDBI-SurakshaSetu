import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Shield, Activity, ShieldCheck, HelpCircle, Bell, Settings } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { name: 'COMMAND CENTER', path: '/', icon: LayoutDashboard },
    { name: 'SCAM CHECKER', path: '/check', icon: Shield },
    { name: 'TRANSACTION MONITOR', path: '/monitor', icon: Activity },
    { name: 'SAFETY PROFILE', path: '/profile', icon: ShieldCheck },
  ];

  // Top navbar items with active state based on current route
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
          
          <div className="flex items-center gap-6 text-brand-text-muted">
            <button className="hover:text-brand-text transition-colors focus:ring-1 focus:ring-brand-primary focus:outline-none"><Bell className="w-4 h-4" /></button>
            <button className="hover:text-brand-text transition-colors focus:ring-1 focus:ring-brand-primary focus:outline-none"><Settings className="w-4 h-4" /></button>
            <NavLink to="/profile" className="w-7 h-7 rounded-full overflow-hidden border border-brand-primary/30 ml-2 block focus:ring-2 focus:ring-brand-primary focus:outline-none">
              <img src="https://api.dicebear.com/9.x/notionists/svg?seed=RajKumar&backgroundColor=0A1512" alt="Profile" className="w-full h-full object-cover" />
            </NavLink>
          </div>
        </header>

        {/* Scrollable Content with Route Transitions */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-6xl mx-auto">
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
          </div>
        </main>
      </div>
      
    </div>
  );
};

export default Layout;
