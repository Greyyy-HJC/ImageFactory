"use client";

import { useCallback, useMemo, useState } from "react";
import { PDFDocument } from "pdf-lib";

type NodeType = "initial" | "final" | "vertex";

type DiagramNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  type: NodeType;
};

type EdgeStyle = "fermion" | "boson";

type DiagramEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
  style?: EdgeStyle;
};

type DiagramSpec = {
  id: string;
  title: string;
  description: string;
  width: number;
  height: number;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
};

type ProcessExample = {
  id: string;
  title: string;
  description: string;
  reference: string;
  diagrams: DiagramSpec[];
};

const iosPanelClass =
  "rounded-3xl border border-white/60 bg-white/80 p-8 shadow-[0_28px_60px_-30px_rgba(30,41,59,0.45)] backdrop-blur-xl";
const iosSubPanelClass =
  "rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur";
const iosInputClass =
  "w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner focus:border-[#007AFF] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40";
const iosButtonPrimary =
  "inline-flex items-center justify-center rounded-full bg-[#007AFF] px-6 py-3 text-base font-semibold text-white shadow-[0_24px_40px_-20px_rgba(0,122,255,0.65)] transition hover:bg-[#0066d6] active:bg-[#0054ad] focus:outline-none focus:ring-4 focus:ring-[#007AFF]/40";

