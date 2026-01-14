# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Universal GIF Maker is a React 19 single-page application for creating animated GIFs from image sequences. It uses FFmpeg WASM for client-side video processing with no server component.

## Build Commands

```bash
npm run dev       # Development server with HMR
npm run build     # Production build to /dist
npm run preview   # Preview production build
npm run lint      # ESLint
```

## Architecture

### Core Processing Flow
1. Images selected via drag-drop (`DragDropZone`) → stored in `App.jsx` state
2. User configures settings in `SettingsPanel` (dimensions, delay, dithering, compression)
3. Optional per-frame editing in `FrameEditor` (crop, rotate)
4. GIF generation via `ffmpegHelper.js`:
   - Normalize all images to target dimensions (via Web Worker if OffscreenCanvas available)
   - Generate crossfade frames if enabled
   - FFmpeg 2-pass: palette generation → GIF rendering with dithering

### Key Files
- `src/App.jsx` - Main orchestration, state management, undo/redo (Ctrl+Z/Y)
- `src/utils/ffmpegHelper.js` - Core GIF pipeline (image normalization, FFmpeg commands)
- `src/hooks/useFFmpeg.js` - FFmpeg WASM initialization with CORS headers
- `src/hooks/useEditHistory.js` - Undo/redo with max 20 snapshots
- `src/workers/imageProcessingWorker.js` - Off-main-thread image processing
- `src/contexts/LanguageContext.jsx` - i18n provider (EN/ZH)

### FFmpeg WASM
- Binaries in `/public/ffmpeg/` (ffmpeg-core.js, ffmpeg-core.wasm ~30MB)
- Requires SharedArrayBuffer (CORS headers set in vite.config.js)
- `coi-serviceworker.js` enables cross-origin isolation

### Compression Levels
- `none`: 256 colors | `light`: 128 | `medium`: 128 optimized | `heavy`: 64

## Tech Stack
- React 19 + React Router 7 + Vite 7
- FFmpeg WASM (@ffmpeg/ffmpeg 0.12)
- Tailwind CSS 4 + PostCSS
- dnd-kit for drag-and-drop sorting
- Lucide React icons

## Routing
- `/` - Main GIF maker
- `/jpg-to-gif`, `/png-to-gif`, `/jpeg-to-gif`, `/photo-to-gif`, `/compress-gif`, `/no-watermark-gif-maker` - SEO landing pages

## Browser Requirements
- SharedArrayBuffer support (for FFmpeg workers)
- WebAssembly support
- OffscreenCanvas (optional, falls back to main thread)
