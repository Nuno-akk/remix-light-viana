import {useEffect, useRef} from 'react';
import {useLanguage} from '../i18n/LanguageContext';
import {Fixture, FixtureComputedOutput} from '../types/dmx';

interface StageVisualizerProps {
  fixtures: Fixture[];
  outputsRef: React.MutableRefObject<FixtureComputedOutput[]>;
  selectedFixtureId: string | null;
  onSelectFixture: (id: string | null) => void;
  blackout: boolean;
  freeze: boolean;
  smokeActive: boolean;
  bpm: number;
  beatProgressRef: React.MutableRefObject<number>;
  audioEnergyRef: React.MutableRefObject<number>;
  onJumpToLiveEdit: (fixtureId: string) => void;
}

interface HazeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

export function StageVisualizer({
  fixtures,
  outputsRef,
  selectedFixtureId,
  onSelectFixture,
  blackout,
  freeze,
  smokeActive,
  bpm,
  beatProgressRef,
  audioEnergyRef,
  onJumpToLiveEdit,
}: StageVisualizerProps) {
  const {t} = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const smokeDensityRef = useRef(0.24);
  const particlesRef = useRef<HazeParticle[]>(
    Array.from({length: 28}, () => ({
      x: Math.random(),
      y: 0.25 + Math.random() * 0.72,
      vx: (Math.random() - 0.5) * 0.0005,
      vy: -0.00015 - Math.random() * 0.00035,
      radius: 0.08 + Math.random() * 0.14,
      alpha: 0.03 + Math.random() * 0.05,
    })),
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(320, Math.floor(rect.width * dpr));
      const targetH = Math.max(180, Math.floor(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
    };

    const render = () => {
      resize();
      const w = canvas.width;
      const h = canvas.height;
      const outputs = outputsRef.current;

      // Smooth smoke density transition
      const targetSmoke = smokeActive ? 0.92 : 0.22;
      smokeDensityRef.current += (targetSmoke - smokeDensityRef.current) * 0.04;
      const haze = smokeDensityRef.current;

      // 1. Dark stage backdrop
      ctx.globalCompositeOperation = 'source-over';
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#05070C');
      bgGrad.addColorStop(0.7, '#090E18');
      bgGrad.addColorStop(1, '#0D1422');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2. Perspective stage floor grid
      const horizonY = h * 0.72;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
      ctx.lineWidth = 1;
      for (let i = -6; i <= 6; i += 1) {
        const topX = w * 0.5 + i * (w * 0.065);
        const botX = w * 0.5 + i * (w * 0.16);
        ctx.beginPath();
        ctx.moveTo(topX, horizonY);
        ctx.lineTo(botX, h);
        ctx.stroke();
      }
      for (let r = 0; r <= 4; r += 1) {
        const t = r / 4;
        const y = horizonY + t * t * (h - horizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Subtle DJ Booth silhouette at back center
      const boothW = w * 0.16;
      const boothH = h * 0.11;
      const boothX = w * 0.5 - boothW * 0.5;
      const boothY = horizonY - boothH * 0.85;
      ctx.fillStyle = '#070A11';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.fillRect(boothX, boothY, boothW, boothH);
      ctx.strokeRect(boothX, boothY, boothW, boothH);

      // 3. Overhead Aluminum Truss
      const trussY = h * 0.13;
      const trussH = Math.max(10, h * 0.036);
      const trussX1 = w * 0.05;
      const trussX2 = w * 0.95;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(trussX1, trussY - trussH * 0.5);
      ctx.lineTo(trussX2, trussY - trussH * 0.5);
      ctx.moveTo(trussX1, trussY + trussH * 0.5);
      ctx.lineTo(trussX2, trussY + trussH * 0.5);
      const segs = 22;
      const segW = (trussX2 - trussX1) / segs;
      for (let s = 0; s < segs; s += 1) {
        const sx = trussX1 + s * segW;
        ctx.moveTo(sx, trussY - trussH * 0.5);
        ctx.lineTo(sx + segW * 0.5, trussY + trussH * 0.5);
        ctx.lineTo(sx + segW, trussY - trussH * 0.5);
      }
      ctx.stroke();

      // 4. Volumetric Light Beams (Additive Blending)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      fixtures.forEach((fixture, idx) => {
        const out = outputs[idx];
        if (!out) return;

        const fx = fixture.xPos * w;
        const fy = fixture.yPos * h;
        const dim = out.dimmer;
        if (dim <= 0.01) return;

        const colStr = `${out.r}, ${out.g}, ${out.b}`;
        const whiteBlend = out.w > 0 ? 0.35 : 0;
        const beamAlphaBase = dim * (0.22 + haze * 0.36);

        if (fixture.type === 'moving_head') {
          const targetX = fx + out.panNorm * (w * 0.34);
          const targetY = h * (0.76 + out.tiltNorm * 0.19);
          const dx = targetX - fx;
          const dy = targetY - fy;
          const dist = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);

          const rayCount = out.prismActive ? 3 : 1;
          const prismSpread = out.prismActive ? 0.11 : 0;

          for (let ray = 0; ray < rayCount; ray += 1) {
            const rayOffset = rayCount === 3 ? (ray - 1) * prismSpread : 0;
            const rAngle = angle + rayOffset;
            const rx = fx + Math.cos(rAngle) * dist;
            const ry = fy + Math.sin(rAngle) * dist;
            const spreadHalf =
              (12 + out.beamWidth * 26) * (w / 1000) * (out.prismActive ? 0.68 : 1);

            const perpX = -Math.sin(rAngle);
            const perpY = Math.cos(rAngle);

            const beamGrad = ctx.createLinearGradient(fx, fy, rx, ry);
            beamGrad.addColorStop(
              0,
              `rgba(${Math.min(255, out.r + 75)}, ${Math.min(255, out.g + 75)}, ${Math.min(255, out.b + 75)}, ${Math.min(0.85, beamAlphaBase * 1.45)})`,
            );
            beamGrad.addColorStop(
              0.55,
              `rgba(${colStr}, ${beamAlphaBase * 0.58})`,
            );
            beamGrad.addColorStop(1, `rgba(${colStr}, 0)`);

            ctx.fillStyle = beamGrad;
            ctx.beginPath();
            ctx.moveTo(fx + perpX * 4, fy + perpY * 4);
            ctx.lineTo(fx - perpX * 4, fy - perpY * 4);
            ctx.lineTo(rx - perpX * spreadHalf, ry - perpY * spreadHalf);
            ctx.lineTo(rx + perpX * spreadHalf, ry + perpY * spreadHalf);
            ctx.closePath();
            ctx.fill();

            // Stage floor hotspot pool
            const spotRadius = spreadHalf * 1.15;
            const spotGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, spotRadius);
            spotGrad.addColorStop(0, `rgba(255, 255, 255, ${dim * (0.45 + whiteBlend)})`);
            spotGrad.addColorStop(0.35, `rgba(${colStr}, ${dim * 0.55})`);
            spotGrad.addColorStop(1, `rgba(${colStr}, 0)`);

            ctx.fillStyle = spotGrad;
            ctx.beginPath();
            ctx.ellipse(rx, ry, spotRadius, spotRadius * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();

            // Rotating Gobo dots inside floor spot
            if (out.goboAngle !== 0 && !out.prismActive) {
              ctx.strokeStyle = `rgba(255,255,255,${dim * 0.35})`;
              ctx.lineWidth = 1.2;
              for (let g = 0; g < 4; g += 1) {
                const ga = out.goboAngle + (g * Math.PI) / 2;
                const gx = rx + Math.cos(ga) * spotRadius * 0.42;
                const gy = ry + Math.sin(ga) * spotRadius * 0.18;
                ctx.beginPath();
                ctx.arc(gx, gy, Math.max(1.5, spotRadius * 0.1), 0, Math.PI * 2);
                ctx.stroke();
              }
            }
          }
        } else if (fixture.type === 'led_par') {
          const washH = h * 0.72;
          const washW = w * 0.16;
          const parGrad = ctx.createLinearGradient(fx, fy, fx, fy + washH);
          parGrad.addColorStop(0, `rgba(${colStr}, ${dim * (0.42 + haze * 0.25)})`);
          parGrad.addColorStop(1, `rgba(${colStr}, 0)`);
          ctx.fillStyle = parGrad;
          ctx.beginPath();
          ctx.moveTo(fx - 7, fy);
          ctx.lineTo(fx + 7, fy);
          ctx.lineTo(fx + washW, fy + washH);
          ctx.lineTo(fx - washW, fy + washH);
          ctx.closePath();
          ctx.fill();
        } else if (fixture.type === 'pixel_bar') {
          const barW = w * 0.18;
          const barGlow = ctx.createRadialGradient(fx, fy, 4, fx, fy - h * 0.14, barW * 0.85);
          barGlow.addColorStop(0, `rgba(${colStr}, ${dim * 0.65})`);
          barGlow.addColorStop(1, `rgba(${colStr}, 0)`);
          ctx.fillStyle = barGlow;
          ctx.fillRect(fx - barW * 0.65, fy - h * 0.38, barW * 1.3, h * 0.45);
        } else if (fixture.type === 'blinder') {
          const blinderRad = w * 0.38;
          const bGrad = ctx.createRadialGradient(fx, fy, 4, fx, fy, blinderRad);
          bGrad.addColorStop(0, `rgba(255, 244, 214, ${dim * 0.95})`);
          bGrad.addColorStop(0.25, `rgba(255, 210, 140, ${dim * 0.55})`);
          bGrad.addColorStop(1, 'rgba(255, 190, 110, 0)');
          ctx.fillStyle = bGrad;
          ctx.beginPath();
          ctx.arc(fx, fy, blinderRad, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 5. Volumetric Haze Particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy * (smokeActive ? 2.1 : 0.9);
        if (p.y < 0.16) p.y = 0.92;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;

        const px = p.x * w;
        const py = p.y * h;
        const pr = p.radius * Math.min(w, h);
        const hGrad = ctx.createRadialGradient(px, py, 1, px, py, pr);
        const hAlpha = p.alpha * haze * (blackout ? 0.15 : 0.7);
        hGrad.addColorStop(0, `rgba(186, 210, 238, ${hAlpha})`);
        hGrad.addColorStop(1, 'rgba(186, 210, 238, 0)');
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      // 6. Fixture Housing Icons on Truss/Floor
      fixtures.forEach((fixture, idx) => {
        const out = outputs[idx];
        const fx = fixture.xPos * w;
        const fy = fixture.yPos * h;
        const isSelected = fixture.id === selectedFixtureId;
        const dim = out?.dimmer ?? 0;

        ctx.save();
        if (fixture.type === 'pixel_bar') {
          const bw = Math.max(44, w * 0.1);
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = isSelected ? '#38BDF8' : 'rgba(255,255,255,0.25)';
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.fillRect(fx - bw / 2, fy - 5, bw, 10);
          ctx.strokeRect(fx - bw / 2, fy - 5, bw, 10);
          if (out && dim > 0.02) {
            ctx.fillStyle = `rgba(${out.r}, ${out.g}, ${out.b}, ${Math.max(0.25, dim)})`;
            ctx.fillRect(fx - bw / 2 + 2, fy - 3, bw - 4, 6);
          }
        } else {
          const r = fixture.type === 'moving_head' ? 9 : 7;
          ctx.fillStyle = '#0F172A';
          ctx.strokeStyle = isSelected ? '#38BDF8' : 'rgba(255,255,255,0.3)';
          ctx.lineWidth = isSelected ? 2.2 : 1.2;
          ctx.beginPath();
          ctx.arc(fx, fy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (out && dim > 0.02) {
            ctx.fillStyle = `rgba(${out.r}, ${out.g}, ${out.b}, ${Math.max(0.35, dim)})`;
            ctx.beginPath();
            ctx.arc(fx, fy, r * 0.58, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      });

      // 7. Beat meter micro bar at top-right inside canvas
      const beatProg = beatProgressRef.current;
      const audioLvl = audioEnergyRef.current;
      const barW = 76;
      const barX = w - barW - 14;
      const barY = 14;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillRect(barX, barY, barW, 6);
      ctx.fillStyle = audioLvl > 0.1 ? '#F59E0B' : '#0EA5E9';
      ctx.fillRect(barX, barY, barW * (1 - beatProg), 6);

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [fixtures, outputsRef, selectedFixtureId, blackout, smokeActive, beatProgressRef, audioEnergyRef]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    let closestId: string | null = null;
    let minDist = 0.065;
    fixtures.forEach((f) => {
      const d = Math.hypot(f.xPos - nx, f.yPos - ny);
      if (d < minDist) {
        minDist = d;
        closestId = f.id;
      }
    });
    onSelectFixture(closestId);
  };

  const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId) || null;
  const selectedOutput = selectedFixture
    ? outputsRef.current.find((o) => o.fixtureId === selectedFixture.id)
    : null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#05070C]">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="block h-[220px] w-full cursor-crosshair sm:h-[265px] lg:h-[290px]"
        aria-label={t.stageAriaLabel}
      />

      {/* Top-left crisp unboxed stage telemetry */}
      <div className="pointer-events-none absolute left-3.5 top-3 flex items-center gap-2 text-xs text-slate-300/90">
        <span className="font-medium text-white">{t.stageLiveTitle}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="font-mono-tabular">{t.stageFixturesCount(fixtures.length)}</span>
        <span aria-hidden="true" className="text-slate-600">·</span>
        <span className="font-mono-tabular">{bpm.toFixed(0)} BPM</span>
        {freeze && (
          <>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-medium text-sky-400">{t.stageFrozen}</span>
          </>
        )}
        {blackout && (
          <>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-medium text-rose-400">{t.stageBlackout}</span>
          </>
        )}
      </div>

      {/* Bottom selected fixture readout (only appears when user clicks a fixture) */}
      {selectedFixture && (
        <div className="absolute bottom-3 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0B101B]/90 px-3 py-2 text-xs backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2 text-slate-300">
            <span className="font-semibold text-white">{selectedFixture.name}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono-tabular text-sky-400">
              {t.stageChannelPrefix} {String(selectedFixture.dmxStart).padStart(3, '0')}–
              {String(selectedFixture.dmxStart + selectedFixture.channelCount - 1).padStart(3, '0')}
            </span>
            {selectedOutput && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="font-mono-tabular">
                  Pan {selectedOutput.panDeg}° / Tilt {selectedOutput.tiltDeg}°
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="font-mono-tabular">
                  Dim {Math.round(selectedOutput.dimmer * 100)}%
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onJumpToLiveEdit(selectedFixture.id)}
              className="rounded bg-sky-500/15 px-2.5 py-1 text-xs font-medium text-sky-300 hover:bg-sky-500/25 transition-colors whitespace-nowrap shrink-0"
            >
              {t.stageEditFixture}
            </button>
            <button
              type="button"
              onClick={() => onSelectFixture(null)}
              className="rounded px-2 py-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              {t.stageClose}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
