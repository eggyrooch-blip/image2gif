import { routes } from './routes.js';

const defaultOg = 'https://plotlake.com/og-image.png';

const related = (currentPath) => {
  const others = routes.map((r) => r.path).filter((p) => p !== currentPath);
  // Ensure at least 6 links; cycle if needed
  const picks = [];
  for (let i = 0; picks.length < 6; i++) {
    picks.push(others[i % others.length]);
  }
  return picks;
};

export const seoData = {
  '/': {
    title: 'Image & Video to GIF Maker | Free, No Watermark | Plotlake',
    description:
      'Create GIFs from images or videos with Plotlake. Free, no watermark, privacy-first browser processing. Convert MP4, WebM, MOV, JPG, PNG, WebP, set presets, trim clips, and export high-quality GIFs fast.',
    h1: 'Free Image & Video to GIF Maker (No Watermark, Browser-Only)',
    intro: [
      'Plotlake is a privacy-first GIF maker that runs entirely in your browser. Drop JPG, PNG, WebP, or MP4/WebM/MOV files, trim what you need, and generate a crisp GIF without uploading to a server. No watermark, no signup, no hidden limits - just fast local processing powered by WebAssembly FFmpeg.',
      'We ship presets tuned for social media, tutorials, ultra quality, and small file exports. The tool respects platform limits, letting you choose 2K-4K widths, 100-180ms delays, or FPS-based extraction for video clips up to ~60 seconds or 300 frames. Everything is adjustable: dithering, loop count, compression palette sizes, and fill color for padding.',
      'Because processing is local, sensitive footage never leaves your device. The first video run downloads a cached ~30MB FFmpeg core; after that, frame extraction and palette generation stay snappy. For images, per-frame delay controls and crossfade options keep loops smooth while maintaining detail.',
      'Use it for social posts, tutorials, product demos, or compressing existing GIFs. Batch images, reorder frames, pick a preset, then export. If you need smaller files, lower width or choose "Small File"; if you want pristine detail, go "High Quality" with Floyd or Sierra dithering and zero compression.',
      'Built for creators: free forever, no watermarks, and instant downloads. Try image or video mode, tweak advanced filters if you like, and share your GIF anywhere.',
    ],
    features: [
      '100% browser-side - nothing uploads, perfect for privacy-sensitive clips.',
      'No watermark, no account, no paywall; exports stay clean by default.',
      'Supports images (JPG, PNG, WebP) and video (MP4, WebM, MOV, AVI, MKV).',
      'Presets for Social, High Quality (4K, 100ms), Tutorial (crisp text), Small File.',
      'Customizable dithering (Bayer, Floyd-Steinberg, Sierra) and palette sizes.',
      'Limits tuned for stability: ~100MB images, ~60s or ~300 frames for video.',
      'Loop controls (infinite/finite), crossfade option, frame delay or FPS-based timing.',
      'No-watermark GIF compression to hit Discord/Slack/Email size targets.',
      'SEO-friendly static content and canonical URLs for every converter page.',
      'Instant download links; FFmpeg core cached after first load.',
    ],
    faq: [
      { q: 'Is it really free and watermark-free?', a: 'Yes. All exports are free with no watermark or branding, no account required, no premium tier.' },
      { q: 'Do you upload my files?', a: 'No. Processing happens locally in your browser via WebAssembly FFmpeg, so files never leave your device.' },
      { q: 'What formats are supported?', a: 'Images: JPG, PNG, WebP. Video: MP4, WebM, MOV, AVI, MKV. Audio is ignored for GIF output.' },
      { q: 'What are the recommended limits?', a: 'Keep total images under ~100MB, videos under ~60 seconds or ~300 frames for smooth processing in most browsers.' },
      { q: 'How do I make smoother GIFs?', a: 'Use Social or High Quality presets, lower frame delay (100-140ms) for images, or raise FPS (12-24) for videos.' },
      { q: 'How do I make smaller files?', a: 'Choose Small File preset, reduce width, lower FPS, shorten the clip, or pick Medium/Heavy compression (64-128 colors).' },
      { q: 'Can I keep text sharp for tutorials?', a: 'Yes. Use the Tutorial preset (2K width, gentle dithering, white padding) or set Floyd/Sierra dithering with light compression.' },
      { q: 'Do presets change my files?', a: 'Presets only adjust settings (width, delay/FPS, loop, dithering, compression, fill). Your originals stay untouched in-memory.' },
    ],
    relatedLinks: related('/'),
    ogImage: defaultOg,
  },
  '/jpg-to-gif': {
    title: 'JPG to GIF Converter | Free, No Watermark | Plotlake',
    description:
      'Convert JPG images to smooth GIFs online. No watermark, no signup, privacy-first browser processing. Use presets for social, tutorials, ultra quality, or small files.',
    h1: 'JPG to GIF Converter (Fast, Clean, No Watermark)',
    intro: [
      'Drop multiple JPG files and turn them into a single animated GIF without ever uploading to a server. Plotlake runs FFmpeg in your browser, so sensitive photos stay private while you tweak frame delay, width, and dithering.',
      'Use Social or High Quality presets for smooth loops, or Small File to hit size limits. The tool respects ~100MB total image guidance and offers Bayer, Floyd-Steinberg, or Sierra dithering for crisp gradients.',
      'Loop infinitely for social posts or set finite loops for tutorials. Add padding (black or white) to unify inconsistent sizes, and tune compression palettes between 64-256 colors to balance detail and weight.',
    ],
    features: [
      'Batch JPG upload with drag-and-drop and manual reorder.',
      'No watermark exports; free and browser-only.',
      'Presets: Social (2K/120ms), High Quality (4K/100ms), Tutorial (2K/160ms), Small File (HD/180ms).',
      'Custom frame delay, loop count, dithering, palette size, and fill color.',
      'Guidance: keep total JPG payload under ~100MB for stable processing.',
      'Instant GIF download; FFmpeg core cached after first use.',
    ],
    faq: [
      { q: 'Will JPG compression artifacts show in the GIF?', a: 'Artifacts in the source will carry over. Use High Quality preset or higher width to preserve more detail.' },
      { q: 'How many JPGs can I combine?', a: 'You can add many, but staying under ~100MB total keeps processing smooth in most browsers.' },
      { q: 'Do I need to register or pay?', a: 'No. It is free, watermark-free, and requires no signup.' },
      { q: 'Can I change per-frame timing?', a: 'Yes. Set a global delay or individual frame delays, and loop infinitely or a set number of times.' },
      { q: 'Is any data uploaded?', a: 'No. All processing stays in your browser; files never leave your device.' },
    ],
    relatedLinks: related('/jpg-to-gif'),
    ogImage: defaultOg,
  },
  '/png-to-gif': {
    title: 'PNG to GIF Converter | Preserve Transparency | Plotlake',
    description:
      'Turn PNG images into animated GIFs with preserved edges. Free, no watermark, browser-side processing. Presets for social, tutorials, ultra quality, and small files.',
    h1: 'PNG to GIF Converter (Transparency-Friendly, No Watermark)',
    intro: [
      'Upload transparent or opaque PNG files and stitch them into a clean GIF locally. Plotlake keeps your assets private and avoids server uploads while letting you set frame delays, loops, and dithering that respect transparency.',
      'Pick Social, High Quality, Tutorial, or Small File presets to balance smoothness and size. Bayer and Floyd-Steinberg dithering help avoid banding on gradients, while palette controls keep files light.',
      'Pad with black or white to normalize dimensions, or rely on quality presets (HD-4K) for crisp edges. Recommended total payload is under ~100MB for fast, stable browser processing.',
    ],
    features: [
      'Handles transparent PNGs with clean edges.',
      'Presets covering social, tutorials, ultra quality, and small file targets.',
      'Adjust frame delay, loop count, dithering, palette size, and padding color.',
      'No watermark, no signup, 100% browser-side.',
      'Instant downloads with cached FFmpeg core after first load.',
      'Guidance: stay under ~100MB total PNG size for smooth runs.',
    ],
    faq: [
      { q: 'Does PNG transparency stay intact?', a: 'GIF supports single-color transparency; edges remain clean when you choose appropriate dithering and padding.' },
      { q: 'Can I mix PNG and JPG?', a: 'Yes. Upload any mix; frames will be normalized to your selected size and padding.' },
      { q: 'What if my PNGs are huge?', a: 'Use 2K or HD presets, or reduce width manually to keep memory usage manageable.' },
      { q: 'Do you add a watermark?', a: 'No. Exports are watermark-free by default.' },
      { q: 'Is it private?', a: 'Yes. All work is done locally in your browser.' },
    ],
    relatedLinks: related('/png-to-gif'),
    ogImage: defaultOg,
  },
  '/jpeg-to-gif': {
    title: 'JPEG to GIF Converter | Free & Private | Plotlake',
    description:
      'Convert JPEG photos to GIFs in your browser. No watermark, no signup, presets for quality or small files. Privacy-first: files never leave your device.',
    h1: 'JPEG to GIF Converter (Clean Exports, Browser-Only)',
    intro: [
      'Drop JPEG photos and combine them into a smooth GIF without uploading. Plotlake runs FFmpeg locally, letting you manage quality, delay, dithering, and compression while keeping content private.',
      'Choose High Quality for 4K sharpness, Social for balanced smoothness, Tutorial for crisp UI text, or Small File to hit weight targets. Width, padding, and palette settings let you control artifacts and size.',
      'Recommended limits: keep totals under ~100MB and frame delay between 100-180ms for fluid loops. Loop infinitely for socials or set finite loops for walkthroughs.',
    ],
    features: [
      'Batch JPEG handling with reorder controls.',
      'Presets tuned for quality vs. size trade-offs.',
      'Dithering options (Floyd, Sierra, Bayer) and palette control (64-256 colors).',
      'Padding color and width presets (HD-4K) to unify frames.',
      'No watermark, no signup, browser-side privacy.',
      'Instant download with cached FFmpeg core.',
    ],
    faq: [
      { q: 'Can I mix JPEG with PNG/WebP?', a: 'Yes. Mixed formats are normalized before GIF generation.' },
      { q: 'How do I avoid banding?', a: 'Use High Quality or Tutorial presets with Floyd/Sierra dithering and larger palettes.' },
      { q: 'Is there a size limit?', a: 'Stay under ~100MB total for best stability across browsers.' },
      { q: 'Do you store my images?', a: 'No. Everything runs locally; nothing is uploaded.' },
      { q: 'How do I keep loops smooth?', a: 'Use frame delays around 100-140ms or add more frames; crossfade can help for seamless loops.' },
    ],
    relatedLinks: related('/jpeg-to-gif'),
    ogImage: defaultOg,
  },
  '/photo-to-gif': {
    title: 'Photo to GIF Maker | Free Online | Plotlake',
    description:
      'Turn photos into animated GIFs online. Free, no watermark, browser-side processing with presets for social, tutorial, ultra quality, and small file outputs.',
    h1: 'Photo to GIF Maker (Fast, Private, No Signup)',
    intro: [
      'Upload photos from your phone or camera and create a GIF without any upload to a server. Plotlake processes everything in-browser, preserving privacy while giving you control over delay, width, dithering, and compression.',
      'Social and High Quality presets keep motion smooth and sharp; Tutorial keeps UI text crisp; Small File targets lightweight exports for messaging apps. Choose padding color to handle mixed aspect ratios and avoid cropping.',
      'Recommended payload: under ~100MB for best stability. Frame delays between 100-180ms produce fluid loops, and palette compression (64-256 colors) lets you choose quality vs. size.',
    ],
    features: [
      'Photo batches with drag-drop and reorder.',
      'Presets for social, tutorials, ultra quality, and small files.',
      'Dithering and palette controls to manage gradients and file weight.',
      'Padding color choices to avoid awkward cropping.',
      'No watermark, free to use, runs locally.',
      'Quick downloads once FFmpeg core is cached.',
    ],
    faq: [
      { q: 'Can I use HEIC photos?', a: 'Convert HEIC to JPG/PNG first; then upload. Most browsers decode JPG/PNG/WebP reliably.' },
      { q: 'What delay should I use?', a: '100-140ms for smooth motion, 160-200ms for slideshow-style beats.' },
      { q: 'How many photos are safe to add?', a: 'Dozens are fine; keep total size under ~100MB for performance.' },
      { q: 'Do you add branding?', a: 'No. GIFs export clean by default.' },
      { q: 'Is processing private?', a: 'Yes. Everything runs in your browser; no uploads occur.' },
    ],
    relatedLinks: related('/photo-to-gif'),
    ogImage: defaultOg,
  },
  '/compress-gif': {
    title: 'Compress GIF Online | Shrink Size, Keep Quality | Plotlake',
    description:
      'Compress GIF files without watermarks. Adjust palette and dithering to shrink size for Discord, Slack, or email. Privacy-first: processing stays in your browser.',
    h1: 'Compress GIF Without Watermarks (Browser-Only)',
    intro: [
      'Upload any GIF and reduce its size directly in your browser. Plotlake never uploads files, letting you tweak palette sizes, dithering, and optional resizing to hit size targets for Discord, Slack, or email.',
      'Use presets to aim for balance: Social and High Quality favor detail, while Small File trims color depth to 64-128 colors. Tutorial-style settings keep UI text legible for demo GIFs.',
      'Guidance: start with your original width, then reduce palette or width incrementally. All exports remain watermark-free and free to download.',
    ],
    features: [
      'Browser-side GIF compression; no uploads.',
      'Presets for quality vs. size, including Small File.',
      'Palette control (64-256 colors) and dithering choices.',
      'Optional resizing to HD/2K/4K widths.',
      'No watermark, no signup, free forever.',
      'Instant download after processing.',
    ],
    faq: [
      { q: 'How much can I shrink a GIF?', a: 'Typically 30-70% reduction by lowering palette size and width; results vary by content.' },
      { q: 'Will there be a watermark?', a: 'No. Exports are clean with no branding.' },
      { q: 'Do you upload my GIF?', a: 'No. Compression runs locally in your browser.' },
      { q: 'What settings reduce size the most?', a: 'Use Heavy compression (64 colors), lower width, and slower frame delays if acceptable.' },
      { q: 'Can I keep text sharp?', a: 'Use Tutorial preset or Floyd/Sierra dithering with light compression to maintain edges.' },
    ],
    relatedLinks: related('/compress-gif'),
    ogImage: defaultOg,
  },
  '/no-watermark-gif-maker': {
    title: 'No Watermark GIF Maker | Free Online | Plotlake',
    description:
      'Create GIFs without any watermark or branding. Free, no signup. Browser-only processing for images and videos with presets for quality and size.',
    h1: 'Make GIFs with Zero Watermarks (Free & Private)',
    intro: [
      'Build GIFs that stay clean - no logos, no "made with" tags. Plotlake processes images and videos locally, so nothing leaves your device and exports remain pristine.',
      'Pick a preset that matches your goal: High Quality for detail, Social for smooth sharing, Tutorial for crisp text, Small File for lightweight messaging. Adjust delay/FPS, dithering, palette, and padding color as needed.',
      'Guidance: keep image batches under ~100MB or videos under ~60s/300 frames to maintain speed. Download instantly once FFmpeg is cached.',
    ],
    features: [
      'Zero watermark or branding on exports.',
      'Presets for social, tutorials, ultra quality, and small files.',
      'Supports images (JPG/PNG/WebP) and videos (MP4/WebM/MOV/AVI/MKV).',
      'Browser-side privacy; no uploads.',
      'Palette, dithering, loop, and padding controls.',
      'Fast downloads with cached FFmpeg core.',
    ],
    faq: [
      { q: 'Do you ever add branding?', a: 'No. Watermark-free is the default for every export.' },
      { q: 'Is it really free?', a: 'Yes. There is no premium tier or signup requirement.' },
      { q: 'Are my files uploaded?', a: 'No. Processing stays in your browser, keeping media private.' },
      { q: 'Can I tune quality?', a: 'Yes. Adjust width, delay/FPS, dithering, compression, and padding to control quality and size.' },
      { q: 'Which preset should I start with?', a: 'Social for sharing, High Quality for detail, Tutorial for crisp text, Small File for tiny outputs.' },
    ],
    relatedLinks: related('/no-watermark-gif-maker'),
    ogImage: defaultOg,
  },
  '/video-to-gif': {
    title: 'Video to GIF Converter | Trim & Set FPS | Plotlake',
    description:
      'Convert video clips to GIF online. Supports MP4, WebM, MOV, AVI, MKV. Trim ranges, set FPS, use presets, and export watermark-free in your browser.',
    h1: 'Video to GIF Converter (Trim, FPS, No Watermark)',
    intro: [
      'Load a video (MP4/WebM/MOV/AVI/MKV), trim the exact range you need, and export a GIF without uploading to a server. Plotlake runs FFmpeg locally for privacy-first processing.',
      'Use Social (balanced), High Quality (24fps, 0 compression), Tutorial (10fps for crisp UI), or Small File (5fps, medium compression) presets to match your goal. Width presets align with HD-4K outputs.',
      'Recommended limits: clips under ~60 seconds or ~300 frames for reliable in-browser processing. Adjust dithering and palette size to reduce banding or shrink file weight.',
    ],
    features: [
      'Video formats: MP4, WebM, MOV, AVI, MKV (audio ignored for GIF).',
      'Trim start/end times and set FPS for smoothness or size.',
      'Presets for social, high quality, tutorials, and small files.',
      'Browser-side FFmpeg; no uploads; no watermark.',
      'Width presets (HD-4K) plus padding and dithering controls.',
      'Guidance: keep to ~60s/300 frames for speed; FFmpeg core cached after first load.',
    ],
    faq: [
      { q: 'What FPS should I pick?', a: '12-15 for most clips, 20-24 for very smooth motion, 5-8 for tiny files.' },
      { q: 'How long can my video be?', a: 'We suggest under ~60 seconds or ~300 frames to keep processing fast in-browser.' },
      { q: 'Do you add a watermark?', a: 'No. Exports are clean with no branding.' },
      { q: 'Is my video uploaded?', a: 'No. Processing stays in your browser using WebAssembly FFmpeg.' },
      { q: 'How do I reduce file size?', a: 'Lower FPS, reduce width, shorten the clip, or choose Small File/medium compression.' },
    ],
    relatedLinks: related('/video-to-gif'),
    ogImage: defaultOg,
  },
  '/mp4-to-gif': {
    title: 'MP4 to GIF Converter | Free & Private | Plotlake',
    description:
      'Convert MP4 files to GIFs in-browser. Trim, set FPS, pick presets, and download watermark-free. Supports H.264/H.265 sources, no signup.',
    h1: 'MP4 to GIF Converter (Trim, Presets, No Watermark)',
    intro: [
      'Upload any MP4, trim the segment you need, and convert to a GIF without uploading to a server. Plotlake processes locally, keeping your footage private while offering FPS and width controls.',
      'Presets guide you: High Quality for detail, Social for balance, Tutorial for crisp UI text, Small File for lightweight sharing. Adjust palette/dithering to minimize banding.',
      'For stability, keep clips under ~60 seconds or ~300 frames. After the first FFmpeg load (~30MB cached), conversions speed up.',
    ],
    features: [
      'MP4 input with H.264/H.265 compatibility across modern browsers.',
      'Trim start/end and set FPS for smoothness vs. size.',
      'Presets spanning quality to small-file outcomes.',
      'No watermark, no signup; fully browser-side.',
      'Width presets (HD-4K) and palette/dither controls.',
      'Quick downloads once FFmpeg core is cached.',
    ],
    faq: [
      { q: 'What max size is recommended?', a: 'Stay under ~200MB and ~60s for best reliability; larger may strain memory.' },
      { q: 'Can I keep audio?', a: 'GIFs are silent; audio is ignored during conversion.' },
      { q: 'How do I make it smaller?', a: 'Lower FPS to 5-10, reduce width, or choose Small File/medium compression.' },
      { q: 'Is it private?', a: 'Yes. Files remain on your device; processing is local.' },
      { q: 'Do you add branding?', a: 'No. Exports are watermark-free by default.' },
    ],
    relatedLinks: related('/mp4-to-gif'),
    ogImage: defaultOg,
  },
  '/screen-recording-to-gif': {
    title: 'Screen Recording to GIF | Tutorial-Ready | Plotlake',
    description:
      'Convert screen recordings to GIFs for tutorials and demos. Trim, set FPS, pick presets, and keep text crisp. Free, no watermark, browser-side processing.',
    h1: 'Screen Recording to GIF (Crisp Text, No Watermark)',
    intro: [
      'Turn your screen recordings into shareable GIFs without uploading anywhere. Plotlake keeps text and UI elements sharp with tutorial-friendly presets and dithering choices.',
      'Import MP4/WebM/MOV/AVI/MKV captures, trim to the exact segment, and set FPS (10-15 often enough for UI). Use Tutorial preset for legible text, or High Quality for smoother motion.',
      'Guidance: keep clips under ~60 seconds or ~300 frames for quick in-browser processing. Palette and compression controls help hit size targets for docs, tickets, and chat tools.',
    ],
    features: [
      'Optimized for UI recordings with crisp text preservation.',
      'Presets for tutorials, socials, high quality, and small files.',
      'Trim ranges, set FPS, and choose width presets (HD-4K).',
      'No watermark; free; browser-only FFmpeg processing.',
      'Palette/dithering controls to reduce banding on gradients and UI overlays.',
      'Fast downloads once FFmpeg core is cached.',
    ],
    faq: [
      { q: 'What FPS works for UI demos?', a: '10-15 FPS usually keeps UI smooth; raise FPS for animation-heavy flows.' },
      { q: 'How do I keep text sharp?', a: 'Use Tutorial preset, higher width (HD/2K), and Floyd/Sierra dithering with light compression.' },
      { q: 'Is there a time limit?', a: 'Stay under ~60s/300 frames for reliable in-browser processing.' },
      { q: 'Are files uploaded?', a: 'No. Processing happens locally; nothing leaves your device.' },
      { q: 'Do you add branding?', a: 'No. Exports are watermark-free.' },
    ],
    relatedLinks: related('/screen-recording-to-gif'),
    ogImage: defaultOg,
  },
};
