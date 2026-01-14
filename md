# PRD: Universal Image-to-GIF Converter Web App

## 1. 产品概述
### 1.1 产品名称
Universal GIF Maker

### 1.2 产品描述
Universal GIF Maker 是一个纯前端Web应用，使用ffmpeg.wasm（FFmpeg的WebAssembly版本）在浏览器内将多张图片转换为高质量动画GIF。产品支持泛化处理任意数量/格式的图片序列，支持ffmpeg.wasm的所有高级参数配置（如滤镜、缩放、抖动、填充等），以实现专业级自定义。界面简洁亲切，小白用户可快速上手（拖拽上传 + 一键生成），高级用户可通过参数面板深度定制。

基于用户示例（8张分辨率不一致的JPG转GIF，每帧延迟500ms），产品泛化支持类似场景：自动统一尺寸（缩放+填充）、优化颜色（palettegen + paletteuse）、自定义延迟/帧率等。目标是提供一个免费、无水印、隐私安全的工具，避免服务器上传。

### 1.3 产品目标
- 解决图片转GIF的痛点：高质量输出（无色带、锐利细节）、浏览器即时处理、参数灵活性。
- 目标用户：小白用户（快速生成）、开发者/设计师（高级自定义，如dithering/scale）。
- MVP目标：核心转换功能稳定，扩展性强（未来加视频输入/编辑）。
- KPI：生成时间<1min（中等文件），文件大小优化20-50%（通过参数）。

### 1.4 版本与范围
- MVP版本：纯前端，基于React + ffmpeg.wasm。
- 范围：图片输入 → 参数配置 → GIF生成/预览/下载。不包括增值如文字叠加/过渡效果（未来迭代）。

## 2. 目标用户与场景
### 2.1 用户画像
- 小白用户：内容创作者、社交媒体用户，需要简单将图片序列（如截图/照片）转GIF分享（e.g., 示例8张JPG）。
- 高级用户：开发者/设计师，需要自定义参数（如Bayer dither、lanczos缩放）以匹配专业需求。
- 场景：浏览器内快速转换，无需安装软件；隐私敏感场景（文件不离本地）。

### 2.2 用户痛点与解决方案
- 痛点：在线工具需上传服务器（隐私风险）、参数有限（无法自定义dither/fps）、质量低（色带/模糊）。
- 解决方案：纯前端ffmpeg.wasm，支持全参数；自动优化（如统一尺寸pad填充）；简洁UI隐藏复杂性。

## 3. 功能要求
基于ffmpeg.wasm能力边界（调研详见附录），MVP功能聚焦核心转换，支持所有高级参数暴露。

### 3.1 核心功能
1. **图片上传与管理**
   - 支持拖拽/文件选择多张图片（JPG, PNG, WebP等，ffmpeg.wasm支持的输入格式）。
   - 自动排序（文件名/上传顺序），支持手动拖拽重排/删除。
   - 预览：缩略图列表 + 实时序列预览（canvas模拟动画）。

2. **参数配置**
   - **基本参数**（小白友好，默认值）：
     - 延迟（ms，每帧全局，范围10-1000，默认500；等效-framerate 1000/delay）。
     - 循环（无限/有限次数，默认无限；-loop 0/-1）。
     - 输出尺寸（自动统一到最大/自定义宽度:高度；-vf scale=w:h:force_original_aspect_ratio=decrease）。
     - 填充颜色（黑/白/透明；-vf pad=w:h:x:y:color）。
   - **高级参数**（折叠面板，文本输入ffmpeg命令片段）：
     - 滤镜链（-vf）：支持scale, pad, fps, crop, flip, hue等所有ffmpeg.wasm滤镜。
     - 复杂滤镜（-filter_complex）：支持split, overlay, paletteuse等。
     - 调色板优化（默认启用palettegen + paletteuse；参数如stats_mode=full, max_colors=256）。
     - 抖动（dither）：bayer/sierra/floyd_steinberg等；scale=1-5, diff_mode=rectangle。
     - 其他：-r fps, -c:v gif, -pix_fmt rgb24等。
     - 输入框：用户可直接输入自定义ffmpeg args（如"-vf fps=10,scale=320:-1:flags=lanczos"），app拼接成完整命令。
   - 默认配置：基于示例，统一尺寸4000:2666（平衡质量/大小），白边填充，Bayer dither scale=4。

3. **生成与输出**
   - 一键生成：运行ffmpeg.wasm命令（两步：palettegen → paletteuse）。
   - 进度条：显示wasm加载/处理进度。
   - 预览：生成后<img>显示GIF。
   - 下载：blob URL下载（文件名自定义）。

