import FeynDiagramForm from "../components/FeynDiagramForm";

export default function FeynDiagramPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#0A84FF]">
          FeynDiagram
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">费曼图示例库</h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          浏览经典散射或衰变过程的树级费曼图，随时下载高质量 PDF 用于教学或讨论。
        </p>
      </div>
      <FeynDiagramForm />
    </div>
  );
}
