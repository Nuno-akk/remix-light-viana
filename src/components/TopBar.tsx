import {Settings} from 'lucide-react';
import {useLanguage} from '../i18n/LanguageContext';
import {ConsoleTab} from '../types/dmx';

interface TopBarProps {
  activeTab: ConsoleTab;
  onSelectTab: (tab: ConsoleTab) => void;
  onOpenSavePreset: () => void;
  onOpenSettings: () => void;
}

export function TopBar({
  activeTab,
  onSelectTab,
  onOpenSavePreset,
  onOpenSettings,
}: TopBarProps) {
  const {t} = useLanguage();

  const navItems: Array<{id: ConsoleTab; label: string}> = [
    {id: 'live', label: t.navLive},
    {id: 'bank', label: t.navBank},
    {id: 'fixtures', label: t.navFixtures},
    {id: 'edit', label: t.navEdit},
    {id: 'audio', label: t.navAudio},
    {id: 'network', label: t.navNetwork},
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A0E17]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-4 py-3 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('live')}
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
        >
          LightViana
        </button>

        <nav className="flex items-center gap-5 overflow-x-auto sm:gap-6" aria-label={t.navAriaLabel}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSettings}
            title={t.settingsButton}
            aria-label={t.settingsButton}
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#121929] px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-white/30 hover:text-white active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            <Settings className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden sm:inline">{t.settingsButton}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSavePreset}
            className="min-h-[40px] rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          >
            {t.savePresetButton}
          </button>
        </div>
      </div>
    </header>
  );
}
