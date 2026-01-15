import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from './components/Layout';
import DragDropZone from './components/DragDropZone';
import ImageList from './components/ImageList';
import SettingsPanel from './components/SettingsPanel';
import PreviewArea from './components/PreviewArea';
import FrameEditor from './components/FrameEditor';
import OverlaySettings from './components/OverlaySettings';
import ErrorBoundary from './components/ErrorBoundary';
import FAQ from './components/FAQ';
import ToolTabs from './components/ToolTabs';
import TrustSection from './components/TrustSection';
import InputModeTabs from './components/InputModeTabs';
import VideoDropZone from './components/VideoDropZone';
import VideoPreview from './components/VideoPreview';
import TimeRangeSelector from './components/TimeRangeSelector';
import { useFFmpeg } from './hooks/useFFmpeg';
import { useEditHistory } from './hooks/useEditHistory';
import { useVideoProcessor } from './hooks/useVideoProcessor';
import { processImagesToFormat, getFormatExtension, getFormatLabel } from './utils/ffmpegHelper';
import { getDefaultOverlayConfig } from './utils/overlayHelper';
import { estimateFrameCount } from './utils/videoHelper';
import { Loader2, Wand2, Undo2, Redo, X } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';

const getImageDimensions = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
};

function App({ initialMode = 'images', lockMode = false }) {
  const { t, language } = useLanguage();
  const { ffmpeg, loaded, load, isLoading, message } = useFFmpeg();
  const [images, setImages] = useState([]);
  const [settings, setSettings] = useState({
    delay: 500,
    width: 1920,
    height: null,
    compression: 'light',
    loop: 0,
    dither: 'bayer',
    fillColor: 'black',
    crossfadeEnabled: false,
    outputFormat: 'gif',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [gifUrl, setGifUrl] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState(null);

  // Overlay settings state
  const [overlaySettings, setOverlaySettings] = useState(getDefaultOverlayConfig());

  // Frame editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitialIndex, setEditorInitialIndex] = useState(0);

  // Video mode state
  const [inputMode, setInputMode] = useState(initialMode); // 'images' | 'video'
  const [videoFile, setVideoFile] = useState(null);
  const [videoMetadata, setVideoMetadata] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [videoSettings, setVideoSettings] = useState({
    startTime: 0,
    endTime: null,
    fps: 10
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Video processor hook
  const {
    isProcessing: isExtractingFrames,
    progress: extractionProgress,
    extractMetadata,
    generateThumbnail,
    extractFrames,
    cancel: cancelExtraction,
    getProgressMessage
  } = useVideoProcessor(ffmpeg, loaded);

  // Undo/Redo history
  const { pushState, undo, redo, canUndo, canRedo } = useEditHistory(20);
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const previewRef = useRef(null);

  // Memoized total file size for memory warning
  const totalFileSizeMB = useMemo(() => {
    const totalBytes = images.reduce((sum, img) => sum + img.file.size, 0);
    return totalBytes / (1024 * 1024);
  }, [images]);

  const handleModeChange = useCallback((mode) => {
    if (lockMode) return;
    setInputMode(mode);
  }, [lockMode]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setInputMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    const detectDimensions = async () => {
      if (images.length === 0) {
        setOriginalDimensions(null);
        return;
      }

      // If we already have dimensions and they match the max of current images, we might not need to update.
      // But to be safe and responsive to content changes (add/remove), let's re-scan if the list changes.

      let maxArea = 0;
      let maxDims = null;

      for (const img of images) {
        const dims = await getImageDimensions(img.file);
        if (dims) {
          const area = dims.width * dims.height;
          if (area > maxArea) {
            maxArea = area;
            maxDims = dims;
          }
        }
      }

      if (maxDims) {
        setOriginalDimensions(maxDims);
      }
    };
    detectDimensions();
  }, [images]);

  // Save initial state when images first added
  useEffect(() => {
    if (images.length > 0 && imagesRef.current.length === 0) {
      // First images added, save to history
      pushState(images);
    }
  }, [images, pushState]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Undo handler
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setImages(previousState);
    }
  }, [undo]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setImages(nextState);
    }
  }, [redo]);

  const handleFilesSelected = useCallback((files) => {
    const newImages = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      delay: null  // null = use global delay
    }));
    setImages(prev => {
      const updated = [...prev, ...newImages];
      // Save to history after state update
      setTimeout(() => pushState(updated), 0);
      return updated;
    });
  }, [pushState]);

  const handleRemoveImage = useCallback((id) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      // Don't revoke URL - it might be needed for undo
      // setTimeout(() => pushState(filtered), 0);
      pushState(filtered);
      return filtered;
    });
  }, [pushState]);

  const handleReorderImages = useCallback((newOrder) => {
    setImages(newOrder);
    pushState(newOrder);
  }, [pushState]);

  // Open frame editor at specific index
  const handleOpenEditor = useCallback((index) => {
    setEditorInitialIndex(index);
    setEditorOpen(true);
  }, []);

  // Close frame editor
  const handleCloseEditor = useCallback(() => {
    setEditorOpen(false);
  }, []);

  // Update an image after editing (crop/rotate)
  const handleUpdateImage = useCallback((id, newFile) => {
    setImages(prev => {
      const updated = prev.map(img => {
        if (img.id === id) {
          // Don't revoke old URL - might be needed for undo
          return {
            ...img,
            file: newFile,
            preview: URL.createObjectURL(newFile)
          };
        }
        return img;
      });
      pushState(updated);
      return updated;
    });
  }, [pushState]);

  // Update per-frame delay
  const handleDelayChange = useCallback((id, delay) => {
    setImages(prev => {
      const updated = prev.map(img =>
        img.id === id ? { ...img, delay } : img
      );
      pushState(updated);
      return updated;
    });
  }, [pushState]);

  // Video mode handlers
  const handleVideoSelected = useCallback(async (file) => {
    if (!loaded) return;

    setVideoFile(file);
    setVideoMetadata(null);
    setVideoThumbnail(null);
    setIsAnalyzing(true);

    try {
      // Extract metadata and thumbnail in parallel
      const [metadata, thumbnail] = await Promise.all([
        extractMetadata(file),
        generateThumbnail(file)
      ]);

      setVideoMetadata(metadata);
      setVideoThumbnail(thumbnail);

      // Set default end time to video duration
      setVideoSettings(prev => ({
        ...prev,
        startTime: 0,
        endTime: metadata.duration
      }));

      // Update original dimensions for settings panel
      setOriginalDimensions({ width: metadata.width, height: metadata.height });
    } catch (error) {
      console.error('Failed to analyze video:', error);
      setVideoFile(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [loaded, extractMetadata, generateThumbnail]);

  const handleVideoRemove = useCallback(() => {
    if (videoThumbnail) {
      URL.revokeObjectURL(videoThumbnail);
    }
    setVideoFile(null);
    setVideoMetadata(null);
    setVideoThumbnail(null);
    setVideoSettings({ startTime: 0, endTime: null, fps: 10 });
  }, [videoThumbnail]);

  const handleTimeRangeChange = useCallback(({ startTime, endTime }) => {
    setVideoSettings(prev => ({ ...prev, startTime, endTime }));
  }, []);

  const handleFpsChange = useCallback((fps) => {
    setVideoSettings(prev => ({ ...prev, fps }));
  }, []);

  // Estimated frame count for video mode
  const estimatedVideoFrames = useMemo(() => {
    if (!videoMetadata || videoSettings.endTime === null) return 0;
    return estimateFrameCount(
      videoSettings.startTime,
      videoSettings.endTime,
      videoSettings.fps
    );
  }, [videoMetadata, videoSettings]);

  const handleGenerate = async () => {
    if (!loaded) return;

    // Validate based on input mode
    if (inputMode === 'images' && images.length === 0) return;
    if (inputMode === 'video' && !videoFile) return;

    setIsGenerating(true);
    setProgressMsg(t('status.init'));

    try {
      let framesToProcess = [];

      if (inputMode === 'video') {
        // Video mode: extract frames first
        setProgressMsg(t('video.extracting'));

        const frames = await extractFrames(videoFile, {
          startTime: videoSettings.startTime,
          endTime: videoSettings.endTime,
          fps: videoSettings.fps,
          width: settings.width
        });

        if (frames.length === 0) {
          throw new Error('No frames extracted from video');
        }

        framesToProcess = frames;

        // Calculate delay from FPS for video frames
        const videoDelay = Math.round(1000 / videoSettings.fps);
        const settingsWithDelay = { ...settings, delay: videoDelay, overlay: overlaySettings };

        setProgressMsg(t('status.generating'));
        const url = await processImagesToFormat(ffmpeg, framesToProcess, settingsWithDelay, (msg) => {
          setProgressMsg(msg);
        });

        // Cleanup extracted frame URLs
        framesToProcess.forEach(frame => {
          if (frame.preview) URL.revokeObjectURL(frame.preview);
        });

        setGifUrl(url);
      } else {
        // Image mode: use existing images
        const settingsWithOverlay = { ...settings, overlay: overlaySettings };
        const url = await processImagesToFormat(ffmpeg, images, settingsWithOverlay, (msg) => {
          setProgressMsg(msg);
        });
        setGifUrl(url);
      }

      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (error) {
      console.error(error);
      if (error.message !== 'Cancelled') {
        setProgressMsg('Error: ' + error.message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!gifUrl) return;
    const extension = getFormatExtension(settings.outputFormat || 'gif');
    const a = document.createElement('a');
    a.href = gifUrl;
    a.download = `animated.${extension}`;
    a.click();
  };

  // Hero content based on mode
  const heroContent = inputMode === 'video' ? {
    title: language === 'zh' ? '视频转 GIF' : 'Video to GIF',
    subtitle: language === 'zh' ? '纯前端本地视频转 GIF，保护隐私，无水印。' : 'Turn video clips into GIFs locally. Secure, no uploads.',
  } : {
    title: language === 'zh' ? '图片转 GIF' : 'Image to GIF',
    subtitle: language === 'zh' ? '纯前端本地图片合成 GIF，保护隐私，无水印。' : 'Create GIFs from images locally. Secure, no uploads.',
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12 pb-24">

        <ToolTabs />

        {/* Hero Section */}
        <section className="text-center py-8 px-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl mb-4">
            {heroContent.title}
          </h1>
          <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {heroContent.subtitle}
          </p>
        </section>

        {/* Step 1: Input */}
        <section className="space-y-6">

          {/* Input Mode Tabs (optional) */}
          {!lockMode && (
            <InputModeTabs
              mode={inputMode}
              onChange={handleModeChange}
              disabled={isGenerating}
            />
          )}

          {/* Image Mode */}
          {inputMode === 'images' && (
            <>
              <DragDropZone onFilesSelected={handleFilesSelected} className="min-h-[300px] border-dashed border-2 border-gray-300 hover:border-blue-500/50 bg-gray-50/50 hover:bg-white" />

              <div className={images.length > 0 ? "block animate-in fade-in zoom-in duration-300" : "hidden"}>
                {/* Undo/Redo Toolbar */}
                <div className="flex items-center justify-end gap-2 mb-3">
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Undo (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Undo</span>
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Redo (Ctrl+Y)"
                  >
                    <Redo className="w-4 h-4" />
                    <span className="hidden sm:inline">Redo</span>
                  </button>
                </div>

                <ImageList
                  images={images}
                  onRemove={handleRemoveImage}
                  onReorder={handleReorderImages}
                  onOpenEditor={handleOpenEditor}
                  onDelayChange={handleDelayChange}
                  globalDelay={settings.delay}
                />

                {/* Memory warning for large files */}
                {totalFileSizeMB > 100 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>{t('warnings.largeFiles')} ({totalFileSizeMB.toFixed(1)} MB)</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Video Mode */}
          {inputMode === 'video' && (
            <div className="space-y-4">
              {!videoFile ? (
                <VideoDropZone
                  onVideoSelected={handleVideoSelected}
                  disabled={!loaded || isGenerating}
                  className="min-h-[300px] border-dashed border-2 border-gray-300 hover:border-blue-500/50 bg-gray-50/50 hover:bg-white"
                />
              ) : (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <VideoPreview
                    file={videoFile}
                    metadata={videoMetadata}
                    thumbnailUrl={videoThumbnail}
                    onRemove={handleVideoRemove}
                    isLoading={isAnalyzing}
                  />

                  {/* Time Range Selector */}
                  {videoMetadata && videoMetadata.duration > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <TimeRangeSelector
                        duration={videoMetadata.duration}
                        startTime={videoSettings.startTime}
                        endTime={videoSettings.endTime ?? videoMetadata.duration}
                        onChange={handleTimeRangeChange}
                        disabled={isGenerating}
                      />
                    </div>
                  )}

                  {/* Video Settings (FPS) */}
                  {videoMetadata && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 block">
                          {t('video.fps')}
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={1}
                            max={30}
                            value={videoSettings.fps}
                            onChange={(e) => handleFpsChange(parseInt(e.target.value))}
                            disabled={isGenerating}
                            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <span className="w-16 text-sm font-mono text-gray-600 text-center bg-gray-100 rounded px-2 py-1">
                            {videoSettings.fps} fps
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{t('video.fpsHint')}</p>
                      </div>

                      {/* Estimated frames */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{t('video.estimatedFrames', { count: estimatedVideoFrames })}</span>
                        {estimatedVideoFrames > 300 && (
                          <span className="text-amber-600 text-xs">
                            Large number of frames may be slow
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Step 2: Configure - Always Visible */}
        <section className="space-y-6">
          <div className="text-left border-l-4 border-blue-600 pl-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {t('steps.configure')}
            </h2>
          </div>

          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            imageCount={inputMode === 'video' ? estimatedVideoFrames : images.length}
            originalDimensions={originalDimensions}
            inputMode={inputMode}
            videoFps={videoSettings.fps}
            onVideoFpsChange={handleFpsChange}
          />

          {/* Overlay Settings */}
          <OverlaySettings
            config={overlaySettings}
            onChange={setOverlaySettings}
            disabled={isGenerating}
          />
        </section>

        {/* Step 3: Generate Action - Always Visible */}
        <section className="space-y-6">
          <div className="pt-4 sticky bottom-6 z-40 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 ring-1 ring-gray-900/5">
            <button
              onClick={handleGenerate}
              disabled={
                !loaded ||
                isGenerating ||
                (inputMode === 'images' && images.length === 0) ||
                (inputMode === 'video' && (!videoFile || !videoMetadata))
              }
              className="w-full py-5 bg-gray-900 hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-3 hover:shadow-2xl hover:-translate-y-1 active:translate-y-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {isExtractingFrames ? t('video.extracting') : t('status.generating').replace('{format}', getFormatLabel(settings.outputFormat || 'gif'))}
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6" />
                  {inputMode === 'images'
                    ? (images.length === 0 ? t('dragDrop.title') : t('buttons.generate').replace('{format}', getFormatLabel(settings.outputFormat || 'gif')))
                    : (!videoFile ? t('video.dropTitle') : t('buttons.generate').replace('{format}', getFormatLabel(settings.outputFormat || 'gif')))
                  }
                </>
              )}
            </button>

            {/* Progress Indicator */}
            {isGenerating && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{progressMsg}</span>
                  <span className="font-mono text-blue-600 font-bold">{progressMsg.match(/\[(\d+)%\]/)?.[1] || '0'}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${parseInt(progressMsg.match(/\[(\d+)%\]/)?.[1] || '0')}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Step 4: Result */}
        <section ref={previewRef} className="scroll-mt-24">
          {gifUrl && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">
                  {t('steps.result')}
                </h2>
                <p className="text-green-600 font-medium mt-2">
                  ✨ Successfully Generated!
                </p>
                {/* MP4 suggestion hint */}
                <p className="text-sm text-gray-500 mt-3">
                  {t('mp4Hint.text') || 'Need a smaller, smoother result?'}{' '}
                  <Link to="/image-to-mp4" className="text-blue-600 hover:text-blue-800 underline">
                    {t('mp4Hint.link') || 'Try Image to MP4'}
                  </Link>
                </p>
              </div>
              <PreviewArea gifUrl={gifUrl} onDownload={handleDownload} format={settings.outputFormat || 'gif'} />
            </div>
          )}
        </section>

        {/* Trust Section */}
        <TrustSection />

        {/* FAQ Section */}
        <FAQ />

        {/* Related tools */}
        <section className="space-y-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Related tools</h2>
          <p className="text-sm text-gray-600">Explore new MP4 utilities in the same browser-native workflow.</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/image-to-mp4"
              className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              Image to MP4
            </Link>
            <Link
              to="/compress-mp4"
              className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              Compress MP4
            </Link>
          </div>
        </section>

        {/* Footer Status */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-1.5 px-4 text-xs text-gray-400 flex justify-between items-center z-50">
          <span>{isLoading ? 'Loading Core...' : 'System Ready'}</span>
          {originalDimensions && (
            <span>Orig: {originalDimensions.width}x{originalDimensions.height}</span>
          )}
        </div>

      </div>

      {/* Frame Editor Modal - wrapped in ErrorBoundary */}
      {editorOpen && images.length > 0 && (
        <ErrorBoundary onReset={handleCloseEditor}>
          <FrameEditor
            images={images}
            initialIndex={editorInitialIndex}
            onClose={handleCloseEditor}
            onUpdate={handleUpdateImage}
          />
        </ErrorBoundary>
      )}
    </Layout >
  );
}

export default App;
