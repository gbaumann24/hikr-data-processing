import { useEffect, useRef } from "react";
import { PEAK_NAMES } from "./peak-names";

// ─── Noise ───────────────────────────────────────────────────────────────────

function hash(x: number, seed: number): number {
  const s = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function smoothNoise(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const t = f * f * f * (f * (f * 6 - 15) + 10);
  return hash(i, seed) * (1 - t) + hash(i + 1, seed) * t;
}

function fbm(x: number, seed: number, octaves = 5): number {
  let v = 0, a = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) {
    v += smoothNoise(x * f + i * 47.3, seed) * a;
    a *= 0.55;
    f *= 2.07;
  }
  return v;
}

// ─── Peak labels ─────────────────────────────────────────────────────────────

function peakName(noisePos: number) {
  const idx = Math.abs(Math.floor(noisePos * 137.508)) % PEAK_NAMES.length;
  return PEAK_NAMES[idx];
}

// ─── Layer definition ────────────────────────────────────────────────────────

interface Layer {
  seed: number;
  baselineY: number;
  amplitude: number;
  speed: number;
  freq: number;
  lineWidth: number;
  opacity: number;
  glow: number;
  labelSpacing: number; // 0 = no labels; noise-space spacing between peaks
  labelMinHeight: number; // min fbm value to qualify as a named peak
}

const LAYERS: Layer[] = [
  { seed: 11, baselineY: 0.62, amplitude: 0.10, speed: 0.02, freq: 0.7, lineWidth: 0.5, opacity: 0.20, glow: 0,  labelSpacing: 0,   labelMinHeight: 0    },
  { seed: 22, baselineY: 0.66, amplitude: 0.14, speed: 0.04, freq: 0.8, lineWidth: 0.7, opacity: 0.32, glow: 0,  labelSpacing: 0,   labelMinHeight: 0    },
  { seed: 33, baselineY: 0.72, amplitude: 0.20, speed: 0.07, freq: 0.9, lineWidth: 0.9, opacity: 0.48, glow: 2,  labelSpacing: 1.6, labelMinHeight: 0.52 },
  { seed: 44, baselineY: 0.79, amplitude: 0.27, speed: 0.12, freq: 1.0, lineWidth: 1.2, opacity: 0.62, glow: 4,  labelSpacing: 2.0, labelMinHeight: 0.55 },
  { seed: 55, baselineY: 0.87, amplitude: 0.36, speed: 0.20, freq: 1.1, lineWidth: 1.5, opacity: 0.78, glow: 6,  labelSpacing: 3.8, labelMinHeight: 0.62 },
  { seed: 66, baselineY: 0.98, amplitude: 0.47, speed: 0.33, freq: 1.2, lineWidth: 2.0, opacity: 0.92, glow: 10, labelSpacing: 5.0, labelMinHeight: 0.68 },
];

const MOUNTAIN_FILLS = ["#b8c5d4", "#8a9bab", "#5c6b7a", "#3a4654", "#252d38", "#141920"];

// Highest point on the ridge curve within a fixed noise-space interval
function highestPointInInterval(
  nxStart: number,
  nxEnd: number,
  seed: number,
  step = 0.012,
): { nx: number; height: number } {
  let bestNx = nxStart;
  let bestH = fbm(nxStart, seed);

  for (let nx = nxStart + step; nx <= nxEnd; nx += step) {
    const h = fbm(nx, seed);
    if (h > bestH) {
      bestH = h;
      bestNx = nx;
    }
  }

  return { nx: bestNx, height: bestH };
}

function noiseToScreenX(nx: number, layer: Layer, t: number, W: number): number {
  return ((nx - t * layer.speed) / (layer.freq * 5)) * W;
}

// Analytical ridge height — constant for a fixed world-space peak
function peakScreenY(nx: number, layer: Layer, H: number): number {
  const n = fbm(nx, layer.seed);
  return (layer.baselineY - n * layer.amplitude) * H;
}

const MIN_LABEL_PX_GAP = 108;

// Drop labels closer than MIN_LABEL_PX_GAP — taller summits win
function filterOverlappingPeaks(
  peaks: { px: number; py: number; nx: number }[],
): { px: number; py: number; nx: number }[] {
  const byHeight = [...peaks].sort((a, b) => a.py - b.py);
  const kept: { px: number; py: number; nx: number }[] = [];

  for (const candidate of byHeight) {
    const overlaps = kept.some(
      (k) => Math.abs(k.px - candidate.px) < MIN_LABEL_PX_GAP,
    );
    if (!overlaps) kept.push(candidate);
  }

  return kept.sort((a, b) => a.px - b.px);
}

// One label per fixed world-space interval — peak = highest point in that interval
function collectWorldPeaks(
  layer: Layer,
  t: number,
  W: number,
  H: number,
): { px: number; py: number; nx: number }[] {
  const spacing = layer.labelSpacing;
  if (spacing <= 0) return [];

  const nxMin = t * layer.speed;
  const nxMax = t * layer.speed + layer.freq * 5;
  const iMin = Math.floor(nxMin / spacing);
  const iMax = Math.ceil(nxMax / spacing);

  const peaks: { px: number; py: number; nx: number }[] = [];

  for (let i = iMin; i <= iMax; i++) {
    const intervalStart = i * spacing;
    const intervalEnd = intervalStart + spacing;
    const { nx: peakNx, height } = highestPointInInterval(
      intervalStart,
      intervalEnd,
      layer.seed,
    );

    if (height < layer.labelMinHeight) continue;

    const px = noiseToScreenX(peakNx, layer, t, W);
    if (px < -80 || px > W + 80) continue;

    peaks.push({ px, py: peakScreenY(peakNx, layer, H), nx: peakNx });
  }

  return filterOverlappingPeaks(peaks);
}

