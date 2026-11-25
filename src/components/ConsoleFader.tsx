import {useCallback, useRef} from 'react';
import {useLanguage} from '../i18n/LanguageContext';

export type FaderAccent = 'sky' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'white';

interface ConsoleFaderProps {
  label: string;
  sublabel?: string;
  value: number;
  min?: number;
  max?: number;
  defaultValue?: number;
  unit?: string;
  accent?: FaderAccent;
  heightClass?: string;
  widthClass?: string;
  muted?: boolean;
  isOverridden?: boolean;
  colorDot?: string;
  onChange: (next: number) => void;
  onReset?: () => void;
  footer?: React.ReactNode;
}

const ACCENT_STYLES: Record<
  FaderAccent,
  {fill: string; capBorder: string; capLine: string; text: string}
> = {
  sky: {
    fill: 'bg-sky-500/80',
    capBorder: 'border-sky-400/70',
    capLine: 'bg-sky-300',
    text: 'text-sky-300',
  },
  amber: {
    fill: 'bg-amber-500/80',
    capBorder: 'border-amber-400/70',
    capLine: 'bg-amber-300',
    text: 'text-amber-300',
  },
  emerald: {
    fill: 'bg-emerald-500/80',
    capBorder: 'border-emerald-400/70',
    capLine: 'bg-emerald-300',
    text: 'text-emerald-300',
  },
  rose: {
    fill: 'bg-rose-500/80',
    capBorder: 'border-rose-400/70',
    capLine: 'bg-rose-300',
    text: 'text-rose-300',
  },
  indigo: {
    fill: 'bg-indigo-500/80',
    capBorder: 'border-indigo-400/70',
    capLine: 'bg-indigo-300',
    text: 'text-indigo-300',
  },
  white: {
    fill: 'bg-slate-200/85',
    capBorder: 'border-white/70',
    capLine: 'bg-white',
    text: 'text-white',
  },
};

export function ConsoleFader({
  label,
  sublabel,
  value,
  min = 0,
  max = 100,
  defaultValue,
  unit = '%',
  accent = 'sky',
  heightClass = 'h-44',
  widthClass = 'w-[76px]',
  muted = false,
  isOverridden = false,
  colorDot,
  onChange,
  onReset,
  footer,
}: ConsoleFaderProps) {
  const {t} = useLanguage();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const clampedVal = Math.max(min, Math.min(max, value));
  const ratio = max > min ? (clampedVal - min) / (max - min) : 0;
  const pct = Math.max(0, Math.min(100, ratio * 100));
  const style = ACCENT_STYLES[accent];

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pad = 12; // half fader cap height margin
      const usable = Math.max(1, rect.height - pad * 2);
      const yFromBottom = rect.bottom - pad - clientY;
      const norm = Math.max(0, Math.min(1, yFromBottom / usable));
      const next = Math.round(min + norm * (max - min));
      onChange(next);
    },
    [max, min, onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = max > 100 ? 5 : 2;
    const bigStep = max > 100 ? 25 : 10;
    let next: number | null = null;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = clampedVal + step;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = clampedVal - step;
    else if (e.key === 'PageUp') next = clampedVal + bigStep;
    else if (e.key === 'PageDown') next = clampedVal - bigStep;
    else if (e.key === 'Home') next = min;
    else if (e.key === 'End') next = max;

    if (next !== null) {
      e.preventDefault();
      onChange(Math.max(min, Math.min(max, next)));
    }
  };

  return (
    <div
      className={`flex shrink-0 flex-col items-center rounded-lg border px-2 py-2.5 transition-colors ${widthClass} ${
        isOverridden
          ? 'border-amber-500/45 bg-[#151B2B]'
          : 'border-white/8 bg-[#0C121E]'
      }`}
    >
      {/* Top numeric readout */}
      <div className="mb-1.5 flex w-full items-center justify-between gap-1 px-0.5">
        {colorDot ? (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm border border-white/20"
            style={{backgroundColor: colorDot}}
            aria-hidden="true"
          />
        ) : (
          <span className="w-1" />
        )}
        <span
          className={`font-mono-tabular text-xs font-bold ${
            muted ? 'text-slate-500 line-through' : style.text
          }`}
        >
          {clampedVal}
          {unit}
        </span>
      </div>

      {/* Vertical Fader Track */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clampedVal}
        onKeyDown={handleKeyDown}
        onDoubleClick={() => {
          if (onReset) onReset();
          else if (typeof defaultValue === 'number') onChange(defaultValue);
        }}
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
          updateFromClientY(e.clientY);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) {
            updateFromClientY(e.clientY);
          }
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
        className={`relative flex ${heightClass} w-11 cursor-ns-resize touch-none select-none items-center justify-center rounded-md border border-white/5 bg-[#070A10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500`}
        title={t.faderTooltip}
      >
        {/* Console Tick Marks */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-3 left-1.5 right-1.5 flex flex-col justify-between"
        >
          {[0, 1, 2, 3, 4].map((tick) => (
            <div key={tick} className="flex w-full items-center justify-between">
              <span className="h-px w-1.5 bg-slate-600/70" />
              <span className="h-px w-1.5 bg-slate-600/70" />
            </div>
          ))}
        </div>

        {/* Center Slot Groove */}
        <div
          aria-hidden="true"
          className="pointer-events-none relative h-[calc(100%-24px)] w-2 overflow-hidden rounded-full bg-slate-900 ring-1 ring-white/10"
        >
          <div
            className={`absolute bottom-0 left-0 right-0 rounded-full transition-[opacity] ${
              muted ? 'bg-slate-600/40' : style.fill
            }`}
            style={{height: `${pct}%`}}
          />
        </div>

        {/* Tactile Fader Cap inside 12px-padded travel zone */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-3 left-1 right-1"
        >
          <div
            className={`absolute left-0 right-0 flex h-6 -translate-y-1/2 items-center justify-center rounded border bg-gradient-to-b from-[#2A344B] to-[#141A29] shadow-[0_3px_8px_rgba(0,0,0,0.75)] ${
              muted ? 'border-slate-600' : style.capBorder
            }`}
            style={{
              top: `${100 - pct}%`,
            }}
          >
            <span
              className={`h-0.5 w-6 rounded-full ${muted ? 'bg-slate-500' : style.capLine}`}
            />
          </div>
        </div>
      </div>

      {/* Label & Sublabel */}
      <div className="mt-2 w-full text-center">
        <div className="truncate text-[11px] font-semibold text-slate-200" title={label}>
          {label}
        </div>
        {sublabel && (
          <div className="truncate font-mono-tabular text-[10px] text-slate-500" title={sublabel}>
            {sublabel}
          </div>
        )}
      </div>

      {/* Optional Footer Controls (Mute / Flash / Release) */}
      {footer && <div className="mt-2 w-full">{footer}</div>}
    </div>
  );
}
