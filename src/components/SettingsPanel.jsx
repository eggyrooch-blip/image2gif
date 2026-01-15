import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Settings, ChevronDown, ChevronUp, Zap, Sparkles, Crown, Rocket, Maximize, HardDrive, Twitter, Star, Monitor, Package, Image, FileImage, MessageCircle, Hash, Send, Mail, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

// Output format options
const OUTPUT_FORMATS = [
    { id: 'gif', label: 'GIF', icon: Image, descKey: 'outputFormat.gifDesc' },
    { id: 'webp', label: 'WebP', icon: FileImage, descKey: 'outputFormat.webpDesc' },
    { id: 'apng', label: 'APNG', icon: FileImage, descKey: 'outputFormat.apngDesc' },
];

// Platform presets for social media optimization - result-oriented descriptions
const PLATFORM_PRESETS = [
    {
        id: 'twitter',
        icon: Twitter,
        name: 'X (Twitter)',
        nameKey: 'platforms.twitter.name',
        descKey: 'platforms.twitter.desc',
        resultDesc: 'Sharp + smooth playback',
        resultDescKey: 'presets.platform.twitter.resultDesc',
        settings: {
            qualityId: 'hd',
            delay: 120,
            compression: 'light',
            dither: 'bayer',
            loop: 0,
            outputFormat: 'gif'
        }
    },
    {
        id: 'discord',
        icon: MessageCircle,
        name: 'Discord (8MB)',
        nameKey: 'platforms.discord.name',
        descKey: 'platforms.discord.desc',
        resultDesc: 'Optimized for size limit',
        resultDescKey: 'presets.platform.discord.resultDesc',
        settings: {
            qualityId: 'web',
            delay: 180,
            compression: 'medium',
            dither: 'bayer',
            loop: 0,
            outputFormat: 'gif'
        }
    },
    {
        id: 'slack',
        icon: Hash,
        name: 'Slack (5MB)',
        nameKey: 'platforms.slack.name',
        descKey: 'platforms.slack.desc',
        resultDesc: 'Smaller file by default',
        resultDescKey: 'presets.platform.slack.resultDesc',
        settings: {
            qualityId: 'web',
            delay: 180,
            compression: 'heavy',
            dither: 'bayer',
            loop: 0,
            outputFormat: 'gif'
        }
    },
    {
        id: 'telegram',
        icon: Send,
        name: 'Telegram',
        nameKey: 'platforms.telegram.name',
        descKey: 'platforms.telegram.desc',
        resultDesc: 'Prefer WebP when possible',
        resultDescKey: 'presets.platform.telegram.resultDesc',
        settings: {
            qualityId: 'hd',
            delay: 150,
            compression: 'light',
            dither: 'bayer',
            loop: 0,
            outputFormat: 'webp'
        }
    },
    {
        id: 'email',
        icon: Mail,
        name: 'Email (2MB)',
        nameKey: 'platforms.email.name',
        descKey: 'platforms.email.desc',
        resultDesc: 'Tiny file, loops 3x',
        resultDescKey: 'presets.platform.email.resultDesc',
        settings: {
            qualityId: 'web',
            delay: 200,
            compression: 'heavy',
            dither: 'bayer',
            loop: 3,
            outputFormat: 'gif'
        }
    }
];

const QUALITY_PRESETS = [
    { id: 'web', width: 1280, icon: Zap, descKey: '1280px' },
    { id: 'hd', width: 1920, icon: Sparkles, descKey: '1920px' },
    { id: 'full_hd', width: 2560, icon: Crown, descKey: '2560px' },
    { id: 'ultra', width: 4000, icon: Rocket, descKey: '4000px' },
    { id: 'original', width: 0, icon: Maximize, descKey: 'original' },
];

