# ImageFactory

ImageFactory 是一个专注于图像处理流程的现代 Web 应用。本项目的首个功能 **Image2PDF** 提供简洁直观的在线转换体验，让用户能够将 PNG、JPG 等图片格式快速转换为同尺寸的高质量 PDF 文档，并支持预览与下载。

## 功能亮点

- 📤 **多图上传**：支持一次性上传多张 PNG/JPG 图片
- 🧮 **同尺寸转换**：自动保持每张图片的原始比例与尺寸
- 📐 **分辨率调节**：通过滑杆控制输出 PDF 的缩放比例
- 👀 **即时预览**：生成后提供在线 PDF 预览
- ⬇️ **一键下载**：快速获取转换后的 PDF 文件
- 🎨 **iOS 风格界面**：采用柔和的玻璃拟态设计，聚焦核心操作体验

## 技术栈

- [Next.js 14 (App Router)](https://nextjs.org/)
- [React 18](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [pdf-lib](https://pdf-lib.js.org/)

## 快速开始

> 请确保本地已安装 Node.js 18+。

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器访问 http://localhost:3000
```

## 项目结构

```
ImageFactory/
├── app/
│   ├── components/
│   │   └── ImageToPdfForm.tsx  # Image2PDF 主逻辑
│   ├── globals.css             # 全局样式 & Tailwind 引入
│   ├── layout.tsx              # 应用根布局
│   └── page.tsx                # 首页入口
├── public/                     # 静态资源（可选）
├── README.md
├── agent.md
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 后续规划

- ✍️ 自动化水印与批注功能
- 🎛️ 图片批量压缩与格式转换
- 🤝 第三方云端存储集成（如 S3、OSS）

## 许可证

MIT License
