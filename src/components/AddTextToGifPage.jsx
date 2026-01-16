import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, Type, Check, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { fetchFile } from '@ffmpeg/util';
import Layout from './Layout';
import ToolTabs from './ToolTabs';
import TrustSection from './TrustSection';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { useLanguage } from '../contexts/LanguageContext';
import { formatBytes } from '../utils/formatUtils';

// Text position presets (9-grid)
const positions = [
    { id: 'top-left', label: 'Top Left', labelZh: '左上', x: 'x=20', y: 'y=20' },
    { id: 'top', label: 'Top', labelZh: '上', x: 'x=(w-text_w)/2', y: 'y=20' },
    { id: 'top-right', label: 'Top Right', labelZh: '右上', x: 'x=w-text_w-20', y: 'y=20' },
    { id: 'left', label: 'Left', labelZh: '左', x: 'x=20', y: 'y=(h-text_h)/2' },
    { id: 'center', label: 'Center', labelZh: '居中', x: 'x=(w-text_w)/2', y: 'y=(h-text_h)/2' },
    { id: 'right', label: 'Right', labelZh: '右', x: 'x=w-text_w-20', y: 'y=(h-text_h)/2' },
    { id: 'bottom-left', label: 'Bottom Left', labelZh: '左下', x: 'x=20', y: 'y=h-text_h-20' },
    { id: 'bottom', label: 'Bottom', labelZh: '下', x: 'x=(w-text_w)/2', y: 'y=h-text_h-20' },
    { id: 'bottom-right', label: 'Bottom Right', labelZh: '右下', x: 'x=w-text_w-20', y: 'y=h-text_h-20' },
];

// Quick templates
const templates = [
    {
        id: 'meme',
        label: 'Meme',
        labelZh: '表情包',
        desc: 'Large text at top',
        descZh: '顶部大字',
        position: 'top',
        fontSize: 48,
        fontColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 3,
        bgStrip: false,
    },
    {
        id: 'subtitle',
        label: 'Subtitle',
        labelZh: '字幕',
        desc: 'Bottom with background',
        descZh: '底部带背景',
        position: 'bottom',
        fontSize: 24,
        fontColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 2,
        bgStrip: true,
    },
    {
        id: 'corner',
        label: 'Corner Tag',
        labelZh: '角标',
        desc: 'Small text in corner',
        descZh: '角落小字',
        position: 'bottom-right',
        fontSize: 16,
        fontColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 1,
        bgStrip: false,
    },
];

const outputFormats = [
    { id: 'gif', label: 'GIF', mime: 'image/gif' },
    { id: 'webp', label: 'WebP', mime: 'image/webp' },
    { id: 'mp4', label: 'MP4', mime: 'video/mp4' },
];

const fontSizes = [16, 20, 24, 32, 40, 48, 64, 80];

const phaseProgress = {
    idle: 0,
    loading_engine: 10,
    processing: 50,
    encoding: 80,
    finalizing: 95,
    success: 100,
    error: 100,
};

