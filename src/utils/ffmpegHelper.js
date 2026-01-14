import { fetchFile } from '@ffmpeg/util';
import { buildOverlayFilterForPalette, validateOverlayConfig } from './overlayHelper';

/**
 * @typedef {Object} ImageItem
 * @property {string} id
 * @property {File} file
 * @property {string} preview
 * @property {number} [delay] - Optional per-frame delay in ms
 */

/**
 * @typedef {Object} GifSettings
 * @property {number} delay
 * @property {number} width
 * @property {number} [height]
 * @property {number} [loop]
 * @property {string} [dither]
 * @property {number} [bayerScale]
 * @property {boolean} [crossfadeEnabled]
 * @property {number} [crossfadeFrames]
 * @property {string} [fillColor]
 * @property {string} [compression] - Compression level: 'none', 'light', 'medium', 'heavy'
 * @property {Object} [overlay] - Overlay configuration
 */

export const generateId = () => crypto.randomUUID();

// ============================================
// WEB WORKER MANAGEMENT
// ============================================

let imageWorker = null;
let workerReady = false;
let workerRequestId = 0;
const pendingRequests = new Map();

/**
 * Check if Web Workers with OffscreenCanvas are supported
 */
const supportsWorkerOffscreenCanvas = () => {
    try {
        if (typeof Worker === 'undefined') return false;
        if (typeof OffscreenCanvas === 'undefined') return false;
        // Test if OffscreenCanvas works
        const canvas = new OffscreenCanvas(1, 1);
        return canvas.getContext('2d') !== null;
    } catch {
        return false;
    }
};

/**
 * Initialize the image processing worker
 */
const initWorker = () => {
    if (imageWorker || !supportsWorkerOffscreenCanvas()) return;

    try {
        // Create worker from the worker file
        imageWorker = new Worker(
            new URL('../workers/imageProcessingWorker.js', import.meta.url),
            { type: 'module' }
        );

        imageWorker.onmessage = (event) => {
            const { type, requestId, result, error } = event.data;

            if (type === 'ready') {
                workerReady = true;
                return;
            }

            if (type === 'progress') {
                // Progress updates for batch processing
                return;
            }

            const pending = pendingRequests.get(requestId);
            if (!pending) return;

            pendingRequests.delete(requestId);

            if (type === 'error') {
                pending.reject(new Error(error));
            } else {
                pending.resolve(result);
            }
        };

        imageWorker.onerror = (error) => {
            console.error('Worker error:', error);
            // Disable worker on error
            workerReady = false;
        };
    } catch (e) {
        console.warn('Failed to initialize image worker:', e);
    }
};

/**
 * Process an image using the Web Worker
 * @param {Blob} imageBlob
 * @param {number} width
 * @param {number} height
 * @param {string} fillColor
 * @returns {Promise<Blob>}
 */
const processWithWorker = (imageBlob, width, height, fillColor) => {
    return new Promise((resolve, reject) => {
        if (!imageWorker || !workerReady) {
            reject(new Error('Worker not available'));
            return;
        }

        const requestId = ++workerRequestId;

        pendingRequests.set(requestId, { resolve, reject });

        imageWorker.postMessage({
            type: 'normalize',
            requestId,
            data: {
                imageBlob,
                width,
                height,
                fillColor,
                id: requestId
            }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                reject(new Error('Worker timeout'));
            }
        }, 30000);
    });
};

// Initialize worker on module load
initWorker();

// ============================================
// CANVAS UTILITIES
// ============================================

/**
 * Yield to the main thread to keep UI responsive
 */
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

/**
 * Check if OffscreenCanvas is supported
 */
const supportsOffscreenCanvas = () => {
    try {
        return typeof OffscreenCanvas !== 'undefined' &&
            new OffscreenCanvas(1, 1).getContext('2d') !== null;
    } catch {
        return false;
    }
};

/**
 * Create a canvas (OffscreenCanvas if supported, regular canvas otherwise)
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement|OffscreenCanvas}
 */
const createCanvas = (width, height) => {
    if (supportsOffscreenCanvas()) {
        return new OffscreenCanvas(width, height);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
};

/**
 * Convert canvas to blob (handles both OffscreenCanvas and regular canvas)
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas
 * @param {string} mimeType
 * @returns {Promise<Blob>}
 */
const canvasToBlob = async (canvas, mimeType = 'image/png') => {
    if (canvas instanceof OffscreenCanvas) {
        return canvas.convertToBlob({ type: mimeType });
    }
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Canvas toBlob returned null'));
            }
        }, mimeType);
    });
};

/**
 * Normalize image to target dimensions using Canvas.
 * Tries Web Worker first for better performance, falls back to main thread.
 * @param {File} file
 * @param {number} width
 * @param {number} height
 * @param {string} fillColor
 * @returns {Promise<Blob>}
 */
