import {useState} from 'react';
import {COLOR_FX_CATALOG, QUICK_COLOR_SWATCHES} from '../engine/dmxEngine';
import {useLanguage} from '../i18n/LanguageContext';
import {ColorFxState} from '../types/dmx';

interface ColorFxPanelProps {
  colorFx: ColorFxState;
  onChange: (next: ColorFxState) => void;
}

export function ColorFxPanel({colorFx, onChange}: ColorFxPanelProps) {
  const {t} = useLanguage();
  const [editingSlot, setEditingSlot] = useState<0 | 1 | 2 | null>(null);

  const updateColorSlot = (slot: 0 | 1 | 2, hex: string) => {
    const nextColors: [string, string, string] = [...colorFx.colors] as [string, string, string];
    nextColors[slot] = hex;
    onChange({...colorFx, colors: nextColors});
  };

  const slotLabel = (slot: 0 | 1 | 2) =>
    slot === 0 ? t.slotPrimary : slot === 1 ? t.slotSecondary : t.slotAccent;

  return (
    <section
      aria-label={t.colorFxAriaLabel}
      className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#101624] p-4"
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-white">{t.colorFxTitle}</h2>
            <p className="text-xs text-slate-400">{t.colorFxSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({...colorFx, enabled: !colorFx.enabled})}
            className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              colorFx.enabled
                ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {colorFx.enabled ? t.statusActive : t.statusOff}
          </button>
        </div>

        {/* Palette Swatches */}
        <div className="mb-3 rounded-lg border border-white/8 bg-[#151D2E] p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-300">{t.livePalette}</span>
            <div className="flex items-center gap-2">
              {([0, 1, 2] as const).map((slot) => {
                const label = slotLabel(slot);
                const isEditing = editingSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setEditingSlot(isEditing ? null : slot)}
                    title={t.selectColorSlotAria(label)}
                    aria-label={t.selectColorSlotAria(label)}
                    className={`flex h-8 w-10 items-center justify-center rounded-md border transition-transform active:scale-95 ${
                      isEditing ? 'border-white ring-2 ring-amber-400/50' : 'border-white/20'
                    }`}
                    style={{backgroundColor: colorFx.colors[slot]}}
                  />
                );
              })}
            </div>
          </div>

          {editingSlot !== null && (
            <div className="mt-2.5 border-t border-white/8 pt-2.5">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span>{t.swatchLabel(slotLabel(editingSlot))}</span>
                <label className="flex cursor-pointer items-center gap-1.5 text-slate-200 hover:text-white">
                  <span>{t.customColor}</span>
                  <input
                    type="color"
                    value={colorFx.colors[editingSlot]}
                    onChange={(e) => updateColorSlot(editingSlot, e.target.value)}
                    className="h-5 w-7 cursor-pointer rounded border border-white/20 bg-transparent p-0"
                  />
                </label>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {QUICK_COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => updateColorSlot(editingSlot, hex)}
                    aria-label={t.setColorAria(hex)}
                    className={`h-7 rounded border transition-transform hover:scale-105 ${
                      colorFx.colors[editingSlot].toUpperCase() === hex.toUpperCase()
                        ? 'border-white ring-1 ring-white'
                        : 'border-white/15'
                    }`}
                    style={{backgroundColor: hex}}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 8 Color FX Pads */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
          {COLOR_FX_CATALOG.map((item) => {
            const isSelected = colorFx.pattern === item.id;
            const customPreview =
              item.id === 'dual_chase'
                ? `linear-gradient(135deg, ${colorFx.colors[0]} 0%, ${colorFx.colors[0]} 48%, ${colorFx.colors[1]} 52%, ${colorFx.colors[1]} 100%)`
                : item.id === 'split'
                  ? `linear-gradient(90deg, ${colorFx.colors[0]} 0%, ${colorFx.colors[0]} 50%, ${colorFx.colors[1]} 50%, ${colorFx.colors[1]} 100%)`
                  : item.id === 'static_wash'
                    ? `linear-gradient(135deg, ${colorFx.colors[0]}, ${colorFx.colors[0]})`
                    : item.previewGradient;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange({...colorFx, pattern: item.id, enabled: true})}
                className={`flex min-h-[68px] flex-col items-center justify-center gap-2 rounded-lg border px-2 py-2.5 text-center transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isSelected && colorFx.enabled
                    ? 'border-amber-500 bg-amber-500/12 text-white shadow-[inset_0_0_16px_rgba(245,158,11,0.18)]'
                    : 'border-white/8 bg-[#151D2E] text-slate-300 hover:border-white/20 hover:bg-[#192338]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-3.5 w-11 rounded-sm border border-white/15"
                  style={{background: customPreview}}
                />
                <span className="text-xs font-medium leading-tight truncate max-w-full">
                  {t.colorPatterns[item.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color FX Sliders */}
      <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <label htmlFor="color-speed" className="font-medium text-slate-300">
              {t.sliderSpeed}
            </label>
            <span className="font-mono-tabular text-amber-300">{colorFx.speed}%</span>
          </div>
          <input
            id="color-speed"
            type="range"
            min={0}
            max={100}
            value={colorFx.speed}
            onChange={(e) => onChange({...colorFx, speed: Number(e.target.value)})}
            className="console-slider w-full"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <label htmlFor="color-fade" className="font-medium text-slate-300">
              {t.sliderFadeSmooth}
            </label>
            <span className="font-mono-tabular text-amber-300">{colorFx.fade}%</span>
          </div>
          <input
            id="color-fade"
            type="range"
            min={0}
            max={100}
            value={colorFx.fade}
            onChange={(e) => onChange({...colorFx, fade: Number(e.target.value)})}
            className="console-slider w-full"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <label htmlFor="color-shift" className="font-medium text-slate-300">
              {t.sliderPhaseShift}
            </label>
            <span className="font-mono-tabular text-amber-300">{colorFx.shift}%</span>
          </div>
          <input
            id="color-shift"
            type="range"
            min={0}
            max={100}
            value={colorFx.shift}
            onChange={(e) => onChange({...colorFx, shift: Number(e.target.value)})}
            className="console-slider w-full"
          />
        </div>
      </div>
    </section>
  );
}