const examples: ProcessExample[] = [
  {
    id: "ee-mumu",
    title: "e⁺ e⁻ → μ⁺ μ⁻",
    description: "轻子对产生，包含 γ / Z 两种 s-道拓扑。",
    reference: "QED / Electroweak s-channel",
    diagrams: [
      {
        id: "ee-mumu-gamma",
        title: "s-道 (γ)",
        description: "电子正负湮灭成虚光子，再产生 μ⁺ μ⁻。",
        width: 520,
        height: 320,
        nodes: [
          { id: "eMinus", label: "e⁻", x: 40, y: 80, type: "initial" },
          { id: "ePlus", label: "e⁺", x: 40, y: 240, type: "initial" },
          { id: "muMinus", label: "μ⁻", x: 480, y: 80, type: "final" },
          { id: "muPlus", label: "μ⁺", x: 480, y: 240, type: "final" },
          { id: "vLeft", label: "", x: 200, y: 160, type: "vertex" },
          { id: "vRight", label: "", x: 320, y: 160, type: "vertex" },
        ],
        edges: [
          { id: "eMinusEdge", from: "eMinus", to: "vLeft", style: "fermion" },
          { id: "ePlusEdge", from: "vLeft", to: "ePlus", style: "fermion" },
          { id: "muMinusEdge", from: "vRight", to: "muMinus", style: "fermion" },
          { id: "muPlusEdge", from: "muPlus", to: "vRight", style: "fermion" },
          { id: "photon", from: "vLeft", to: "vRight", style: "boson", label: "γ*" },
        ],
      },
      {
        id: "ee-mumu-z",
        title: "s-道 (Z)",
        description: "同样拓扑，传播子换为 Z 玻色子。",
        width: 520,
        height: 320,
        nodes: [
          { id: "eMinus", label: "e⁻", x: 40, y: 80, type: "initial" },
          { id: "ePlus", label: "e⁺", x: 40, y: 240, type: "initial" },
          { id: "muMinus", label: "μ⁻", x: 480, y: 80, type: "final" },
          { id: "muPlus", label: "μ⁺", x: 480, y: 240, type: "final" },
          { id: "vLeft", label: "", x: 200, y: 160, type: "vertex" },
          { id: "vRight", label: "", x: 320, y: 160, type: "vertex" },
        ],
        edges: [
          { id: "eMinusEdge", from: "eMinus", to: "vLeft", style: "fermion" },
          { id: "ePlusEdge", from: "vLeft", to: "ePlus", style: "fermion" },
          { id: "muMinusEdge", from: "vRight", to: "muMinus", style: "fermion" },
          { id: "muPlusEdge", from: "muPlus", to: "vRight", style: "fermion" },
          { id: "zBoson", from: "vLeft", to: "vRight", style: "boson", label: "Z" },
        ],
      },
    ],
  },
  {
    id: "compton",
    title: "康普顿散射 e⁻ γ → e⁻ γ",
    description: "QED 中基础散射，包含 s / u 两种拓扑。",
    reference: "QED Compton scattering",
    diagrams: [
      {
        id: "compton-s",
        title: "s-道",
        description: "虚电子传播子位于电子线内部。",
        width: 520,
        height: 320,
        nodes: [
          { id: "eIn", label: "e⁻", x: 40, y: 80, type: "initial" },
          { id: "gammaIn", label: "γ", x: 40, y: 240, type: "initial" },
          { id: "eOut", label: "e⁻", x: 480, y: 80, type: "final" },
          { id: "gammaOut", label: "γ", x: 480, y: 240, type: "final" },
          { id: "vLeft", label: "", x: 200, y: 160, type: "vertex" },
          { id: "vRight", label: "", x: 320, y: 160, type: "vertex" },
        ],
        edges: [
          { id: "eInEdge", from: "eIn", to: "vLeft", style: "fermion" },
          { id: "gammaInEdge", from: "gammaIn", to: "vLeft", style: "boson" },
          { id: "propEdge", from: "vLeft", to: "vRight", style: "fermion", label: "e*" },
          { id: "eOutEdge", from: "vRight", to: "eOut", style: "fermion" },
          { id: "gammaOutEdge", from: "vRight", to: "gammaOut", style: "boson" },
        ],
      },
      {
        id: "compton-u",
        title: "u-道",
        description: "将末态电子与光子互换即得到 u-道。",
        width: 520,
        height: 320,
        nodes: [
          { id: "eIn", label: "e⁻", x: 40, y: 80, type: "initial" },
          { id: "gammaIn", label: "γ", x: 40, y: 240, type: "initial" },
          { id: "gammaOut", label: "γ", x: 480, y: 80, type: "final" },
          { id: "eOut", label: "e⁻", x: 480, y: 240, type: "final" },
          { id: "vLeft", label: "", x: 200, y: 160, type: "vertex" },
          { id: "vRight", label: "", x: 320, y: 160, type: "vertex" },
        ],
        edges: [
          { id: "eInEdge", from: "eIn", to: "vLeft", style: "fermion" },
          { id: "gammaInEdge", from: "gammaIn", to: "vLeft", style: "boson" },
          { id: "propEdge", from: "vLeft", to: "vRight", style: "fermion", label: "e*" },
          { id: "gammaOutEdge", from: "vRight", to: "gammaOut", style: "boson" },
          { id: "eOutEdge", from: "vRight", to: "eOut", style: "fermion" },
        ],
      },
    ],
  },
  {
    id: "h-to-gg",
    title: "H → γγ（有效顶点）",
    description: "使用有效耦合表示的单顶点希格斯衰变示意图。",
    reference: "Effective operator",
    diagrams: [
      {
        id: "h-to-gg",
        title: "单顶点表示",
        description: "简化处理，将环图压缩为一个有效顶点。",
        width: 520,
        height: 320,
        nodes: [
          { id: "hIn", label: "H", x: 40, y: 160, type: "initial" },
          { id: "vertex", label: "", x: 260, y: 160, type: "vertex" },
          { id: "gamma1", label: "γ", x: 480, y: 80, type: "final" },
          { id: "gamma2", label: "γ", x: 480, y: 240, type: "final" },
        ],
        edges: [
          { id: "hEdge", from: "hIn", to: "vertex", style: "boson" },
          { id: "gamma1Edge", from: "vertex", to: "gamma1", style: "boson" },
          { id: "gamma2Edge", from: "vertex", to: "gamma2", style: "boson" },
        ],
      },
    ],
  },
];

const nodeMapFor = (diagram: DiagramSpec): Record<string, DiagramNode> =>
  diagram.nodes.reduce<Record<string, DiagramNode>>((acc, node) => {
    acc[node.id] = node;
    return acc;
  }, {});

function pdfY(y: number, height: number) {
  return height - y;
}

function sanitizeLabel(label: string): string {
  const replacements: Record<string, string> = {
    "→": "->",
    "γ": "gamma",
    "μ": "mu",
    "ν": "nu",
    "⁺": "+",
    "⁻": "-",
    "ₑ": "e",
    "ₙ": "n",
    "̄": "bar",
  };

  return Array.from(label)
    .map((char) => replacements[char] ?? char)
    .join("");
}

