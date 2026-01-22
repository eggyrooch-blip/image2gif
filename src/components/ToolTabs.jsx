import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Image as ImageIcon, Video, Crop, Square, Minimize2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Shared top-level tool tabs for quick switching between major tools.
 * Keeps visual style aligned with InputModeTabs.
 */
const ToolTabs = () => {
    const { pathname } = useLocation();
    const { language } = useLanguage();
    const isZh = language === 'zh';

    const tabs = [
        {
            path: '/',
            icon: ImageIcon,
            label: isZh ? '图片转 GIF/MP4' : 'Image to GIF/MP4',
        },
        {
            path: '/video-to-gif',
            icon: Video,
            label: isZh ? '视频转 GIF' : 'Video to GIF',
        },
        {
            path: '/crop-gif',
            icon: Crop,
            label: isZh ? '裁剪 GIF' : 'Crop GIF',
        },
        {
            path: '/gif-canvas',
            icon: Square,
            label: isZh ? '画布' : 'Canvas',
        },
        {
            path: '/compress-mp4',
            icon: Minimize2,
            label: isZh ? '压缩' : 'Compress',
        },
    ];

    return (
        <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 rounded-xl p-1.5 gap-1">
                {tabs.map(({ path, icon: Icon, label }) => {
                    const active = pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            className={clsx(
                                "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                                active
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default ToolTabs;
