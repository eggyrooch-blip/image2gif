import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, Square, Check, Move } from 'lucide-react';
import { fetchFile } from '@ffmpeg/util';
import Layout from './Layout';
import ToolTabs from './ToolTabs';
import TrustSection from './TrustSection';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { useLanguage } from '../contexts/LanguageContext';
import { formatBytes } from '../utils/formatUtils';

// Canvas size presets
const canvasPresets = [
    { id: '512x512', label: '512×512', labelZh: '512×512', width: 512, height: 512 },
    { id: '640x640', label: '640×640', labelZh: '640×640', width: 640, height: 640 },
    { id: '800x800', label: '800×800', labelZh: '800×800', width: 800, height: 800 },
    { id: '1280x720', label: '1280×720 (HD)', labelZh: '1280×720 (高清)', width: 1280, height: 720 },
    { id: '1920x1080', label: '1920×1080 (FHD)', labelZh: '1920×1080 (全高清)', width: 1920, height: 1080 },
    { id: 'custom', label: 'Custom', labelZh: '自定义', width: null, height: null },
];

// 9-grid alignment positions
const alignments = [
    { id: 'top-left', label: 'Top Left', labelZh: '左上', x: 0, y: 0, icon: '↖' },
    { id: 'top', label: 'Top', labelZh: '上', x: 0.5, y: 0, icon: '↑' },
    { id: 'top-right', label: 'Top Right', labelZh: '右上', x: 1, y: 0, icon: '↗' },
    { id: 'left', label: 'Left', labelZh: '左', x: 0, y: 0.5, icon: '←' },
    { id: 'center', label: 'Center', labelZh: '居中', x: 0.5, y: 0.5, icon: '◉' },
    { id: 'right', label: 'Right', labelZh: '右', x: 1, y: 0.5, icon: '→' },
    { id: 'bottom-left', label: 'Bottom Left', labelZh: '左下', x: 0, y: 1, icon: '↙' },
    { id: 'bottom', label: 'Bottom', labelZh: '下', x: 0.5, y: 1, icon: '↓' },
    { id: 'bottom-right', label: 'Bottom Right', labelZh: '右下', x: 1, y: 1, icon: '↘' },
];

const outputFormats = [
    { id: 'gif', label: 'GIF', mime: 'image/gif' },
    { id: 'webp', label: 'WebP', mime: 'image/webp' },
    { id: 'mp4', label: 'MP4', mime: 'video/mp4' },
];

