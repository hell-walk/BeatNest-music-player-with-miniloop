import { Suspense } from 'react';
import { Outlet } from 'react-router';
import CookieConsent from '../consent/CookieConsent.jsx';
import PlayBar from '../player/PlayBar.jsx';
import PageLoader from '../ui/PageLoader.jsx';
import Footer from './Footer.jsx';
import Header from './Header.jsx';
import Starfield from './Starfield.jsx';
import './layout.css';

/** Persistent chrome: background, header, footer, play bar and consent banner. */
export default function Layout() {
  return (
    <>
      <Starfield />
      <div className="app-shell">
        <Header />
        <main id="main" className="app-main" tabIndex={-1}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
      <PlayBar />
      <CookieConsent />
    </>
  );
}
