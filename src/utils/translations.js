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
        presets: {
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
            generate: "Generate GIF",
            download: "Download GIF",
            remove: "Remove",
            clear: "Clear All",
        },
        preview: {
            placeholder: "Generated GIF will appear here",
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
    },
    zh: {
        title: "图片转 GIF 制作器",
        footer: "© {year} Plotlake. 本地处理，隐私优先。",
        status: {
            loading: "正如火如荼加载中...",
            ready: "准备就绪",
            failed: "FFmpeg 加载失败",
            processing: "处理中...",
            generating: "正在生成 GIF...",
            init: "初始化...",
            originalSize: "原始尺寸: {width}×{height}px",
        },
        steps: {
            select: "选择图片",
            configure: "配置参数",
            result: "生成结果",
        },
        dragDrop: {
            title: "拖放图片到这里",
            subtitle: "或点击选择文件",
            support: "支持 JPG, PNG, WebP",
            tip: "💡 试试上传 5-10 张截图，设置 500ms 延迟制作流畅动画",
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
        presets: {
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
            generate: "生成 GIF",
            download: "下载 GIF",
            remove: "移除",
            clear: "清空全部",
        },
        preview: {
            placeholder: "生成的 GIF 将显示在这里",
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
    },
};


