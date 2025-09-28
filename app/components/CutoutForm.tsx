
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

interface SourceImage {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

const iosPanelClass = 'rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_28px_60px_-30px_rgba(30,41,59,0.45)] backdrop-blur-xl';
const iosSubPanelClass = 'rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur';
const iosInputClass = 'w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40';
const iosButtonPrimary = 'inline-flex items-center justify-center rounded-full bg-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-[0_24px_40px_-20px_rgba(0,122,255,0.65)] transition hover:bg-[#0066d6] active:bg-[#0054ad] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/40 disabled:cursor-not-allowed disabled:bg-[#9CC8FF] disabled:shadow-none';
const iosButtonGhost = 'inline-flex items-center justify-center rounded-full border border-slate-200/80 bg-white/70 px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-[#007AFF]/60 hover:text-[#007AFF] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/30 disabled:opacity-60';

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

function rgbDistance(a: RGB, b: RGB): number {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

export default function CutoutForm() {
  const [source, setSource] = useState<SourceImage | null>(null);
  const [selectedColor, setSelectedColor] = useState<RGB | null>(null);
  const [tolerance, setTolerance] = useState(30);
  const [feather, setFeather] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<'image/png' | 'image/webp'>('image/png');
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
    setSelectedColor(null);
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

  const pickColor = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!previewCanvasRef.current || !source) return;
      const canvas = previewCanvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor((event.clientX - rect.left) * scaleX);
      const y = Math.floor((event.clientY - rect.top) * scaleY);

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      setSelectedColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
    },
    [source]
  );

  const processImage = useCallback(async () => {
    if (!source) {
      setError('请先上传图片。');
      return;
    }
    if (!selectedColor) {
      setError('点击预览选择要抠除的背景颜色。');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const bitmap = await createImageBitmap(source.file);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(source.width);
      canvas.height = Math.round(source.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('未能创建绘图上下文');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const tol = tolerance;
      const featherRadius = feather;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const distance = rgbDistance({ r, g, b }, selectedColor);

        if (distance <= tol) {
          let alpha = 0;
          if (featherRadius > 0) {
            alpha = Math.max(0, 255 * (distance / Math.max(tol, 1)));
            alpha = Math.min(alpha, 255);
          }
          data[i + 3] = alpha;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const dataUrl = canvas.toDataURL(outputFormat, outputFormat === 'image/png' ? undefined : 0.92);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(dataUrl);
    } catch (cutoutError) {
      console.error(cutoutError);
      setError('抠图过程中出现问题，请尝试调整容差或换用更清晰的图片背景。');
    } finally {
      setIsProcessing(false);
    }
  }, [feather, outputFormat, resultUrl, selectedColor, source, tolerance]);

  const reset = useCallback(() => {
    if (source) URL.revokeObjectURL(source.previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setSource(null);
    setSelectedColor(null);
    setResultUrl(null);
    setError(null);
  }, [resultUrl, source]);

  const pickedColorStyle = useMemo(() => {
    if (!selectedColor) return { backgroundColor: 'transparent' };
    return {
      backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`,
    };
  }, [selectedColor]);

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
            <p className="text-lg font-medium text-slate-700">选择需要抠图的图片</p>
            <p className="text-sm text-slate-500">建议使用背景较纯净的图片，点击预览可选取背景颜色。</p>
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
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">点击下方预览选择背景颜色</p>
                <p className="text-xs text-slate-500">系统将把与所选颜色相近的区域转为透明，可通过容差微调范围。</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-3 py-2 text-xs text-slate-500">
                  <span>当前颜色:</span>
                  <span className="h-5 w-5 rounded-full border" style={pickedColorStyle} />
                </div>
                <div className="space-y-1 text-xs text-slate-500">
                  <p>图片尺寸：{source.width} × {source.height} px</p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 p-3">
              <canvas
                ref={previewCanvasRef}
                className="w-full cursor-crosshair"
                onClick={pickColor}
                style={{ maxHeight: '540px' }}
              />
            </div>
            <p className="text-xs text-slate-400">提示：点击不同区域可重新选择背景颜色，生成前请确保主体边缘清晰。</p>
          </div>
        )}

        {source && (
          <div className={`${iosSubPanelClass} grid gap-4 md:grid-cols-2`}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">容差 ({tolerance})</label>
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={tolerance}
                onChange={(event) => setTolerance(Number(event.target.value))}
                className="w-full accent-[#007AFF]"
              />
              <p className="text-xs text-slate-500">容差越高，抠图影响的背景范围越大，适合渐变或阴影背景。</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">羽化 ({feather}px)</label>
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={feather}
                onChange={(event) => setFeather(Number(event.target.value))}
                className="w-full accent-[#007AFF]"
              />
              <p className="text-xs text-slate-500">适当羽化可柔化边缘，减少锯齿感。</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">输出格式</label>
              <select
                className={iosInputClass}
                value={outputFormat}
                onChange={(event) => setOutputFormat(event.target.value as 'image/png' | 'image/webp')}
              >
                <option value="image/png">PNG（透明背景）</option>
                <option value="image/webp">WebP（现代格式）</option>
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
            {isProcessing ? '处理中…' : '生成抠图结果'}
          </button>
        </div>
      </div>

      {resultUrl && (
        <div className={`${iosPanelClass} space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">抠图预览 & 下载</h2>
            <a
              href={resultUrl}
              download={`cutout.${outputFormat === 'image/png' ? 'png' : 'webp'}`}
              className={iosButtonPrimary}
            >
              下载透明图
            </a>
          </div>
          <p className="text-sm text-slate-500">如需更精准的抠图，可多次点击不同背景区域或调整容差。</p>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row">
            <div className="flex-1 rounded-2xl border border-white/60 bg-white/70 p-4">
              <p className="text-sm font-semibold text-slate-700">透明背景预览</p>
              <div className="mt-3 grid place-items-center rounded-xl bg-[linear-gradient(45deg,#e5e7eb_25%,transparent_25%),linear-gradient(-45deg,#e5e7eb_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e5e7eb_75%),linear-gradient(-45deg,transparent_75%,#e5e7eb_75%)] bg-[length:20px_20px]">
                <img src={resultUrl} alt="抠图结果" className="w-full max-w-full rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
