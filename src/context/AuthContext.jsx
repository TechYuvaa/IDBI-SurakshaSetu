import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// DEMO USERS — hardcoded, no database, no JWT, no network requests
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    id: 'user-001',
    email: 'raj.kumar@example.com',
    password: 'password123',
    role: 'CUSTOMER',
    fullName: 'Raj Kumar',
    location: 'Mumbai, India',
    twoFactorEnabled: true,
  },
  {
    id: 'user-002',
    email: 'admin@surakshasetu.com',
    password: 'Admin@12345',
    role: 'ADMIN',
    fullName: 'System Admin',
    location: 'Bangalore, India',
    twoFactorEnabled: true,
  },
];

// Simulated delay to make auth feel real for demo judges
const simulateDelay = (ms = 900) => new Promise(res => setTimeout(res, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Context Setup
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// Auth Provider — all state in memory, no backend, no JWT, no Redis
// ─────────────────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // accessToken is a fake token for API-shape compatibility with existing pages
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pending 2FA state — holds the matched user while OTP is being entered
  const [pendingUser, setPendingUser] = useState(null);
  const [pendingOtp, setPendingOtp] = useState(null);

  // Simulated password reset state
  const [resetStore, setResetStore] = useState({}); // { email: otp }

  // Idle timeout
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  const idleTimeoutMinutes = 15;
  const timeoutRef = useRef(null);

  // ── Session persistence via sessionStorage (clears on tab close) ──────────
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('surakshasetu_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed.user);
        setAccessToken(parsed.accessToken);
      }
    } catch {
      /* ignore parse errors */
    } finally {
      setLoading(false);
    }
  }, []);

  const persistSession = (userData, token) => {
    try {
      sessionStorage.setItem(
        'surakshasetu_session',
        JSON.stringify({ user: userData, accessToken: token })
      );
    } catch { /* ignore */ }
  };

  const clearSession = () => {
    try { sessionStorage.removeItem('surakshasetu_session'); } catch { /* ignore */ }
  };

  // ── Idle timeout ──────────────────────────────────────────────────────────
  const resetIdleTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      timeoutRef.current = setTimeout(() => {
        setShowTimeoutDialog(true);
        logoutInternal();
      }, idleTimeoutMinutes * 60 * 1000);
    }
  };

  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(ev => window.addEventListener(ev, resetIdleTimer));
      resetIdleTimer();
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        events.forEach(ev => window.removeEventListener(ev, resetIdleTimer));
      };
    }
  }, [user]);

  // ── Core internal logout ──────────────────────────────────────────────────
  const logoutInternal = () => {
    setUser(null);
    setAccessToken(null);
    setPendingUser(null);
    setPendingOtp(null);
    clearSession();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // AUTH API — identical shape to the old server API so pages need no changes
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * login(email, password)
   * Returns: { twoFactorRequired, tempToken, twoFactorType, demoOtp }
   *      OR  throws Error with message
   */
  const login = async (email, password) => {
    await simulateDelay();

    const found = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!found) {
      throw new Error('Invalid security credentials. Please check your email and password.');
    }

    if (found.twoFactorEnabled) {
      // Generate a 6-digit OTP in memory
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const tempToken = `demo-temp-${found.id}-${Date.now()}`;

      // Store pending state for verify2fa to read
      setPendingUser(found);
      setPendingOtp(otp);

      return {
        twoFactorRequired: true,
        tempToken,
        twoFactorType: 'EMAIL',
        demoOtp: otp, // shown in demo banner on /mfa
      };
    }

    // 2FA disabled — establish session immediately
    return establishSession(found);
  };

  /**
   * verify2fa(code, tempToken)
   * Returns: { accessToken, user }  OR  throws Error
   */
  const verify2fa = async (code, _tempToken) => {
    await simulateDelay(600);

    if (!pendingUser || !pendingOtp) {
      throw new Error('Session expired. Please log in again.');
    }

    if (code.trim() !== pendingOtp) {
      throw new Error('Verification code is incorrect or expired.');
    }

    const result = establishSession(pendingUser);
    setPendingUser(null);
    setPendingOtp(null);
    return result;
  };

  /**
   * logout()
   */
  const logout = async () => {
    await simulateDelay(300);
    logoutInternal();
  };

  /**
   * requestPasswordReset(email)
   * Returns: { message, demoOtp }
   */
  const requestPasswordReset = async (email) => {
    await simulateDelay();

    const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());

    // Always return success (prevent email enumeration — same as real backend)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (found) {
      setResetStore(prev => ({ ...prev, [email.toLowerCase()]: otp }));
    }

    return {
      message: 'If the email exists, a password reset code has been sent.',
      // Only expose OTP in demo banner
      demoOtp: found ? otp : undefined,
    };
  };

  /**
   * executePasswordReset(email, code, newPassword)
   * Returns: { message }  OR  throws Error
   */
  const executePasswordReset = async (email, code, _newPassword) => {
    await simulateDelay();

    const storedOtp = resetStore[email.toLowerCase()];
    if (!storedOtp || code.trim() !== storedOtp) {
      throw new Error('Reset code is incorrect or has expired.');
    }

    // Clear the used OTP
    setResetStore(prev => {
      const next = { ...prev };
      delete next[email.toLowerCase()];
      return next;
    });

    // In a real app we'd update the password — here we just confirm success
    return { message: 'Password reset successful. You can now log in with your new credentials.' };
  };

  // ── Internal session establishment ────────────────────────────────────────
  const establishSession = (demoUser) => {
    const sessionUser = {
      id: demoUser.id,
      email: demoUser.email,
      role: demoUser.role,
      fullName: demoUser.fullName,
      location: demoUser.location,
    };
    const fakeToken = `demo-access-${demoUser.id}-${Date.now()}`;

    setUser(sessionUser);
    setAccessToken(fakeToken);
    persistSession(sessionUser, fakeToken);

    return { accessToken: fakeToken, user: sessionUser };
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      login,
      verify2fa,
      logout,
      requestPasswordReset,
      executePasswordReset,
      showTimeoutDialog,
      setShowTimeoutDialog,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
