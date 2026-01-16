import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, Crop, RotateCcw, Check } from 'lucide-react';
import { fetchFile } from '@ffmpeg/util';
import Layout from './Layout';
import ToolTabs from './ToolTabs';
import TrustSection from './TrustSection';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { useLanguage } from '../contexts/LanguageContext';
import { formatBytes } from '../utils/formatUtils';

const aspectRatios = [
    { id: 'free', label: 'Free', labelZh: '自由', ratio: null },
    { id: '1:1', label: '1:1', labelZh: '1:1', ratio: 1 },
    { id: '4:3', label: '4:3', labelZh: '4:3', ratio: 4 / 3 },
    { id: '16:9', label: '16:9', labelZh: '16:9', ratio: 16 / 9 },
    { id: '9:16', label: '9:16', labelZh: '9:16', ratio: 9 / 16 },
];

const outputFormats = [
    { id: 'gif', label: 'GIF', mime: 'image/gif' },
    { id: 'webp', label: 'WebP', mime: 'image/webp' },
    { id: 'mp4', label: 'MP4', mime: 'video/mp4' },
];

const phaseProgress = {
    idle: 0,
    loading_engine: 10,
    processing: 50,
    encoding: 80,
    finalizing: 95,
    success: 100,
    error: 100,
};

