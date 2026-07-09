import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import AnimatedBridge from '../components/AnimatedBridge';
import RadialProgress from '../components/RadialProgress';
import CountUp from '../components/CountUp';
import { useSecurity } from '../context/SecurityContext';

const StatCard = ({ title, value, icon: Icon, colorClass, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="cyber-panel p-6 h-full flex flex-col justify-between"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-lg bg-brand-bg border border-brand-primary/20">
          <Icon className="w-5 h-5" style={{ color: colorClass }} />
        </div>
        <span className="text-[9px] font-mono text-brand-text-muted flex items-center gap-1.5 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: colorClass }}></span>
          LIVE MONITOR
        </span>
      </div>
      <div>
        <h3 className="text-brand-text-muted text-[10px] font-mono tracking-widest uppercase mb-1">{title}</h3>
        <div className="font-mono font-bold text-3xl text-brand-text">
          <CountUp value={value} />
        </div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const {
    scamsBlocked,
    txMonitored,
    activeThreats,
    safetyScore,
    activities,
    bridgeStatus,
    lastEventTime,
    triggerSimulatedBackgroundActivity
  } = useSecurity();

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const listener = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Format real activities and fill in with ambient telemetry logs so the marquee loops seamlessly
  const getTickerEntries = () => {
    const formatted = activities.map(act => {
      const typeLabel = act.status === 'blocked' ? 'Blocked' : act.status === 'flagged' ? 'Flagged' : 'Verified';
      const amountStr = act.amount ? ` (${act.amount})` : '';
      return `${typeLabel}: ${act.title}${amountStr} • ${act.time}`;
    });

    const fillers = [
      "Secured: Endpoint Zero-Trust validation complete • 1m ago",
      "Cleared: Local cookie sandboxing initialized • 3m ago",
      "Audited: 2FA credentials check completed • 5m ago",
      "Verified: Session token rotation active • 8m ago"
    ];

    return [...formatted, ...fillers];
  };

  const tickerEntries = getTickerEntries();

  return (
    <div className="space-y-8 pb-10">
      <header className="mb-6">
        <h1 className="font-display text-4xl font-extrabold text-brand-text mb-2">Security Command Center</h1>
        <p className="text-brand-text-muted text-sm">Real-time fraud prevention and active threat monitoring for your banking profile.</p>
      </header>

      {/* Dynamic Telemetry Live Ticker Strip */}
      <div className="ticker-wrap w-full py-2.5 overflow-hidden border-y border-brand-primary/10 bg-[#0d1411]/50 backdrop-blur-md rounded-lg font-mono text-[9px] tracking-wider uppercase">
        {/* Custom CSS for seamless 60fps GPU-accelerated infinite scrolling marquee */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes ticker-marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .ticker-track {
            display: flex;
            width: max-content;
            animation: ticker-marquee 80s linear infinite;
            will-change: transform;
          }
          .ticker-track:hover {
            animation-play-state: paused;
          }
        `}} />

        {prefersReducedMotion ? (
          // Reduced-motion: static fallback of the 3 most recent entries
          <div className="flex flex-wrap justify-center gap-6 px-4 text-brand-primary">
            {tickerEntries.slice(0, 3).map((entry, idx) => (
              <span key={idx} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-brand-primary"></span>
                {entry}
              </span>
            ))}
          </div>
        ) : (
          // Standard motion: seamless infinite marquee
          <div className="ticker-track flex gap-12">
            {/* Double mapping to create seamless looping */}
            <div className="flex gap-12 text-brand-primary">
              {tickerEntries.map((entry, idx) => (
                <span key={`a-${idx}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/45"></span>
                  {entry}
                </span>
              ))}
            </div>
            <div className="flex gap-12 text-brand-primary" aria-hidden="true">
              {tickerEntries.map((entry, idx) => (
                <span key={`b-${idx}`} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/45"></span>
                  {entry}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>


      {/* Hero Section: Animated Bridge */}
      <section className="mb-8">
        <div className="cyber-panel p-8 md:p-12 overflow-visible bg-brand-surface border-brand-primary/20">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <span className="text-[9px] font-mono text-brand-primary uppercase tracking-widest">GUARD ENGINE ACTIVE</span>
          </div>
          <h2 className="text-[10px] font-mono text-brand-primary uppercase tracking-widest mb-6 text-center">Live Threat Analysis Bridge</h2>
          <AnimatedBridge status={bridgeStatus} activeTrigger={lastEventTime} />
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Scams Blocked" 
          value={scamsBlocked} 
          icon={ShieldAlert} 
          colorClass="var(--color-brand-danger)" 
          delay={0.1} 
        />
        <StatCard 
          title="Transactions Monitored" 
          value={txMonitored} 
          icon={Activity} 
          colorClass="var(--color-brand-primary)" 
          delay={0.2} 
        />
        <StatCard 
          title="Active Threats" 
          value={activeThreats} 
          icon={Shield} 
          colorClass="var(--color-brand-accent)" 
          delay={0.3} 
        />
      </div>

      {/* Lower Section: Score & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Safety Score */}
        <div className="lg:col-span-1">
          <div className="cyber-panel p-8 h-full flex flex-col items-center justify-center min-h-[300px] bg-brand-surface border-brand-primary/10">
            <h3 className="text-brand-text-muted text-[10px] font-mono tracking-widest uppercase mb-6 self-start w-full">Overall Safety Score</h3>
            <RadialProgress value={safetyScore} size={200} />
            <p className="text-xs text-brand-text-muted mt-6 text-center leading-relaxed">
              Your digital perimeter is dynamically recalculated based on SMS vetting audits and transactional anomalies.
            </p>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <div className="cyber-panel p-8 h-full bg-brand-surface border-brand-primary/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-brand-text-muted text-[10px] font-mono tracking-widest uppercase">Live Activity Logs</h3>
              <span className="text-[9px] font-mono tracking-widest text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded">
                SECURE STREAM
              </span>
            </div>
            
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {activities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -15, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 15, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="flex items-center justify-between p-4 rounded border border-brand-primary/10 bg-brand-bg/40 hover:border-brand-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-10 h-10 rounded flex items-center justify-center border
                        ${activity.status === 'blocked' ? 'bg-brand-danger-bg text-brand-danger border-brand-danger/20' : 
                          activity.status === 'flagged' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' : 
                          'bg-brand-success-bg text-brand-primary border-brand-primary/20'}
                      `}>
                        {activity.type === 'scam' ? <ShieldAlert className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-brand-text font-medium text-sm">{activity.title}</h4>
                        <span className="text-[10px] font-mono text-brand-text-muted uppercase tracking-wider">{activity.time}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {activity.amount && (
                        <div className="font-mono text-sm text-brand-text mb-1">{activity.amount}</div>
                      )}
                      <span className={`text-[9px] font-mono uppercase tracking-widest font-bold border px-2 py-0.5 rounded ${
                        activity.status === 'blocked' ? 'text-brand-danger border-brand-danger/30 bg-brand-danger/10' : 
                        activity.status === 'flagged' ? 'text-brand-accent border-brand-accent/30 bg-brand-accent/10' : 
                        'text-brand-primary border-brand-primary/30 bg-brand-primary/10'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
