import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, FolderOpen, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../contexts/LanguageContext';
import { isHeicFile, isSupportedImage, processFilesWithHeic } from '../utils/heicConverter';

/**
 * Recursively get files from a directory entry
 * @param {FileSystemDirectoryEntry} entry - Directory entry
 * @returns {Promise<File[]>} - Array of files
 */
const getFilesFromDirectoryEntry = async (entry) => {
    const files = [];
    const reader = entry.createReader();

    // readEntries may not return all entries at once, need to call repeatedly
    const readAllEntries = () => {
        return new Promise((resolve, reject) => {
            const allEntries = [];
            const readBatch = () => {
                reader.readEntries((entries) => {
                    if (entries.length === 0) {
                        resolve(allEntries);
                    } else {
                        allEntries.push(...entries);
                        readBatch();
                    }
                }, reject);
            };
            readBatch();
        });
    };

    const entries = await readAllEntries();

    for (const childEntry of entries) {
        if (childEntry.isFile) {
            const file = await new Promise((resolve) => childEntry.file(resolve));
            if (isSupportedImage(file)) {
                files.push(file);
            }
        } else if (childEntry.isDirectory) {
            const subFiles = await getFilesFromDirectoryEntry(childEntry);
            files.push(...subFiles);
        }
    }

    return files;
};

/**
 * Get file from a file entry
 * @param {FileSystemFileEntry} entry - File entry
 * @returns {Promise<File|null>} - File or null if not supported
 */
const getFileFromEntry = async (entry) => {
    return new Promise((resolve) => {
        entry.file((file) => {
            if (isSupportedImage(file)) {
                resolve(file);
            } else {
                resolve(null);
            }
        }, () => resolve(null));
    });
};

/**
 * Process dropped items (files and folders)
 * @param {DataTransferItemList} items - Dropped items
 * @returns {Promise<{files: File[], folderCount: number, ignoredCount: number}>}
 */
const processDroppedItems = async (items) => {
    const files = [];
    let folderCount = 0;
    let ignoredCount = 0;

    const itemsArray = Array.from(items);

    for (const item of itemsArray) {
        const entry = item.webkitGetAsEntry?.();

        if (entry) {
            if (entry.isDirectory) {
                folderCount++;
                const dirFiles = await getFilesFromDirectoryEntry(entry);
                files.push(...dirFiles);
            } else if (entry.isFile) {
                const file = await getFileFromEntry(entry);
                if (file) {
                    files.push(file);
                } else {
                    ignoredCount++;
                }
            }
        } else {
            // Fallback for browsers without webkitGetAsEntry
            const file = item.getAsFile?.();
            if (file && isSupportedImage(file)) {
                files.push(file);
            } else if (file) {
                ignoredCount++;
            }
        }
    }

    return { files, folderCount, ignoredCount };
};

/**
 * Sort files by filename using natural sort (img_1, img_2, img_10)
 * @param {File[]} files - Files to sort
 * @returns {File[]} - Sorted files
 */
const sortFilesByName = (files) => {
    return [...files].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
};

const DragDropZone = ({ onFilesSelected, onStatusMessage, className }) => {
    const { t } = useLanguage();
    const [isDragActive, setIsDragActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState('');

    const processAndSelectFiles = useCallback(async (rawFiles, folderCount = 0, ignoredCount = 0) => {
        if (rawFiles.length === 0) {
            onStatusMessage?.({ type: 'warning', message: 'No supported image files found' });
            return;
        }

        setIsProcessing(true);

        try {
            // Check for HEIC files
            const heicFiles = rawFiles.filter(isHeicFile);
            let processedFiles = rawFiles;

            if (heicFiles.length > 0) {
                setProcessingStatus(t('heic.converting'));
                onStatusMessage?.({ type: 'info', message: t('heic.detected') });

                const result = await processFilesWithHeic(rawFiles, (current, total) => {
                    setProcessingStatus(`Converting ${current}/${total}...`);
                });

                processedFiles = result.files;

                if (result.heicCount > 0) {
                    onStatusMessage?.({
                        type: 'success',
                        message: t('heic.converted', { count: result.heicCount })
                    });
                }

                if (result.errors.length > 0) {
                    onStatusMessage?.({
                        type: 'error',
                        message: t('heic.partialError')
                    });
                }
            }

            // Sort files by name
            const sortedFiles = sortFilesByName(processedFiles);

            // Report folder import status
            if (folderCount > 0) {
                onStatusMessage?.({
                    type: 'success',
                    message: t('folder.imported', { count: sortedFiles.length })
                });
            }

            if (ignoredCount > 0) {
                onStatusMessage?.({
                    type: 'info',
                    message: t('folder.ignored', { count: ignoredCount })
                });
            }

            // Send to parent
            onFilesSelected(sortedFiles);

        } catch (error) {
            console.error('Error processing files:', error);
            onStatusMessage?.({
                type: 'error',
                message: error.message || 'Failed to process files'
            });
        } finally {
            setIsProcessing(false);
            setProcessingStatus('');
        }
    }, [onFilesSelected, onStatusMessage, t]);

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

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragActive(false);

        // Try to process as items (supports folders)
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            const { files, folderCount, ignoredCount } = await processDroppedItems(e.dataTransfer.items);
            await processAndSelectFiles(files, folderCount, ignoredCount);
        } else {
            // Fallback to files only
            const files = Array.from(e.dataTransfer.files).filter(isSupportedImage);
            await processAndSelectFiles(files);
        }
    }, [processAndSelectFiles]);

    const handleFileInput = useCallback(async (e) => {
        const files = Array.from(e.target.files).filter(isSupportedImage);
        await processAndSelectFiles(files);
        // Reset input so same file can be selected again
        e.target.value = '';
    }, [processAndSelectFiles]);

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={twMerge(
                clsx(
                    "relative group border-2 border-dashed rounded-xl p-10 transition-all duration-300 ease-in-out cursor-pointer",
                    "flex flex-col items-center justify-center gap-4",
                    isProcessing && "pointer-events-none",
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
                accept="image/*,.heic,.heif"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
            />

            <div className={clsx(
                "p-4 rounded-full transition-colors shadow-sm",
                isProcessing
                    ? "bg-blue-500 text-white"
                    : isDragActive
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-500 group-hover:bg-blue-500 group-hover:text-white"
            )}>
                {isProcessing ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                ) : isDragActive ? (
                    <FolderOpen className="w-8 h-8" />
                ) : (
                    <ImageIcon className="w-8 h-8" />
                )}
            </div>

            <div className="text-center space-y-1">
                {isProcessing ? (
                    <>
                        <h3 className="text-lg font-semibold text-blue-600">
                            {processingStatus || 'Processing...'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            Please wait...
                        </p>
                    </>
                ) : (
                    <>
                        <h3 className="text-lg font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">
                            {t('dragDrop.title')}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {t('dragDrop.support')} + HEIC
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                            {t('dragDrop.tip')}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                            Drop folders to import entire directories
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default DragDropZone;