// Shared quick presets (names/descriptions reused across modes)
const QUICK_PRESETS = [
    {
        id: 'social',
        icon: Twitter,
        nameKey: 'presets.common.social.name',
        descKey: 'presets.common.social.desc',
        image: {
            qualityId: 'full_hd',
            delay: 120,
            loop: 0,
            dither: 'floyd_steinberg',
            fillColor: 'black',
            compression: 'medium'
        },
        video: {
            fps: 10,
            width: 1280,
            compression: 'light',
            dither: 'bayer',
            loop: 0
        }
    },
    {
        id: 'highQuality',
        icon: Star,
        nameKey: 'presets.common.highQuality.name',
        descKey: 'presets.common.highQuality.desc',
        image: {
            qualityId: 'ultra',
            delay: 100,
            loop: 0,
            dither: 'sierra2',
            fillColor: 'black',
            compression: 'none'
        },
        video: {
            fps: 24,
            width: 0, // original
            compression: 'none',
            dither: 'floyd_steinberg',
            loop: 0
        }
    },
    {
        id: 'tutorial',
        icon: Monitor,
        nameKey: 'presets.common.tutorial.name',
        descKey: 'presets.common.tutorial.desc',
        image: {
            qualityId: 'full_hd',
            delay: 160,
            loop: 0,
            dither: 'none',
            fillColor: 'white',
            compression: 'light'
        },
        video: {
            fps: 10,
            width: 1920,
            compression: 'light',
            dither: 'none',
            loop: 1
        }
    },
    {
        id: 'smallFile',
        icon: Package,
        nameKey: 'presets.common.smallFile.name',
        descKey: 'presets.common.smallFile.desc',
        image: {
            qualityId: 'hd',
            delay: 180,
            loop: 0,
            dither: 'bayer',
            fillColor: 'black',
            compression: 'heavy'
        },
        video: {
            fps: 5,
            width: 1280,
            compression: 'medium',
            dither: 'bayer',
            loop: 3
        }
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
    const { t, language } = useLanguage();
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState('hd');
    const [activeVideoPreset, setActiveVideoPreset] = useState(null);
    const [activeImagePreset, setActiveImagePreset] = useState(null);
    const [activePlatformPreset, setActivePlatformPreset] = useState(null);
    const [highlightedFields, setHighlightedFields] = useState([]);
    const [presetFeedback, setPresetFeedback] = useState(null);
    const highlightTimerRef = useRef(null);
    const feedbackTimerRef = useRef(null);

    // Intent-first Mode: 'convert' (default), 'platform', or 'finetune'
    const [intentMode, setIntentMode] = useState('convert');
    // Secondary tab for Fine-tune mode: 'platform' or 'quality'
    const [activePresetTab, setActivePresetTab] = useState('platform');
    // Platform's recommended format (display only, not locked)
    const [recommendedFormat, setRecommendedFormat] = useState(null);
    // Track if user manually overrode the output format
    const [formatManuallyOverridden, setFormatManuallyOverridden] = useState(false);
    // Track if format override dropdown is expanded in platform mode
    const [showFormatOverride, setShowFormatOverride] = useState(false);

    const quickPresetsForMode = useMemo(() => {
        return QUICK_PRESETS.filter(p => inputMode === 'video' ? p.video : p.image);
    }, [inputMode]);

    const clearTimer = (ref) => {
        if (ref.current) {
            clearTimeout(ref.current);
            ref.current = null;
        }
    };

    const triggerHighlight = (fields = []) => {
        setHighlightedFields(fields);
        clearTimer(highlightTimerRef);
        if (fields.length === 0) return;
        highlightTimerRef.current = setTimeout(() => setHighlightedFields([]), 420);
    };

    const showPresetFeedback = (presetId) => {
        const preset = QUICK_PRESETS.find(p => p.id === presetId);
        if (!preset) return;
        const msg = t('settings.presetApplied', { name: t(preset.nameKey) });
        setPresetFeedback(msg);
        clearTimer(feedbackTimerRef);
        feedbackTimerRef.current = setTimeout(() => setPresetFeedback(null), 1200);
    };

    useEffect(() => {
        return () => {
            clearTimer(highlightTimerRef);
            clearTimer(feedbackTimerRef);
        };
    }, []);

    const isHighlighted = (field) => highlightedFields.includes(field);

    const highlightClass = (field) => isHighlighted(field)
        ? 'ring-2 ring-blue-200 bg-blue-50/40 rounded-lg transition-all duration-200'
        : '';

    const resolveQualityWidth = (presetId) => {
        const preset = QUALITY_PRESETS.find(p => p.id === presetId);
        if (!preset) return null;
        if (presetId === 'original') {
            if (originalDimensions?.width) {
                return originalDimensions.width;
            }
            return null;
        }
        if (preset.width > 0) return preset.width;
        return null;
    };

    const applyQualitySelection = (presetId, baseWidth = settings.width) => {
        setSelectedPreset(presetId);
        const resolvedWidth = resolveQualityWidth(presetId);
        if (resolvedWidth) return resolvedWidth;
        return baseWidth;
    };

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
        if (inputMode === 'images') {
            if (settings.loop === undefined || settings.loop === 1) {
                onSettingsChange({ ...settings, loop: 0 });
            }
        }
    }, [inputMode]);

    const handleChange = (key, value) => {
        setActiveVideoPreset(null); // Clear preset selection when manually changing
        setActiveImagePreset(null);

        // In platform mode, don't clear platform preset when just overriding format
        // This preserves the "Recommended output" display
        if (!(intentMode === 'platform' && key === 'outputFormat')) {
            setActivePlatformPreset(null);
        }

        // Track manual format override
        if (key === 'outputFormat') {
            setFormatManuallyOverridden(true);
        }

        onSettingsChange({ ...settings, [key]: value });
    };

    // Apply platform preset (Twitter, Discord, Slack, etc.)
    const applyPlatformPreset = (presetId) => {
        const preset = PLATFORM_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        const config = preset.settings;
        let nextSettings = { ...settings };
        const changedFields = [];

        // Apply quality preset
        if (config.qualityId) {
            const widthFromQuality = applyQualitySelection(config.qualityId, nextSettings.width);
            if (widthFromQuality) {
                nextSettings.width = widthFromQuality;
                changedFields.push('width');
            }
        }

        // Apply other settings
        if (config.delay !== undefined) {
            nextSettings.delay = config.delay;
            changedFields.push('delay');
        }
        if (config.compression) {
            nextSettings.compression = config.compression;
            changedFields.push('compression');
        }
        if (config.dither) {
            nextSettings.dither = config.dither;
            changedFields.push('dither');
        }
        if (config.loop !== undefined) {
            nextSettings.loop = config.loop;
            changedFields.push('loop');
            // Disable crossfade if loop is not infinite
            if (config.loop !== 0) {
                nextSettings.crossfadeEnabled = false;
            }
        }

        // Platform presets set RECOMMENDED format (for display)
        // AND set selectedFormat as default (user can override without being locked)
        if (config.outputFormat) {
            setRecommendedFormat(config.outputFormat);
            // Only set as selectedFormat if user hasn't manually overridden yet
            // OR always reset on new platform click (clear override)
            nextSettings.outputFormat = config.outputFormat;
            changedFields.push('outputFormat');
        }

        setActivePlatformPreset(presetId);
        setActiveImagePreset(null);
        setActiveVideoPreset(null);
        setActivePresetTab('platform');
        // Clear manual override since platform preset is being clicked
        setFormatManuallyOverridden(false);
        setShowFormatOverride(false);

        onSettingsChange(nextSettings);
        const formatLabel = config.outputFormat?.toUpperCase() || 'GIF';
        setPresetFeedback(t('presets.platformApplied', { name: preset.name, format: formatLabel }) || `Applied "${preset.name}" (${formatLabel})`);
        clearTimer(feedbackTimerRef);
        feedbackTimerRef.current = setTimeout(() => setPresetFeedback(null), 1500);
        triggerHighlight(changedFields);
    };

    const handlePresetChange = (presetId) => {
        setActiveVideoPreset(null);
        setActiveImagePreset(null);
        const resolvedWidth = applyQualitySelection(presetId);
        if (resolvedWidth) {
            handleChange('width', resolvedWidth);
        }
    };

    const applyQuickPreset = (presetId) => {
        const preset = QUICK_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        const modeConfig = inputMode === 'video' ? preset.video : preset.image;
        if (!modeConfig) return;

        const mergedConfig = { ...(preset.common || {}), ...modeConfig };
        let nextSettings = { ...settings };
        const changedFields = [];

        if (inputMode === 'images') {
            if (mergedConfig.qualityId) {
                const widthFromQuality = applyQualitySelection(mergedConfig.qualityId, nextSettings.width);
                if (widthFromQuality) {
                    nextSettings.width = widthFromQuality;
                    changedFields.push('width');
                }
            }
            if (typeof mergedConfig.width === 'number') {
                nextSettings.width = mergedConfig.width;
                setSelectedPreset('custom');
                changedFields.push('width');
            }
            if (mergedConfig.delay !== undefined) {
                nextSettings.delay = mergedConfig.delay;
                changedFields.push('delay');
            }
            if (mergedConfig.loop !== undefined) {
                nextSettings.loop = mergedConfig.loop;
                changedFields.push('loop');
                if (mergedConfig.loop !== 0) {
                    nextSettings.crossfadeEnabled = false;
                }
            }
            if (mergedConfig.dither) {
                nextSettings.dither = mergedConfig.dither;
                changedFields.push('dither');
            }
            if (mergedConfig.fillColor) {
                nextSettings.fillColor = mergedConfig.fillColor;
                changedFields.push('fillColor');
            }
            if (mergedConfig.compression) {
                nextSettings.compression = mergedConfig.compression;
                changedFields.push('compression');
            }

            setActiveImagePreset(presetId);
            setActiveVideoPreset(null);
            setActivePlatformPreset(null);
            setActivePresetTab('quality');
            // Quality presets do NOT change output format (user controls it)
        } else {
            if (typeof mergedConfig.width === 'number') {
                let widthToApply = mergedConfig.width;
                if (mergedConfig.width === 0 && originalDimensions?.width) {
                    widthToApply = originalDimensions.width;
                    setSelectedPreset('original');
                } else {
                    const qualityPreset = QUALITY_PRESETS.find(p => p.width === mergedConfig.width);
                    if (qualityPreset) {
                        setSelectedPreset(qualityPreset.id);
                    }
                }
                if (widthToApply) {
                    nextSettings.width = widthToApply;
                    changedFields.push('width');
                }
            }
            if (mergedConfig.compression) {
                nextSettings.compression = mergedConfig.compression;
                changedFields.push('compression');
            }
            if (mergedConfig.dither) {
                nextSettings.dither = mergedConfig.dither;
                changedFields.push('dither');
            }
            if (mergedConfig.loop !== undefined) {
                nextSettings.loop = mergedConfig.loop;
                changedFields.push('loop');
                nextSettings.crossfadeEnabled = mergedConfig.loop === 0 ? settings.crossfadeEnabled : false;
            }
            if (mergedConfig.fps && onVideoFpsChange) {
                onVideoFpsChange(mergedConfig.fps);
            }

            setActiveVideoPreset(presetId);
            setActiveImagePreset(null);
            setActivePlatformPreset(null);
            setActivePresetTab('quality');

            if (onVideoPresetApply) {
                onVideoPresetApply({ ...mergedConfig, id: presetId });
            }
        }

        onSettingsChange(nextSettings);
        showPresetFeedback(presetId);
        triggerHighlight(changedFields);
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
                {/* ===== INTENT-FIRST MODE TABS ===== */}
                <div className="space-y-4">
                    {/* Mode Segmented Control */}
                    <div className="flex rounded-xl bg-gray-100 p-1">
                        <button
                            onClick={() => { setIntentMode('convert'); setShowFormatOverride(false); }}
                            className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${intentMode === 'convert'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span>{t('intentMode.convert')}</span>
                            {language === 'zh' && <span className="text-xs text-gray-400 ml-1">({t('intentMode.convertCn')})</span>}
                        </button>
                        <button
                            onClick={() => { setIntentMode('platform'); setShowFormatOverride(false); }}
                            className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${intentMode === 'platform'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span>{t('intentMode.platform')}</span>
                            {language === 'zh' && <span className="text-xs text-gray-400 ml-1">({t('intentMode.platformCn')})</span>}
                        </button>
                        <button
                            onClick={() => { setIntentMode('finetune'); setShowFormatOverride(false); }}
                            className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${intentMode === 'finetune'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span>{t('intentMode.finetune')}</span>
                            {language === 'zh' && <span className="text-xs text-gray-400 ml-1">({t('intentMode.finetuneCn')})</span>}
                        </button>
                    </div>

                    {/* Mode Description */}
                    <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border-l-4 border-blue-400">
                        {t(`intentMode.desc.${intentMode}`)}
                    </p>

                    {/* Preset feedback message (shared across modes) */}
                    {presetFeedback && (
                        <p
                            className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg border-l-4 border-green-400"
                            aria-live="polite"
                        >
                            ✓ {presetFeedback}
                        </p>
                    )}
                </div>

                <div className="h-px bg-gray-100" />

                {/* ============================================================== */}
                {/* MODE: CONVERT FORMAT (default) */}
                {/* ============================================================== */}
                {intentMode === 'convert' && (
                    <>
                        {/* Output Format - Prominent */}
                        <div className={`space-y-3 ${highlightClass('outputFormat')}`}>
                            <div>
                                <label className="text-sm font-bold text-gray-700">{t('outputFormat.label') || 'Output Format'}</label>
                                <p className="text-xs text-gray-500 mt-0.5">Pick a format, then export.</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {OUTPUT_FORMATS.map((format) => {
                                    const Icon = format.icon;
                                    const isActive = (settings.outputFormat || 'gif') === format.id;
                                    return (
                                        <button
                                            key={format.id}
                                            onClick={() => handleChange('outputFormat', format.id)}
                                            className={`p-3 rounded-xl border transition-all text-center group ${isActive
                                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-1.5">
                                                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                                <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                                    {format.label}
                                                </span>
                                                <p className="text-xs text-gray-500">
                                                    {t(format.descKey) || format.descKey}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Quality Presets - Simplified */}
                        <div className={`space-y-3 ${highlightClass('width')}`}>
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

                        {/* Frame Delay (Image mode) or FPS display (Video mode) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className={`space-y-2 ${highlightClass('delay')}`}>
                                <label className="text-sm font-bold text-gray-700 block">{t('settings.delay')}</label>
                                {inputMode === 'video' ? (
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
                        </div>
                    </>
                )}

                {/* ============================================================== */}
                {/* MODE: OPTIMIZE FOR PLATFORM */}
                {/* ============================================================== */}
                {intentMode === 'platform' && (
                    <>
                        {/* Platform Presets - Prominent */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {PLATFORM_PRESETS.map((preset) => {
                                    const Icon = preset.icon;
                                    const isActive = activePlatformPreset === preset.id;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => applyPlatformPreset(preset.id)}
                                            className={`p-3 rounded-xl border transition-all text-left group ${isActive
                                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                                <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                                    {preset.name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {t(preset.resultDescKey) || preset.resultDesc}
                                            </p>
                                            {isActive && (
                                                <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Applied ✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recommended Output Display */}
                        {activePlatformPreset && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Show Recommended Output */}
                                <div className="flex flex-col gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-blue-700">
                                                {t('intentMode.recommendedOutput')}:
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-sm">
                                                {(recommendedFormat || 'gif').toUpperCase()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setShowFormatOverride(!showFormatOverride)}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            {t('intentMode.changeFormat')}
                                        </button>
                                    </div>

                                    {/* Show Selected Output (only when different from recommended) */}
                                    {formatManuallyOverridden && (settings.outputFormat || 'gif') !== recommendedFormat && (
                                        <div className="flex items-center gap-2 pt-1 border-t border-blue-200">
                                            <span className="text-sm font-medium text-amber-700">
                                                Selected output:
                                            </span>
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-sm">
                                                {(settings.outputFormat || 'gif').toUpperCase()}
                                            </span>
                                            <span className="text-xs text-amber-600">(manual)</span>
                                        </div>
                                    )}
                                </div>

                                {/* Format Override (expandable) */}
                                {showFormatOverride && (
                                    <>
                                        <p className="text-xs text-gray-500">You can override the recommended format.</p>
                                        <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {OUTPUT_FORMATS.map((format) => {
                                                const Icon = format.icon;
                                                const isActive = (settings.outputFormat || 'gif') === format.id;
                                                const isRecommended = recommendedFormat === format.id;
                                                return (
                                                    <button
                                                        key={format.id}
                                                        onClick={() => {
                                                            handleChange('outputFormat', format.id);
                                                            setFormatManuallyOverridden(format.id !== recommendedFormat);
                                                        }}
                                                        className={`p-2 rounded-lg border transition-all text-center group relative ${isActive
                                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                                            <span className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                                                {format.label}
                                                            </span>
                                                        </div>
                                                        {isRecommended && (
                                                            <span className="absolute -top-1 -right-1 text-[10px] bg-blue-500 text-white px-1 rounded">rec</span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ============================================================== */}
                {/* MODE: FINE-TUNE (full control) */}
                {/* ============================================================== */}
                {intentMode === 'finetune' && (
                    <>
                        {/* Quality Presets Tabs (Platform / Quality) */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700">{t('presets.title') || 'Presets'}</label>
                                <p className="text-xs text-gray-500 mt-0.5">{t('presets.subtitle') || 'Pick a platform or a quality preset to auto-tune settings.'}</p>
                            </div>

                            {/* TAB buttons */}
                            <div className="flex gap-2 border-b border-gray-200">
                                <button
                                    onClick={() => setActivePresetTab('platform')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activePresetTab === 'platform'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {t('presets.tab.platform') || 'Platform'}
                                </button>
                                <button
                                    onClick={() => setActivePresetTab('quality')}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activePresetTab === 'quality'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {t('presets.tab.quality') || 'Quality'}
                                </button>
                            </div>

                            {/* Platform TAB content */}
                            {activePresetTab === 'platform' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {PLATFORM_PRESETS.map((preset) => {
                                            const Icon = preset.icon;
                                            const isActive = activePlatformPreset === preset.id;
                                            return (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => applyPlatformPreset(preset.id)}
                                                    className={`p-3 rounded-xl border transition-all text-left group ${isActive
                                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                                        <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                                            {preset.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {t(preset.resultDescKey) || preset.resultDesc}
                                                    </p>
                                                    {isActive && (
                                                        <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Applied ✓</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quality TAB content */}
                            {activePresetTab === 'quality' && quickPresetsForMode.length > 0 && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {quickPresetsForMode.map((preset) => {
                                            const Icon = preset.icon;
                                            const isActive = (inputMode === 'video' ? activeVideoPreset : activeImagePreset) === preset.id;
                                            return (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => applyQuickPreset(preset.id)}
                                                    className={`p-3 rounded-xl border transition-all text-left group ${isActive
                                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                                        <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                                            {t(preset.nameKey)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {t(preset.descKey)}
                                                    </p>
                                                    {isActive && (
                                                        <span className="text-[11px] text-blue-600 font-semibold mt-1 inline-block">Applied ✓</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Guidance text */}
                            <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border-l-4 border-gray-300">
                                {activePresetTab === 'platform'
                                    ? (t('presets.guidance.platform') || 'Platform presets auto-pick the best output format + settings. You can override format below.')
                                    : (t('presets.guidance.quality') || 'Quality presets tune settings only. Choose output format below if needed.')
                                }
                            </p>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Output Format */}
                        <div className={`space-y-3 ${highlightClass('outputFormat')}`}>
                            <div>
                                <label className="text-sm font-bold text-gray-700">{t('outputFormat.labelOptional') || 'Output format (optional)'}</label>
                                <p className="text-xs text-gray-500 mt-0.5">{t('outputFormat.platformHint') || 'Platform presets may change this to match size/compatibility.'}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {OUTPUT_FORMATS.map((format) => {
                                    const Icon = format.icon;
                                    const isActive = (settings.outputFormat || 'gif') === format.id;
                                    return (
                                        <button
                                            key={format.id}
                                            onClick={() => handleChange('outputFormat', format.id)}
                                            className={`p-3 rounded-xl border transition-all text-center group ${isActive
                                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex flex-col items-center gap-1.5">
                                                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`} />
                                                <span className={`text-sm font-semibold ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                                                    {format.label}
                                                </span>
                                                <p className="text-xs text-gray-500">
                                                    {t(format.descKey) || format.descKey}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {formatManuallyOverridden && (
                                <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1.5 rounded border-l-4 border-amber-400">
                                    {t('outputFormat.overridden') || 'Format overridden manually.'}
                                </p>
                            )}
                            {!formatManuallyOverridden && (settings.outputFormat || 'gif') !== 'gif' && (
                                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded border-l-4 border-blue-400">
                                    {t(`outputFormat.hint.${settings.outputFormat}`) ||
                                        (settings.outputFormat === 'webp' ? '~60% smaller than GIF, great quality' : 'Full PNG quality, best for text/UI')}
                                </p>
                            )}
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Quality Presets */}
                        <div className={`space-y-3 ${highlightClass('width')}`}>
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

                        {/* Full Parameters Grid for Fine-tune mode */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            {/* Frame Delay */}
                            <div className={`space-y-2 ${highlightClass('delay')}`}>
                                <label className="text-sm font-bold text-gray-700 block">{t('settings.delay')}</label>
                                {inputMode === 'video' ? (
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

                            {/* Custom Width - Hidden in video mode */}
                            {inputMode !== 'video' && (
                                <div className={`space-y-2 ${highlightClass('width')}`}>
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
                            <div className={`space-y-2 ${highlightClass('loop')}`}>
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

                            {/* Dithering - Only for GIF format */}
                            {(settings.outputFormat || 'gif') === 'gif' && (
                                <div className={`space-y-2 ${highlightClass('dither')}`}>
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
                            )}

                            {/* Fill Color */}
                            <div className={`space-y-2 ${highlightClass('fillColor')}`}>
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

                            {/* Compression */}
                            <div className={`space-y-2 ${highlightClass('compression')}`}>
                                <label className="text-sm font-bold text-gray-700 block">{t('settings.compression') || 'Compression'}</label>
                                <select
                                    value={settings.compression ?? 'light'}
                                    onChange={(e) => handleChange('compression', e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em' }}
                                >
                                    <option value="none">{t('settings.compressionNone') || 'None (Best Quality)'}</option>
                                    <option value="light">{t('settings.compressionLight') || 'Light (128 colors)'}</option>
                                    <option value="medium">{t('settings.compressionMedium') || 'Medium (128 colors, lower fps)'}</option>
                                    <option value="heavy">{t('settings.compressionHeavy') || 'Heavy (64 colors, lowest fps)'}</option>
                                </select>
                                {getParamHint('compression', settings.compression ?? 'light', t) && (
                                    <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1.5 rounded border-l-4 border-blue-400">
                                        {getParamHint('compression', settings.compression ?? 'light', t)}
                                    </p>
                                )}
                            </div>

                            {/* Crossfade Toggle - Only when loop is infinite */}
                            {showCrossfade && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 block">{t('settings.crossfade')}</label>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleChange('crossfadeEnabled', !settings.crossfadeEnabled)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.crossfadeEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${settings.crossfadeEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                            />
                                        </button>
                                        <span className="text-sm text-gray-500">
                                            {settings.crossfadeEnabled ? 'On' : 'Off'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">{t('settings.crossfadeHint')}</p>
                                </div>
                            )}

                            {/* Crossfade Frames */}
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

                                    {settings.width > 2000 && (
                                        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">
                                            ⚠️ High resolution ({settings.width}px) + crossfade may be slow. Consider using 2K or lower for faster generation.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Advanced Toggle - Shared across modes */}
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
