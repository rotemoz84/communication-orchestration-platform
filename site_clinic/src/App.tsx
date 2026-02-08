import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// --- Components ---
import HomePage from './components/HomePage';
import ArticlePage from './components/ArticlePage';
import PrivacyPolicy from './components/PrivacyPolicy';

// --- ScrollToTop Component ---
const ScrollToTop = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash === '' || hash === '#/') {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles/:id" element={<ArticlePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  );
};

export default App;
