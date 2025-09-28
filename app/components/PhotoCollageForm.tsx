
"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

interface CollageImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

const iosPanelClass = 'rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_28px_60px_-30px_rgba(30,41,59,0.45)] backdrop-blur-xl';
const iosSubPanelClass = 'rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur';
const iosInputClass = 'w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40';
const iosButtonPrimary = 'inline-flex items-center justify-center rounded-full bg-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-[0_24px_40px_-20px_rgba(0,122,255,0.65)] transition hover:bg-[#0066d6] active:bg-[#0054ad] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/40 disabled:cursor-not-allowed disabled:bg-[#9CC8FF] disabled:shadow-none';
const iosButtonGhost = 'inline-flex items-center justify-center rounded-full border border-slate-200/80 bg-white/70 px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-[#007AFF]/60 hover:text-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/30 disabled:opacity-60';

async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function PhotoCollageForm() {
  const [images, setImages] = useState<CollageImage[]>([]);
  const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [jpegQuality, setJpegQuality] = useState(0.9);
  const [collageUrl, setCollageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [images]);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter((file) => ACCEPTED_IMAGE_TYPES.includes(file.type));
    if (files.length === 0) {
      setError('请上传 PNG 或 JPG 图片。');
      return;
    }

    setError(null);

    const processed = await Promise.all(
      files.map(async (file) => {
        const dims = await readImageDimensions(file);
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          width: dims.width,
          height: dims.height,
        } satisfies CollageImage;
      })
    );

    setImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return processed;
    });
    setCollageUrl(null);
  }, []);

  const onDragStart = useCallback((index: number) => () => {
    setDraggingIndex(index);
  }, []);

  const onDragOver = useCallback(
    (overIndex: number) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (draggingIndex === null || draggingIndex === overIndex) return;
      setImages((prev) => {
        const updated = [...prev];
        const [moved] = updated.splice(draggingIndex, 1);
        updated.splice(overIndex, 0, moved);
        return updated;
      });
      setDraggingIndex(overIndex);
    },
    [draggingIndex]
  );

  const onDragEnd = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  const collagePreviewInfo = useMemo(() => {
    if (images.length === 0) return null;
    const baseWidth = Math.max(...images.map((img) => img.width));
    const totalHeight = images.reduce((sum, img) => sum + Math.round((baseWidth * img.height) / img.width), 0);
    return { baseWidth, totalHeight };
  }, [images]);

  const generateCollage = useCallback(async () => {
    if (images.length === 0) {
      setError('请先上传至少一张图片。');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const baseWidth = Math.max(...images.map((img) => img.width));
      const canvas = document.createElement('canvas');
      const scaledHeights: number[] = [];

      for (const image of images) {
        const scaledHeight = Math.round((baseWidth * image.height) / image.width);
        scaledHeights.push(scaledHeight);
      }

      const totalHeight = scaledHeights.reduce((sum, h) => sum + h, 0);
      canvas.width = baseWidth;
      canvas.height = totalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('未能创建绘图上下文。');
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let currentY = 0;
      for (let index = 0; index < images.length; index += 1) {
        const image = images[index];
        const scaledHeight = scaledHeights[index];
        const bitmap = await createImageBitmap(image.file);
        ctx.drawImage(bitmap, 0, currentY, baseWidth, scaledHeight);
        currentY += scaledHeight;
      }

      const dataUrl = canvas.toDataURL(outputFormat, outputFormat === 'image/png' ? undefined : jpegQuality);
      setCollageUrl(dataUrl);
    } catch (collageError) {
      console.error(collageError);
      setError('拼接过程中出现问题，请重试。');
    } finally {
      setIsProcessing(false);
    }
  }, [images, jpegQuality, outputFormat]);

  const reset = useCallback(() => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages([]);
    setCollageUrl(null);
    setError(null);
  }, [images]);

  return (
    <section className="space-y-8">
      <div className={`${iosPanelClass} space-y-6`}>
        <div className="space-y-2">
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFiles(event.dataTransfer.files);
            }}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center transition hover:border-[#007AFF]/40 hover:bg-[#F3F6FF]"
          >
            <span className="rounded-full bg-[#007AFF]/10 px-4 py-1 text-xs font-medium text-[#0A84FF]">
              拖拽或点击上传
            </span>
            <p className="text-lg font-medium text-slate-700">选择照片</p>
            <p className="text-sm text-slate-500">上传 PNG 或 JPG 图片，系统会自动统一宽度。</p>
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
        </div>

        {images.length > 0 && (
          <div className={`${iosSubPanelClass} space-y-4`}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">图片顺序</h2>
              <p className="text-xs text-slate-500">拖拽卡片可调整位置</p>
            </div>
            <div className="space-y-3">
              {images.map((image, index) => (
                <div
                  key={image.file.name}
                  draggable
                  onDragStart={onDragStart(index)}
                  onDragOver={onDragOver(index)}
                  onDragEnd={onDragEnd}
                  className={`flex cursor-grab items-center gap-4 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm transition ${
                    draggingIndex === index ? 'ring-2 ring-[#0A84FF]/60' : ''
                  }`}
                >
                  <img src={image.previewUrl} alt={image.file.name} className="h-14 w-14 rounded-2xl object-cover shadow-md" />
                  <div className="flex flex-1 flex-col text-sm text-slate-600">
                    <span className="truncate font-medium text-slate-700" title={image.file.name}>
                      {image.file.name}
                    </span>
                    <span>
                      {image.width} × {image.height} px · {(image.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-400">拖动</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`${iosSubPanelClass} space-y-4`}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">输出格式</label>
              <select
                className={iosInputClass}
                value={outputFormat}
                onChange={(event) => setOutputFormat(event.target.value as 'image/png' | 'image/jpeg')}
              >
                <option value="image/png">PNG（无损）</option>
                <option value="image/jpeg">JPG（可调质量）</option>
              </select>
            </div>
            {outputFormat === 'image/jpeg' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">JPG 质量 ({Math.round(jpegQuality * 100)}%)</label>
                <input
                  type="range"
                  min={0.4}
                  max={1}
                  step={0.05}
                  value={jpegQuality}
                  onChange={(event) => setJpegQuality(Number(event.target.value))}
                  className="w-full accent-[#007AFF]"
                />
              </div>
            )}
          </div>

          {collagePreviewInfo && (
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-xs text-slate-500">
              预计尺寸：宽 {collagePreviewInfo.baseWidth}px · 高 {collagePreviewInfo.totalHeight}px
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" className={iosButtonGhost} onClick={reset} disabled={isProcessing || images.length === 0}>
            清空
          </button>
          <button type="button" className={iosButtonPrimary} onClick={generateCollage} disabled={isProcessing || images.length === 0}>
            {isProcessing ? '生成中…' : '生成长图'}
          </button>
        </div>
      </div>

      {collageUrl && (
        <div className={iosPanelClass}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">拼接结果预览</h2>
            <a href={collageUrl} download={`photocollage.${outputFormat === 'image/png' ? 'png' : 'jpg'}`} className={iosButtonPrimary}>
              下载拼图
            </a>
          </div>
          <p className="mt-2 text-sm text-slate-500">如长图过高，请在下载后使用系统相册或图片查看器查看完整效果。</p>
          <div className="mt-6 max-h-[600px] overflow-auto rounded-2xl border border-white/60 bg-white/70 p-4">
            <img src={collageUrl} alt="拼图结果预览" className="mx-auto w-full" />
          </div>
        </div>
      )}
    </section>
  );
}
