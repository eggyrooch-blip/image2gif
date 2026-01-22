import React, { useCallback, useState } from 'react';
import { Upload, Video } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../contexts/LanguageContext';

const ACCEPTED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',  // MOV
    'video/x-matroska', // MKV
    'video/x-msvideo',  // AVI
    'video/x-flv'       // FLV
];

const MAX_SIZE_WARNING_MB = 200;

const VideoDropZone = ({ onVideoSelected, className, disabled, accept }) => {
    const { t } = useLanguage();
    const [isDragActive, setIsDragActive] = useState(false);

    const isValidVideo = (file) => {
        if (!accept) {
            return ACCEPTED_VIDEO_TYPES.includes(file.type) ||
                file.name.match(/\.(mp4|webm|mov|mkv|avi|flv)$/i);
        }

        // Check MIME type
        const mimes = Object.keys(accept);
        if (mimes.includes(file.type)) return true;

        // Check extensions
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        for (const mime of mimes) {
            if (accept[mime].includes(extension)) return true;
        }
        return false;
    };

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (!disabled) setIsDragActive(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragActive(false);
        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        const videoFile = files.find(isValidVideo);

        if (videoFile) {
            onVideoSelected(videoFile);
        }
    }, [onVideoSelected, disabled]);

    const handleFileInput = useCallback((e) => {
        if (disabled) return;
        const files = Array.from(e.target.files);
        const videoFile = files.find(isValidVideo);
        if (videoFile) {
            onVideoSelected(videoFile);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }, [onVideoSelected, disabled]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={twMerge(
                clsx(
                    "relative group border-2 border-dashed rounded-xl p-10 transition-all duration-300 ease-in-out",
                    "flex flex-col items-center justify-center gap-4",
                    disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer",
                    isDragActive
                        ? "border-blue-500 bg-blue-50 scale-[1.01]"
                        : "border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50 hover:shadow-sm",
                    className
                )
            )}
        >
            <input
                type="file"
                accept={accept ? Object.keys(accept).join(',') + ',' + Object.values(accept).flat().join(',') : "video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo,.mp4,.webm,.mov,.mkv,.avi,.flv"}
                onChange={handleFileInput}
                disabled={disabled}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />

            <div className={clsx(
                "p-4 rounded-full transition-colors shadow-sm",
                isDragActive
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-500 group-hover:bg-blue-500 group-hover:text-white"
            )}>
                {isDragActive ? <Upload className="w-8 h-8" /> : <Video className="w-8 h-8" />}
            </div>

            <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                    {t('dragDropVideo.title')}
                </h3>
                <p className="text-sm text-gray-400">
                    {t('dragDropVideo.support')}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    {t('dragDropVideo.tip')}
                </p>
            </div>

            {/* FFmpeg loading notice */}
            <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-600 flex items-center gap-2">
                <span className="text-blue-500">i</span>
                <span>{t('video.ffmpegNotice')}</span>
            </div>
        </div>
    );
};

export default VideoDropZone;
