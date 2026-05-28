import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { InspectionProvider } from './context/InspectionContext.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import { IdentificationPage } from './pages/pwa/IdentificationPage.jsx';
import { InspectionFormPage } from './pages/pwa/InspectionFormPage.jsx';
import { PhotosPage } from './pages/pwa/PhotosPage.jsx';
import { ReviewPage } from './pages/pwa/ReviewPage.jsx';
import { SuccessPage } from './pages/pwa/SuccessPage.jsx';
import { ViewportGuard } from './components/pwa/ViewportGuard.jsx';
import { ProtectedRoute } from './components/admin/ProtectedRoute.jsx';
import { LoginPage } from './pages/admin/LoginPage.jsx';
import { VerifyTokenPage } from './pages/admin/VerifyTokenPage.jsx';
import { AdminLayout } from './pages/admin/AdminLayout.jsx';
import { DashboardPage } from './pages/admin/DashboardPage.jsx';
import { CollaboratorsPage } from './pages/admin/CollaboratorsPage.jsx';
import { InspectionsPage } from './pages/admin/InspectionsPage.jsx';
import { SectionsPage } from './pages/admin/SectionsPage.jsx';
import { PhotoConfigsPage } from './pages/admin/PhotoConfigsPage.jsx';
import { AdminUsersPage } from './pages/admin/AdminUsersPage.jsx';
import { HolidaysPage } from './pages/admin/HolidaysPage.jsx';
import { SettingsPage } from './pages/admin/SettingsPage.jsx';

function AdminRoot() {
  return (
    <AdminProvider>
      <Outlet />
    </AdminProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PWA routes */}
        <Route element={<InspectionProvider><Outlet /></InspectionProvider>}>
          <Route path="/" element={<IdentificationPage />} />
          <Route path="/inspection" element={<InspectionFormPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin" element={<ViewportGuard><AdminRoot /></ViewportGuard>}>
          <Route path="login" element={<LoginPage />} />
          <Route path="verify" element={<VerifyTokenPage />} />
          <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="collaborators" element={<CollaboratorsPage />} />
            <Route path="inspections" element={<InspectionsPage />} />
            <Route path="sections" element={<SectionsPage />} />
            <Route path="photo-configs" element={<PhotoConfigsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
