import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Loader2, PlayCircle, RefreshCcw } from 'lucide-react';
import { fetchFile } from '@ffmpeg/util';
import Layout from './Layout';
import DragDropZone from './DragDropZone';
import ImageList from './ImageList';
import ToolTabs from './ToolTabs';
import TrustSection from './TrustSection';
import OverlaySettings from './OverlaySettings';
import { useFFmpeg } from '../hooks/useFFmpeg';
import { useLanguage } from '../contexts/LanguageContext';
import { formatBytes } from '../utils/formatUtils';
import { getImageDimensions } from '../utils/imageUtils';
import { getDefaultOverlayConfig, buildOverlayFilterComplex } from '../utils/overlayHelper';

const presets = [
    { id: 'social', label: 'Social', resolution: '720p', fps: 24, duration: 0.5 },
    { id: 'tutorial', label: 'Tutorial', resolution: '1080p', fps: 15, duration: 1 },
    { id: 'small', label: 'Small File', resolution: '720p', fps: 12, duration: 0.5 },
    { id: 'ultra', label: 'Ultra Quality', resolution: '1080p', fps: 30, duration: 0.5 },
];

const durationOptions = [
    { value: 0.2, label: '0.2s' },
    { value: 0.5, label: '0.5s' },
    { value: 1, label: '1s' },
    { value: 2, label: '2s' },
];

const fpsOptions = [
    { value: 'auto', label: 'Auto' },
    { value: 12, label: '12 fps' },
    { value: 15, label: '15 fps' },
    { value: 24, label: '24 fps' },
    { value: 30, label: '30 fps' },
];

const resolutionOptions = [
    { value: 'auto', label: 'Auto' },
    { value: '720p', label: '720p' },
    { value: '1080p', label: '1080p' },
];

const phaseProgress = {
    idle: 0,
    loading_engine: 10,
    preparing: 25,
    encoding: 70,
    finalizing: 100,
    success: 100,
    error: 100,
};

const makeEven = (value) => (value % 2 === 0 ? value : value + 1);

