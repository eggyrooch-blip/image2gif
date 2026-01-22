import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, Play, Twitter, MessageCircle, Mail, Globe, Hash } from 'lucide-react';
import { fetchFile } from '@ffmpeg/util';
import Layout from './Layout';
import VideoDropZone from './VideoDropZone';
import VideoPreview from './VideoPreview';
import ToolTabs from './ToolTabs';
import TrustSection from './TrustSection';
import OverlaySettings from './OverlaySettings';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { getVideoMetadata, getVideoMetadataFast, formatTime } from '../utils/videoHelper';
import { useLanguage } from '../contexts/LanguageContext';
import { formatBytes } from '../utils/formatUtils';
import { getDefaultOverlayConfig, buildOverlayFilterComplex } from '../utils/overlayHelper';
import { compressGif as compressGifAction } from '../utils/ffmpegHelper';

const qualityPresets = {
    light: 24,
    medium: 28,
    heavy: 32,
};

const gifQualityPresets = {
    light: { quality: 'light' },          // 256 colors
    medium: { quality: 'medium', fps: 15 }, // 128 colors, 15fps
    heavy: { quality: 'heavy', fps: 10 }    // 64 colors, 10fps
};

const resolutionPresets = {
    keep: null,
    '1080p': 1080,
    '720p': 720,
    '480p': 480,
};

const phaseProgress = {
    idle: 0,
    loading_engine: 10,
    preparing: 25,
    encoding: 70,
    finalizing: 100,
    success: 100,
    error: 100,
};

const platformPresets = {
    custom: {
        id: 'custom',
        icon: Globe,
        label: { en: 'Custom', zh: '自定义' },
        limit: null,
        quality: 'light',
        resolution: 'keep'
    },
    twitter: {
        id: 'twitter',
        icon: Twitter,
        label: { en: 'X (Twitter)', zh: '推特 (X)' },
        limit: '15MB',
        quality: 'heavy',
        resolution: '720p',
        fps: 15, // Force reduced FPS for Twitter
        desc: { en: 'Max 15MB', zh: '最大 15MB' }
    },
    discord: {
        id: 'discord',
        icon: MessageCircle,
        label: { en: 'Discord', zh: 'Discord' },
        limit: '8MB',
        quality: 'heavy',
        resolution: '480p',
        fps: 12, // Force reduced FPS for Discord
        desc: { en: 'Max 8MB', zh: '最大 8MB' }
    },
    slack: {
        id: 'slack',
        icon: Hash,
        label: { en: 'Slack', zh: 'Slack' },
        limit: '5MB',
        quality: 'heavy',
        resolution: '480p',
        fps: 10,
        desc: { en: 'Max 5MB', zh: '最大 5MB' }
    },
    email: {
        id: 'email',
        icon: Mail,
        label: { en: 'Email', zh: '邮件 / 微信' },
        limit: '25MB',
        quality: 'medium',
        resolution: '720p',
        fps: 15,
        desc: { en: 'General usage', zh: '通用传输' }
    }
};