const normalizeImage = async (file, width, height, fillColor = 'black') => {
    // Try Web Worker first for better performance
    if (workerReady && imageWorker) {
        try {
            const result = await processWithWorker(file, width, height, fillColor);
            if (result.success && result.arrayBuffer) {
                return new Blob([result.arrayBuffer], { type: result.mimeType });
            }
        } catch (e) {
            // Worker failed, fall through to main thread processing
            console.warn('Worker processing failed, using main thread:', e.message);
        }
    }

    // Fallback: Main thread processing
    // Use ImageBitmap for faster image loading (if available)
    let img;
    try {
        if (typeof createImageBitmap === 'function') {
            img = await createImageBitmap(file);
        } else {
            // Fallback to Image element
            img = await new Promise((resolve, reject) => {
                const url = URL.createObjectURL(file);
                const image = new Image();
                image.onload = () => {
                    URL.revokeObjectURL(url);
                    resolve(image);
                };
                image.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load image'));
                };
                image.src = url;
            });
        }
    } catch (e) {
        throw new Error('Failed to load image: ' + e.message);
    }

    // Yield to prevent UI blocking
    await yieldToMain();

    // Create canvas (OffscreenCanvas if supported)
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get canvas context');
    }

    // Fill with background color
    ctx.fillStyle = fillColor === 'white' ? '#FFFFFF' : '#000000';
    ctx.fillRect(0, 0, width, height);

    // Calculate scale to fit (contain) with aspect ratio preservation
    const scale = Math.min(width / img.width, height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (width - w) / 2;
    const y = (height - h) / 2;

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, x, y, w, h);

    // Close ImageBitmap to free memory
    if (img.close) {
        img.close();
    }

    // Yield before blob conversion (expensive operation)
    await yieldToMain();

    // Convert to PNG blob
    return canvasToBlob(canvas, 'image/png');
};

/**
 * Process images to high-quality GIF using professional FFmpeg parameters.
 * Optimized for performance with:
 * - ImageBitmap for faster image loading
 * - Yield points to prevent UI blocking
 * - Granular progress updates
 */
