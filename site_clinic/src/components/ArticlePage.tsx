import { ArrowRight, Clock, User } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { ARTICLES_DATA } from './Articles';
import ContactForm from './ContactForm';

const ArticlePage = () => {
    const { id } = useParams();
    const article = ARTICLES_DATA.find(a => a.id === id);

    if (!article) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-black text-primary-navy mb-4">מאמר לא נמצא</h2>
                    <Link to="/" className="btn-primary !w-auto !px-8">
                        חזרה לעמוד הבית
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header for article page */}
            <div className="bg-slate-50 border-b border-slate-100 py-12">
                <div className="page-wrapper px-6">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-slate-500 hover:text-secondary-teal transition-colors mb-8 font-bold w-fit"
                    >
                        <ArrowRight className="w-5 h-5" />
                        <span>חזרה לעמוד הבית</span>
                    </Link>

                    <div className="badge !mb-4">{article.category}</div>
                    <h1 className="text-4xl md:text-6xl font-black text-primary-navy leading-tight max-w-4xl">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap gap-8 mt-8 text-slate-400 font-medium">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>ד"ר יובל עוז</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>5 דקות קריאה</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-wrapper px-6 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="prose prose-lg prose-slate max-w-none">
                            {article.content.map((paragraph, i) => (
                                <p key={i} className="text-xl text-slate-600 leading-relaxed font-medium">
                                    {paragraph}
                                </p>
                            ))}
                        </div>

                        <div className="bg-secondary-teal/5 border border-secondary-teal/10 rounded-[40px] p-10 mt-20">
                            <h3 className="text-2xl font-black text-primary-navy mb-4">לסיכום</h3>
                            <p className="text-slate-600 font-medium leading-relaxed">
                                חשוב לזכור שכל מקרה הוא אינדיבידואלי. המידע הניתן כאן הוא כללי, ובכל שאלה ספציפית מומלץ להתייעץ עם הרופא המטפל או לקבוע פגישת ייעוץ מסודרת.
                            </p>
                        </div>
                    </div>

                    {/* Sidebar with dynamic Contact Form */}
                    <aside>
                        <div className="sticky top-32">
                            <div className="text-center mb-10">
                                <h4 className="text-2xl font-black text-primary-navy">זקוקה לייעוץ נוסף?</h4>
                                <p className="text-slate-500 font-medium mt-2">ד"ר עוז כאן לכל שאלה</p>
                            </div>
                            <ContactForm id="article-contact" showTitle={false} />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default ArticlePage;
