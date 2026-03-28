import { MapPin, Clock, Phone } from 'lucide-react';
import whatsappLogo from '../assets/whatsapp_white.png';
import Button from './Button';
import useTranslation from '../hooks/useTranslation';

const Footer = () => {
    const { t, tWithParams } = useTranslation();
    return (
        <footer className="footer-main">
            <div className="page-wrapper">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <h3 className="font-black">{t('footer.brand.name')}</h3>
                        <p className="text-sm font-medium leading-relaxed max-w-xs">
                            {t('footer.brand.description1')}
                        </p>
                        <p className="text-sm font-medium leading-relaxed max-w-xs">
{t('footer.brand.description2')}
</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:col-span-2">
                         <div className="flex items-center gap-3 text-slate-500 font-medium">
                            <Clock className="w-4 h-4 text-secondary-teal" />
                            <span className="text-sm">{t('footer.contact.hours')}</span>
                        </div>
                        {/* Call Now Button Component */}
                        <Button
                            buttonColor="#1A2B3C"
                            buttonText={t('footer.buttons.call')}
                            buttonIcon={<Phone className="w-4 h-4" />}
                            href="tel:04-6801552"
                        />
                        
                        {/* whatsapp button Component.  office number 972509996171 */}
                        <Button
                            buttonColor="#25D366"
                            buttonText={t('footer.buttons.whatsapp')}
                            buttonIcon={<img src={whatsappLogo} alt="WhatsApp" className="generic-button-icon" />}
                            href="https://wa.me/+972509996171?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A0%D7%99%20%D7%9E%D7%A2%D7%95%D7%A0%D7%99%D7%99%D7%A0%D7%AA%20%D7%9C%D7%A7%D7%91%D7%9C%20%D7%A2%D7%95%D7%93%20%D7%A4%D7%A8%D7%98%D7%99%D7%9D%20%D7%A2%D7%9C%20%D7%94%D7%A9%D7%99%D7%A8%D7%95%D7%AA%D7%99%D7%9D%20%D7%A9%D7%9C%20%D7%94%D7%9E%D7%A8%D7%A4%D7%90%D7%94"
                            target="_blank"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:col-span-2">
                        <div className="flex items-center gap-3 text-slate-500 font-medium">
                            <MapPin className="w-4 h-4 text-secondary-teal" />
                            <span className="text-sm">{t('footer.contact.address')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <div className="page-wrapper flex flex-col items-center justify-center gap-4 text-center">
                    <p className="footer-copy">
                        {tWithParams('footer.bottom.copyright', { year: new Date().getFullYear() })}
                    </p>
                    <div className="flex items-center justify-center gap-8">
                        <a href="#/privacy-policy" className="footer-copy hover:text-secondary-teal transition-colors">{t('footer.bottom.privacy')}</a>
                        <span className="text-slate-300 select-none"> | </span>
                        <a href="#" className="footer-copy hover:text-secondary-teal transition-colors">{t('footer.bottom.accessibility')}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
