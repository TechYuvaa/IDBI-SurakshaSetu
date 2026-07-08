import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScamChecker from './pages/ScamChecker';
import TransactionMonitor from './pages/TransactionMonitor';
import Profile from './pages/Profile';
import Vault from './pages/Vault';
import HelpCenter from './pages/HelpCenter';
import { SecurityProvider } from './context/SecurityContext';

function App() {
  return (
    <SecurityProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/check" element={<ScamChecker />} />
            <Route path="/monitor" element={<TransactionMonitor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/help" element={<HelpCenter />} />
          </Routes>
        </Layout>
      </Router>
    </SecurityProvider>
  );
}

export default App;