const backgroundTypes = [
    { id: 'transparent', label: 'Transparent', labelZh: '透明' },
    { id: 'solid', label: 'Solid Color', labelZh: '纯色' },
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

const GifCanvasPage = () => {
    const { ffmpeg, loaded, load, isLoading } = useFFmpeg();
    const { language } = useLanguage();
    const isZh = language === 'zh';

    const copy = {
        en: {
            title: 'GIF Canvas / Pad',
            sub: 'Resize canvas without cropping. Add padding to center or align your GIF/video.',
            uploadTitle: 'Upload your file',
            uploadHint: 'Drag & drop or click to select GIF, WebP, APNG, or MP4',
            canvasSize: 'Canvas Size',
            width: 'Width',
            height: 'Height',
            alignment: 'Alignment',
            background: 'Background',
            backgroundColor: 'Background Color',
            outputFormat: 'Output Format',
            apply: 'Apply Canvas',
            processing: 'Processing...',
            result: 'Result',
            success: 'Done',
            download: 'Download',
            another: 'Process another',
            continueEdit: 'Continue editing',
            faqTitle: 'FAQ: GIF Canvas',
            related: 'Related Tools',
            size: 'Size',
            dimensions: 'Dimensions',
            original: 'Original',
            progress: {
                loading: 'Loading processing engine (~30MB, cached)...',
                processing: 'Applying canvas...',
                encoding: 'Encoding output...',
                final: 'Finalizing...',
            },
            errorHint: 'Processing failed. Try a smaller file or different settings.',
            note: 'Canvas adds padding without cropping content. Original content stays intact.',
        },
        zh: {
            title: 'GIF 画布 / 填充',
            sub: '调整画布大小而不裁剪内容，添加边距以居中或对齐您的 GIF/视频。',
            uploadTitle: '上传文件',
            uploadHint: '拖放或点击选择 GIF、WebP、APNG 或 MP4 文件',
            canvasSize: '画布尺寸',
            width: '宽度',
            height: '高度',
            alignment: '对齐方式',
            background: '背景',
            backgroundColor: '背景颜色',
            outputFormat: '输出格式',
            apply: '应用画布',
            processing: '处理中...',
            result: '结果',
            success: '完成',
            download: '下载',
            another: '处理另一个',
            continueEdit: '继续编辑',
            faqTitle: '常见问题：GIF 画布',
            related: '相关工具',
            size: '大小',
            dimensions: '尺寸',
            original: '原始',
            progress: {
                loading: '正在加载处理引擎（约 30MB，缓存后更快）...',
                processing: '正在应用画布...',
                encoding: '正在编码输出...',
                final: '整理输出...',
            },
            errorHint: '处理失败，请尝试更小的文件或其他设置。',
            note: '画布会添加边距而不裁剪内容，原始内容保持不变。',
        },
    };
    const c = copy[isZh ? 'zh' : 'en'];

    // State
    const [file, setFile] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [canvasPreset, setCanvasPreset] = useState('640x640');
    const [customWidth, setCustomWidth] = useState(640);
    const [customHeight, setCustomHeight] = useState(640);
    const [alignment, setAlignment] = useState('center');
    const [backgroundType, setBackgroundType] = useState('transparent');
    const [backgroundColor, setBackgroundColor] = useState('#000000');
    const [outputFormat, setOutputFormat] = useState('gif');
    const [phase, setPhase] = useState('idle');
    const [progressText, setProgressText] = useState('');
    const [error, setError] = useState(null);
    const [output, setOutput] = useState(null);

    const outputUrlRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => () => {
        if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    // Get actual canvas dimensions
    const canvasDimensions = useMemo(() => {
        if (canvasPreset === 'custom') {
            return { width: customWidth, height: customHeight };
        }
        const preset = canvasPresets.find(p => p.id === canvasPreset);
        return preset ? { width: preset.width, height: preset.height } : { width: 640, height: 640 };
    }, [canvasPreset, customWidth, customHeight]);

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
                // Set default canvas size larger than original with padding
                const paddedWidth = video.videoWidth + 100;
                const paddedHeight = video.videoHeight + 100;
                setCustomWidth(Math.max(paddedWidth, 640));
                setCustomHeight(Math.max(paddedHeight, 640));
                // If video is larger than default 640x640, auto-switch to custom
                if (video.videoWidth > 640 || video.videoHeight > 640) {
                    setCanvasPreset('custom');
                }
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
                // Set default canvas size larger than original with padding
                const paddedWidth = img.naturalWidth + 100;
                const paddedHeight = img.naturalHeight + 100;
                setCustomWidth(Math.max(paddedWidth, 640));
                setCustomHeight(Math.max(paddedHeight, 640));
                // If image is larger than default 640x640, auto-switch to custom
                if (img.naturalWidth > 640 || img.naturalHeight > 640) {
                    setCanvasPreset('custom');
                }
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

    // Calculate position based on alignment
    const calculatePosition = useCallback((canvasW, canvasH, contentW, contentH, alignId) => {
        const align = alignments.find(a => a.id === alignId) || alignments[4]; // default center
        const x = Math.round((canvasW - contentW) * align.x);
        const y = Math.round((canvasH - contentH) * align.y);
        return { x, y };
    }, []);

    // Process canvas
    const processCanvas = async () => {
        if (!file || !fileInfo) return;

        const { width: canvasW, height: canvasH } = canvasDimensions;

        // Validate canvas is larger than content
        if (canvasW < fileInfo.width || canvasH < fileInfo.height) {
            setError(isZh ? '画布必须大于或等于原始内容尺寸' : 'Canvas must be equal or larger than original content');
            return;
        }

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

            // Calculate position
            const pos = calculatePosition(canvasW, canvasH, fileInfo.width, fileInfo.height, alignment);

            // Make dimensions even (required by many codecs)
            const finalW = canvasW % 2 === 0 ? canvasW : canvasW + 1;
            const finalH = canvasH % 2 === 0 ? canvasH : canvasH + 1;

            // Write input file
            const ext = file.name.split('.').pop()?.toLowerCase() || 'gif';
            const inputName = `input.${ext}`;
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            setPhase('encoding');
            setProgressText(c.progress.encoding);

            let outputName, outputMime;

            // Build pad filter
            // FFmpeg pad filter: pad=width:height:x:y:color
            const bgColor = backgroundType === 'transparent' ? 'black@0' : backgroundColor.replace('#', '0x');
            const padFilter = `pad=${finalW}:${finalH}:${pos.x}:${pos.y}:${bgColor}`;

            if (outputFormat === 'gif') {
                outputName = 'output.gif';
                outputMime = 'image/gif';
                // Two-pass GIF encoding for quality
                const paletteResult = await ffmpeg.exec([
                    '-i', inputName,
                    '-vf', `${padFilter},palettegen=stats_mode=full`,
                    '-y', 'palette.png'
                ]);
                if (paletteResult !== 0) {
                    throw new Error(isZh ? '生成调色板失败' : 'Failed to generate palette');
                }

                const encodeResult = await ffmpeg.exec([
                    '-i', inputName,
                    '-i', 'palette.png',
                    '-filter_complex', `[0:v]${padFilter}[padded];[padded][1:v]paletteuse=dither=bayer:bayer_scale=5`,
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
                    '-vf', padFilter,
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
                    '-vf', padFilter,
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
                width: finalW,
                height: finalH,
                format: outputFormat,
            });
            setPhase('success');
        } catch (e) {
            console.error('Canvas processing failed:', e);
            setError(e.message || c.errorHint);
            setPhase('error');
        }
    };

    const progressValue = phaseProgress[phase] ?? 0;

    // Preview calculation
    const previewInfo = useMemo(() => {
        if (!fileInfo) return null;
        const { width: canvasW, height: canvasH } = canvasDimensions;

        // Canvas must be >= content size for padding to work
        // Use the larger of canvas or content for preview scaling
        const effectiveW = Math.max(canvasW, fileInfo.width);
        const effectiveH = Math.max(canvasH, fileInfo.height);

        const pos = calculatePosition(canvasW, canvasH, fileInfo.width, fileInfo.height, alignment);

        // Scale for preview display - based on the larger dimension
        const maxPreviewSize = 350;
        const scale = Math.min(maxPreviewSize / effectiveW, maxPreviewSize / effectiveH);

        return {
            canvasW: canvasW * scale,
            canvasH: canvasH * scale,
            contentW: fileInfo.width * scale,
            contentH: fileInfo.height * scale,
            contentX: Math.max(0, pos.x * scale),  // Clamp to non-negative
            contentY: Math.max(0, pos.y * scale),  // Clamp to non-negative
        };
    }, [fileInfo, canvasDimensions, alignment, calculatePosition]);

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
                            <Square className="w-12 h-12 text-gray-400 mb-4" />
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

                {/* Loading State - waiting for image dimensions */}
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

                {/* Settings & Preview Section */}
                {file && fileInfo && !output && (
                    <div className="space-y-6">
                        {/* Visual Preview */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-700 mb-4">{isZh ? '预览' : 'Preview'}</h3>

                            <div className="flex items-center justify-center">
                                <div
                                    className="relative border-2 border-dashed border-gray-300 rounded-lg"
                                    style={{
                                        width: previewInfo?.canvasW || 400,
                                        height: previewInfo?.canvasH || 400,
                                        backgroundColor: backgroundType === 'transparent' ? 'transparent' : backgroundColor,
                                        backgroundImage: backgroundType === 'transparent' ? 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)' : 'none',
                                        backgroundSize: '20px 20px',
                                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                    }}
                                >
                                    {previewInfo && (
                                        <div
                                            className="absolute overflow-hidden rounded-sm shadow-md"
                                            style={{
                                                width: previewInfo.contentW,
                                                height: previewInfo.contentH,
                                                left: previewInfo.contentX,
                                                top: previewInfo.contentY,
                                            }}
                                        >
                                            {fileInfo.type.startsWith('video/') ? (
                                                <video
                                                    src={previewUrl}
                                                    className="w-full h-full object-cover"
                                                    autoPlay
                                                    loop
                                                    muted
                                                    playsInline
                                                />
                                            ) : (
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 text-center text-sm text-gray-500">
                                <span>{c.original}: {fileInfo.width} × {fileInfo.height}</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium text-gray-900">{canvasDimensions.width} × {canvasDimensions.height}</span>
                            </div>

                            {/* Warning if canvas is smaller than content */}
                            {(canvasDimensions.width < fileInfo.width || canvasDimensions.height < fileInfo.height) && (
                                <p className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                                    {isZh
                                        ? '⚠️ 画布尺寸小于原始内容，请选择更大的画布或使用自定义尺寸'
                                        : '⚠️ Canvas is smaller than content. Please choose a larger canvas or use custom size.'}
                                </p>
                            )}

                            <p className="mt-2 text-xs text-gray-400 text-center">{c.note}</p>
                        </div>

                        {/* Settings Panel */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                <Move className="w-4 h-4 text-gray-400" />
                                <h3 className="font-semibold text-gray-700">{isZh ? '设置' : 'Settings'}</h3>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Canvas Size Presets */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700">{c.canvasSize}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {canvasPresets.map((preset) => (
                                            <button
                                                key={preset.id}
                                                onClick={() => setCanvasPreset(preset.id)}
                                                className={`px-3 py-2 rounded-lg border transition-all text-sm ${canvasPreset === preset.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 text-gray-700'
                                                    }`}
                                            >
                                                {isZh ? preset.labelZh : preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom dimensions */}
                                    {canvasPreset === 'custom' && (
                                        <div className="flex gap-4 mt-3">
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500 mb-1 block">{c.width} (px)</label>
                                                <input
                                                    type="number"
                                                    value={customWidth}
                                                    onChange={(e) => setCustomWidth(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    min={fileInfo?.width || 1}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-xs text-gray-500 mb-1 block">{c.height} (px)</label>
                                                <input
                                                    type="number"
                                                    value={customHeight}
                                                    onChange={(e) => setCustomHeight(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    min={fileInfo?.height || 1}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* Alignment (9-grid) */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700">{c.alignment}</label>
                                    <div className="grid grid-cols-3 gap-2 w-fit">
                                        {alignments.map((align) => (
                                            <button
                                                key={align.id}
                                                onClick={() => setAlignment(align.id)}
                                                className={`w-12 h-12 rounded-lg border transition-all flex items-center justify-center text-lg ${alignment === align.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 text-gray-500'
                                                    }`}
                                                title={isZh ? align.labelZh : align.label}
                                            >
                                                {align.icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* Background */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700">{c.background}</label>
                                    <div className="flex gap-2">
                                        {backgroundTypes.map((bg) => (
                                            <button
                                                key={bg.id}
                                                onClick={() => setBackgroundType(bg.id)}
                                                className={`px-4 py-2 rounded-lg border transition-all ${backgroundType === bg.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 text-gray-700'
                                                    }`}
                                            >
                                                {isZh ? bg.labelZh : bg.label}
                                            </button>
                                        ))}
                                    </div>

                                    {backgroundType === 'solid' && (
                                        <div className="flex items-center gap-3 mt-2">
                                            <label className="text-sm text-gray-600">{c.backgroundColor}:</label>
                                            <input
                                                type="color"
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                            />
                                            <input
                                                type="text"
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="w-24 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                            />
                                        </div>
                                    )}
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
                                onClick={processCanvas}
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
                                        <Square className="w-6 h-6" />
                                        {c.apply}
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
                                alt="Canvas result"
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
                                download={`canvas.${output.format}`}
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
                                to="/add-text-to-gif"
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
                            { q: 'Canvas 和 Crop 有什么区别？', a: 'Crop 会裁剪掉内容，而 Canvas 只是扩大画布并添加边距，原始内容保持完整。' },
                            { q: '为什么要使用 Canvas？', a: '常用于调整 GIF 尺寸以适应特定平台（如 512x512 表情包），或添加边框效果。' },
                            { q: '透明背景支持哪些格式？', a: 'GIF 和 WebP 支持透明背景，MP4 不支持透明，会使用纯色背景。' },
                            { q: '会添加水印吗？', a: '不会，导出的文件完全无水印。' },
                            { q: '文件会上传到服务器吗？', a: '不会，所有处理都在浏览器本地完成。' },
                            { q: '处理后文件会变大吗？', a: '由于画布变大，文件通常会稍微增大，但增幅取决于添加的边距大小。' },
                        ] : [
                            { q: 'What\'s the difference between Canvas and Crop?', a: 'Crop removes content, while Canvas only expands the canvas and adds padding, keeping original content intact.' },
                            { q: 'Why would I use Canvas?', a: 'Common uses include resizing GIFs for specific platforms (like 512x512 for emojis), or adding border effects.' },
                            { q: 'Which formats support transparent backgrounds?', a: 'GIF and WebP support transparency. MP4 doesn\'t support transparency and will use solid color.' },
                            { q: 'Do you add a watermark?', a: 'No, exports are completely watermark-free.' },
                            { q: 'Are files uploaded to a server?', a: 'No, all processing happens locally in your browser.' },
                            { q: 'Will the file size increase?', a: 'Since the canvas is larger, files usually increase slightly, but it depends on how much padding is added.' },
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
                            { href: '/crop-gif', label: isZh ? '裁剪 GIF' : 'Crop GIF' },
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

export default GifCanvasPage;
