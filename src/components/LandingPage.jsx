import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Layout from './Layout';
import FAQ from './FAQ';
import TrustSection from './TrustSection';

// Landing page data for each keyword-targeted page
const landingPageData = {
    'jpg-to-gif': {
        title: 'JPG to GIF Converter',
        title_cn: 'JPG 转 GIF 转换器',
        subtitle: 'Convert JPG images to animated GIF online',
        subtitle_cn: '在线将 JPG 图片转换为动画 GIF',
        bullets: [
            'Drag and drop your JPG files',
            'Set custom delays between frames',
            'Download clean, shareable GIFs'
        ],
        bullets_cn: [
            '拖放你的 JPG 文件',
            '设置自定义帧间延迟',
            '下载干净、可分享的 GIF'
        ],
        faqs: [
            { q: 'Can I convert multiple JPGs to one GIF?', a: 'Yes. Upload as many JPG files as you need—they\'ll combine into a single animated GIF.' },
            { q: 'Will the quality be preserved?', a: 'We use high-quality scaling. For best results, use original-resolution JPGs.' },
            { q: 'Is there a file size limit for JPGs?', a: 'Individual JPGs should be under 20 MB each. Total batch should stay under 100 MB.' }
        ]
    },
    'png-to-gif': {
        title: 'PNG to GIF Converter',
        title_cn: 'PNG 转 GIF 转换器',
        subtitle: 'Convert PNG images to animated GIF for free',
        subtitle_cn: '免费将 PNG 图片转换为动画 GIF',
        bullets: [
            'Upload PNG images with or without transparency',
            'Combine into smooth animated GIFs',
            'Download instantly, share anywhere'
        ],
        bullets_cn: [
            '上传带或不带透明度的 PNG 图片',
            '合成流畅的动画 GIF',
            '即时下载，随处分享'
        ],
        faqs: [
            { q: 'Does transparency carry over to the GIF?', a: 'GIF supports single-color transparency. Complex alpha transparency may have visible edges.' },
            { q: 'Can I mix PNG and JPG in one GIF?', a: 'Yes. Upload any mix of supported image formats together.' },
            { q: 'What\'s the maximum PNG size I can upload?', a: 'Keep individual PNGs under 20 MB each for reliable processing.' }
        ]
    },
    'jpeg-to-gif': {
        title: 'JPEG to GIF Converter',
        title_cn: 'JPEG 转 GIF 转换器',
        subtitle: 'Convert JPEG photos to animated GIF online',
        subtitle_cn: '在线将 JPEG 照片转换为动画 GIF',
        bullets: [
            'Free, no signup required',
            'No watermark on exports',
            'Custom timing and sizing'
        ],
        bullets_cn: [
            '免费，无需注册',
            '导出无水印',
            '自定义时间和尺寸'
        ],
        faqs: [
            { q: 'What\'s the difference between JPG and JPEG?', a: 'They\'re the same format—just different file extensions. Both work.' },
            { q: 'Can I use JPEG photos from my phone?', a: 'Yes. Any JPEG file from any source works.' },
            { q: 'Will JPEG compression affect my GIF quality?', a: 'GIF quality depends on your source images. Higher-quality JPEGs produce better results.' }
        ]
    },
    'photo-to-gif': {
        title: 'Photo to GIF Maker',
        title_cn: '照片转 GIF 制作器',
        subtitle: 'Turn your photos into animated GIFs',
        subtitle_cn: '将你的照片变成动画 GIF',
        bullets: [
            'Upload photos from phone or computer',
            'Adjust timing for each frame',
            'Download and share anywhere'
        ],
        bullets_cn: [
            '从手机或电脑上传照片',
            '调整每帧的时间',
            '下载并随处分享'
        ],
        faqs: [
            { q: 'Can I use iPhone/Android photos?', a: 'Yes. Upload HEIC, JPG, or PNG photos from any device.' },
            { q: 'How many photos can I use?', a: 'We recommend under 100 photos per GIF for best performance.' },
            { q: 'Will my photos be uploaded to a server?', a: 'No. All processing happens in your browser.' }
        ]
    },
    'compress-gif': {
        title: 'Compress GIF',
        title_cn: '压缩 GIF',
        subtitle: 'Reduce GIF file size without losing quality',
        subtitle_cn: '在不损失质量的情况下减小 GIF 文件大小',
        bullets: [
            'Reduce file size while keeping quality',
            'No watermark, no signup',
            'Works entirely in your browser'
        ],
        bullets_cn: [
            '减小文件大小同时保持质量',
            '无水印，无需注册',
            '完全在浏览器中运行'
        ],
        faqs: [
            { q: 'How much can I reduce file size?', a: 'Results vary, but 30–70% reduction is typical without visible quality loss.' },
            { q: 'What\'s the best size for Discord GIFs?', a: 'Discord allows up to 8 MB, but smaller loads faster. Aim for under 5 MB.' },
            { q: 'Can I compress GIFs I made elsewhere?', a: 'Yes. Upload any GIF file to compress it.' }
        ]
    },
    'no-watermark-gif-maker': {
        title: 'No Watermark GIF Maker',
        title_cn: '无水印 GIF 制作器',
        subtitle: 'Create GIFs without watermarks — really',
        subtitle_cn: '创建无水印的 GIF — 真的',
        bullets: [
            'Zero branding on exports',
            'No attribution required',
            'Free, no signup, no catch'
        ],
        bullets_cn: [
            '导出零品牌标识',
            '无需署名',
            '免费，无需注册，没有陷阱'
        ],
        faqs: [
            { q: 'Is there really no watermark?', a: 'Really. No logo, no "made with" text, nothing added to your GIF.' },
            { q: 'Do I need to pay for watermark-free exports?', a: 'No. Watermark-free is the default—no premium tier.' },
            { q: 'Can I use these GIFs commercially?', a: 'Yes, as long as you own or have rights to the source images.' }
        ]
    },
    'video-to-gif': {
        title: 'Video to GIF Converter',
        title_cn: '视频转 GIF 转换器',
        subtitle: 'Convert any video clip to animated GIF online',
        subtitle_cn: '在线将任何视频片段转换为动画 GIF',
        bullets: [
            'Supports MP4, WebM, MOV, AVI, MKV',
            'Trim clips with precise time selection',
            'Adjust FPS for smooth or compact GIFs',
            'No watermark, 100% browser-based'
        ],
        bullets_cn: [
            '支持 MP4、WebM、MOV、AVI、MKV',
            '精确时间选择裁剪片段',
            '调整 FPS 获得流畅或紧凑的 GIF',
            '无水印，100% 浏览器处理'
        ],
        faqs: [
            { q: 'What video formats can I convert?', a: 'MP4, WebM, MOV, AVI, MKV, and FLV. Most common formats work.' },
            { q: 'How long can my video be?', a: 'We recommend clips under 60 seconds. Longer videos produce very large GIFs.' },
            { q: 'Why does video processing take longer?', a: 'Videos need frame extraction via FFmpeg before GIF generation. FFmpeg loads once (~30MB) then is cached.' },
            { q: 'Can I select just part of a video?', a: 'Yes. Use the time range slider to set start and end points.' }
        ]
    },
    'mp4-to-gif': {
        title: 'MP4 to GIF Converter',
        title_cn: 'MP4 转 GIF 转换器',
        subtitle: 'Convert MP4 videos to animated GIF for free',
        subtitle_cn: '免费将 MP4 视频转换为动画 GIF',
        bullets: [
            'Upload any MP4 file',
            'Set custom time range and FPS',
            'Choose quality presets for social media',
            'Download without watermark'
        ],
        bullets_cn: [
            '上传任何 MP4 文件',
            '设置自定义时间范围和帧率',
            '选择社交媒体质量预设',
            '无水印下载'
        ],
        faqs: [
            { q: 'What MP4 codecs are supported?', a: 'H.264 and H.265 work in most browsers. If your file fails, try a different browser.' },
            { q: 'What\'s the maximum MP4 file size?', a: 'We recommend under 200 MB. Larger files may slow down or fail on some devices.' },
            { q: 'How do I make a smaller GIF from MP4?', a: 'Lower the FPS (5-10), reduce output width, or use the Small File preset.' },
            { q: 'Will my MP4 be uploaded anywhere?', a: 'No. Everything runs in your browser. Your video never leaves your device.' }
        ]
    },
    'screen-recording-to-gif': {
        title: 'Screen Recording to GIF',
        title_cn: '屏幕录制转 GIF',
        subtitle: 'Convert screen recordings to shareable GIFs',
        subtitle_cn: '将屏幕录制转换为可分享的 GIF',
        bullets: [
            'Perfect for tutorials and demos',
            'Crisp text with Tutorial preset',
            'Trim to exact clip you need',
            'No watermark or signup required'
        ],
        bullets_cn: [
            '非常适合教程和演示',
            '使用教程预设获得清晰文字',
            '裁剪到你需要的精确片段',
            '无需水印或注册'
        ],
        faqs: [
            { q: 'What format should my screen recording be?', a: 'MP4 or WebM work best. Most screen recorders output in these formats.' },
            { q: 'How do I keep text readable in the GIF?', a: 'Use the Tutorial preset which prioritizes sharpness, or set a higher output width.' },
            { q: 'What FPS should I use for screen recordings?', a: '10-15 FPS is usually enough for UI demos. Use higher for animations.' },
            { q: 'Can I add annotations to my GIF?', a: 'Not directly. Add annotations in your screen recorder before converting.' }
        ]
    }
};

