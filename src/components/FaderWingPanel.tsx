import {useEffect, useMemo, useState} from 'react';
import {Palette, RotateCcw, Sliders} from 'lucide-react';
import {
  DEFAULT_GROUP_DIMMERS,
  getFixtureChannelLabels,
  hexToRgb,
  QUICK_COLOR_SWATCHES,
  rgbToHex,
} from '../engine/dmxEngine';
import {useLanguage} from '../i18n/LanguageContext';
import {
  BeamFxState,
  ColorFxState,
  FaderWingTab,
  Fixture,
  FixtureComputedOutput,
  FlashFxState,
  GroupDimmerState,
  MoveFxState,
} from '../types/dmx';
import {ConsoleFader} from './ConsoleFader';
import {UniverseMonitor} from './UniverseMonitor';

interface FaderWingPanelProps {
  mode: 'strip' | 'full';
  wingTab?: FaderWingTab;
  onChangeWingTab?: (tab: FaderWingTab) => void;
  onOpenFullWing?: (tab?: FaderWingTab, fixtureId?: string) => void;
  fixtures: Fixture[];
  universeRef: React.MutableRefObject<Uint8Array>;
  outputsRef: React.MutableRefObject<FixtureComputedOutput[]>;
  masterDimmer: number;
  onChangeMasterDimmer: (val: number) => void;
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
  selectedFixtureId?: string | null;
  onSelectFixture?: (fixtureId: string) => void;
  rawDmxOverrides: Record<number, number>;
  onSetRawDmxOverride: (channel1Based: number, value: number | null) => void;
  onClearRawDmxOverrides: (channels?: number[]) => void;
  moveFx: MoveFxState;
  onChangeMoveFx: (next: MoveFxState) => void;
  colorFx: ColorFxState;
  onChangeColorFx: (next: ColorFxState) => void;
  beamFx: BeamFxState;
  onChangeBeamFx: (next: BeamFxState) => void;
  flashFx: FlashFxState;
  onChangeFlashFx: (next: FlashFxState) => void;
}

