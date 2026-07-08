import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);
  
  // Timeout references (15 minutes idle timeout)
  const idleTimeoutMinutes = 15;
  const timeoutRef = useRef(null);

  // Clear idle timers
  const resetIdleTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (user) {
      timeoutRef.current = setTimeout(() => {
        handleIdleLogout();
      }, idleTimeoutMinutes * 60 * 1000);
    }
  };

  const handleIdleLogout = async () => {
    setShowTimeoutDialog(true);
    await logout();
  };

  // Activity listeners for tracking user interactions (Phase 2 / Idle Timeout)
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => window.addEventListener(event, resetIdleTimer));
      resetIdleTimer();

      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        events.forEach(event => window.removeEventListener(event, resetIdleTimer));
      };
    }
  }, [user]);

  // Attempt transparent session recovery on page mount/reload
  useEffect(() => {
    const recoverSession = async () => {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.accessToken);
          setUser(data.user);
        }
      } catch (err) {
        // Silent catch for silent refresh failure
      } finally {
        setLoading(false);
      }
    };
    recoverSession();
  }, []);

  const login = async (email, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed.');
    }
    return data; // contains access token or 2fa details
  };

  const verify2fa = async (code, tempToken) => {
    const response = await fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempToken}`
      },
      body: JSON.stringify({ code })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Verification failed.');
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setAccessToken(null);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  const requestPasswordReset = async (email) => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Forgot password request failed.');
    }
    return data;
  };

  const executePasswordReset = async (email, code, newPassword) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Password reset failed.');
    }
    return data;
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
      setShowTimeoutDialog
    }}>
      {children}
    </AuthContext.Provider>
  );
};
