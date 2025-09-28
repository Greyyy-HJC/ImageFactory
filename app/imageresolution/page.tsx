
import ImageResolutionForm from '../components/ImageResolutionForm';

export default function ImageResolutionPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#0A84FF]">
          ImageResolution
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">提升图片清晰度</h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          一键锐化细节或尝试超分辨率放大，保持 iOS 风格的高雅体验。
        </p>
      </div>
      <ImageResolutionForm />
    </div>
  );
}
