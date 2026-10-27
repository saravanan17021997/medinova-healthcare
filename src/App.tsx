import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Specialties, SpecialtyDetail } from './pages/Specialties';
import { Doctors, DoctorProfile } from './pages/Doctors';
import { Facilities } from './pages/Facilities';
import { Appointment } from './pages/Appointment';
import { Store, ProductDetail } from './pages/Store';
import { Cart, Checkout, OrderConfirmation } from './pages/Cart';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';
import { Splash } from './admin/Splash';

// The admin panel (and the Supabase client) is a separate download, fetched only on /admin.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export function App() {
  return (
    <Routes>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={<Splash label="Loading the admin panel…" />}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="specialties" element={<Specialties />} />
        <Route path="specialties/:slug" element={<SpecialtyDetail />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="doctors/:slug" element={<DoctorProfile />} />
        <Route path="facilities" element={<Facilities />} />
        <Route path="appointment" element={<Appointment />} />
        <Route path="store" element={<Store />} />
        <Route path="store/:slug" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-confirmation" element={<OrderConfirmation />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