const AddTextToGifPage = () => {
    const { ffmpeg, loaded, load, isLoading } = useFFmpeg();
    const { language } = useLanguage();
    const isZh = language === 'zh';

    const copy = {
        en: {
            title: 'Add Text to GIF',
            sub: 'Add captions, memes, or watermarks to your GIF locally. No upload, no watermark.',
            uploadTitle: 'Upload your file',
            uploadHint: 'Drag & drop or click to select GIF, WebP, APNG, or MP4',
            templates: 'Quick Templates',
            textContent: 'Text Content',
            textPlaceholder: 'Enter your text here...',
            position: 'Position',
            style: 'Style',
            fontSize: 'Font Size',
            fontColor: 'Font Color',
            stroke: 'Stroke',
            strokeColor: 'Stroke Color',
            strokeWidth: 'Stroke Width',
            bgStrip: 'Background Strip',
            bgStripHint: 'Semi-transparent background behind text',
            outputFormat: 'Output Format',
            apply: 'Apply Text',
            processing: 'Processing...',
            result: 'Result',
            success: 'Done',
            download: 'Download',
            another: 'Process another',
            continueEdit: 'Continue editing',
            faqTitle: 'FAQ: Add Text to GIF',
            related: 'Related Tools',
            size: 'Size',
            dimensions: 'Dimensions',
            progress: {
                loading: 'Loading processing engine (~30MB, cached)...',
                processing: 'Adding text overlay...',
                encoding: 'Encoding output...',
                final: 'Finalizing...',
            },
            errorHint: 'Processing failed. Try a smaller file or different settings.',
            preview: 'Preview',
            largeFileWarning: 'Large files may take longer to process.',
        },
        zh: {
            title: '给 GIF 添加文字',
            sub: '在本地为您的 GIF 添加字幕、表情包文字或水印，无需上传，无水印。',
            uploadTitle: '上传文件',
            uploadHint: '拖放或点击选择 GIF、WebP、APNG 或 MP4 文件',
            templates: '快速模板',
            textContent: '文字内容',
            textPlaceholder: '在此输入文字...',
            position: '位置',
            style: '样式',
            fontSize: '字号',
            fontColor: '文字颜色',
            stroke: '描边',
            strokeColor: '描边颜色',
            strokeWidth: '描边宽度',
            bgStrip: '背景条',
            bgStripHint: '文字后的半透明背景',
            outputFormat: '输出格式',
            apply: '应用文字',
            processing: '处理中...',
            result: '结果',
            success: '完成',
            download: '下载',
            another: '处理另一个',
            continueEdit: '继续编辑',
            faqTitle: '常见问题：添加文字',
            related: '相关工具',
            size: '大小',
            dimensions: '尺寸',
            progress: {
                loading: '正在加载处理引擎（约 30MB，缓存后更快）...',
                processing: '正在添加文字叠加...',
                encoding: '正在编码输出...',
                final: '整理输出...',
            },
            errorHint: '处理失败，请尝试更小的文件或其他设置。',
            preview: '预览',
            largeFileWarning: '大文件处理时间可能较长。',
        },
    };
    const c = copy[isZh ? 'zh' : 'en'];

    // State
    const [file, setFile] = useState(null);
    const [fileInfo, setFileInfo] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [text, setText] = useState('');
    const [position, setPosition] = useState('bottom');
    const [fontSize, setFontSize] = useState(32);
    const [fontColor, setFontColor] = useState('#FFFFFF');
    const [strokeEnabled, setStrokeEnabled] = useState(true);
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [bgStrip, setBgStrip] = useState(false);
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

    // Apply template
    const applyTemplate = useCallback((templateId) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        setPosition(template.position);
        setFontSize(template.fontSize);
        setFontColor(template.fontColor);
        setStrokeColor(template.strokeColor);
        setStrokeWidth(template.strokeWidth);
        setBgStrip(template.bgStrip);
        setStrokeEnabled(template.strokeWidth > 0);
    }, []);

    // Calculate text position in pixels
    const getTextPosition = (posId, width, height, textWidth, textHeight) => {
        const padding = 20;
        switch (posId) {
            case 'top-left': return { x: padding, y: padding + textHeight };
            case 'top': return { x: (width - textWidth) / 2, y: padding + textHeight };
            case 'top-right': return { x: width - textWidth - padding, y: padding + textHeight };
            case 'left': return { x: padding, y: (height + textHeight) / 2 };
            case 'center': return { x: (width - textWidth) / 2, y: (height + textHeight) / 2 };
            case 'right': return { x: width - textWidth - padding, y: (height + textHeight) / 2 };
            case 'bottom-left': return { x: padding, y: height - padding };
            case 'bottom': return { x: (width - textWidth) / 2, y: height - padding };
            case 'bottom-right': return { x: width - textWidth - padding, y: height - padding };
            default: return { x: (width - textWidth) / 2, y: height - padding };
        }
    };

    // Draw text on canvas
    const drawTextOnCanvas = (ctx, width, height) => {
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textBaseline = 'bottom';

        // Measure text
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize;

        const pos = getTextPosition(position, width, height, textWidth, textHeight);

        // Draw background strip if enabled
        if (bgStrip) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, pos.y - textHeight - 10, width, textHeight + 20);
        }

        // Draw stroke/border
        if (strokeEnabled && strokeWidth > 0) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth * 2;
            ctx.lineJoin = 'round';
            ctx.strokeText(text, pos.x, pos.y);
        }

        // Draw text
        ctx.fillStyle = fontColor;
        ctx.fillText(text, pos.x, pos.y);
    };

    // Process text overlay using Canvas-based approach
    const processText = async () => {
        if (!file || !fileInfo || !text.trim()) {
            setError(isZh ? '请输入文字内容' : 'Please enter text content');
            return;
        }

        setError(null);
        setPhase('loading_engine');
        setProgressText(c.progress.loading);

        try {
            if (!loaded && !isLoading) {
                await load();
            }

            if (!ffmpeg) {
                throw new Error(isZh ? 'FFmpeg 引擎加载失败' : 'FFmpeg engine failed to load');
            }

            setPhase('processing');
            setProgressText(isZh ? '正在提取帧...' : 'Extracting frames...');

            // Write input file
            const ext = file.name.split('.').pop()?.toLowerCase() || 'gif';
            const inputName = `input.${ext}`;
            await ffmpeg.writeFile(inputName, await fetchFile(file));

            // Extract frames to PNG
            const extractResult = await ffmpeg.exec([
                '-i', inputName,
                '-vsync', '0',
                '-y', 'frame_%04d.png'
            ]);

            if (extractResult !== 0) {
                throw new Error(isZh ? '提取帧失败' : 'Failed to extract frames');
            }

            // Get list of extracted frames
            const files = await ffmpeg.listDir('/');
            const frameFiles = files
                .filter(f => f.name.startsWith('frame_') && f.name.endsWith('.png'))
                .sort((a, b) => a.name.localeCompare(b.name));

            if (frameFiles.length === 0) {
                throw new Error(isZh ? '未提取到任何帧' : 'No frames extracted');
            }

            setPhase('encoding');
            setProgressText(isZh ? `正在处理 ${frameFiles.length} 帧...` : `Processing ${frameFiles.length} frames...`);

            // Process each frame with Canvas
            const canvas = document.createElement('canvas');
            canvas.width = fileInfo.width;
            canvas.height = fileInfo.height;
            const ctx = canvas.getContext('2d');

            for (let i = 0; i < frameFiles.length; i++) {
                const frameName = frameFiles[i].name;
                const frameData = await ffmpeg.readFile(frameName);

                // Load frame as image
                const blob = new Blob([frameData], { type: 'image/png' });
                const imgUrl = URL.createObjectURL(blob);
                const img = await new Promise((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => resolve(image);
                    image.onerror = reject;
                    image.src = imgUrl;
                });
                URL.revokeObjectURL(imgUrl);

                // Draw frame and text
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                drawTextOnCanvas(ctx, canvas.width, canvas.height);

                // Convert back to PNG and write
                const processedBlob = await new Promise(resolve =>
                    canvas.toBlob(resolve, 'image/png')
                );
                const processedData = new Uint8Array(await processedBlob.arrayBuffer());
                await ffmpeg.writeFile(frameName, processedData);
            }

            setProgressText(isZh ? '正在编码输出...' : 'Encoding output...');

            let outputName, outputMime;

            if (outputFormat === 'gif') {
                outputName = 'output.gif';
                outputMime = 'image/gif';

                // Generate palette from processed frames
                const paletteResult = await ffmpeg.exec([
                    '-i', 'frame_%04d.png',
                    '-vf', 'palettegen=stats_mode=full',
                    '-y', 'palette.png'
                ]);

                if (paletteResult !== 0) {
                    throw new Error(isZh ? '生成调色板失败' : 'Failed to generate palette');
                }

                // Encode GIF with palette
                const encodeResult = await ffmpeg.exec([
                    '-framerate', '10',
                    '-i', 'frame_%04d.png',
                    '-i', 'palette.png',
                    '-filter_complex', '[0:v][1:v]paletteuse=dither=bayer:bayer_scale=5',
                    '-y', outputName
                ]);

                if (encodeResult !== 0) {
                    throw new Error(isZh ? 'GIF 编码失败' : 'GIF encoding failed');
                }

                try { await ffmpeg.deleteFile('palette.png'); } catch { /* ignore */ }
            } else if (outputFormat === 'webp') {
                outputName = 'output.webp';
                outputMime = 'image/webp';
                const result = await ffmpeg.exec([
                    '-framerate', '10',
                    '-i', 'frame_%04d.png',
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
                    '-framerate', '10',
                    '-i', 'frame_%04d.png',
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
                throw new Error(isZh ? '读取输出文件失败' : 'Failed to read output file');
            }

            if (!data || data.length === 0) {
                throw new Error(isZh ? '生成的文件为空' : 'Generated file is empty');
            }

            // Cleanup all files
            try {
                await ffmpeg.deleteFile(inputName);
                await ffmpeg.deleteFile(outputName);
                for (const frame of frameFiles) {
                    await ffmpeg.deleteFile(frame.name);
                }
            } catch { /* ignore cleanup errors */ }

            if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current);
            const url = URL.createObjectURL(new Blob([data], { type: outputMime }));
            outputUrlRef.current = url;

            setOutput({
                url,
                size: data.length,
                width: fileInfo.width,
                height: fileInfo.height,
                format: outputFormat,
            });
            setPhase('success');
        } catch (e) {
            console.error('Text overlay failed:', e);
            setError(e.message || c.errorHint);
            setPhase('error');
        }
    };

    const progressValue = phaseProgress[phase] ?? 0;

    // Preview with text overlay (CSS simulation)
    const previewStyle = useMemo(() => {
        const style = {
            position: 'absolute',
            fontSize: `${Math.min(fontSize, 32)}px`,
            color: fontColor,
            textShadow: strokeEnabled ? `
                -${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},
                ${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},
                -${strokeWidth}px ${strokeWidth}px 0 ${strokeColor},
                ${strokeWidth}px ${strokeWidth}px 0 ${strokeColor}
            ` : 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            backgroundColor: bgStrip ? 'rgba(0,0,0,0.5)' : 'transparent',
            maxWidth: '90%',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            textAlign: 'center',
        };

        // Position
        if (position.includes('top')) {
            style.top = '10px';
        } else if (position.includes('bottom')) {
            style.bottom = '10px';
        } else {
            style.top = '50%';
            style.transform = 'translateY(-50%)';
        }

        if (position.includes('left')) {
            style.left = '10px';
            style.textAlign = 'left';
        } else if (position.includes('right')) {
            style.right = '10px';
            style.textAlign = 'right';
        } else {
            style.left = '50%';
            style.transform = style.transform ? `${style.transform} translateX(-50%)` : 'translateX(-50%)';
        }

        return style;
    }, [position, fontSize, fontColor, strokeEnabled, strokeColor, strokeWidth, bgStrip]);

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
                            <Type className="w-12 h-12 text-gray-400 mb-4" />
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

                {/* Editor Section */}
                {file && fileInfo && !output && (
                    <div className="space-y-6">
                        {/* Preview with Text Overlay */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-semibold text-gray-700 mb-4">{c.preview}</h3>

                            <div className="relative mx-auto bg-gray-100 rounded-lg overflow-hidden max-w-lg">
                                {fileInfo.type.startsWith('video/') ? (
                                    <video
                                        src={previewUrl}
                                        className="w-full h-auto max-h-[400px] object-contain"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-auto max-h-[400px] object-contain"
                                    />
                                )}

                                {/* Text overlay preview */}
                                {text && (
                                    <div style={previewStyle}>
                                        {text}
                                    </div>
                                )}
                            </div>

                            <p className="mt-2 text-xs text-gray-400 text-center">
                                {c.largeFileWarning}
                            </p>
                        </div>

                        {/* Quick Templates */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-semibold text-gray-700">{c.templates}</h3>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-3 gap-3">
                                    {templates.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => applyTemplate(template.id)}
                                            className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                                        >
                                            <div className="font-semibold text-gray-800">
                                                {isZh ? template.labelZh : template.label}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {isZh ? template.descZh : template.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Settings Panel */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                <Type className="w-4 h-4 text-gray-400" />
                                <h3 className="font-semibold text-gray-700">{isZh ? '设置' : 'Settings'}</h3>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Text Content */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">{c.textContent}</label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder={c.textPlaceholder}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        rows={3}
                                    />
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* Position (9-grid) */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-700">{c.position}</label>
                                    <div className="grid grid-cols-3 gap-2 w-fit">
                                        {positions.map((pos) => (
                                            <button
                                                key={pos.id}
                                                onClick={() => setPosition(pos.id)}
                                                className={`w-12 h-12 rounded-lg border transition-all flex items-center justify-center ${position === pos.id
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 text-gray-500'
                                                    }`}
                                                title={isZh ? pos.labelZh : pos.label}
                                            >
                                                <Type className="w-4 h-4" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-gray-100" />

                                {/* Style Options */}
                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-700">{c.style}</label>

                                    {/* Font Size */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 w-20">{c.fontSize}:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {fontSizes.map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setFontSize(size)}
                                                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${fontSize === size
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 hover:border-blue-300'
                                                        }`}
                                                >
                                                    {size}px
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Font Color */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 w-20">{c.fontColor}:</span>
                                        <input
                                            type="color"
                                            value={fontColor}
                                            onChange={(e) => setFontColor(e.target.value)}
                                            className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={fontColor}
                                            onChange={(e) => setFontColor(e.target.value)}
                                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                                        />
                                    </div>

                                    {/* Stroke */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 w-20">{c.stroke}:</span>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={strokeEnabled}
                                                onChange={(e) => setStrokeEnabled(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">
                                                {isZh ? '启用描边' : 'Enable stroke'}
                                            </span>
                                        </label>
                                    </div>

                                    {strokeEnabled && (
                                        <>
                                            <div className="flex items-center gap-4 ml-24">
                                                <span className="text-sm text-gray-600">{c.strokeColor}:</span>
                                                <input
                                                    type="color"
                                                    value={strokeColor}
                                                    onChange={(e) => setStrokeColor(e.target.value)}
                                                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                                                />
                                                <span className="text-sm text-gray-600">{c.strokeWidth}:</span>
                                                <select
                                                    value={strokeWidth}
                                                    onChange={(e) => setStrokeWidth(Number(e.target.value))}
                                                    className="px-3 py-1.5 border border-gray-300 rounded-lg"
                                                >
                                                    {[1, 2, 3, 4, 5].map(w => (
                                                        <option key={w} value={w}>{w}px</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {/* Background Strip */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 w-20">{c.bgStrip}:</span>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={bgStrip}
                                                onChange={(e) => setBgStrip(e.target.checked)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-500">{c.bgStripHint}</span>
                                        </label>
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
                                onClick={processText}
                                disabled={phase === 'processing' || phase === 'encoding' || isLoading || !text.trim()}
                                className="w-full py-5 bg-gray-900 hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                            >
                                {(phase === 'processing' || phase === 'encoding' || phase === 'loading_engine') ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        {c.processing}
                                    </>
                                ) : (
                                    <>
                                        <Type className="w-6 h-6" />
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
                                alt="Text overlay result"
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
                                download={`text-overlay.${output.format}`}
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                {c.download}
                            </a>
                            <button
                                onClick={() => { setOutput(null); setPhase('idle'); }}
                                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                            >
                                {isZh ? '修改文字' : 'Edit Text'}
                            </button>
                            <button
                                onClick={() => { setOutput(null); setFile(null); setFileInfo(null); setPhase('idle'); setText(''); }}
                                className="px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                            >
                                {c.another}
                            </button>
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
                            { q: '可以添加多行文字吗？', a: '可以，在文本框中输入换行即可显示多行文字。' },
                            { q: '为什么文字模糊？', a: '尝试增大字号，或使用更粗的描边。输出格式选择 WebP 通常比 GIF 更清晰。' },
                            { q: '支持中文字符吗？', a: '支持基本中文字符。由于 FFmpeg WASM 字体限制，某些特殊字符可能无法正确显示。' },
                            { q: '会添加水印吗？', a: '不会，导出的文件完全无水印。' },
                            { q: '文件会上传到服务器吗？', a: '不会，所有处理都在浏览器本地完成。' },
                            { q: '处理后文件会变大吗？', a: '添加文字后文件大小可能略有变化，取决于文字内容和样式设置。' },
                        ] : [
                            { q: 'Can I add multiple lines of text?', a: 'Yes, simply press Enter in the text box to create multiple lines.' },
                            { q: 'Why is the text blurry?', a: 'Try increasing font size or stroke width. WebP output is usually sharper than GIF.' },
                            { q: 'Are non-English characters supported?', a: 'Basic international characters are supported. Due to FFmpeg WASM font limitations, some special characters may not display correctly.' },
                            { q: 'Do you add a watermark?', a: 'No, exports are completely watermark-free.' },
                            { q: 'Are files uploaded to a server?', a: 'No, all processing happens locally in your browser.' },
                            { q: 'Will file size increase?', a: 'File size may change slightly after adding text, depending on text content and style settings.' },
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
                            { href: '/gif-canvas', label: isZh ? 'GIF 画布' : 'GIF Canvas' },
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

export default AddTextToGifPage;
