/**
 * Overlay/Watermark Helper for FFmpeg
 * 
 * Builds FFmpeg filter expressions for overlay functionality.
 */

/**
 * @typedef {Object} OverlayConfig
 * @property {boolean} enabled - Whether overlay is enabled
 * @property {File|null} file - Overlay image file
 * @property {string|null} preview - Blob URL for preview
 * @property {'top-left'|'top-right'|'bottom-left'|'bottom-right'|'center'} position - Overlay position
 * @property {number} scale - Scale percentage (10-100)
 * @property {number} margin - Margin in pixels (0-64)
 * @property {number} opacity - Opacity (0.1-1.0)
 */

/**
 * Default overlay configuration
 * @returns {OverlayConfig}
 */
export const getDefaultOverlayConfig = () => ({
    enabled: false,
    file: null,
    preview: null,
    position: 'bottom-right',
    scale: 25,
    margin: 16,
    opacity: 0.9
});

/**
 * Position expressions for FFmpeg overlay filter
 * Each function takes margin and returns x, y expressions
 * Supports 9-grid positions (3x3)
 */
const POSITION_EXPRESSIONS = {
    'top-left': (m) => ({ x: String(m), y: String(m) }),
    'top': (m) => ({ x: '(main_w-overlay_w)/2', y: String(m) }),
    'top-right': (m) => ({ x: `main_w-overlay_w-${m}`, y: String(m) }),
    'left': (m) => ({ x: String(m), y: '(main_h-overlay_h)/2' }),
    'center': () => ({ x: '(main_w-overlay_w)/2', y: '(main_h-overlay_h)/2' }),
    'right': (m) => ({ x: `main_w-overlay_w-${m}`, y: '(main_h-overlay_h)/2' }),
    'bottom-left': (m) => ({ x: String(m), y: `main_h-overlay_h-${m}` }),
    'bottom': (m) => ({ x: '(main_w-overlay_w)/2', y: `main_h-overlay_h-${m}` }),
    'bottom-right': (m) => ({ x: `main_w-overlay_w-${m}`, y: `main_h-overlay_h-${m}` })
};

/**
 * Available overlay positions (9-grid layout)
 */
export const OVERLAY_POSITIONS = [
    { id: 'top-left', labelKey: 'overlay.positions.top-left' },
    { id: 'top', labelKey: 'overlay.positions.top' },
    { id: 'top-right', labelKey: 'overlay.positions.top-right' },
    { id: 'left', labelKey: 'overlay.positions.left' },
    { id: 'center', labelKey: 'overlay.positions.center' },
    { id: 'right', labelKey: 'overlay.positions.right' },
    { id: 'bottom-left', labelKey: 'overlay.positions.bottom-left' },
    { id: 'bottom', labelKey: 'overlay.positions.bottom' },
    { id: 'bottom-right', labelKey: 'overlay.positions.bottom-right' }
];

/**
 * Build the overlay scale filter
 * Scales the overlay image to a percentage of the main video width
 * 
 * @param {number} mainWidth - Main video/image width
 * @param {number} scalePercent - Scale percentage (10-100)
 * @returns {string} FFmpeg scale filter
 */
export const buildOverlayScaleFilter = (mainWidth, scalePercent) => {
    const overlayWidth = Math.max(16, Math.round(mainWidth * (scalePercent / 100)));
    // scale to width, maintain aspect ratio (-1 for height)
    return `scale=${overlayWidth}:-1`;
};

/**
 * Build the overlay opacity filter
 * Uses colorchannelmixer to adjust alpha channel
 * 
 * @param {number} opacity - Opacity value (0.1-1.0)
 * @returns {string} FFmpeg colorchannelmixer filter for alpha
 */
export const buildOverlayOpacityFilter = (opacity) => {
    // Clamp opacity to valid range
    const clampedOpacity = Math.max(0.1, Math.min(1.0, opacity));
    return `colorchannelmixer=aa=${clampedOpacity.toFixed(2)}`;
};

/**
 * Build the overlay position expression
 * 
 * @param {'top-left'|'top-right'|'bottom-left'|'bottom-right'|'center'} position 
 * @param {number} margin - Margin in pixels
 * @returns {{x: string, y: string}} Position expressions for x and y
 */
