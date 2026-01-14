import React from 'react';
import { Image as ImageIcon, Video } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';

const InputModeTabs = ({ mode, onChange, disabled }) => {
    const { t } = useLanguage();

    const tabs = [
        { id: 'images', icon: ImageIcon, label: t('video.tabImages') },
        { id: 'video', icon: Video, label: t('video.tabVideo') }
    ];

    return (
        <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 rounded-xl p-1.5 gap-1">
                {tabs.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => !disabled && onChange(id)}
                        disabled={disabled}
                        className={clsx(
                            "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200",
                            mode === id
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default InputModeTabs;
