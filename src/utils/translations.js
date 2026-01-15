export const translations = {
    en: {
        title: "Image to GIF Maker",
        footer: "© {year} Plotlake. Local processing, privacy first.",
        status: {
            loading: "Loading FFmpeg...",
            ready: "Ready",
            failed: "Failed to load FFmpeg",
            processing: "Processing...",
            generating: "Generating GIF...",
            init: "Initializing...",
            originalSize: "Original Size: {width}×{height}px",
        },
        steps: {
            select: "Select Images",
            configure: "Configure",
            result: "Result",
        },
        dragDrop: {
            title: "Drag & Drop images here",
            subtitle: "or click to select files",
            support: "Supports JPG, PNG, WebP",
            tip: "💡 Try uploading 5-10 screenshots, set 500ms delay for smooth animation",
        },
        dragDropVideo: {
            title: "Drop video file here",
            subtitle: "or click to select",
            support: "Supports MP4, WebM, MOV, AVI, MKV",
            tip: "Recommended under 200MB; first run loads FFmpeg (~30MB)",
        },
        settings: {
            dimensions: "Dimensions",
            width: "Width",
            height: "Height",
            auto: "Auto",
            framerate: "Frame Rate",
            delay: "Frame Delay",
            delayUnit: "ms",
            delayAutoCalculated: "Auto-calculated from FPS for accurate playback speed",
            quality: "Quality",
            quickPresets: "Quick Presets",
            presetApplied: "Applied \"{name}\" preset",
            loop: "Loop Count",
            loopInfinite: "Infinite",
            loopTimes: "times",
            dither: "Dithering",
            palettesize: "Palette Size",
            crossfade: "Crossfade Transition",
            crossfadeFrames: "Transition Frames",
            crossfadeHint: "Smooth loop transition effect",
            fillColor: "Fill Color",
            fillBlack: "Black",
            fillWhite: "White",
            compression: "Compression",
            compressionNone: "None (Best Quality)",
            compressionLight: "Light (128 colors)",
            compressionMedium: "Medium (128 colors, optimized)",
            compressionHeavy: "Heavy (64 colors, smallest)",
        },
        intentMode: {
            convert: "Convert format",
            convertCn: "转格式",
            platform: "Optimize for platform",
            platformCn: "平台适配",
            finetune: "Fine-tune",
            finetuneCn: "高级",
            desc: {
                convert: "Pick a format. Great for format conversion and quick exports.",
                platform: "Choose a platform. We auto-pick the best format + settings to fit common limits.",
                finetune: "Full control over quality, size, and advanced GIF options."
            },
            recommendedOutput: "Recommended output",
            changeFormat: "Change format"
        },
        presets: {
            title: "Presets",
            subtitle: "Pick a platform or a quality preset to auto-tune settings.",
            tab: {
                platform: "Platform",
                quality: "Quality"
            },
            guidance: {
                platform: "Platform presets auto-pick the best output format + settings. You can override format below.",
                quality: "Quality presets tune settings only. Choose output format below if needed."
            },
            platformApplied: "Applied \"{name}\" ({format})",
            platform: {
                twitter: { resultDesc: "Sharp + smooth playback" },
                discord: { resultDesc: "Optimized for size limit" },
                slack: { resultDesc: "Smaller file by default" },
                telegram: { resultDesc: "Prefer WebP when possible" },
                email: { resultDesc: "Tiny file, loops 3x" }
            },
            common: {
                social: { name: "Social Media", desc: "2K / 120ms / smooth" },
                highQuality: { name: "High Quality", desc: "4K, sharp & silky" },
                tutorial: { name: "Tutorial", desc: "2K, clean UI text" },
                smallFile: { name: "Small File", desc: "HD, 180ms, tiny" }
            },
            video: {
                social: {
                    name: "Social Media",
                    desc: "Twitter, Discord, TikTok"
                },
                highQuality: {
                    name: "High Quality",
                    desc: "Best detail, websites"
                },
                tutorial: {
                    name: "Tutorial",
                    desc: "Screen recording, demos"
                },
                smallFile: {
                    name: "Small File",
                    desc: "Email, cloud storage"
                }
            }
        },
        hints: {
            dither: {
                bayer: "Recommended for photos and screen recordings",
                floydSteinberg: "Best for portraits, smooth skin tones",
                sierra2: "General purpose option",
                sierra2Lite: "Lighter dithering effect",
                none: "Best for cartoons and charts"
            },
            compression: {
                none: "Best quality, larger file (10-15MB)",
                light: "Recommended! Balanced quality and size (4-8MB)",
                medium: "Noticeable compression, visible color loss (2-4MB)",
                heavy: "Maximum compression, smallest file (1-2MB)"
            },
            loop: {
                infinite: "Recommended for social media and animations",
                once: "Best for tutorials and demos",
                thrice: "Good for emphasis and attention",
                default: "Choose based on your use case"
            }
        },
        warnings: {
            largeFiles: "Total size exceeds 100MB. Consider using a lower resolution for better performance.",
        },
        buttons: {
            generate: "Generate {format}",
            download: "Download {format}",
            remove: "Remove",
            clear: "Clear All",
        },
        preview: {
            placeholder: "Generated animation will appear here",
            size: "Size",
        },
        imageList: {
            count: "{count} Image{s}",
            hint: "💡 Drag to change playback order",
        },
        share: {
            title: "🎉 Like this tool? Share with friends!",
            twitter: "Share on X",
            whatsapp: "WhatsApp",
            copyLink: "Copy Link",
            copied: "Copied!",
        },
        feedback: {
            text: "Feedback & Suggestions",
        },
        donate: {
            text: "☕ Buy me a coffee",
            thanks: "Thank you for supporting!",
        },
        frameEditor: {
            title: "Edit Frame",
            crop: "Crop",
            rotate: "Rotate",
            rotateLeft: "Rotate Left",
            rotateRight: "Rotate Right",
            applyCrop: "Apply Crop",
            applyRotation: "Apply Rotation",
            cancel: "Cancel",
            reset: "Reset",
            prev: "Previous",
            next: "Next",
        },
        video: {
            tabImages: "Images",
            tabVideo: "Video",
            dropTitle: "Drop video file here",
            dropSubtitle: "or click to select",
            dropSupport: "Supports MP4, WebM, MOV, AVI, MKV",
            maxSize: "Max recommended: 200MB",
            ffmpegNotice: "First video processing will load FFmpeg (~30MB)",
            sizeWarning: "Large file. Processing may be slow.",
            analyzing: "Analyzing video...",
            duration: "Duration",
            resolution: "Resolution",
            fileSize: "Size",
            format: "Format",
            timeRange: "Time Range",
            startTime: "Start",
            endTime: "End",
            selectedDuration: "Selected",
            fps: "Frame Rate (FPS)",
            fpsHint: "Higher FPS = smoother but larger GIF",
            estimatedFrames: "Estimated: ~{count} frames",
            extracting: "Extracting frames...",
            extractingFrame: "Extracting frame {current}/{total}...",
            cancel: "Cancel",
        },
        overlay: {
            title: "Sticker",
            enable: "Enable Sticker",
            active: "Active",
            upload: "Upload Image",
            uploadHint: "PNG with transparency recommended",
            position: "Position",
            positions: {
                'top-left': "Top Left",
                'top-right': "Top Right",
                'bottom-left': "Bottom Left",
                'bottom-right': "Bottom Right",
                'center': "Center"
            },
            scale: "Scale",
            margin: "Margin",
            opacity: "Opacity",
            previewHint: "Sticker will be applied when generating output"
        },
        outputFormat: {
            label: "Output Format",
            labelOptional: "Output format (optional)",
            platformHint: "Platform presets may change this to match size/compatibility.",
            overridden: "Format overridden manually.",
            gif: "GIF",
            webp: "WebP",
            apng: "APNG",
            gifDesc: "Universal compatibility",
            webpDesc: "~60% smaller than GIF",
            apngDesc: "Lossless, best for text/UI",
            hint: {
                gif: "Best compatibility, 256 colors max",
                webp: "~60% smaller than GIF, great quality, most browsers",
                apng: "Full PNG quality, best for text/UI, no IE support"
            }
        },
        mp4Hint: {
            text: "Need a smaller, smoother result?",
            link: "Try Image to MP4"
        },
        platforms: {
            title: "Platform Presets",
            twitter: { name: "X (Twitter)", desc: "HD, smooth playback" },
            discord: { name: "Discord", desc: "Optimized for 8MB limit" },
            slack: { name: "Slack", desc: "Optimized for 5MB limit" },
            telegram: { name: "Telegram", desc: "WebP recommended" },
            email: { name: "Email", desc: "2MB, loops 3x" }
        },
        heic: {
            detected: "iPhone HEIC photos detected - converting...",
            converting: "Converting HEIC files...",
            error: "This browser can't decode HEIC. Try Safari on iOS, or convert to JPG first.",
            converted: "Converted {count} HEIC file(s) to PNG",
            partialError: "Some HEIC files couldn't be converted"
        },
        folder: {
            imported: "Imported {count} images from folder",
            ignored: "Ignored {count} non-image file(s)",
            sorting: "Sorting files by name..."
        },
    },
    zh: {
        title: "图片转 GIF 制作器",
        footer: "© {year} Plotlake. 本地处理，隐私优先。",
        status: {
            loading: "正如火如荼加载中...",
            ready: "准备就绪",
            failed: "FFmpeg 加载失败",
            processing: "处理中...",
            generating: "正在生成 {format}...",
            init: "初始化...",
            originalSize: "原始尺寸: {width}×{height}px",
        },
        steps: {
            select: "选择文件",
            configure: "配置参数",
            result: "生成结果",
        },
        dragDrop: {
            title: "拖放图片到这里",
            subtitle: "或点击选择文件",
            support: "支持 JPG, PNG, WebP",
            tip: "💡 试试上传 5-10 张截图，设置 500ms 延迟制作流畅动画",
        },
        dragDropVideo: {
            title: "拖放视频文件到这里",
            subtitle: "或点击选择",
            support: "支持 MP4、WebM、MOV、AVI、MKV，建议不超过 200MB",
            tip: "首次处理视频会加载 FFmpeg（约 30MB）",
        },
        settings: {
            dimensions: "尺寸设置",
            width: "宽度",
            height: "高度",
            auto: "自动",
            framerate: "帧率",
            delay: "帧延迟",
            delayUnit: "毫秒",
            delayAutoCalculated: "根据 FPS 自动计算，确保播放速度准确",
            quality: "画质",
            quickPresets: "快速预设",
            presetApplied: "已应用「{name}」预设",
            loop: "循环次数",
            loopInfinite: "无限循环",
            loopTimes: "次",
            dither: "抖动算法",
            palettesize: "调色板大小",
            crossfade: "淡入淡出过渡",
            crossfadeFrames: "过渡帧数",
            crossfadeHint: "优化循环播放时的过渡效果",
            fillColor: "填充颜色",
            fillBlack: "黑色",
            fillWhite: "白色",
            compression: "压缩级别",
            compressionNone: "无压缩（最佳质量）",
            compressionLight: "轻度（128色）",
            compressionMedium: "中度（128色，优化）",
            compressionHeavy: "重度（64色，最小体积）",
        },
        intentMode: {
            convert: "Convert format",
            convertCn: "转格式",
            platform: "Optimize for platform",
            platformCn: "平台适配",
            finetune: "Fine-tune",
            finetuneCn: "高级",
            desc: {
                convert: "选择格式，快速转换和导出。",
                platform: "选择平台，自动匹配最佳格式和参数。",
                finetune: "完全控制画质、大小和高级 GIF 选项。"
            },
            recommendedOutput: "推荐输出格式",
            changeFormat: "更改格式"
        },
        presets: {
            title: "预设",
            subtitle: "选择平台或画质预设，自动调整参数。",
            tab: {
                platform: "平台",
                quality: "画质"
            },
            guidance: {
                platform: "平台预设会自动选择最佳输出格式和参数。您可以在下方手动覆盖格式。",
                quality: "画质预设仅调整参数。如需更改输出格式，请在下方选择。"
            },
            platformApplied: "已应用「{name}」({format})",
            platform: {
                twitter: { resultDesc: "清晰 + 流畅播放" },
                discord: { resultDesc: "优化至大小限制" },
                slack: { resultDesc: "默认较小文件" },
                telegram: { resultDesc: "优先使用 WebP" },
                email: { resultDesc: "超小文件，循环 3 次" }
            },
            common: {
                social: { name: "社交媒体", desc: "2K 120ms 更顺滑" },
                highQuality: { name: "超高质量", desc: "4K 锐利顺滑" },
                tutorial: { name: "教程", desc: "2K 干净文字" },
                smallFile: { name: "小文件", desc: "HD 180ms 更省体积" }
            },
            video: {
                social: {
                    name: "社交媒体",
                    desc: "Twitter、Discord、TikTok"
                },
                highQuality: {
                    name: "高质量",
                    desc: "最佳细节，网站展示"
                },
                tutorial: {
                    name: "屏幕教程",
                    desc: "屏幕录制、演示"
                },
                smallFile: {
                    name: "小文件",
                    desc: "邮件、云存储"
                }
            }
        },
        hints: {
            dither: {
                bayer: "推荐用于照片和屏幕录制",
                floydSteinberg: "适合人像，肤色过渡平滑",
                sierra2: "通用场景选择",
                sierra2Lite: "较轻的抖动效果",
                none: "适合卡通和图表"
            },
            compression: {
                none: "最佳质量，文件较大（10-15MB）",
                light: "推荐！平衡质量和大小（4-8MB）",
                medium: "明显压缩，色彩损失可见（2-4MB）",
                heavy: "最大压缩，最小文件（1-2MB）"
            },
            loop: {
                infinite: "推荐用于社交媒体和动画",
                once: "适合教程和演示",
                thrice: "适合强调和吸引注意",
                default: "根据使用场景选择"
            }
        },
        warnings: {
            largeFiles: "文件总大小超过100MB，建议使用较低分辨率以提升性能。",
        },
        buttons: {
            generate: "生成 {format}",
            download: "下载 {format}",
            remove: "移除",
            clear: "清空全部",
        },
        preview: {
            placeholder: "生成的动图将显示在这里",
            size: "文件大小",
        },
        imageList: {
            count: "{count} 张图片",
            hint: "💡 拖拽图片调整播放顺序",
        },
        share: {
            title: "🎉 喜欢这个工具？分享给朋友！",
            twitter: "分享到 X",
            whatsapp: "WhatsApp",
            copyLink: "复制链接",
            copied: "已复制！",
        },
        feedback: {
            text: "反馈与建议",
        },
        donate: {
            text: "☕ 请我喝杯咖啡",
            thanks: "感谢您的支持！",
        },
        frameEditor: {
            title: "编辑帧",
            crop: "裁剪",
            rotate: "旋转",
            rotateLeft: "向左旋转",
            rotateRight: "向右旋转",
            applyCrop: "应用裁剪",
            applyRotation: "应用旋转",
            cancel: "取消",
            reset: "重置",
            prev: "上一帧",
            next: "下一帧",
        },
        video: {
            tabImages: "图片",
            tabVideo: "视频",
            dropTitle: "拖放视频文件到这里",
            dropSubtitle: "或点击选择文件",
            dropSupport: "支持 MP4, WebM, MOV, AVI, MKV",
            maxSize: "建议不超过 200MB",
            ffmpegNotice: "首次处理视频将加载 FFmpeg（约 30MB）",
            sizeWarning: "文件较大，处理可能较慢",
            analyzing: "正在分析视频...",
            duration: "时长",
            resolution: "分辨率",
            fileSize: "大小",
            format: "格式",
            timeRange: "时间范围",
            startTime: "开始",
            endTime: "结束",
            selectedDuration: "已选",
            fps: "帧率 (FPS)",
            fpsHint: "帧率越高，GIF 越流畅但文件越大",
            estimatedFrames: "预计: 约 {count} 帧",
            extracting: "正在提取帧...",
            extractingFrame: "正在提取第 {current}/{total} 帧...",
            cancel: "取消",
        },
        overlay: {
            title: "贴图",
            enable: "启用贴图",
            active: "已启用",
            upload: "上传图片",
            uploadHint: "推荐使用透明 PNG 图片",
            position: "位置",
            positions: {
                'top-left': "左上",
                'top-right': "右上",
                'bottom-left': "左下",
                'bottom-right': "右下",
                'center': "居中"
            },
            scale: "缩放",
            margin: "边距",
            opacity: "透明度",
            previewHint: "贴图将在生成时应用"
        },
        outputFormat: {
            label: "输出格式",
            labelOptional: "输出格式（可选）",
            platformHint: "平台预设可能会更改此项以匹配大小/兼容性要求。",
            overridden: "格式已手动覆盖。",
            gif: "GIF",
            webp: "WebP",
            apng: "APNG",
            gifDesc: "兼容性最好",
            webpDesc: "比 GIF 小约 60%",
            apngDesc: "无损，适合文字/UI",
            hint: {
                gif: "兼容性最好，最多 256 色",
                webp: "比 GIF 小约 60%，质量优秀，大部分浏览器支持",
                apng: "完整 PNG 质量，适合文字/UI，不支持 IE"
            }
        },
        mp4Hint: {
            text: "想要更小、更流畅的结果？",
            link: "试试图片转 MP4"
        },
        platforms: {
            title: "平台预设",
            twitter: { name: "X (Twitter)", desc: "高清，流畅播放" },
            discord: { name: "Discord", desc: "优化至 8MB 限制" },
            slack: { name: "Slack", desc: "优化至 5MB 限制" },
            telegram: { name: "Telegram", desc: "推荐使用 WebP" },
            email: { name: "邮件", desc: "2MB，循环 3 次" }
        },
        heic: {
            detected: "检测到 iPhone HEIC 照片 - 正在转换...",
            converting: "正在转换 HEIC 文件...",
            error: "此浏览器无法解码 HEIC。请使用 iOS Safari，或先转换为 JPG。",
            converted: "已将 {count} 个 HEIC 文件转换为 PNG",
            partialError: "部分 HEIC 文件转换失败"
        },
        folder: {
            imported: "已从文件夹导入 {count} 张图片",
            ignored: "已忽略 {count} 个非图片文件",
            sorting: "正在按文件名排序..."
        },
    },
};
