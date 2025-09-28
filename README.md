# ImageFactory

> 在线体验：[http://jinchen.space/ImageFactory/](http://jinchen.space/ImageFactory/)

ImageFactory 是一组面向创作者的浏览器端图像工具。它采用 iOS 风格的玻璃拟态界面，聚焦“即开即用”的体验，帮助你在无需安装任何软件的情况下完成常见的图像转换、增强与可视化任务。

## 功能亮点

### 🔄 Image2PDF
- 支持 PNG / JPG / PDF 混合上传，一次合并为单个 PDF；
- 自定义分辨率比例、页面尺寸（保持原尺寸或套用 A4 横/竖版）；
- 限制目标文件体积时自动降采样；
- 提供在线预览与 PDF 下载。

### 🖼️ PhotoCollage
- 多图上传后自动统一宽度，拼接成纵向长图；
- 拖拽重新排序，选择 PNG / JPG 输出与压缩质量；
- 提供下载前预览。

### ✂️ Cutout
- 点击预览即可选取背景颜色进行抠图；
- 可调节容差与羽化逐步优化边缘；
- 导出透明 PNG 或 WebP。

### ✨ Stylization
- 内置黑白、素描、像素、卡通、国画等示例滤镜；
- 调整强度参数，并对比原图与处理后结果；
- 支持 PNG / JPG / WebP 下载。

### 🔍 ImageResolution
- 在保持尺寸的同时进行锐化或 1×/1.5×/2× 插值放大；
- 输出 PNG / JPG，适合社交媒体或打印场景。

### 📈 FeynDiagram
- 提供常见 QED/Higgs 过程的树级费曼图示例；
- 每张图可一键导出 PDF，便于教学或讲义使用。

## 技术栈

- [Next.js 14 (App Router)](https://nextjs.org/)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [pdf-lib](https://pdf-lib.js.org/) 等浏览器端 Canvas / Image API

## 快速开始

> 需要 Node.js 18 或更高版本。

```bash
# 安装依赖
npm install

# 启动开发环境
npm run dev

# 在浏览器访问
http://localhost:3000
```

## 可用脚本

- `npm run dev`：启动开发服务器；
- `npm run build`：生成生产构建；
- `npm run start`：以生产模式启动 Next.js；
- `npm run lint`：执行 ESLint 检查。

## 项目结构

```
app/
├── components/                # 各功能模块的 UI 与逻辑
│   ├── CutoutForm.tsx
│   ├── FeynDiagramForm.tsx
│   ├── ImageResolutionForm.tsx
│   ├── ImageToPdfForm.tsx
│   ├── PhotoCollageForm.tsx
│   └── StylizationForm.tsx
├── cutout/page.tsx
├── feyndiagram/page.tsx
├── image2pdf/page.tsx
├── imageresolution/page.tsx
├── photocollage/page.tsx
├── stylization/page.tsx
├── layout.tsx
├── page.tsx
└── globals.css
```

## 贡献

欢迎通过 Issue / PR 提出更多图像处理需求，或扩展自动拓扑生成、批量导出等高级功能。

## 许可证

本项目以 [MIT License](./LICENSE) 开源。
