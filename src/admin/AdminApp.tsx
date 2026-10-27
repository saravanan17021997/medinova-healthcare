import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './auth';
import { RequireAdmin, useAdminMeta } from './components';
import { AdminLayout } from './AdminLayout';
import { AdminLogin } from './pages/Login';
import { AdminDashboard } from './pages/Dashboard';

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
          <Route path="*" element={<AdminNotFound />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
