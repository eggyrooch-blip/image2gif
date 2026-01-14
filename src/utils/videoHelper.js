import { fetchFile } from '@ffmpeg/util';

/**
 * Fast-path: read video metadata via <video> without decoding full stream.
 * Falls back to FFmpeg in getVideoMetadata when unavailable.
 * @param {File} file
 * @returns {Promise<{duration: number, width: number, height: number}>}
 */
export const getVideoMetadataFast = async (file) => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';

        const cleanup = () => {
            URL.revokeObjectURL(url);
            video.src = '';
        };

        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Metadata read timeout'));
        }, 5000);

        video.onloadedmetadata = () => {
            clearTimeout(timeout);
            const duration = Number.isFinite(video.duration) ? video.duration : 0;
            resolve({
                duration,
                width: video.videoWidth || 0,
                height: video.videoHeight || 0
            });
            cleanup();
        };

        video.onerror = () => {
            clearTimeout(timeout);
            cleanup();
            reject(new Error('Failed to read metadata with <video>'));
        };

        video.src = url;
    });
};

/**
 * Extract metadata from a video file using a fast DOM path first,
 * then FFmpeg as a fallback for edge cases.
 * @param {FFmpeg} ffmpeg - FFmpeg instance
 * @param {File} file - Video file
 * @returns {Promise<{duration: number, width: number, height: number}>}
 */
export const getVideoMetadata = async (ffmpeg, file) => {
    // Try <video> metadata first (fast, no heavy decode)
    try {
        const fast = await getVideoMetadataFast(file);
        if (fast.duration > 0 && fast.width > 0 && fast.height > 0) {
            return fast;
        }
    } catch (e) {
        // Fall back to FFmpeg
    }

    // Fallback: FFmpeg parse (slower, full decode of headers)
    const inputName = 'input_meta' + getExtension(file.name);

    // Write file to FFmpeg virtual filesystem
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Metadata to extract
    let metadata = {
        duration: 0,
        width: 0,
        height: 0
    };

    // Capture log messages to parse metadata
    const logMessages = [];
    const logHandler = ({ message }) => {
        logMessages.push(message);
    };

    ffmpeg.on('log', logHandler);

    try {
        // Run FFmpeg with -i only to get metadata (will error but that's ok)
        await ffmpeg.exec(['-i', inputName, '-f', 'null', '-']);
    } catch (e) {
        // Expected to fail, we just want the log output
    }

    ffmpeg.off('log', logHandler);

    // Parse metadata from logs
    const fullLog = logMessages.join('\n');

    // Parse duration: "Duration: 00:00:10.50"
    const durationMatch = fullLog.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
    if (durationMatch) {
        const [, h, m, s, cs] = durationMatch;
        metadata.duration = parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(cs) / 100;
    }

    // Parse resolution: look for pattern like "1920x1080" or "1280x720"
    const resMatch = fullLog.match(/(\d{2,5})x(\d{2,5})/);
    if (resMatch) {
        metadata.width = parseInt(resMatch[1]);
        metadata.height = parseInt(resMatch[2]);
    }

    // Cleanup
    try {
        await ffmpeg.deleteFile(inputName);
    } catch (e) {
        // Ignore cleanup errors
    }

    return metadata;
};

/**
 * Generate a thumbnail from video using DOM path first, FFmpeg as fallback.
 * @param {FFmpeg} ffmpeg - FFmpeg instance
 * @param {File} file - Video file
 * @param {number} time - Time in seconds to extract thumbnail (default: 0)
 * @returns {Promise<string>} - Blob URL of thumbnail
 */
export const generateVideoThumbnail = async (ffmpeg, file, time = 0) => {
    try {
        const fast = await generateVideoThumbnailFast(file, time);
        if (fast) return fast;
    } catch (e) {
        // Fall through to FFmpeg path
    }
    return generateVideoThumbnailWithFFmpeg(ffmpeg, file, time);
};

/**
 * Thumbnail via <video> + canvas (fast path, no wasm).
 * @param {File} file
 * @param {number} time
 * @returns {Promise<string|null>}
 */
export const generateVideoThumbnailFast = async (file, time = 0) => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;

        let cleaned = false;
        const cleanup = () => {
            if (cleaned) return;
            cleaned = true;
            URL.revokeObjectURL(url);
            video.src = '';
        };

        const bail = (err) => {
            cleanup();
            reject(err instanceof Error ? err : new Error(String(err)));
        };

        video.onloadedmetadata = () => {
            const targetTime = Math.max(0, Math.min(time, Number.isFinite(video.duration) ? Math.max(video.duration - 0.05, 0) : time));
            // Some browsers require readyState before seeking
            if (video.readyState >= 2) {
                video.currentTime = targetTime;
            } else {
                video.oncanplay = () => {
                    video.currentTime = targetTime;
                };
            }
        };

        video.onseeked = () => {
            try {
                const targetWidth = 320;
                const scale = video.videoWidth ? targetWidth / video.videoWidth : 1;
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = Math.max(1, Math.round((video.videoHeight || 1) * scale));
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    cleanup();
                    if (!blob) {
                        reject(new Error('Failed to create thumbnail blob'));
                        return;
                    }
                    resolve(URL.createObjectURL(blob));
                }, 'image/jpeg', 0.8);
            } catch (e) {
                bail(e);
            }
        };

        video.onerror = () => bail(new Error('Failed to generate thumbnail with <video>'));

        video.src = url;
    });
};

