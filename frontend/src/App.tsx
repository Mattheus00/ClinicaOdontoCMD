import { lazy, Suspense, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppFeedback } from './components/AppFeedback';
import MobileTopbar from './components/MobileTopbar';
import Sidebar from './components/Sidebar';
import './components/Sidebar.css';
import './components/MobileTopbar.css';

const LandingPage = lazy(() => import('./pages/landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ConfirmEmailPage = lazy(() => import('./pages/auth/ConfirmEmailPage'));
const DentistInvitePage = lazy(() => import('./pages/auth/DentistInvitePage'));
const AgendaPage = lazy(() => import('./pages/dashboard/AgendaPage'));
const PatientsPage = lazy(() => import('./pages/dashboard/PatientsPage'));
const PatientDetailPage = lazy(() => import('./pages/dashboard/PatientDetailPage'));
const DentistsPage = lazy(() => import('./pages/dashboard/DentistsPage'));
const FinancialDashboardPage = lazy(() => import('./pages/dashboard/FinancialDashboardPage'));
const ProceduresPage = lazy(() => import('./pages/dashboard/ProceduresPage'));
const OnboardingPage = lazy(() => import('./pages/dashboard/OnboardingPage'));

type AppRole = 'ADMIN' | 'SECRETARY' | 'DENTIST';

function DashboardLayout() {
  return (
    <div className="app-layout">
      <MobileTopbar />
      <Sidebar />
      <main className="main-content">
        <Suspense fallback={<div className="app-loading">Carregando tela...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  if (isInitializing) return <div className="app-loading" role="status">Carregando sessão...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function RequireRole({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const { role, isInitializing } = useAuth();
  if (isInitializing) return <div className="app-loading" role="status">Carregando...</div>;
  if (!role || !roles.includes(role)) return <Navigate to="/agenda" replace />;
  return <>{children}</>;
}

function HomeRoute() {
  const { isAuthenticated, isInitializing } = useAuth();
  // Show landing immediately while session restores — avoids blank screen on cold start.
  if (isInitializing) return <LandingPage />;
  return isAuthenticated ? <Navigate to="/agenda" replace /> : <LandingPage />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="app-loading">Carregando...</div>}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/confirmar-email" element={<ConfirmEmailPage />} />
        <Route path="/convite/:token" element={<DentistInvitePage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/financial" element={<FinancialDashboardPage />} />
            <Route
              path="/patients"
              element={
                <RequireRole roles={['ADMIN', 'SECRETARY']}>
                  <PatientsPage />
                </RequireRole>
              }
            />
            <Route
              path="/patients/:id"
              element={
                <RequireRole roles={['ADMIN', 'SECRETARY']}>
                  <PatientDetailPage />
                </RequireRole>
              }
            />
            <Route
              path="/dentists"
              element={
                <RequireRole roles={['ADMIN', 'SECRETARY']}>
                  <DentistsPage />
                </RequireRole>
              }
            />
            <Route
              path="/procedures"
              element={
                <RequireRole roles={['ADMIN', 'SECRETARY']}>
                  <ProceduresPage />
                </RequireRole>
              }
            />
            <Route
              path="/onboarding"
              element={
                <RequireRole roles={['ADMIN', 'SECRETARY']}>
                  <OnboardingPage />
                </RequireRole>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppFeedback />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
