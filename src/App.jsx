import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import TopNav from './components/TopNav.jsx';
import EditModeGate from './components/EditModeGate.jsx';
import PasswordGuard from './components/PasswordGuard.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import JourneyPage from './pages/JourneyPage.jsx';
import SkillsPage from './pages/SkillsPage.jsx';
import ExperiencesPage from './pages/ExperiencesPage.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <TopNav />
      <EditModeGate />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/journey" element={<PasswordGuard><JourneyPage /></PasswordGuard>} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/experiences" element={<ExperiencesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}
