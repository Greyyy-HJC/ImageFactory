# Agent Notes — ImageFactory

欢迎来到 ImageFactory 项目！此文档为协助智能体快速理解目标与约束的行动指南。

## 当前范围

- 首个模块 **Image2PDF** 已搭建：
  - 支持 PNG/JPG 多图上传。
  - 维持原始长宽比，允许按照 50%–200% 进行缩放后输出 PDF。
  - 提供生成后的在线预览与下载链接。
  - 采用 iOS 风格 UI（玻璃拟态、柔和阴影、圆角控件）。

## 技术约束

- 框架：Next.js 14（App Router）+ TypeScript。
- 样式：Tailwind CSS，自定义 iOS 风格工具类；谨慎新增全局样式。
- PDF 处理：使用 `pdf-lib` 客户端生成。
- 默认保持前端渲染；如需后端 API，请评估部署目标与安全策略。

## 开发约定

- 所有新功能需维持 iOS 风格体验：柔和色彩、圆角、拟物阴影、自然动效。
- 组件放置：UI 组件位于 `app/components/`，可根据需求建立子目录。
- 遵循严格 TypeScript 配置（`strict: true`）。如需放宽，请提供理由。
- 保持可访问性：为交互元素提供 `aria` 与可见标签。

## 待办方向

- ✅ Image2PDF MVP
- ⏳ 拟议功能：批量压缩、格式互转、云端存储、任务队列等。

祝你构建愉快！