export const processImagesToGif = async (ffmpeg, images, settings, onProgress) => {
    const { delay, width } = settings;
    const height = settings.height || Math.round(width * (2 / 3));
    const loop = settings.loop ?? 0; // Default: infinite loop
    const dither = settings.dither ?? 'bayer'; // Default: bayer
    const bayerScale = settings.bayerScale ?? 4; // Default: 4
    const crossfadeEnabled = settings.crossfadeEnabled ?? false;
    const crossfadeFrames = Math.min(settings.crossfadeFrames ?? 10, 15); // Cap at 15 for performance

    // Auto-disable crossfade for video mode (high frame count) to prevent exponential processing
    // Crossfade is designed for image slideshows (5-20 images), not video frames (100+ frames)
    const MAX_CROSSFADE_SOURCE_FRAMES = 50;
    const shouldUseCrossfade = crossfadeEnabled && images.length <= MAX_CROSSFADE_SOURCE_FRAMES;
    const fillColor = settings.fillColor ?? 'black'; // Default: black background
    const compression = settings.compression ?? 'none'; // Default: no compression

    // Compression settings: control palette colors for file size reduction
    const compressionConfig = {
        none: { maxColors: 256 },
        light: { maxColors: 128 },
        medium: { maxColors: 128 },
        heavy: { maxColors: 64 }
    };
    const maxColors = compressionConfig[compression]?.maxColors ?? 256;

    // Overlay settings
    const overlay = settings.overlay ?? null;
    const hasOverlay = overlay?.enabled && overlay?.file;

    // Calculate total steps for accurate progress
    const blendFrameCount = shouldUseCrossfade && images.length > 1
        ? (images.length - 1) * crossfadeFrames
        : 0;
    // Add extra step for overlay if enabled
    const overlayStep = hasOverlay ? 1 : 0;
    const totalSteps = images.length + blendFrameCount + 4 + overlayStep; // images + blend frames + list + (overlay) + palette + gif + done
    let currentStep = 0;

    // Time tracking for estimation
    const startTime = performance.now();

    const formatTime = (ms) => {
        if (ms < 1000) return '<1s';
        const seconds = Math.round(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m${secs}s`;
    };

    const updateProgress = (message, step = null) => {
        if (step !== null) currentStep = step;
        const percent = Math.round((currentStep / totalSteps) * 100);

        // Calculate time estimation
        const elapsed = performance.now() - startTime;
        let timeInfo = '';
        if (currentStep > 0 && percent < 100) {
            const avgTimePerStep = elapsed / currentStep;
            const remainingSteps = totalSteps - currentStep;
            const estimatedRemaining = avgTimePerStep * remainingSteps;
            timeInfo = ` (${formatTime(estimatedRemaining)} remaining)`;
        }

        onProgress(`[${percent}%] ${message}${timeInfo}`);
    };

    updateProgress('Preparing images...', 0);

    const fileListEntries = [];

    // Process images with progress updates
    for (let i = 0; i < images.length; i++) {
        updateProgress(`Normalizing image ${i + 1}/${images.length}...`, i);

        try {
            const blob = await normalizeImage(images[i].file, width, height, fillColor);
            const name = `frame_${i.toString().padStart(3, '0')}.png`;

            // Yield before fetchFile (can be slow for large images)
            await yieldToMain();

            const fileData = await fetchFile(blob);

            await yieldToMain();

            await ffmpeg.writeFile(name, fileData);
            fileListEntries.push(name);
        } catch (e) {
            console.error('Error normalizing image:', i, e);
            throw new Error(`Failed to process image ${i + 1}: ${e.message}`);
        }
    }

    // If crossfade is enabled, generate blend frames between each pair of images
    if (shouldUseCrossfade && images.length > 1) {
        const totalTransitions = images.length - 1;
        const blendFramesPerTransition = crossfadeFrames; // Already capped at 15 above
        let blendFrameIndex = 0;
        const totalBlendFrames = totalTransitions * blendFramesPerTransition;

        updateProgress(`Generating crossfade (0/${totalBlendFrames} frames)...`, images.length);
        await yieldToMain();

        const blendFrameNames = [];

        // Reuse a single canvas to reduce memory pressure (OffscreenCanvas if supported)
        const blendCanvas = createCanvas(width, height);
        const blendCtx = blendCanvas.getContext('2d');

        for (let i = 0; i < fileListEntries.length - 1; i++) {
            // Read the two frames to blend
            const frame1Data = await ffmpeg.readFile(fileListEntries[i]);
            const frame2Data = await ffmpeg.readFile(fileListEntries[i + 1]);

            // Create blobs and load as images
            const blob1 = new Blob([frame1Data], { type: 'image/png' });
            const blob2 = new Blob([frame2Data], { type: 'image/png' });

            const [img1, img2] = await Promise.all([
                createImageBitmap(blob1),
                createImageBitmap(blob2)
            ]);

            // Generate blend frames
            for (let j = 1; j <= blendFramesPerTransition; j++) {
                const alpha = j / (blendFramesPerTransition + 1);

                // Clear and reuse canvas
                blendCtx.globalAlpha = 1;
                blendCtx.clearRect(0, 0, width, height);

                // Draw first image
                blendCtx.drawImage(img1, 0, 0, width, height);

                // Overlay second image with interpolated alpha
                blendCtx.globalAlpha = alpha;
                blendCtx.drawImage(img2, 0, 0, width, height);

                // Convert to blob and write to ffmpeg
                const blendBlob = await canvasToBlob(blendCanvas, 'image/png');

                const blendName = `blend_${i}_${j.toString().padStart(2, '0')}.png`;
                const blendData = await fetchFile(blendBlob);
                await ffmpeg.writeFile(blendName, blendData);
                blendFrameNames.push({ afterFrame: i, name: blendName });

                // Update progress for each blend frame
                blendFrameIndex++;
                updateProgress(`Generating crossfade (${blendFrameIndex}/${totalBlendFrames} frames)...`, images.length + blendFrameIndex);

                await yieldToMain();
            }

            img1.close();
            img2.close();
        }

        // Rebuild file list with blend frames interspersed
        const newFileList = [];
        for (let i = 0; i < fileListEntries.length; i++) {
            newFileList.push(fileListEntries[i]);
            // Add blend frames after this frame (except after the last frame)
            const blendsAfterThis = blendFrameNames.filter(b => b.afterFrame === i);
            for (const blend of blendsAfterThis) {
                newFileList.push(blend.name);
            }
        }
        fileListEntries.length = 0;
        fileListEntries.push(...newFileList);
    }

    updateProgress('Generating file list...', images.length);
    await yieldToMain();

    // Duration in seconds - shorter for blend frames
    const baseDuration = delay / 1000;
    const blendDuration = shouldUseCrossfade ? (baseDuration / (crossfadeFrames + 1)).toFixed(3) : baseDuration.toFixed(3);

    // Track which original frame each file entry corresponds to
    let originalFrameIndex = 0;

    let listContent = fileListEntries.map((name, idx) => {
        // Use shorter duration for blend frames, per-frame or global duration for original frames
        const isBlendFrame = name.startsWith('blend_');

        if (isBlendFrame) {
            return `file '${name}'\nduration ${blendDuration}`;
        }

        // Get per-frame delay if available, otherwise use global delay
        const frameImage = images[originalFrameIndex];
        const frameDelay = frameImage?.delay ?? delay;
        const frameDuration = (frameDelay / 1000).toFixed(3);
        originalFrameIndex++;

        return `file '${name}'\nduration ${frameDuration}`;
    }).join('\n');

    // Concat demuxer requires last file to be listed again
    if (fileListEntries.length > 0) {
        listContent += `\nfile '${fileListEntries[fileListEntries.length - 1]}'`;
    }

    await ffmpeg.writeFile('list.txt', listContent);

    // ============================================
    // OVERLAY PREPARATION (if enabled)
    // ============================================

    let overlayInputIndex = -1;
    const overlayFileName = 'overlay_input.png';

    if (hasOverlay) {
        updateProgress('Preparing overlay...', images.length + blendFrameCount + 1);
        await yieldToMain();

        try {
            // Validate overlay config
            const validation = validateOverlayConfig(overlay);
            if (!validation.valid) {
                console.warn('Overlay validation failed:', validation.errors);
            } else {
                // Write overlay file to FFmpeg virtual filesystem
                const overlayData = await fetchFile(overlay.file);
                await ffmpeg.writeFile(overlayFileName, overlayData);
                overlayInputIndex = 1; // Will be input [1] after list.txt
            }
        } catch (e) {
            console.error('Failed to prepare overlay:', e);
            // Continue without overlay
        }
    }

    // ============================================
    // HIGH QUALITY 2-PASS GIF GENERATION
    // ============================================

    const paletteStep = images.length + blendFrameCount + overlayStep + 1;
    updateProgress('Pass 1/2: Generating palette...', paletteStep);
    await yieldToMain();

    // Pre-compute overlay filter string (reused in both passes)
    const overlayFilter = overlayInputIndex >= 0
        ? buildOverlayFilterForPalette(width, overlay, 'main')
        : null;

    // Build palettegen command based on whether overlay is enabled
    if (overlayFilter) {
        // With overlay: apply overlay first, then generate palette
        // Filter chain: [0:v] (video) + [1:v] (overlay) -> overlay -> palettegen
        const palettegenFilter = `${overlayFilter};[main]palettegen=reserve_transparent=off:stats_mode=full:max_colors=${maxColors}`;

        await ffmpeg.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', 'list.txt',
            '-i', overlayFileName,
            '-filter_complex', palettegenFilter,
            '-y', 'palette.png'
        ]);
    } else {
        // Without overlay: standard palettegen
        await ffmpeg.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', 'list.txt',
            '-vf', `palettegen=reserve_transparent=off:stats_mode=full:max_colors=${maxColors}`,
            '-y', 'palette.png'
        ]);
    }

    const gifStep = paletteStep + 1;
    updateProgress('Pass 2/2: Rendering GIF (this may take a while)...', gifStep);
    await yieldToMain();

    // Pass 2: Generate GIF with high-quality settings
    // Build paletteuse filter based on dither algorithm
    let paletteUseOpts = '';
    if (dither === 'none') {
        paletteUseOpts = 'dither=none';
    } else if (dither === 'bayer') {
        paletteUseOpts = `dither=bayer:bayer_scale=${bayerScale}`;
    } else {
        paletteUseOpts = `dither=${dither}`;
    }
    paletteUseOpts += ':diff_mode=rectangle';

    // Build filter_complex based on whether overlay is enabled
    if (overlayFilter) {
        // With overlay: [0:v] + [1:v] -> overlay -> paletteuse with [2:v] (palette)
        const filterComplex = `${overlayFilter};[main][2:v]paletteuse=${paletteUseOpts}`;

        await ffmpeg.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', 'list.txt',
            '-i', overlayFileName,
            '-i', 'palette.png',
            '-filter_complex', filterComplex,
            '-loop', String(loop),
            '-y', 'output.gif'
        ]);
    } else {
        // Without overlay: standard paletteuse
        const filterComplex = `[0:v][1:v]paletteuse=${paletteUseOpts}`;

        await ffmpeg.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', 'list.txt',
            '-i', 'palette.png',
            '-filter_complex', filterComplex,
            '-loop', String(loop),
            '-y', 'output.gif'
        ]);
    }

    updateProgress('Reading output...', gifStep + 1);
    await yieldToMain();

    const data = await ffmpeg.readFile('output.gif');

    // Cleanup temporary files to free memory
    try {
        for (const name of fileListEntries) {
            await ffmpeg.deleteFile(name);
        }
        await ffmpeg.deleteFile('list.txt');
        await ffmpeg.deleteFile('palette.png');
        await ffmpeg.deleteFile('output.gif');
        // Cleanup overlay file if it was created
        if (overlayInputIndex >= 0) {
            await ffmpeg.deleteFile(overlayFileName);
        }
    } catch (e) {
        // Ignore cleanup errors
    }

    updateProgress('Done!', totalSteps);

    return URL.createObjectURL(new Blob([data.buffer], { type: 'image/gif' }));
};
