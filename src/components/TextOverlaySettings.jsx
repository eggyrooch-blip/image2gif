import React, { useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, Type } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Text position presets (9-grid)
export const TEXT_POSITIONS = [
    { id: 'top-left', labelKey: 'textOverlay.position.topLeft' },
    { id: 'top', labelKey: 'textOverlay.position.top' },
    { id: 'top-right', labelKey: 'textOverlay.position.topRight' },
    { id: 'left', labelKey: 'textOverlay.position.left' },
    { id: 'center', labelKey: 'textOverlay.position.center' },
    { id: 'right', labelKey: 'textOverlay.position.right' },
    { id: 'bottom-left', labelKey: 'textOverlay.position.bottomLeft' },
    { id: 'bottom', labelKey: 'textOverlay.position.bottom' },
    { id: 'bottom-right', labelKey: 'textOverlay.position.bottomRight' },
];

const FONT_SIZES = [16, 20, 24, 32, 40, 48, 64];

// Quick templates
const TEMPLATES = [
    {
        id: 'meme',
        labelKey: 'textOverlay.templates.meme',
        position: 'top',
        fontSize: 48,
        fontColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 3,
        bgStrip: false,
    },
    {
        id: 'subtitle',
        labelKey: 'textOverlay.templates.subtitle',
        position: 'bottom',
        fontSize: 24,
        fontColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 2,
        bgStrip: true,
    },
    {
        id: 'watermark',
        labelKey: 'textOverlay.templates.watermark',
        position: 'bottom-right',
        fontSize: 16,
        fontColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 1,
        bgStrip: false,
    },
];

export const getDefaultTextConfig = () => ({
    enabled: false,
    text: '',
    position: 'bottom',
    fontSize: 32,
    fontColor: '#FFFFFF',
    strokeEnabled: true,
    strokeColor: '#000000',
    strokeWidth: 2,
    bgStrip: false,
});

/**
 * TextOverlaySettings Component
 * 
 * Collapsible panel for configuring text overlay settings.
 * Similar to OverlaySettings but for text.
 */
