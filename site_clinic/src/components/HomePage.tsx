import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// --- Components ---
import ContactForm from './ContactForm';
// import Articles from './Articles';
import Header from './Header';
import Footer from './Footer';

// --- Hooks ---
import useTranslation from '../hooks/useTranslation';

// --- Assets ---
import drOzImg from '../assets/dr_oz.jpg';

const SectionRow = ({ title, subtitle }: any) => (
    <motion.div
        whileHover={{ x: -10 }}
        className="section-row-card"
    >
        <div>
            <h4 className="font-extrabold text-lg">{title}</h4>
            <p className="text-slate-500 text-sm font-medium">{subtitle}</p>
        </div>
    </motion.div>
);

const HomePage = () => {
    const { t } = useTranslation();
    const [activeSection, setActiveSection] = useState('about');
    const [isTransparent, setIsTransparent] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const middleOfScreen = window.scrollY + (window.innerHeight / 2);
            setIsTransparent(window.scrollY < 80);

            const sections = ['about', 'specialties', 'experience', 'articles', 'contact'];

            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    // Check if the middle of the screen is within this section
                    if (middleOfScreen >= offsetTop && middleOfScreen < offsetTop + offsetHeight) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial check

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const HERO_POINTS = [
        {
            title: t('hero.points.expertise.title'),
            desc: t('hero.points.expertise.desc'),
        },
        {
            title: t('hero.points.precision.title'),
            desc: t('hero.points.precision.desc'),
        },
        {
            title: t('hero.points.personal.title'),
            desc: t('hero.points.personal.desc'),
        }
    ];

    return (
        <div className="min-h-screen pb-20 md:pb-0">
            <Header
                activeSection={activeSection}
                isTransparent={isTransparent}
                onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />

            {/* Hero Section */}
            <section id="about" className="hero-full" style={{ minHeight: "600px" }}>
                <div className="hero-bg">
                    <img src={drOzImg} alt={t('hero.altText')} />
                </div>
                <div className="hero-overlay" />
                <div className="page-wrapper hero-content">
                    <div className="hero-grid">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-block px-4 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-bold mb-6 border border-white/20">
                                {t('hero.badge')}
                            </div>
                            <h1 className="text-5xl md:text-7xl mb-8 leading-tight text-white">
                                {t('hero.name')}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 max-w-xl font-medium leading-relaxed mb-10">
                                {t('hero.subtitle')}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="hero-points"
                        >
                            {HERO_POINTS.map((point, i) => (
                                <div key={i} className="hero-point-item">
                                    <div>
                                        <span className="hero-point-title">{point.title}</span>
                                        <p className="hero-point-desc">{point.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            <main className="page-wrapper">
                <div className="layout-grid">
                    {/* Content Area */}
                    <div className="content-stack">

                        {/* Specialties Section */}
                        <section id="specialties">
                            <div className="section-title">
                                <h2>{t('sections.specialties.title')}</h2>
                                <p>{t('sections.specialties.subtitle')}</p>
                            </div>

                            <div className="grid gap-4">
                                <SectionRow
                                    title={t('sections.specialties.items.ultrasound.title')}
                                    subtitle={t('sections.specialties.items.ultrasound.subtitle')}
                                />
                                <SectionRow
                                    title={t('sections.specialties.items.fertility.title')}
                                    subtitle={t('sections.specialties.items.fertility.subtitle')}
                                />
                                <SectionRow
                                    title={t('sections.specialties.items.obstetrics.title')}
                                    subtitle={t('sections.specialties.items.obstetrics.subtitle')}
                                />
                            </div>
                        </section>

                        {/* Experience Section */}
                        <section id="experience">
                            <div className="section-title">
                                <h2>{t('sections.experience.title')}</h2>
                                <p>{t('sections.experience.subtitle')}</p>
                            </div>

                            <div className="grid gap-4">
                                {t('sections.experience.items').map((_: any, i: number) => (
                                    <SectionRow
                                        key={i}
                                        title={t(`sections.experience.items.${i}.title`)}
                                        subtitle={t(`sections.experience.items.${i}.subtitle`)}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Articles Section 
                        <Articles />
                        */}

                    </div>

                    {/* Sidebar Area */} 
                    <aside className="mt-20 md:mt-0 sidebar-sticky">
                        <ContactForm />
                    </aside>  
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default HomePage;
