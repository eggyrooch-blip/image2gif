import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Image, Video } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// General FAQs (applicable to both images and videos)
const generalFaqs = [
    {
        q: "Do you add a watermark to exported GIFs?",
        a: "No. Every GIF you create is exported without any watermark, logo, or attribution. What you make is what you get.",
        q_cn: "你们会在导出的 GIF 上加水印吗？",
        a_cn: "不会。你创建的每个 GIF 导出时都没有任何水印、logo 或署名要求。"
    },
    {
        q: "Is this GIF Maker free to use?",
        a: "Yes. It's free with no premium tier, no trial period, and no hidden fees. You can use all features without paying.",
        q_cn: "这个 GIF 制作工具是免费的吗？",
        a_cn: "是的。完全免费，没有高级版，没有试用期，没有隐藏费用。"
    },
    {
        q: "Do I need to sign up or create an account?",
        a: "No. You can start creating GIFs immediately—no email, no password, no account required.",
        q_cn: "我需要注册账户吗？",
        a_cn: "不需要。你可以立即开始创建 GIF——无需邮箱、密码或账户。"
    },
    {
        q: "How long do you keep uploaded files?",
        a: "We don't keep your files at all. Processing happens locally in your browser—files are never sent to our servers.",
        q_cn: "你们保留上传的文件多久？",
        a_cn: "我们根本不保留你的文件。处理在你的浏览器本地进行——文件从不发送到我们的服务器。"
    },
    {
        q: "Are uploads used for training AI or shared with third parties?",
        a: "No. Your files stay in your browser. We have no access to them, so they can't be used for training or shared with anyone.",
        q_cn: "上传的文件会被用于训练 AI 或分享给第三方吗？",
        a_cn: "不会。你的文件留在你的浏览器中。我们无法访问它们。"
    },
    {
        q: "Will my GIF work on X/Discord/Telegram?",
        a: "Standard GIFs work on most platforms. For best compatibility: keep file size under 5 MB for X, 8 MB for Discord.",
        q_cn: "我的 GIF 能在 X/Discord/Telegram 上使用吗？",
        a_cn: "标准 GIF 在大多数平台上都能用。建议：X 小于 5 MB，Discord 小于 8 MB。"
    },
    {
        q: "What can I upload (copyright & responsibility)?",
        a: "You're responsible for ensuring you have the right to use any content you upload. Only use content you own or have permission to use.",
        q_cn: "我可以上传什么（版权与责任）？",
        a_cn: "你有责任确保你有权使用上传的任何内容。只使用你拥有或有权使用的内容。"
    },
    {
        q: "Do you support HEIC/HEIF from iPhone?",
        a: "Yes! Drop HEIC/HEIF photos directly. They're converted to PNG automatically. If your browser doesn't support HEIC, try Safari on iOS or convert to JPG first.",
        q_cn: "支持 iPhone 的 HEIC/HEIF 格式吗？",
        a_cn: "支持！直接拖入 HEIC/HEIF 照片，会自动转换为 PNG。如果浏览器不支持，可以使用 iOS Safari 或先转换为 JPG。"
    },
    {
        q: "Can I drop a folder of images?",
        a: "Yes! Drag a folder onto the upload area. Images are sorted by filename (natural order: img_001, img_002...). Non-image files are ignored.",
        q_cn: "可以拖入文件夹吗？",
        a_cn: "可以！将文件夹拖到上传区域。图片按文件名自然排序（img_001, img_002...），非图片文件会被忽略。"
    },
    {
        q: "Can I export Animated WebP?",
        a: "Yes! Select 'WebP' as output format. WebP is typically 60% smaller than GIF with better quality. Most modern browsers support it.",
        q_cn: "可以导出动态 WebP 吗？",
        a_cn: "可以！选择 'WebP' 作为输出格式。WebP 通常比 GIF 小 60%，质量更好。大多数现代浏览器都支持。"
    },
    {
        q: "Can I export APNG?",
        a: "Yes! Select 'APNG' as output format. APNG preserves full PNG quality without palette limitations - ideal for UI screenshots and text.",
        q_cn: "可以导出 APNG 吗？",
        a_cn: "可以！选择 'APNG' 作为输出格式。APNG 保留完整 PNG 质量，无调色板限制，非常适合 UI 截图和文字。"
    },
    {
        q: "What's the difference between GIF, WebP, and APNG?",
        a: "GIF: Universal support, 256 colors max. WebP: 60% smaller, better gradients, good browser support. APNG: Lossless like PNG, best for text/UI, less browser support than WebP.",
        q_cn: "GIF、WebP 和 APNG 有什么区别？",
        a_cn: "GIF：兼容性最好，最多 256 色。WebP：体积小 60%，渐变更好，浏览器支持良好。APNG：无损如 PNG，最适合文字/UI，浏览器支持不如 WebP。"
    },
    {
        q: "Why can't my device decode HEIC?",
        a: "HEIC decoding requires iOS/macOS Safari or Chrome on supported systems. Firefox and older browsers don't support HEIC natively. Convert to JPG first as fallback.",
        q_cn: "为什么我的设备无法解码 HEIC？",
        a_cn: "HEIC 解码需要 iOS/macOS Safari 或支持系统上的 Chrome。Firefox 和旧浏览器原生不支持 HEIC。可以先转换为 JPG。"
    }
];

