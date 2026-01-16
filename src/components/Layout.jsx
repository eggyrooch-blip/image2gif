import React from 'react';
import { Clapperboard, Globe, MessageSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const Layout = ({ children }) => {
    const { t, language, toggleLanguage } = useLanguage();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans transition-colors duration-200">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
                            <Clapperboard className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            {t('title')}
                        </h1>
                    </div>

                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 text-gray-600 font-medium text-sm transition-colors border border-transparent hover:border-gray-200"
                    >
                        <Globe className="w-4 h-4" />
                        <span>{language === 'en' ? '中文' : 'English'}</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8">
                {children}
            </main>

            <footer className="border-t border-gray-200 py-8 text-center text-gray-500 text-sm bg-white mt-auto">
                <p>{t('footer', { year: new Date().getFullYear() })}</p>
                <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
                    <a
                        href="https://x.com/eggyrooch"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {t('feedback.text')}
                    </a>
                    <span className="text-gray-300">|</span>
                    <div className="relative group">
                        <a
                            href="/donate-qr.jpg"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full transition-colors font-medium"
                        >
                            {t('donate.text')}
                        </a>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
                                <img
                                    src="/donate-qr.jpg"
                                    alt={language === 'zh' ? '赞赏码' : 'Donation QR Code'}
                                    className="w-[300px] h-auto max-w-[90vw] rounded-xl"
                                />
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-white"></div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;

