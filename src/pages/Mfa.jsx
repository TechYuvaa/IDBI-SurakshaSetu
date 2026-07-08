import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Sparkles, Key, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Mfa = () => {
  const { verify2fa, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve temporary token from login state redirect
  const { tempToken, type, demoOtp: initialDemoOtp } = location.state || {};

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState(initialDemoOtp || '');
  const [resendTimer, setResendTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // References for multi-input auto-focus navigation
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!tempToken) {
      navigate('/login');
    }
  }, [tempToken, navigate]);

  // Resend OTP timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleChange = (element, index) => {
    const value = element.value;
    if (isNaN(Number(value))) return; // restrict to digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (!otp[index] && index > 0) {
        // Focus previous input on backspace if current is empty
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // Support copy/paste of full 6-digit codes
  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').trim();
    if (data.length === 6 && /^\d+$/.test(data)) {
      const chars = data.split('');
      setOtp(chars);
      inputRefs.current[5].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return;

    setIsLoading(true);
    setError('');

    try {
      await verify2fa(code, tempToken);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Incorrect verification code. Please check and try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setError('');

    try {
      // Re-trigger login to generate a new OTP
      // In production we'd hit a dedicated resend endpoint
      // For the demo/hackathon, we'll reload or mock a resend
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
      
      // If we are in dev mode, generate a new OTP
      const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setDemoOtp(mockOtp);
      
    } catch (err) {
      setError('Failed to resend verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 relative overflow-hidden">
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 z-10">
        
        {/* Development Mode OTP Display Card */}
        {import.meta.env.VITE_DEMO_MODE !== 'false' && demoOtp && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="cyber-panel p-4 bg-brand-primary/5 border border-brand-primary/30 rounded-lg text-xs space-y-2 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-1 bg-brand-primary/10 rounded-bl text-[8px] font-mono tracking-widest text-brand-primary font-bold">DEMO_MFA</div>
            <h4 className="font-mono font-bold text-brand-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Generated Security OTP
            </h4>
            <div className="flex items-center gap-3 mt-2 font-mono">
              <div className="text-brand-text-muted">OTP Code:</div>
              <div className="text-xl text-brand-text font-bold tracking-widest bg-brand-primary/10 px-3 py-1 rounded border border-brand-primary/20">{demoOtp}</div>
            </div>
            <div className="text-[10px] text-brand-primary/80 italic mt-1 font-mono">
              Judges: Enter this code in the input boxes below to verify login.
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
              <Key className="w-6 h-6 text-brand-primary animate-pulse" />
            </div>
            <h2 className="font-display font-bold text-2xl text-brand-text tracking-wide">2FA Verification</h2>
            <p className="text-xs text-brand-text-muted font-mono tracking-wide uppercase">
              {type === 'TOTP' ? 'Authenticator Token' : 'Enter Email Verification Code'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            {success && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3.5 rounded bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs flex gap-2.5 items-start"
              >
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Authentication successful! Granting secure access...</span>
              </motion.div>
            )}

            {/* 6 Input digits */}
            <div className="flex justify-between items-center gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={data}
                  ref={el => inputRefs.current[index] = el}
                  onChange={e => handleChange(e.target, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 bg-brand-bg/60 border border-brand-primary/20 focus:border-brand-primary text-center text-xl font-bold font-mono rounded-lg outline-none transition-all focus:shadow-[0_0_10px_rgba(117,230,204,0.15)]"
                />
              ))}
            </div>

            <div className="text-center">
              {resendTimer > 0 ? (
                <span className="text-[10px] font-mono text-brand-text-muted tracking-wider">
                  RESEND CODE IN <span className="text-brand-primary">{resendTimer}S</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-[10px] font-mono text-brand-primary hover:underline uppercase tracking-wider font-bold"
                >
                  Resend Verification OTP
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || success || otp.join('').length < 6}
              className="w-full bg-brand-primary hover:bg-brand-primary-light text-brand-bg font-bold py-3.5 px-4 rounded-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(117,230,204,0.2)] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'VERIFY CODE'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Mfa;
