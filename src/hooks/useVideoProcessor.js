import { useState, useRef, useCallback } from 'react';
import {
    getVideoMetadata,
    generateVideoThumbnail,
    extractFramesFromVideo
} from '../utils/videoHelper';

/**
 * Hook for video processing operations
 * @param {FFmpeg} ffmpeg - FFmpeg instance from useFFmpeg
 * @param {boolean} loaded - Whether FFmpeg is loaded
 */
export const useVideoProcessor = (ffmpeg, loaded) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({
        stage: '',    // 'writing' | 'extracting' | 'reading'
        current: 0,
        total: 0
    });

    const abortRef = useRef(false);

    /**
     * Extract metadata from a video file
     * @param {File} file - Video file
     * @returns {Promise<{duration: number, width: number, height: number}>}
     */
    const extractMetadata = useCallback(async (file) => {
        if (!loaded || !ffmpeg) {
            throw new Error('FFmpeg not loaded');
        }

        try {
            return await getVideoMetadata(ffmpeg, file);
        } catch (error) {
            console.error('Failed to extract metadata:', error);
            throw error;
        }
    }, [ffmpeg, loaded]);

    /**
     * Generate thumbnail from video
     * @param {File} file - Video file
     * @param {number} time - Time in seconds (default: 0)
     * @returns {Promise<string>} - Blob URL
     */
    const generateThumbnail = useCallback(async (file, time = 0) => {
        if (!loaded || !ffmpeg) {
            throw new Error('FFmpeg not loaded');
        }

        try {
            return await generateVideoThumbnail(ffmpeg, file, time);
        } catch (error) {
            console.error('Failed to generate thumbnail:', error);
            throw error;
        }
    }, [ffmpeg, loaded]);

    /**
     * Extract frames from video
     * @param {File} file - Video file
     * @param {Object} options - Extraction options
     * @param {number} options.startTime - Start time in seconds
     * @param {number} options.endTime - End time in seconds
     * @param {number} options.fps - Frames per second
     * @param {number} options.width - Target width (optional)
     * @returns {Promise<Array>} - Array of ImageItem objects
     */
    const extractFrames = useCallback(async (file, options) => {
        if (!loaded || !ffmpeg) {
            throw new Error('FFmpeg not loaded');
        }

        abortRef.current = false;
        setIsProcessing(true);
        setProgress({ stage: 'writing', current: 0, total: 0 });

        try {
            const frames = await extractFramesFromVideo(
                ffmpeg,
                file,
                options,
                (prog) => setProgress(prog),
                abortRef
            );

            return frames;
        } finally {
            setIsProcessing(false);
            setProgress({ stage: '', current: 0, total: 0 });
        }
    }, [ffmpeg, loaded]);

    /**
     * Cancel ongoing extraction
     */
    const cancel = useCallback(() => {
        abortRef.current = true;
    }, []);

    /**
     * Get progress message for UI
     */
    const getProgressMessage = useCallback(() => {
        const { stage, current, total } = progress;

        switch (stage) {
            case 'writing':
                return 'Preparing video...';
            case 'extracting':
                return `Extracting frames...`;
            case 'reading':
                return `Reading frame ${current}/${total}...`;
            default:
                return '';
        }
    }, [progress]);

    /**
     * Get progress percentage
     */
    const getProgressPercent = useCallback(() => {
        const { stage, current, total } = progress;

        if (!total || stage === 'writing' || stage === 'extracting') {
            return 0;
        }

        return Math.round((current / total) * 100);
    }, [progress]);

    return {
        // State
        isProcessing,
        progress,

        // Methods
        extractMetadata,
        generateThumbnail,
        extractFrames,
        cancel,

        // Helpers
        getProgressMessage,
        getProgressPercent
    };
};

export default useVideoProcessor;