export function FaderWingPanel({
  mode,
  wingTab: controlledWingTab,
  onChangeWingTab,
  onOpenFullWing,
  fixtures,
  universeRef,
  outputsRef,
  masterDimmer,
  onChangeMasterDimmer,
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
  selectedFixtureId: controlledSelectedFixtureId,
  onSelectFixture,
  rawDmxOverrides,
  onSetRawDmxOverride,
  onClearRawDmxOverrides,
  moveFx,
  onChangeMoveFx,
  colorFx,
  onChangeColorFx,
  beamFx,
  onChangeBeamFx,
  flashFx,
  onChangeFlashFx,
}: FaderWingPanelProps) {
  const {language, t} = useLanguage();
  const [internalWingTab, setInternalWingTab] = useState<FaderWingTab>('groups');
  const [internalSelectedFixtureId, setInternalSelectedFixtureId] = useState<string>(
    fixtures[0]?.id || '',
  );
  const [stripEquipOpen, setStripEquipOpen] = useState(false);
  const [dmxBank, setDmxBank] = useState<number>(0); // 0..31 (16 channels per bank)
  const [, setLiveSampleTick] = useState(0);

  const wingTab = controlledWingTab ?? internalWingTab;
  const setWingTab = (tab: FaderWingTab) => {
    setInternalWingTab(tab);
    onChangeWingTab?.(tab);
  };

  const selectedFixtureId = controlledSelectedFixtureId || internalSelectedFixtureId;
  const setSelectedFixtureId = (id: string) => {
    setInternalSelectedFixtureId(id);
    onSelectFixture?.(id);
  };

  // Sample live RGB/DMX readout periodically when viewing live fixture colors or channel faders
  useEffect(() => {
    if (mode === 'full' && (wingTab === 'groups' || wingTab === 'universe')) return;
    const id = window.setInterval(() => {
      setLiveSampleTick((t) => (t + 1) % 10000);
    }, 110);
    return () => window.clearInterval(id);
  }, [mode, wingTab]);

  // Build channel -> owner metadata map for DMX 512 bank labels
  const channelOwnerMap = useMemo(() => {
    const map = new Map<number, {fixtureName: string; label: string}>();
    for (const f of fixtures) {
      const labels = getFixtureChannelLabels(f, language);
      for (let i = 0; i < f.channelCount; i += 1) {
        const ch = f.dmxStart + i;
        if (ch >= 1 && ch <= 512) {
          map.set(ch, {
            fixtureName: f.name,
            label: labels[i] || `CH ${i + 1}`,
          });
        }
      }
    }
    return map;
  }, [fixtures, language]);

  const activeFixture =
    fixtures.find((f) => f.id === selectedFixtureId) || fixtures[0] || null;

  const getFixtureLiveRgb = (fixture: Fixture) => {
    const customHex = fixtureColors[fixture.id];
    if (customHex) return hexToRgb(customHex);
    const liveOut = outputsRef.current.find((o) => o.fixtureId === fixture.id);
    if (liveOut) return {r: liveOut.r, g: liveOut.g, b: liveOut.b};
    return hexToRgb(colorFx.colors[0] || '#0EA5E9');
  };

  const activeCustomHex = activeFixture ? fixtureColors[activeFixture.id] : undefined;
  const activeRgb = activeFixture
    ? getFixtureLiveRgb(activeFixture)
    : {r: 14, g: 165, b: 233};
  const activeHex = activeCustomHex || rgbToHex(activeRgb.r, activeRgb.g, activeRgb.b);

  const customColorCount = Object.keys(fixtureColors).length;
  const overrideCount = Object.keys(rawDmxOverrides).length;

  // Compact Quick Fader Strip inside FX + Faders split view
  if (mode === 'strip') {
    return (
      <section className="space-y-4 rounded-xl border border-white/10 bg-[#101624] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 pb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-sky-400" />
            <h2 className="font-display text-sm font-semibold text-white">
              {t.stripTitle}
            </h2>
            <span className="text-xs text-slate-400">
              {t.stripSubtitle}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStripEquipOpen((v) => !v)}
              aria-expanded={stripEquipOpen}
              className={`flex min-h-[34px] items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
                stripEquipOpen
                  ? 'border-amber-400 bg-amber-500 text-slate-950'
                  : customColorCount > 0
                    ? 'border-amber-500/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                    : 'border-white/15 bg-[#151D2E] text-slate-200 hover:border-amber-400/50 hover:text-white'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>
                {t.stripEquipBtn}
                {customColorCount > 0 ? ` (${customColorCount})` : ''}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeMasterDimmer(100);
                onChangeGroupDimmers({...DEFAULT_GROUP_DIMMERS});
              }}
              className="min-h-[34px] rounded-md border border-white/10 bg-[#151D2E] px-2.5 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:text-white"
            >
              {t.resetDimmers}
            </button>
            {onOpenFullWing && (
              <button
                type="button"
                onClick={() => onOpenFullWing('fixtures', activeFixture?.id)}
                className="min-h-[34px] rounded-md bg-sky-500/15 px-3 py-1 text-[11px] font-semibold text-sky-300 ring-1 ring-sky-500/40 transition-colors hover:bg-sky-500/25"
              >
                {t.fixturesAndColorsArrow}
              </button>
            )}
          </div>
        </div>

        {/* Main Horizontal Fader Strip */}
        <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
          <ConsoleFader
            label={t.faderMaster}
            sublabel={t.faderMasterSub}
            value={masterDimmer}
            defaultValue={100}
            accent="white"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={onChangeMasterDimmer}
          />
          <ConsoleFader
            label={t.faderBeams}
            sublabel={t.faderGroupSub}
            value={groupDimmers.beam}
            defaultValue={100}
            accent="sky"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={(val) => onChangeGroupDimmers({...groupDimmers, beam: val})}
          />
          <ConsoleFader
            label={t.faderWash}
            sublabel={t.faderParBarSub}
            value={groupDimmers.wash}
            defaultValue={100}
            accent="emerald"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={(val) => onChangeGroupDimmers({...groupDimmers, wash: val})}
          />
          <ConsoleFader
            label={t.faderBlinders}
            sublabel={t.faderFxGrpSub}
            value={groupDimmers.fx}
            defaultValue={100}
            accent="amber"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={(val) => onChangeGroupDimmers({...groupDimmers, fx: val})}
          />
          <ConsoleFader
            label={t.faderSmoke}
            sublabel={t.faderHazeSub}
            value={groupDimmers.smoke}
            defaultValue={0}
            accent="indigo"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={(val) => onChangeGroupDimmers({...groupDimmers, smoke: val})}
          />

          <div className="mx-1 w-px shrink-0 bg-white/10" aria-hidden="true" />

          <ConsoleFader
            label={t.faderMoveSpd}
            sublabel="FX"
            value={moveFx.speed}
            defaultValue={55}
            accent="sky"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={(val) => onChangeMoveFx({...moveFx, speed: val})}
          />
          <ConsoleFader
            label={t.faderMoveSize}
            sublabel="FX"
            value={moveFx.size}
            defaultValue={70}
            accent="sky"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={(val) => onChangeMoveFx({...moveFx, size: val})}
          />
          <ConsoleFader
            label={t.faderColorSpd}
            sublabel="FX"
            value={colorFx.speed}
            defaultValue={55}
            accent="amber"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={(val) => onChangeColorFx({...colorFx, speed: val})}
          />
          <ConsoleFader
            label={t.faderColorFade}
            sublabel="FX"
            value={colorFx.fade}
            defaultValue={50}
            accent="amber"
            heightClass="h-36"
            widthClass="w-[78px]"
            onChange={(val) => onChangeColorFx({...colorFx, fade: val})}
            footer={
              <button
                type="button"
                onClick={() => setStripEquipOpen((v) => !v)}
                className={`min-h-[26px] w-full rounded text-[10px] font-bold transition-colors ${
                  stripEquipOpen
                    ? 'bg-amber-500 text-slate-950'
                    : 'border border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/30'
                }`}
              >
                {t.faderEquipBtn}
              </button>
            }
          />
          <ConsoleFader
            label={t.faderBeamZoom}
            sublabel={t.faderOpticSub}
            value={beamFx.beamSpread}
            defaultValue={45}
            accent="emerald"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={(val) => onChangeBeamFx({...beamFx, beamSpread: val})}
          />
          <ConsoleFader
            label={t.faderStrobe}
            sublabel="HZ"
            value={flashFx.strobeRate}
            min={1}
            max={25}
            defaultValue={14}
            unit="Hz"
            accent="rose"
            heightClass="h-36"
            widthClass="w-[74px]"
            onChange={(val) => onChangeFlashFx({...flashFx, strobeRate: val})}
          />
        </div>

        {/* Inline Direct Equipment Color & Dimmer Access Drawer (Opened via Button) */}
        {stripEquipOpen && activeFixture && (
          <div className="rounded-lg border border-amber-500/30 bg-[#0B101B] p-3">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-white">
                  {t.equipDrawerTitle}
                </span>
                <span className="text-[11px] text-slate-400">
                  {t.equipDrawerSubtitle}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeCustomHex && (
                  <button
                    type="button"
                    onClick={() => onChangeFixtureColor(activeFixture.id, null)}
                    className="min-h-[30px] rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/25"
                  >
                    {t.autoColorFx}
                  </button>
                )}
                {customColorCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearAllFixtureColors}
                    className="min-h-[30px] rounded-md border border-white/10 bg-[#151D2E] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white"
                  >
                    {t.resetAllColors(customColorCount)}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStripEquipOpen(false)}
                  className="min-h-[30px] rounded-md border border-white/10 bg-[#151D2E] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white"
                >
                  {t.closeBtn}
                </button>
              </div>
            </div>

            {/* Equipment selector strip */}
            <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1">
              {fixtures.map((f) => {
                const selected = f.id === activeFixture.id;
                const rgb = getFixtureLiveRgb(f);
                const hasCustom = Boolean(fixtureColors[f.id]);
                const dimVal = fixtureDimmers[f.id] ?? 100;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFixtureId(f.id)}
                    className={`flex min-h-[34px] shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-sky-500 bg-sky-500/18 text-white'
                        : hasCustom
                          ? 'border-amber-500/45 bg-[#141A29] text-amber-100 hover:border-amber-400'
                          : 'border-white/10 bg-[#151D2E] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-sm border border-white/25"
                      style={{backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}}
                      aria-hidden="true"
                    />
                    <span>{f.name}</span>
                    <span className="font-mono-tabular text-[10px] text-slate-400">
                      {dimVal}%
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Equipment Quick Swatches + Picker + Dimmer */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK_COLOR_SWATCHES.map((hex) => {
                  const isCurrent = activeCustomHex?.toUpperCase() === hex.toUpperCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => onChangeFixtureColor(activeFixture.id, hex)}
                      aria-label={t.setHexOnFixtureAria(hex, activeFixture.name)}
                      className={`h-8 w-8 rounded-md border transition-transform hover:scale-105 ${
                        isCurrent ? 'border-white ring-2 ring-white/80' : 'border-white/20'
                      }`}
                      style={{backgroundColor: hex}}
                    />
                  );
                })}
                <label className="ml-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-white/15 bg-[#151D2E] px-2 text-xs text-slate-200 hover:border-white/30">
                  <input
                    type="color"
                    aria-label={t.customColorForAria(activeFixture.name)}
                    value={activeHex}
                    onChange={(e) =>
                      onChangeFixtureColor(activeFixture.id, e.target.value.toUpperCase())
                    }
                    className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="font-mono-tabular text-[11px]">{activeHex}</span>
                </label>
              </div>

              <div className="flex min-w-[210px] flex-1 max-w-xs items-center gap-3">
                <span className="text-[11px] font-medium text-slate-300 whitespace-nowrap">
                  Dimmer {activeFixture.name}
                </span>
                <input
                  type="range"
                  aria-label={t.dimmerFixtureLabel(activeFixture.name)}
                  min={0}
                  max={100}
                  value={fixtureDimmers[activeFixture.id] ?? 100}
                  onChange={(e) =>
                    onChangeFixtureDimmer(activeFixture.id, Number(e.target.value))
                  }
                  className="console-slider w-full"
                />
                <span className="w-9 text-right font-mono-tabular text-xs font-semibold text-white">
                  {fixtureDimmers[activeFixture.id] ?? 100}%
                </span>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  // Full Fader Wing View
  const activeFixtureChannels = activeFixture
    ? getFixtureChannelLabels(activeFixture, language)
    : [];
  const activeFixtureOverrideChannels = activeFixture
    ? activeFixtureChannels
        .map((_, idx) => activeFixture.dmxStart + idx)
        .filter((ch) => typeof rawDmxOverrides[ch] === 'number')
    : [];

  return (
    <section className="rounded-xl border border-white/10 bg-[#101624] p-4">
      {/* Header & Wing Sub-Tabs */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            {t.wingTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {t.wingSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#080B12] p-1 ring-1 ring-white/10">
          {(
            [
              {id: 'groups', label: t.wingTabGroups},
              {id: 'fixtures', label: t.wingTabFixtures(fixtures.length)},
              {id: 'channels', label: t.wingTabChannels},
              {id: 'dmx512', label: t.wingTabDmx512},
              {id: 'universe', label: t.wingTabUniverse},
            ] as Array<{id: FaderWingTab; label: string}>
          ).map((tab) => {
            const active = wingTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setWingTab(tab.id)}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tab 1: Groups & FX */}
      {wingTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-300">
              {t.wingGroupsHeader}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setWingTab('fixtures')}
                className="min-h-[34px] rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 ring-1 ring-sky-500/40 hover:bg-sky-500/25"
              >
                {t.wingColorPerFixArrow}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeMasterDimmer(100);
                  onChangeGroupDimmers({beam: 100, wash: 100, fx: 100, smoke: groupDimmers.smoke});
                }}
                className="min-h-[34px] rounded-lg border border-white/10 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white"
              >
                {t.allGroups100}
              </button>
              <button
                type="button"
                onClick={() => onChangeGroupDimmers({beam: 0, wash: 0, fx: 0, smoke: 0})}
                className="min-h-[34px] rounded-lg border border-white/10 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-rose-300"
              >
                {t.zeroGroups}
              </button>
            </div>
          </div>

          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            <ConsoleFader
              label={t.faderMaster}
              sublabel={t.faderGlobalSub}
              value={masterDimmer}
              defaultValue={100}
              accent="white"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={onChangeMasterDimmer}
            />
            <ConsoleFader
              label={t.faderBeams}
              sublabel={t.faderMovingSub}
              value={groupDimmers.beam}
              defaultValue={100}
              accent="sky"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeGroupDimmers({...groupDimmers, beam: val})}
            />
            <ConsoleFader
              label={t.faderWash}
              sublabel={t.faderParBarSub}
              value={groupDimmers.wash}
              defaultValue={100}
              accent="emerald"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeGroupDimmers({...groupDimmers, wash: val})}
            />
            <ConsoleFader
              label={t.faderBlinders}
              sublabel={t.faderFxGrpSub}
              value={groupDimmers.fx}
              defaultValue={100}
              accent="amber"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeGroupDimmers({...groupDimmers, fx: val})}
            />
            <ConsoleFader
              label={t.faderSmoke}
              sublabel={t.faderHazeOutSub}
              value={groupDimmers.smoke}
              defaultValue={0}
              accent="indigo"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeGroupDimmers({...groupDimmers, smoke: val})}
            />

            <div className="mx-1 w-px shrink-0 bg-white/10" aria-hidden="true" />

            <ConsoleFader
              label={t.faderMoveSpd}
              sublabel="MOVE FX"
              value={moveFx.speed}
              defaultValue={55}
              accent="sky"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeMoveFx({...moveFx, speed: val})}
            />
            <ConsoleFader
              label={t.faderMoveSize}
              sublabel="MOVE FX"
              value={moveFx.size}
              defaultValue={70}
              accent="sky"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeMoveFx({...moveFx, size: val})}
            />
            <ConsoleFader
              label={t.faderFanMove}
              sublabel={t.faderPhaseSub}
              value={moveFx.fan}
              min={-100}
              max={100}
              defaultValue={35}
              unit=""
              accent="sky"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeMoveFx({...moveFx, fan: val})}
            />
            <ConsoleFader
              label={t.faderColorSpd}
              sublabel="COLOR FX"
              value={colorFx.speed}
              defaultValue={55}
              accent="amber"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeColorFx({...colorFx, speed: val})}
            />
            <ConsoleFader
              label={t.faderColorFade}
              sublabel={t.faderSmoothSub}
              value={colorFx.fade}
              defaultValue={50}
              accent="amber"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeColorFx({...colorFx, fade: val})}
              footer={
                <button
                  type="button"
                  onClick={() => setWingTab('fixtures')}
                  className="min-h-[28px] w-full rounded border border-amber-500/40 bg-amber-500/15 text-[10px] font-bold text-amber-200 transition-colors hover:bg-amber-500/30"
                >
                  {t.faderEquipBtn}
                </button>
              }
            />
            <ConsoleFader
              label={t.faderShiftColor}
              sublabel={t.faderSpreadSub}
              value={colorFx.shift}
              defaultValue={45}
              accent="amber"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeColorFx({...colorFx, shift: val})}
            />
            <ConsoleFader
              label={t.faderBeamZoom}
              sublabel={t.faderOpticSub}
              value={beamFx.beamSpread}
              defaultValue={45}
              accent="emerald"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeBeamFx({...beamFx, beamSpread: val})}
            />
            <ConsoleFader
              label={t.faderStrobeHzLabel}
              sublabel={t.faderFlashFxSub}
              value={flashFx.strobeRate}
              min={1}
              max={25}
              defaultValue={14}
              unit="Hz"
              accent="rose"
              heightClass="h-52"
              widthClass="w-[84px]"
              onChange={(val) => onChangeFlashFx({...flashFx, strobeRate: val})}
            />
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Individual Fixtures — Dimmers + Per-Equipment Color & RGB Fade */}
      {wingTab === 'fixtures' && (
        <div className="space-y-4">
          {/* Selected Equipment Color & RGB Fader Deck */}
          {activeFixture && (
            <div className="rounded-xl border border-white/10 bg-[#0B101B] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/8 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-4 w-4 rounded border border-white/25"
                    style={{backgroundColor: activeHex}}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {t.fixtureColorFadeDimmerTitle(activeFixture.name)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono-tabular">
                      CH {String(activeFixture.dmxStart).padStart(3, '0')} ·{' '}
                      {activeCustomHex
                        ? t.fixedColorBadge(activeCustomHex)
                        : t.followingGlobalColorFx}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {activeCustomHex && (
                    <button
                      type="button"
                      onClick={() => onChangeFixtureColor(activeFixture.id, null)}
                      className="min-h-[34px] rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
                    >
                      {t.returnToColorFx}
                    </button>
                  )}
                  {customColorCount > 0 && (
                    <button
                      type="button"
                      onClick={onClearAllFixtureColors}
                      className="min-h-[34px] rounded-lg border border-white/10 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white"
                    >
                      {t.clearColorsCount(customColorCount)}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onResetAllFixtureDimmers}
                    className="min-h-[34px] rounded-lg border border-white/10 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white"
                  >
                    {t.allDimmers100}
                  </button>
                  <button
                    type="button"
                    onClick={onUnmuteAllFixtures}
                    className="min-h-[34px] rounded-lg border border-white/10 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white"
                  >
                    {t.unmuteAll}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* Color Palette & Picker for Selected Equipment */}
                <div className="flex flex-col justify-between gap-3 lg:col-span-6">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">
                        {t.quickPaletteFor(activeFixture.name)}
                      </span>
                      <label className="flex cursor-pointer items-center gap-2 text-slate-300">
                        <span className="font-mono-tabular">{activeHex}</span>
                        <input
                          type="color"
                          aria-label={t.customColorForAria(activeFixture.name)}
                          value={activeHex}
                          onChange={(e) =>
                            onChangeFixtureColor(
                              activeFixture.id,
                              e.target.value.toUpperCase(),
                            )
                          }
                          className="h-7 w-9 cursor-pointer rounded border border-white/20 bg-transparent p-0"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {QUICK_COLOR_SWATCHES.map((hex) => {
                        const isSelected =
                          activeCustomHex?.toUpperCase() === hex.toUpperCase();
                        return (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => onChangeFixtureColor(activeFixture.id, hex)}
                            aria-label={t.setHexOnFixtureAria(hex, activeFixture.name)}
                            className={`h-10 rounded-md border transition-transform hover:scale-105 ${
                              isSelected
                                ? 'border-white ring-2 ring-white/80'
                                : 'border-white/15'
                            }`}
                            style={{backgroundColor: hex}}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    {t.fixturePaletteTip}
                  </p>
                </div>

                {/* Vertical Faders for Selected Equipment: Dimmer, Color Fade, Red, Green, Blue */}
                <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1 lg:col-span-6 lg:justify-end">
                  <ConsoleFader
                    label="Dimmer"
                    sublabel={activeFixture.name}
                    value={fixtureDimmers[activeFixture.id] ?? 100}
                    defaultValue={100}
                    accent="white"
                    heightClass="h-40"
                    widthClass="w-[78px]"
                    muted={Boolean(fixtureMutes[activeFixture.id])}
                    onChange={(val) => onChangeFixtureDimmer(activeFixture.id, val)}
                  />
                  <ConsoleFader
                    label={t.faderColorFade}
                    sublabel={t.faderSmoothSub}
                    value={colorFx.fade}
                    defaultValue={50}
                    accent="amber"
                    heightClass="h-40"
                    widthClass="w-[78px]"
                    onChange={(val) => onChangeColorFx({...colorFx, fade: val})}
                  />
                  <ConsoleFader
                    label={t.faderRed}
                    sublabel="RGB"
                    value={activeRgb.r}
                    min={0}
                    max={255}
                    unit=""
                    accent="rose"
                    heightClass="h-40"
                    widthClass="w-[74px]"
                    isOverridden={Boolean(activeCustomHex)}
                    onChange={(rVal) =>
                      onChangeFixtureColor(
                        activeFixture.id,
                        rgbToHex(rVal, activeRgb.g, activeRgb.b),
                      )
                    }
                  />
                  <ConsoleFader
                    label={t.faderGreen}
                    sublabel="RGB"
                    value={activeRgb.g}
                    min={0}
                    max={255}
                    unit=""
                    accent="emerald"
                    heightClass="h-40"
                    widthClass="w-[74px]"
                    isOverridden={Boolean(activeCustomHex)}
                    onChange={(gVal) =>
                      onChangeFixtureColor(
                        activeFixture.id,
                        rgbToHex(activeRgb.r, gVal, activeRgb.b),
                      )
                    }
                  />
                  <ConsoleFader
                    label={t.faderBlue}
                    sublabel="RGB"
                    value={activeRgb.b}
                    min={0}
                    max={255}
                    unit=""
                    accent="sky"
                    heightClass="h-40"
                    widthClass="w-[74px]"
                    isOverridden={Boolean(activeCustomHex)}
                    onChange={(bVal) =>
                      onChangeFixtureColor(
                        activeFixture.id,
                        rgbToHex(activeRgb.r, activeRgb.g, bVal),
                      )
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Horizontal Rack of All Fixture Dimmers + Direct Color Button */}
          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2">
            {fixtures.map((f) => {
              const dimVal = fixtureDimmers[f.id] ?? 100;
              const isMuted = Boolean(fixtureMutes[f.id]);
              const isFlashing = Boolean(fixtureFlashes[f.id]);
              const customHex = fixtureColors[f.id];
              const isSelected = f.id === activeFixture?.id;
              const liveRgb = getFixtureLiveRgb(f);
              const liveColor = `rgb(${liveRgb.r}, ${liveRgb.g}, ${liveRgb.b})`;
              const accent =
                f.group === 'beam' ? 'sky' : f.group === 'wash' ? 'emerald' : 'amber';

              return (
                <ConsoleFader
                  key={f.id}
                  label={f.name}
                  sublabel={`CH ${String(f.dmxStart).padStart(3, '0')}`}
                  value={dimVal}
                  defaultValue={100}
                  accent={accent}
                  heightClass="h-44"
                  widthClass="w-[94px]"
                  muted={isMuted}
                  isOverridden={isSelected || Boolean(customHex)}
                  colorDot={liveColor}
                  onChange={(val) => onChangeFixtureDimmer(f.id, val)}
                  footer={
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedFixtureId(f.id)}
                        className={`flex min-h-[28px] w-full items-center justify-center gap-1.5 rounded text-[10px] font-semibold transition-colors ${
                          isSelected
                            ? 'bg-sky-500 text-slate-950'
                            : customHex
                              ? 'border border-amber-500/50 bg-amber-500/15 text-amber-200'
                              : 'border border-white/10 bg-[#151D2E] text-slate-200 hover:border-white/25'
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-sm border border-black/30"
                          style={{backgroundColor: customHex || liveColor}}
                          aria-hidden="true"
                        />
                        <span>{customHex ? t.btnFixedColor : t.btnColorEdit}</span>
                      </button>

                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => onToggleFixtureMute(f.id)}
                          className={`min-h-[30px] rounded text-[10px] font-bold transition-colors ${
                            isMuted
                              ? 'bg-rose-500 text-white'
                              : 'border border-white/10 bg-[#151D2E] text-slate-300 hover:text-white'
                          }`}
                        >
                          {t.btnMute}
                        </button>
                        <button
                          type="button"
                          onPointerDown={() => onSetFixtureFlash(f.id, true)}
                          onPointerUp={() => onSetFixtureFlash(f.id, false)}
                          onPointerLeave={() => onSetFixtureFlash(f.id, false)}
                          onPointerCancel={() => onSetFixtureFlash(f.id, false)}
                          className={`min-h-[30px] touch-none select-none rounded text-[10px] font-bold transition-colors ${
                            isFlashing
                              ? 'bg-amber-400 text-slate-950'
                              : 'border border-white/10 bg-[#151D2E] text-slate-300 hover:text-white'
                          }`}
                        >
                          {t.btnFlash}
                        </button>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Per-Fixture Raw Channel Faders */}
      {wingTab === 'channels' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {fixtures.map((f) => {
                const selected = f.id === activeFixture?.id;
                const hasAnyOverride = Array.from(
                  {length: f.channelCount},
                  (_, i) => f.dmxStart + i,
                ).some((ch) => typeof rawDmxOverrides[ch] === 'number');
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFixtureId(f.id)}
                    className={`min-h-[34px] shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? 'border-sky-500 bg-sky-500/20 text-white'
                        : hasAnyOverride
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                          : 'border-white/10 bg-[#151D2E] text-slate-300 hover:text-white'
                    }`}
                  >
                    {f.name}
                  </button>
                );
              })}
            </div>

            {activeFixtureOverrideChannels.length > 0 && (
              <button
                type="button"
                onClick={() => onClearRawDmxOverrides(activeFixtureOverrideChannels)}
                className="flex min-h-[34px] items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t.releaseFixture(activeFixtureOverrideChannels.length)}</span>
              </button>
            )}
          </div>

          {activeFixture ? (
            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2">
              {activeFixtureChannels.map((chLabel, idx) => {
                const dmxCh = activeFixture.dmxStart + idx;
                if (dmxCh > 512) return null;
                const overridden = typeof rawDmxOverrides[dmxCh] === 'number';
                const val = overridden
                  ? rawDmxOverrides[dmxCh]
                  : (universeRef.current[dmxCh - 1] ?? 0);

                return (
                  <ConsoleFader
                    key={dmxCh}
                    label={chLabel}
                    sublabel={`DMX ${String(dmxCh).padStart(3, '0')}`}
                    value={val}
                    min={0}
                    max={255}
                    unit=""
                    accent={overridden ? 'amber' : 'sky'}
                    heightClass="h-48"
                    widthClass="w-[82px]"
                    isOverridden={overridden}
                    onChange={(nextVal) => onSetRawDmxOverride(dmxCh, nextVal)}
                    onReset={() => onSetRawDmxOverride(dmxCh, null)}
                    footer={
                      <button
                        type="button"
                        disabled={!overridden}
                        onClick={() => onSetRawDmxOverride(dmxCh, null)}
                        className={`min-h-[28px] w-full rounded text-[10px] font-semibold transition-colors ${
                          overridden
                            ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/35'
                            : 'bg-white/5 text-slate-600 cursor-default'
                        }`}
                      >
                        {overridden ? t.btnRelease : t.btnAutoFx}
                      </button>
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              {t.noFixturesPatched}
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 4: Raw DMX 512 Universe Banks (16 channels per bank) */}
      {wingTab === 'dmx512' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              {Array.from({length: 16}, (_, bankIdx) => {
                const startCh = bankIdx * 16 + 1;
                const endCh = startCh + 15;
                const isActive = dmxBank === bankIdx;
                return (
                  <button
                    key={bankIdx}
                    type="button"
                    onClick={() => setDmxBank(bankIdx)}
                    className={`min-h-[30px] rounded px-2 py-1 font-mono-tabular text-[11px] font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-[#151D2E] text-slate-300 hover:bg-[#1E293B]'
                    }`}
                  >
                    {String(startCh).padStart(3, '0')}-{String(endCh).padStart(3, '0')}
                  </button>
                );
              })}
              <select
                aria-label={t.dmxUpperBanksAria}
                value={dmxBank >= 16 ? dmxBank : ''}
                onChange={(e) => {
                  if (e.target.value !== '') setDmxBank(Number(e.target.value));
                }}
                className="min-h-[30px] rounded border border-white/10 bg-[#151D2E] px-2 py-1 font-mono-tabular text-[11px] text-slate-300 focus:border-sky-500 focus:outline-none"
              >
                <option value="">CH 257–512...</option>
                {Array.from({length: 16}, (_, i) => {
                  const idx = i + 16;
                  const s = idx * 16 + 1;
                  return (
                    <option key={idx} value={idx}>
                      {String(s).padStart(3, '0')}-{String(s + 15).padStart(3, '0')}
                    </option>
                  );
                })}
              </select>
            </div>

            {overrideCount > 0 && (
              <button
                type="button"
                onClick={() => onClearRawDmxOverrides()}
                className="flex min-h-[32px] items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/25"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t.releaseAllCount(overrideCount)}</span>
              </button>
            )}
          </div>

          <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
            {Array.from({length: 16}, (_, offset) => {
              const dmxCh = dmxBank * 16 + offset + 1;
              if (dmxCh > 512) return null;
              const owner = channelOwnerMap.get(dmxCh);
              const overridden = typeof rawDmxOverrides[dmxCh] === 'number';
              const val = overridden
                ? rawDmxOverrides[dmxCh]
                : (universeRef.current[dmxCh - 1] ?? 0);

              return (
                <ConsoleFader
                  key={dmxCh}
                  label={owner ? owner.label : `CH ${String(dmxCh).padStart(3, '0')}`}
                  sublabel={
                    owner
                      ? `${String(dmxCh).padStart(3, '0')} · ${owner.fixtureName}`
                      : `DMX ${String(dmxCh).padStart(3, '0')}`
                  }
                  value={val}
                  min={0}
                  max={255}
                  unit=""
                  accent={overridden ? 'amber' : owner ? 'sky' : 'white'}
                  heightClass="h-44"
                  widthClass="w-[74px]"
                  isOverridden={overridden}
                  onChange={(nextVal) => onSetRawDmxOverride(dmxCh, nextVal)}
                  onReset={() => onSetRawDmxOverride(dmxCh, null)}
                  footer={
                    <button
                      type="button"
                      disabled={!overridden}
                      onClick={() => onSetRawDmxOverride(dmxCh, null)}
                      className={`min-h-[26px] w-full rounded text-[10px] font-semibold transition-colors ${
                        overridden
                          ? 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/35'
                          : 'bg-white/5 text-slate-600 cursor-default'
                      }`}
                    >
                      {overridden ? t.btnRelShort : t.btnLive}
                    </button>
                  }
                />
              );
            })}
          </div>
        </div>
      )}
      {/* Sub-Tab 5: Live 512-Channel Universe Monitor (Hex & Decimal) */}
      {wingTab === 'universe' && (
        <UniverseMonitor
          universeRef={universeRef}
          channelOwnerMap={channelOwnerMap}
          rawDmxOverrides={rawDmxOverrides}
          onSetRawDmxOverride={onSetRawDmxOverride}
          onClearRawDmxOverrides={onClearRawDmxOverrides}
        />
      )}
    </section>
  );
}
