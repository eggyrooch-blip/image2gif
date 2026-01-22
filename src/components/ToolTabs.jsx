import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Image as ImageIcon, Video, Crop, Square, Type, Minimize2 } from 'lucide-react';
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
            label: isZh ? '图片转 GIF' : 'Image to GIF',
        },
        {
            path: '/video-to-gif',
            icon: Video,
            label: isZh ? '视频转 GIF' : 'Video to GIF',
        },
        {
            path: '/image-to-mp4',
            icon: Video,
            label: isZh ? '图片转 MP4' : 'Image to MP4',
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
            path: '/add-text-to-gif',
            icon: Type,
            label: isZh ? '添加文字' : 'Add Text',
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
