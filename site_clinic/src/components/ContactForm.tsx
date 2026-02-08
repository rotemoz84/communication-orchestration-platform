import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import Button from './Button';
import whatsappLogo from '../assets/whatsapp_white.png';
import { Phone } from 'lucide-react';

const SERVICES_OPTIONS = [
    "קביעת תור לסקירת מערכות או בדיקה אחרת",
    "ייעוץ הריון, פוריות, מיילדות",
    "משהו אחר"
];

const ContactForm = ({ id = "contact", showTitle = true }: { id?: string; showTitle?: boolean }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [validationError, setValidationError] = useState('');
    const [highlightContactFields, setHighlightContactFields] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        service: '',
        week: '',
        message: '',
        privacyConsent: false,
        sensitiveDataConsent: false,
        callbackConsent: false
    });

    const tryPHPFallback = async () => {
        try {
            // Try PHP fallback endpoint
            const PHP_URL = 'https://drozyuval.com/contact.php'; // Production URL
            
            const response = await fetch(`${PHP_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setStatus('success');
                    // Reset form on success
                    setFormData({ name: '', phone: '', email: '', service: '', week: '', message: '', privacyConsent: false, sensitiveDataConsent: false, callbackConsent: false });
                    console.log('PHP fallback successful:', result);
                } else {
                    setStatus('error');
                    console.error('PHP fallback returned error:', result);
                }
            } else {
                setStatus('error');
                console.error('PHP fallback HTTP error:', response.status);
            }
        } catch (error) {
            console.error('PHP fallback failed:', error);
            setStatus('error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setValidationError('');
        setHighlightContactFields(false);
        setStatus('idle');

        // Validation: Either phone or email must be provided
        if (!formData.phone && !formData.email) {
            setValidationError('אנא הזיני מספר טלפון או כתובת אימייל כדי שנוכל ליצור קשר');
            setHighlightContactFields(true);
            return;
        }

        setStatus('loading');

        try {
            // Try main API endpoint first
            const API_URL = 'https://api.drozyuval.com/api/inquiries';
            
            const response = await fetch(`${API_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus('success');
                // Reset form on success
                setFormData({ name: '', phone: '', email: '', service: '', week: '', message: '', privacyConsent: false, sensitiveDataConsent: false, callbackConsent: false });
            } else {
                // If main API fails, try PHP fallback
                await tryPHPFallback();
            }
        } catch (error) {
            console.error('Main API failed, trying PHP fallback:', error);
            await tryPHPFallback();
        }
    };

    return (
        <section id={id} className="scroll-mt-32">
            <div className="card sidebar-sticky contact-form-white shadow-[0_20px_50px_rgba(26,43,60,0.08)] !p-8 md:!p-12 rounded-3xl">
                {showTitle && (
                    <div className="section-title !border-r-0 !pr-0 !mb-12 text-center">
                        <h2 className="text-3xl font-black text-primary-navy">צרי קשר</h2>
                        <p className="text-slate-500 font-medium mt-2">נחזור אלייך בהקדם המקסימלי</p>
                    </div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-8 p-6 success-container border rounded-2xl text-center"
                    >
                        <CheckCircle2 className="w-10 h-10 success-icon mx-auto mb-3" />
                        <h4 className="success-title text-xl font-bold">הודעתך נשלחה בהצלחה!</h4>
                        <p className="success-message mt-2">ד"ר עוז או נציגתו יחזרו אלייך בהקדם.</p>
                    </motion.div>
                )}

                {validationError && (
                    <div className="mb-8 p-6 bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 error-heading shrink-0 mt-0.5" />
                            <div>
                                <h4 className="error-heading font-black">נא להשאיר לפחות טלפון או מייל תקינים כדי שנוכל לחזור אלייך.</h4>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-8 p-6 bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-2xl text-center">
                        <div className="flex items-center justify-center gap-3 mb-3">
                            <AlertCircle className="w-5 h-5 error-heading shrink-0" />
                            <h4 className="error-heading font-bold">חלה שגיאה טכנית בשליחה. אנא צרי קשר טלפוני.</h4>
                        </div>
                        
                          {/* Call Now Button Component */}
                        <Button
                            buttonColor="#1A2B3C"
                            buttonText="התקשרי עכשיו ל 680-1552"
                            buttonIcon={<Phone className="w-4 h-4" />}
                            href="tel:04-6801552"
                        />
                        
                        {/* whatsapp button Component */}
                        <Button
                            buttonColor="#25D366"
                            buttonText="שילחי לי וואטסאפ"
                            buttonIcon={<img src={whatsappLogo} alt="WhatsApp" className="generic-button-icon" />}
                            href="https://wa.me/+972509996171?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A0%D7%99%20%D7%9E%D7%A2%D7%95%D7%A0%D7%99%D7%99%D7%A0%D7%AA%20%D7%9C%D7%A7%D7%91%D7%9C%20%D7%A2%D7%95%D7%93%20%D7%A4%D7%A8%D7%98%D7%99%D7%9D%20%D7%A2%D7%9C%20%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA%D7%99%D7%9D%20%D7%A9%D7%9C%20%D7%94%D7%9E%D7%A8%D7%A4%D7%90%D7%94"
                            target="_blank"
                        />
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <section >
                        <div>
                            <label>שם מלא (לא חובה)</label>
                            <input
                                type="text"
                                className="input-field !bg-slate-50 !border-slate-200 !text-primary-navy !rounded-2xl !py-4"
                                placeholder="מיכל ישראלי"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="form-row">
                            <div>
                                <label>טלפון ליצירת קשר</label>
                                <input
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className={`input-field !bg-slate-50 !text-primary-navy !rounded-2xl !py-4 ${(validationError || highlightContactFields) ? '!border-amber-500 !ring-2 !ring-amber-300 validation-highlight' : '!border-slate-200'}`}
                                    placeholder="050-1234567"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const onlyDigits = e.target.value.replace(/\D/g, '');
                                        setFormData({ ...formData, phone: onlyDigits });
                                        if (onlyDigits || formData.email) {
                                            setHighlightContactFields(false);
                                            setValidationError('');
                                        }
                                    }}
                                />
                            </div>
                            <div className="form-row">
                                <label>אימייל</label>
                                <input
                                    type="email"
                                    className={`input-field !bg-slate-50 !text-primary-navy !rounded-2xl !py-4 ${(validationError || highlightContactFields) ? '!border-amber-500 !ring-2 !ring-amber-300 validation-highlight' : '!border-slate-200'}`}
                                    placeholder="michal@example.com"
                                    value={formData.email}
                                    onChange={(e) => {
                                        const nextEmail = e.target.value;
                                        setFormData({ ...formData, email: nextEmail });
                                        if (nextEmail || formData.phone) {
                                            setHighlightContactFields(false);
                                            setValidationError('');
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <label>השירות המבוקש (לא חובה)</label>
                            <select
                                className="input-field !bg-slate-50 !border-slate-200 !text-primary-navy !rounded-2xl !py-4"
                                value={formData.service}
                                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                            >
                                <option value="">בחרי שירות...</option>
                                {SERVICES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <div className="form-row">
                            <label>שבוע הריון (לא חובה)</label>
                            <input
                                type="number"
                                min="1"
                                max="42"
                                className="input-field !bg-slate-50 !border-slate-200 !text-primary-navy !rounded-2xl !py-4"
                                placeholder="בין 1 ל 42"
                                value={formData.week}
                                onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                            />
                        </div>
                         {formData.week !== '' && (
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="sensitive-data-consent"
                                        required
                                        checked={formData.sensitiveDataConsent}
                                        onChange={(e) => setFormData({ ...formData, sensitiveDataConsent: e.target.checked })}
                                        className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                    />
                                    <label htmlFor="sensitive-data-consent" className="consent-label"> 
                                        אני מסכימה לשתף מידע רפואי על מצב ההריון ומבינה שזה יסייע להציע לי שירות מתאים.
                                    </label>
                                </div>
                            )}

                        <div className="form-row">
                            <label>רוצה להוסיף משהו אחר (לא חובה)</label>
                            <textarea
                                className="input-field !bg-slate-50 !border-slate-200 !text-primary-navy !rounded-2xl h-28 resize-none !py-4"
                                placeholder="פירוט נוסף לבחירתך"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            ></textarea>
                        </div>

                        {/* Privacy Consent Section */}
                        <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="privacy-consent"
                                    required
                                    checked={formData.privacyConsent}
                                    onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                                    className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                                />
                                <label htmlFor="privacy-consent" className="consent-label">
                                    קראתי את <a href="/privacy-policy" target="_self" className="text-teal-600 hover:text-teal-700 underline font-medium">מדיניות הפרטיות</a> ואני מסכימה לשתף פרטי יצירת קשר איתי.
                                </label>
                            </div>
                           
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="btn-primary !bg-primary-navy !text-white shadow-xl shadow-black/10 mt-6 disabled:opacity-50 !py-5 !rounded-2xl transition-all hover:scale-[1.02] active:scale-95 font-black text-lg"
                        >
                            {status === 'loading' ? 'הודעה נשלחת...' : 'שילחי ונחזור אליך בהקדם'}
                            <ArrowLeft className="w-6 h-6 mr-2" />
                        </button>
                    </section>
                </form>
            </div>
        </section>
    );
};

export default ContactForm;
