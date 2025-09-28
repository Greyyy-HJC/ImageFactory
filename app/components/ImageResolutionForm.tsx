
"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

interface ResolutionImage {
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

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function applySharpen(imageData: ImageData, intensity: number): ImageData {
  if (intensity <= 0) {
    return imageData;
  }

  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const kernelSize = 3;
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const originalR = data[index];
      const originalG = data[index + 1];
      const originalB = data[index + 2];
      const alpha = data[index + 3];

      let accR = 0;
      let accG = 0;
      let accB = 0;

      for (let ky = -half; ky <= half; ky += 1) {
        for (let kx = -half; kx <= half; kx += 1) {
          const sampleX = Math.min(width - 1, Math.max(0, x + kx));
          const sampleY = Math.min(height - 1, Math.max(0, y + ky));
          const sampleIndex = (sampleY * width + sampleX) * 4;
          const weight = kernel[(ky + half) * kernelSize + (kx + half)];

          accR += data[sampleIndex] * weight;
          accG += data[sampleIndex + 1] * weight;
          accB += data[sampleIndex + 2] * weight;
        }
      }

      output[index] = clamp(originalR * (1 - intensity) + accR * intensity);
      output[index + 1] = clamp(originalG * (1 - intensity) + accG * intensity);
      output[index + 2] = clamp(originalB * (1 - intensity) + accB * intensity);
      output[index + 3] = alpha;
    }
  }

  return new ImageData(output, width, height);
}

export default function ImageResolutionForm() {
  const [image, setImage] = useState<ResolutionImage | null>(null);
  const [sharpness, setSharpness] = useState(0.4);
  const [superScale, setSuperScale] = useState(1);
  const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [jpegQuality, setJpegQuality] = useState(0.92);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (image) URL.revokeObjectURL(image.previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [image, resultUrl]);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('请上传 PNG、JPG 或 WebP 图片。');
      return;
    }

    const dims = await (async () => {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const element = new Image();
          element.onload = () => resolve(element);
          element.onerror = reject;
          element.src = url;
        });
        return { width: img.naturalWidth, height: img.naturalHeight };
      } finally {
        URL.revokeObjectURL(url);
      }
    })();

    if (image) URL.revokeObjectURL(image.previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setImage({
      file,
      previewUrl: URL.createObjectURL(file),
      width: dims.width,
      height: dims.height,
    });
    setResultUrl(null);
    setError(null);
  }, [image, resultUrl]);

  const processImage = useCallback(async () => {
    if (!image) {
      setError('请先上传图片。');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const bitmap = await createImageBitmap(image.file);
      const targetWidth = Math.round(image.width * superScale);
      const targetHeight = Math.round(image.height * superScale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('未能创建绘图上下文');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

      if (sharpness > 0) {
        const data = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const sharpened = applySharpen(data, sharpness);
        ctx.putImageData(sharpened, 0, 0);
      }

      const dataUrl = canvas.toDataURL(outputFormat, outputFormat === 'image/png' ? undefined : jpegQuality);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(dataUrl);
    } catch (processingError) {
      console.error(processingError);
      setError('处理图片时出现问题，请稍后重试。');
    } finally {
      setIsProcessing(false);
    }
  }, [image, jpegQuality, outputFormat, resultUrl, sharpness, superScale]);

  const reset = useCallback(() => {
    if (image) URL.revokeObjectURL(image.previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setImage(null);
    setResultUrl(null);
    setError(null);
  }, [image, resultUrl]);

  const dimensionText = useMemo(() => {
    if (!image) return null;
    const scaledWidth = Math.round(image.width * superScale);
    const scaledHeight = Math.round(image.height * superScale);
    return superScale === 1
      ? `原始尺寸：${image.width} × ${image.height} px`
      : `输出尺寸：${scaledWidth} × ${scaledHeight} px（基于 ${image.width} × ${image.height}）`;
  }, [image, superScale]);

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
            <p className="text-lg font-medium text-slate-700">选择待增强的图片</p>
            <p className="text-sm text-slate-500">支持 PNG / JPG / WebP，保持原尺寸或进行超分辨率。</p>
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(',')}
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
        </div>

        {image && (
          <div className={`${iosSubPanelClass} grid gap-4 md:grid-cols-2`}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">锐化程度 ({Math.round(sharpness * 100)}%)</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sharpness}
                onChange={(event) => setSharpness(Number(event.target.value))}
                className="w-full accent-[#007AFF]"
              />
              <p className="text-xs text-slate-500">提升边缘对比度，增强细节，避免过高以防噪点。</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">超分辨率</label>
              <select
                className={iosInputClass}
                value={superScale}
                onChange={(event) => setSuperScale(Number(event.target.value))}
              >
                <option value={1}>保持原尺寸 (1×)</option>
                <option value={1.5}>增强 1.5×</option>
                <option value={2}>增强 2×</option>
              </select>
              <p className="text-xs text-slate-500">简单的插值放大搭配锐化，可用于社交媒体分享或打印。</p>
            </div>
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
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={jpegQuality}
                  onChange={(event) => setJpegQuality(Number(event.target.value))}
                  className="w-full accent-[#007AFF]"
                />
              </div>
            )}
          </div>
        )}

        {dimensionText && (
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 text-xs text-slate-500">{dimensionText}</div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" className={iosButtonGhost} onClick={reset} disabled={isProcessing}>
            清空
          </button>
          <button type="button" className={iosButtonPrimary} onClick={processImage} disabled={isProcessing || !image}>
            {isProcessing ? '处理中…' : '生成增强图片'}
          </button>
        </div>
      </div>

      {image && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className={iosPanelClass}>
            <h2 className="text-lg font-semibold text-slate-900">原图预览</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-4">
              <img src={image.previewUrl} alt="原图预览" className="w-full" />
            </div>
          </div>
          {resultUrl && (
            <div className={iosPanelClass}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900">增强后预览</h2>
                <a href={resultUrl} download={`image-enhanced.${outputFormat === 'image/png' ? 'png' : 'jpg'}`} className={iosButtonPrimary}>
                  下载图片
                </a>
              </div>
              <p className="mt-2 text-sm text-slate-500">下载结果可用于打印或高清展示，若出现噪点可适当降低锐化程度。</p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-4">
                <img src={resultUrl} alt="增强图预览" className="w-full" />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
