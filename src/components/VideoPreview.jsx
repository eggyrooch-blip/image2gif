import React from 'react';
import { X, Film, Clock, Maximize2, HardDrive, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime } from '../utils/videoHelper';

const VideoPreview = ({
    file,
    metadata,
    thumbnailUrl,
    onRemove,
    isLoading
}) => {
    const { t } = useLanguage();

    const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : 0;
    const isLargeFile = fileSizeMB > 200;

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-center gap-3 py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    <span className="text-gray-600">{t('video.analyzing')}</span>
                </div>
            </div>
        );
    }

    if (!file) return null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-4 p-4">
                {/* Thumbnail */}
                <div className="relative w-full sm:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Film className="w-12 h-12 text-gray-300" />
                        </div>
                    )}
                    {/* Play icon overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[7px] border-y-transparent ml-1" />
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900 truncate max-w-[200px]">
                                {file.name}
                            </h4>
                            {isLargeFile && (
                                <p className="text-xs text-amber-600 mt-1">
                                    {t('video.sizeWarning')}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={onRemove}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('buttons.remove')}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{t('video.duration')}:</span>
                            <span className="font-medium text-gray-900">
                                {metadata?.duration ? formatTime(metadata.duration) : '--:--'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                            <Maximize2 className="w-4 h-4 text-gray-400" />
                            <span>{t('video.resolution')}:</span>
                            <span className="font-medium text-gray-900">
                                {metadata?.width && metadata?.height
                                    ? `${metadata.width}x${metadata.height}`
                                    : '--'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                            <HardDrive className="w-4 h-4 text-gray-400" />
                            <span>{t('video.fileSize')}:</span>
                            <span className="font-medium text-gray-900">
                                {fileSizeMB} MB
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                            <Film className="w-4 h-4 text-gray-400" />
                            <span>{t('video.format')}:</span>
                            <span className="font-medium text-gray-900 uppercase">
                                {file.name.split('.').pop()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPreview;
