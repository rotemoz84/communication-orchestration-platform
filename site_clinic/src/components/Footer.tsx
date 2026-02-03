import { MapPin, Clock, Phone } from 'lucide-react';
import whatsappLogo from '../assets/whatsapp_white.png';
import Button from './Button';

const Footer = () => {
    return (
        <footer className="footer-main">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:col-span-2">
                        <div className="flex flex-col gap-6">
                            <div className="footer-nav-links flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-slate-500 font-medium">
                                    <MapPin className="w-4 h-4 text-secondary-teal" />
                                    <span className="text-sm">ראש פינה, קניון סנטר הגליל, בניין א, קומה 2</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 font-medium">
                                    <Clock className="w-4 h-4 text-secondary-teal" />
                                    <span className="text-sm">שני עד רביעי , 9:00 - 21:00 (בתיאום מראש)</span>
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
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="page-wrapper flex flex-col items-center justify-center gap-4 text-center">
                    <p className="footer-copy">
                        © {new Date().getFullYear()} ד"ר יובל עוז | כל הזכויות שמורות.
                    </p>
                    <div className="flex items-center justify-center gap-8">
                        <a href="#" className="footer-copy hover:text-secondary-teal transition-colors">מדיניות פרטיות</a>
                        <span className="text-slate-300 select-none"> | </span>
                        <a href="#" className="footer-copy hover:text-secondary-teal transition-colors">הנגשת אתר</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