4. **错误处理与反馈**
   - 验证：图片<100MB总和，无效格式警告。
   - 提示：内存不足/参数错误显示友好消息（如“尝试降低分辨率”）。

### 3.2 非功能要求
- 性能：中等8张4K图片生成<1min（wasm多线程优化）。
- 兼容：Chrome/Firefox/Edge（Safari需测试SharedArrayBuffer）。
- 安全：纯本地处理，无数据泄露。
- 国际化：英文/中文UI（默认英文）。

## 4. 技术要求
### 4.1 前端技术栈
- 框架：React + Vite（快速构建）。
- 核心：@ffmpeg/ffmpeg（wasm版FFmpeg，支持所有调研参数）。
- UI：Tailwind CSS（简洁亲切）。
- 文件API：File/Blob/URL.createObjectURL（预览/输入）。

### 4.2 ffmpeg.wasm能力边界（调研总结）
- **支持参数**：与FFmpeg 4.x+类似，包括：
  - 输入/输出：-i, -f gif, -c:v gif。
  - 帧率/延迟：-framerate/-r (fps=1000/ms)。
  - 滤镜(-vf)：scale (flags=lanczos/bicubic等), pad (color=black/white), fps, crop, vflip, hue, split等461+滤镜。
  - 复杂滤镜(-filter_complex)：paletteuse (dither=bayer/sierra/floyd_steinberg/heckbert/atkinson, bayer_scale=1-5, diff_mode=rectangle/square), overlay等。
  - 调色板：palettegen (stats_mode=full/single/diff, max_colors=256, reserve_transparent=off/on)。
  - 其他：-loop 0/-1, -pix_fmt rgb24/yuv420p, -t时长（但图片序列无时长）。
- **支持codecs/格式**：
  - 输入：JPG, PNG, WebP, BMP等图像；MP4, WebM, MKV等视频（但MVP限图片）。
  - 输出：GIF (libgif), MP4 (H264/H265), WebM (VP8/VP9), OGG等。
  - 音频：MP3, AAC, Vorbis, Opus, FLAC（但GIF无音频）。
- **限制**：
  - 内存：浏览器限2-4GB，大文件(>100MB总)慢/崩溃；建议自动resize。
  - 性能：单线程慢，多线程需SharedArrayBuffer（需HTTPS + COOP/COEP头）。
  - 浏览器：Firefox无H.264需WebM；Safari需测试。
  - wasm加载：首次30MB下载，2-5s。
  - 不支持：pip install额外库、网络访问（纯本地）。
- **GIF生成最佳实践**：两步（palettegen → paletteuse）；示例命令如调研中（fps, scale, pad, dither）。

### 4.3 开发与测试
- 开发：MVP 1-2周（调研已完成）。
- 测试：你的8张JPG case（不同尺寸、延迟500ms）；大文件/多帧场景。
- 部署：Netlify/Github Pages（免费静态）。

## 5. UI/UX设计（Figma Make模式建议）
### 5.1 整体风格
- 简洁亲切：白色背景，蓝色按钮，圆角；字体Sans-serif。
- 响应式：手机/桌面适配。

### 5.2 页面布局（单页App）
- 顶部：Logo + 标题“Universal GIF Maker”。
- 中间：上传区（拖拽框 + 按钮）。
- 下面：图片列表（缩略图 + 拖拽排序）。
- 参数区：基本（延迟输入 + 滑块）；高级（折叠accordion，文本输入ffmpeg args）。
- 底部：生成按钮 + 进度条。
- 生成后：预览区（GIF img） + 下载按钮。

### 5.3 Figma Make实现建议
- 使用FigJam创建PRD板：左侧功能列表，右侧Wireframe。
- Wireframe：矩形上传框、输入框、按钮；箭头表示流程（上传 → 配置 → 生成）。
- 颜色：主蓝#007BFF，灰#F0F0F0。
- 交互：添加原型链接（点击生成跳转预览）。

## 附录: ffmpeg.wasm调研原始数据
- 来源：GitHub README, 博客示例（e.g., medium, fireship.io, stackoverflow）。
- 完整参数列表：参考FFmpeg官方docs（ffmpeg.org/ffmpeg-filters.html, ffmpeg.org/ffmpeg-codecs.html），wasm支持95%+（除网络/硬件特定）。
- 示例命令（GIF）：ffmpeg.run('-framerate', fps, '-i', 'frame%03d.jpg', '-vf', 'scale=4000:2666:...', '-filter_complex', 'paletteuse=dither=bayer...')。
- 边界：不支持实时流/外部设备；内存FS限1GB。