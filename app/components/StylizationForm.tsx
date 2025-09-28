
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

interface SourceImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

type StylizationKind = 'grayscale' | 'sketch' | 'pixel' | 'cartoon' | 'ink';

const iosPanelClass = 'rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_28px_60px_-30px_rgba(30,41,59,0.45)] backdrop-blur-xl';
const iosSubPanelClass = 'rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur';
const iosInputClass = 'w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40';
const iosButtonPrimary = 'inline-flex items-center justify-center rounded-full bg-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-[0_24px_40px_-20px_rgba(0,122,255,0.65)] transition hover:bg-[#0066d6] active:bg-[#0054ad] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/40 disabled:cursor-not-allowed disabled:bg-[#9CC8FF] disabled:shadow-none';
const iosButtonGhost = 'inline-flex items-center justify-center rounded-full border border-slate-200/80 bg-white/70 px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-[#007AFF]/60 hover:text-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/30 disabled:opacity-60';

const STYLE_OPTIONS: { id: StylizationKind; name: string; description: string }[] = [
  { id: 'grayscale', name: '黑白', description: '经典黑白效果，突出光影层次。' },
  { id: 'sketch', name: '素描', description: '模拟铅笔素描线条，突出轮廓。' },
  { id: 'pixel', name: '像素', description: '低分辨率像素化风格，营造怀旧感。' },
  { id: 'cartoon', name: '卡通', description: '降低色彩层次并增强边缘，形成卡通效果。' },
  { id: 'ink', name: '国画', description: '淡化色彩并加入水墨感，呈现国风意境。' },
];

async function readImageMeta(file: File): Promise<{ width: number; height: number }> {
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

function grayscalePixel(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function applyStylization(
  image: ImageData,
  style: StylizationKind,
  intensity: number
): ImageData {
  const { width, height, data } = image;
  const output = new Uint8ClampedArray(data);

  if (style === 'pixel') {
    const factor = Math.max(4, Math.round((1 - intensity) * 40));
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.max(1, Math.round(width / factor));
    tempCanvas.height = Math.max(1, Math.round(height / factor));
    const tctx = tempCanvas.getContext('2d');
    if (!tctx) return image;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return image;
    ctx.putImageData(image, 0, 0);
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  }

  if (style === 'grayscale') {
    for (let i = 0; i < output.length; i += 4) {
      const gray = grayscalePixel(output[i], output[i + 1], output[i + 2]);
      output[i] = output[i + 1] = output[i + 2] = gray;
    }
    return new ImageData(output, width, height);
  }

  if (style === 'sketch' || style === 'cartoon') {
    // Create grayscale version
    const gray = new Float32Array(width * height);
    for (let i = 0, p = 0; i < output.length; i += 4, p += 1) {
      gray[p] = grayscalePixel(output[i], output[i + 1], output[i + 2]);
    }

    const sobelX = [
      -1, 0, 1,
      -2, 0, 2,
      -1, 0, 1,
    ];
    const sobelY = [
      -1, -2, -1,
       0,  0,  0,
       1,  2,  1,
    ];
    const edge = new Float32Array(width * height);

    const applyKernel = (kernel: number[], x: number, y: number): number => {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky += 1) {
        for (let kx = -1; kx <= 1; kx += 1) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          sum += gray[py * width + px] * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      return sum;
    };

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const gx = applyKernel(sobelX, x, y);
        const gy = applyKernel(sobelY, x, y);
        edge[y * width + x] = Math.sqrt(gx * gx + gy * gy);
      }
    }

    let maxEdge = 0;
    for (let idx = 0; idx < edge.length; idx += 1) {
      if (edge[idx] > maxEdge) {
        maxEdge = edge[idx];
      }
    }
    for (let i = 0, p = 0; i < output.length; i += 4, p += 1) {
      const e = edge[p] / (maxEdge || 1);
      if (style === 'sketch') {
        const shade = 255 - Math.pow(e, 0.8) * 255;
        output[i] = output[i + 1] = output[i + 2] = shade;
      } else {
        const posterLevel = 6;
        const quant = Math.round(gray[p] / (255 / posterLevel)) * (255 / posterLevel);
        const edgeBlend = Math.pow(e, 0.8);
        output[i] = quant * (1 - edgeBlend) + edgeBlend * 40;
        output[i + 1] = quant * (1 - edgeBlend) + edgeBlend * 40;
        output[i + 2] = quant * (1 - edgeBlend) + edgeBlend * 40;
      }
    }

    if (style === 'cartoon') {
      const adjust = intensity * 0.35 + 0.65;
      for (let i = 0; i < output.length; i += 4) {
        output[i] = Math.min(255, output[i] * adjust);
        output[i + 1] = Math.min(255, output[i + 1] * adjust * 0.98);
        output[i + 2] = Math.min(255, output[i + 2] * adjust * 0.94);
      }
    }

    return new ImageData(output, width, height);
  }

  if (style === 'ink') {
    for (let i = 0; i < output.length; i += 4) {
      const gray = grayscalePixel(output[i], output[i + 1], output[i + 2]);
      const blend = gray * (0.7 + intensity * 0.3);
      output[i] = Math.min(255, blend * 1.05 + 12);
      output[i + 1] = Math.min(255, blend * 0.92 + 10);
      output[i + 2] = Math.min(255, blend * 0.85 + 18);
    }
    return new ImageData(output, width, height);
  }

  return new ImageData(output, width, height);
}

