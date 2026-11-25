import {MOVE_FX_CATALOG} from '../engine/dmxEngine';
import {useLanguage} from '../i18n/LanguageContext';
import {MoveFxPattern, MoveFxState} from '../types/dmx';

interface MoveFxPanelProps {
  moveFx: MoveFxState;
  onChange: (next: MoveFxState) => void;
}

function MovePatternSvg({pattern, active}: {pattern: MoveFxPattern; active: boolean}) {
  const stroke = active ? '#38BDF8' : '#94A3B8';
  switch (pattern) {
    case 'circle':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="2">
          <circle cx="18" cy="18" r="10" />
          <circle cx="28" cy="18" r="2" fill={stroke} />
        </svg>
      );
    case 'figure8':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="2">
          <path d="M8 18c0-5 5-8 10 0s10 5 10 0-5-8-10 0-10 5-10 0z" />
        </svg>
      );
    case 'pan_sweep':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="2">
          <line x1="6" y1="18" x2="30" y2="18" strokeLinecap="round" />
          <polyline points="11,13 6,18 11,23" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="25,13 30,18 25,23" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'tilt_wave':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="2">
          <line x1="18" y1="6" x2="18" y2="30" strokeLinecap="round" />
          <polyline points="13,11 18,6 23,11" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="13,25 18,30 23,25" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'cross':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="2">
          <line x1="8" y1="8" x2="28" y2="28" strokeLinecap="round" />
          <line x1="28" y1="8" x2="8" y2="28" strokeLinecap="round" />
        </svg>
      );
    case 'ballyhoo':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="2">
          <path d="M7 22c3-11 9-12 11-3s8 9 11-5" strokeLinecap="round" />
          <path d="M7 14c4 9 10 10 12 1s7-9 10 6" strokeLinecap="round" opacity="0.55" />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="2">
          <polygon points="18,6 30,18 18,30 6,18" strokeLinejoin="round" />
        </svg>
      );
    case 'snap_home':
      return (
        <svg viewBox="0 0 36 36" className="h-7 w-7" fill="none" stroke={stroke} strokeWidth="2">
          <circle cx="18" cy="18" r="3" fill={stroke} />
          <path d="M18 5v6M18 25v6M5 18h6M25 18h6" strokeLinecap="round" />
        </svg>
      );
  }
}

export function MoveFxPanel({moveFx, onChange}: MoveFxPanelProps) {
  const {t} = useLanguage();

  return (
    <section
      aria-label={t.moveFxAriaLabel}
      className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#101624] p-4"
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-white">{t.moveFxTitle}</h2>
            <p className="text-xs text-slate-400">{t.moveFxSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({...moveFx, enabled: !moveFx.enabled})}
            className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              moveFx.enabled
                ? 'border-sky-500/60 bg-sky-500/15 text-sky-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {moveFx.enabled ? t.statusActive : t.statusOff}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {MOVE_FX_CATALOG.map((item) => {
            const isSelected = moveFx.pattern === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange({...moveFx, pattern: item.id, enabled: true})}
                className={`group flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-center transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  isSelected && moveFx.enabled
                    ? 'border-sky-500 bg-sky-500/12 text-white shadow-[inset_0_0_16px_rgba(14,165,233,0.18)]'
                    : 'border-white/8 bg-[#151D2E] text-slate-300 hover:border-white/20 hover:bg-[#192338]'
                }`}
              >
                <MovePatternSvg pattern={item.id} active={isSelected && moveFx.enabled} />
                <span className="text-xs font-medium leading-tight truncate max-w-full">
                  {t.movePatterns[item.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <label htmlFor="move-speed" className="font-medium text-slate-300">
              {t.sliderSpeed}
            </label>
            <span className="font-mono-tabular text-sky-300">{moveFx.speed}%</span>
          </div>
          <input
            id="move-speed"
            type="range"
            min={0}
            max={100}
            value={moveFx.speed}
            onChange={(e) => onChange({...moveFx, speed: Number(e.target.value)})}
            className="console-slider w-full"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <label htmlFor="move-size" className="font-medium text-slate-300">
              {t.sliderSize}
            </label>
            <span className="font-mono-tabular text-sky-300">{moveFx.size}%</span>
          </div>
          <input
            id="move-size"
            type="range"
            min={0}
            max={100}
            value={moveFx.size}
            onChange={(e) => onChange({...moveFx, size: Number(e.target.value)})}
            className="console-slider w-full"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <label htmlFor="move-fan" className="font-medium text-slate-300">
              {t.sliderFan}
            </label>
            <span className="font-mono-tabular text-sky-300">
              {moveFx.fan > 0 ? `+${moveFx.fan}` : moveFx.fan}%
            </span>
          </div>
          <input
            id="move-fan"
            type="range"
            min={-100}
            max={100}
            value={moveFx.fan}
            onChange={(e) => onChange({...moveFx, fan: Number(e.target.value)})}
            className="console-slider w-full"
          />
        </div>
      </div>
    </section>
  );
}