export const buildOverlayPosition = (position, margin) => {
    const positionFn = POSITION_EXPRESSIONS[position];
    if (!positionFn) {
        console.warn(`Unknown overlay position: ${position}, defaulting to bottom-right`);
        return POSITION_EXPRESSIONS['bottom-right'](margin);
    }
    return positionFn(margin);
};

/**
 * Build complete overlay filter chain for FFmpeg
 * 
 * This creates a filter that:
 * 1. Scales the overlay to the target size
 * 2. Ensures RGBA format for transparency
 * 3. Applies opacity via colorchannelmixer
 * 4. Overlays onto the main video at the specified position
 * 
 * @param {number} mainWidth - Main video/image width
 * @param {OverlayConfig} config - Overlay configuration
 * @returns {string} Complete FFmpeg filter_complex string for overlay
 * 
 * @example
 * // Returns: "[1:v]scale=480:-1,format=rgba,colorchannelmixer=aa=0.90[ovr];[0:v][ovr]overlay=main_w-overlay_w-16:main_h-overlay_h-16:format=auto"
 * buildOverlayFilterComplex(1920, { position: 'bottom-right', scale: 25, margin: 16, opacity: 0.9 })
 */
export const buildOverlayFilterComplex = (mainWidth, config) => {
    const { position, scale, margin, opacity } = config;

    // Build individual filter components
    const scaleFilter = buildOverlayScaleFilter(mainWidth, scale);
    const opacityFilter = buildOverlayOpacityFilter(opacity);
    const posExpr = buildOverlayPosition(position, margin);

    // Chain: scale → format=rgba → opacity → overlay
    // [1:v] is the overlay input (second input)
    // [0:v] is the main video (first input)
    const overlayPrep = `[1:v]${scaleFilter},format=rgba,${opacityFilter}[ovr]`;
    const overlayApply = `[0:v][ovr]overlay=${posExpr.x}:${posExpr.y}:format=auto`;

    return `${overlayPrep};${overlayApply}`;
};

/**
 * Build overlay filter for integration with existing palette-based GIF pipeline
 * 
 * This version outputs to a named stream that can be fed into palettegen/paletteuse
 * 
 * @param {number} mainWidth - Main video/image width
 * @param {OverlayConfig} config - Overlay configuration
 * @param {string} outputLabel - Label for output stream (default: 'main')
 * @returns {string} FFmpeg filter string with labeled output
 * 
 * @example
 * // For use with palette: overlay first, then generate palette from overlaid result
 * const overlayFilter = buildOverlayFilterForPalette(1920, config, 'main');
 * // Returns: "[1:v]scale=480:-1,format=rgba,colorchannelmixer=aa=0.90[ovr];[0:v][ovr]overlay=...[main]"
 */
export const buildOverlayFilterForPalette = (mainWidth, config, outputLabel = 'main') => {
    const { position, scale, margin, opacity } = config;

    const scaleFilter = buildOverlayScaleFilter(mainWidth, scale);
    const opacityFilter = buildOverlayOpacityFilter(opacity);
    const posExpr = buildOverlayPosition(position, margin);

    const overlayPrep = `[1:v]${scaleFilter},format=rgba,${opacityFilter}[ovr]`;
    const overlayApply = `[0:v][ovr]overlay=${posExpr.x}:${posExpr.y}:format=auto[${outputLabel}]`;

    return `${overlayPrep};${overlayApply}`;
};

/**
 * Validate overlay configuration
 * 
 * @param {OverlayConfig} config 
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validateOverlayConfig = (config) => {
    const errors = [];

    if (config.enabled && !config.file) {
        errors.push('Overlay is enabled but no image file is selected');
    }

    if (config.scale < 10 || config.scale > 100) {
        errors.push('Scale must be between 10% and 100%');
    }

    if (config.margin < 0 || config.margin > 64) {
        errors.push('Margin must be between 0 and 64 pixels');
    }

    if (config.opacity < 0.1 || config.opacity > 1.0) {
        errors.push('Opacity must be between 0.1 and 1.0');
    }

    if (!POSITION_EXPRESSIONS[config.position]) {
        errors.push('Invalid position value');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};
