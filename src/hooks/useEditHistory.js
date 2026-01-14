import { useState, useCallback, useRef } from 'react';

/**
 * useEditHistory - Hook for managing undo/redo state
 * Stores full image state snapshots for complete undo/redo functionality
 * 
 * Note: This stores references to File objects and preview URLs.
 * Memory is managed by limiting history size.
 * 
 * @param {number} maxHistory - Maximum number of history states to keep (default: 15)
 * @returns {Object} History management functions and state
 */
export const useEditHistory = (maxHistory = 15) => {
    // History stores snapshots of the images array
    // Each snapshot contains: { images: [...], timestamp: Date }
    const [history, setHistory] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);

    // Track if we're currently in an undo/redo operation
    const isUndoRedoRef = useRef(false);

    /**
     * Push a new state to history
     * Should be called AFTER the state change has been applied
     * @param {Array} images - Current images array to save
     */
    const pushState = useCallback((images) => {
        // Don't push if this is being called from an undo/redo operation
        if (isUndoRedoRef.current) {
            return;
        }

        setHistory(prev => {
            // Clone the images array with all necessary data
            const snapshot = images.map(img => ({
                id: img.id,
                file: img.file,  // Keep file reference
                preview: img.preview,  // Keep preview URL
                delay: img.delay
            }));

            // If we're not at the end of history, truncate forward history
            let newHistory = currentIndex < prev.length - 1
                ? prev.slice(0, currentIndex + 1)
                : [...prev];

            // Add new snapshot
            newHistory.push({
                images: snapshot,
                timestamp: Date.now()
            });

            // Trim history if it exceeds max
            if (newHistory.length > maxHistory) {
                // Revoke old preview URLs to free memory
                const removed = newHistory.slice(0, newHistory.length - maxHistory);
                // Note: Don't revoke URLs as they might still be in use by current state
                newHistory = newHistory.slice(-maxHistory);
            }

            setCurrentIndex(newHistory.length - 1);
            return newHistory;
        });
    }, [currentIndex, maxHistory]);

    /**
     * Undo to previous state
     * @returns {Array|null} Previous images array or null if can't undo
     */
    const undo = useCallback(() => {
        if (currentIndex <= 0) return null;

        isUndoRedoRef.current = true;
        const newIndex = currentIndex - 1;
        setCurrentIndex(newIndex);

        // Schedule reset of flag
        setTimeout(() => {
            isUndoRedoRef.current = false;
        }, 0);

        return history[newIndex]?.images || null;
    }, [currentIndex, history]);

    /**
     * Redo to next state
     * @returns {Array|null} Next images array or null if can't redo
     */
    const redo = useCallback(() => {
        if (currentIndex >= history.length - 1) return null;

        isUndoRedoRef.current = true;
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);

        // Schedule reset of flag
        setTimeout(() => {
            isUndoRedoRef.current = false;
        }, 0);

        return history[newIndex]?.images || null;
    }, [currentIndex, history]);

    /**
     * Clear all history
     */
    const clearHistory = useCallback(() => {
        setHistory([]);
        setCurrentIndex(-1);
    }, []);

    /**
     * Check if undo is available
     */
    const canUndo = currentIndex > 0;

    /**
     * Check if redo is available
     */
    const canRedo = currentIndex < history.length - 1;

    /**
     * Get current history length
     */
    const historyLength = history.length;

    return {
        pushState,
        undo,
        redo,
        clearHistory,
        canUndo,
        canRedo,
        historyLength,
        currentIndex
    };
};

export default useEditHistory;
