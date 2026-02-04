import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// --- Components ---
import ContactForm from './ContactForm';
// import Articles from './Articles';
import Header from './Header';
import Footer from './Footer';

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
            title: "מומחיות",
            desc: "ניסיון מעשי עשיר מקליניקות ובתי חולים מובילים בארץ.",
        },
        {
            title: "דיוק",
            desc: "שימוש בטכנולוגיית אולטרסאונד מהמתקדמות בעולם לאבחון מדויק וחסר פשרות.",
        },
        {
            title: "יחס אישי לכל מטופלת",
            desc: "ליווי צמוד, אישי, מותאם לצרכים של האשה, עם רגישות מקסימלית לכל אורך התהליך.",
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
            <section id="about" className="hero-full">
                <div className="hero-bg">
                    <img src={drOzImg} alt='ד"ר יובל עוז' />
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
                                רפואת נשים ברמה אחרת
                            </div>
                            <h1 className="text-5xl md:text-7xl mb-8 leading-tight text-white">
                                ד"ר <span className="text-white">יובל עוז</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 max-w-xl font-medium leading-relaxed mb-10">
מומחה לרפואת נשים, פריון והריון. מומחה לאולטרסאונד גניקולוגי ומיילדותי. סקירת מערכות, שקיפות עורפית, בדיקות מעקב גודל עובר.                            </p>
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
                                <h2>תחומי התמחות</h2>
                                <p>השירותים המקצועיים הניתנים בקליניקה</p>
                            </div>

                            <div className="grid gap-4">
                                <SectionRow
                                    title="בדיקות אולטרסאונד ואבחון"
                                    subtitle="סקירת מערכות, אבחון מומים, מעקב גודל עובר ושקיפות עורפית. בכל שלב בהריון בטכנולוגיה מתקדמת."
                                />
                                <SectionRow
                                    title="ייעוץ פריון ופוריות"
                                    subtitle="ליווי אישי רגיש בטיפולי פוריות מורכבים ומתקדמים, תוך שמירה על דיסקרטיות מלאה."
                                />
                                <SectionRow
                                    title="מיילדות והריון"
                                    subtitle="מעקב הריון רציף ואישי להריונות תקינים ובסיכון גבוה."
                                />
                            </div>
                        </section>

                        {/* Experience Section */}
                        <section id="experience">
                            <div className="section-title">
                                <h2>ניסיון מקצועי</h2>
                                <p>שלושה עשורים של נסיון מקצועי</p>
                            </div>

                            <div className="grid gap-4">
                                {[
                                    {
                                        title: 'מנהל המרכז לבריאות האשה וביצוע בדיקות אולטרסאונד',
                                        subtitle: 'קופת חולים "כללית" - קריית שמונה'
                                    },
                                    {
                                        title: 'מנהל מחלקת הריון בסיכון ומחלקת נשים',
                                        subtitle: 'בית החולים "רבקה זיו" בצפת'
                                    },
                                    {
                                        title: 'מייסד ומנהל יחידת אולטרסאונד מיילדותי (הראשון במחוז הגליל)',
                                        subtitle: 'בית החולים "רבקה זיו" בצפת'
                                    },
                                    {
                                        title: 'התמחות לרפואת נשים, מיילדות ופוריות. התמחות לבדיקות אולטרסאונד',
                                        subtitle: 'בית החולים "תל השומר", בית החולים "רמבם", בית החולים "בני ציון", בית החולים "רבקה זיו", ואף בחו"ל'
                                    },
                                    {
                                        title: 'תואר דוקטור לרפואה',
                                        subtitle: 'אוניברסיטת תל אביב'
                                    },
                                ].map((item, i) => (
                                    <SectionRow
                                        key={i}
                                        title={item.title}
                                        subtitle={item.subtitle}
                                    />
                                ))}
                            </div>
                        </section>

                        {/* Articles Section 
                        <Articles />
                        */}

                    </div>

                    {/* Sidebar Area 
                    <aside className="mt-20 md:mt-0 sidebar-sticky">
                        <ContactForm />
                    </aside>  */}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default HomePage;