const STEP      = 1;
const EDGE_FADE = 60;

// ─── Component ───────────────────────────────────────────────────────────────

export function MountainFlight() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const startRef  = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let pulsePhase = 0;
    let pulseRate = 0.28;
    let pulseTargetRate = 0.16 + Math.random() * 0.36;
    let nextRateChange = 2 + Math.random() * 4;
    let lastFrameTs: number | null = null;

    const drawLabel = (px: number, py: number, nx: number, W: number) => {
      const x = Math.round(px);
      const y = Math.round(py);

      let edgeAlpha = 1;
      if (x < EDGE_FADE) edgeAlpha = x / EDGE_FADE;
      else if (x > W - EDGE_FADE) edgeAlpha = (W - x) / EDGE_FADE;
      if (edgeAlpha <= 0) return;

      const a = edgeAlpha * 0.90;
      const peak = peakName(nx);
      const tickLen = 22;
      const textGap = 6;
      const lineBottom = y - 2;
      const lineTop = lineBottom - tickLen;
      const ty_elev = lineTop - textGap;
      const ty_name = ty_elev - 12;

      ctx.save();
      ctx.textAlign = "center";

      // Leader line — stops below the text block
      ctx.beginPath();
      ctx.moveTo(x, lineBottom);
      ctx.lineTo(x, lineTop);
      ctx.strokeStyle = `rgba(27,29,35,${a * 0.35})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Dot on peak
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(27,29,35,${a * 0.85})`;
      ctx.fill();

      // Labels above the line
      ctx.font = "500 10px ui-sans-serif,system-ui,sans-serif";
      ctx.fillStyle = `rgba(27,29,35,${a * 0.80})`;
      ctx.fillText(peak.name, x, ty_name);

      ctx.font = "400 8px ui-sans-serif,system-ui,sans-serif";
      ctx.fillStyle = `rgba(27,29,35,${a * 0.45})`;
      ctx.fillText(`${peak.elev} m`, x, ty_elev);

      ctx.restore();
    };

    const draw = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000;

      const W = canvas.width;
      const H = canvas.height;

      if (lastFrameTs !== null) {
        const dt = Math.min((ts - lastFrameTs) / 1000, 0.05);
        if (t >= nextRateChange) {
          pulseTargetRate = 0.14 + Math.random() * 0.38;
          nextRateChange = t + 2.5 + Math.random() * 5.5;
        }
        pulseRate += (pulseTargetRate - pulseRate) * Math.min(1, dt * 0.35);
        pulsePhase += pulseRate * dt * Math.PI * 2;
      }
      lastFrameTs = ts;

      const pulse = 0.86 + 0.14 * Math.sin(pulsePhase);

      ctx.clearRect(0, 0, W, H);

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, "#c8daf0");
      skyGrad.addColorStop(0.45, "#e8f0f8");
      skyGrad.addColorStop(1, "#f8f9fb");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Horizon glow — before mountains so ridges mask it
      const hazeGrad = ctx.createLinearGradient(0, H * 0.38, 0, H * 0.70);
      hazeGrad.addColorStop(0,    "rgba(248,249,251,0)");
      hazeGrad.addColorStop(0.44, `rgba(255,140,60,${0.10 * pulse})`);
      hazeGrad.addColorStop(0.54, `rgba(255,100,30,${0.14 * pulse})`);
      hazeGrad.addColorStop(1,    "rgba(248,249,251,0)");
      ctx.fillStyle = hazeGrad;
      ctx.fillRect(0, 0, W, H);

      // Draw layers back → front; labels render after their layer so closer ridges occlude them
      for (let li = 0; li < LAYERS.length; li++) {
        const layer = LAYERS[li];
        const points: [number, number][] = [];

        for (let px = 0; px <= W; px += STEP) {
          const nx = (px / W) * layer.freq * 5 + t * layer.speed;
          const n  = fbm(nx, layer.seed);
          const y  = (layer.baselineY - n * layer.amplitude) * H;
          points.push([px, y]);
        }

        // Filled silhouette (masks everything behind)
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (const [x, y] of points) ctx.lineTo(x, y);
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = MOUNTAIN_FILLS[li];
        ctx.fill();

        // Ridge outline
        ctx.save();
        if (layer.glow > 0) {
          ctx.shadowColor = `rgba(255,120,40,${layer.opacity * 0.25})`;
          ctx.shadowBlur  = layer.glow;
        }
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
        ctx.strokeStyle = `rgba(255,255,255,${layer.opacity * 0.55})`;
        ctx.lineWidth   = layer.lineWidth;
        ctx.lineJoin    = "round";
        ctx.stroke();
        ctx.restore();

        // Labels on this layer — drawn before any closer layer covers them
        for (const { px, py, nx } of collectWorldPeaks(layer, t, W, H)) {
          drawLabel(px, py, nx, W);
        }
      }

      // Soft edge fade
      const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.85);
      vignette.addColorStop(0, "rgba(248,249,251,0)");
      vignette.addColorStop(1, "rgba(200,210,225,0.18)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
