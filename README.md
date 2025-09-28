# ImageFactory

> 在线体验：[http://jinchen.space/ImageFactory/](http://jinchen.space/ImageFactory/)

ImageFactory 是一个面向创作者与设计师的图像工具集，采用 iOS 风格的玻璃拟态界面，提供多种常用的图片处理能力：格式转换、拼图、抠图、清晰度增强与风格化等。项目基于 Next.js 14 App Router 架构，所有能力均在浏览器端完成，保证即开即用。

## 功能亮点

### 🔄 Image2PDF
- 支持 PNG / JPG / PDF 混合上传，一次性合并为单个 PDF；
- 自定义分辨率比例、页面尺寸（保持原尺寸或套用 A4 横/竖版）；
- 限制目标文件大小，自动智能降采样；
- 在线预览与一键下载生成的 PDF。

### 🖼️ PhotoCollage
- 多图上传后自动对齐宽度，拼接为纵向长图；
- 拖拽重新排序，调整输出格式（PNG / JPG）与质量；
- 实时预览最终成品，支持下载。

### ✂️ Cutout
- 点击预览即可选取背景颜色进行抠图；
- 容差、羽化参数可调，快速获得透明背景素材；
- 输出 PNG（透明）或 WebP 格式。

### ✨ Stylization
- 内置黑白、素描、像素、卡通、国画等风格滤镜；
- 调节强度、像素块大小等参数，实时对比前后效果；
- 导出 PNG / JPG / WebP 风格化图片。

### 🔍 ImageResolution
- 维持尺寸的同时进行锐化、插值放大（1× / 1.5× / 2×）；
- 输出 PNG / JPG，适合社交媒体或打印场景。

## 技术栈

- [Next.js 14 (App Router)](https://nextjs.org/)
- [React 18](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [pdf-lib](https://pdf-lib.js.org/) 等浏览器原生 Canvas / Image API

## 快速开始

> 请确保本地已安装 Node.js 18+。

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
- `npm run lint`：运行 ESLint 检查。

## 项目结构

```
app/
├── components/                # 多个功能模块的 UI 与逻辑
│   ├── CutoutForm.tsx
│   ├── ImageResolutionForm.tsx
│   ├── ImageToPdfForm.tsx
│   ├── PhotoCollageForm.tsx
│   └── StylizationForm.tsx
├── cutout/page.tsx            # Cutout 页面
├── image2pdf/page.tsx         # Image2PDF 页面
├── imageresolution/page.tsx   # ImageResolution 页面
├── photocollage/page.tsx      # PhotoCollage 页面
├── stylization/page.tsx       # Stylization 页面
├── layout.tsx                 # 应用根布局（含导航）
├── page.tsx                   # 首页功能入口
└── globals.css                # Tailwind & 全局样式
```

## 部署到 GitHub Pages

GitHub Pages 仅托管静态资源。若直接启用 Pages 而未提供 `index.html`，GitHub 会回退展示仓库的 README。要在 Pages 上部署本应用，需要先进行静态导出并将导出结果上传至 Pages 指定目录或分支：

```bash
npm run build
npx next export -o out
```

然后将 `out/` 目录内容推送至 `gh-pages` 分支，或将仓库的 Pages 来源设置为 `docs/` 并把导出内容放入 `docs/`。

## 贡献

欢迎提交 Issue、Feature Request 或 PR 来扩展更多图像处理能力。

## 许可证

本项目以 [MIT License](./LICENSE) 开源。
