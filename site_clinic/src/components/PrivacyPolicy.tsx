import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import useTranslation from '../hooks/useTranslation';

const PrivacyPolicy = () => {
    const { t } = useTranslation();
    const personalInfoItems = t('privacy.sections.dataCollection.personalInfo.items' as any) as Array<{label: {he: string}, desc: {he: string}}>;
    const purposes = t('privacy.sections.dataUsage.purposes' as any) as Array<{label: {he: string}, desc: {he: string}}>;
    const measures = t('privacy.sections.dataProtection.measures' as any) as Array<{label: {he: string}, desc: {he: string}}>;
    const rightsItems = t('privacy.sections.rights.items' as any) as Array<{title: {he: string}, content: {he: string}}>;
    const periods = t('privacy.sections.dataRetention.periods' as any) as Array<{label: {he: string}, desc: {he: string}}>;
    const laws = t('privacy.sections.legal.laws' as any) as Array<{he: string}>;
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
                                {t('privacy.hero.badge')}
                            </div>
                            <h1 className="text-5xl md:text-7xl mb-8 leading-tight text-white">
                                {t('privacy.hero.title')}
                            </h1>
                            <p className="text-xl md:text-2xl text-white/90 max-w-xl font-medium leading-relaxed mb-10">
                                {t('privacy.hero.subtitle')}
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
                                    <h2>{t('privacy.sections.introduction.title')}</h2>
                                    <p>{t('privacy.sections.introduction.subtitle')}</p>
                                </div>
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    {t('privacy.sections.introduction.content')}
                                </p>
                            </section>

                            {/* Information We Collect */}
                            <section>
                                <div className="section-title">
                                    <h2>{t('privacy.sections.dataCollection.title')}</h2>
                                    <p>{t('privacy.sections.dataCollection.subtitle')}</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-teal-50 border-r-4 border-teal-600 p-6 rounded-2xl">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('privacy.sections.dataCollection.personalInfo.title')}</h3>
                                        <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                            {personalInfoItems.map((item: {label: {he: string}, desc: {he: string}}, index: number) => (
                                                <li key={index}><strong>{item.label.he}</strong> {item.desc.he}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* How We Use Information */}
                            <section>
                                <div className="section-title">
                                    <h2>{t('privacy.sections.dataUsage.title')}</h2>
                                    <p>{t('privacy.sections.dataUsage.subtitle')}</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-teal-50 border-r-4 border-teal-600 p-6 rounded-2xl">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('privacy.sections.dataUsage.mainPurpose.title')}</h3>
                                        <p className="text-gray-700 text-lg">
                                            {t('privacy.sections.dataUsage.mainPurpose.content')}
                                        </p>
                                    </div>
                                    <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                        {purposes.map((item: {label: {he: string}, desc: {he: string}}, index: number) => (
                                            <li key={index}><strong>{item.label.he}</strong> {item.desc.he}</li>
                                        ))}
                                    </ul>
                                </div>
                            </section>

                            {/* Data Protection */}
                            <section>
                                <div className="section-title">
                                    <h2>{t('privacy.sections.dataProtection.title')}</h2>
                                    <p>{t('privacy.sections.dataProtection.subtitle')}</p>
                                </div>
                                <div className="space-y-6">
                                    <p className="text-gray-700 text-lg mb-6">
                                        {t('privacy.sections.dataProtection.content')}
                                    </p>
                                    <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                        {measures.map((item: {label: {he: string}, desc: {he: string}}, index: number) => (
                                            <li key={index}><strong>{item.label.he}</strong> {item.desc.he}</li>
                                        ))}
                                    </ul>
                                </div>
                            </section>

                            {/* Your Rights */}
                            <section>
                                <div className="section-title">
                                    <h2>{t('privacy.sections.rights.title')}</h2>
                                    <p>{t('privacy.sections.rights.subtitle')}</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {rightsItems.map((item: {title: {he: string}, content: {he: string}}, index: number) => (
                                        <div key={index} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-3">{item.title.he}</h3>
                                            <p className="text-gray-700">
                                                {item.content.he}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Data Retention */}
                            <section>
                                <div className="section-title">
                                    <h2>{t('privacy.sections.dataRetention.title')}</h2>
                                    <p>{t('privacy.sections.dataRetention.subtitle')}</p>
                                </div>
                                <p className="text-gray-700 text-lg mb-6">
                                    {t('privacy.sections.dataRetention.content')}
                                </p>
                                <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                    {periods.map((item: {label: {he: string}, desc: {he: string}}, index: number) => (
                                        <li key={index}><strong>{item.label.he}</strong> {item.desc.he}</li>
                                    ))}
                                </ul>
                            </section>

                            {/* Contact Information */}
                            <section>
                                <div className="section-title">
                                    <h2>{t('privacy.sections.contact.title')}</h2>
                                    <p>{t('privacy.sections.contact.subtitle')}</p>
                                </div>
                                <div className="bg-teal-50 border-r-4 border-teal-600 p-8 rounded-2xl">
                                    <div className="space-y-4">
                                        <p className="text-gray-800 text-lg">
                                            <strong>{t('privacy.sections.contact.details.manager')}</strong>
                                        </p>
                                        <p className="text-gray-800 text-lg">
                                            <strong>{t('privacy.sections.contact.details.phone')}</strong>
                                        </p>
                                        <p className="text-gray-800 text-lg">
                                            <strong>{t('privacy.sections.contact.details.email')}</strong>
                                        </p>
                                        <p className="text-gray-800 text-lg">
                                            <strong>{t('privacy.sections.contact.details.address')}</strong>
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Legal Compliance */}
                            <section>
                                <div className="section-title">
                                    <h2>{t('privacy.sections.legal.title')}</h2>
                                    <p>{t('privacy.sections.legal.subtitle')}</p>
                                </div>
                                <p className="text-gray-700 text-lg mb-6">
                                    {t('privacy.sections.legal.content')}
                                </p>
                                <ul className="list-disc list-inside text-gray-700 space-y-3 text-lg">
                                    {laws.map((item: {he: string}, index: number) => (
                                        <li key={index}><strong>{item.he}</strong></li>
                                    ))}
                                </ul>
                            </section>

                            {/* Updates */}
                            <section>
                                <div className="section-title">
                                    <h2>{t('privacy.sections.updates.title')}</h2>
                                    <p>{t('privacy.sections.updates.subtitle')}</p>
                                </div>
                                <p className="text-gray-700 text-lg mb-6">
                                    {t('privacy.sections.updates.content')}
                                </p>
                                <div className="bg-gray-100 p-6 rounded-2xl mt-6">
                                    <p className="text-gray-800 text-lg">
                                        <strong>{t('privacy.sections.updates.lastUpdate')}</strong><br/>
                                        <strong>{t('privacy.sections.updates.nextReview')}</strong>
                                    </p>
                                </div>
                            </section>

                            {/* Questions */}
                            <section>
                                <div className="section-title">
                                    <h2>{t('privacy.sections.questions.title')}</h2>
                                    <p>{t('privacy.sections.questions.subtitle')}</p>
                                </div>
                                <p className="text-gray-700 text-lg">
                                    {t('privacy.sections.questions.content')}
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
