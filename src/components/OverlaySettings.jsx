import React, { useCallback, useRef } from 'react';
import { ChevronDown, ChevronUp, Image, X, Upload } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { OVERLAY_POSITIONS } from '../utils/overlayHelper';

/**
 * OverlaySettings Component
 * 
 * Collapsible panel for configuring overlay/watermark settings.
 * Follows the existing SettingsPanel UI patterns.
 */
const OverlaySettings = ({
    config,
    onChange,
    disabled = false
}) => {
    const { t } = useLanguage();
    const fileInputRef = useRef(null);
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Handle file selection
    const handleFileSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a PNG, WebP, or JPG image');
            return;
        }

        // Revoke old preview URL if exists
        if (config.preview) {
            URL.revokeObjectURL(config.preview);
        }

        // Create new preview URL
        const previewUrl = URL.createObjectURL(file);

        onChange({
            ...config,
            file,
            preview: previewUrl,
            enabled: true // Auto-enable when file is selected
        });
    }, [config, onChange]);

    // Handle file removal
    const handleRemoveFile = useCallback(() => {
        if (config.preview) {
            URL.revokeObjectURL(config.preview);
        }
        onChange({
            ...config,
            file: null,
            preview: null,
            enabled: false
        });
    }, [config, onChange]);

    // Toggle enabled state
    const handleToggleEnabled = useCallback(() => {
        if (!config.file && !config.enabled) {
            // If no file and trying to enable, open file picker
            fileInputRef.current?.click();
            return;
        }
        onChange({
            ...config,
            enabled: !config.enabled
        });
    }, [config, onChange]);

    // Handle config changes
    const handleChange = useCallback((key, value) => {
        onChange({
            ...config,
            [key]: value
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
                    <Image className="w-4 h-4 text-gray-400" />
                    <h3 className="font-semibold text-gray-700">{t('overlay.title')}</h3>
                    {config.enabled && config.file && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            {t('overlay.active') || 'Active'}
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
                            {t('overlay.enable')}
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

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                            {t('overlay.upload')}
                        </label>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/webp,image/jpeg,image/jpg"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={disabled}
                        />

                        {config.file && config.preview ? (
                            // File preview
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="relative w-12 h-12 flex-shrink-0">
                                    <img
                                        src={config.preview}
                                        alt="Overlay preview"
                                        className="w-full h-full object-contain rounded bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23ccc%22/%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23ccc%22/%3E%3C/svg%3E')]"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                        {config.file.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {(config.file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    disabled={disabled}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            // Upload button
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={disabled}
                                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex flex-col items-center gap-2 group"
                            >
                                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                                <span className="text-sm text-gray-500 group-hover:text-blue-600">
                                    {t('overlay.uploadHint')}
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Position Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                            {t('overlay.position')}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {OVERLAY_POSITIONS.map((pos) => (
                                <button
                                    key={pos.id}
                                    onClick={() => handleChange('position', pos.id)}
                                    disabled={disabled || !config.enabled}
                                    className={`p-2 text-sm rounded-lg border transition-all ${config.position === pos.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                                        } ${(!config.enabled || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {t(pos.labelKey)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scale Slider */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                            {t('overlay.scale')}
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={10}
                                max={100}
                                step={5}
                                value={config.scale}
                                onChange={(e) => handleChange('scale', parseInt(e.target.value))}
                                disabled={disabled || !config.enabled}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                            />
                            <span className="w-14 text-sm font-mono text-gray-600 text-center bg-gray-100 rounded px-2 py-1">
                                {config.scale}%
                            </span>
                        </div>
                    </div>

                    {/* Margin Slider */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                            {t('overlay.margin')}
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={0}
                                max={64}
                                step={4}
                                value={config.margin}
                                onChange={(e) => handleChange('margin', parseInt(e.target.value))}
                                disabled={disabled || !config.enabled}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                            />
                            <span className="w-14 text-sm font-mono text-gray-600 text-center bg-gray-100 rounded px-2 py-1">
                                {config.margin}px
                            </span>
                        </div>
                    </div>

                    {/* Opacity Slider */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                            {t('overlay.opacity')}
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={10}
                                max={100}
                                step={5}
                                value={Math.round(config.opacity * 100)}
                                onChange={(e) => handleChange('opacity', parseInt(e.target.value) / 100)}
                                disabled={disabled || !config.enabled}
                                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                            />
                            <span className="w-14 text-sm font-mono text-gray-600 text-center bg-gray-100 rounded px-2 py-1">
                                {Math.round(config.opacity * 100)}%
                            </span>
                        </div>
                    </div>

                    {/* Preview hint */}
                    {config.enabled && config.file && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                            <p>
                                ✨ {t('overlay.previewHint') || 'Overlay will be applied when generating GIF'}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OverlaySettings;
