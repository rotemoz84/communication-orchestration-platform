import { useState } from 'react';
import {
  Stethoscope,
  Baby,
  Heart,
  CheckCircle2,
  Menu,
  X,
  ArrowLeft,
  Award,
  Globe,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Data ---
const SERVICES_OPTIONS = [
  "סקירת מערכות להריון 1",
  "סקירת מערכות להריון 2",
  "סקירת מערכות להריון 3",
  "שיחת ייעוץ / פתיחה",
  "שליחת שאלה כללית"
];

// --- Components ---

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="header-main">
        <div className="page-wrapper header-inner">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tighter">
              ד"ר <span className="text-gradient">יובל עוז</span>
            </h1>
          </div>

          <nav className="nav-links">
            <a href="#specialties" className="nav-link">תחומי התמחות</a>
            <a href="#experience" className="nav-link">ניסיון מקצועי</a>
            <a href="#about" className="nav-link">אודות</a>
            <a href="#contact" className="btn-primary !py-2 !px-6 !text-sm !w-auto">פנייה אישית</a>
          </nav>

          <button className="lg:hidden p-2 text-primary-navy" onClick={() => setIsMenuOpen(true)}>
            <Menu className="w-8 h-8" />
          </button>
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
              <nav className="flex flex-col gap-6">
                <a href="#specialties" className="text-xl font-bold text-primary-navy no-underline" onClick={() => setIsMenuOpen(false)}>תחומי התמחות</a>
                <a href="#experience" className="text-xl font-bold text-primary-navy no-underline" onClick={() => setIsMenuOpen(false)}>ניסיון מקצועי</a>
                <a href="#about" className="text-xl font-bold text-primary-navy no-underline" onClick={() => setIsMenuOpen(false)}>אודות</a>
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
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div className="card text-center py-12 border-2 border-[#27AE60]/20">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
          <CheckCircle2 className="w-16 h-16 text-[#27AE60] mx-auto mb-4" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-2">תודה רבה!</h3>
        <p className="text-slate-500">פרטייך נקלטו במערכת. ד"ר עוז או נציג מטעמו יחזרו אלייך בהקדם.</p>
        <button onClick={() => setStatus('idle')} className="mt-8 text-[#76A5AF] font-bold hover:underline">שליחת הודעה נוספת</button>
      </div>
    );
  }

  return (
    <div id="contact" className="card sidebar-sticky">
      <h3 className="text-xl font-black mb-6 text-center">פנייה אישית</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">שם מלא</label>
          <input type="text" required className="input-field" placeholder="שלום כהן" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">טלפון ליצירת קשר</label>
          <input type="tel" required className="input-field" placeholder="050-1234567" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">השירות המבוקש (אופציונלי)</label>
          <select className="input-field">
            <option value="">בחרי שירות...</option>
            {SERVICES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">שבוע הריון (אופציונלי)</label>
          <input type="number" min="1" max="42" className="input-field" placeholder="למשל: 12" />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">הודעה נוספת</label>
          <textarea className="input-field h-20 resize-none" placeholder="פירוט קצר..."></textarea>
        </div>

        <button type="submit" className="btn-primary shadow-lg shadow-[#76A5AF]/20 mt-4">
          שלחי פנייה
          <ArrowLeft className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase">זמינות</p>
          <p className="text-sm font-bold text-[#1A2B3C]">תוך 24 שעות</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400 uppercase">מיקום</p>
          <p className="text-sm font-bold text-[#1A2B3C]">ראש פינה</p>
        </div>
      </div>
    </div>
  );
};