export default function LandingPage({ pageKey, language = 'en' }) {
    const data = landingPageData[pageKey];

    if (!data) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <h1 className="text-2xl font-bold text-gray-900">Page not found</h1>
                    <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
                        ← Back to Image to GIF Maker
                    </Link>
                </div>
            </Layout>
        );
    }

    const title = language === 'zh' ? data.title_cn : data.title;
    const subtitle = language === 'zh' ? data.subtitle_cn : data.subtitle;
    const bullets = language === 'zh' ? data.bullets_cn : data.bullets;

    return (
        <Layout>
            <div className="relative isolate px-6 pt-14 lg:px-8 -mt-20 mb-10 overflow-hidden">
                {/* Background decorative blobs */}
                <div
                    className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                    aria-hidden="true"
                >
                    <div
                        className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                    />
                </div>

                <div className="mx-auto max-w-2xl py-16 sm:py-24">
                    <div className="text-center">
                        <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-6xl mb-6 truncate leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
                                {title}
                            </span>
                        </h1>
                        <p className="text-lg leading-8 text-gray-600 mb-10">
                            {subtitle}
                        </p>

                        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl ring-1 ring-gray-900/5 mb-12 transform hover:scale-[1.01] transition-all duration-300">
                            <ul className="space-y-4 text-left max-w-lg mx-auto">
                                {bullets.map((bullet, index) => (
                                    <li key={index} className="flex items-center gap-4">
                                        <div className="flex-none rounded-full bg-green-100 p-1">
                                            <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                                        </div>
                                        <span className="text-gray-700 font-medium">{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                to="/"
                                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1 transition-all duration-200 flex items-center gap-2 group"
                            >
                                {language === 'zh' ? '开始创建' : 'Start Creating'}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Secondary Background blob */}
                <div
                    className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                    aria-hidden="true"
                >
                    <div
                        className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                    />
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-24 pb-24 px-6 md:px-0">
                {/* Trust Section */}
                <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-2 md:p-8">
                    <TrustSection />
                </div>

                {/* Page-specific FAQ */}
                <section className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                            {language === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
                        </h2>
                        <p className="mt-4 text-lg leading-8 text-gray-600">
                            {language === 'zh' ? '关于该转换器的具体细节' : 'Specifics about this converter'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
                        {data.faqs.map((faq, index) => (
                            <div key={index} className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5 hover:shadow-md transition-shadow">
                                <dt className="font-semibold text-gray-900 text-lg leading-7 mb-3">{faq.q}</dt>
                                <dd className="leading-7 text-gray-600">{faq.a}</dd>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Full FAQ */}
                <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100">
                    <FAQ />
                </div>

                {/* Back to main tool */}
                <div className="text-center">
                    <Link
                        to="/"
                        className="text-gray-500 hover:text-blue-600 hover:underline font-medium inline-flex items-center gap-1 transition-colors"
                    >
                        <span>←</span>
                        <span>{language === 'zh' ? '返回图片转 GIF 制作器' : 'Back to Image to GIF Maker'}</span>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}

// Export the data for use in generating SEO meta tags
export { landingPageData };
