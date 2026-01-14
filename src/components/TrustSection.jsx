import React from 'react';
import { Shield, Zap, Lock, Eye, FileCheck, Video } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const trustItems = [
    {
        icon: FileCheck,
        title: "No Watermark",
        title_cn: "无水印",
        desc: "Export clean GIFs—no logo, no branding, no attribution required. Your GIF, your way.",
        desc_cn: "导出干净的 GIF——没有 logo、没有品牌标识、无需署名。"
    },
    {
        icon: Zap,
        title: "100% Free Forever",
        title_cn: "永久免费",
        desc: "No premium tier, no trial, no hidden fees. All features unlocked for everyone.",
        desc_cn: "没有高级版，没有试用期，没有隐藏费用。所有功能对所有人开放。"
    },
    {
        icon: Shield,
        title: "No Signup Required",
        title_cn: "无需注册",
        desc: "Start creating immediately—no email, no password, no account to manage.",
        desc_cn: "立即开始创建——无需邮箱、密码或管理账户。"
    },
    {
        icon: Lock,
        title: "Privacy-First Processing",
        title_cn: "隐私优先处理",
        desc: "Everything runs in your browser. Your images and videos are never uploaded to any server.",
        desc_cn: "所有处理都在浏览器中进行。你的图片和视频绝不会上传到任何服务器。"
    },
    {
        icon: Video,
        title: "Images & Video Support",
        title_cn: "支持图片和视频",
        desc: "Convert image sequences or video clips to GIF. MP4, WebM, MOV, JPG, PNG all supported.",
        desc_cn: "将图片序列或视频片段转换为 GIF。支持 MP4、WebM、MOV、JPG、PNG。"
    },
    {
        icon: Eye,
        title: "Honest About Limits",
        title_cn: "透明限制",
        desc: "We tell you upfront: 100 MB input, 60-second videos, 300 frames max. Check FAQ for details.",
        desc_cn: "我们提前告知：100 MB 输入、60 秒视频、最多 300 帧。详情见 FAQ。"
    }
];

export default function TrustSection() {
    const { language } = useLanguage();

    return (
        <section className="space-y-6">
            <div className="text-left border-l-4 border-green-600 pl-4">
                <h2 className="text-2xl font-bold text-gray-900">
                    {language === 'zh' ? '为什么选择这个工具' : 'Why Use This Tool'}
                </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {trustItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={index}
                            className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <Icon className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {language === 'zh' ? item.title_cn : item.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {language === 'zh' ? item.desc_cn : item.desc}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
