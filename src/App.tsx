import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { MemberDetailPage } from './pages/MemberDetailPage';
import { VisitorsPage } from './pages/VisitorsPage';
import { EventsPage } from './pages/EventsPage';
import { SermonsPage } from './pages/SermonsPage';
import { AttendancePage } from './pages/AttendancePage';
import { AbsencesPage } from './pages/AbsencesPage';
import { FinancePage } from './pages/FinancePage';
import { ChurchesPage } from './pages/ChurchesPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { CellsPage } from './pages/CellsPage';
import { SpiritualFamiliesPage } from './pages/SpiritualFamiliesPage';
import { StatsPage } from './pages/StatsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-bordeaux-600" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-bordeaux-600" />
      </div>
    );
  }
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/members/:id" element={<MemberDetailPage />} />
        <Route path="/visitors" element={<VisitorsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/sermons" element={<SermonsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/absences" element={<AbsencesPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/churches" element={<ChurchesPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/cells" element={<CellsPage />} />
        <Route path="/spiritual-families" element={<SpiritualFamiliesPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/pastoral" element={<PlaceholderPage title="Suivi pastoral" icon="heart" />} />
        <Route path="/training" element={<PlaceholderPage title="Formations" icon="graduation" />} />
        <Route path="/communication" element={<PlaceholderPage title="Communication" icon="megaphone" />} />
        <Route path="/documents" element={<PlaceholderPage title="Documents" icon="folder" />} />
        <Route path="/admin/users" element={<PlaceholderPage title="Gestion des utilisateurs" icon="shield" />} />
        <Route path="/admin/audit" element={<PlaceholderPage title="Journal d'audit" icon="shield" />} />
        <Route path="/admin/settings" element={<PlaceholderPage title="Paramètres" icon="settings" />} />
        <Route path="/profile" element={<PlaceholderPage title="Mon profil" icon="user" />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
