import {useRef, useState} from 'react';
import {
  CloudFog,
  EyeOff,
  Flame,
  Pause,
  RotateCcw,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import {useLanguage} from '../i18n/LanguageContext';
import {AudioSourceMode, BeamFxState, FlashFxState, MoveFxState} from '../types/dmx';

interface FlashFxCenterProps {
  moveFx: MoveFxState;
  onChangeMoveFx: (next: MoveFxState) => void;
  flashFx: FlashFxState;
  onChangeFlashFx: (next: FlashFxState) => void;
  beamFx: BeamFxState;
  onChangeBeamFx: (next: BeamFxState) => void;
  bpm: number;
  onTapBpm: () => void;
  onChangeBpm: (bpm: number) => void;
  masterDimmer: number;
  onChangeMasterDimmer: (val: number) => void;
  audioMode: AudioSourceMode;
  onChangeAudioMode: (mode: AudioSourceMode) => void;
}

export function FlashFxCenter({
  moveFx,
  onChangeMoveFx,
  flashFx,
  onChangeFlashFx,
  beamFx,
  onChangeBeamFx,
  bpm,
  onTapBpm,
  onChangeBpm,
  masterDimmer,
  onChangeMasterDimmer,
  audioMode,
  onChangeAudioMode,
}: FlashFxCenterProps) {
  const {t} = useLanguage();
  const [latchFlash, setLatchFlash] = useState(false);
  const padRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const updateXyFromPointer = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xPct = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    const yPct = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));
    onChangeMoveFx({...moveFx, centerPan: xPct, centerTilt: yPct});
  };

  const handleMomentaryDown = (key: 'smoke' | 'blinder' | 'strobe') => {
    if (latchFlash) {
      onChangeFlashFx({...flashFx, [key]: !flashFx[key]});
    } else {
      onChangeFlashFx({...flashFx, [key]: true});
    }
  };

  const handleMomentaryUp = (key: 'smoke' | 'blinder' | 'strobe') => {
    if (!latchFlash) {
      onChangeFlashFx({...flashFx, [key]: false});
    }
  };

  return (
    <section
      aria-label={t.flashCenterAriaLabel}
      className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#101624] p-4"
    >
      {/* Top Bar inside Center Core: BPM Tap, Audio Mode, Master Dimmer */}
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-white/8 bg-[#151D2E] p-3 sm:grid-cols-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-slate-400">{t.tempoSync}</div>
            <div className="font-mono-tabular text-xl font-bold text-white">
              {bpm.toFixed(0)} <span className="text-xs font-normal text-slate-400">BPM</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onTapBpm}
              className="min-h-[40px] rounded-lg border border-sky-500/40 bg-sky-500/15 px-3.5 py-2 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/25 active:scale-95 whitespace-nowrap shrink-0"
            >
              TAP
            </button>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => onChangeBpm(Math.min(200, bpm + 1))}
                aria-label={t.increaseBpm}
                className="h-4.5 w-6 rounded bg-white/5 text-[10px] font-bold text-slate-300 hover:bg-white/15"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => onChangeBpm(Math.max(60, bpm - 1))}
                aria-label={t.decreaseBpm}
                className="h-4.5 w-6 rounded bg-white/5 text-[10px] font-bold text-slate-300 hover:bg-white/15"
              >
                -
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="master-dimmer" className="font-medium text-slate-300">
              {t.masterDimmerLabel}
            </label>
            <span className="font-mono-tabular text-white">{masterDimmer}%</span>
          </div>
          <input
            id="master-dimmer"
            type="range"
            min={0}
            max={100}
            value={masterDimmer}
            onChange={(e) => onChangeMasterDimmer(Number(e.target.value))}
            className="console-slider w-full"
          />
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-xs text-slate-400">{t.audioPulse}</span>
            <div className="flex items-center gap-1 rounded-md bg-[#0B101B] p-0.5">
              {(['off', 'synth', 'mic'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onChangeAudioMode(mode)}
                  className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                    audioMode === mode
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode === 'off' ? t.audioModeOff : mode === 'synth' ? t.audioModeSynth : t.audioModeMic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Flash FX Triggers + XY Position Pad */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Flash FX Buttons */}
        <div className="flex flex-col justify-between gap-2.5 md:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-white">{t.flashFxTitle}</h2>
            <div className="flex items-center gap-1 rounded-md bg-[#151D2E] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLatchFlash(false)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  !latchFlash ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.modeHold}
              </button>
              <button
                type="button"
                onClick={() => setLatchFlash(true)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  latchFlash ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.modeLatch}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Smoke */}
            <button
              type="button"
              onPointerDown={() => handleMomentaryDown('smoke')}
              onPointerUp={() => handleMomentaryUp('smoke')}
              onPointerLeave={() => {
                if (!latchFlash && flashFx.smoke) handleMomentaryUp('smoke');
              }}
              className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all active:scale-[0.97] select-none ${
                flashFx.smoke
                  ? 'border-sky-400 bg-sky-500/25 text-white shadow-[0_0_20px_rgba(56,189,248,0.28)]'
                  : 'border-white/10 bg-[#151D2E] text-slate-200 hover:border-white/20 hover:bg-[#1B253A]'
              }`}
            >
              <CloudFog className="h-5 w-5 text-sky-300" />
              <span>{t.flashSmoke}</span>
            </button>

            {/* Blinder */}
            <button
              type="button"
              onPointerDown={() => handleMomentaryDown('blinder')}
              onPointerUp={() => handleMomentaryUp('blinder')}
              onPointerLeave={() => {
                if (!latchFlash && flashFx.blinder) handleMomentaryUp('blinder');
              }}
              className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all active:scale-[0.97] select-none ${
                flashFx.blinder
                  ? 'border-amber-300 bg-amber-400/30 text-white shadow-[0_0_24px_rgba(251,191,36,0.38)]'
                  : 'border-white/10 bg-[#151D2E] text-slate-200 hover:border-white/20 hover:bg-[#1B253A]'
              }`}
            >
              <Sun className="h-5 w-5 text-amber-300" />
              <span>{t.flashBlinder}</span>
            </button>

            {/* Strobe */}
            <button
              type="button"
              onPointerDown={() => handleMomentaryDown('strobe')}
              onPointerUp={() => handleMomentaryUp('strobe')}
              onPointerLeave={() => {
                if (!latchFlash && flashFx.strobe) handleMomentaryUp('strobe');
              }}
              className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all active:scale-[0.97] select-none ${
                flashFx.strobe
                  ? 'border-white bg-white/25 text-white shadow-[0_0_24px_rgba(255,255,255,0.35)]'
                  : 'border-white/10 bg-[#151D2E] text-slate-200 hover:border-white/20 hover:bg-[#1B253A]'
              }`}
            >
              <Zap className="h-5 w-5 text-white" />
              <span>{t.flashStrobe}</span>
            </button>
          </div>

          {/* Strobe Rate Slider + Freeze / Blackout */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onChangeFlashFx({...flashFx, freeze: !flashFx.freeze})}
              className={`flex min-h-[48px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                flashFx.freeze
                  ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                  : 'border-white/10 bg-[#151D2E] text-slate-300 hover:border-white/20'
              }`}
            >
              <Pause className="h-4 w-4" />
              <span>{flashFx.freeze ? t.freezeActive : t.freezeIdle}</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeFlashFx({...flashFx, blackout: !flashFx.blackout})}
              className={`flex min-h-[48px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                flashFx.blackout
                  ? 'border-rose-500 bg-rose-500/25 text-rose-200 shadow-[0_0_18px_rgba(239,68,68,0.28)]'
                  : 'border-white/10 bg-[#151D2E] text-slate-300 hover:border-rose-500/40'
              }`}
            >
              <EyeOff className="h-4 w-4" />
              <span>{flashFx.blackout ? t.blackoutActive : t.blackoutIdle}</span>
            </button>
          </div>

          <div className="pt-1">
            <div className="mb-1 flex items-center justify-between text-xs">
              <label htmlFor="strobe-rate" className="text-slate-400">
                {t.strobeRate}
              </label>
              <span className="font-mono-tabular text-slate-200">{flashFx.strobeRate} Hz</span>
            </div>
            <input
              id="strobe-rate"
              type="range"
              min={2}
              max={24}
              value={flashFx.strobeRate}
              onChange={(e) => onChangeFlashFx({...flashFx, strobeRate: Number(e.target.value)})}
              className="console-slider w-full"
            />
          </div>
        </div>

        {/* Pan/Tilt Center Offset XY Pad */}
        <div className="flex flex-col justify-between gap-2 md:col-span-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200">{t.panTiltCenter}</span>
            <button
              type="button"
              onClick={() => onChangeMoveFx({...moveFx, centerPan: 50, centerTilt: 50})}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              <span>{t.centerAction}</span>
            </button>
          </div>

          <div
            ref={padRef}
            onPointerDown={(e) => {
              draggingRef.current = true;
              (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              updateXyFromPointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (draggingRef.current) {
                updateXyFromPointer(e.clientX, e.clientY);
              }
            }}
            onPointerUp={() => {
              draggingRef.current = false;
            }}
            className="relative h-40 w-full cursor-crosshair touch-none overflow-hidden rounded-lg border border-white/10 bg-[#080B12]"
            role="application"
            aria-label={t.panTiltPadAria}
          >
            {/* Crosshair grid */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
              <div
                className="absolute h-px w-full bg-sky-500/35"
                style={{top: `${moveFx.centerTilt}%`}}
              />
              <div
                className="absolute top-0 bottom-0 w-px bg-sky-500/35"
                style={{left: `${moveFx.centerPan}%`}}
              />
              <div
                className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-400 bg-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.65)]"
                style={{left: `${moveFx.centerPan}%`, top: `${moveFx.centerTilt}%`}}
              />
            </div>

            <div className="pointer-events-none absolute bottom-1.5 left-2 right-2 flex justify-between font-mono-tabular text-[11px] text-slate-400">
              <span>X {moveFx.centerPan - 50}</span>
              <span>Y {moveFx.centerTilt - 50}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom inside Center Core: Beam FX Quick Modifiers */}
      <div className="rounded-lg border border-white/8 bg-[#151D2E] p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-200">{t.beamFxTitle}</span>
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="beam-spread" className="text-slate-400">
              {t.zoomLabel}
            </label>
            <input
              id="beam-spread"
              type="range"
              min={10}
              max={100}
              value={beamFx.beamSpread}
              onChange={(e) => onChangeBeamFx({...beamFx, beamSpread: Number(e.target.value)})}
              className="console-slider w-24"
            />
            <span className="font-mono-tabular w-8 text-right text-slate-200">
              {beamFx.beamSpread}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onChangeBeamFx({...beamFx, goboSpin: !beamFx.goboSpin})}
            className={`min-h-[40px] rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              beamFx.goboSpin
                ? 'border-sky-500/70 bg-sky-500/20 text-sky-200'
                : 'border-white/8 bg-[#101624] text-slate-400 hover:text-white'
            }`}
          >
            {t.goboSpin}
          </button>

          <button
            type="button"
            onClick={() => onChangeBeamFx({...beamFx, prism: !beamFx.prism})}
            className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              beamFx.prism
                ? 'border-sky-500/70 bg-sky-500/20 text-sky-200'
                : 'border-white/8 bg-[#101624] text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t.prism3x}</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeBeamFx({...beamFx, irisPulse: !beamFx.irisPulse})}
            className={`min-h-[40px] rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              beamFx.irisPulse
                ? 'border-amber-500/70 bg-amber-500/20 text-amber-200'
                : 'border-white/8 bg-[#101624] text-slate-400 hover:text-white'
            }`}
          >
            {t.irisPulse}
          </button>

          <button
            type="button"
            onClick={() => onChangeBeamFx({...beamFx, uvMode: !beamFx.uvMode})}
            className={`flex min-h-[40px] items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              beamFx.uvMode
                ? 'border-indigo-400 bg-indigo-500/25 text-indigo-200'
                : 'border-white/8 bg-[#101624] text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>{t.uvLight}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
