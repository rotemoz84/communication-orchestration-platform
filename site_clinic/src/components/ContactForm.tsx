import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';
import Button from './Button';
import whatsappLogo from '../assets/whatsapp_white.png';
import { Phone } from 'lucide-react';

const SERVICES_OPTIONS = [
    "קביעת תור לסקירת מערכות",
    "שיחת ייעוץ כללית",
    "שאלה אחרת"
];

const ContactForm = ({ id = "contact", showTitle = true }: { id?: string; showTitle?: boolean }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [validationError, setValidationError] = useState('');

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
            setValidationError('אנא הזיני מספר טלפון או כתובת אימייל כדי שנוכל ליצור קשר');
            return;
        }

        setValidationError('');

        setStatus('loading');

        try {
            // API endpoint
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
                setFormData({ name: '', phone: '', email: '', service: '', week: '', message: '' });
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Fetch error during submission:', error);
            setStatus('error');
        }
    };

    return (
        <section id={id} className="scroll-mt-32">
            <div className="card sidebar-sticky contact-form-white shadow-[0_20px_50px_rgba(26,43,60,0.08)] !p-8 md:!p-12 rounded-3xl">
                {showTitle && (
                    <div className="section-title !border-r-0 !pr-0 !mb-12 text-center">
                        <h3 className="text-3xl font-black text-primary-navy">צרי קשר</h3>
                        <p className="text-slate-500 font-medium mt-2">נחזור אלייך בהקדם המקסימלי</p>
                    </div>
                )}

                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mb-8 p-6 bg-green-50 border border-green-100 rounded-2xl text-center"
                    >
                        <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-3" />
                        <h4 className="text-green-800 text-xl font-bold">הודעתך נשלחה בהצלחה!</h4>
                        <p className="text-green-700 mt-2">ד"ר עוז או נציגתו יחזרו אלייך בהקדם.</p>
                    </motion.div>
                )}

                {validationError && (
                    <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-amber-800 font-bold">נא להשאיר לפחות טלפון או מייל תקינים כדי שנוכל לחזור אלייך.</h4>
                                <p className="text-amber-700 text-sm mt-1">{validationError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
                        <h4 className="text-red-800 font-bold">חלה שגיאה טכנית בשליחה</h4>
                        <p className="text-red-700 text-sm">אנא צרי קשר טלפוני.</p>
                        
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
                                    className="input-field !bg-slate-50 !border-slate-200 !text-primary-navy !rounded-2xl !py-4"
                                    placeholder="050-1234567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <label>אימייל</label>
                                <input
                                    type="email"
                                    className="input-field !bg-slate-50 !border-slate-200 !text-primary-navy !rounded-2xl !py-4"
                                    placeholder="michal@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

                        <div className="form-row">
                            <label>רוצה להוסיף משהו אחר (לא חובה)</label>
                            <textarea
                                className="input-field !bg-slate-50 !border-slate-200 !text-primary-navy !rounded-2xl h-28 resize-none !py-4"
                                placeholder="פירוט נוסף לבחירתך"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            ></textarea>
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
