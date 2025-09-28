
import CutoutForm from '../components/CutoutForm';

export default function CutoutPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#0A84FF]">
          Cutout
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">智能抠图</h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          快速选取背景颜色并移除，自动生成透明背景的主体图，可导出 PNG 或 WebP。
        </p>
      </div>
      <CutoutForm />
    </div>
  );
}
