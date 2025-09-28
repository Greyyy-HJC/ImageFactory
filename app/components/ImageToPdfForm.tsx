'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PDFDocument } from 'pdf-lib';

type UploadedImage = {
  file: File;
  previewUrl: string;
  dimensions?: {
    width: number;
    height: number;
  };
};

const iosPanelClass = 'rounded-3xl border border-white/60 bg-white/80 p-8 shadow-ios-card backdrop-blur-xl';
const iosSubPanelClass = 'rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur';
const iosInputClass = 'w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40';
const iosButtonPrimary = 'inline-flex items-center justify-center rounded-full bg-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-[0_24px_40px_-20px_rgba(0,122,255,0.65)] transition hover:bg-[#0066d6] active:bg-[#0054ad] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/40 disabled:cursor-not-allowed disabled:bg-[#9CC8FF] disabled:shadow-none';
const iosButtonGhost = 'inline-flex items-center justify-center rounded-full border border-slate-200/80 bg-white/70 px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-[#007AFF]/60 hover:text-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/30 disabled:opacity-60';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function ImageToPdfForm() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [resolutionScale, setResolutionScale] = useState(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setImages((current) => {
        current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return [];
      });
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const validFiles = Array.from(files).filter((file) => ACCEPTED_TYPES.includes(file.type));

    if (validFiles.length === 0) {
      setError('请选择 PNG 或 JPG 图片。');
      return;
    }

    setError(null);

    const uploaded: UploadedImage[] = await Promise.all(
      validFiles.map(async (file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        dimensions: await readImageDimensions(file),
      }))
    );

    setImages((previous) => {
      previous.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return uploaded;
    });
    setPdfUrl(null);
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      await handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const resolutionDescription = useMemo(() => {
    if (resolutionScale === 1) return '原始尺寸 (100%)';
    if (resolutionScale > 1) return `放大 ${(resolutionScale * 100).toFixed(0)}%`;
    return `缩小 ${(resolutionScale * 100).toFixed(0)}%`;
  }, [resolutionScale]);

  const generatePdf = useCallback(async () => {
    if (images.length === 0) {
      setError('请先上传至少一张图片。');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const image of images) {
        const bytes = await image.file.arrayBuffer();
        const extension = image.file.type;

        let embedded;
        if (extension === 'image/png') {
          embedded = await pdfDoc.embedPng(bytes);
        } else if (extension === 'image/jpeg' || extension === 'image/jpg') {
          embedded = await pdfDoc.embedJpg(bytes);
        } else {
          throw new Error('Unsupported image format.');
        }

        const dimensions = image.dimensions ?? {
          width: embedded.width,
          height: embedded.height,
        };

        const scaledWidth = dimensions.width * resolutionScale;
        const scaledHeight = dimensions.height * resolutionScale;

        const page = pdfDoc.addPage([scaledWidth, scaledHeight]);
        page.drawImage(embedded, {
          x: 0,
          y: 0,
          width: scaledWidth,
          height: scaledHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const arrayBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      setPdfUrl(URL.createObjectURL(blob));
    } catch (conversionError) {
      console.error(conversionError);
      setError('转换过程中出现问题，请重试或尝试使用其他图片。');
    } finally {
      setIsConverting(false);
    }
  }, [images, pdfUrl, resolutionScale]);

  const reset = useCallback(() => {
    setImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setError(null);
  }, [pdfUrl]);

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <header className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">Image2PDF 工具</h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          上传 PNG 或 JPG 图片，调整尺寸比例，快速生成高质量 PDF 文档。
        </p>
      </header>

      <div className={`${iosPanelClass} space-y-6`}>
        <div className="space-y-2">
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center transition hover:border-[#007AFF]/40 hover:bg-[#F3F6FF]"
          >
            <span className="rounded-full bg-[#007AFF]/10 px-4 py-1 text-xs font-medium text-[#0A84FF]">
              拖拽或点击上传
            </span>
            <p className="text-lg font-medium text-slate-700">选择图片文件</p>
            <p className="text-sm text-slate-500">支持 PNG、JPG，单张或多张均可。</p>
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              multiple
              onChange={(event) => handleFiles(event.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {images.length > 0 && (
          <div className={iosSubPanelClass}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">已选择图片</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {images.map((image) => (
                <figure
                  key={image.file.name}
                  className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm"
                >
                  <img
                    src={image.previewUrl}
                    alt={image.file.name}
                    className="h-16 w-16 rounded-2xl object-cover shadow-md"
                  />
                  <figcaption className="flex flex-1 flex-col gap-1 text-left text-sm text-slate-600">
                    <span className="truncate font-medium text-slate-700" title={image.file.name}>
                      {image.file.name}
                    </span>
                    <span>
                      {(image.file.size / 1024).toFixed(1)} KB · {image.file.type.replace('image/', '').toUpperCase()}
                    </span>
                    {image.dimensions && (
                      <span className="text-xs text-slate-400">
                        {image.dimensions.width} × {image.dimensions.height} px
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        <div className={`${iosSubPanelClass} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">分辨率调整</p>
              <p className="text-xs text-slate-500">保持图片比例不变，通过缩放控制 PDF 输出尺寸。</p>
            </div>
            <div className="text-sm font-medium text-[#0A84FF]">{resolutionDescription}</div>
          </div>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={resolutionScale}
            onChange={(event) => setResolutionScale(Number(event.target.value))}
            className="w-full accent-[#007AFF]"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" className={iosButtonGhost} onClick={reset} disabled={isConverting && images.length === 0}>
            清空
          </button>
          <button type="button" className={iosButtonPrimary} onClick={generatePdf} disabled={isConverting}>
            {isConverting ? '转换中…' : '生成 PDF'}
          </button>
        </div>
      </div>

      {pdfUrl && (
        <div className={iosPanelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">预览 & 下载</h2>
            <a href={pdfUrl} download="image2pdf.pdf" className={iosButtonPrimary}>
              下载 PDF
            </a>
          </div>
          <p className="mt-2 text-sm text-slate-500">下方预览可能略有压缩，建议下载后查看最终质量。</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-ios-card">
            <iframe title="生成的 PDF 预览" src={pdfUrl} className="h-[600px] w-full" />
          </div>
        </div>
      )}
    </section>
  );
}
