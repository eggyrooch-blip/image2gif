import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export const useFFmpeg = () => {
    const [loaded, setLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('Loading FFmpeg...');
    const ffmpegRef = useRef(new FFmpeg());

    const load = async () => {
        setIsLoading(true);
        const baseURL = `${window.location.origin}/ffmpeg`;
        const ffmpeg = ffmpegRef.current;

        ffmpeg.on('log', ({ message }) => {
            console.log(message);
            setMessage(message);
        });

        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setLoaded(true);
            setIsLoading(false);
        } catch (error) {
            console.error(error);
            setIsLoading(false);
            setMessage(`Error loading FFmpeg: ${error.message}`);
        }
    };

    return { ffmpeg: ffmpegRef.current, loaded, load, isLoading, message };
};
