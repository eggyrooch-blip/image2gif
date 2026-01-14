/**
 * Image Processing Web Worker
 * Handles CPU-intensive image normalization off the main thread
 * Uses OffscreenCanvas for drawing operations
 */

/**
 * Normalize an image to target dimensions with proper scaling
 * @param {ImageBitmap} imageBitmap - Source image
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {string} fillColor - Background fill color ('black' or 'white')
 * @returns {Promise<Blob>} Normalized PNG blob
 */
const normalizeImageInWorker = async (imageBitmap, width, height, fillColor = 'black') => {
    // Create OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get canvas context in worker');
    }

    // Fill with background color
    ctx.fillStyle = fillColor === 'white' ? '#FFFFFF' : '#000000';
    ctx.fillRect(0, 0, width, height);

    // Calculate scale to fit (contain) with aspect ratio preservation
    const scale = Math.min(width / imageBitmap.width, height / imageBitmap.height);
    const w = imageBitmap.width * scale;
    const h = imageBitmap.height * scale;
    const x = (width - w) / 2;
    const y = (height - h) / 2;

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(imageBitmap, x, y, w, h);

    // Close ImageBitmap to free memory
    imageBitmap.close();

    // Convert to PNG blob
    return canvas.convertToBlob({ type: 'image/png' });
};

/**
 * Process a single image
 */
const processImage = async (data) => {
    const { imageBlob, width, height, fillColor, id } = data;

    try {
        // Create ImageBitmap from blob
        const imageBitmap = await createImageBitmap(imageBlob);

        // Normalize the image
        const resultBlob = await normalizeImageInWorker(imageBitmap, width, height, fillColor);

        // Convert blob to ArrayBuffer for transfer
        const arrayBuffer = await resultBlob.arrayBuffer();

        return {
            success: true,
            id,
            arrayBuffer,
            mimeType: 'image/png'
        };
    } catch (error) {
        return {
            success: false,
            id,
            error: error.message
        };
    }
};

/**
 * Process multiple images in batch
 */
const processBatch = async (data) => {
    const { images, width, height, fillColor } = data;
    const results = [];

    for (let i = 0; i < images.length; i++) {
        const { blob, id } = images[i];
        const result = await processImage({
            imageBlob: blob,
            width,
            height,
            fillColor,
            id
        });

        results.push(result);

        // Report progress
        self.postMessage({
            type: 'progress',
            current: i + 1,
            total: images.length
        });
    }

    return results;
};

// Message handler
self.onmessage = async (event) => {
    const { type, data, requestId } = event.data;

    try {
        let result;

        switch (type) {
            case 'normalize':
                result = await processImage(data);
                break;

            case 'batch':
                result = await processBatch(data);
                break;

            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        // Transfer ArrayBuffers for efficiency
        const transferables = [];
        if (result.arrayBuffer) {
            transferables.push(result.arrayBuffer);
        } else if (Array.isArray(result)) {
            result.forEach(r => {
                if (r.arrayBuffer) {
                    transferables.push(r.arrayBuffer);
                }
            });
        }

        self.postMessage({
            type: 'result',
            requestId,
            result
        }, transferables);

    } catch (error) {
        self.postMessage({
            type: 'error',
            requestId,
            error: error.message
        });
    }
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });
