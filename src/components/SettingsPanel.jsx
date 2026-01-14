import React, { useState, useMemo, useEffect } from 'react';
import { Settings, ChevronDown, ChevronUp, Zap, Sparkles, Crown, Rocket, Maximize, HardDrive, Twitter, Star, Monitor, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const QUALITY_PRESETS = [
    { id: 'web', width: 1280, icon: Zap, descKey: '1280px' },
    { id: 'hd', width: 1920, icon: Sparkles, descKey: '1920px' },
    { id: 'full_hd', width: 2560, icon: Crown, descKey: '2560px' },
    { id: 'ultra', width: 4000, icon: Rocket, descKey: '4000px' },
    { id: 'original', width: 0, icon: Maximize, descKey: 'original' },
];

// Video quick presets
const VIDEO_PRESETS = [
    {
        id: 'social',
        icon: Twitter,
        fps: 10,
        width: 1280,
        compression: 'light',
        dither: 'bayer',
        loop: 0
    },
    {
        id: 'highQuality',
        icon: Star,
        fps: 24,
        width: 0, // original
        compression: 'none',
        dither: 'floyd_steinberg',
        loop: 0
    },
    {
        id: 'tutorial',
        icon: Monitor,
        fps: 10,
        width: 1920,
        compression: 'light',
        dither: 'none',
        loop: 1
    },
    {
        id: 'smallFile',
        icon: Package,
        fps: 5,
        width: 1280,
        compression: 'medium',
        dither: 'bayer',
        loop: 3
    }
];

// Parameter hints configuration
const getParamHint = (param, value, t) => {
    const hints = {
        dither: {
            'bayer': t('hints.dither.bayer'),
            'floyd_steinberg': t('hints.dither.floydSteinberg'),
            'sierra2': t('hints.dither.sierra2'),
            'sierra2_4a': t('hints.dither.sierra2Lite'),
            'none': t('hints.dither.none')
        },
        compression: {
            'none': t('hints.compression.none'),
            'light': t('hints.compression.light'),
            'medium': t('hints.compression.medium'),
            'heavy': t('hints.compression.heavy')
        },
        loop: {
            0: t('hints.loop.infinite'),
            1: t('hints.loop.once'),
            3: t('hints.loop.thrice'),
            default: t('hints.loop.default')
        }
    };

    if (param === 'loop') {
        return hints.loop[value] || hints.loop.default;
    }
    return hints[param]?.[value] || '';
};

const estimateFileSize = (width, height, frameCount) => {
    if (!width || !height || !frameCount) return null;
    const bytesPerPixelPerFrame = 0.27;
    const estimatedBytes = width * height * frameCount * bytesPerPixelPerFrame;

    if (estimatedBytes < 1024) return `~${Math.round(estimatedBytes)} B`;
    if (estimatedBytes < 1024 * 1024) return `~${(estimatedBytes / 1024).toFixed(1)} KB`;
    if (estimatedBytes < 1024 * 1024 * 1024) return `~${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
    return `~${(estimatedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const SettingsPanel = ({
    settings,
    onSettingsChange,
    imageCount = 0,
    originalDimensions = null,
    inputMode = 'images',
    videoFps = 10,
    onVideoFpsChange,
    onVideoPresetApply
}) => {
    const { t } = useLanguage();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState('hd');
    const [activeVideoPreset, setActiveVideoPreset] = useState(null);

    // Calculate frame delay from FPS for video mode
    const calculatedFrameDelay = useMemo(() => {
        return Math.round(1000 / videoFps);
    }, [videoFps]);

    // Apply video mode defaults when switching to video mode
    useEffect(() => {
        if (inputMode === 'video') {
            // Set video-appropriate defaults if not already set
            const videoDefaults = {};
            if (settings.compression === undefined || settings.compression === 'none') {
                videoDefaults.compression = 'light';
            }
            if (settings.loop === undefined || settings.loop === 0) {
                videoDefaults.loop = 1;
            }
            if (Object.keys(videoDefaults).length > 0) {
                onSettingsChange({ ...settings, ...videoDefaults });
            }
        }
    }, [inputMode]);

    const handleChange = (key, value) => {
        setActiveVideoPreset(null); // Clear preset selection when manually changing
        onSettingsChange({ ...settings, [key]: value });
    };

    const handlePresetChange = (presetId) => {
        setSelectedPreset(presetId);
        setActiveVideoPreset(null);
        const preset = QUALITY_PRESETS.find(p => p.id === presetId);
        if (preset) {
            if (presetId === 'original' && originalDimensions) {
                handleChange('width', originalDimensions.width);
            } else if (preset.width > 0) {
                handleChange('width', preset.width);
            }
        }
    };

    const handleVideoPresetApply = (preset) => {
        setActiveVideoPreset(preset.id);

        // Determine width
        let width = preset.width;
        if (preset.width === 0 && originalDimensions) {
            width = originalDimensions.width;
            setSelectedPreset('original');
        } else {
            const qualityPreset = QUALITY_PRESETS.find(p => p.width === preset.width);
            if (qualityPreset) {
                setSelectedPreset(qualityPreset.id);
            }
        }

        // Apply all settings
        onSettingsChange({
            ...settings,
            width: width || settings.width,
            compression: preset.compression,
            dither: preset.dither,
            loop: preset.loop,
            crossfadeEnabled: preset.loop === 0 ? settings.crossfadeEnabled : false
        });

        // Apply FPS change
        if (onVideoFpsChange) {
            onVideoFpsChange(preset.fps);
        }

        // Notify parent
        if (onVideoPresetApply) {
            onVideoPresetApply(preset);
        }
    };

    const estimatedHeight = useMemo(() => {
        if (originalDimensions) {
            return Math.round(settings.width * (originalDimensions.height / originalDimensions.width));
        }
        return settings.height || Math.round(settings.width * (2 / 3));
    }, [settings.width, settings.height, originalDimensions]);

    const estimatedSize = useMemo(() => {
        return estimateFileSize(settings.width, estimatedHeight, imageCount);
    }, [settings.width, estimatedHeight, imageCount]);

    // Show crossfade only when loop is infinite (0)
    const showCrossfade = settings.loop === 0 || settings.loop === undefined;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-700">{t('steps.configure')}</h3>
                </div>

                {imageCount > 0 && estimatedSize && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
                        <HardDrive className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-500">
                            Size: <span className="text-blue-600 font-medium">{estimatedSize}</span>
                        </span>
                        <span className="text-xs text-gray-400 font-mono hidden sm:inline-block">
                            ({settings.width}×{estimatedHeight}, {imageCount} frames)
                        </span>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-8">
                {/* Video Quick Presets - Only shown in video mode */}
                {inputMode === 'video' && (
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700">{t('settings.quickPresets')}</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {VIDEO_PRESETS.map((preset) => {
                                const Icon = preset.icon;
                                const isActive = activeVideoPreset === preset.id;

                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => handleVideoPresetApply(preset)}
                                        className={`p-3 rounded-xl border transition-all text-left group ${isActive
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                            <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                                {t(`presets.video.${preset.id}.name`)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t(`presets.video.${preset.id}.desc`)}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                        {activeVideoPreset && (
                            <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border-l-4 border-green-400">
                                ✓ {t('settings.presetApplied', { name: t(`presets.video.${activeVideoPreset}.name`) })}
                            </p>
                        )}
                    </div>
                )}

                {inputMode === 'video' && <div className="h-px bg-gray-100" />}

                {/* Quality Presets */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700">{t('settings.quality')}</label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {QUALITY_PRESETS.map((preset) => {
                            const Icon = preset.icon;
                            const isActive = selectedPreset === preset.id;
                            const isOriginal = preset.id === 'original';
                            const hasOriginal = originalDimensions && originalDimensions.width > 0;

                            return (
                                <button
                                    key={preset.id}
                                    onClick={() => handlePresetChange(preset.id)}
                                    disabled={isOriginal && !hasOriginal}
                                    className={`p-3 rounded-xl border transition-all text-left group ${isActive
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                        } ${isOriginal && !hasOriginal ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                >
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                        <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                            {preset.id === 'web' ? 'Web' :
                                                preset.id === 'hd' ? 'HD' :
                                                    preset.id === 'full_hd' ? '2K' :
                                                        preset.id === 'ultra' ? '4K' :
                                                            t('settings.auto')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {isOriginal && hasOriginal
                                            ? `${originalDimensions.width}×${originalDimensions.height}`
                                            : preset.descKey
                                        }
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="h-px bg-gray-100" />

                {/* Basic Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {/* Frame Delay - Different display for video vs image mode */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">{t('settings.delay')}</label>
                        {inputMode === 'video' ? (
                            // Video mode: Read-only, auto-calculated
                            <div>
                                <div className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-mono flex items-center justify-between">
                                    <span>{calculatedFrameDelay}</span>
                                    <span className="text-gray-400 text-sm">ms</span>
                                </div>
                                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded mt-2 border-l-4 border-blue-400">
                                    {t('settings.delayAutoCalculated')}
                                </p>
                            </div>
                        ) : (
                            // Image mode: Editable
                            <div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={settings.delay}
                                        onChange={(e) => handleChange('delay', parseInt(e.target.value) || 100)}
                                        min="10"
                                        max="5000"
                                        step="10"
                                        className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-12 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">ms</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Lower = faster. 500ms = 2 fps.</p>
                            </div>
                        )}
                    </div>

                    {/* Custom Width - Hidden in video mode (use presets) */}
                    {inputMode !== 'video' && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">{t('settings.width')}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={settings.width}
                                    onChange={(e) => {
                                        handleChange('width', parseInt(e.target.value) || 800);
                                        setSelectedPreset('custom');
                                    }}
                                    className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-12 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                                    placeholder="e.g. 1920"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">px</span>
                            </div>
                        </div>
                    )}

                    {/* Loop Count */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">{t('settings.loop')}</label>
                        <select
                            value={settings.loop ?? (inputMode === 'video' ? 1 : 0)}
                            onChange={(e) => handleChange('loop', parseInt(e.target.value))}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                        >
                            <option value={0}>{t('settings.loopInfinite')}</option>
                            <option value={1}>1 {t('settings.loopTimes')}</option>
                            <option value={2}>2 {t('settings.loopTimes')}</option>
                            <option value={3}>3 {t('settings.loopTimes')}</option>
                            <option value={5}>5 {t('settings.loopTimes')}</option>
                            <option value={10}>10 {t('settings.loopTimes')}</option>
                        </select>
                        {getParamHint('loop', settings.loop ?? (inputMode === 'video' ? 1 : 0), t) && (
                            <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded border-l-4 border-blue-400">
                                {getParamHint('loop', settings.loop ?? (inputMode === 'video' ? 1 : 0), t)}
                            </p>
                        )}
                    </div>

                    {/* Dithering */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">{t('settings.dither')}</label>
                        <select
                            value={settings.dither ?? 'bayer'}
                            onChange={(e) => handleChange('dither', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                        >
                            <option value="bayer">Bayer (Recommended)</option>
                            <option value="floyd_steinberg">Floyd-Steinberg (Smooth)</option>
                            <option value="sierra2">Sierra2</option>
                            <option value="sierra2_4a">Sierra2 Lite</option>
                            <option value="none">None</option>
                        </select>
                        {getParamHint('dither', settings.dither ?? 'bayer', t) && (
                            <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded border-l-4 border-blue-400">
                                {getParamHint('dither', settings.dither ?? 'bayer', t)}
                            </p>
                        )}
                    </div>

                    {/* Fill Color */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">{t('settings.fillColor')}</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleChange('fillColor', 'black')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${(settings.fillColor ?? 'black') === 'black'
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="w-4 h-4 rounded bg-black border border-gray-300" />
                                <span className="text-sm text-gray-700">{t('settings.fillBlack')}</span>
                            </button>
                            <button
                                onClick={() => handleChange('fillColor', 'white')}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all ${settings.fillColor === 'white'
                                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="w-4 h-4 rounded bg-white border border-gray-300" />
                                <span className="text-sm text-gray-700">{t('settings.fillWhite')}</span>
                            </button>
                        </div>
                    </div>

                    {/* GIF Compression */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">{t('settings.compression') || 'Compression'}</label>
                        <select
                            value={settings.compression ?? (inputMode === 'video' ? 'light' : 'none')}
                            onChange={(e) => handleChange('compression', e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                        >
                            <option value="none">{t('settings.compressionNone') || 'None (Best Quality)'}</option>
                            <option value="light">{t('settings.compressionLight') || 'Light (128 colors)'}</option>
                            <option value="medium">{t('settings.compressionMedium') || 'Medium (128 colors, lower fps)'}</option>
                            <option value="heavy">{t('settings.compressionHeavy') || 'Heavy (64 colors, lowest fps)'}</option>
                        </select>
                        {getParamHint('compression', settings.compression ?? (inputMode === 'video' ? 'light' : 'none'), t) && (
                            <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded border-l-4 border-blue-400">
                                {getParamHint('compression', settings.compression ?? (inputMode === 'video' ? 'light' : 'none'), t)}
                            </p>
                        )}
                    </div>

                    {/* Crossfade Toggle - Only show when loop is infinite */}
                    {showCrossfade && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">{t('settings.crossfade')}</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleChange('crossfadeEnabled', !settings.crossfadeEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.crossfadeEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${settings.crossfadeEnabled ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                                <span className="text-sm text-gray-500">
                                    {settings.crossfadeEnabled ? 'On' : 'Off'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">{t('settings.crossfadeHint')}</p>
                        </div>
                    )}

                    {/* Crossfade Frames (only shown when enabled and loop is infinite) */}
                    {showCrossfade && settings.crossfadeEnabled && (
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">{t('settings.crossfadeFrames')}</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="3"
                                    max="15"
                                    value={Math.min(settings.crossfadeFrames ?? 10, 15)}
                                    onChange={(e) => handleChange('crossfadeFrames', parseInt(e.target.value))}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <span className="w-12 text-sm font-mono text-gray-600 text-center bg-gray-100 rounded px-2 py-1">
                                    {Math.min(settings.crossfadeFrames ?? 10, 15)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400">More frames = smoother transition, longer processing</p>

                            {/* Performance warning for high resolution + crossfade */}
                            {settings.width > 2000 && (
                                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">
                                    ⚠️ High resolution ({settings.width}px) + crossfade may be slow. Consider using 2K or lower for faster generation.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Advanced Toggle */}
                <div className="pt-2">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium"
                    >
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {showAdvanced ? 'Hide Advanced Settings' : 'Advanced Settings'}
                    </button>
                </div>

                {/* Advanced Settings */}
                {showAdvanced && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                            <p>
                                <strong>Note:</strong> Very high resolutions (4000+px) may cause browser memory issues.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Custom FFmpeg Filter Chain</label>
                            <textarea
                                value={settings.customFilter || ''}
                                onChange={(e) => handleChange('customFilter', e.target.value)}
                                placeholder="e.g. split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"
                                className="w-full h-24 bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-gray-600 font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPanel;
