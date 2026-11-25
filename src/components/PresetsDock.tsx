import {Plus, Trash2} from 'lucide-react';
import {useLanguage} from '../i18n/LanguageContext';
import {ShowPreset} from '../types/dmx';

interface PresetsDockProps {
  presets: ShowPreset[];
  activePresetId: string | null;
  onSelectPreset: (preset: ShowPreset) => void;
  onDeletePreset: (id: string) => void;
  onOpenSaveModal: () => void;
}

export function PresetsDock({
  presets,
  activePresetId,
  onSelectPreset,
  onDeletePreset,
  onOpenSaveModal,
}: PresetsDockProps) {
  const {t} = useLanguage();

  return (
    <section
      aria-label={t.presetsAriaLabel}
      className="rounded-xl border border-white/10 bg-[#101624] p-3.5"
    >
      <div className="mb-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <h2 className="font-display text-sm font-semibold text-white">{t.presetsTitle}</h2>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">{t.presetsCount(presets.length)}</span>
        </div>

        <button
          type="button"
          onClick={onOpenSaveModal}
          className="flex min-h-[34px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-sky-500/40 hover:text-white whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5 text-sky-400" />
          <span>{t.saveCurrentPreset}</span>
        </button>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;
          const moveLabel = t.movePatterns[preset.moveFx.pattern] ?? preset.moveFx.pattern;
          const primaryColor = preset.colorFx.colors[0] || '#0EA5E9';
          const secondaryColor = preset.colorFx.colors[1] || '#F59E0B';

          return (
            <div
              key={preset.id}
              className={`group relative flex min-w-[168px] max-w-[190px] shrink-0 flex-col justify-between overflow-hidden rounded-lg border transition-all ${
                isActive
                  ? 'border-sky-500 bg-[#182236] shadow-[0_0_16px_rgba(14,165,233,0.18)]'
                  : 'border-white/8 bg-[#151D2E] hover:border-white/20 hover:bg-[#192338]'
              }`}
            >
              {/* Top color bar */}
              <div
                aria-hidden="true"
                className="h-1.5 w-full"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                }}
              />

              <button
                type="button"
                onClick={() => onSelectPreset(preset)}
                className="flex w-full flex-col items-start px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
              >
                <span className="w-full truncate text-xs font-semibold text-white">
                  {preset.name}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 truncate w-full">
                  <span className="font-mono-tabular">{preset.bpm} BPM</span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{moveLabel}</span>
                </span>
              </button>

              {preset.isCustom && (
                <button
                  type="button"
                  onClick={() => onDeletePreset(preset.id)}
                  aria-label={t.deletePresetAria(preset.name)}
                  className="absolute right-1.5 top-2.5 hidden rounded p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
