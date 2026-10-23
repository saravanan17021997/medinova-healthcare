import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnnouncementBar, Header } from './Header';
import { Footer } from './Footer';
import { ChatbotLauncher } from '@/components/ChatbotLauncher';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function MainLayout() {
  return (
    <>
      <a href="#main" className="sr-only rounded-lg bg-white px-4 py-2 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]">
        Skip to content
      </a>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>
      <Footer />
      <ChatbotLauncher />
    </>
  );
}