export default function StylizationForm() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<StylizationKind>('grayscale');
  const [intensity, setIntensity] = useState(0.7);
  const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl, source]);

  const handleFiles = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('请上传 PNG / JPG / WebP 图片。');
      return;
    }

    const meta = await readImageMeta(file);
    if (source) URL.revokeObjectURL(source.previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);

    setSource({
      file,
      previewUrl: URL.createObjectURL(file),
      width: meta.width,
      height: meta.height,
    });
    setResultUrl(null);
    setError(null);
  }, [resultUrl, source]);

  useEffect(() => {
    if (!source || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    createImageBitmap(source.file).then((bitmap) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    });
  }, [source]);

  const processImage = useCallback(async () => {
    if (!source) {
      setError('请先上传图片。');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const bitmap = await createImageBitmap(source.file);
      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('未能创建绘图上下文');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const styled = applyStylization(data, style, intensity);
      ctx.putImageData(styled, 0, 0);
      const dataUrl = canvas.toDataURL(outputFormat, outputFormat === 'image/jpeg' ? 0.92 : undefined);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(dataUrl);
    } catch (processError) {
      console.error(processError);
      setError('处理图片时出现问题，请尝试更换图片或降低强度。');
    } finally {
      setIsProcessing(false);
    }
  }, [intensity, outputFormat, resultUrl, source, style]);

  const reset = useCallback(() => {
    if (source) URL.revokeObjectURL(source.previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setSource(null);
    setResultUrl(null);
    setError(null);
  }, [resultUrl, source]);

  const intensityLabel = useMemo(() => {
    switch (style) {
      case 'pixel':
        return `像素块大小 (${Math.round((1 - intensity) * 40)}px)`;
      case 'cartoon':
        return `色彩强化 (${Math.round(intensity * 100)}%)`;
      case 'ink':
        return `晕染程度 (${Math.round(intensity * 100)}%)`;
      case 'sketch':
        return `线条细节 (${Math.round(intensity * 100)}%)`;
      default:
        return `强度 (${Math.round(intensity * 100)}%)`;
    }
  }, [intensity, style]);

  const showIntensity = style !== 'grayscale';

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
            <p className="text-lg font-medium text-slate-700">选择想要变换风格的图片</p>
            <p className="text-sm text-slate-500">支持 PNG / JPG / WebP，可生成风格化的单张图片。</p>
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
        </div>

        {source && (
          <div className={`${iosSubPanelClass} space-y-4`}>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {STYLE_OPTIONS.map((option) => {
                const active = style === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStyle(option.id)}
                    className={`flex flex-col items-start gap-2 rounded-2xl border px-4 py-3 text-left shadow-sm transition ${
                      active
                        ? 'border-[#0A84FF]/60 bg-[#F0F6FF] text-[#0A2463]'
                        : 'border-white/70 bg-white/70 text-slate-600 hover:border-[#0A84FF]/30'
                    }`}
                  >
                    <span className="text-sm font-semibold">{option.name}</span>
                    <span className="text-xs text-slate-500">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {source && (
          <div className={`${iosSubPanelClass} space-y-4`}>
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">原图预览</p>
                <div className="mt-3 overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-3">
                  <canvas ref={previewCanvasRef} className="w-full" style={{ maxHeight: '480px' }} />
                </div>
              </div>
              {resultUrl && (
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">风格化预览</p>
                  <div className="mt-3 overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-3">
                    <img src={resultUrl} alt="风格化结果" className="w-full" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {source && (
          <div className={`${iosSubPanelClass} grid gap-4 md:grid-cols-2`}>
            {showIntensity && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">{intensityLabel}</label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={intensity}
                  onChange={(event) => setIntensity(Number(event.target.value))}
                  className="w-full accent-[#007AFF]"
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">输出格式</label>
              <select
                className={iosInputClass}
                value={outputFormat}
                onChange={(event) => setOutputFormat(event.target.value as 'image/png' | 'image/jpeg' | 'image/webp')}
              >
                <option value="image/png">PNG（透明背景）</option>
                <option value="image/jpeg">JPG（高兼容性）</option>
                <option value="image/webp">WebP（高压缩比）</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" className={iosButtonGhost} onClick={reset} disabled={isProcessing}>
            清空
          </button>
          <button type="button" className={iosButtonPrimary} onClick={processImage} disabled={isProcessing || !source}>
            {isProcessing ? '处理中…' : '生成风格图'}
          </button>
        </div>
      </div>

      {resultUrl && (
        <div className={`${iosPanelClass} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">下载结果</h2>
            <a
              href={resultUrl}
              download={`stylization-${style}.${outputFormat.split('/')[1]}`}
              className={iosButtonPrimary}
            >
              保存图片
            </a>
          </div>
          <p className="text-sm text-slate-500">提示：可重复尝试不同风格与强度，获得满意的视觉效果。</p>
        </div>
      )}
    </section>
  );
}
