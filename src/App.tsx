import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { IntakePage } from './pages/IntakePage';
import { WashingPage } from './pages/WashingPage';
import { PackingPage } from './pages/PackingPage';
import { SterilizingPage } from './pages/SterilizingPage';
import { DistributionPage } from './pages/DistributionPage';
import { MasterDataPage } from './pages/MasterDataPage';
import { ReportsPage } from './pages/ReportsPage';
import { WardSendPage } from './pages/WardSendPage';
import { WardReceivePage } from './pages/WardReceivePage';
import { WardRequestPage } from './pages/WardRequestPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode, allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If operator_ruangan tries to access something restricted, send back to their home
    if (user.role === 'operator_ruangan') return <Navigate to="/ward/send" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'operator_cssd', 'operator_ruangan']}><DashboardPage /></ProtectedRoute>} />
            <Route path="/intake" element={<ProtectedRoute allowedRoles={['admin', 'operator_cssd']}><IntakePage /></ProtectedRoute>} />
            <Route path="/washing" element={<ProtectedRoute allowedRoles={['admin', 'operator_cssd']}><WashingPage /></ProtectedRoute>} />
            <Route path="/packing" element={<ProtectedRoute allowedRoles={['admin', 'operator_cssd']}><PackingPage /></ProtectedRoute>} />
            <Route path="/sterilizing" element={<ProtectedRoute allowedRoles={['admin', 'operator_cssd']}><SterilizingPage /></ProtectedRoute>} />
            <Route path="/distribution" element={<ProtectedRoute allowedRoles={['admin', 'operator_cssd']}><DistributionPage /></ProtectedRoute>} />
            <Route path="/ward/send" element={<ProtectedRoute allowedRoles={['admin', 'operator_ruangan']}><WardSendPage /></ProtectedRoute>} />
            <Route path="/ward/receive" element={<ProtectedRoute allowedRoles={['admin', 'operator_ruangan']}><WardReceivePage /></ProtectedRoute>} />
            <Route path="/ward/request" element={<ProtectedRoute allowedRoles={['admin', 'operator_ruangan']}><WardRequestPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><MasterDataPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin']}><ReportsPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
