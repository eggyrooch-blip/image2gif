import { fetchFile } from '@ffmpeg/util';
import { buildOverlayFilterForPalette, validateOverlayConfig, buildOverlayFilterComplex } from './overlayHelper';

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
 * @property {number} [fps] - Target FPS for video output
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

/**
 * Process images to Animated WebP using FFmpeg.
 * WebP provides better compression than GIF with higher quality.
 * Single-pass encoding (no palette generation needed).
 */
export const processImagesToWebP = async (ffmpeg, images, settings, onProgress) => {
    const { delay, width } = settings;
    const height = settings.height || Math.round(width * (2 / 3));
    const loop = settings.loop ?? 0; // Default: infinite loop
    const fillColor = settings.fillColor ?? 'black';
    const compression = settings.compression ?? 'none';

    // WebP quality mapping (higher = better quality, larger file)
    const qualityMap = {
        none: 90,    // Best quality
        light: 85,
        medium: 75,
        heavy: 60    // Most compression
    };
    const quality = qualityMap[compression] ?? 80;

    // Calculate total steps for accurate progress
    const totalSteps = images.length + 3; // images + list + encode + done
    let currentStep = 0;

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

    updateProgress('Generating file list...', images.length);
    await yieldToMain();

    // Build file list for concat demuxer
    let listContent = fileListEntries.map((name, idx) => {
        const frameImage = images[idx];
        const frameDelay = frameImage?.delay ?? delay;
        const frameDuration = (frameDelay / 1000).toFixed(3);
        return `file '${name}'\nduration ${frameDuration}`;
    }).join('\n');

    // Concat demuxer requires last file to be listed again
    if (fileListEntries.length > 0) {
        listContent += `\nfile '${fileListEntries[fileListEntries.length - 1]}'`;
    }

    await ffmpeg.writeFile('list.txt', listContent);

    // ============================================
    // SINGLE-PASS WEBP ENCODING
    // ============================================

    updateProgress('Encoding WebP (this may take a while)...', images.length + 1);
    await yieldToMain();

    // WebP encoding with quality settings
    await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c:v', 'libwebp',
        '-lossless', '0',
        '-q:v', String(quality),
        '-loop', String(loop),
        '-y', 'output.webp'
    ]);

    updateProgress('Reading output...', images.length + 2);
    await yieldToMain();

    const data = await ffmpeg.readFile('output.webp');

    // Cleanup temporary files
    try {
        for (const name of fileListEntries) {
            await ffmpeg.deleteFile(name);
        }
        await ffmpeg.deleteFile('list.txt');
        await ffmpeg.deleteFile('output.webp');
    } catch (e) {
        // Ignore cleanup errors
    }

    updateProgress('Done!', totalSteps);

    return URL.createObjectURL(new Blob([data.buffer], { type: 'image/webp' }));
};

/**
 * Process images to APNG (Animated PNG) using FFmpeg.
 * APNG preserves full PNG quality without palette limitations.
 * Best for UI screenshots, text, and graphics requiring lossless compression.
 */
export const processImagesToAPNG = async (ffmpeg, images, settings, onProgress) => {
    const { delay, width } = settings;
    const height = settings.height || Math.round(width * (2 / 3));
    const loop = settings.loop ?? 0; // Default: infinite loop (0 = infinite in APNG)
    const fillColor = settings.fillColor ?? 'black';
    const compression = settings.compression ?? 'none';

    // APNG compression level mapping (higher = smaller file, slower)
    const compressionMap = {
        none: 6,     // Default
        light: 7,
        medium: 8,
        heavy: 9     // Maximum compression
    };
    const compressionLevel = compressionMap[compression] ?? 6;

    // Calculate total steps
    const totalSteps = images.length + 3; // images + list + encode + done
    let currentStep = 0;

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

    updateProgress('Generating file list...', images.length);
    await yieldToMain();

    // Build file list for concat demuxer
    let listContent = fileListEntries.map((name, idx) => {
        const frameImage = images[idx];
        const frameDelay = frameImage?.delay ?? delay;
        const frameDuration = (frameDelay / 1000).toFixed(3);
        return `file '${name}'\nduration ${frameDuration}`;
    }).join('\n');

    // Concat demuxer requires last file to be listed again
    if (fileListEntries.length > 0) {
        listContent += `\nfile '${fileListEntries[fileListEntries.length - 1]}'`;
    }

    await ffmpeg.writeFile('list.txt', listContent);

    // ============================================
    // SINGLE-PASS APNG ENCODING
    // ============================================

    updateProgress('Encoding APNG (this may take a while)...', images.length + 1);
    await yieldToMain();

    // APNG encoding
    // Note: -plays controls loop count (0 = infinite)
    await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'list.txt',
        '-c:v', 'apng',
        '-plays', String(loop),
        '-compression_level', String(compressionLevel),
        '-f', 'apng',
        '-y', 'output.apng'
    ]);

    updateProgress('Reading output...', images.length + 2);
    await yieldToMain();

    const data = await ffmpeg.readFile('output.apng');

    // Cleanup temporary files
    try {
        for (const name of fileListEntries) {
            await ffmpeg.deleteFile(name);
        }
        await ffmpeg.deleteFile('list.txt');
        await ffmpeg.deleteFile('output.apng');
    } catch (e) {
        // Ignore cleanup errors
    }

    updateProgress('Done!', totalSteps);

    return URL.createObjectURL(new Blob([data.buffer], { type: 'image/apng' }));
};

