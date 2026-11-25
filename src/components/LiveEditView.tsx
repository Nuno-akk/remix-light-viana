import {useRef} from 'react';
import {RotateCcw} from 'lucide-react';
import {QUICK_COLOR_SWATCHES} from '../engine/dmxEngine';
import {Fixture, ManualOverride} from '../types/dmx';
import {useLanguage} from '../i18n/LanguageContext';

interface LiveEditViewProps {
  fixtures: Fixture[];
  selectedFixtureId: string | null;
  onSelectFixture: (id: string) => void;
  onChangeFixtures: (next: Fixture[]) => void;
}

const DEFAULT_OVERRIDE: ManualOverride = {
  active: true,
  pan: 50,
  tilt: 50,
  dimmer: 100,
  color: '#38BDF8',
};

export function LiveEditView({
  fixtures,
  selectedFixtureId,
  onSelectFixture,
  onChangeFixtures,
}: LiveEditViewProps) {
  const {t} = useLanguage();
  const activeId = selectedFixtureId || fixtures[0]?.id || '';
  const activeFixture = fixtures.find((f) => f.id === activeId) || fixtures[0];
  const padRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  if (!activeFixture) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#101624] p-8 text-center text-sm text-slate-400">
        {t.liveEditNoFixtures}
      </div>
    );
  }

  const currentOverride: ManualOverride = activeFixture.manualOverride ?? {
    ...DEFAULT_OVERRIDE,
    active: false,
  };

  const updateActiveOverride = (patch: Partial<ManualOverride>) => {
    onChangeFixtures(
      fixtures.map((f) => {
        if (f.id !== activeFixture.id) return f;
        return {
          ...f,
          manualOverride: {
            ...(f.manualOverride ?? DEFAULT_OVERRIDE),
            ...patch,
          },
        };
      }),
    );
  };

  const handlePadPointer = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pan = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    const tilt = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));
    updateActiveOverride({active: true, pan, tilt});
  };

  const releaseAllOverrides = () => {
    onChangeFixtures(
      fixtures.map((f) =>
        f.manualOverride ? {...f, manualOverride: {...f.manualOverride, active: false}} : f,
      ),
    );
  };

  const overriddenCount = fixtures.filter((f) => f.manualOverride?.active).length;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left: Fixture Selector List */}
      <section className="rounded-xl border border-white/10 bg-[#101624] p-4 lg:col-span-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              {t.selectFixtureTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {overriddenCount > 0
                ? t.manualControlCount(overriddenCount)
                : t.allFollowingFx}
            </p>
          </div>
          {overriddenCount > 0 && (
            <button
              type="button"
              onClick={releaseAllOverrides}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#151D2E] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t.releaseAllBtn}</span>
            </button>
          )}
        </div>

        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {fixtures.map((f) => {
            const isSelected = f.id === activeFixture.id;
            const isManual = Boolean(f.manualOverride?.active);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectFixture(f.id)}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border-sky-500 bg-sky-500/12 text-white'
                    : 'border-white/8 bg-[#151D2E] text-slate-300 hover:border-white/20'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{f.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono-tabular">
                    CH {String(f.dmxStart).padStart(3, '0')} · {f.model}
                  </div>
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    isManual ? 'text-amber-300' : 'text-slate-500'
                  }`}
                >
                  {isManual ? 'Manual' : 'FX'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Right: Manual Pan/Tilt XY Pad + Dimmer & Color */}
      <section className="rounded-xl border border-white/10 bg-[#101624] p-4 lg:col-span-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              {activeFixture.name} — {t.liveEditTitleSuffix}
            </h2>
            <p className="text-xs text-slate-400">
              {t.liveEditSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => updateActiveOverride({active: !currentOverride.active})}
            className={`min-h-[38px] rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              currentOverride.active
                ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                : 'border-white/10 bg-[#151D2E] text-slate-300 hover:text-white'
            }`}
          >
            {currentOverride.active ? t.manualControlActive : t.enableManualControl}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* XY Pan / Tilt Pad */}
          <div>
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">{t.manualPanTiltLabel}</span>
              <span className="font-mono-tabular text-sky-300">
                Pan {Math.round((currentOverride.pan - 50) * 5.4)}° · Tilt{' '}
                {Math.round((currentOverride.tilt - 50) * 2.7)}°
              </span>
            </div>
            <div
              ref={padRef}
              onPointerDown={(e) => {
                draggingRef.current = true;
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                handlePadPointer(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (draggingRef.current) handlePadPointer(e.clientX, e.clientY);
              }}
              onPointerUp={() => {
                draggingRef.current = false;
              }}
              className="relative h-64 w-full cursor-crosshair touch-none overflow-hidden rounded-lg border border-white/10 bg-[#080B12]"
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
                <div
                  className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/35 shadow-[0_0_14px_rgba(245,158,11,0.65)]"
                  style={{left: `${currentOverride.pan}%`, top: `${currentOverride.tilt}%`}}
                />
              </div>
            </div>
          </div>

          {/* Dimmer & Color Controls */}
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <label htmlFor="live-edit-dimmer" className="font-medium text-slate-300">
                    {t.fixtureDimmerLabel}
                  </label>
                  <span className="font-mono-tabular text-white">{currentOverride.dimmer}%</span>
                </div>
                <input
                  id="live-edit-dimmer"
                  type="range"
                  min={0}
                  max={100}
                  value={currentOverride.dimmer}
                  onChange={(e) =>
                    updateActiveOverride({active: true, dimmer: Number(e.target.value)})
                  }
                  className="console-slider w-full"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">{t.fixtureColorLabel}</span>
                  <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                    <span className="font-mono-tabular">{currentOverride.color.toUpperCase()}</span>
                    <input
                      type="color"
                      value={currentOverride.color}
                      onChange={(e) =>
                        updateActiveOverride({active: true, color: e.target.value})
                      }
                      className="h-6 w-8 cursor-pointer rounded border border-white/20 bg-transparent p-0"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {QUICK_COLOR_SWATCHES.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => updateActiveOverride({active: true, color: hex})}
                      aria-label={`${t.fixtureColorLabel} ${hex}`}
                      className={`h-9 rounded-md border transition-transform hover:scale-105 ${
                        currentOverride.color.toUpperCase() === hex.toUpperCase()
                          ? 'border-white ring-1 ring-white'
                          : 'border-white/15'
                      }`}
                      style={{backgroundColor: hex}}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-white/8 bg-[#0B101B] p-3 text-xs text-slate-400">
              {t.liveEditTip}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