const CropGifPage = () => {
    const { ffmpeg, loaded, load, isLoading } = useFFmpeg();
    const { language } = useLanguage();
    const isZh = language === 'zh';

    const copy = {
        en: {
            title: 'Crop GIF Online',
            sub: 'Crop animated GIFs, WebP, APNG, or videos locally. No upload, no watermark.',
            uploadTitle: 'Upload your file',
            uploadHint: 'Drag & drop or click to select GIF, WebP, APNG, or MP4',
            aspectRatio: 'Aspect Ratio',
            outputFormat: 'Output Format',
            cropArea: 'Crop Area',
            crop: 'Crop',
            reset: 'Reset',
            processing: 'Processing...',
            result: 'Result',
            success: 'Done',
            download: 'Download',
            another: 'Crop another',
            continueEdit: 'Continue editing',
            faqTitle: 'FAQ: Crop GIF',
            related: 'Related Tools',
            size: 'Size',
            dimensions: 'Dimensions',
            progress: {
                loading: 'Loading processing engine (~30MB, cached)...',
                processing: 'Cropping frames...',
                encoding: 'Encoding output...',
                final: 'Finalizing...',
            },
            errorHint: 'Processing failed. Try a smaller file or different format.',
        },
        zh: {
            title: '在线裁剪 GIF',
            sub: '本地裁剪动态 GIF、WebP、APNG 或视频，无需上传，无水印。',
            uploadTitle: '上传文件',
            uploadHint: '拖放或点击选择 GIF、WebP、APNG 或 MP4 文件',
            aspectRatio: '宽高比',
            outputFormat: '输出格式',
            cropArea: '裁剪区域',
            crop: '裁剪',
            reset: '重置',
            processing: '处理中...',
            result: '结果',
            success: '完成',
            download: '下载',
            another: '裁剪另一个',
            continueEdit: '继续编辑',
            faqTitle: '常见问题：GIF 裁剪',
            related: '相关工具',
            size: '大小',
            dimensions: '尺寸',
            progress: {
                loading: '正在加载处理引擎（约 30MB，缓存后更快）...',
                processing: '正在裁剪帧...',
                encoding: '正在编码输出...',
                final: '整理输出...',
            },
            errorHint: '处理失败，请尝试更小的文件或其他格式。',
        },
    };
    const c = copy[isZh ? 'zh' : 'en'];

    // State
    const [file, setFile] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [aspectRatio, setAspectRatio] = useState('free');
    const [outputFormat, setOutputFormat] = useState('gif');
    const [cropRegion, setCropRegion] = useState({ x: 0, y: 0, width: 100, height: 100 });
    const [phase, setPhase] = useState('idle');
    const [progressText, setProgressText] = useState('');
    const [error, setError] = useState(null);
    const [output, setOutput] = useState(null);

    const containerRef = useRef(null);
    const outputUrlRef = useRef(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const dragType = useRef(null); // 'move' or 'resize-*'

    // Cleanup on unmount
    useEffect(() => () => {
        if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    // Handle file selection
    const handleFileSelect = useCallback(async (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        // Validate file type by extension (more reliable than MIME type)
        const validExtensions = ['gif', 'webp', 'png', 'apng', 'mp4', 'webm'];
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
        if (!fileExt || !validExtensions.includes(fileExt)) {
            setError(isZh ? '不支持的文件格式' : 'Unsupported file format');
            return;
        }

        // Reset state first
        setFile(selectedFile);
        setFileInfo(null);  // Reset fileInfo to show loading state
        setError(null);
        setOutput(null);

        // Create preview URL
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);

        // Get dimensions based on file type
        const isVideo = selectedFile.type.startsWith('video/') || ['mp4', 'webm'].includes(fileExt);

        if (isVideo) {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                setFileInfo({
                    width: video.videoWidth,
                    height: video.videoHeight,
                    type: selectedFile.type,
                    size: selectedFile.size,
                });
                setCropRegion({ x: 0, y: 0, width: video.videoWidth, height: video.videoHeight });
            };
            video.onerror = () => {
                setError(isZh ? '无法加载视频文件，请检查文件是否损坏' : 'Failed to load video file. Please check if the file is corrupted.');
                setFile(null);
            };
            video.src = url;  // Set src AFTER handlers to avoid race condition
        } else {
            const img = new Image();
            img.onload = () => {
                setFileInfo({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    type: selectedFile.type,
                    size: selectedFile.size,
                });
                setCropRegion({ x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight });
            };
            img.onerror = () => {
                setError(isZh ? '无法加载图片文件，请检查文件是否损坏' : 'Failed to load image file. Please check if the file is corrupted.');
                setFile(null);
            };
            img.src = url;  // Set src AFTER handlers to avoid race condition
        }

        // Auto-detect output format
        if (isVideo) {
            setOutputFormat('mp4');
        } else if (selectedFile.type === 'image/webp' || fileExt === 'webp') {
            setOutputFormat('webp');
        } else {
            setOutputFormat('gif');
        }
    }, [previewUrl, isZh]);

    // Handle drag for crop region
    const handleMouseDown = useCallback((e, type) => {
        e.preventDefault();
        isDragging.current = true;
        dragType.current = type;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            dragStart.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                cropX: cropRegion.x,
                cropY: cropRegion.y,
                cropWidth: cropRegion.width,
                cropHeight: cropRegion.height,
            };
        }
    }, [cropRegion]);

    const handleMouseMove = useCallback((e) => {
        if (!isDragging.current || !containerRef.current || !fileInfo) return;

        const rect = containerRef.current.getBoundingClientRect();
        const scale = Math.min(rect.width / fileInfo.width, rect.height / fileInfo.height);
        const offsetX = (rect.width - fileInfo.width * scale) / 2;
        const offsetY = (rect.height - fileInfo.height * scale) / 2;

        const currentX = (e.clientX - rect.left - offsetX) / scale;
        const currentY = (e.clientY - rect.top - offsetY) / scale;

        const deltaX = currentX - (dragStart.current.x - offsetX) / scale;
        const deltaY = currentY - (dragStart.current.y - offsetY) / scale;

        const selectedRatio = aspectRatios.find(r => r.id === aspectRatio);

        if (dragType.current === 'move') {
            let newX = Math.max(0, Math.min(fileInfo.width - cropRegion.width, dragStart.current.cropX + deltaX));
            let newY = Math.max(0, Math.min(fileInfo.height - cropRegion.height, dragStart.current.cropY + deltaY));
            setCropRegion(prev => ({ ...prev, x: newX, y: newY }));
        } else if (dragType.current?.startsWith('resize')) {
            let newWidth = cropRegion.width;
            let newHeight = cropRegion.height;
            let newX = cropRegion.x;
            let newY = cropRegion.y;

            if (dragType.current.includes('e')) {
                newWidth = Math.max(20, Math.min(fileInfo.width - cropRegion.x, dragStart.current.cropWidth + deltaX));
            }
            if (dragType.current.includes('w')) {
                const delta = dragStart.current.cropX - Math.max(0, dragStart.current.cropX + deltaX);
                newX = Math.max(0, dragStart.current.cropX + deltaX);
                newWidth = Math.max(20, dragStart.current.cropWidth + delta);
            }
            if (dragType.current.includes('s')) {
                newHeight = Math.max(20, Math.min(fileInfo.height - cropRegion.y, dragStart.current.cropHeight + deltaY));
            }
            if (dragType.current.includes('n')) {
                const delta = dragStart.current.cropY - Math.max(0, dragStart.current.cropY + deltaY);
                newY = Math.max(0, dragStart.current.cropY + deltaY);
                newHeight = Math.max(20, dragStart.current.cropHeight + delta);
            }

            // Apply aspect ratio constraint
            if (selectedRatio?.ratio) {
                if (dragType.current.includes('e') || dragType.current.includes('w')) {
                    newHeight = newWidth / selectedRatio.ratio;
                } else {
                    newWidth = newHeight * selectedRatio.ratio;
                }
            }

            // Ensure within bounds
            newWidth = Math.min(newWidth, fileInfo.width - newX);
            newHeight = Math.min(newHeight, fileInfo.height - newY);

            setCropRegion({ x: newX, y: newY, width: newWidth, height: newHeight });
        }
    }, [fileInfo, aspectRatio, cropRegion]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = false;
        dragType.current = null;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    // Apply aspect ratio
    const applyAspectRatio = useCallback((ratioId) => {
        setAspectRatio(ratioId);
        if (!fileInfo) return;

        const selected = aspectRatios.find(r => r.id === ratioId);
        if (!selected?.ratio) return;

        // Calculate new crop region maintaining aspect ratio
        let newWidth = cropRegion.width;
        let newHeight = newWidth / selected.ratio;

        if (newHeight > fileInfo.height) {
            newHeight = fileInfo.height;
            newWidth = newHeight * selected.ratio;
        }
        if (newWidth > fileInfo.width) {
            newWidth = fileInfo.width;
            newHeight = newWidth / selected.ratio;
        }

        const newX = Math.max(0, Math.min(cropRegion.x, fileInfo.width - newWidth));
        const newY = Math.max(0, Math.min(cropRegion.y, fileInfo.height - newHeight));

        setCropRegion({ x: newX, y: newY, width: newWidth, height: newHeight });
    }, [fileInfo, cropRegion]);

    // Reset crop
    const handleReset = useCallback(() => {
        if (fileInfo) {
            setCropRegion({ x: 0, y: 0, width: fileInfo.width, height: fileInfo.height });
            setAspectRatio('free');
        }
    }, [fileInfo]);

    // Process crop
    const processCrop = async () => {
        if (!file || !fileInfo) return;

        setError(null);
        setPhase('loading_engine');
        setProgressText(c.progress.loading);

        try {
            if (!loaded && !isLoading) {
                await load();
            }

            // Double check FFmpeg is ready
            if (!ffmpeg) {
                throw new Error(isZh ? 'FFmpeg 引擎加载失败' : 'FFmpeg engine failed to load');
            }

            setPhase('processing');
            setProgressText(c.progress.processing);

            // Make dimensions even (required by many codecs)
            const cropX = Math.round(cropRegion.x);
            const cropY = Math.round(cropRegion.y);
            let cropW = Math.round(cropRegion.width);
            let cropH = Math.round(cropRegion.height);
            cropW = cropW % 2 === 0 ? cropW : cropW - 1;
            cropH = cropH % 2 === 0 ? cropH : cropH - 1;

            // Ensure minimum dimensions
            if (cropW < 2 || cropH < 2) {
                throw new Error(isZh ? '裁剪区域太小' : 'Crop area is too small');
            }

            // Write input file
            const ext = file.name.split('.').pop()?.toLowerCase() || 'gif';
            const inputName = `input.${ext}`;
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            setPhase('encoding');
            setProgressText(c.progress.encoding);

            let outputName, outputMime;
            const cropFilter = `crop=${cropW}:${cropH}:${cropX}:${cropY}`;

            if (outputFormat === 'gif') {
                outputName = 'output.gif';
                outputMime = 'image/gif';
                // Two-pass GIF encoding for quality
                const paletteResult = await ffmpeg.exec([
                    '-i', inputName,
                    '-vf', `${cropFilter},palettegen=stats_mode=full`,
                    '-y', 'palette.png'
                ]);
                if (paletteResult !== 0) {
                    throw new Error(isZh ? '生成调色板失败' : 'Failed to generate palette');
                }

                const encodeResult = await ffmpeg.exec([
                    '-i', inputName,
                    '-i', 'palette.png',
                    '-filter_complex', `[0:v]${cropFilter}[cropped];[cropped][1:v]paletteuse=dither=bayer:bayer_scale=5`,
                    '-y', outputName
                ]);
                if (encodeResult !== 0) {
                    throw new Error(isZh ? 'GIF 编码失败' : 'GIF encoding failed');
                }

                try { await ffmpeg.deleteFile('palette.png'); } catch { /* ignore cleanup errors */ }
            } else if (outputFormat === 'webp') {
                outputName = 'output.webp';
                outputMime = 'image/webp';
                const result = await ffmpeg.exec([
                    '-i', inputName,
                    '-vf', cropFilter,
                    '-c:v', 'libwebp',
                    '-lossless', '0',
                    '-q:v', '85',
                    '-loop', '0',
                    '-y', outputName
                ]);
                if (result !== 0) {
                    throw new Error(isZh ? 'WebP 编码失败' : 'WebP encoding failed');
                }
            } else {
                outputName = 'output.mp4';
                outputMime = 'video/mp4';
                const result = await ffmpeg.exec([
                    '-i', inputName,
                    '-vf', cropFilter,
                    '-c:v', 'libx264',
                    '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart',
                    '-y', outputName
                ]);
                if (result !== 0) {
                    throw new Error(isZh ? 'MP4 编码失败' : 'MP4 encoding failed');
                }
            }

            setPhase('finalizing');
            setProgressText(c.progress.final);

            // Read output file
            let data;
            try {
                data = await ffmpeg.readFile(outputName);
            } catch {
                throw new Error(isZh ? '读取输出文件失败，处理可能未成功' : 'Failed to read output file. Processing may have failed.');
            }

            // Verify output has content
            if (!data || data.length === 0) {
                throw new Error(isZh ? '生成的文件为空' : 'Generated file is empty');
            }

            // Cleanup
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
            } catch { /* ignore cleanup errors */ }

            if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
            const url = URL.createObjectURL(new Blob([data], { type: outputMime }));
            outputUrlRef.current = url;

            setOutput({
                url,
                size: data.length,
                width: cropW,
                height: cropH,
                format: outputFormat,
            });
            setPhase('success');
        } catch (e) {
            console.error('Crop failed:', e);
            setError(e.message || c.errorHint);
            setPhase('error');
        }
    };

    const progressValue = phaseProgress[phase] ?? 0;

    // Calculate preview dimensions
    const previewStyle = useMemo(() => {
        if (!fileInfo) return {};
        const containerWidth = 600;
        const containerHeight = 400;
        const scale = Math.min(containerWidth / fileInfo.width, containerHeight / fileInfo.height);
        return {
            width: fileInfo.width * scale,
            height: fileInfo.height * scale,
        };
    }, [fileInfo]);

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <ToolTabs />

                {/* Hero Section */}
                <section className="text-center py-8 px-4">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-4">
                        {c.title}
                    </h1>
                    <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
                        {c.sub}
                    </p>
                </section>

                {/* Upload Section */}
                {!file && (
                    <section className="space-y-6">
                        <label className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 hover:border-blue-500/50 hover:bg-white cursor-pointer transition-all">
                            <input
                                type="file"
                                accept=".gif,.webp,.png,.mp4,.webm"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Crop className="w-12 h-12 text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-700">{c.uploadTitle}</p>
                            <p className="text-sm text-gray-500 mt-2">{c.uploadHint}</p>
                        </label>
                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-center">
                                {error}
                            </p>
                        )}
                    </section>
                )}

                {/* Loading State - waiting for file dimensions */}
                {file && !fileInfo && !error && (
                    <section className="space-y-6">
                        <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className="text-lg font-medium text-gray-700">
                                {isZh ? '正在加载文件信息...' : 'Loading file info...'}
                            </p>
                        </div>
                    </section>
                )}

                {/* Preview & Crop Section */}
                {file && fileInfo && !output && (
                    <div className="space-y-6">
                        {/* Crop Preview */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-700">{c.cropArea}</h3>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    {c.reset}
                                </button>
                            </div>

                            <div
                                ref={containerRef}
                                className="relative mx-auto bg-gray-100 rounded-lg overflow-hidden"
                                style={{ width: previewStyle.width || 600, height: previewStyle.height || 400 }}
                            >
                                {/* Preview Image/Video */}
                                {fileInfo.type.startsWith('video/') ? (
                                    <video
                                        src={previewUrl}
                                        className="absolute inset-0 w-full h-full object-contain"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="absolute inset-0 w-full h-full object-contain"
                                    />
                                )}

                                {/* Darkened overlay outside crop region */}
                                <div
                                    className="absolute inset-0 bg-black/50 pointer-events-none"
                                    style={{
                                        clipPath: `polygon(
                                            0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
                                            ${(cropRegion.x / fileInfo.width) * 100}% ${(cropRegion.y / fileInfo.height) * 100}%,
                                            ${(cropRegion.x / fileInfo.width) * 100}% ${((cropRegion.y + cropRegion.height) / fileInfo.height) * 100}%,
                                            ${((cropRegion.x + cropRegion.width) / fileInfo.width) * 100}% ${((cropRegion.y + cropRegion.height) / fileInfo.height) * 100}%,
                                            ${((cropRegion.x + cropRegion.width) / fileInfo.width) * 100}% ${(cropRegion.y / fileInfo.height) * 100}%,
                                            ${(cropRegion.x / fileInfo.width) * 100}% ${(cropRegion.y / fileInfo.height) * 100}%
                                        )`
                                    }}
                                />

                                {/* Crop region handles */}
                                <div
                                    className="absolute border-2 border-blue-500 cursor-move"
                                    style={{
                                        left: `${(cropRegion.x / fileInfo.width) * 100}%`,
                                        top: `${(cropRegion.y / fileInfo.height) * 100}%`,
                                        width: `${(cropRegion.width / fileInfo.width) * 100}%`,
                                        height: `${(cropRegion.height / fileInfo.height) * 100}%`,
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                                >
                                    {/* Corner handles */}
                                    {['nw', 'ne', 'sw', 'se'].map((corner) => (
                                        <div
                                            key={corner}
                                            className={`absolute w-3 h-3 bg-blue-500 border border-white rounded-sm cursor-${corner}-resize`}
                                            style={{
                                                top: corner.includes('n') ? -6 : 'auto',
                                                bottom: corner.includes('s') ? -6 : 'auto',
                                                left: corner.includes('w') ? -6 : 'auto',
                                                right: corner.includes('e') ? -6 : 'auto',
                                            }}
                                            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, `resize-${corner}`); }}
                                        />
                                    ))}
                                    {/* Edge handles */}
                                    {['n', 's', 'e', 'w'].map((edge) => (
                                        <div
                                            key={edge}
                                            className={`absolute bg-blue-500 ${edge === 'n' || edge === 's' ? 'w-6 h-2 cursor-ns-resize' : 'h-6 w-2 cursor-ew-resize'}`}
                                            style={{
                                                top: edge === 'n' ? -4 : edge === 's' ? 'auto' : '50%',
                                                bottom: edge === 's' ? -4 : 'auto',
                                                left: edge === 'w' ? -4 : edge === 'e' ? 'auto' : '50%',
                                                right: edge === 'e' ? -4 : 'auto',
                                                transform: (edge === 'n' || edge === 's') ? 'translateX(-50%)' : 'translateY(-50%)',
                                            }}
                                            onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, `resize-${edge}`); }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Crop dimensions */}
                            <div className="mt-4 text-center text-sm text-gray-500">
                                {Math.round(cropRegion.width)} × {Math.round(cropRegion.height)} px
                            </div>
                        </div>

                        {/* Settings Panel */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                <Crop className="w-4 h-4 text-gray-400" />
                                <h3 className="font-semibold text-gray-700">{isZh ? '设置' : 'Settings'}</h3>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Aspect Ratio */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700">{c.aspectRatio}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {aspectRatios.map((ratio) => (
                                            <button
                                                key={ratio.id}
                                                onClick={() => applyAspectRatio(ratio.id)}
                                                className={`px-4 py-2 rounded-lg border transition-all ${aspectRatio === ratio.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 text-gray-700'
                                                    }`}
                                            >
                                                {isZh ? ratio.labelZh : ratio.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* Output Format */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700">{c.outputFormat}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {outputFormats.map((fmt) => (
                                            <button
                                                key={fmt.id}
                                                onClick={() => setOutputFormat(fmt.id)}
                                                className={`px-4 py-2 rounded-lg border transition-all ${outputFormat === fmt.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 text-gray-700'
                                                    }`}
                                            >
                                                {fmt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="sticky bottom-6 z-40 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 ring-1 ring-gray-900/5">
                            <button
                                onClick={processCrop}
                                disabled={phase === 'processing' || phase === 'encoding' || isLoading}
                                className="w-full py-5 bg-gray-900 hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                            >
                                {(phase === 'processing' || phase === 'encoding' || phase === 'loading_engine') ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        {c.processing}
                                    </>
                                ) : (
                                    <>
                                        <Crop className="w-6 h-6" />
                                        {c.crop}
                                    </>
                                )}
                            </button>

                            {/* Progress */}
                            {phase !== 'idle' && phase !== 'success' && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-gray-700">{progressText}</span>
                                        <span className="font-mono text-blue-600 font-bold">{progressValue}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                            style={{ width: `${progressValue}%` }}
                                        />
                                    </div>
                                    {phase === 'error' && (
                                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
                                            {error || c.errorHint}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Output Result */}
                {output && (
                    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-gray-900">{c.result}</h2>
                            <span className="text-sm text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {c.success}
                            </span>
                        </div>

                        {output.format === 'mp4' ? (
                            <video
                                controls
                                autoPlay
                                loop
                                muted
                                className="w-full rounded-xl border border-gray-200 max-h-[400px] bg-black"
                            >
                                <source src={output.url} type="video/mp4" />
                            </video>
                        ) : (
                            <img
                                src={output.url}
                                alt="Cropped result"
                                className="w-full rounded-xl border border-gray-200 max-h-[400px] object-contain bg-gray-100"
                            />
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span>{c.size}: <strong className="text-gray-900">{formatBytes(output.size)}</strong></span>
                            <span>{c.dimensions}: <strong className="text-gray-900">{output.width} × {output.height}</strong></span>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <a
                                href={output.url}
                                download={`cropped.${output.format}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                {c.download}
                            </a>
                            <button
                                onClick={() => { setOutput(null); setFile(null); setFileInfo(null); setPhase('idle'); }}
                                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                            >
                                {c.another}
                            </button>
                            <Link
                                to="/gif-canvas"
                                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                            >
                                {c.continueEdit} →
                            </Link>
                        </div>
                    </section>
                )}

                {/* Trust Section */}
                <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-2 md:p-6">
                    <TrustSection />
                </div>

                {/* FAQ Section */}
                <section className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                            {c.faqTitle}
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(isZh ? [
                            { q: '支持哪些文件格式？', a: '支持 GIF、WebP、APNG 和 MP4/WebM 视频文件。' },
                            { q: '裁剪后文件会变大吗？', a: '通常裁剪后文件会变小，因为像素数减少了。但重新编码可能导致轻微变化。' },
                            { q: '会添加水印吗？', a: '不会，导出的文件完全无水印。' },
                            { q: '文件会上传到服务器吗？', a: '不会，所有处理都在浏览器本地完成，文件不会离开您的设备。' },
                            { q: '为什么处理很慢？', a: '首次使用需要加载约 30MB 的 FFmpeg 引擎。大文件或高分辨率文件需要更长时间。' },
                            { q: '裁剪后可以继续编辑吗？', a: '可以，下载后您可以使用其他工具继续编辑，如添加文字或调整画布。' },
                        ] : [
                            { q: 'What file formats are supported?', a: 'GIF, WebP, APNG, and MP4/WebM video files are supported.' },
                            { q: 'Will cropping increase file size?', a: 'Usually cropping reduces file size since there are fewer pixels. Re-encoding may cause slight variations.' },
                            { q: 'Do you add a watermark?', a: 'No, exports are completely watermark-free.' },
                            { q: 'Are files uploaded to a server?', a: 'No, all processing happens locally in your browser. Files never leave your device.' },
                            { q: 'Why is processing slow?', a: 'First use requires loading the ~30MB FFmpeg engine. Larger files take more time.' },
                            { q: 'Can I continue editing after cropping?', a: 'Yes, after downloading you can use other tools like Add Text or Canvas.' },
                        ]).map((item) => (
                            <div key={item.q} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow">
                                <h3 className="font-semibold text-gray-900 text-lg leading-7 mb-2">{item.q}</h3>
                                <p className="leading-7 text-gray-600">{item.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Related Tools */}
                <section className="space-y-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-900">{c.related}</h2>
                    <p className="text-sm text-gray-600">
                        {isZh ? '探索更多浏览器内处理的工具。' : 'Explore more browser-native tools.'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { href: '/', label: isZh ? '图片转 GIF' : 'Image to GIF' },
                            { href: '/gif-canvas', label: isZh ? 'GIF 画布' : 'GIF Canvas' },
                            { href: '/add-text-to-gif', label: isZh ? '添加文字' : 'Add Text to GIF' },
                            { href: '/compress-gif', label: isZh ? '压缩 GIF' : 'Compress GIF' },
                            { href: '/video-to-gif', label: isZh ? '视频转 GIF' : 'Video to GIF' },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                to={link.href}
                                className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </Layout>
    );
};

export default CropGifPage;
