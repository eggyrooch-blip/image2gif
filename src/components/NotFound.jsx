import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';

export default function NotFound() {
    const { language } = useLanguage();

    return (
        <Layout>
            <div className="min-h-[60vh] flex items-center justify-center px-6">
                <div className="text-center max-w-md">
                    <div className="text-8xl font-black text-gray-200 mb-4">404</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {language === 'zh' ? '页面未找到' : 'Page Not Found'}
                    </h1>
                    <p className="text-gray-600 mb-8">
                        {language === 'zh'
                            ? '抱歉，您访问的页面不存在或已被移动。'
                            : "Sorry, the page you're looking for doesn't exist or has been moved."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            to="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            {language === 'zh' ? '返回首页' : 'Go Home'}
                        </Link>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {language === 'zh' ? '返回上页' : 'Go Back'}
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
