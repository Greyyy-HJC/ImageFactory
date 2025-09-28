
"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PDFDocument } from 'pdf-lib';

type UploadedItem =
  | {
      kind: 'image';
      file: File;
      previewUrl: string;
      dimensions: { width: number; height: number };
    }
  | {
      kind: 'pdf';
      file: File;
      previewUrl: string | null;
      pageCount: number;
    };

const iosPanelClass = 'rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_28px_60px_-30px_rgba(30,41,59,0.45)] backdrop-blur-xl';
const iosSubPanelClass = 'rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur';
const iosInputClass = 'w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40';
const iosButtonPrimary = 'inline-flex items-center justify-center rounded-full bg-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-[0_24px_40px_-20px_rgba(0,122,255,0.65)] transition hover:bg-[#0066d6] active:bg-[#0054ad] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/40 disabled:cursor-not-allowed disabled:bg-[#9CC8FF] disabled:shadow-none';
const iosButtonGhost = 'inline-flex items-center justify-center rounded-full border border-slate-200/80 bg-white/70 px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-[#007AFF]/60 hover:text-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/30 disabled:opacity-60';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const SIZE_LIMITS = [
  { label: '不限制', value: 0 },
  { label: '≤ 500 KB', value: 500 * 1024 },
  { label: '≤ 1 MB', value: 1024 * 1024 },
  { label: '≤ 2 MB', value: 2 * 1024 * 1024 },
  { label: '≤ 5 MB', value: 5 * 1024 * 1024 },
];
const PAGE_PRESETS = {
  source: { label: '保持原始尺寸', size: null as null },
  'a4-portrait': { label: 'A4 竖版', size: { width: 595.28, height: 841.89 } },
  'a4-landscape': { label: 'A4 横版', size: { width: 841.89, height: 595.28 } },
};
type PagePresetKey = keyof typeof PAGE_PRESETS;

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

async function readPdfMeta(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer);
  return {
    arrayBuffer,
    pageCount: doc.getPageCount(),
  };
}

