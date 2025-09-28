
import Link from 'next/link';

const featureCards = [
  {
    title: 'Image2PDF',
    description: '将多张图片或 PDF 转换为统一格式的 PDF 文件，支持分辨率与体积控制。',
    href: '/image2pdf',
    accent: 'PDF'
  },
  {
    title: 'PhotoCollage',
    description: '把多张照片拼接成一张纵向长图，自定义顺序，并选择输出格式。',
    href: '/photocollage',
    accent: '拼接'
  },
  {
    title: 'ImageResolution',
    description: '在保持尺寸的情况下优化清晰度，支持锐化与简单的超分辨率。',
    href: '/imageresolution',
    accent: '增强'
  },
  {
    title: 'Cutout',
    description: '快速抠出主体并生成透明背景贴图，适合商品图或头像处理。',
    href: '/cutout',
    accent: '抠图'
  },
  {
    title: 'Stylization',
    description: '为图片添加黑白、素描、像素、卡通、国画等风格效果。',
    href: '/stylization',
    accent: '风格'
  },
  {
    title: 'FeynDiagram',
    description: '根据示例散射过程查看树级费曼图并导出 PDF。',
    href: '/feyndiagram',
    accent: '费曼图'
  },
]

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 shadow-sm">
          ImageFactory Suite
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
          让图像处理更优雅
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
          ImageFactory 提供一系列现代化的在线工具，帮助你完成转换、拼图、清晰度优化等任务，界面灵动、操作简洁。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/image2pdf"
            className="inline-flex items-center gap-2 rounded-full bg-[#007AFF] px-6 py-3 text-sm font-semibold text-white shadow-[0_24px_40px_-20px_rgba(0,122,255,0.65)] transition hover:bg-[#0066d6]"
          >
            立即进入 Image2PDF
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {featureCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="flex h-full flex-col rounded-3xl border border-white/60 bg-white/80 p-7 shadow-[0_28px_60px_-30px_rgba(30,41,59,0.45)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_30px_65px_-28px_rgba(30,41,59,0.45)]"
          >
            <span className="inline-flex w-fit items-center rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#0A84FF]">
              {card.accent}
            </span>
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm text-slate-600">{card.description}</p>
            <span className="mt-auto text-sm font-semibold text-[#007AFF]">进入功能 →</span>
          </Link>
        ))}
      </section>

      <section className="flex justify-center">
        <a
          href="https://jinchen.space"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-col items-start gap-2 rounded-3xl border border-white/60 bg-white/80 px-8 py-6 shadow-[0_24px_50px_-25px_rgba(30,41,59,0.6)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_34px_70px_-28px_rgba(30,41,59,0.55)]"
        >
          <span className="rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#0A84FF]">
            About Author
          </span>
          <p className="text-lg font-semibold text-slate-900">了解项目作者</p>
          <p className="max-w-md text-sm text-slate-600">
            ImageFactory 由 Jinchen 构建与维护。点击进入个人主页，查看更多项目与技术分享。
          </p>
        </a>
      </section>
    </div>
  );
}
