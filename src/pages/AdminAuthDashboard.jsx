import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Trash2, Key, RefreshCw, Smartphone, Globe, Terminal, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Hardcoded Initial Mock Data for Simulated Admin Security Panel
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL_METRICS = {
  activeSessions: 3,
  loggedInUsers: 2,
  failedLogins: 14,
  lockedAccounts: 2,
};

const INITIAL_SESSIONS = [
  {
    id: 'sess-001',
    email: 'admin@surakshasetu.com',
    role: 'ADMIN',
    deviceName: 'Chrome / Windows 11',
    ipAddress: '192.168.1.104',
    isCurrent: true,
  },
  {
    id: 'sess-002',
    email: 'raj.kumar@example.com',
    role: 'CUSTOMER',
    deviceName: 'Safari / iPhone 16 Pro',
    ipAddress: '49.37.12.89',
    isCurrent: false,
  },
  {
    id: 'sess-003',
    email: 'unknown.user@suspicious.com',
    role: 'CUSTOMER',
    deviceName: 'curl / Unknown Linux',
    ipAddress: '185.220.101.43',
    isCurrent: false,
  },
];

const INITIAL_LOGS = [
  {
    id: 'log-001',
    timestamp: new Date(Date.now() - 4000).toISOString(),
    action: 'Login Success',
    actor: 'admin@surakshasetu.com',
    ip: '192.168.1.104',
    device: 'Chrome / Windows 11',
    riskScore: 0,
    correlationId: 'c827fa1e-82d2',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 45000).toISOString(),
    action: 'OTP Verified',
    actor: 'admin@surakshasetu.com',
    ip: '192.168.1.104',
    device: 'Chrome / Windows 11',
    riskScore: 0,
    correlationId: 'c827fa1e-82d2',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    action: 'OTP Sent (MFA)',
    actor: 'admin@surakshasetu.com',
    ip: '192.168.1.104',
    device: 'Chrome / Windows 11',
    riskScore: 5,
    correlationId: 'c827fa1e-82d2',
  },
  {
    id: 'log-004',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    action: 'New Device Warning',
    actor: 'raj.kumar@example.com',
    ip: '49.37.12.89',
    device: 'Safari / iPhone 16 Pro',
    riskScore: 45,
    correlationId: 'e892d10c-941b',
  },
  {
    id: 'log-005',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    action: 'Failed Login Attempt',
    actor: 'unknown.user@suspicious.com',
    ip: '185.220.101.43',
    device: 'curl / Unknown Linux',
    riskScore: 85,
    correlationId: 'a381c19b-004d',
  },
  {
    id: 'log-006',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    action: 'Failed Login Attempt',
    actor: 'unknown.user@suspicious.com',
    ip: '185.220.101.43',
    device: 'curl / Unknown Linux',
    riskScore: 85,
    correlationId: 'a381c19b-004d',
  },
  {
    id: 'log-007',
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    action: 'Password Reset Request',
    actor: 'raj.kumar@example.com',
    ip: '49.37.12.89',
    device: 'Safari / iPhone 16 Pro',
    riskScore: 20,
    correlationId: 'f002da91-12a8',
  },
];

const AdminAuthDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [sessions, setSessions] = useState(INITIAL_SESSIONS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Auto-fill active current session details with current logged-in user
  useEffect(() => {
    if (user) {
      setSessions(prev =>
        prev.map(s =>
          s.isCurrent
            ? { ...s, email: user.email, role: user.role, fullName: user.fullName }
            : s
        )
      );
    }
  }, [user]);

  const handleRefresh = () => {
    setIsLoading(true);
    setSuccessMessage('');
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Security metrics refreshed successfully.');
      // Randomly tweak failed logins / logs to make the feed feel alive
      setMetrics(prev => ({
        ...prev,
        failedLogins: prev.failedLogins + Math.floor(Math.random() * 2),
      }));
    }, 800);
  };

  const handleRevoke = (sessionId) => {
    const sessionToRevoke = sessions.find(s => s.id === sessionId);
    if (!sessionToRevoke) return;

    if (sessionToRevoke.isCurrent) {
      alert('You cannot revoke your own active session.');
      return;
    }

    if (!window.confirm(`Are you sure you want to terminate session for ${sessionToRevoke.email}?`)) {
      return;
    }

    // Revoke local state session
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setMetrics(prev => ({
      ...prev,
      activeSessions: Math.max(1, prev.activeSessions - 1),
    }));

    // Add a new security log entry for this revocation
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Session Terminated',
      actor: user?.email || 'admin@surakshasetu.com',
      ip: '192.168.1.104',
      device: 'Chrome / Windows 11',
      riskScore: 50,
      correlationId: Math.random().toString(36).substring(2, 10),
    };

    setLogs(prev => [newLog, ...prev]);
    setSuccessMessage(`Session terminated for ${sessionToRevoke.email}`);
  };

  const getRiskBadgeColor = (score = 0) => {
    if (score >= 75) return 'text-brand-danger bg-brand-danger/10 border-brand-danger/30';
    if (score >= 30) return 'text-brand-warning bg-brand-warning/10 border-brand-warning/30';
    return 'text-brand-primary bg-brand-primary/10 border-brand-primary/30';
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-brand-primary/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-brand-text tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-brand-primary" /> Admin Security Console
          </h1>
          <p className="text-xs text-brand-text-muted font-mono uppercase tracking-widest mt-1">Real-time session monitoring and audit log analyzer</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono tracking-widest border border-brand-primary/20 text-brand-text hover:bg-brand-primary/10 hover:border-brand-primary/50 transition-all active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> REFRESH DATA
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-mono">
          SUCCESS: {successMessage}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Active Sessions', val: metrics.activeSessions, desc: 'Active connections', icon: Globe },
          { label: 'Logged-In Users', val: metrics.loggedInUsers, desc: 'Authenticated accounts', icon: Users },
          { label: 'Failed Login Attempts', val: metrics.failedLogins, desc: 'Blocked validation attempts', icon: ShieldAlert },
          { label: 'Locked Accounts', val: metrics.lockedAccounts, desc: 'Anomalous account blocks', icon: Key },
        ].map((card, i) => (
          <div key={i} className="cyber-panel p-5 bg-brand-surface/30 border border-brand-primary/10 rounded-xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-brand-text-muted tracking-widest uppercase">{card.label}</span>
                <h3 className="text-3xl font-display font-bold text-brand-text mt-1.5">{card.val}</h3>
              </div>
              <div className="w-10 h-10 bg-brand-primary/5 rounded-lg flex items-center justify-center border border-brand-primary/15">
                <card.icon className="w-5 h-5 text-brand-primary" />
              </div>
            </div>
            <p className="text-[9px] font-mono text-brand-text-muted tracking-wider uppercase mt-4">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Active sessions list */}
        <div className="cyber-panel p-6 bg-brand-surface/40 border border-brand-primary/10 rounded-xl lg:col-span-1 space-y-4">
          <h3 className="font-mono text-xs text-brand-primary uppercase tracking-widest border-b border-brand-primary/10 pb-2">Active Session Tokens</h3>
          
          <div className="space-y-3 overflow-y-auto max-h-[500px]">
            <AnimatePresence>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-brand-text-muted font-mono uppercase">No Active Session Records</div>
              ) : (
                sessions.map((sess) => (
                  <motion.div
                    key={sess.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="p-4 bg-brand-bg/50 border border-brand-primary/15 rounded-lg space-y-3 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="text-xs text-brand-text font-bold font-mono truncate max-w-[180px]">{sess.email}</h5>
                        <span className="text-[8px] font-mono text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-1.5 py-0.5 rounded tracking-widest uppercase mt-1 inline-block">{sess.role}</span>
                      </div>
                      {!sess.isCurrent && (
                        <button
                          onClick={() => handleRevoke(sess.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95"
                          title="Revoke Session Token"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-brand-text-muted border-t border-brand-primary/5 pt-2">
                      <div className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-brand-primary" /> {sess.deviceName.slice(0, 15)}
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Globe className="w-3 h-3 text-brand-primary" /> {sess.ipAddress}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Security Audit logs feed */}
        <div className="cyber-panel p-6 bg-brand-surface/40 border border-brand-primary/10 rounded-xl lg:col-span-2 space-y-4">
          <h3 className="font-mono text-xs text-brand-primary uppercase tracking-widest border-b border-brand-primary/10 pb-2">Centralized Security Logs Feed</h3>

          <div className="overflow-y-auto max-h-[500px] border border-brand-primary/10 rounded-lg">
            <table className="w-full text-left font-mono text-[10px]">
              <thead className="bg-brand-bg/80 sticky top-0 border-b border-brand-primary/20 text-brand-primary font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor / Event</th>
                  <th className="p-3">IP / Device</th>
                  <th className="p-3 text-center">Risk</th>
                  <th className="p-3">Correlation ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-primary/5 bg-brand-surface-light/20">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-brand-text-muted uppercase">No security audit event logs recorded.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-brand-primary/5 transition-colors">
                      <td className="p-3 text-brand-text-muted whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-brand-primary shrink-0" />
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-brand-text">{log.action}</div>
                        <div className="text-[9px] text-brand-text-muted truncate max-w-[120px]">{log.actor}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-brand-primary shrink-0" />
                          {log.ip}
                        </div>
                        <div className="text-[9px] text-brand-text-muted truncate max-w-[120px]">{log.device}</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${getRiskBadgeColor(log.riskScore)}`}>
                          {log.riskScore ?? 0}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-[8px] text-brand-text-muted">
                          <Terminal className="w-3 h-3 text-brand-primary shrink-0" />
                          {(log.correlationId || '').slice(0, 8)}...
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminAuthDashboard;