// Image-specific FAQs
const imageFaqs = [
    {
        q: "What are the limits (file size / number of images)?",
        a: "For best results, we recommend keeping total input under 100 MB and using fewer than 100 images per GIF. Larger batches may slow down or fail on lower-end devices.",
        q_cn: "有什么限制（文件大小/图片数量）？",
        a_cn: "为获得最佳效果，建议总输入文件小于 100 MB，每个 GIF 使用少于 100 张图片。"
    },
    {
        q: "Why does my GIF look blurry?",
        a: "Blurriness usually comes from aggressive resizing. Try using dimensions closer to your original images, or use high-resolution source images.",
        q_cn: "为什么我的 GIF 看起来模糊？",
        a_cn: "模糊通常来自过度缩放。尝试使用更接近原始图片的尺寸，或确保使用高分辨率源图。"
    },
    {
        q: "How can I make my GIF smoother?",
        a: "Reduce the delay between frames (try 50–100ms) and add more frames for smoother motion.",
        q_cn: "如何让我的 GIF 更流畅？",
        a_cn: "减少帧之间的延迟（尝试 50-100 毫秒）并添加更多帧以获得更流畅的动画。"
    },
    {
        q: "How do I reduce GIF file size?",
        a: "Lower the output dimensions, increase frame delay (fewer frames per second), or reduce the number of frames.",
        q_cn: "如何减小 GIF 文件大小？",
        a_cn: "降低输出尺寸、增加帧延迟（每秒更少帧）或减少帧数。"
    },
    {
        q: "Why did the export fail or get stuck?",
        a: "This usually happens when total file size is too large for your browser's memory. Try reducing image count or size, and refresh the page.",
        q_cn: "为什么导出失败或卡住了？",
        a_cn: "这通常发生在总文件大小超出浏览器内存时。尝试减少图片数量或大小，然后刷新页面。"
    }
];

// Video-specific FAQs
const videoFaqs = [
    {
        q: "What video formats are supported?",
        a: "MP4, WebM, MOV, AVI, MKV, and FLV. Most common video files will work. If yours doesn't, try converting to MP4 first.",
        q_cn: "支持哪些视频格式？",
        a_cn: "支持 MP4、WebM、MOV、AVI、MKV 和 FLV。大多数常见视频文件都能用。如果不行，请先转换为 MP4。"
    },
    {
        q: "Why does FFmpeg take so long to load the first time?",
        a: "FFmpeg WebAssembly (~30 MB) needs to download once. After that, it's cached in your browser. Subsequent visits load instantly.",
        q_cn: "为什么 FFmpeg 首次加载这么慢？",
        a_cn: "FFmpeg WebAssembly（约 30 MB）需要首次下载。之后会缓存在浏览器中，后续访问立即加载。"
    },
    {
        q: "How do I make my video GIF smoother?",
        a: "Increase the FPS setting (15-24 for smooth motion). Higher FPS = more frames = smoother playback but larger file size.",
        q_cn: "如何让视频 GIF 更流畅？",
        a_cn: "提高 FPS 设置（15-24 可获得流畅动画）。更高 FPS = 更多帧 = 更流畅但文件更大。"
    },
    {
        q: "How do I reduce video GIF file size?",
        a: "Lower the FPS (5-10), reduce output width, or use the 'Small File' preset. Shorter clips also help significantly.",
        q_cn: "如何减小视频 GIF 文件大小？",
        a_cn: "降低 FPS（5-10）、减小输出宽度，或使用「小文件」预设。更短的片段也有明显帮助。"
    },
    {
        q: "What's the relationship between FPS and frame delay?",
        a: "FPS (frames per second) determines playback speed. Frame delay is auto-calculated: delay = 1000 / FPS. At 10 FPS, each frame shows for 100ms.",
        q_cn: "FPS 和帧延迟是什么关系？",
        a_cn: "FPS（每秒帧数）决定播放速度。帧延迟自动计算：延迟 = 1000 / FPS。在 10 FPS 时，每帧显示 100 毫秒。"
    },
    {
        q: "How long can my video be?",
        a: "We recommend clips under 60 seconds. Longer videos work but produce very large GIFs and may hit browser memory limits.",
        q_cn: "视频可以多长？",
        a_cn: "建议片段在 60 秒以内。更长的视频可以用，但会产生非常大的 GIF 并可能触及浏览器内存限制。"
    },
    {
        q: "Can I select just part of a video?",
        a: "Yes. Use the time range slider to set start and end points. Only the selected portion will be converted to GIF.",
        q_cn: "我可以只选择视频的一部分吗？",
        a_cn: "可以。使用时间范围滑块设置开始和结束点。只有选中的部分会被转换为 GIF。"
    },
    {
        q: "Why is video processing slower than images?",
        a: "Videos require frame extraction via FFmpeg before GIF generation. This takes extra time, especially for long clips or high FPS.",
        q_cn: "为什么视频处理比图片慢？",
        a_cn: "视频需要通过 FFmpeg 提取帧后才能生成 GIF。这需要额外时间，特别是对于长片段或高 FPS。"
    },
    {
        q: "What happens if I upload a large video (>200 MB)?",
        a: "You'll see a warning. Processing may be slow or fail on devices with limited memory. We recommend trimming or compressing first.",
        q_cn: "如果上传大视频（>200 MB）会怎样？",
        a_cn: "你会看到警告。处理可能很慢或在内存有限的设备上失败。建议先剪辑或压缩。"
    },
    {
        q: "Can I convert a screen recording to GIF?",
        a: "Yes. Screen recordings are perfect for GIF tutorials. Use the 'Tutorial' preset for crisp text and reasonable file size.",
        q_cn: "我可以把屏幕录制转成 GIF 吗？",
        a_cn: "可以。屏幕录制非常适合做 GIF 教程。使用「教程」预设可获得清晰文字和合理文件大小。"
    }
];

