import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './auth';
import { RequireAdmin, useAdminMeta } from './components';
import { AdminLayout } from './AdminLayout';
import { AdminLogin } from './pages/Login';
import { AdminDashboard } from './pages/Dashboard';
import { AdminProducts } from './pages/Products';
import { AdminProductForm } from './pages/ProductForm';
import { AdminCategories } from './pages/Categories';
import { AdminDoctors } from './pages/Doctors';
import { AdminDoctorForm } from './pages/DoctorForm';
import { AdminSpecialties, AdminSpecialtyForm } from './pages/Specialties';
import { AdminAppointments } from './pages/Appointments';
import { AdminHomepage, AdminSectionForm } from './pages/Homepage';
import { AdminHeroSlides } from './pages/HeroSlides';
import { AdminNavigation } from './pages/Navigation';
import { AdminFacilities, AdminFacilityForm } from './pages/Facilities';
import { AdminSettings } from './pages/Settings';
import { AdminOrders } from './pages/Orders';
import { AdminMessages } from './pages/Messages';
import { AdminUsers } from './pages/Users';
import { ToastProvider } from './ui';

function AdminNotFound() {
  useAdminMeta('Not found');
  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-card ring-1 ring-line/70">
      <h1 className="font-display text-2xl font-semibold text-ink">This admin page does not exist yet</h1>
      <p className="mt-2 text-slate">It may be part of a later stage.</p>
      <Link to="/admin/dashboard" className="mt-6 inline-block font-semibold text-teal underline-offset-4 hover:underline">
        Go to the dashboard
      </Link>
    </div>
  );
}

/** Everything under /admin. Loaded on demand, so public visitors never download it. */
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <ToastProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm key="new" />} />
          <Route path="products/:id" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="doctors/new" element={<AdminDoctorForm key="new" />} />
          <Route path="doctors/:id" element={<AdminDoctorForm />} />
          <Route path="specialties" element={<AdminSpecialties />} />
          <Route path="specialties/new" element={<AdminSpecialtyForm key="new" />} />
          <Route path="specialties/:id" element={<AdminSpecialtyForm />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="homepage" element={<AdminHomepage />} />
          <Route path="homepage/slider" element={<AdminHeroSlides />} />
          <Route path="homepage/:key" element={<AdminSectionForm />} />
          <Route path="navigation" element={<AdminNavigation />} />
          <Route path="facilities" element={<AdminFacilities />} />
          <Route path="facilities/new" element={<AdminFacilityForm key="new" />} />
          <Route path="facilities/:id" element={<AdminFacilityForm />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="*" element={<AdminNotFound />} />
        </Route>
      </Routes>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