const ImageToMp4Page = () => {
    const { ffmpeg, loaded, load, isLoading } = useFFmpeg();
    const { language } = useLanguage();
    const isZh = language === 'zh';
    const copy = {
        en: {
            title: 'Image to MP4',
            sub: 'Turn images into MP4 locally. Secure, no uploads.',
            presetsTitle: 'Quick presets',
            settingsTitle: 'Configure',
            uploadTitle: '1) Add images',
            presetLabels: {
                social: 'Social · 720p · 24fps · 0.5s',
                tutorial: 'Tutorial · 1080p · 15fps · 1s',
                small: 'Small File · 720p · 12fps · 0.5s',
                ultra: 'Ultra · 1080p · 30fps · 0.5s',
            },
            resolution: 'Resolution',
            fill: 'Fill color',
            fps: 'FPS',
            duration: 'Duration per image',
            convert: 'Convert to MP4',
            reset: 'Reset',
            progress: {
                loading: 'Loading conversion engine (~30MB, cached)…',
                prep: 'Preparing images and timeline…',
                encode: 'Encoding video…',
                final: 'Finalizing output…',
            },
            errorHint: 'Conversion failed. Try fewer images, lower resolution, or a smaller fps.',
            framesTitle: 'Frames & order',
            framesNote: 'Per-frame edit/delay is disabled here; reorder or replace images if needed.',
            result: 'Result',
            success: 'Success',
            download: 'Download MP4',
            another: 'Make another',
            faqTitle: 'FAQ: Image to MP4',
            related: 'Related Tools',
            size: 'Size',
            resolutionLabel: 'Resolution',
            durationLabel: 'Duration',
        },
        zh: {
            title: '图片转 MP4',
            sub: '纯前端多图合成 MP4，保护隐私，无水印。',
            presetsTitle: '快速预设',
            settingsTitle: '参数设置',
            uploadTitle: '1) 添加图片',
            presetLabels: {
                social: '社交 · 720p · 24fps · 0.5s',
                tutorial: '教程 · 1080p · 15fps · 1s',
                small: '小文件 · 720p · 12fps · 0.5s',
                ultra: '超清 · 1080p · 30fps · 0.5s',
            },
            resolution: '分辨率',
            fill: '填充颜色',
            fps: 'FPS',
            duration: '单张时长',
            convert: '转换为 MP4',
            reset: '重置',
            progress: {
                loading: '正在加载转换引擎（约 30MB，缓存后更快）…',
                prep: '准备图片与时间轴…',
                encode: '正在编码视频…',
                final: '整理输出…',
            },
            errorHint: '转换失败，请减少图片、降低分辨率或帧率后再试。',
            framesTitle: '帧列表与顺序',
            framesNote: '此工具不支持逐帧编辑/时长，可通过重新排序或替换图片来调整。',
            result: '结果',
            success: '完成',
            download: '下载 MP4',
            another: '再做一个',
            faqTitle: '常见问题：图片转 MP4',
            related: '相关工具',
            size: '大小',
            resolutionLabel: '分辨率',
            durationLabel: '时长',
        },
    };
    const c = copy[isZh ? 'zh' : 'en'];

    const [images, setImages] = useState([]);
    const [settings, setSettings] = useState({
        resolution: 'auto',
        fps: 24,
        duration: 0.5,
        fillColor: 'black',
        preset: 'social',
    });
    const [phase, setPhase] = useState('idle');
    const [progressText, setProgressText] = useState('');
    const [error, setError] = useState(null);
    const [output, setOutput] = useState(null);
    const [overlayConfig, setOverlayConfig] = useState(getDefaultOverlayConfig);
    const outputUrlRef = useRef(null);

    useEffect(() => () => {
        if (outputUrlRef.current) {
            URL.revokeObjectURL(outputUrlRef.current);
        }
    }, []);

    const handleFilesSelected = useCallback((files) => {
        const mapped = files.map((file) => ({
            id: crypto.randomUUID(),
            file,
            preview: URL.createObjectURL(file),
        }));
        setImages((prev) => [...prev, ...mapped]);
    }, []);

    const handleReorder = useCallback((newOrder) => setImages(newOrder), []);
    const handleRemove = useCallback(
        (id) => setImages((prev) => prev.filter((img) => img.id !== id)),
        [],
    );

    const handleClear = () => {
        images.forEach((img) => URL.revokeObjectURL(img.preview));
        setImages([]);
        setOutput(null);
        if (outputUrlRef.current) {
            URL.revokeObjectURL(outputUrlRef.current);
            outputUrlRef.current = null;
        }
        // Clean up overlay preview
        if (overlayConfig.preview) {
            URL.revokeObjectURL(overlayConfig.preview);
            setOverlayConfig(getDefaultOverlayConfig());
        }
    };

    const applyPreset = (presetId) => {
        const found = presets.find((p) => p.id === presetId);
        if (!found) return;
        setSettings((prev) => ({
            ...prev,
            resolution: found.resolution,
            fps: found.fps,
            duration: found.duration,
            preset: found.id,
        }));
    };

    const targetFps = useMemo(
        () => (settings.fps === 'auto' ? 24 : settings.fps),
        [settings.fps],
    );

    const computeTargetResolution = async () => {
        if (settings.resolution === '720p') return { width: 1280, height: 720 };
        if (settings.resolution === '1080p') return { width: 1920, height: 1080 };

        let maxWidth = 0;
        let maxHeight = 0;
        for (const img of images) {
            const dims = await getImageDimensions(img.file);
            maxWidth = Math.max(maxWidth, dims.width);
            maxHeight = Math.max(maxHeight, dims.height);
        }
        const fallback = { width: 1280, height: 720 };
        if (!maxWidth || !maxHeight) return fallback;
        return {
            width: makeEven(maxWidth),
            height: makeEven(maxHeight),
        };
    };

    const convertImagesToMp4 = async () => {
        if (!images.length) {
            setError(isZh ? '请先添加图片。' : 'Add at least one image to convert.');
            return;
        }
        setError(null);
        setPhase('loading_engine');
        setProgressText(c.progress.loading);
        if (!loaded && !isLoading) {
            await load();
        }

        setPhase('preparing');
        setProgressText(c.progress.prep);

        const target = await computeTargetResolution();
        const writtenFiles = [];
        const hasOverlay = overlayConfig.enabled && overlayConfig.file;

        try {
            let listContent = '';
            for (let i = 0; i < images.length; i++) {
                const file = images[i].file;
                const name = `frame-${i}.png`;
                await ffmpeg.writeFile(name, await fetchFile(file));
                writtenFiles.push(name);
                listContent += `file '${name}'\n`;
                listContent += `duration ${settings.duration}\n`;
                setProgressText(isZh ? `已加入第 ${i + 1} 帧 / 共 ${images.length}` : `Queued frame ${i + 1} of ${images.length}`);
            }
            if (images.length > 0) {
                listContent += `file 'frame-${images.length - 1}.png'\n`;
            }

            await ffmpeg.writeFile('list.txt', listContent);

            // Write overlay file if enabled
            if (hasOverlay) {
                await ffmpeg.writeFile('overlay.png', await fetchFile(overlayConfig.file));
                writtenFiles.push('overlay.png');
            }

            // Build video filter
            const vfParts = [];
            if (target?.width && target?.height) {
                vfParts.push(
                    `scale=${target.width}:${target.height}:force_original_aspect_ratio=decrease`,
                );
                vfParts.push(
                    `pad=${target.width}:${target.height}:(ow-iw)/2:(oh-ih)/2:${settings.fillColor === 'white' ? 'white' : 'black'}`,
                );
            }

            const args = ['-f', 'concat', '-safe', '0', '-i', 'list.txt'];

            // Add overlay input if enabled
            if (hasOverlay) {
                args.push('-i', 'overlay.png');
                // Use filter_complex for overlay
                const overlayFilter = buildOverlayFilterComplex(target.width, overlayConfig);
                const baseFilter = vfParts.length > 0 ? `[0:v]${vfParts.join(',')}[base];[base]` : '[0:v]';
                // Rebuild filter with overlay
                const fullFilter = vfParts.length > 0
                    ? `[0:v]${vfParts.join(',')}[base];${overlayFilter.replace('[0:v]', '[base]')}`
                    : overlayFilter;
                args.push('-filter_complex', fullFilter);
            } else if (vfParts.length) {
                args.push('-vf', vfParts.join(','));
            }

            args.push(
                '-r',
                String(targetFps),
                '-vsync',
                'vfr',
                '-c:v',
                'libx264',
                '-pix_fmt',
                'yuv420p',
                '-movflags',
                '+faststart',
                '-preset',
                'veryfast',
                '-y',
                'output.mp4',
            );

            setPhase('encoding');
            setProgressText(c.progress.encode);
            await ffmpeg.exec(args);

            setPhase('finalizing');
            setProgressText(c.progress.final);

            const data = await ffmpeg.readFile('output.mp4');
            const blob = new Blob([data], { type: 'video/mp4' });
            if (outputUrlRef.current) {
                URL.revokeObjectURL(outputUrlRef.current);
            }
            const url = URL.createObjectURL(blob);
            outputUrlRef.current = url;
            setOutput({
                url,
                size: data.length,
                resolution: `${target.width}x${target.height}`,
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
            const cleanup = [...writtenFiles, 'list.txt', 'output.mp4'];
            for (const file of cleanup) {
                try {
                    await ffmpeg.deleteFile(file);
                } catch {
                    // ignore
                }
            }
        }
    };

    const progressValue = phaseProgress[phase] ?? 0;

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

                <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">{c.uploadTitle}</h2>
                    <p className="text-sm text-gray-600">
                        JPG / PNG / WebP. {isZh ? '建议总量 <100MB。' : 'Stay under ~100MB for best stability.'}
                    </p>
                    <DragDropZone onFilesSelected={handleFilesSelected} />
                </section>

                {images.length > 0 && (
                    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">{c.framesTitle}</h2>
                            <span className="text-sm text-gray-500">{images.length} file(s)</span>
                        </div>
                        <p className="text-sm text-gray-500">{c.framesNote}</p>
                        <ImageList
                            images={images}
                            onRemove={handleRemove}
                            onReorder={handleReorder}
                            onOpenEditor={() => { }}
                            onDelayChange={() => { }}
                            globalDelay={settings.duration * 1000}
                            allowEdit={false}
                            allowDelay={false}
                        />
                    </section>
                )}

                <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-3">
                    <h2 className="text-xl font-bold text-gray-900">{c.presetsTitle}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {presets.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => applyPreset(preset.id)}
                                className={`p-3 rounded-lg border text-left transition-all ${settings.preset === preset.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 bg-gray-50 hover:border-blue-300'}`}
                            >
                                <div className="font-semibold text-gray-900">
                                    {isZh
                                        ? (preset.id === 'social' ? '社交' :
                                            preset.id === 'tutorial' ? '教程' :
                                                preset.id === 'small' ? '小文件' : '超清')
                                        : preset.label}
                                </div>
                                <p className="text-xs text-gray-500">
                                    {c.presetLabels[preset.id]}
                                </p>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">{c.settingsTitle}</h2>
                        <span className="text-xs text-gray-500">{isZh ? '支持自动适配或指定常用分辨率' : 'Auto detect or pick common outputs'}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">{c.resolution}</label>
                            <div className="flex gap-2 flex-wrap">
                                {resolutionOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => setSettings((s) => ({ ...s, resolution: option.value }))}
                                        className={`px-3 py-2 rounded-lg border text-sm ${settings.resolution === option.value
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">{c.fill}</label>
                            <div className="flex gap-2">
                                {['black', 'white'].map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setSettings((s) => ({ ...s, fillColor: color }))}
                                        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${settings.fillColor === color
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                            }`}
                                    >
                                        {color === 'black' ? (isZh ? '黑色填充' : 'Black padding') : (isZh ? '白色填充' : 'White padding')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">FPS</label>
                            <select
                                value={settings.fps}
                                onChange={(e) => setSettings((s) => ({ ...s, fps: e.target.value === 'auto' ? 'auto' : Number(e.target.value) }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {fpsOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">{c.duration}</label>
                            <select
                                value={settings.duration}
                                onChange={(e) => setSettings((s) => ({ ...s, duration: Number(e.target.value) }))}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                {durationOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* Sticker / Overlay Settings */}
                <OverlaySettings
                    config={overlayConfig}
                    onChange={setOverlayConfig}
                    disabled={phase === 'encoding'}
                />

                <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">{isZh ? '生成 MP4' : 'Generate MP4'}</h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={convertImagesToMp4}
                            disabled={phase === 'encoding' || isLoading || images.length === 0}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-gray-900 text-white font-bold text-lg hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                        >
                            {phase === 'encoding' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {isZh ? '转换中…' : 'Converting…'}
                                </>
                            ) : (
                                <>
                                    <PlayCircle className="w-5 h-5" />
                                    {c.convert}
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleClear}
                            className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                        >
                            <RefreshCcw className="w-4 h-4 inline mr-1" />
                            {c.reset}
                        </button>
                    </div>

                    {(phase !== 'idle' || isLoading) && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>{progressText}</span>
                                <span className="font-mono text-blue-600">{progressValue}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressValue}%` }}
                                />
                            </div>
                            {phase === 'error' && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    {error || c.errorHint}
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {output && (
                    <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-gray-900">{c.result}</h2>
                            <span className="text-sm text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                                {c.success}
                            </span>
                        </div>
                        <video controls className="w-full rounded-xl border border-gray-200 max-h-[400px] bg-black">
                            <source src={output.url} type="video/mp4" />
                        </video>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span>{c.size}: <strong className="text-gray-900">{formatBytes(output.size)}</strong></span>
                            {output.resolution && <span>{c.resolutionLabel}: <strong className="text-gray-900">{output.resolution}</strong></span>}
                            <span>FPS: <strong className="text-gray-900">{targetFps}</strong></span>
                            <span>{c.durationLabel}: <strong className="text-gray-900">{(images.length * settings.duration).toFixed(1)}s</strong></span>
                        </div>
                        <div className="flex gap-3">
                            <a
                                href={output.url}
                                download="image-to-mp4.mp4"
                                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                {c.download}
                            </a>
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
                        {(isZh
                            ? [
                                { q: '是否免费？', a: '是的，免费且无水印，无需注册。' },
                                { q: '会加水印吗？', a: '不会，导出的 MP4 不包含任何品牌标识。' },
                                { q: '文件会上传吗？', a: '不会，所有处理在浏览器内完成。' },
                                { q: '支持哪些格式？', a: 'JPG、PNG、WebP，混合格式也可以。' },
                                { q: '有什么限制？', a: '建议总量 <100MB、帧数几百以内以保持稳定。' },
                                { q: '为什么很慢？', a: '首次会加载约 30MB 的 FFmpeg，大图或 1080p/30fps 会更耗时。' },
                                { q: '失败怎么办？', a: '减少图片数量、降低分辨率或帧率，或关闭占资源的标签页。' },
                                { q: '如何更小？', a: '使用 720p、12-15fps、0.5s 时长或减少帧数。' },
                            ]
                            : [
                                { q: 'Is it free?', a: 'Yes. Free, no watermark, no signup.' },
                                { q: 'Do you add a watermark?', a: 'No. Exports are clean MP4 files without branding.' },
                                { q: 'Do you upload my files?', a: 'No. Processing stays in your browser via WebAssembly FFmpeg.' },
                                { q: 'What formats are supported?', a: 'JPG, PNG, and WebP work best; mixed formats are fine.' },
                                { q: 'What are the limits?', a: 'Stay under ~100MB and a few hundred frames for stability.' },
                                { q: 'Why is it slow?', a: 'First run loads FFmpeg (~30MB). Large images or 1080p/30fps take longer.' },
                                { q: 'Why did export fail?', a: 'Try fewer images, lower resolution/FPS, or close heavy tabs.' },
                                { q: 'How to make smaller videos?', a: 'Use 720p, 12-15 fps, 0.5s duration, or trim frame count.' },
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
                            { href: '/compress-mp4', label: isZh ? '压缩 MP4' : 'Compress MP4' },
                            { href: '/mp4-to-gif', label: 'MP4 to GIF' },
                            { href: '/jpg-to-gif', label: 'JPG to GIF' },
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

export default ImageToMp4Page;
