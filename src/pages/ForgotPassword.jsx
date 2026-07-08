import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Sparkles, Key, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const { requestPasswordReset, executePasswordReset } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Request, 2 = Verify & Reset
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [demoOtp, setDemoOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password Policy requirements validation
  const rules = {
    length: newPassword.length >= 12,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  };

  const isPasswordValid = Object.values(rules).every(Boolean);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await requestPasswordReset(email);
      setStep(2);
      setSuccessMsg('Reset code has been generated. Please check your inbox.');
      if (data.demoOtp) {
        setDemoOtp(data.demoOtp); // display in dev mode banner
      }
    } catch (err) {
      setError(err.message || 'Forgot password request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!code || !newPassword || !confirmPassword) return;

    if (!isPasswordValid) {
      setError('Password does not satisfy the enterprise banking security policies.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await executePasswordReset(email, code, newPassword);
      setSuccessMsg('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* Development Mode recovery OTP banner */}
        {import.meta.env.VITE_DEMO_MODE !== 'false' && demoOtp && step === 2 && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-panel p-4 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-xs space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-1 bg-brand-primary/10 rounded-bl text-[8px] font-mono tracking-widest text-brand-primary font-bold">DEMO_RECOVERY</div>
            <h4 className="font-mono font-bold text-brand-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Generated Recovery OTP
            </h4>
            <div className="flex items-center gap-3 mt-2 font-mono">
              <div className="text-brand-text-muted">Code:</div>
              <div className="text-xl text-brand-text font-bold tracking-widest bg-brand-primary/10 px-3 py-1 rounded border border-brand-primary/20">{demoOtp}</div>
            </div>
            <div className="text-[10px] text-brand-primary/80 italic mt-1 font-mono">
              Judges: Enter this recovery code below to reset the password.
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          className="cyber-panel p-8 bg-brand-surface/70 backdrop-blur-xl relative overflow-hidden border border-brand-primary/20 rounded-2xl"
        >
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-primary to-transparent animate-pulse"></div>

          <div className="text-center space-y-3 mb-8">
            <div className="w-14 h-14 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(117,230,204,0.15)]">
              <Shield className="w-7 h-7 text-brand-primary" />
            </div>
            <h2 className="font-display font-bold text-2xl text-brand-text tracking-wide">Password Recovery</h2>
            <p className="text-xs text-brand-text-muted font-mono tracking-wider uppercase">
              {step === 1 ? 'Request Reset Code' : 'Set New Security Credentials'}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 mb-5 rounded bg-brand-danger/10 border border-brand-danger/30 text-brand-danger text-xs flex gap-2.5 items-start"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 mb-5 rounded bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs flex gap-2.5 items-start"
            >
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                onSubmit={handleRequest} 
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Account Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@surakshasetu.com"
                    className="w-full bg-brand-bg/60 border border-brand-primary/20 focus:border-brand-primary/50 text-brand-text text-sm rounded-lg px-4 py-3 outline-none transition-all placeholder:text-brand-text-muted/40 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-primary hover:bg-brand-primary-light text-brand-bg font-bold py-3.5 px-4 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(117,230,204,0.2)] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'SEND RESET CODE'
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link to="/login" className="text-[10px] font-mono text-brand-text-muted hover:text-brand-text uppercase tracking-widest">Back to Sign In</Link>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                onSubmit={handleReset} 
                className="space-y-4"
              >
                {/* Reset Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">6-Digit Verification Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    placeholder="123456"
                    className="w-full bg-brand-bg/60 border border-brand-primary/20 focus:border-brand-primary/50 text-brand-text text-center text-sm rounded-lg px-4 py-3 outline-none transition-all font-mono tracking-widest"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">New Access Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-brand-bg/60 border border-brand-primary/20 focus:border-brand-primary/50 text-brand-text text-sm rounded-lg px-4 py-3 outline-none transition-all font-mono"
                  />
                </div>

                {/* Password Policy Checklist UI */}
                <div className="p-3 bg-brand-bg/40 rounded border border-brand-primary/10 space-y-1.5 text-[9px] font-mono">
                  <div className="text-[8px] tracking-wider text-brand-text-muted uppercase mb-1">PASSWORD POLICY REQUIREMENT</div>
                  <div className="flex items-center gap-1.5">
                    {rules.length ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" /> : <XCircle className="w-3.5 h-3.5 text-brand-danger" />}
                    <span className={rules.length ? 'text-brand-text' : 'text-brand-text-muted'}>At least 12 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(rules.upper && rules.lower) ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" /> : <XCircle className="w-3.5 h-3.5 text-brand-danger" />}
                    <span className={(rules.upper && rules.lower) ? 'text-brand-text' : 'text-brand-text-muted'}>Mixed upper & lower case</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rules.number ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" /> : <XCircle className="w-3.5 h-3.5 text-brand-danger" />}
                    <span className={rules.number ? 'text-brand-text' : 'text-brand-text-muted'}>Contains numeric digits</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rules.special ? <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" /> : <XCircle className="w-3.5 h-3.5 text-brand-danger" />}
                    <span className={rules.special ? 'text-brand-text' : 'text-brand-text-muted'}>Contains special symbols</span>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted">Confirm Access Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-brand-bg/60 border border-brand-primary/20 focus:border-brand-primary/50 text-brand-text text-sm rounded-lg px-4 py-3 outline-none transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || newPassword !== confirmPassword}
                  className="w-full bg-brand-primary hover:bg-brand-primary-light text-brand-bg font-bold py-3.5 px-4 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(117,230,204,0.2)] disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'UPDATE PASSWORD'
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
