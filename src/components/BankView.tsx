import {useState} from 'react';
import {
  Check,
  Copy,
  FolderPlus,
  History,
  Layers,
  Pencil,
  Play,
  Plus,
  Redo2,
  RefreshCw,
  Sliders,
  Square,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import {QUICK_COLOR_SWATCHES} from '../engine/dmxEngine';
import {UndoHistoryEntry} from '../hooks/useBankUndoRedo';
import {useLanguage} from '../i18n/LanguageContext';
import {
  AudioSourceMode,
  BankScene,
  BeamFxState,
  ColorFxState,
  Fixture,
  FixtureComputedOutput,
  FlashFxState,
  GroupDimmerState,
  MoveFxState,
  SceneBank,
} from '../types/dmx';
import {ColorFxPanel} from './ColorFxPanel';
import {FaderWingPanel} from './FaderWingPanel';
import {FlashFxCenter} from './FlashFxCenter';
import {MoveFxPanel} from './MoveFxPanel';

interface BankViewProps {
  banks: SceneBank[];
  activeBankId: string | null;
  activeSceneId: string | null;
  autoCycleBeats: number; // 0 = off, 4 | 8 | 16
  onChangeAutoCycleBeats: (beats: number) => void;
  onSelectBank: (bankId: string) => void;
  onCreateBank: (name: string, color: string) => void;
  onDeleteBank: (bankId: string) => void;
  onTriggerScene: (bankId: string, scene: BankScene) => void;
  onCreateSceneInBank: (bankId: string, name: string, colorTag: string) => void;
  onOverwriteSceneInBank: (bankId: string, sceneId: string) => void;
  onUpdateSceneMetaInBank: (
    bankId: string,
    sceneId: string,
    name: string,
    colorTag: string,
  ) => void;
  onDuplicateSceneInBank: (bankId: string, sceneId: string) => void;
  onDeleteSceneInBank: (bankId: string, sceneId: string) => void;

  // Undo / Redo for Bank Scene creation, editing, and console state recovery
  canUndo: boolean;
  canRedo: boolean;
  nextUndoLabel: string | null;
  nextRedoLabel: string | null;
  undoStack: UndoHistoryEntry[];
  redoStack: UndoHistoryEntry[];
  undoFeedback: string | null;
  onUndo: () => void;
  onRedo: () => void;
  onRestoreUndoIndex: (index: number) => void;

  // Live Console Engine props so the user can craft Scenes directly inside Bank
  fixtures: Fixture[];
  universeRef: React.MutableRefObject<Uint8Array>;
  outputsRef: React.MutableRefObject<FixtureComputedOutput[]>;
  moveFx: MoveFxState;
  onChangeMoveFx: (next: MoveFxState) => void;
  colorFx: ColorFxState;
  onChangeColorFx: (next: ColorFxState) => void;
  flashFx: FlashFxState;
  onChangeFlashFx: (next: FlashFxState) => void;
  beamFx: BeamFxState;
  onChangeBeamFx: (next: BeamFxState) => void;
  bpm: number;
  onTapBpm: () => void;
  onChangeBpm: (val: number) => void;
  masterDimmer: number;
  onChangeMasterDimmer: (val: number) => void;
  audioMode: AudioSourceMode;
  onChangeAudioMode: (mode: AudioSourceMode) => void;
  groupDimmers: GroupDimmerState;
  onChangeGroupDimmers: (next: GroupDimmerState) => void;
  fixtureDimmers: Record<string, number>;
  onChangeFixtureDimmer: (fixtureId: string, val: number) => void;
  onResetAllFixtureDimmers: () => void;
  fixtureMutes: Record<string, boolean>;
  onToggleFixtureMute: (fixtureId: string) => void;
  onUnmuteAllFixtures: () => void;
  fixtureFlashes: Record<string, boolean>;
  onSetFixtureFlash: (fixtureId: string, active: boolean) => void;
  fixtureColors: Record<string, string>;
  onChangeFixtureColor: (fixtureId: string, hex: string | null) => void;
  onClearAllFixtureColors: () => void;
  selectedFixtureId: string | null;
  onSelectFixture: (fixtureId: string) => void;
  rawDmxOverrides: Record<number, number>;
  onSetRawDmxOverride: (channel1Based: number, value: number | null) => void;
  onClearRawDmxOverrides: (channels?: number[]) => void;
}

const BANK_COLORS = ['#0EA5E9', '#F59E0B', '#10B981', '#F43F5E', '#8B5CF6', '#38BDF8'];

export function BankView({
  banks,
  activeBankId,
  activeSceneId,
  autoCycleBeats,
  onChangeAutoCycleBeats,
  onSelectBank,
  onCreateBank,
  onDeleteBank,
  onTriggerScene,
  onCreateSceneInBank,
  onOverwriteSceneInBank,
  onUpdateSceneMetaInBank,
  onDuplicateSceneInBank,
  onDeleteSceneInBank,
  canUndo,
  canRedo,
  nextUndoLabel,
  nextRedoLabel,
  undoStack,
  redoStack,
  undoFeedback,
  onUndo,
  onRedo,
  onRestoreUndoIndex,
  fixtures,
  universeRef,
  outputsRef,
  moveFx,
  onChangeMoveFx,
  colorFx,
  onChangeColorFx,
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
  groupDimmers,
  onChangeGroupDimmers,
  fixtureDimmers,
  onChangeFixtureDimmer,
  onResetAllFixtureDimmers,
  fixtureMutes,
  onToggleFixtureMute,
  onUnmuteAllFixtures,
  fixtureFlashes,
  onSetFixtureFlash,
  fixtureColors,
  onChangeFixtureColor,
  onClearAllFixtureColors,
  selectedFixtureId,
  onSelectFixture,
  rawDmxOverrides,
  onSetRawDmxOverride,
  onClearRawDmxOverrides,
}: BankViewProps) {
  const {language, t} = useLanguage();
  const currentBank = banks.find((b) => b.id === activeBankId) || banks[0] || null;

  const [newBankOpen, setNewBankOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankColor, setNewBankColor] = useState('#0EA5E9');

  const [newSceneName, setNewSceneName] = useState('');
  const [newSceneColor, setNewSceneColor] = useState('#0EA5E9');
  const [showBuilderDeck, setShowBuilderDeck] = useState(true);
  const [showFadersInBank, setShowFadersInBank] = useState(true);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editSceneName, setEditSceneName] = useState('');
  const [editSceneColor, setEditSceneColor] = useState('#0EA5E9');

  const handleSubmitBank = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBankName.trim();
    if (!clean) return;
    onCreateBank(clean, newBankColor);
    setNewBankName('');
    setNewBankOpen(false);
  };

  const handleSubmitScene = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBank) return;
    const fallbackName = `Scene ${currentBank.scenes.length + 1}`;
    const clean = newSceneName.trim() || fallbackName;
    onCreateSceneInBank(currentBank.id, clean, newSceneColor);
    setNewSceneName('');
  };

  const startEditingScene = (scene: BankScene) => {
    setEditingSceneId(scene.id);
    setEditSceneName(scene.name);
    setEditSceneColor(scene.colorTag);
  };

  const handleSaveSceneMeta = (e: React.FormEvent, bankId: string, sceneId: string) => {
    e.preventDefault();
    const clean = editSceneName.trim();
    if (!clean) return;
    onUpdateSceneMetaInBank(bankId, sceneId, clean, editSceneColor);
    setEditingSceneId(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Bank Tabs + Auto-Cycle + New Bank */}
      <section className="rounded-xl border border-white/10 bg-[#101624] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <h2 className="font-display text-base font-semibold text-white">
              {t.bankManagerTitle}
            </h2>
            <span className="text-xs text-slate-400">
              {t.bankManagerSubtitle}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Undo / Redo Controls */}
            <div className="flex items-center gap-1 rounded-lg bg-[#080B12] p-1 ring-1 ring-white/10">
              <button
                type="button"
                disabled={!canUndo}
                onClick={onUndo}
                title={
                  nextUndoLabel
                    ? t.undoTooltip(nextUndoLabel)
                    : t.undoNothingTooltip
                }
                className="flex min-h-[30px] items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 whitespace-nowrap shrink-0"
              >
                <Undo2 className="h-3.5 w-3.5 text-amber-300" />
                <span>{t.undoBtn}</span>
              </button>
              <button
                type="button"
                disabled={!canRedo}
                onClick={onRedo}
                title={
                  nextRedoLabel
                    ? t.redoTooltip(nextRedoLabel)
                    : t.redoNothingTooltip
                }
                className="flex min-h-[30px] items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 whitespace-nowrap shrink-0"
              >
                <Redo2 className="h-3.5 w-3.5 text-sky-300" />
                <span>{t.redoBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer((v) => !v)}
                title={t.historyTooltip}
                className={`flex min-h-[30px] items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  showHistoryDrawer
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span className="font-mono-tabular">
                  {undoStack.length}/{redoStack.length}
                </span>
              </button>
            </div>

            {/* Auto-Cycle Bank Scenes */}
            <div className="flex items-center gap-1 rounded-lg bg-[#080B12] p-1 ring-1 ring-white/10">
              <span className="px-2 text-[11px] font-medium text-slate-400">{t.autoCycleLabel}</span>
              {[
                {beats: 0, label: t.autoCycleManual},
                {beats: 4, label: t.autoCycleBeats(4)},
                {beats: 8, label: t.autoCycleBeats(8)},
                {beats: 16, label: t.autoCycleBeats(16)},
              ].map((opt) => {
                const active = autoCycleBeats === opt.beats;
                return (
                  <button
                    key={opt.beats}
                    type="button"
                    onClick={() => onChangeAutoCycleBeats(opt.beats)}
                    className={`flex min-h-[30px] items-center gap-1 rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      active
                        ? opt.beats > 0
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-sky-500 text-slate-950'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {opt.beats > 0 ? (
                      <Play className="h-3 w-3" />
                    ) : (
                      <Square className="h-2.5 w-2.5" />
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setNewBankOpen((v) => !v)}
              className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/25 whitespace-nowrap shrink-0"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              <span>{t.newBankBtn}</span>
            </button>
          </div>
        </div>

        {/* Undo/Redo Feedback Banner or Collapsible History List */}
        {(undoFeedback || showHistoryDrawer) && (
          <div className="mt-3 rounded-lg border border-white/10 bg-[#0B101B] px-3.5 py-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-slate-300">
                {undoFeedback ? (
                  <span className="font-medium text-sky-300">{undoFeedback}</span>
                ) : (
                  <span>
                    {t.historyShortcutHint} (<span className="font-mono-tabular">Ctrl+Z</span> · <span className="font-mono-tabular">Ctrl+Y</span>)
                  </span>
                )}
              </div>
              {showHistoryDrawer && (
                <button
                  type="button"
                  onClick={() => setShowHistoryDrawer(false)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  {t.closeHistoryBtn}
                </button>
              )}
            </div>

            {showHistoryDrawer && (
              <div className="mt-2.5 border-t border-white/8 pt-2.5">
                {undoStack.length === 0 && redoStack.length === 0 ? (
                  <p className="text-[11px] text-slate-500">
                    {t.historyEmpty}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {[...undoStack]
                      .reverse()
                      .slice(0, 9)
                      .map((entry, revIdx) => {
                        const actualIdx = undoStack.length - 1 - revIdx;
                        const timeStr = new Date(entry.timestamp).toLocaleTimeString(
                          language === 'pt-PT' ? 'pt-PT' : 'en-US',
                          {hour: '2-digit', minute: '2-digit', second: '2-digit'},
                        );
                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => onRestoreUndoIndex(actualIdx)}
                            className="flex items-center justify-between gap-2 rounded-md border border-white/10 bg-[#151D2E] px-2.5 py-1.5 text-left text-[11px] text-slate-200 transition-colors hover:border-amber-400/50 hover:text-white"
                          >
                            <span className="truncate font-medium">
                              {t.historyBeforePrefix(entry.label)}
                            </span>
                            <span className="font-mono-tabular shrink-0 text-[10px] text-slate-400">
                              {timeStr}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* New Bank Inline Form */}
        {newBankOpen && (
          <form
            onSubmit={handleSubmitBank}
            className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-sky-500/30 bg-[#0B101B] p-3"
          >
            <input
              type="text"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              placeholder={t.newBankPlaceholder}
              maxLength={36}
              className="min-h-[38px] min-w-[220px] flex-1 rounded-lg border border-white/15 bg-[#090C12] px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
            <div className="flex items-center gap-1.5">
              {BANK_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setNewBankColor(hex)}
                  aria-label={t.selectBankColorAria(hex)}
                  className={`h-7 w-7 rounded-md border ${
                    newBankColor === hex ? 'border-white ring-1 ring-white' : 'border-white/20'
                  }`}
                  style={{backgroundColor: hex}}
                />
              ))}
            </div>
            <button
              type="submit"
              className="min-h-[38px] rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400"
            >
              {t.createBankBtn}
            </button>
            <button
              type="button"
              onClick={() => setNewBankOpen(false)}
              className="min-h-[38px] rounded-lg border border-white/10 bg-[#151D2E] px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              {t.cancelBtn}
            </button>
          </form>
        )}

        {/* Bank Selector Strip */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {banks.map((bank) => {
            const selected = bank.id === currentBank?.id;
            return (
              <div key={bank.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => onSelectBank(bank.id)}
                  className={`flex min-h-[40px] items-center gap-2.5 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors ${
                    selected
                      ? 'border-sky-500 bg-[#151E32] text-white'
                      : 'border-white/10 bg-[#0B101B] text-slate-300 hover:border-white/25 hover:text-white'
                  }`}
                >
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{backgroundColor: bank.color}}
                    aria-hidden="true"
                  />
                  <span>{bank.name}</span>
                  <span className="font-mono-tabular text-[11px] text-slate-400">
                    ({bank.scenes.length})
                  </span>
                </button>
              </div>
            );
          })}

          {currentBank && banks.length > 1 && (
            <button
              type="button"
              onClick={() => onDeleteBank(currentBank.id)}
              title={t.deleteBankTitle}
              className="ml-auto flex min-h-[36px] items-center gap-1 rounded-lg border border-white/10 bg-[#151D2E] px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:border-rose-500/40 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.deleteBankBtn}</span>
            </button>
          )}
        </div>

        {/* Create New Scene Bar */}
        {currentBank && (
          <form
            onSubmit={handleSubmitScene}
            className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-white/10 bg-[#0B101B] p-3"
          >
            <div className="flex flex-1 min-w-[220px] items-center gap-2">
              <input
                type="text"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                placeholder={t.newScenePlaceholder(currentBank.name)}
                maxLength={34}
                className="min-h-[40px] w-full rounded-lg border border-white/15 bg-[#090C12] px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">{t.sceneTagLabel}</span>
              {QUICK_COLOR_SWATCHES.slice(0, 7).map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setNewSceneColor(hex)}
                  aria-label={t.sceneTagColorAria(hex)}
                  className={`h-6 w-6 rounded border ${
                    newSceneColor === hex ? 'border-white ring-1 ring-white' : 'border-white/20'
                  }`}
                  style={{backgroundColor: hex}}
                />
              ))}
            </div>

            <button
              type="submit"
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>{t.createSceneBtn}</span>
            </button>
          </form>
        )}

        {/* Scene Pads Grid */}
        {currentBank && (
          <div className="mt-4">
            {currentBank.scenes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-white/15 bg-[#0B101B] p-8 text-center text-xs text-slate-400">
                {t.bankEmptyTextBefore}{' '}
                <strong className="text-sky-300">{t.bankEmptyTextStrong}</strong>.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {currentBank.scenes.map((scene, index) => {
                  const isActive = activeSceneId === scene.id;
                  const customFixCount = Object.keys(scene.fixtureColors || {}).length;
                  return (
                    <div
                      key={scene.id}
                      className={`group relative flex flex-col justify-between rounded-xl border p-3 transition-all ${
                        isActive
                          ? 'border-sky-400 bg-sky-500/14 shadow-[0_0_24px_rgba(14,165,233,0.2)]'
                          : 'border-white/10 bg-[#141C2E] hover:border-white/25'
                      }`}
                    >
                      {editingSceneId === scene.id ? (
                        <form
                          onSubmit={(e) =>
                            handleSaveSceneMeta(e, currentBank.id, scene.id)
                          }
                          className="space-y-2.5"
                        >
                          <input
                            type="text"
                            value={editSceneName}
                            onChange={(e) => setEditSceneName(e.target.value)}
                            maxLength={34}
                            autoFocus
                            className="min-h-[34px] w-full rounded-md border border-sky-500/50 bg-[#090C12] px-2.5 py-1 text-xs text-white focus:outline-none"
                          />
                          <div className="flex flex-wrap items-center gap-1">
                            {QUICK_COLOR_SWATCHES.slice(0, 7).map((hex) => (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setEditSceneColor(hex)}
                                aria-label={t.sceneTagColorAria(hex)}
                                className={`h-5 w-5 rounded border ${
                                  editSceneColor === hex
                                    ? 'border-white ring-1 ring-white'
                                    : 'border-white/20'
                                }`}
                                style={{backgroundColor: hex}}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-end gap-1.5 border-t border-white/8 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditingSceneId(null)}
                              className="flex min-h-[28px] items-center gap-1 rounded border border-white/10 bg-[#0B101B] px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                              <span>{t.cancelBtn}</span>
                            </button>
                            <button
                              type="submit"
                              className="flex min-h-[28px] items-center gap-1 rounded bg-sky-500 px-2.5 py-1 text-[11px] font-semibold text-slate-950 hover:bg-sky-400"
                            >
                              <Check className="h-3 w-3" />
                              <span>{t.editSceneSave}</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onTriggerScene(currentBank.id, scene)}
                            className="w-full text-left focus-visible:outline-none"
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="h-3.5 w-1.5 shrink-0 rounded-full"
                                  style={{backgroundColor: scene.colorTag}}
                                  aria-hidden="true"
                                />
                                <span className="font-mono-tabular text-[11px] font-bold text-slate-400">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <span className="truncate text-sm font-semibold text-white">
                                  {scene.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {scene.colorFx.colors.slice(0, 3).map((hex, cIdx) => (
                                  <span
                                    key={cIdx}
                                    className="h-2.5 w-2.5 rounded-full border border-white/20"
                                    style={{backgroundColor: hex}}
                                    aria-hidden="true"
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-tabular text-[11px] text-slate-400">
                              <span>
                                {t.movePatterns[scene.moveFx.pattern] ?? scene.moveFx.pattern}
                              </span>
                              <span>·</span>
                              <span>
                                {t.colorPatterns[scene.colorFx.pattern] ?? scene.colorFx.pattern}
                              </span>
                              <span>·</span>
                              <span className="text-slate-200">{scene.masterDimmer}%</span>
                              {customFixCount > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-300">
                                    {t.sceneCustomColors(customFixCount)}
                                  </span>
                                </>
                              )}
                            </div>
                          </button>

                          {/* Scene Pad Controls */}
                          <div className="mt-3 flex items-center justify-between gap-1.5 border-t border-white/8 pt-2">
                            <button
                              type="button"
                              onClick={() => onTriggerScene(currentBank.id, scene)}
                              className={`min-h-[28px] rounded px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                isActive
                                  ? 'bg-sky-500 text-slate-950'
                                  : 'bg-[#0B101B] text-slate-200 hover:bg-sky-500/20 hover:text-sky-200'
                              }`}
                            >
                              {isActive ? t.sceneActive : t.sceneTrigger}
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  onOverwriteSceneInBank(currentBank.id, scene.id)
                                }
                                title={t.sceneOverwriteTitle}
                                className="flex min-h-[28px] items-center gap-1 rounded border border-white/10 bg-[#0B101B] px-2 py-1 text-[11px] text-slate-300 hover:border-amber-400/50 hover:text-amber-200"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>{t.sceneOverwriteBtn}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditingScene(scene)}
                                title={t.sceneEditTitle}
                                aria-label={`${t.sceneEditTitle}: ${scene.name}`}
                                className="flex min-h-[28px] items-center rounded border border-white/10 bg-[#0B101B] px-2 py-1 text-slate-300 hover:text-white"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onDuplicateSceneInBank(currentBank.id, scene.id)
                                }
                                title={t.sceneDuplicateTitle}
                                aria-label={`${t.sceneDuplicateTitle}: ${scene.name}`}
                                className="flex min-h-[28px] items-center rounded border border-white/10 bg-[#0B101B] px-2 py-1 text-slate-300 hover:text-white"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onDeleteSceneInBank(currentBank.id, scene.id)
                                }
                                title={t.sceneDeleteTitle}
                                aria-label={`${t.sceneDeleteTitle}: ${scene.name}`}
                                className="flex min-h-[28px] items-center rounded border border-white/10 bg-[#0B101B] px-2 py-1 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Live Console Deck inside Bank for crafting Scenes */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#101624] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-sky-400" />
          <span className="text-xs font-semibold text-white">
            {t.bankDeckTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFadersInBank((v) => !v)}
            className={`min-h-[32px] rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
              showFadersInBank
                ? 'border-sky-500/50 bg-sky-500/15 text-sky-200'
                : 'border-white/10 bg-[#151D2E] text-slate-300 hover:text-white'
            }`}
          >
            {showFadersInBank ? t.hideFadersBtn : t.showFadersBtn}
          </button>
          <button
            type="button"
            onClick={() => setShowBuilderDeck((v) => !v)}
            className="min-h-[32px] rounded-md border border-white/10 bg-[#151D2E] px-3 py-1 text-xs font-medium text-slate-200 hover:text-white"
          >
            {showBuilderDeck ? t.minimizeFxDeckBtn : t.expandFxDeckBtn}
          </button>
        </div>
      </div>

      {showBuilderDeck && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <MoveFxPanel moveFx={moveFx} onChange={onChangeMoveFx} />
          </div>
          <div className="lg:col-span-6">
            <FlashFxCenter
              moveFx={moveFx}
              onChangeMoveFx={onChangeMoveFx}
              flashFx={flashFx}
              onChangeFlashFx={onChangeFlashFx}
              beamFx={beamFx}
              onChangeBeamFx={onChangeBeamFx}
              bpm={bpm}
              onTapBpm={onTapBpm}
              onChangeBpm={onChangeBpm}
              masterDimmer={masterDimmer}
              onChangeMasterDimmer={onChangeMasterDimmer}
              audioMode={audioMode}
              onChangeAudioMode={onChangeAudioMode}
            />
          </div>
          <div className="lg:col-span-3">
            <ColorFxPanel colorFx={colorFx} onChange={onChangeColorFx} />
          </div>
        </div>
      )}

      {showFadersInBank && (
        <FaderWingPanel
          mode="strip"
          fixtures={fixtures}
          universeRef={universeRef}
          outputsRef={outputsRef}
          masterDimmer={masterDimmer}
          onChangeMasterDimmer={onChangeMasterDimmer}
          groupDimmers={groupDimmers}
          onChangeGroupDimmers={onChangeGroupDimmers}
          fixtureDimmers={fixtureDimmers}
          onChangeFixtureDimmer={onChangeFixtureDimmer}
          onResetAllFixtureDimmers={onResetAllFixtureDimmers}
          fixtureMutes={fixtureMutes}
          onToggleFixtureMute={onToggleFixtureMute}
          onUnmuteAllFixtures={onUnmuteAllFixtures}
          fixtureFlashes={fixtureFlashes}
          onSetFixtureFlash={onSetFixtureFlash}
          fixtureColors={fixtureColors}
          onChangeFixtureColor={onChangeFixtureColor}
          onClearAllFixtureColors={onClearAllFixtureColors}
          selectedFixtureId={selectedFixtureId}
          onSelectFixture={onSelectFixture}
          rawDmxOverrides={rawDmxOverrides}
          onSetRawDmxOverride={onSetRawDmxOverride}
          onClearRawDmxOverrides={onClearRawDmxOverrides}
          moveFx={moveFx}
          onChangeMoveFx={onChangeMoveFx}
          colorFx={colorFx}
          onChangeColorFx={onChangeColorFx}
          beamFx={beamFx}
          onChangeBeamFx={onChangeBeamFx}
          flashFx={flashFx}
          onChangeFlashFx={onChangeFlashFx}
        />
      )}
    </div>
  );
}
