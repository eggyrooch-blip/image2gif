import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../contexts/LanguageContext';

const DragDropZone = ({ onFilesSelected, className }) => {
    const { t } = useLanguage();
    const [isDragActive, setIsDragActive] = useState(false);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragActive(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        // Prevent flickering when dragging over child elements
        if (e.currentTarget.contains(e.relatedTarget)) return;
        setIsDragActive(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragActive(false);

        const files = Array.from(e.dataTransfer.files).filter(file =>
            file.type.startsWith('image/')
        );

        if (files.length > 0) {
            onFilesSelected(files);
        }
    }, [onFilesSelected]);

    const handleFileInput = useCallback((e) => {
        const files = Array.from(e.target.files).filter(file =>
            file.type.startsWith('image/')
        );
        if (files.length > 0) {
            onFilesSelected(files);
        }
    }, [onFilesSelected]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={twMerge(
                clsx(
                    "relative group border-2 border-dashed rounded-xl p-10 transition-all duration-300 ease-in-out cursor-pointer",
                    "flex flex-col items-center justify-center gap-4",
                    isDragActive
                        ? "border-blue-500 bg-blue-50 scale-[1.01]"
                        : "border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50 hover:shadow-sm",
                    className
                )
            )}
        >
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className={clsx(
                "p-4 rounded-full transition-colors shadow-sm",
                isDragActive ? "bg-blue-500 text-white shadow-md" : "bg-gray-100 text-gray-500 group-hover:bg-blue-500 group-hover:text-white"
            )}>
                {isDragActive ? <Upload className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
            </div>

            <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                    {t('dragDrop.title')}
                </h3>
                <p className="text-sm text-gray-400">
                    {t('dragDrop.support')}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    {t('dragDrop.tip')}
                </p>
            </div>
        </div>
    );
};

export default DragDropZone;
