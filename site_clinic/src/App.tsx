import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// --- Components ---
import HomePage from './components/HomePage';
import ArticlePage from './components/ArticlePage';

// --- ScrollToTop Component ---
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles/:id" element={<ArticlePage />} />
      </Routes>
    </Router>
  );
};

export default App;
