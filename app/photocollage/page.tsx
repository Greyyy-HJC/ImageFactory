
import PhotoCollageForm from '../components/PhotoCollageForm';

export default function PhotoCollagePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#0A84FF]">
          PhotoCollage
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">拼贴你的照片故事</h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          自动对齐宽度、保持高清品质，随心排列多张图片，生成流畅的纵向长图。
        </p>
      </div>
      <PhotoCollageForm />
    </div>
  );
}