export default function ImageToPdfForm() {
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [resolutionScale, setResolutionScale] = useState(1);
  const [sizeLimit, setSizeLimit] = useState<number>(SIZE_LIMITS[0].value);
  const [pagePreset, setPagePreset] = useState<PagePresetKey>('source');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generationNote, setGenerationNote] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setItems((current) => {
        current.forEach((item) => {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        });
        return [];
      });
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const accepted = Array.from(files).filter((file) => ACCEPTED_TYPES.includes(file.type));
    if (accepted.length === 0) {
      setError('请选择 PNG、JPG 或 PDF 文件。');
      return;
    }

    setError(null);

    const processed: UploadedItem[] = [];
    for (const file of accepted) {
      if (file.type === 'application/pdf') {
        try {
          const meta = await readPdfMeta(file);
          processed.push({
            kind: 'pdf',
            file,
            previewUrl: null,
            pageCount: meta.pageCount,
          });
        } catch (pdfError) {
          console.error(pdfError);
          setError('无法解析部分 PDF 文件，请确认格式是否正确。');
        }
      } else {
        const dims = await readImageDimensions(file);
        processed.push({
          kind: 'image',
          file,
          previewUrl: URL.createObjectURL(file),
          dimensions: dims,
        });
      }
    }

    setItems((previous) => {
      previous.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
      return processed;
    });
    setPdfUrl(null);
    setGenerationNote(null);
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

  const hasImages = useMemo(() => items.some((item) => item.kind === 'image'), [items]);

  const buildPdf = useCallback(
    async (scale: number): Promise<{ bytes: Uint8Array; usedScale: number }> => {
      const pdfDoc = await PDFDocument.create();

      for (const item of items) {
        if (item.kind === 'image') {
          const bytes = await item.file.arrayBuffer();
          const image =
            item.file.type === 'image/png'
              ? await pdfDoc.embedPng(bytes)
              : await pdfDoc.embedJpg(bytes);

          const dimensions = item.dimensions;
          const targetWidth = dimensions.width * scale;
          const targetHeight = dimensions.height * scale;

          const preset = PAGE_PRESETS[pagePreset].size;
          if (preset) {
            const page = pdfDoc.addPage([preset.width, preset.height]);
            const ratio = Math.min(preset.width / targetWidth, preset.height / targetHeight);
            const drawWidth = targetWidth * ratio;
            const drawHeight = targetHeight * ratio;
            const offsetX = (preset.width - drawWidth) / 2;
            const offsetY = (preset.height - drawHeight) / 2;
            page.drawImage(image, {
              x: offsetX,
              y: offsetY,
              width: drawWidth,
              height: drawHeight,
            });
          } else {
            const page = pdfDoc.addPage([targetWidth, targetHeight]);
            page.drawImage(image, {
              x: 0,
              y: 0,
              width: targetWidth,
              height: targetHeight,
            });
          }
        } else {
          const donorBytes = await item.file.arrayBuffer();
          const donorDoc = await PDFDocument.load(donorBytes);
          const indices = donorDoc.getPageIndices();
          const copiedPages = await pdfDoc.copyPages(donorDoc, indices);
          copiedPages.forEach((page) => pdfDoc.addPage(page));
        }
      }

      const bytes = await pdfDoc.save();
      return { bytes, usedScale: scale };
    },
    [items, pagePreset]
  );

  const generatePdf = useCallback(async () => {
    if (items.length === 0) {
      setError('请先上传至少一个文件。');
      return;
    }

    setIsConverting(true);
    setError(null);
    setGenerationNote(null);

    try {
      let currentScale = resolutionScale;
      let result = await buildPdf(currentScale);
      let attempts = 0;

      if (sizeLimit > 0 && result.bytes.length > sizeLimit && hasImages) {
        while (attempts < 6 && result.bytes.length > sizeLimit && currentScale > 0.25) {
          currentScale = Math.max(0.25, currentScale * 0.85);
          result = await buildPdf(currentScale);
          attempts += 1;
        }
      }

      if (sizeLimit > 0 && result.bytes.length > sizeLimit && !hasImages) {
        setGenerationNote('当前文件包含的 PDF 页面无法压缩，请尝试精简内容。');
      } else if (sizeLimit > 0 && result.bytes.length > sizeLimit) {
        setGenerationNote('已自动降低分辨率，但仍超过目标体积，请进一步压缩或拆分。');
      } else if (sizeLimit > 0 && result.bytes.length <= sizeLimit && currentScale !== resolutionScale) {
        setGenerationNote(`已自动调整分辨率至 ${(currentScale * 100).toFixed(0)}% 以满足体积限制。`);
      } else {
        setGenerationNote(`生成成功，文件大小约 ${(result.bytes.length / 1024).toFixed(1)} KB。`);
      }

      const arrayBuffer = result.bytes.buffer.slice(
        result.bytes.byteOffset,
        result.bytes.byteOffset + result.bytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(blob));
    } catch (conversionError) {
      console.error(conversionError);
      setError('转换过程中出现问题，请重试或尝试使用其他文件。');
    } finally {
      setIsConverting(false);
    }
  }, [buildPdf, hasImages, items.length, pdfUrl, resolutionScale, sizeLimit]);

  const reset = useCallback(() => {
    setItems((current) => {
      current.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
      return [];
    });
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setGenerationNote(null);
    setError(null);
  }, [pdfUrl]);

  return (
    <section className="space-y-8">
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
            <p className="text-lg font-medium text-slate-700">选择图片或 PDF 文件</p>
            <p className="text-sm text-slate-500">支持 PNG / JPG / PDF，可混合上传。</p>
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              multiple
              onChange={(event) => handleFiles(event.target.files)}
              className="hidden"
            />
          </label>
        </div>

        {items.length > 0 && (
          <div className={`${iosSubPanelClass} space-y-4`}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">已选择文件</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => (
                <figure
                  key={item.file.name}
                  className="flex items-center gap-4 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm"
                >
                  {item.kind === 'image' ? (
                    <img src={item.previewUrl ?? ''} alt={item.file.name} className="h-16 w-16 rounded-2xl object-cover shadow-md" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#007AFF]/10 text-sm font-semibold text-[#0A84FF]">
                      PDF
                    </div>
                  )}
                  <figcaption className="flex flex-1 flex-col gap-1 text-left text-sm text-slate-600">
                    <span className="truncate font-medium text-slate-700" title={item.file.name}>
                      {item.file.name}
                    </span>
                    <span>
                      {(item.file.size / 1024).toFixed(1)} KB · {item.kind === 'image' ? item.file.type.replace('image/', '').toUpperCase() : `${item.pageCount} 页 PDF`}
                    </span>
                    {item.kind === 'image' && (
                      <span className="text-xs text-slate-400">
                        {item.dimensions.width} × {item.dimensions.height} px
                      </span>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        <div className={`${iosSubPanelClass} space-y-4`}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">分辨率调整</label>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>保持长宽比</span>
                <span className="text-[#0A84FF] font-medium">{resolutionDescription}</span>
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
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">目标体积</label>
              <select
                className={iosInputClass}
                value={sizeLimit}
                onChange={(event) => setSizeLimit(Number(event.target.value))}
              >
                {SIZE_LIMITS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">若超出限制，将自动尝试降低分辨率。</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">页面尺寸</label>
              <select
                className={iosInputClass}
                value={pagePreset}
                onChange={(event) => setPagePreset(event.target.value as PagePresetKey)}
              >
                {Object.entries(PAGE_PRESETS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">保持原尺寸或统一到标准纸张大小。</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {generationNote && (
          <div className="rounded-2xl border border-[#0A84FF]/20 bg-[#F0F6FF]/80 px-4 py-3 text-sm text-[#0A2463]">
            {generationNote}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" className={iosButtonGhost} onClick={reset} disabled={isConverting}>
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
            <a href={pdfUrl} download="imagefactory-image2pdf.pdf" className={iosButtonPrimary}>
              下载 PDF
            </a>
          </div>
          <p className="mt-2 text-sm text-slate-500">预览为快速渲染，若出现模糊请直接下载查看最终效果。</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-[0_28px_60px_-30px_rgba(30,41,59,0.45)]">
            <iframe title="生成的 PDF 预览" src={pdfUrl} className="h-[600px] w-full" />
          </div>
        </div>
      )}
    </section>
  );
}