const CompressMp4Page = () => {
    const { ffmpeg, loaded, load, isLoading } = useFFmpeg();
    const { language } = useLanguage();
    const isZh = language === 'zh';
    const copy = {
        en: {
            title: 'Compress Video / GIF',
            sub: 'Secure, local compression in your browser. Supports MP4 and GIF.',
            uploadTitle: 'Upload MP4 or GIF',
            controlsTitle: 'Compression Settings',
            platformTitle: 'Target Platform',
            generateTitle: 'Start Compression',
            qualityLabel: 'Quality Mode',
            gifQualityLabel: 'Color Reduction',
            resolutionLabel: 'Target Resolution',
            compressCta: 'Compress Now',
            progress: {
                loading: 'Loading engine (~30MB, cached)…',
                prep: 'Preparing file…',
                encode: 'Encoding…',
                final: 'Finalizing output…',
                analyzing: 'Analyzing colors…',
            },
            errorHint: 'Compression failed. Try a different preset or file.',
            resultTitle: 'Result',
            success: 'Success',
            download: 'Download',
            another: 'Compress another',
            faqTitle: 'FAQ: Compress Media',
            related: 'Related Tools',
            reduction: 'Reduction',
        },
        zh: {
            title: '视频 / GIF 压缩',
            sub: '纯前端本地压缩，支持 MP4 和 GIF，保护隐私，不上传文件。',
            uploadTitle: '上传 MP4 或 GIF',
            controlsTitle: '压缩设置',
            platformTitle: '目标平台',
            generateTitle: '开始压缩',
            qualityLabel: '质量模式',
            gifQualityLabel: '色彩缩减',
            resolutionLabel: '目标分辨率',
            compressCta: '开始压缩',
            progress: {
                loading: '正在加载引擎（约 30MB，缓存后更快）…',
                prep: '准备文件…',
                encode: '正在压缩…',
                final: '整理输出…',
                analyzing: '分析颜色…',
            },
            errorHint: '压缩失败，请尝试其他设置或文件。',
            resultTitle: '结果',
            success: '完成',
            download: '下载文件',
            another: '再压一个',
            faqTitle: '常见问题',
            related: '相关工具',
            reduction: '减少',
        },
    };
    const c = copy[isZh ? 'zh' : 'en'];

    const [videoFile, setVideoFile] = useState(null);
    const [metadata, setMetadata] = useState(null);
    const [phase, setPhase] = useState('idle');
    const [progressText, setProgressText] = useState('');
    const [platform, setPlatform] = useState('custom');
    const [quality, setQuality] = useState('light');
    const [resolution, setResolution] = useState('keep');
    const [fpsLimit, setFpsLimit] = useState(null); // New state for FPS limit
    const [error, setError] = useState(null);
    const [output, setOutput] = useState(null);
    const [overlayConfig, setOverlayConfig] = useState(getDefaultOverlayConfig);
    const outputUrlRef = useRef(null);

    useEffect(() => () => {
        if (outputUrlRef.current) {
            URL.revokeObjectURL(outputUrlRef.current);
        }
    }, []);

    const loadMetadata = useCallback(async (file) => {
        try {
            const fast = await getVideoMetadataFast(file);
            if (fast.duration || fast.width || fast.height) {
                setMetadata(fast);
                return;
            }
        } catch (e) {
            // fallback to ffmpeg path
        }
        try {
            if (!loaded && !isLoading) {
                await load();
            }
            const detailed = await getVideoMetadata(ffmpeg, file);
            setMetadata(detailed);
        } catch (e) {
            setMetadata(null);
        }
    }, [ffmpeg, load, loaded, isLoading]);


    const handlePlatformChange = (newPlatform) => {
        setPlatform(newPlatform);
        if (newPlatform !== 'custom') {
            const preset = platformPresets[newPlatform];
            setQuality(preset.quality);
            setResolution(preset.resolution);
            setFpsLimit(preset.fps || null); // Set FPS from preset
        } else {
            setFpsLimit(null);
        }
    };

    const handleVideoSelected = useCallback(
        async (file) => {
            setVideoFile(file);
            setOutput(null);
            setError(null);
            setPhase('idle');
            // Only try to load video metadata if it's a video
            if (file.type.startsWith('video')) {
                await loadMetadata(file);
            } else if (file.type === 'image/gif') {
                // Basic image metadata
                const img = new Image();
                img.onload = () => {
                    setMetadata({
                        width: img.width,
                        height: img.height,
                        duration: null // GIF duration is harder to get without parsing, skipping for now
                    });
                };
                img.src = URL.createObjectURL(file);
            }
        },
        [loadMetadata],
    );

    const handleRemove = () => {
        setVideoFile(null);
        setMetadata(null);
        setOutput(null);
        // Clean up overlay
        if (overlayConfig.preview) {
            URL.revokeObjectURL(overlayConfig.preview);
            setOverlayConfig(getDefaultOverlayConfig());
        }
        setPhase('idle');
        if (outputUrlRef.current) {
            URL.revokeObjectURL(outputUrlRef.current);
            outputUrlRef.current = null;
        }
    };

    const performCompression = async () => {
        if (!videoFile) {
            setError(isZh ? '请先上传 MP4。' : 'Upload an MP4 to compress.');
            return;
        }
        setError(null);
        setPhase('loading_engine');
        setProgressText(c.progress.loading);
        if (!loaded && !isLoading) {
            await load();
        }

        const isGif = videoFile.type === 'image/gif';

        if (isGif) {
            try {
                // Determine FPS: use platform limit -> quality preset -> none
                const qualitySettings = gifQualityPresets[quality] || gifQualityPresets.medium;
                const targetFPS = fpsLimit || qualitySettings.fps || null;

                // Parse target size from platform preset (e.g., '15MB' -> 15 * 1024 * 1024)
                const platformPreset = platformPresets[platform];
                let targetSizeBytes = null;
                if (platformPreset?.limit) {
                    const match = platformPreset.limit.match(/(\d+)\s*MB/i);
                    if (match) {
                        targetSizeBytes = parseInt(match[1], 10) * 1024 * 1024;
                    }
                }

                // Use the new compressGif action from ffmpegHelper
                const result = await compressGifAction(ffmpeg, videoFile, {
                    quality: qualitySettings.quality,
                    targetHeight: resolutionPresets[resolution] || null,
                    fps: targetFPS,
                    targetSizeBytes: targetSizeBytes  // Enable iterative compression
                }, (p) => {
                    // Map progress phases to UI state
                    if (p.phase) {
                        setPhase(p.phase === 'analyzing' ? 'encoding' : p.phase);
                        setProgressText(c.progress[p.phase] || p.text);
                    }
                });

                setOutput({
                    url: result.url,
                    size: result.size,
                    crf: null,
                    targetHeight: resolutionPresets[resolution] || metadata?.height,
                    type: 'image/gif'
                });
                setPhase('success');
            } catch (e) {
                console.error(e);
                setError(e?.message || c.errorHint);
                setPhase('error');
            }
            return;
        }

        // MP4 Compression Logic
        const inputName = `input-${videoFile.name.replace(/\s+/g, '_')}`;
        const outputName = 'compressed.mp4';
        const hasOverlay = overlayConfig.enabled && overlayConfig.file;
        const filesToCleanup = [inputName, outputName];

        try {
            setPhase('preparing');
            setProgressText(c.progress.prep);
            await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

            // Write overlay file if enabled
            if (hasOverlay) {
                await ffmpeg.writeFile('overlay.png', await fetchFile(overlayConfig.file));
                filesToCleanup.push('overlay.png');
            }

            const crf = qualityPresets[quality] ?? 28;
            const targetHeight = resolutionPresets[resolution] || null;
            const filters = [];
            if (targetHeight) {
                filters.push(`scale=-2:${targetHeight}`);
            } else {
                filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');
            }
            filters.push('setsar=1');

            const args = ['-i', inputName];

            // Add overlay input if enabled
            if (hasOverlay) {
                args.push('-i', 'overlay.png');
                // Calculate output width for overlay scaling
                const outputWidth = targetHeight
                    ? Math.round((metadata?.width || 1920) * (targetHeight / (metadata?.height || 1080)))
                    : metadata?.width || 1920;
                const overlayFilter = buildOverlayFilterComplex(outputWidth, overlayConfig);
                // Combine base filter with overlay
                const baseFilter = filters.join(',');
                const fullFilter = `[0:v]${baseFilter}[base];${overlayFilter.replace('[0:v]', '[base]')}`;
                args.push('-filter_complex', fullFilter);
            } else if (filters.length) {
                args.push('-vf', filters.join(','));
            }

            args.push(
                '-c:v',
                'libx264',
                '-preset',
                'medium',
                '-crf',
                String(crf),
                '-pix_fmt',
                'yuv420p',
                '-movflags',
                '+faststart',
                '-c:a',
                'aac',
                '-b:a',
                '128k',
                '-y',
                outputName,
            );

            setPhase('encoding');
            setProgressText(c.progress.encode);
            await ffmpeg.exec(args);

            setPhase('finalizing');
            setProgressText(c.progress.final);
            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([data], { type: 'video/mp4' });
            if (outputUrlRef.current) {
                URL.revokeObjectURL(outputUrlRef.current);
            }
            const url = URL.createObjectURL(blob);
            outputUrlRef.current = url;
            setOutput({
                url,
                size: data.length,
                crf,
                targetHeight: targetHeight || metadata?.height,
                type: 'video/mp4'
            });
            setPhase('success');
        } catch (e) {
            console.error(e);
            setError(
                e?.message ||
                c.errorHint,
            );
            setPhase('error');
        } finally {
            for (const name of filesToCleanup) {
                try {
                    await ffmpeg.deleteFile(name);
                } catch {
                    // ignore
                }
            }
        }
    };

    const progressValue = phaseProgress[phase] ?? 0;
    const compressionRate = useMemo(() => {
        if (!output?.size || !videoFile?.size) return null;
        const saved = videoFile.size - output.size;
        const percent = (saved / videoFile.size) * 100;
        return percent.toFixed(1);
    }, [output?.size, videoFile?.size]);

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-12 pb-24">
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

                {/* Step 1: Input */}
                <section className="space-y-6">
                    <VideoDropZone
                        onVideoSelected={handleVideoSelected}
                        disabled={false}
                        accept={{ 'video/mp4': ['.mp4'], 'image/gif': ['.gif'] }}
                        className="min-h-[300px] border-dashed border-2 border-gray-300 hover:border-blue-500/50 bg-gray-50/50 hover:bg-white"
                    />
                    {videoFile && (
                        <div className="animate-in fade-in zoom-in duration-300">
                            <VideoPreview
                                file={videoFile}
                                metadata={metadata}
                                thumbnailUrl={null}
                                onRemove={handleRemove}
                                isLoading={false}
                            />
                        </div>
                    )}
                </section>

                {/* Step 2: Configure */}
                <section className="space-y-6">
                    <div className="text-left border-l-4 border-blue-600 pl-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {c.controlsTitle}
                        </h2>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                            <Play className="w-4 h-4 text-gray-400" />
                            <h3 className="font-semibold text-gray-700">{c.controlsTitle}</h3>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Platform Selector */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700">{c.platformTitle}</label>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    {Object.values(platformPresets).map((p) => {
                                        const Icon = p.icon;
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => handlePlatformChange(p.id)}
                                                className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-2 group ${platform === p.id
                                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                                    }`}
                                            >
                                                <Icon className={`w-5 h-5 ${platform === p.id ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-500'}`} />
                                                <div className="text-center">
                                                    <div className={`text-xs font-semibold ${platform === p.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                                        {isZh ? p.label.zh : p.label.en}
                                                    </div>
                                                    {p.limit && (
                                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                                            {p.limit}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* Quality Mode */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700">
                                    {videoFile?.type === 'image/gif' ? c.gifQualityLabel : c.qualityLabel}
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['light', 'medium', 'heavy'].map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => {
                                                setQuality(mode);
                                                if (platform !== 'custom') {
                                                    setPlatform('custom');
                                                    setFpsLimit(null); // Clear platform FPS limit when manual change
                                                }
                                            }}
                                            className={`p-3 rounded-xl border transition-all text-left group ${quality === mode
                                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className={`text-sm font-semibold mb-1 ${quality === mode ? 'text-blue-700' : 'text-gray-700'}`}>
                                                {mode === 'light'
                                                    ? (isZh ? '轻度' : 'Light')
                                                    : mode === 'medium'
                                                        ? (isZh ? '中度' : 'Medium')
                                                        : (isZh ? '重度' : 'Heavy')}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {mode === 'light'
                                                    ? (isZh ? '平衡质量与大小' : 'Balanced quality')
                                                    : mode === 'medium'
                                                        ? (isZh ? '更小文件' : 'Smaller file')
                                                        : (isZh ? '最小文件' : 'Smallest file')}
                                            </p>
                                            {quality === mode && (
                                                <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Applied ✓</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* Resolution */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700">{c.resolutionLabel}</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {Object.keys(resolutionPresets).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setResolution(key);
                                                if (platform !== 'custom') {
                                                    setPlatform('custom');
                                                    setFpsLimit(null);
                                                }
                                            }}
                                            className={`p-3 rounded-xl border transition-all text-center group ${resolution === key
                                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <span className={`text-sm font-semibold ${resolution === key ? 'text-blue-700' : 'text-gray-700'}`}>
                                                {key === 'keep' ? (isZh ? '保持原始' : 'Keep') : key}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400">{isZh ? '降低分辨率可进一步减小文件大小' : 'Lower resolution for smaller file size'}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sticker / Overlay Settings */}
                <OverlaySettings
                    config={overlayConfig}
                    onChange={setOverlayConfig}
                    disabled={phase === 'encoding'}
                />

                {/* Step 3: Generate Action */}
                <section className="space-y-6">
                    <div className="pt-4 sticky bottom-6 z-40 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 ring-1 ring-gray-900/5">
                        <button
                            onClick={performCompression}
                            disabled={!videoFile || phase === 'encoding' || isLoading}
                            className="w-full py-5 bg-gray-900 hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
                        >
                            {phase === 'encoding' ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    {isZh ? '压缩中…' : 'Compressing…'}
                                </>
                            ) : (
                                <>
                                    <Play className="w-6 h-6" />
                                    {!videoFile ? (isZh ? '请先上传文件' : 'Upload file first') : c.compressCta}
                                </>
                            )}
                        </button>

                        {/* Progress Indicator */}
                        {(phase !== 'idle' || isLoading) && (
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-700">{progressText}</span>
                                    <span className="font-mono text-blue-600 font-bold">{progressValue}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
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
                </section>

                {/* Step 4: Result */}
                {output && (
                    <section className="scroll-mt-24 space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold text-gray-900">
                                {c.resultTitle}
                            </h2>
                            <p className="text-green-600 font-medium mt-2">
                                ✨ {c.success}
                            </p>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                            {output.type === 'image/gif' ? (
                                <img src={output.url} alt="Result" className="w-full rounded-xl border border-gray-200 max-h-[400px] object-contain bg-black/5" />
                            ) : (
                                <video controls className="w-full rounded-xl border border-gray-200 max-h-[400px] bg-black">
                                    <source src={output.url} type="video/mp4" />
                                </video>
                            )}
                            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600">
                                <span>{isZh ? '原始' : 'Original'}: <strong className="text-gray-900">{formatBytes(videoFile.size)}</strong></span>
                                <span>{isZh ? '压缩后' : 'Compressed'}: <strong className="text-gray-900">{formatBytes(output.size)}</strong></span>
                                {compressionRate && (
                                    <span>{c.reduction}: <strong className="text-gray-900">{compressionRate}%</strong></span>
                                )}
                                {metadata?.duration && (
                                    <span>{isZh ? '时长' : 'Duration'}: <strong className="text-gray-900">{formatTime(metadata.duration)}</strong></span>
                                )}
                                {metadata?.width && (
                                    <span>{isZh ? '分辨率' : 'Resolution'}: <strong className="text-gray-900">
                                        {resolution === 'keep'
                                            ? `${metadata.width}x${metadata.height}`
                                            : `${Math.round(metadata.width / metadata.height * (resolutionPresets[resolution] || metadata.height))}x${resolutionPresets[resolution] || metadata.height}`}
                                    </strong></span>
                                )}
                            </div>
                            <div className="flex gap-3 justify-center">
                                <a
                                    href={output.url}
                                    download={output.type === 'image/gif' ? "compressed.gif" : "compressed.mp4"}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                                >
                                    <Download className="w-4 h-4" />
                                    {c.download}
                                </a>
                                <button
                                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold"
                                >
                                    {c.another}
                                </button>
                            </div>
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
                        {(isZh
                            ? [
                                { q: '是否免费？', a: '是的，免费且无水印，无需注册。' },
                                { q: '会加水印吗？', a: '不会，导出的 MP4 不包含任何品牌标识。' },
                                { q: '视频/GIF 会上传吗？', a: '不会，压缩在浏览器内完成。' },
                                { q: '质量为何下降？', a: 'MP4 增大CRF值或 GIF 减少色彩数都会以牺牲细节换取更小体积。' },
                                { q: '该用哪个档位？', a: '轻度平衡，中度更小，重度最小，可配合 720p/480p。' },
                                { q: '有什么限制？', a: '建议时长 <60 秒；大型文件可尝试降低分辨率。' },
                                { q: '为什么很慢？', a: '首次加载 FFmpeg (~30MB)，高分辨率/长视频编码时间更久。' },
                                { q: '如何更小？', a: '选重度 + 720p/480p，或提前裁短视频。' },
                            ]
                            : [
                                { q: 'Is it free?', a: 'Yes. Free to use with no watermark or account.' },
                                { q: 'Do you add a watermark?', a: 'No watermark or branding is added.' },
                                { q: 'Do you upload my file?', a: 'No. Compression runs locally via WebAssembly FFmpeg.' },
                                { q: 'Why does quality drop?', a: 'Higher CRF (MP4) or fewer colors (GIF) reduces detail to save space.' },
                                { q: 'Which preset should I use?', a: 'Light for balance, Medium for smaller files, Heavy for the smallest output.' },
                                { q: 'What are the limits?', a: 'Best results with videos/GIFs under ~60s. Large files may need lower resolution.' },
                                { q: 'Why is it slow?', a: 'First load downloads FFmpeg (~30MB). Encoding large files takes longer in-browser.' },
                                { q: 'How to get smaller files?', a: 'Pick Heavy + 720p/480p, trim duration before upload, or reduce source bitrate.' },
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
                            { href: '/video-to-gif', label: isZh ? '视频转 GIF' : 'Video to GIF' },
                            { href: '/image-to-mp4', label: isZh ? '图片转 MP4' : 'Image to MP4' },
                            { href: '/mp4-to-gif', label: 'MP4 to GIF' },
                            { href: '/png-to-gif', label: 'PNG to GIF' },
                            { href: '/compress-gif', label: 'Compress GIF' },
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

export default CompressMp4Page;
