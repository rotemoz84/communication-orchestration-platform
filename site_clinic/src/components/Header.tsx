import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import useTranslation from '../hooks/useTranslation';

interface HeaderProps {
    activeSection: string;
    isTransparent: boolean;
    onNavigateHome?: () => void;
}

const Header = ({ activeSection, isTransparent, onNavigateHome }: HeaderProps) => {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const scrollToSection = (sectionId: string) => {
        // If we're on privacy policy page, navigate to home first
        if (location.pathname === '/privacy-policy') {
            navigate(`/#/${sectionId}`);
            setTimeout(() => {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } else {
            navigate(`#/${sectionId}`);
            setTimeout(() => {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    // Handle direct hash navigation on page load
    useEffect(() => {
        const hash = location.hash.replace('#/', '');
        if (hash && ['specialties', 'experience', 'about', 'contact'].includes(hash)) {
            setTimeout(() => {
                document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [location.hash]);

    return (
        <>
            <header className={`header-main transition-all duration-300 ${isTransparent ? 'transparent' : ''}`}>
                <div className="page-wrapper header-inner">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={onNavigateHome}>
                        <h1 className="text-lg sm:text-2xl font-black tracking-tighter">
                            <span className={isTransparent ? 'text-transparent' : 'text-gradient'}>{t('navigation.home')}</span>
                        </h1>
                    </div>

                    <nav className="nav-links">
                        <a href="#/" onClick={(e) => { e.preventDefault(); scrollToSection('specialties'); }} className={`nav-link ${activeSection === 'specialties' ? 'active' : ''} ${isTransparent ? 'text-white' : ''}`}>{t('navigation.specialties')}</a>
                        <a href="#/" onClick={(e) => { e.preventDefault(); scrollToSection('experience'); }} className={`nav-link ${activeSection === 'experience' ? 'active' : ''} ${isTransparent ? 'text-white' : ''}`}>{t('navigation.experience')}</a>
                        {/* <a href="#/" onClick={(e) => { e.preventDefault(); scrollToSection('articles'); }} className={`nav-link ${activeSection === 'articles' ? 'active' : ''} ${isTransparent ? 'text-white' : ''}`}>{t('navigation.articles')}</a> */}
                        <a href="#/" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }} className={`nav-link ${activeSection === 'about' ? 'active' : ''} ${isTransparent ? 'text-white' : ''}`}>{t('navigation.about')}</a>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-4 flex-nowrap shrink-0">
                        <button className={`mobile-menu-trigger !p-1 sm:!p-2 ${isTransparent ? 'text-white' : ''}`} onClick={() => setIsMenuOpen(true)}>
                            <Menu className="w-7 h-7 sm:w-8 sm:h-8" />
                        </button>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="mobile-overlay"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="mobile-menu-panel"
                        >
                            <div className="mobile-menu-header">
                                <span className="font-black text-2xl text-primary-navy">{t('navigation.menu')}</span>
                                <button onClick={() => setIsMenuOpen(false)} className="mobile-close-btn">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <nav className="mobile-nav-stack">
                                <a href="#/" onClick={(e) => { e.preventDefault(); scrollToSection('specialties'); setIsMenuOpen(false); }} className={`mobile-nav-link ${activeSection === 'specialties' ? 'text-secondary-teal' : ''}`}>{t('navigation.specialties')}</a>
                                <a href="#/" onClick={(e) => { e.preventDefault(); scrollToSection('experience'); setIsMenuOpen(false); }} className={`mobile-nav-link ${activeSection === 'experience' ? 'text-secondary-teal' : ''}`}>{t('navigation.experience')}</a>
                                {/* <a href="#/" onClick={(e) => { e.preventDefault(); scrollToSection('articles'); setIsMenuOpen(false); }} className={`mobile-nav-link ${activeSection === 'articles' ? 'text-secondary-teal' : ''}`}>{t('navigation.articles')}</a> */}
                                <a href="#/" onClick={(e) => { e.preventDefault(); scrollToSection('about'); setIsMenuOpen(false); }} className={`mobile-nav-link ${activeSection === 'about' ? 'text-secondary-teal' : ''}`}>{t('navigation.about')}</a>
                                <a href="#/" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); setIsMenuOpen(false); }} className="btn-primary">
                                    {t('navigation.contact')}
                                </a>
                            </nav>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;
