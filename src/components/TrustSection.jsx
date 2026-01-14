import React from 'react';
import { Shield, Zap, Lock, Eye, FileCheck } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const trustItems = [
    {
        icon: FileCheck,
        title: "No Watermark",
        title_cn: "无水印",
        desc: "Exports are clean—no logo, no watermark, no attribution required.",
        desc_cn: "导出文件干净——没有 logo、没有水印、无需署名。"
    },
    {
        icon: Zap,
        title: "Free to Use",
        title_cn: "免费使用",
        desc: "Completely free. No premium tier, no hidden upgrade prompts.",
        desc_cn: "完全免费。没有高级版，没有隐藏的升级提示。"
    },
    {
        icon: Shield,
        title: "No Signup Required",
        title_cn: "无需注册",
        desc: "Jump straight in—no account, no email, no password.",
        desc_cn: "直接开始使用——无需账户、邮箱或密码。"
    },
    {
        icon: Lock,
        title: "Privacy First",
        title_cn: "隐私优先",
        desc: "Files are processed in your browser. Nothing is uploaded to our servers.",
        desc_cn: "文件在浏览器中处理。不会上传到我们的服务器。"
    },
    {
        icon: Eye,
        title: "Transparent Limits",
        title_cn: "透明限制",
        desc: "We're upfront about what works best. Check the FAQ for specifics.",
        desc_cn: "我们提前告知最佳实践。详情请查看常见问题。"
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
