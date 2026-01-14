/**
 * Shared image processing utilities
 */

/**
 * Get dimensions of an image file
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number} | null>}
 */
export const getImageDimensions = (file) => {
    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        img.src = url;
    });
};

/**
 * Compute target resolution from images
 * @param {Array<{file: File}>} images - Array of image items
 * @param {string} resolution - Resolution preset ('auto', '720p', '1080p')
 * @returns {Promise<{width: number, height: number}>}
 */
export const computeTargetResolution = async (images, resolution) => {
    if (resolution === '720p') return { width: 1280, height: 720 };
    if (resolution === '1080p') return { width: 1920, height: 1080 };

    // Auto: find max dimensions
    let maxWidth = 0;
    let maxHeight = 0;
    for (const img of images) {
        const dims = await getImageDimensions(img.file);
        if (dims) {
            maxWidth = Math.max(maxWidth, dims.width);
            maxHeight = Math.max(maxHeight, dims.height);
        }
    }

    const fallback = { width: 1280, height: 720 };
    if (!maxWidth || !maxHeight) return fallback;

    // Ensure even dimensions for video encoding
    return {
        width: makeEven(maxWidth),
        height: makeEven(maxHeight),
    };
};

/**
 * Make a number even (required for video encoding)
 * @param {number} value
 * @returns {number}
 */
export const makeEven = (value) => (value % 2 === 0 ? value : value + 1);

/**
 * Create a canvas element (OffscreenCanvas if supported, otherwise regular canvas)
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement | OffscreenCanvas}
 */
export const createCanvas = (width, height) => {
    if (typeof OffscreenCanvas !== 'undefined') {
        return new OffscreenCanvas(width, height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

/**
 * Convert canvas to blob
 * @param {HTMLCanvasElement | OffscreenCanvas} canvas
 * @param {string} type - MIME type
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<Blob>}
 */
export const canvasToBlob = (canvas, type = 'image/png', quality = 0.92) => {
    if (canvas.convertToBlob) {
        return canvas.convertToBlob({ type, quality });
    }
    return new Promise((resolve) => {
        canvas.toBlob(resolve, type, quality);
    });
};
