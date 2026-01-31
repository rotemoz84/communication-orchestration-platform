import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react';

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
            setValidationError('אנא הזיני מספר טלפון או כתובת אימייל ליצירת קשר');
            return;
        }

        setValidationError('');

        setStatus('loading');

        try {
            const response = await fetch('./contact.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus('success');
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
            <div className="card sidebar-sticky contact-form-white shadow-[0_20px_50px_rgba(26,43,60,0.08)] !p-8 md:!p-12 ">
                {showTitle && (
                    <div className="section-title !border-r-0 !pr-0 !mb-12 text-center">
                        <h3 className="text-3xl font-black text-primary-navy">פנייה אישית</h3>
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
                        <p className="text-green-700 mt-2">ד"ר עוז או נציגו יחזרו אלייך בהקדם.</p>
                    </motion.div>
                )}

                {validationError && (
                    <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-amber-800 font-bold">נא להשלים פרטים</h4>
                                <p className="text-amber-700 text-sm mt-1">{validationError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-2xl text-center">
                        <h4 className="text-red-800 font-bold">חלה שגיאה בשליחה</h4>
                        <p className="text-red-700 text-sm">אנא נסי שנית או צרי קשר טלפוני.</p>
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
                            <label >שבוע הריון (לא חובה)</label>
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
                            <label>הודעה נוספת (לא חובה)</label>
                            <textarea
                                className="input-field !bg-slate-50 !border-slate-200 !text-primary-navy !rounded-2xl h-28 resize-none !py-4"
                                placeholder="פירוט קצר..."
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="btn-primary !bg-primary-navy !text-white shadow-xl shadow-black/10 mt-6 disabled:opacity-50 !py-5 !rounded-2xl transition-all hover:scale-[1.02] active:scale-95 font-black text-lg"
                        >
                            {status === 'loading' ? 'שולח...' : 'שילחי ונחזור אליך בהקדם'}
                            <ArrowLeft className="w-6 h-6 mr-2" />
                        </button>
                    </section>
                </form>
            </div>
        </section>
    );
};

export default ContactForm;
