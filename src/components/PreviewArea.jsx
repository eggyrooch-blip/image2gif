import React from 'react';
import { Download, Film, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ShareButtons from './ShareButtons';

const PreviewArea = ({ gifUrl, onDownload }) => {
    const { t } = useLanguage();

    if (!gifUrl) {
        return (
            <div className="border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-xl p-12 text-center h-[300px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                    <Film className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-400">{t('preview.placeholder')}</h3>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-2">
                <div className="relative rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center min-h-[200px]"
                    style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    <img
                        src={gifUrl}
                        alt="Generated GIF"
                        className="max-w-full h-auto object-contain max-h-[600px] relative z-10 shadow-sm"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onDownload}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Download className="w-4 h-4" />
                    {t('buttons.download')}
                </button>
            </div>

            {/* Social Sharing */}
            <ShareButtons />
        </div>
    );
};

export default PreviewArea;

