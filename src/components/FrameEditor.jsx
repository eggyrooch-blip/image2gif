import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, RotateCw, RotateCcw, Crop, Check, ChevronLeft, ChevronRight, Undo2, Copy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * FrameEditor - Full-screen modal for per-frame crop and rotate editing
 * Uses Canvas API for all image processing (no external dependencies)
 */
const FrameEditor = ({
    images,
    initialIndex = 0,
    onClose,
    onUpdate
}) => {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [mode, setMode] = useState('view'); // 'view' | 'crop'
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [cropStart, setCropStart] = useState(null);
    const [cropEnd, setCropEnd] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [originalImage, setOriginalImage] = useState(null);
    const [isApplyingAll, setIsApplyingAll] = useState(false);

    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    const currentImage = images[currentIndex];

    // Load image when frame changes
    useEffect(() => {
        if (!currentImage) return;

        setImageLoaded(false);
        setRotation(0);
        setCropStart(null);
        setCropEnd(null);
        setMode('view');

        const img = new Image();
        img.onload = () => {
            imageRef.current = img;
            setOriginalImage(img);
            setImageLoaded(true);
        };
        img.src = currentImage.preview;

        return () => {
            img.onload = null;
        };
    }, [currentImage]);

    // Draw image on canvas
    useEffect(() => {
        if (!imageLoaded || !canvasRef.current || !imageRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = imageRef.current;
        const container = containerRef.current;

        if (!container) return;

        // Calculate canvas size to fit container while maintaining aspect ratio
        const containerRect = container.getBoundingClientRect();
        const maxWidth = containerRect.width - 48;
        const maxHeight = containerRect.height - 48;

        // Account for rotation
        const isRotated = rotation === 90 || rotation === 270;
        const imgWidth = isRotated ? img.height : img.width;
        const imgHeight = isRotated ? img.width : img.height;

        const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);
        const displayWidth = Math.floor(imgWidth * scale);
        const displayHeight = Math.floor(imgHeight * scale);

        canvas.width = displayWidth;
        canvas.height = displayHeight;

        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // Apply rotation
        ctx.save();
        ctx.translate(displayWidth / 2, displayHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        const drawWidth = isRotated ? displayHeight : displayWidth;
        const drawHeight = isRotated ? displayWidth : displayHeight;

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();

        // Draw crop overlay if in crop mode
        if (mode === 'crop' && cropStart && cropEnd) {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, displayWidth, displayHeight);

            const x = Math.min(cropStart.x, cropEnd.x);
            const y = Math.min(cropStart.y, cropEnd.y);
            const w = Math.abs(cropEnd.x - cropStart.x);
            const h = Math.abs(cropEnd.y - cropStart.y);

            // Clear the crop area
            ctx.clearRect(x, y, w, h);

            // Redraw the image in the crop area
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();

            ctx.translate(displayWidth / 2, displayHeight / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            ctx.restore();

            // Draw crop border
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, w, h);

            // Draw corner handles
            ctx.fillStyle = '#3b82f6';
            const handleSize = 8;
            ctx.fillRect(x - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(x + w - handleSize / 2, y - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(x - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(x + w - handleSize / 2, y + h - handleSize / 2, handleSize, handleSize);

            ctx.restore();
        }
    }, [imageLoaded, rotation, mode, cropStart, cropEnd]);

    // Handle mouse events for cropping
    const handleMouseDown = useCallback((e) => {
        if (mode !== 'crop') return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCropStart({ x, y });
        setCropEnd({ x, y });
        setIsDragging(true);
    }, [mode]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging || mode !== 'crop') return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, canvas.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, canvas.height));

        setCropEnd({ x, y });
    }, [isDragging, mode]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Rotate functions
    const rotateLeft = () => {
        setRotation((prev) => (prev - 90 + 360) % 360);
    };

    const rotateRight = () => {
        setRotation((prev) => (prev + 90) % 360);
    };

    /**
     * Helper: Draw image with rotation at specific offset
     * Handles all 4 rotation cases (0°, 90°, 180°, 270°)
     */
    const drawRotatedImage = (ctx, img, rotation, srcX, srcY, cx, cy) => {
        const offsets = {
            0: [-srcX - cx, -srcY - cy],
            90: [-srcY - cy, srcX + cx - img.width],
            180: [srcX + cx - img.width, srcY + cy - img.height],
            270: [srcY + cy - img.height, -srcX - cx]
        };
        const [dx, dy] = offsets[rotation] || offsets[0];
        ctx.drawImage(img, dx, dy);
    };

    // Apply crop
    const applyCrop = async () => {
        if (!cropStart || !cropEnd || !imageRef.current) return;

        const canvas = canvasRef.current;
        const img = imageRef.current;

        // Get crop coordinates
        const x = Math.min(cropStart.x, cropEnd.x);
        const y = Math.min(cropStart.y, cropEnd.y);
        const w = Math.abs(cropEnd.x - cropStart.x);
        const h = Math.abs(cropEnd.y - cropStart.y);

        if (w < 10 || h < 10) {
            setCropStart(null);
            setCropEnd(null);
            setMode('view');
            return;
        }

        // Calculate scale from display to original
        const isRotated = rotation === 90 || rotation === 270;
        const origWidth = isRotated ? img.height : img.width;
        const origHeight = isRotated ? img.width : img.height;
        const scaleX = origWidth / canvas.width;
        const scaleY = origHeight / canvas.height;

        // Create output canvas with cropped size
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = Math.round(w * scaleX);
        outputCanvas.height = Math.round(h * scaleY);
        const ctx = outputCanvas.getContext('2d');

        // Draw rotated and cropped image
        ctx.save();
        const cx = outputCanvas.width / 2;
        const cy = outputCanvas.height / 2;

        ctx.translate(cx, cy);
        ctx.rotate((rotation * Math.PI) / 180);

        // Calculate source offset and draw
        const srcX = x * scaleX;
        const srcY = y * scaleY;
        drawRotatedImage(ctx, img, rotation, srcX, srcY, cx, cy);

        ctx.restore();

        // Convert to blob and update
        outputCanvas.toBlob(async (blob) => {
            if (blob) {
                const newFile = new File([blob], currentImage.file.name, { type: 'image/png' });
                onUpdate(currentImage.id, newFile);
            }
            setCropStart(null);
            setCropEnd(null);
            setMode('view');
        }, 'image/png');
    };

    // Apply crop to all frames
    const applyToAllFrames = async () => {
        if (!cropStart || !cropEnd || !canvasRef.current) return;

        const confirmed = window.confirm(
            `Apply this crop to all ${images.length} frames?`
        );
        if (!confirmed) return;

        setIsApplyingAll(true);

        const canvas = canvasRef.current;

        // Calculate relative crop coordinates (0-1 range)
        const x = Math.min(cropStart.x, cropEnd.x);
        const y = Math.min(cropStart.y, cropEnd.y);
        const w = Math.abs(cropEnd.x - cropStart.x);
        const h = Math.abs(cropEnd.y - cropStart.y);

        const relCrop = {
            x: x / canvas.width,
            y: y / canvas.height,
            w: w / canvas.width,
            h: h / canvas.height
        };

        // Process each image
        for (const img of images) {
            try {
                // Load the image
                const imgElement = await new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = reject;
                    image.src = img.preview;
                });

                // Calculate actual crop dimensions for this image
                const cropX = Math.round(imgElement.width * relCrop.x);
                const cropY = Math.round(imgElement.height * relCrop.y);
                const cropW = Math.round(imgElement.width * relCrop.w);
                const cropH = Math.round(imgElement.height * relCrop.h);

                // Skip if crop is too small
                if (cropW < 10 || cropH < 10) continue;

                // Create output canvas
                const outputCanvas = document.createElement('canvas');
                outputCanvas.width = cropW;
                outputCanvas.height = cropH;
                const ctx = outputCanvas.getContext('2d');

                // Draw cropped region
                ctx.drawImage(
                    imgElement,
                    cropX, cropY, cropW, cropH,
                    0, 0, cropW, cropH
                );

                // Convert to blob
                const blob = await new Promise(resolve =>
                    outputCanvas.toBlob(resolve, 'image/png')
                );

                if (blob) {
                    const newFile = new File([blob], img.file.name, { type: 'image/png' });
                    onUpdate(img.id, newFile);
                }
            } catch (e) {
                console.error('Error cropping image:', img.id, e);
            }
        }

        setIsApplyingAll(false);
        setCropStart(null);
        setCropEnd(null);
        setMode('view');
    };

    // Apply rotation only
    const applyRotation = async () => {
        if (rotation === 0 || !imageRef.current) return;

        const img = imageRef.current;
        const isRotated = rotation === 90 || rotation === 270;

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = isRotated ? img.height : img.width;
        outputCanvas.height = isRotated ? img.width : img.height;
        const ctx = outputCanvas.getContext('2d');

        ctx.translate(outputCanvas.width / 2, outputCanvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        outputCanvas.toBlob(async (blob) => {
            if (blob) {
                const newFile = new File([blob], currentImage.file.name, { type: 'image/png' });
                onUpdate(currentImage.id, newFile);
            }
            setRotation(0);
        }, 'image/png');
    };

    // Reset current edits
    const resetEdits = () => {
        setRotation(0);
        setCropStart(null);
        setCropEnd(null);
        setMode('view');
    };

    // Navigation - wrapped in useCallback for stable references
    const goToPrev = useCallback(() => {
        setCurrentIndex(prev => prev > 0 ? prev - 1 : prev);
    }, []);

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : prev);
    }, [images.length]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft') {
                goToPrev();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, goToPrev, goToNext]);

    if (!currentImage) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900/80 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <h2 className="text-white font-semibold text-lg">
                        {t('frameEditor.title')} - {currentIndex + 1}/{images.length}
                    </h2>
                    <span className="text-gray-400 text-sm truncate max-w-xs">
                        {currentImage.file.name}
                    </span>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Canvas Area */}
            <div
                ref={containerRef}
                className="flex-1 flex items-center justify-center p-6 overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {imageLoaded ? (
                    <canvas
                        ref={canvasRef}
                        className={`max-w-full max-h-full shadow-2xl rounded-lg ${mode === 'crop' ? 'cursor-crosshair' : 'cursor-default'
                            }`}
                    />
                ) : (
                    <div className="text-gray-400 animate-pulse">Loading...</div>
                )}
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 bg-gray-900/80 border-t border-gray-800">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                    {/* Left: Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPrev}
                            disabled={currentIndex === 0}
                            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={goToNext}
                            disabled={currentIndex === images.length - 1}
                            className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Center: Edit Tools */}
                    <div className="flex items-center gap-2">
                        {/* Rotate buttons */}
                        <button
                            onClick={rotateLeft}
                            className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="text-sm hidden sm:inline">{t('frameEditor.rotateLeft')}</span>
                        </button>
                        <button
                            onClick={rotateRight}
                            className="flex items-center gap-2 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <RotateCw className="w-4 h-4" />
                            <span className="text-sm hidden sm:inline">{t('frameEditor.rotateRight')}</span>
                        </button>

                        <div className="w-px h-6 bg-gray-700 mx-2" />

                        {/* Crop mode toggle */}
                        <button
                            onClick={() => setMode(mode === 'crop' ? 'view' : 'crop')}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${mode === 'crop'
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <Crop className="w-4 h-4" />
                            <span className="text-sm hidden sm:inline">{t('frameEditor.crop')}</span>
                        </button>

                        {/* Reset button */}
                        {(rotation !== 0 || cropStart) && (
                            <button
                                onClick={resetEdits}
                                className="flex items-center gap-2 px-4 py-2.5 text-amber-400 hover:text-amber-300 hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <Undo2 className="w-4 h-4" />
                                <span className="text-sm hidden sm:inline">{t('frameEditor.reset')}</span>
                            </button>
                        )}
                    </div>

                    {/* Right: Apply */}
                    <div className="flex items-center gap-2">
                        {mode === 'crop' && cropStart && cropEnd && (
                            <>
                                <button
                                    onClick={applyCrop}
                                    disabled={isApplyingAll}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                                >
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm">{t('frameEditor.applyCrop')}</span>
                                </button>
                                {images.length > 1 && (
                                    <button
                                        onClick={applyToAllFrames}
                                        disabled={isApplyingAll}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                                        title={`Apply to all ${images.length} frames`}
                                    >
                                        {isApplyingAll ? (
                                            <span className="animate-spin">⏳</span>
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                        <span className="text-sm hidden sm:inline">
                                            {isApplyingAll ? 'Processing...' : `All (${images.length})`}
                                        </span>
                                    </button>
                                )}
                            </>
                        )}
                        {rotation !== 0 && mode !== 'crop' && (
                            <button
                                onClick={applyRotation}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                            >
                                <Check className="w-4 h-4" />
                                <span className="text-sm">{t('frameEditor.applyRotation')}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="px-6 py-3 bg-gray-950 border-t border-gray-800 overflow-x-auto">
                <div className="flex items-center gap-2 justify-center min-w-max">
                    {images.map((img, idx) => (
                        <button
                            key={img.id}
                            onClick={() => setCurrentIndex(idx)}
                            className={`relative w-16 h-12 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${idx === currentIndex
                                ? 'border-blue-500 ring-2 ring-blue-500/30'
                                : 'border-gray-700 hover:border-gray-500'
                                }`}
                        >
                            <img
                                src={img.preview}
                                alt={`Frame ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                                {idx + 1}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FrameEditor;