const SpecialtyCard = ({ img, title, desc, icon: Icon }: any) => (
  <div className="card card-hover !p-0 overflow-hidden">
    <div className="img-container img-specialty-sm">
      <img src={img} alt={title} />
    </div>
    <div className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#76A5AF]/10 flex items-center justify-center text-[#76A5AF]">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-extrabold text-lg">{title}</h3>
      </div>
      <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

const App = () => {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="page-wrapper">
        <div className="layout-grid">
          {/* Content Area */}
          <div className="space-y-20">

            {/* Hero Section */}
            <section id="about">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="img-container img-hero mb-10 shadow-2xl">
                  <img src="/dr_oz.png" alt='ד"ר יובל עוז' />
                </div>
                <div className="badge">רפואת נשים ברמה אחרת</div>
                <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                  ד"ר <span className="text-gradient">יובל עוז</span> — מומחיות, <br />
                  דיוק ויחס אישי לכל מטופלת.
                </h1>
                <p className="text-xl md:text-2xl text-slate-600 max-w-3xl font-medium leading-relaxed">
                  מעל עשור של ניסיון באבחון אולטרסאונד מתקדם, ליווי הריון אישי וטיפולי פריון בטכנולוגיות המתקדמות ביותר.
                </p>
              </motion.div>
            </section>

            {/* Specialties Section */}
            <section id="specialties">
              <div className="section-title">
                <h2>תחומי התמחות</h2>
                <p>השירותים המקצועיים הניתנים בקליניקה</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <SpecialtyCard
                  img="/ultrasound.png"
                  title="אולטרסאונד ואבחון"
                  desc="סקירות מערכות ואבחון מומים בדיוק מקסימלי."
                  icon={Stethoscope}
                />
                <SpecialtyCard
                  img="/fertility.png"
                  title="פריון ופוריות"
                  desc="ייעוץ וליווי אישי בטיפולי פוריות רגישים."
                  icon={Heart}
                />
                <SpecialtyCard
                  img="/obstetrics.png"
                  title="מיילדות והריון"
                  desc="מעקב הריון רציף ואישי להריונות תקינים ובסיכון."
                  icon={Baby}
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
                  { title: 'מנהל יחידת אולטרסאונד קהילתי', subtitle: 'מחוז צפון - קופת חולים כללית', icon: Award },
                  { title: 'רופא בכיר ביחידת ה-IVF', subtitle: 'המרכז הרפואי תל אביב (איכילוב)', icon: Globe },
                  { title: 'רופא נשים מומחה', subtitle: 'מכון מאר ובתי חולים מובילים בארץ', icon: Award },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: -10 }}
                    className="card flex items-center gap-6 cursor-default !py-6"
                  >
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center text-[#1A2B3C] border border-slate-100">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg">{item.title}</h4>
                      <p className="text-slate-500 text-sm font-medium">{item.subtitle}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

          </div>

          {/* Sidebar Area */}
          <aside>
            <LeadForm />

            <div className="mt-8 card bg-[#1A2B3C] border-none text-white hidden lg:block">
              <h4 className="text-white mb-6 flex items-center gap-3">
                <Award className="w-6 h-6 text-[#C5A059]" />
                למה לבחור בד"ר עוז?
              </h4>
              <ul className="space-y-4 text-slate-300">
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#76A5AF]" />
                  <span className="text-sm">ניסיון מקליניקות ובתי חולים מובילים</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#76A5AF]" />
                  <span className="text-sm">שימוש בטכנולוגיית אולטרסאונד 4D</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#76A5AF]" />
                  <span className="text-sm">זמינות גבוהה וליווי אישי צמוד</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <footer className="footer-main">
        <div className="page-wrapper">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3 className="font-black">ד"ר יובל עוז</h3>
              <p className="text-sm font-medium leading-relaxed">
                מומחה לאולטרסאונד, פריון ומיילדות. אבחון מדויק, רמה מקצועית גבוהה ויחס אישי לכל מטופלת.
              </p>
            </div>

            <div>
              <p className="footer-nav-title">ניווט מהיר</p>
              <nav className="footer-nav-links">
                <a href="#about" className="footer-nav-link">אודות</a>
                <a href="#specialties" className="footer-nav-link">תחומי התמחות</a>
                <a href="#experience" className="footer-nav-link">ניסיון מקצועי</a>
                <a href="#contact" className="footer-nav-link">יצירת קשר</a>
              </nav>
            </div>

            <div>
              <p className="footer-nav-title">פרטי קשר</p>
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
                  <ExternalLink className="w-4 h-4 text-secondary-teal" />
                  <span className="text-sm font-bold text-primary-navy">050-XXXXXXX</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">
              © {new Date().getFullYear()} ד"ר יובל עוז | כל הזכויות שמורות.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="footer-copy hover:text-secondary-teal transition-colors">מדיניות פרטיות</a>
              <a href="#" className="footer-copy hover:text-secondary-teal transition-colors">הנגשת אתר</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
