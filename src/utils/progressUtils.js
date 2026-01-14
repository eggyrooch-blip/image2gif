/**
 * Shared progress tracking utilities
 */

/**
 * Phase progress mapping for conversion operations
 * Used to show approximate progress percentage during multi-phase operations
 */
export const PHASE_PROGRESS = {
    idle: 0,
    loading_engine: 10,
    preparing: 25,
    encoding: 70,
    finalizing: 95,
    success: 100,
    error: 100,
};

/**
 * Get progress percentage for a phase
 * @param {string} phase - Current phase name
 * @returns {number} Progress percentage (0-100)
 */
export const getPhaseProgress = (phase) => PHASE_PROGRESS[phase] ?? 0;
