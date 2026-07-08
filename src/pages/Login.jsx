import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Controls
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check Caps Lock active (Phase 2 / Caps Lock Warning)
  const handleKeyDown = (e) => {
    if (e.getModifierState('CapsLock')) {
      setCapsLock(true);
    } else {
      setCapsLock(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      
      if (result.twoFactorRequired) {
        // Redirect to 2FA module passing the tempToken state
        navigate('/mfa', { 
          state: { 
            tempToken: result.tempToken, 
            type: result.twoFactorType,
            demoOtp: result.demoOtp // only available in dev mode
          } 
        });
      } else {
        // MFA bypassed, redirect directly to dashboard
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to security server. Verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 relative overflow-hidden">
      
      {/* Background radial scans */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* Development Mode Information Banner */}
        {process.env.NODE_ENV !== 'production' && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-panel p-4 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-xs space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-1 bg-brand-primary/10 rounded-bl text-[8px] font-mono tracking-widest text-brand-primary font-bold">DEV_MODE</div>
            <h4 className="font-mono font-bold text-brand-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Demo Credentials
            </h4>
            <div className="grid grid-cols-2 gap-2 text-brand-text-muted mt-2 font-mono">
              <div>Email:</div>
              <div className="text-brand-text font-semibold">admin@surakshasetu.com</div>
              <div>Password:</div>
              <div className="text-brand-text font-semibold">Admin@12345</div>
            </div>
            <div className="text-[10px] text-brand-primary/80 italic mt-1 font-mono">
              Please use these default credentials to log in.
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="cyber-panel p-8 bg-brand-surface/70 backdrop-blur-xl relative overflow-hidden border border-brand-primary/20 rounded-2xl"
        >
          {/* Top scanning header */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-primary to-transparent animate-pulse"></div>

          <div className="text-center space-y-3 mb-8">
            <div className="w-14 h-14 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(117,230,204,0.15)]">
              <Shield className="w-7 h-7 text-brand-primary" />
            </div>
            <h2 className="font-display font-bold text-2xl text-brand-text tracking-wide">IDBI SuRakshaSetu</h2>
            <p className="text-xs text-brand-text-muted font-mono tracking-wider uppercase">Enterprise Security Vault</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" onKeyDown={handleKeyDown}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-xs flex gap-2.5 items-start"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Security Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brand-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@surakshasetu.com"
                  className="w-full bg-brand-bg/60 border border-brand-primary/20 focus:border-brand-primary/50 text-brand-text text-sm rounded-lg pl-11 pr-4 py-3 outline-none transition-all placeholder:text-brand-text-muted/40 font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 relative">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Access Password</label>
                <Link to="/forgot-password" className="text-[10px] font-mono text-brand-primary hover:underline uppercase tracking-wider">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brand-text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-brand-bg/60 border border-brand-primary/20 focus:border-brand-primary/50 text-brand-text text-sm rounded-lg pl-11 pr-11 py-3 outline-none transition-all placeholder:text-brand-text-muted/40 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {capsLock && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[9px] font-mono text-brand-warning flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3 h-3" /> CAPS LOCK ACTIVE
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-primary-light text-brand-bg font-bold py-3.5 px-4 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(117,230,204,0.2)] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Shield className="w-4.5 h-4.5" /> SECURE SIGN IN
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