function FAQItem({ item, isOpen, onToggle, lang }) {
    const question = lang === 'zh' ? item.q_cn : item.q;
    const answer = lang === 'zh' ? item.a_cn : item.a;

    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full py-3 px-1 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-lg"
            >
                <span className="font-medium text-gray-900 pr-4 text-sm">{question}</span>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
            </button>
            {isOpen && (
                <div className="pb-3 px-1 text-gray-600 leading-relaxed text-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    {answer}
                </div>
            )}
        </div>
    );
}

function FAQSection({ title, titleCn, icon: Icon, faqs, color, openIndex, onToggle, indexOffset, lang }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const displayTitle = lang === 'zh' ? titleCn : title;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r ${color} text-white font-semibold`}
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span>{displayTitle}</span>
                    <span className="text-xs opacity-80">({faqs.length})</span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                ) : (
                    <ChevronDown className="w-5 h-5" />
                )}
            </button>
            {isExpanded && (
                <div className="divide-y divide-gray-200 px-3">
                    {faqs.map((item, index) => (
                        <FAQItem
                            key={index}
                            item={item}
                            isOpen={openIndex === indexOffset + index}
                            onToggle={() => onToggle(indexOffset + index)}
                            lang={lang}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FAQ() {
    const { language } = useLanguage();
    const [openIndex, setOpenIndex] = useState(null);

    const handleToggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="space-y-6">
            <div className="text-left border-l-4 border-blue-600 pl-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    {language === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
                </h2>
                <p className="text-gray-500 mt-1">
                    {language === 'zh'
                        ? '关于水印、隐私、限制和质量的快速解答'
                        : 'Quick answers about watermarks, privacy, limits, and quality'}
                </p>
            </div>

            <div className="space-y-4">
                {/* General FAQs */}
                <FAQSection
                    title="General"
                    titleCn="通用问题"
                    icon={ChevronDown}
                    faqs={generalFaqs}
                    color="from-gray-600 to-gray-700"
                    openIndex={openIndex}
                    onToggle={handleToggle}
                    indexOffset={0}
                    lang={language}
                />

                {/* Image FAQs */}
                <FAQSection
                    title="Images to GIF"
                    titleCn="图片转 GIF"
                    icon={Image}
                    faqs={imageFaqs}
                    color="from-blue-500 to-blue-600"
                    openIndex={openIndex}
                    onToggle={handleToggle}
                    indexOffset={generalFaqs.length}
                    lang={language}
                />

                {/* Video FAQs */}
                <FAQSection
                    title="Video to GIF"
                    titleCn="视频转 GIF"
                    icon={Video}
                    faqs={videoFaqs}
                    color="from-purple-500 to-purple-600"
                    openIndex={openIndex}
                    onToggle={handleToggle}
                    indexOffset={generalFaqs.length + imageFaqs.length}
                    lang={language}
                />
            </div>
        </section>
    );
}
