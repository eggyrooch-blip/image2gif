import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const faqData = [
    {
        q: "Do you add a watermark to exported GIFs?",
        a: "No. Every GIF you create is exported without any watermark, logo, or attribution. What you make is what you get.",
        q_cn: "你们会在导出的 GIF 上加水印吗？",
        a_cn: "不会。你创建的每个 GIF 导出时都没有任何水印、logo 或署名要求。"
    },
    {
        q: "Is this Image to GIF Maker free to use?",
        a: "Yes. It's free with no premium tier, no trial period, and no hidden fees. You can use all features without paying.",
        q_cn: "这个图片转 GIF 工具是免费的吗？",
        a_cn: "是的。完全免费，没有高级版，没有试用期，没有隐藏费用。"
    },
    {
        q: "Do I need to sign up or create an account?",
        a: "No. You can start creating GIFs immediately—no email, no password, no account required.",
        q_cn: "我需要注册账户吗？",
        a_cn: "不需要。你可以立即开始创建 GIF——无需邮箱、密码或账户。"
    },
    {
        q: "What are the limits (file size / number of images)?",
        a: "For best results, we recommend keeping total input under 100 MB and using fewer than 100 images per GIF. Larger batches may slow down or fail on lower-end devices.",
        q_cn: "有什么限制（文件大小/图片数量）？",
        a_cn: "为获得最佳效果，建议总输入文件小于 100 MB，每个 GIF 使用少于 100 张图片。"
    },
    {
        q: "How long do you keep uploaded files?",
        a: "We don't keep your files at all. Processing happens locally in your browser—images are never sent to our servers.",
        q_cn: "你们保留上传的文件多久？",
        a_cn: "我们根本不保留你的文件。处理在你的浏览器本地进行——图片从不发送到我们的服务器。"
    },
    {
        q: "Are uploads used for training AI or shared with third parties?",
        a: "No. Your files stay in your browser. We have no access to them, so they can't be used for training or shared with anyone.",
        q_cn: "上传的文件会被用于训练 AI 或分享给第三方吗？",
        a_cn: "不会。你的文件留在你的浏览器中。我们无法访问它们。"
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
    },
    {
        q: "Will my GIF work on X/Discord/Telegram?",
        a: "Standard GIFs work on most platforms. For best compatibility: keep file size under 5 MB for X, 8 MB for Discord.",
        q_cn: "我的 GIF 能在 X/Discord/Telegram 上使用吗？",
        a_cn: "标准 GIF 在大多数平台上都能用。建议：X 小于 5 MB，Discord 小于 8 MB。"
    },
    {
        q: "What can I upload (copyright & responsibility)?",
        a: "You're responsible for ensuring you have the right to use any images you upload. Only use content you own or have permission to use.",
        q_cn: "我可以上传什么（版权与责任）？",
        a_cn: "你有责任确保你有权使用上传的任何图片。只使用你拥有或有权使用的内容。"
    }
];

function FAQItem({ item, isOpen, onToggle, lang }) {
    const question = lang === 'zh' ? item.q_cn : item.q;
    const answer = lang === 'zh' ? item.a_cn : item.a;

    return (
        <div className="border-b border-gray-200 last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full py-4 px-1 flex items-center justify-between text-left hover:bg-gray-50 transition-colors rounded-lg"
            >
                <span className="font-medium text-gray-900 pr-4">{question}</span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                )}
            </button>
            {isOpen && (
                <div className="pb-4 px-1 text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-200">
                    {answer}
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

            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-200 shadow-sm">
                {faqData.map((item, index) => (
                    <FAQItem
                        key={index}
                        item={item}
                        isOpen={openIndex === index}
                        onToggle={() => handleToggle(index)}
                        lang={language}
                    />
                ))}
            </div>
        </section>
    );
}
