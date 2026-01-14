import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTime, parseTime } from '../utils/videoHelper';

const TimeRangeSelector = ({
    duration,
    startTime,
    endTime,
    onChange,
    disabled
}) => {
    const { t } = useLanguage();
    const [startInput, setStartInput] = useState(formatTime(startTime));
    const [endInput, setEndInput] = useState(formatTime(endTime));
    const trackRef = useRef(null);

    // Update inputs when props change
    useEffect(() => {
        setStartInput(formatTime(startTime));
    }, [startTime]);

    useEffect(() => {
        setEndInput(formatTime(endTime));
    }, [endTime]);

    const handleStartSliderChange = useCallback((e) => {
        const value = parseFloat(e.target.value);
        // Ensure start doesn't exceed end
        const newStart = Math.min(value, endTime - 0.1);
        onChange({ startTime: newStart, endTime });
    }, [endTime, onChange]);

    const handleEndSliderChange = useCallback((e) => {
        const value = parseFloat(e.target.value);
        // Ensure end doesn't go below start
        const newEnd = Math.max(value, startTime + 0.1);
        onChange({ startTime, endTime: newEnd });
    }, [startTime, onChange]);

    const handleStartInputBlur = useCallback(() => {
        const parsed = parseTime(startInput);
        const clamped = Math.max(0, Math.min(parsed, endTime - 0.1));
        onChange({ startTime: clamped, endTime });
        setStartInput(formatTime(clamped));
    }, [startInput, endTime, onChange]);

    const handleEndInputBlur = useCallback(() => {
        const parsed = parseTime(endInput);
        const clamped = Math.max(startTime + 0.1, Math.min(parsed, duration));
        onChange({ startTime, endTime: clamped });
        setEndInput(formatTime(clamped));
    }, [endInput, startTime, duration, onChange]);

    const handleKeyDown = useCallback((e, type) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    }, []);

    // Calculate selection percentage for visual track
    const startPercent = (startTime / duration) * 100;
    const endPercent = (endTime / duration) * 100;
    const selectedDuration = endTime - startTime;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                    {t('video.timeRange')}
                </label>
                <span className="text-sm text-gray-500">
                    {t('video.selectedDuration')}: {formatTime(selectedDuration)}
                </span>
            </div>

            {/* Visual track with selection highlight */}
            <div className="relative h-2 mt-6 mb-8">
                {/* Background track */}
                <div
                    ref={trackRef}
                    className="absolute inset-0 bg-gray-200 rounded-full"
                />

                {/* Selected range highlight */}
                <div
                    className="absolute h-full bg-blue-500 rounded-full"
                    style={{
                        left: `${startPercent}%`,
                        width: `${endPercent - startPercent}%`
                    }}
                />

                {/* Start slider */}
                <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={startTime}
                    onChange={handleStartSliderChange}
                    disabled={disabled}
                    className="absolute w-full h-full appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-blue-500
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:hover:scale-110
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:bg-white
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-blue-500
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:shadow-md
                        [&::-moz-range-thumb]:cursor-pointer"
                    style={{ zIndex: startTime > duration / 2 ? 5 : 3 }}
                />

                {/* End slider */}
                <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.01}
                    value={endTime}
                    onChange={handleEndSliderChange}
                    disabled={disabled}
                    className="absolute w-full h-full appearance-none bg-transparent cursor-pointer disabled:cursor-not-allowed
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:bg-white
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-blue-500
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:shadow-md
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:hover:scale-110
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:bg-white
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-blue-500
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:shadow-md
                        [&::-moz-range-thumb]:cursor-pointer"
                    style={{ zIndex: endTime < duration / 2 ? 5 : 3 }}
                />
            </div>

            {/* Time inputs */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">{t('video.startTime')}:</label>
                    <input
                        type="text"
                        value={startInput}
                        onChange={(e) => setStartInput(e.target.value)}
                        onBlur={handleStartInputBlur}
                        onKeyDown={(e) => handleKeyDown(e, 'start')}
                        disabled={disabled}
                        className="w-24 px-2 py-1.5 text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        placeholder="00:00.00"
                    />
                </div>

                <div className="flex-1 border-t border-gray-200" />

                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">{t('video.endTime')}:</label>
                    <input
                        type="text"
                        value={endInput}
                        onChange={(e) => setEndInput(e.target.value)}
                        onBlur={handleEndInputBlur}
                        onKeyDown={(e) => handleKeyDown(e, 'end')}
                        disabled={disabled}
                        className="w-24 px-2 py-1.5 text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        placeholder="00:00.00"
                    />
                </div>
            </div>

            {/* Duration markers */}
            <div className="flex justify-between text-xs text-gray-400">
                <span>00:00</span>
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
};

export default TimeRangeSelector;