const TextOverlaySettings = ({
    config,
    onChange,
    disabled = false
}) => {
    const { t, language } = useLanguage();
    const isZh = language === 'zh';
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Handle config changes
    const handleChange = useCallback((key, value) => {
        onChange({
            ...config,
            [key]: value
        });
    }, [config, onChange]);

    // Apply template
    const applyTemplate = useCallback((template) => {
        onChange({
            ...config,
            position: template.position,
            fontSize: template.fontSize,
            fontColor: template.fontColor,
            strokeColor: template.strokeColor,
            strokeWidth: template.strokeWidth,
            strokeEnabled: template.strokeWidth > 0,
            bgStrip: template.bgStrip,
            enabled: true,
        });
    }, [config, onChange]);

    // Toggle enabled state
    const handleToggleEnabled = useCallback(() => {
        onChange({
            ...config,
            enabled: !config.enabled
        });
    }, [config, onChange]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header - Collapsible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                disabled={disabled}
            >
                <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-700">{t('textOverlay.title') || '添加文字'}</h3>
                    {config.enabled && config.text && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {t('textOverlay.active') || 'Active'}
                        </span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-700">
                            {t('textOverlay.enable') || '启用文字'}
                        </label>
                        <button
                            onClick={handleToggleEnabled}
                            disabled={disabled}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? 'bg-blue-600' : 'bg-gray-300'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Quick Templates */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                            {t('textOverlay.templates.title') || '快速模板'}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template)}
                                    disabled={disabled}
                                    className="p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                                >
                                    <div className="text-sm font-medium text-gray-700">
                                        {t(template.labelKey) || template.id}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                            {t('textOverlay.textContent') || '文字内容'}
                        </label>
                        <textarea
                            value={config.text || ''}
                            onChange={(e) => handleChange('text', e.target.value)}
                            placeholder={t('textOverlay.textPlaceholder') || '在此输入文字...'}
                            disabled={disabled || !config.enabled}
                            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${(!config.enabled || disabled) ? 'opacity-50 bg-gray-50' : ''}`}
                            rows={2}
                        />
                    </div>

                    {/* Position (9-grid) */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                            {t('textOverlay.position.title') || '位置'}
                        </label>
                        <div className="grid grid-cols-3 gap-2 w-fit">
                            {TEXT_POSITIONS.map((pos) => (
                                <button
                                    key={pos.id}
                                    onClick={() => handleChange('position', pos.id)}
                                    disabled={disabled || !config.enabled}
                                    className={`w-10 h-10 rounded-lg border transition-all flex items-center justify-center ${config.position === pos.id
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                        : 'border-gray-200 bg-white hover:border-blue-300 text-gray-400'
                                        } ${(!config.enabled || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <Type className="w-3 h-3" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                            {t('textOverlay.fontSize') || '字号'}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {FONT_SIZES.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => handleChange('fontSize', size)}
                                    disabled={disabled || !config.enabled}
                                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${config.fontSize === size
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-blue-300'
                                        } ${(!config.enabled || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Font Color */}
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-bold text-gray-700">
                            {t('textOverlay.fontColor') || '颜色'}
                        </label>
                        <input
                            type="color"
                            value={config.fontColor || '#FFFFFF'}
                            onChange={(e) => handleChange('fontColor', e.target.value)}
                            disabled={disabled || !config.enabled}
                            className={`w-10 h-10 rounded-lg border border-gray-300 cursor-pointer ${(!config.enabled || disabled) ? 'opacity-50' : ''}`}
                        />
                        <input
                            type="text"
                            value={config.fontColor || '#FFFFFF'}
                            onChange={(e) => handleChange('fontColor', e.target.value)}
                            disabled={disabled || !config.enabled}
                            className={`w-24 px-2 py-1 border border-gray-300 rounded text-sm font-mono ${(!config.enabled || disabled) ? 'opacity-50 bg-gray-50' : ''}`}
                        />
                    </div>

                    {/* Stroke */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-bold text-gray-700">
                                {t('textOverlay.stroke') || '描边'}
                            </label>
                            <button
                                onClick={() => handleChange('strokeEnabled', !config.strokeEnabled)}
                                disabled={disabled || !config.enabled}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.strokeEnabled ? 'bg-blue-600' : 'bg-gray-300'
                                    } ${(!config.enabled || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform ${config.strokeEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                        }`}
                                />
                            </button>
                        </div>

                        {config.strokeEnabled && (
                            <div className="flex items-center gap-4 ml-4">
                                <input
                                    type="color"
                                    value={config.strokeColor || '#000000'}
                                    onChange={(e) => handleChange('strokeColor', e.target.value)}
                                    disabled={disabled || !config.enabled}
                                    className={`w-8 h-8 rounded border border-gray-300 cursor-pointer ${(!config.enabled || disabled) ? 'opacity-50' : ''}`}
                                />
                                <select
                                    value={config.strokeWidth || 2}
                                    onChange={(e) => handleChange('strokeWidth', Number(e.target.value))}
                                    disabled={disabled || !config.enabled}
                                    className={`px-3 py-1.5 border border-gray-300 rounded-lg ${(!config.enabled || disabled) ? 'opacity-50 bg-gray-50' : ''}`}
                                >
                                    {[1, 2, 3, 4, 5].map(w => (
                                        <option key={w} value={w}>{w}px</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Background Strip */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-gray-700">
                            {t('textOverlay.bgStrip') || '背景条'}
                        </label>
                        <button
                            onClick={() => handleChange('bgStrip', !config.bgStrip)}
                            disabled={disabled || !config.enabled}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config.bgStrip ? 'bg-blue-600' : 'bg-gray-300'
                                } ${(!config.enabled || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform ${config.bgStrip ? 'translate-x-5' : 'translate-x-0.5'
                                    }`}
                            />
                        </button>
                        <span className="text-xs text-gray-500">
                            {t('textOverlay.bgStripHint') || '文字背景半透明条'}
                        </span>
                    </div>

                    {/* Info hint */}
                    {config.enabled && config.text && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                            <p>
                                ✨ {t('textOverlay.previewHint') || '文字将在生成时添加到每一帧'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TextOverlaySettings;
