
import StylizationForm from '../components/StylizationForm';

export default function StylizationPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#0A84FF]">
          Stylization
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">图像风格化</h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          选择黑白、素描、像素、卡通、国画等风格，调整强度后导出高质量图片。
        </p>
      </div>
      <StylizationForm />
    </div>
  );
}