/**
 * Process images to MP4 using FFmpeg (H.264).
 */
export const processImagesToMp4 = async (ffmpeg, images, settings, onProgress) => {
    const { delay, width } = settings;
    // MP4 requires even dimensions
    const makeEven = (n) => n % 2 === 0 ? n : n + 1;
    const targetWidth = makeEven(width);
    const targetHeight = makeEven(settings.height || Math.round(width * (2 / 3)));

    // Default fps to 24 if not specified (or 'auto')
    const fps = (settings.fps && settings.fps !== 'auto') ? settings.fps : 24;
    const fillColor = settings.fillColor ?? 'black';

    // Calculate total steps
    const totalSteps = images.length + 3; // images + list + encode + done
    let currentStep = 0;

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

    // Process images
    for (let i = 0; i < images.length; i++) {
        updateProgress(`Normalizing image ${i + 1}/${images.length}...`, i);

        try {
            // Note: We use targetWidth/Height here to ensure all inputs match target resolution
            // This simplifies the FFmpeg filter chain later
            const blob = await normalizeImage(images[i].file, targetWidth, targetHeight, fillColor);
            const name = `frame_${i.toString().padStart(3, '0')}.png`;

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

    // Add overlay if enabled
    const overlay = settings.overlay ?? null;
    const hasOverlay = overlay?.enabled && overlay?.file;
    const overlayFileName = 'overlay.png';

    if (hasOverlay) {
        updateProgress('Preparing overlay...', images.length);
        const overlayData = await fetchFile(overlay.file);
        await ffmpeg.writeFile(overlayFileName, overlayData);
    }

    updateProgress('Generating file list...', images.length + 1);
    await yieldToMain();

    // Prepare list.txt
    let listContent = fileListEntries.map((name, idx) => {
        const frameImage = images[idx];
        const frameDelay = frameImage?.delay ?? delay;
        const frameDuration = (frameDelay / 1000).toFixed(3);
        return `file '${name}'\nduration ${frameDuration}`;
    }).join('\n');

    if (fileListEntries.length > 0) {
        listContent += `\nfile '${fileListEntries[fileListEntries.length - 1]}'`;
    }

    await ffmpeg.writeFile('list.txt', listContent);

    // ============================================
    // ENCODING
    // ============================================

    updateProgress('Encoding MP4...', images.length + 2);
    await yieldToMain();

    const args = ['-f', 'concat', '-safe', '0', '-i', 'list.txt'];

    // Add overlay input if enabled
    if (hasOverlay) {
        args.push('-i', overlayFileName);
        // Use filter_complex for overlay
        const overlayFilter = buildOverlayFilterComplex(targetWidth, overlay);
        // Map [0:v] through overlay
        args.push('-filter_complex', `${overlayFilter},format=yuv420p`);
    } else {
        args.push('-pix_fmt', 'yuv420p');
    }

    args.push(
        '-r', String(fps),
        '-vsync', 'vfr',
        '-c:v', 'libx264',
        '-movflags', '+faststart',
        '-preset', 'veryfast',  // Use veryfast for browser performance
        '-y', 'output.mp4'
    );

    await ffmpeg.exec(args);

    updateProgress('Reading output...', images.length + 3);
    await yieldToMain();

    const data = await ffmpeg.readFile('output.mp4');

    // Cleanup
    try {
        for (const name of fileListEntries) {
            await ffmpeg.deleteFile(name);
        }
        await ffmpeg.deleteFile('list.txt');
        await ffmpeg.deleteFile('output.mp4');
        if (hasOverlay) await ffmpeg.deleteFile(overlayFileName);
    } catch (e) {
        // Ignore cleanup errors
    }

    updateProgress('Done!', totalSteps);

    return URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
};

/**
 * Process images to the specified output format
 * @param {FFmpeg} ffmpeg - FFmpeg instance
 * @param {ImageItem[]} images - Array of images
 * @param {GifSettings & {outputFormat?: string}} settings - Settings including outputFormat
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} - Blob URL of the output
 */
export const processImagesToFormat = async (ffmpeg, images, settings, onProgress) => {
    const format = settings.outputFormat || 'gif';

    switch (format) {
        case 'webp':
            return processImagesToWebP(ffmpeg, images, settings, onProgress);
        case 'apng':
            return processImagesToAPNG(ffmpeg, images, settings, onProgress);
        case 'mp4':
            return processImagesToMp4(ffmpeg, images, settings, onProgress);
        case 'gif':
        default:
            return processImagesToGif(ffmpeg, images, settings, onProgress);
    }
};

/**
 * Get the file extension for an output format
 * @param {string} format - Output format ('gif', 'webp', 'apng')
 * @returns {string} - File extension
 */
export const getFormatExtension = (format) => {
    const extensions = {
        gif: 'gif',
        webp: 'webp',
        apng: 'png',
        mp4: 'mp4'
    };
    return extensions[format] || 'gif';
};

/**
 * Get the MIME type for an output format
 * @param {string} format - Output format ('gif', 'webp', 'apng')
 * @returns {string} - MIME type
 */
export const getFormatMimeType = (format) => {
    const mimeTypes = {
        gif: 'image/gif',
        webp: 'image/webp',
        apng: 'image/apng',
        mp4: 'video/mp4'
    };
    return mimeTypes[format] || 'image/gif';
};

/**
 * Get the human-readable label for an output format
 * @param {string} format - Output format ('gif', 'webp', 'apng')
 * @returns {string} - Human-readable label
 */
export const getFormatLabel = (format) => {
    const labels = {
        gif: 'GIF',
        webp: 'WebP',
        apng: 'APNG',
        mp4: 'MP4'
    };
    return labels[format] || 'GIF';
};

/**
 * Compress a GIF by optimizing palette, resolution, and FPS.
 * Implements ITERATIVE COMPRESSION to meet target file size.
 * 
 * Strategies (applied progressively if needed):
 * 1. Reduce color palette (maxColors)
 * 2. Reduce FPS
 * 3. Reduce resolution (scale)
 * 4. Repeat with more aggressive settings until target is met
 * 
 * @param {FFmpeg} ffmpeg
 * @param {File} file
 * @param {Object} options
 * @param {string} options.quality - 'light' (256 colors), 'medium' (128 colors), 'heavy' (64 colors)
 * @param {number} [options.targetHeight] - Optional target height to scale to
 * @param {number} [options.fps] - Target FPS
 * @param {number} [options.targetSizeBytes] - Target file size in bytes (e.g., 15MB = 15 * 1024 * 1024)
 * @param {Function} onProgress
 */
export const compressGif = async (ffmpeg, file, options, onProgress) => {
    const { quality = 'medium', targetHeight, fps, targetSizeBytes } = options;

    const qualityMap = {
        light: 256,
        medium: 128,
        heavy: 64
    };

    // Define compression levels for iterative compression
    // Each level is progressively more aggressive
    const compressionLevels = [
        { colors: qualityMap[quality] || 128, fpsMultiplier: 1.0, scaleMultiplier: 1.0, name: 'Initial' },
        { colors: Math.min(qualityMap[quality] || 128, 128), fpsMultiplier: 0.8, scaleMultiplier: 1.0, name: 'Reduce FPS' },
        { colors: 64, fpsMultiplier: 0.7, scaleMultiplier: 1.0, name: 'Reduce colors' },
        { colors: 64, fpsMultiplier: 0.6, scaleMultiplier: 0.85, name: 'Reduce resolution 15%' },
        { colors: 48, fpsMultiplier: 0.5, scaleMultiplier: 0.75, name: 'Aggressive: 25% smaller' },
        { colors: 32, fpsMultiplier: 0.4, scaleMultiplier: 0.6, name: 'Very aggressive: 40% smaller' },
        { colors: 24, fpsMultiplier: 0.3, scaleMultiplier: 0.5, name: 'Maximum: 50% smaller' },
    ];

    const inputName = `input_${file.name.replace(/\s+/g, '_')}`;
    const outputName = 'compressed.gif';
    const paletteName = 'palette.png';

    const cleanUp = async (keepInput = false) => {
        try {
            if (!keepInput) await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile(outputName);
            await ffmpeg.deleteFile(paletteName);
        } catch (e) { }
    };

    /**
     * Perform a single compression attempt with given parameters
     */
    const compressOnce = async (maxColors, currentFps, currentHeight) => {
        // Build filter chain
        let filters = [];

        if (currentHeight) {
            filters.push(`scale=-2:${currentHeight}:flags=lanczos`);
        }

        if (currentFps) {
            filters.push(`fps=${currentFps}`);
        }

        const preFilter = filters.join(',');

        // Pass 1: Generate palette
        let paletteGenFilter = 'palettegen=reserve_transparent=off:stats_mode=diff';
        if (maxColors < 256) {
            paletteGenFilter += `:max_colors=${maxColors}`;
        }

        let pass1Filter = paletteGenFilter;
        if (preFilter) {
            pass1Filter = `${preFilter},${paletteGenFilter}`;
        }

        await ffmpeg.exec([
            '-i', inputName,
            '-vf', pass1Filter,
            '-y', paletteName
        ]);

        // Pass 2: Encode GIF
        let filterComplex = '';
        if (preFilter) {
            filterComplex = `[0:v]${preFilter}[processed];[processed][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`;
        } else {
            filterComplex = `[0:v][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`;
        }

        await ffmpeg.exec([
            '-i', inputName,
            '-i', paletteName,
            '-filter_complex', filterComplex,
            '-y', outputName
        ]);

        const data = await ffmpeg.readFile(outputName);
        return data;
    };

    try {
        onProgress({ phase: 'preparing', text: 'Preparing file...' });
        await ffmpeg.writeFile(inputName, await fetchFile(file));

        // Determine base parameters
        const baseFps = fps || 15; // Default FPS if not specified
        const baseHeight = targetHeight || null;

        // For iterative compression, we need to know the original dimensions
        // to apply scale multipliers when no targetHeight is specified
        let originalHeight = null;
        if (!baseHeight && targetSizeBytes) {
            // Get original dimensions using Image API
            try {
                const imgUrl = URL.createObjectURL(file);
                const img = new Image();
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = imgUrl;
                });
                originalHeight = img.height;
                URL.revokeObjectURL(imgUrl);
            } catch {
                originalHeight = 720; // Fallback to 720p
            }
        }

        let result = null;
        let finalSize = 0;
        let attemptCount = 0;
        const maxAttempts = targetSizeBytes ? compressionLevels.length : 1;

        for (let i = 0; i < maxAttempts; i++) {
            attemptCount = i + 1;
            const level = compressionLevels[i];

            // Calculate parameters for this attempt
            const currentColors = level.colors;
            const currentFps = Math.max(5, Math.round(baseFps * level.fpsMultiplier)); // Min 5 FPS

            // Apply scale multiplier: use baseHeight if specified, otherwise use originalHeight for later attempts
            let currentHeight = null;
            if (baseHeight) {
                currentHeight = Math.round(baseHeight * level.scaleMultiplier);
            } else if (level.scaleMultiplier < 1 && originalHeight) {
                // No explicit target, but we need to scale down for this compression level
                currentHeight = Math.round(originalHeight * level.scaleMultiplier);
            }

            if (i === 0) {
                onProgress({ phase: 'analyzing', text: 'Analyzing colors...' });
            } else {
                onProgress({
                    phase: 'encoding',
                    text: `Attempt ${attemptCount}: ${level.name} (${currentColors} colors, ${currentFps}fps${currentHeight ? `, ${currentHeight}p` : ''})...`
                });
            }

            // Perform compression
            onProgress({ phase: 'encoding', text: i === 0 ? 'Optimizing & Encoding...' : `Re-compressing (attempt ${attemptCount})...` });

            const data = await compressOnce(currentColors, currentFps, currentHeight);
            finalSize = data.length;

            // Check if we meet the target size
            if (!targetSizeBytes || finalSize <= targetSizeBytes) {
                result = data;
                break;
            }

            // Log progress for debugging
            const targetMB = (targetSizeBytes / (1024 * 1024)).toFixed(1);
            const currentMB = (finalSize / (1024 * 1024)).toFixed(1);
            console.log(`Compression attempt ${attemptCount}: ${currentMB}MB (target: ${targetMB}MB) - trying more aggressive settings...`);

            // If this is the last attempt, use this result even if over target
            if (i === maxAttempts - 1) {
                result = data;
                console.warn(`Could not reach target size ${targetMB}MB. Final size: ${currentMB}MB`);
            }
        }

        onProgress({ phase: 'finalizing', text: 'Finalizing...' });

        await cleanUp();

        return {
            url: URL.createObjectURL(new Blob([result.buffer], { type: 'image/gif' })),
            size: result.length,
            attempts: attemptCount
        };

    } catch (e) {
        await cleanUp();
        throw e;
    }
};
