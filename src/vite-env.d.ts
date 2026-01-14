/// <reference types="vite/client" />

// Image types
interface ImageItem {
    id: string;
    file: File;
    preview: string;
}

// Settings types
interface GifSettings {
    delay: number;
    width: number;
    height?: number | null;
    loop?: number;
    dither?: 'bayer' | 'floyd_steinberg' | 'sierra2' | 'sierra2_4a' | 'none';
    bayerScale?: number;
    crossfadeEnabled?: boolean;
    crossfadeFrames?: number;
    fillColor?: 'black' | 'white';
}

// Quality preset types
type QualityPreset = 'web' | 'hd' | '2k' | '4k' | 'auto';

// FFmpeg helper types
interface ProcessImagesToGifOptions {
    ffmpeg: any; // FFmpeg instance
    images: ImageItem[];
    settings: GifSettings;
    onProgress: (message: string) => void;
}

// Language types
type Language = 'en' | 'zh';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

// Component prop types
interface FrameEditorProps {
    images: ImageItem[];
    initialIndex?: number;
    onClose: () => void;
    onUpdate: (id: string, newFile: File) => void;
}

interface ImageListProps {
    images: ImageItem[];
    onRemove: (id: string) => void;
    onReorder: (newOrder: ImageItem[]) => void;
    onOpenEditor: (index: number) => void;
}

interface SettingsPanelProps {
    settings: GifSettings;
    onChange: (settings: GifSettings) => void;
    originalDimensions?: { width: number; height: number } | null;
}

interface DragDropZoneProps {
    onFilesSelected: (files: File[]) => void;
    className?: string;
}

interface PreviewAreaProps {
    gifUrl: string | null;
    onDownload: () => void;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onReset?: () => void;
}

interface LayoutProps {
    children: React.ReactNode;
}

// Export for module usage
export type {
    ImageItem,
    GifSettings,
    QualityPreset,
    ProcessImagesToGifOptions,
    Language,
    LanguageContextType,
    FrameEditorProps,
    ImageListProps,
    SettingsPanelProps,
    DragDropZoneProps,
    PreviewAreaProps,
    ErrorBoundaryProps,
    LayoutProps,
};
