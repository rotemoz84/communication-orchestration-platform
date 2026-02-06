import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen pb-20 md:pb-0">
            <Header
                activeSection="privacy"
                isTransparent={false}
                onNavigateHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />


            {/* Hero Section */}
            <section className="hero-full">
                <div className="hero-bg">
                    <div className="hero-overlay" />
                </div>
                <div className="page-wrapper hero-content">
                    <div className="hero-grid">
                        <div>
                            <div className="inline-block px-4 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-bold mb-6 border border-white/20">
                                מדיניות פרטיות
                            </div>
                            <h1 className="text-5xl md:text-7xl mb-8 leading-tight text-white">
                                הגנה על <span className="text-white">הפרטיות שלך</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 max-w-xl font-medium leading-relaxed mb-10">
                                אנו מחויבים להגנה על פרטיותך ולהבטיח שהמידע האישי שלך מטופל בזהירות ובבטחות מרבית
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
             <main className="page-wrapper">
                <div className="layout-grid">
                    <div className="content-stack">                           
                            {/* Introduction */}
                            <section>
                                <div className="section-title">
                                    <h2>הקדמה</h2>
                                    <p>מידע על הגנת הפרטיות שלך</p>
                                </div>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    ד"ר יובל עוז ("אנחנו", "אותנו", "שלנו") מכבדים את פרטיותך ומחויבים להגן על המידע האישי שלך. 
                                    מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים, מאחסנים ומגנים על המידע שלך בעת שימוש באתר שלנו ובשירותינו.
                                </p>
                            </section>

                            {/* Information We Collect */}
                            <section>
                                <div className="section-title">
                                    <h2>מידע שאנו אוספים</h2>
                                    <p>המידע האישי שנאסוף לצורך מתן שירות</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-teal-50 border-r-4 border-teal-600 p-6 rounded-2xl">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">מידע אישי</h3>
                                        <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                            <li><strong>שם מלא:</strong> לצורך זיהוי ופנייה אליך</li>
                                            <li><strong>מספר טלפון:</strong> ליצירת קשר ותיאום פגישות</li>
                                            <li><strong>דוא"ל:</strong> לתקשורת עדכונים ומידע (אופציונלי)</li>
                                            <li><strong>שבוע הריון:</strong> מידע רפואי רגיש לצורך מתן שירות רפואי מתאים</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* How We Use Information */}
                            <section>
                                <div className="section-title">
                                    <h2>איך אנו משתמשים במידע</h2>
                                    <p>המטרות לשימוש במידע האישי</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-teal-50 border-r-4 border-teal-600 p-6 rounded-2xl">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">מטרה עיקרית: מתן שירות רפואי</h3>
                                        <p className="text-gray-700 text-lg">
                                            המידע שלך משמש אותנו לספק שירותי רפואת נשים, פריון והריון, כולל אולטרסאונד גניקולוגי וייעוץ מקצועי.
                                        </p>
                                    </div>
                                    <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                        <li><strong>תיאום פגישות:</strong> ליצירת קשר ותיאום תורים</li>
                                        <li><strong>מתן מענה:</strong> לשאלות ובקשות רפואיות</li>
                                        <li><strong>שיפור שירות:</strong> להבנת צרכי המטופלות ושיפור השירות</li>
                                        <li><strong>תקשורת:</strong> לעדכונים ומידע רלוונטי (בהסכמה)</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Data Protection */}
                            <section>
                                <div className="section-title">
                                    <h2>הגנת מידע ואבטחה</h2>
                                    <p>אמצעי אבטחה והגנה על המידע</p>
                                </div>
                                <div className="space-y-6">
                                    <p className="text-gray-700 text-lg">
                                        אנו מגנים על המידע האישי שלך באמצעים טכנולוגיים וארגוניים מתקדמים:
                                    </p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                        <li><strong>הצפנה:</strong> כל התקשורת מוצפנת באמצעות SSL/TLS</li>
                                        <li><strong>גישה מוגבלת:</strong> רק עובדים מורשים יכולים לגשת למידע רפואי</li>
                                        <li><strong>אחסון מאובטח:</strong> שרתים מאובטחים עם גיבויים סדירים</li>
                                        <li><strong>עדכוני אבטחה:</strong> עדכונים ותחזוקות אבטחה סדירים</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Your Rights */}
                            <section>
                                <div className="section-title">
                                    <h2>זכויותיך</h2>
                                    <p>הזכויות שלך לגבי המידע האישי</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">גישה למידע</h3>
                                        <p className="text-gray-700">
                                            יש לך זכות לבקש גישה לכל המידע האישי שאנו מחזיקים עליך.
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">תיקון מידע</h3>
                                        <p className="text-gray-700">
                                            תוכלי לבקש תיקון של מידע לא מדויק או השלמת פרטים חסרים.
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">מחיקת מידע</h3>
                                        <p className="text-gray-700">
                                            יש לך זכות לבקש מחיקת מידע אישי, בכפוף לדרישות חוקיות ורפואיות.
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-3">הסרת הסכמה</h3>
                                        <p className="text-gray-700">
                                            תוכלי להסיר את הסכמתך לעיבוד מידע בכל עת.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Data Retention */}
                            <section>
                                <div className="section-title">
                                    <h2>משך זמן אחסון מידע</h2>
                                    <p>כמה זמן אנו שומרים את המידע שלך</p>
                                </div>
                                <p className="text-gray-700 text-lg mb-6">
                                    אנו שומרים את המידע האישי שלך רק כמה שנדרש למטרות המפורטות במדיניות זו ובהתאם לדיני הרפואה והגנת הפרטיות בישראל.
                                </p>
                                <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                    <li><strong>מידע רפואי:</strong> עד 7 שנים מתאריך הביקור האחרון, כדין הדיני</li>
                                    <li><strong>מידע פניות:</strong> עד 3 שנים מתאריך הפנייה האחרונה</li>
                                </ul>
                            </section>

                            {/* Contact Information */}
                            <section>
                                <div className="section-title">
                                    <h2>פרטי התקשורת</h2>
                                    <p>דרכי יצירת קשר עם המרפאה</p>
                                </div>
                                <div className="bg-teal-50 border-r-4 border-teal-600 p-8 rounded-2xl">
                                    <div className="space-y-4">
                                        <p className="text-gray-800 text-lg">
                                            <strong>שם האחראי לפרטיות:</strong> ד"ר יובל עוז
                                        </p>
                                        <p className="text-gray-800 text-lg">
                                            <strong>טלפון:</strong> 04-680-1552
                                        </p>
                                        <p className="text-gray-800 text-lg">
                                            <strong>דוא"ל:</strong> secretary@drozyuval.com
                                        </p>
                                        <p className="text-gray-800 text-lg">
                                            <strong>כתובת:</strong> ראש פינה, קניון סנטר הגליל, בניין א, קומה 2
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Legal Compliance */}
                            <section>
                                <div className="section-title">
                                    <h2>ציות לדין</h2>
                                    <p>התאמה לדיני הפרטיות בישראל</p>
                                </div>
                                <p className="text-gray-700 text-lg mb-6">
                                    מדיניות פרטיות זו נכתבה בהתאם לדיני מדינת ישראל, כולל:
                                </p>
                                <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                    <li><strong>חוק הגנת הפרטיות, התשמ"א-1981</strong></li>
                                    <li><strong>תיקון מס' 13 לחוק הגנת הפרטיות (2025)</strong></li>
                                    <li><strong>דיני זכויות חולה וחובות מטפל</strong></li>
                                    <li><strong>כללי האתיקה הרפואית</strong></li>
                                </ul>
                            </section>

                            {/* Updates */}
                            <section>
                                <div className="section-title">
                                    <h2>עדכונים למדיניות</h2>
                                    <p>שינויים ועדכונים במדיניות הפרטיות</p>
                                </div>
                                <p className="text-gray-700 text-lg mb-6">
                                    אנו עשויים לעדכן מדיניות פרטיות זו מעת לעת כדי לשקף שינויים בפעילותינו, 
                                    בשינויים חקיקתיים או בשיפורים בהליכי הגנת הפרטיות שלנו. 
                                    כל שינוי יפורסם בדף זה ויחול מהתאריך המצוין למעלה.
                                </p>
                                <div className="bg-gray-100 p-6 rounded-2xl mt-6">
                                    <p className="text-gray-800 text-lg">
                                        <strong>עדכון אחרון:</strong> פברואר 2026<br/>
                                        <strong>סקירה הבאה:</strong> אוגוסט 2026
                                    </p>
                                </div>
                            </section>

                            {/* Questions */}
                            <section>
                                <div className="section-title">
                                    <h2>שאלות ותלונות</h2>
                                    <p>פנייה במקרה של שאלות או חששות</p>
                                </div>
                                <p className="text-gray-700 text-lg">
                                    אם יש לך שאלות או חששות לגבי מדיניות הפרטיות שלנו או אופן הטיפול במידע האישי שלך, 
                                    אנא אל תהססי לפנות אלינו באמצעות פרטי ההתקשורת המפורטים למעלה. 
                                    אנו מחויבים לטפל בכל פנייה בצורה מקצועית ובהתאם לדין.
                                </p>
                            </section>

                        </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
