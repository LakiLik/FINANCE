import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-hook';

// Pages
import AuthPage from '@/components/pages/AuthPage';
import DashboardPage from '@/components/pages/DashboardPage';
import TransactionsPage from '@/components/pages/TransactionsPage';
import SubscriptionsPage from '@/components/pages/SubscriptionsPage';
import FuelPage from '@/components/pages/FuelPage';
import InventoryPage from '@/components/pages/InventoryPage';
import InvoicesPage from '@/components/pages/InvoicesPage';
import Layout from '@/components/layout/Layout';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-slate-200">
        <p className="text-slate-500 animate-pulse font-bold tracking-widest text-xs uppercase">Caricamento in corso...</p>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/fuel" element={<FuelPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