/**
 * Thumbnail via FFmpeg (fallback).
 */
const generateVideoThumbnailWithFFmpeg = async (ffmpeg, file, time = 0) => {
    const inputName = 'input_thumb' + getExtension(file.name);
    const outputName = 'thumbnail.jpg';

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
        '-ss', String(time),
        '-i', inputName,
        '-vframes', '1',
        '-vf', 'scale=320:-1',
        '-q:v', '2',
        '-y', outputName
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);

    // Cleanup
    try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
    } catch (e) {
        // Ignore
    }

    return url;
};

/**
 * Extract frames from video
 * @param {FFmpeg} ffmpeg - FFmpeg instance
 * @param {File} file - Video file
 * @param {Object} options - Extraction options
 * @param {number} options.startTime - Start time in seconds
 * @param {number} options.endTime - End time in seconds
 * @param {number} options.fps - Frames per second to extract
 * @param {number} options.width - Target width (optional, for scaling)
 * @param {Function} onProgress - Progress callback
 * @param {Object} abortRef - Ref with .current boolean to check for cancellation
 * @returns {Promise<Array<{id: string, file: File, preview: string, delay: number|null}>>}
 */
export const extractFramesFromVideo = async (
    ffmpeg,
    file,
    { startTime = 0, endTime, fps = 10, width },
    onProgress,
    abortRef
) => {
    const inputName = 'input_extract' + getExtension(file.name);

    // Calculate expected frame count
    const duration = endTime - startTime;
    const expectedFrames = Math.ceil(duration * fps);

    onProgress?.({ stage: 'writing', current: 0, total: expectedFrames });

    // Write video file
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    if (abortRef?.current) {
        await cleanup(ffmpeg, [inputName]);
        throw new Error('Cancelled');
    }

    onProgress?.({ stage: 'extracting', current: 0, total: expectedFrames });

    // Build FFmpeg command
    const vfFilters = [`fps=${fps}`];
    if (width) {
        vfFilters.push(`scale=${width}:-1`);
    }

    const args = [
        '-ss', String(startTime),
        '-i', inputName,
        '-t', String(duration),
        '-vf', vfFilters.join(','),
        '-y',
        'frame_%04d.png'
    ];

    await ffmpeg.exec(args);

    if (abortRef?.current) {
        await cleanupFrames(ffmpeg, inputName, expectedFrames);
        throw new Error('Cancelled');
    }

    // Read extracted frames
    const frames = [];
    onProgress?.({ stage: 'reading', current: 0, total: expectedFrames });

    for (let i = 1; i <= expectedFrames + 10; i++) { // +10 buffer for rounding
        if (abortRef?.current) {
            // Cleanup on cancel
            await cleanupFrames(ffmpeg, inputName, i + expectedFrames);
            throw new Error('Cancelled');
        }

        const filename = `frame_${i.toString().padStart(4, '0')}.png`;
        try {
            const data = await ffmpeg.readFile(filename);
            const blob = new Blob([data], { type: 'image/png' });
            const frameFile = new File([blob], filename, { type: 'image/png' });

            frames.push({
                id: crypto.randomUUID(),
                file: frameFile,
                preview: URL.createObjectURL(blob),
                delay: null // Will use calculated delay from FPS
            });

            // Delete frame file immediately to free memory
            await ffmpeg.deleteFile(filename);

            onProgress?.({ stage: 'reading', current: frames.length, total: expectedFrames });
        } catch (e) {
            // No more frames
            break;
        }
    }

    // Cleanup input file
    try {
        await ffmpeg.deleteFile(inputName);
    } catch (e) {
        // Ignore
    }

    return frames;
};

/**
 * Format seconds to MM:SS.ms format
 * @param {number} seconds
 * @returns {string}
 */
export const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

/**
 * Parse time string to seconds
 * @param {string} timeStr - Format: "MM:SS" or "MM:SS.ms"
 * @returns {number}
 */
export const parseTime = (timeStr) => {
    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;

    const mins = parseInt(parts[0]) || 0;
    const secParts = parts[1].split('.');
    const secs = parseInt(secParts[0]) || 0;
    const ms = secParts[1] ? parseInt(secParts[1]) / 100 : 0;

    return mins * 60 + secs + ms;
};

/**
 * Calculate estimated frame count
 * @param {number} startTime
 * @param {number} endTime
 * @param {number} fps
 * @returns {number}
 */
export const estimateFrameCount = (startTime, endTime, fps) => {
    const duration = endTime - startTime;
    return Math.ceil(duration * fps);
};

// Helper functions
function getExtension(filename) {
    const match = filename.match(/\.[^.]+$/);
    return match ? match[0] : '.mp4';
}

async function cleanup(ffmpeg, files) {
    for (const file of files) {
        try {
            await ffmpeg.deleteFile(file);
        } catch (e) {
            // Ignore
        }
    }
}

async function cleanupFrames(ffmpeg, inputName, maxFrames) {
    const files = [inputName];
    for (let i = 1; i <= maxFrames; i++) {
        files.push(`frame_${i.toString().padStart(4, '0')}.png`);
    }
    await cleanup(ffmpeg, files);
}
