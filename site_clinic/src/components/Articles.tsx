import { motion } from 'framer-motion';
import { ArrowLeft, Stethoscope, Baby, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import useTranslation from '../hooks/useTranslation';
import { articlesContent } from '../translations/articles';

const Articles = () => {
    const { t } = useTranslation();
    const articlesData = articlesContent.data.map(article => ({
        ...article,
        title: article.title.he,
        excerpt: article.excerpt.he,
        category: article.category.he,
        content: article.content.he
    }));
    
    // Icon mapping
    const iconMap = {
        'scans-info': Stethoscope,
        'amniocentesis': Heart,
        'pregnancy-age': Baby
    };
    return (
        <section id="articles">
            <div className="section-title">
                <h2>{t('sections.articles.title')}</h2>
                <p>{t('sections.articles.subtitle')}</p>
            </div>

            <div className="grid gap-4">
                {articlesData.map((article: any, index: number) => {
                    const Icon = iconMap[article.id as keyof typeof iconMap];
                    return (
                        <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ x: -10 }}
                            className="section-row-card cursor-pointer block"
                        >
                            <Link to={`/articles/${article.id}`} className="article-card-link">
                                {/* Icon Illustration */}
                                <div className="shrink-0 w-16 h-16 rounded-2xl bg-secondary-teal/10 flex items-center justify-center">
                                    <Icon className="w-8 h-8 text-secondary-teal" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="text-xs font-bold text-secondary-teal uppercase tracking-wider">
                                            {article.category}
                                        </span>
                                    </div>
                                    <h3 className="font-extrabold text-2xl mb-2 text-primary-navy">{article.title}</h3>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{article.excerpt}</p>
                                </div>

                                {/* Arrow indicator */}
                                <div className="shrink-0">
                                    <ArrowLeft className="w-6 h-6 text-secondary-teal" />
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};

export default Articles;