async function exportDiagram(diagram: DiagramSpec) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([diagram.width, diagram.height]);

  const nodes = nodeMapFor(diagram);

  diagram.edges.forEach((edge) => {
    const from = nodes[edge.from];
    const to = nodes[edge.to];
    if (!from || !to) return;

    page.drawLine({
      start: { x: from.x, y: pdfY(from.y, diagram.height) },
      end: { x: to.x, y: pdfY(to.y, diagram.height) },
      thickness: edge.style === "boson" ? 1.2 : 1.6,
      dashArray: edge.style === "boson" ? [6, 4] : undefined,
    });

    if (edge.label) {
      const text = sanitizeLabel(edge.label);
      page.drawText(text, {
        x: (from.x + to.x) / 2 - 12,
        y: (pdfY(from.y, diagram.height) + pdfY(to.y, diagram.height)) / 2 + 6,
        size: 10,
      });
    }
  });

  diagram.nodes.forEach((node) => {
    const y = pdfY(node.y, diagram.height);
    if (node.type === "vertex") {
      page.drawCircle({ x: node.x, y, size: 3, color: undefined });
    }

    if (node.label) {
      const offsetX = node.type === "initial" ? -24 : 8;
      const offsetY = 8;
      const text = sanitizeLabel(node.label);
      page.drawText(text, {
        x: node.x + offsetX,
        y: y + offsetY,
        size: 12,
      });
    }
  });

  const bytes = await pdf.save();
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${diagram.id}.pdf`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function DiagramPreview({ diagram }: { diagram: DiagramSpec }) {
  const nodes = useMemo(() => nodeMapFor(diagram), [diagram]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${diagram.width} ${diagram.height}`}
      className="rounded-2xl bg-white/80"
    >
      <rect
        x={16}
        y={16}
        width={diagram.width - 32}
        height={diagram.height - 32}
        fill="none"
        stroke="#CBD5F5"
        strokeDasharray="10 6"
      />
      {diagram.edges.map((edge) => {
        const from = nodes[edge.from];
        const to = nodes[edge.to];
        if (!from || !to) return null;
        return (
          <g key={edge.id}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#1e293b"
              strokeWidth={edge.style === "boson" ? 1.5 : 2}
              strokeDasharray={edge.style === "boson" ? "8 6" : "none"}
            />
            {edge.label ? (
              <text
                x={(from.x + to.x) / 2}
                y={(from.y + to.y) / 2 - 8}
                fontSize={14}
                fill="#0F172A"
                textAnchor="middle"
              >
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {diagram.nodes.map((node) => (
        <g key={node.id}>
          {node.type === "vertex" ? (
            <circle cx={node.x} cy={node.y} r={5} fill="#0F172A" />
          ) : null}
          {node.label ? (
            <text
              x={node.x + (node.type === "initial" ? -18 : 14)}
              y={node.y + 6}
              fontSize={16}
              fontWeight={600}
              fill="#0F172A"
            >
              {node.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

export default function FeynDiagramForm() {
  const [selectedId, setSelectedId] = useState(examples[0]?.id ?? "");

  const current = useMemo(() => {
    const found = examples.find((item) => item.id === selectedId);
    return found ?? examples[0];
  }, [selectedId]);

  const handleDownload = useCallback(async (diagram: DiagramSpec) => {
    await exportDiagram(diagram);
  }, []);

  return (
    <section className="space-y-8">
      <div className={`${iosPanelClass} space-y-6`}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">选择示例散射/衰变过程</label>
          <select
            className={iosInputClass}
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {examples.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            当前展示树级示意图，可下载 PDF 用于课堂素材或讨论。
          </p>
        </div>

        <div className={iosSubPanelClass}>
          <h2 className="text-lg font-semibold text-slate-900">{current.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{current.description}</p>
          <p className="mt-1 text-xs text-slate-400">参考：{current.reference}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {current.diagrams.map((diagram) => (
          <div key={diagram.id} className={`${iosPanelClass} space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{diagram.title}</h3>
                <p className="text-sm text-slate-500">{diagram.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(diagram)}
                className={iosButtonPrimary}
              >
                下载 PDF
              </button>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
              <div className="h-[260px]">
                <DiagramPreview diagram={diagram} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`${iosSubPanelClass} text-xs leading-relaxed text-slate-500`}>
        <p>提示：</p>
        <ol className="list-decimal pl-4 space-y-1">
          <li>图形基于简化的树级拓扑，仅用于说明粒子流程。</li>
          <li>下载的 PDF 可直接插入课件或笔记，后续可扩展自定义粒子输入。</li>
          <li>欢迎反馈需要的其他示例，例如 QCD 夸克-胶子过程或电弱散射。</li>
        </ol>
      </div>
    </section>
  );
}
