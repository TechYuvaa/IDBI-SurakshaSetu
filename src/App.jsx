import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScamChecker from './pages/ScamChecker';
import TransactionMonitor from './pages/TransactionMonitor';
import Profile from './pages/Profile';
import Vault from './pages/Vault';
import HelpCenter from './pages/HelpCenter';
import Login from './pages/Login';
import Mfa from './pages/Mfa';
import ForgotPassword from './pages/ForgotPassword';
import AdminAuthDashboard from './pages/AdminAuthDashboard';
import { SecurityProvider } from './context/SecurityContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Protected Route Guard mapping Zero Trust principles (Phase 3)
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Session Timeout Expired Alert Component
const SessionTimeoutAlert = () => {
  const { showTimeoutDialog, setShowTimeoutDialog } = useAuth();
  if (!showTimeoutDialog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="cyber-panel p-6 max-w-sm w-full bg-brand-surface border border-brand-danger/30 rounded-xl space-y-4 text-center">
        <h4 className="text-sm font-bold font-mono text-brand-danger tracking-wider uppercase">SESSION EXPIRED</h4>
        <p className="text-xs text-brand-text-muted">You have been logged out automatically due to 15 minutes of inactivity for your protection.</p>
        <button
          onClick={() => setShowTimeoutDialog(false)}
          className="w-full bg-brand-danger text-white font-mono font-bold py-2 rounded hover:bg-brand-danger/80 transition-all active:scale-95 text-xs tracking-widest"
        >
          ACKNOWLEDGE
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <SecurityProvider>
      <AuthProvider>
        <Router>
          <SessionTimeoutAlert />
          <Routes>
            {/* Public routes outside standard authenticated layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/mfa" element={<Mfa />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected routes wrapped in navigation layout */}
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/check" element={<ScamChecker />} />
                    <Route path="/monitor" element={<TransactionMonitor />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/vault" element={<Vault />} />
                    <Route path="/help" element={<HelpCenter />} />
                    
                    {/* Admin metrics console */}
                    <Route path="/admin/auth" element={
                      <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
                        <AdminAuthDashboard />
                      </ProtectedRoute>
                    } />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </SecurityProvider>
  );
}

export default App;
