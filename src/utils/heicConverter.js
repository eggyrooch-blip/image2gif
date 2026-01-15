/**
 * HEIC/HEIF to standard format converter
 * Uses heic-convert library for client-side HEIC decoding
 */

/**
 * Check if a file is HEIC/HEIF format
 * @param {File} file - The file to check
 * @returns {boolean} - True if HEIC/HEIF
 */
export const isHeicFile = (file) => {
  const type = file.type?.toLowerCase() || '';
  const name = file.name?.toLowerCase() || '';

  return type === 'image/heic' ||
         type === 'image/heif' ||
         type === '' && /\.(heic|heif)$/i.test(name) ||
         /\.(heic|heif)$/i.test(name);
};

/**
 * Check if a file is a supported image format (including HEIC)
 * @param {File} file - The file to check
 * @returns {boolean} - True if supported image
 */
export const isSupportedImage = (file) => {
  const type = file.type?.toLowerCase() || '';

  // Standard browser-supported formats
  if (type.startsWith('image/')) {
    return true;
  }

  // HEIC files may not have MIME type set
  if (isHeicFile(file)) {
    return true;
  }

  return false;
};

// Lazy-loaded heic-convert module
let heicConvert = null;

/**
 * Dynamically load heic-convert library
 * @returns {Promise<Function>} - The heic-convert function
 */
const loadHeicConverter = async () => {
  if (!heicConvert) {
    const module = await import('heic-convert');
    heicConvert = module.default || module;
  }
  return heicConvert;
};

/**
 * Convert HEIC/HEIF file to PNG Blob
 * @param {File} file - The HEIC file to convert
 * @returns {Promise<{blob: Blob, originalName: string}>} - Converted PNG blob with original filename
 * @throws {Error} - If conversion fails
 */
export const convertHeicToBlob = async (file) => {
  try {
    const convert = await loadHeicConverter();
    const arrayBuffer = await file.arrayBuffer();

    const converted = await convert({
      buffer: new Uint8Array(arrayBuffer),
      format: 'PNG',
      quality: 1
    });

    const blob = new Blob([converted], { type: 'image/png' });

    // Preserve original filename, change extension
    const originalName = file.name.replace(/\.(heic|heif)$/i, '.png');

    return { blob, originalName };
  } catch (error) {
    throw new Error(`Failed to convert HEIC: ${error.message}. Try Safari on iOS, or convert to JPG first.`);
  }
};

/**
 * Convert HEIC file to a File object (useful for file list operations)
 * @param {File} heicFile - The HEIC file to convert
 * @returns {Promise<File>} - Converted PNG File object
 */
export const convertHeicToFile = async (heicFile) => {
  const { blob, originalName } = await convertHeicToBlob(heicFile);
  return new File([blob], originalName, { type: 'image/png' });
};

/**
 * Process an array of files, converting any HEIC files to PNG
 * @param {File[]} files - Array of files (may contain HEIC)
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<{files: File[], heicCount: number, errors: string[]}>}
 */
export const processFilesWithHeic = async (files, onProgress = () => {}) => {
  const result = {
    files: [],
    heicCount: 0,
    errors: []
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress(i + 1, files.length);

    if (isHeicFile(file)) {
      try {
        const convertedFile = await convertHeicToFile(file);
        result.files.push(convertedFile);
        result.heicCount++;
      } catch (error) {
        result.errors.push(`${file.name}: ${error.message}`);
      }
    } else {
      result.files.push(file);
    }
  }

  return result;
};
