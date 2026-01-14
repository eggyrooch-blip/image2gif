import React, { useState } from 'react';
import { Twitter, MessageCircle, Link2, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ShareButtons = () => {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);

    const siteUrl = 'https://plotlake.com';

    const shareTextEn = "I just turned my images into a high-quality GIF with this free tool! Custom delays, professional settings, no server upload needed. Try it out:";
    const shareTextZh = "我刚用这个免费工具把图片转成了高质量GIF！支持自定义延迟和专业参数，无需上传服务器，推荐试试：";

    const handleTwitterShare = () => {
        const text = encodeURIComponent(`${shareTextEn} ${siteUrl} #GIFMaker #WebTool`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank', 'noopener,noreferrer');
    };

    const handleWhatsAppShare = () => {
        const text = encodeURIComponent(`${shareTextEn} ${siteUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(siteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                {t('share.title')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
                {/* Twitter/X Share */}
                <button
                    onClick={handleTwitterShare}
                    className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                    <Twitter className="w-4 h-4" />
                    <span>{t('share.twitter')}</span>
                </button>

                {/* WhatsApp Share */}
                <button
                    onClick={handleWhatsAppShare}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t('share.whatsapp')}</span>
                </button>

                {/* Copy Link */}
                <button
                    onClick={handleCopyLink}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 ${copied
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                        }`}
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4" />
                            <span>{t('share.copied')}</span>
                        </>
                    ) : (
                        <>
                            <Link2 className="w-4 h-4" />
                            <span>{t('share.copyLink')}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ShareButtons;
