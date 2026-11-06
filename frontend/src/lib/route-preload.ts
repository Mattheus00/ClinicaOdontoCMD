export const dashboardLoaders = {
  agenda: () => import('../pages/dashboard/AgendaPage'),
  patients: () => import('../pages/dashboard/PatientsPage'),
  patient: () => import('../pages/dashboard/PatientDetailPage'),
  financial: () => import('../pages/dashboard/FinancialDashboardPage'),
  dentists: () => import('../pages/dashboard/DentistsPage'),
  procedures: () => import('../pages/dashboard/ProceduresPage'),
  stock: () => import('../pages/dashboard/StockPage'),
  odontogram: () => import('../pages/dashboard/OdontogramPage'),
};

/** Download code only. Protected data is requested only after authentication. */
export function preloadDestination(path: string) {
  const loader = path.startsWith('/patients/') ? dashboardLoaders.patient
    : path === '/patients' ? dashboardLoaders.patients
    : path === '/financial' ? dashboardLoaders.financial
    : path === '/dentists' ? dashboardLoaders.dentists
    : path === '/procedures' ? dashboardLoaders.procedures
    : path === '/estoque' ? dashboardLoaders.stock
    : path.startsWith('/odontograma/') ? dashboardLoaders.odontogram
    : dashboardLoaders.agenda;
  void loader().catch(() => undefined);
}
