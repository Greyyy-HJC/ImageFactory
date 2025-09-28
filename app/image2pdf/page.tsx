
import ImageToPdfForm from '../components/ImageToPdfForm';

export default function Image2PdfPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#007AFF]/10 px-3 py-1 text-xs font-semibold text-[#0A84FF]">
          Image2PDF
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">图片与 PDF 一键整合</h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          上传 PNG、JPG 或现有 PDF，控制分辨率与体积，生成符合需求的最终文档。
        </p>
      </div>
      <ImageToPdfForm />
    </div>
  );
}
