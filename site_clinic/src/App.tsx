import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Menu,
  X,
  ArrowLeft,
  MapPin,
  Clock,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets ---
import drOzImg from './assets/dr_oz.png';

// --- Data ---
const SERVICES_OPTIONS = [
  "סקירת מערכות להריון 1",
  "סקירת מערכות להריון 2",
  "סקירת מערכות להריון 3",
  "שיחת ייעוץ / פתיחה",
  "שליחת שאלה כללית"
];

// --- Components ---

const Header = ({ activeSection, isTransparent }: { activeSection: string; isTransparent: boolean }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className={`header-main transition-all duration-300 ${isTransparent ? 'transparent' : ''}`}>
        <div className="page-wrapper header-inner">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tighter">
              ד"ר <span className={isTransparent ? 'text-white' : 'text-gradient'}>יובל עוז</span>
            </h1>
          </div>

          <nav className="nav-links">
            <a href="#specialties" className={`nav-link ${activeSection === 'specialties' ? 'active' : ''} ${isTransparent ? 'text-white' : ''}`}>תחומי התמחות</a>
            <a href="#experience" className={`nav-link ${activeSection === 'experience' ? 'active' : ''} ${isTransparent ? 'text-white' : ''}`}>ניסיון מקצועי</a>
            <a href="#about" className={`nav-link ${activeSection === 'about' ? 'active' : ''} ${isTransparent ? 'text-white' : ''}`}>אודות</a>
          </nav>

          <div className="flex items-center gap-4">
            <a href="#contact" className="btn-primary !py-2 !px-4 !text-xs !w-auto lg:!text-sm lg:!px-6">פנייה אישית</a>
            <button className={`mobile-menu-trigger ${isTransparent ? 'text-white' : ''}`} onClick={() => setIsMenuOpen(true)}>
              <Menu className="w-8 h-8" />
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
              <div className="flex justify-between items-center mb-10">
                <span className="font-black text-xl text-primary-navy">תפריט</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2">
                  <X className="w-8 h-8 text-primary-navy" />
                </button>
              </div>
              <nav className="mobile-nav-stack">
                <a href="#specialties" className={`mobile-nav-link ${activeSection === 'specialties' ? 'text-secondary-teal' : ''}`} onClick={() => setIsMenuOpen(false)}>תחומי התמחות</a>
                <a href="#experience" className={`mobile-nav-link ${activeSection === 'experience' ? 'text-secondary-teal' : ''}`} onClick={() => setIsMenuOpen(false)}>ניסיון מקצועי</a>
                <a href="#about" className={`mobile-nav-link ${activeSection === 'about' ? 'text-secondary-teal' : ''}`} onClick={() => setIsMenuOpen(false)}>אודות</a>
                <div className="mt-8">
                  <a href="#contact" className="btn-primary" onClick={() => setIsMenuOpen(false)}>
                    פנייה אישית
                  </a>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const LeadForm = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    service: '',
    week: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Either phone or email must be provided
    if (!formData.phone && !formData.email) {
      alert('אנא הזיני מספר טלפון או כתובת אימייל ליצירת קשר');
      return;
    }

    setStatus('loading');
    console.log('Starting form submission...', formData);

    try {
      const response = await fetch('./contact.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('Submission successful:', result);
        setStatus('success');
      } else {
        const errorText = await response.text();
        console.error('Submission failed with status:', response.status, errorText);
        setStatus('error');
      }
    } catch (error) {
      console.error('Fetch error during submission:', error);
      setStatus('error');
    }
  };

  return (
    <div className="card sidebar-sticky">
      <div className="section-title !border-r-0 !pr-0 !mb-8">
        <h3 className="text-2xl font-black">פנייה אישית</h3>
        <p className="text-sm">נחזור אלייך בהקדם המקסימלי</p>
      </div>

      {status === 'success' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-center"
        >
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h4 className="text-green-800 font-bold">הודעתך נשלחה בהצלחה!</h4>
          <p className="text-green-700 text-sm">ד"ר עוז או נציגו יחזרו אלייך בהקדם.</p>
        </motion.div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-center">
          <h4 className="text-red-800 font-bold">חלה שגיאה בשליחה</h4>
          <p className="text-red-700 text-sm">אנא נסי שנית או צרי קשר טלפוני.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">שם מלא (אופציונלי)</label>
          <input
            type="text"
            className="input-field"
            placeholder="מיכל ישראלי"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">טלפון ליצירת קשר</label>
            <input
              type="tel"
              className="input-field"
              placeholder="050-1234567"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">אימייל</label>
            <input
              type="email"
              className="input-field"
              placeholder="michal@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">השירות המבוקש (אופציונלי)</label>
          <select
            className="input-field"
            value={formData.service}
            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          >
            <option value="">בחרי שירות...</option>
            {SERVICES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">שבוע הריון (אופציונלי)</label>
          <input
            type="number"
            min="1"
            max="42"
            className="input-field"
            placeholder="למשל: 12"
            value={formData.week}
            onChange={(e) => setFormData({ ...formData, week: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">הודעה נוספת</label>
          <textarea
            className="input-field h-20 resize-none"
            placeholder="פירוט קצר..."
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary shadow-lg shadow-[#76A5AF]/20 mt-4 disabled:opacity-50"
        >
          {status === 'loading' ? 'שולח...' : 'שלחי פנייה'}
          <ArrowLeft className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

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

const App = () => {
  const [activeSection, setActiveSection] = useState('about');
  const [isTransparent, setIsTransparent] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setIsTransparent(scrollPos < 100);

      const sections = ['about', 'specialties', 'experience', 'contact'];
      let current = 'about';

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Adjust threshold: 1/3 of the window height is usually a sweet spot for scroll-spy
          if (rect.top <= window.innerHeight / 3) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const HERO_POINTS = [
    {
      title: "מומחיות",
      desc: "ניסיון מעשי עשיר מקליניקות ובתי חולים מובילים בארץ, כולל איכילוב וכללית.",
    },
    {
      title: "דיוק",
      desc: "שימוש בטכנולוגיית אולטרסאונד מהמתקדמות בעולם לאבחון מדויק וחסר פשרות.",
    },
    {
      title: "יחס אישי לכל מטופלת",
      desc: "זמינות גבוהה, ליווי צמוד ורגישות מקסימלית לכל אורך התהליך.",
    }
  ];

  return (
    <div className="min-h-screen">
      <Header activeSection={activeSection} isTransparent={isTransparent} />

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
                מומחה לאולטרסאונד, פריון ומיילדות. אבחון מדויק המשלב טכנולוגיה עילית עם יחס אישי וניסיון של שנים.
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
                <h2>תחומי התמחות</h2>
                <p>השירותים המקצועיים הניתנים בקליניקה</p>
              </div>

              <div className="grid gap-4">
                <SectionRow
                  title="אולטרסאונד ואבחון"
                  subtitle="סקירות מערכות ואבחון מומים בדיוק מקסימלי בטכנולוגיה המתקדמת ביותר."
                />
                <SectionRow
                  title="פריון ופוריות"
                  subtitle="ייעוץ וליווי אישי רגיש בטיפולי פוריות מורכבים ומתקדמים."
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
              </div>

              <div className="grid gap-4">
                {[
                  {
                    title: 'מנהל יחידת אולטרסאונד קהילתי',
                    subtitle: 'מחוז צפון - קופת חולים כללית'
                  },
                  {
                    title: 'רופא בכיר ביחידת ה-IVF',
                    subtitle: 'המרכז הרפואי תל אביב (איכילוב)'
                  },
                  {
                    title: 'רופא נשים מומחה',
                    subtitle: 'מכון מאר ובתי חולים מובילים בארץ'
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

          </div>

          {/* Sidebar Area */}
          <aside>
            <LeadForm />
          </aside>
        </div>
      </main>

      <footer id="contact" className="footer-main">
        <div className="page-wrapper">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3 className="font-black">ד"ר יובל עוז</h3>
              <p className="text-sm font-medium leading-relaxed max-w-xs">
                מומחה לאולטרסאונד, פריון ומיילדות.
              </p>
              <p className="text-sm font-medium leading-relaxed max-w-xs">
                אבחון מדויק, רמה מקצועית גבוהה ויחס אישי לכל מטופלת.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 md:col-span-2">
              <div className="flex flex-col gap-6">
                <div className="footer-nav-links">
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    <MapPin className="w-4 h-4 text-secondary-teal" />
                    <span className="text-sm">ראש פינה</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    <Clock className="w-4 h-4 text-secondary-teal" />
                    <span className="text-sm">מענה טלפוני 24/7</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium">
                    <Phone className="w-4 h-4 text-secondary-teal" />
                    <span className="text-sm font-bold text-primary-navy">04-6805332</span>
                  </div>
                  <a
                    href="https://wa.me/972506993353?text=%D7%A9%D7%9C%D7%95%D7%9D%20%D7%93%22%D7%A8%20%D7%A2%D7%95%D7%96%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A7%D7%91%D7%9C%20%D7%A4%D7%A8%D7%98%D7%99%D7%9D%20%D7%A0%D7%95%D7%A1%D7%A4%D7%99%D7%9D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-btn-footer"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.316 1.592 5.448 0 9.886-4.438 9.888-9.886.002-5.448-4.437-9.884-9.885-9.884-5.447 0-9.884 4.437-9.887 9.885 0 2.13.56 3.668 1.54 5.447l-1.011 3.689 3.839-.982-.2 1.329zm9.367-7.11c-.263-.131-1.555-.768-1.796-.856-.24-.087-.414-.131-.588.131-.174.262-.676.856-.83.1.031-.153.174-.436.044-.262-.131-.131-.502-.857-.687-.24-.131-.414-.131-.588 0l-.131.131c-.131.131-.328.312-.328.761 0 .449.328.883.372.943.044.06 6.449 10.142 6.449 10.142.349.524.785.655 1.178.655s.785-.131 1.047-.393c.262-.262.262-.655.262-.655s.087-.131 0-.197c-.044-.066-.35-.175-.611-.263z" />
                    </svg>
                    שלחי הודעת וואטסאפ
                  </a>
                </div>


              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">
              © {new Date().getFullYear()} ד"ר יובל עוז | כל הזכויות שמורות.
            </p>
            <div className="flex items-center gap-8 mt-4 md:mt-0">
              <a href="#" className="footer-copy hover:text-secondary-teal transition-colors">מדיניות פרטיות</a>
              <span className="text-slate-300 select-none"> | </span>
              <a href="#" className="footer-copy hover:text-secondary-teal transition-colors">הנגשת אתר</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
