import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import Layout from './components/layout/Layout.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ConfigProvider } from './context/ConfigContext.jsx';
import { ConsentProvider } from './context/ConsentContext.jsx';
import { PlayerProvider } from './context/PlayerContext.jsx';
import { usePageViews } from './hooks/useMetrics.js';
import HomePage from './pages/HomePage.jsx';

// Secondary pages are code-split so the home page bundle stays small.
const PlaylistPage = lazy(() => import('./pages/PlaylistPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.jsx'));
const TermsPage = lazy(() => import('./pages/TermsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function AppRoutes() {
  usePageViews();
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="playlist/:slug" element={<PlaylistPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <ConsentProvider>
        <AuthProvider>
          <PlayerProvider>
            <AppRoutes />
          </PlayerProvider>
        </AuthProvider>
      </ConsentProvider>
    </ConfigProvider>
  );
}
