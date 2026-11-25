import {useEffect, useMemo, useRef, useState} from 'react';
import {Download, FileUp, Plus, RotateCcw, Search, Trash2, X} from 'lucide-react';
import {DEFAULT_FIXTURES} from '../engine/dmxEngine';
import {
  ParsedFixtureProfile,
  parseCsvProfile,
  parseOflJsonProfile,
  parseSsl2Profile,
  SAMPLE_CSV_FIXTURE,
  SAMPLE_OFL_FIXTURE_JSON,
} from '../engine/fixtureImporter';
import {Fixture, FixtureGroup, FixtureType} from '../types/dmx';
import {OnlineFixtureSearch} from './OnlineFixtureSearch';
import {RdmAutodiscoveryPanel} from './RdmAutodiscoveryPanel';
import {useLanguage} from '../i18n/LanguageContext';

interface FixturesDmxViewProps {
  fixtures: Fixture[];
  universeRef: React.MutableRefObject<Uint8Array>;
  onChangeFixtures: (next: Fixture[]) => void;
}

const FIXTURE_TEMPLATES: Array<{
  type: FixtureType;
  model: string;
  channelCount: number;
  group: FixtureGroup;
}> = [
  {type: 'moving_head', model: 'ProBeam 230R', channelCount: 16, group: 'beam'},
  {type: 'led_par', model: 'QuadPar 18x12W', channelCount: 7, group: 'wash'},
  {type: 'pixel_bar', model: 'LinearStrip 24', channelCount: 12, group: 'wash'},
  {type: 'blinder', model: 'DualCOB 200W', channelCount: 4, group: 'fx'},
  {type: 'fogger', model: 'TourHaze 1500', channelCount: 2, group: 'fx'},
];

const TYPE_GROUP: Record<FixtureType, FixtureGroup> = {
  moving_head: 'beam',
  led_par: 'wash',
  pixel_bar: 'wash',
  blinder: 'fx',
  fogger: 'fx',
};

export function FixturesDmxView({
  fixtures,
  universeRef,
  onChangeFixtures,
}: FixturesDmxViewProps) {
  const {t} = useLanguage();
  const [universeSnapshot, setUniverseSnapshot] = useState<number[]>(() =>
    Array.from(universeRef.current),
  );
  const [hoveredCh, setHoveredCh] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | FixtureGroup>('all');
  const [newType, setNewType] = useState<FixtureType>('moving_head');
  const [newName, setNewName] = useState('');
  const [expandedFixtureId, setExpandedFixtureId] = useState<string | null>(null);

  // Fixture Importer state (OFL JSON, CSV, SSL2)
  const [importedProfile, setImportedProfile] = useState<ParsedFixtureProfile | null>(null);
  const [selectedModeIdx, setSelectedModeIdx] = useState(0);
  const [importTypeOverride, setImportTypeOverride] = useState<FixtureType>('moving_head');
  const [importChannelOverride, setImportChannelOverride] = useState(16);
  const [importQty, setImportQty] = useState(1);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [profileSourceTab, setProfileSourceTab] = useState<'online' | 'upload'>('online');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Poll DMX universe at ~15fps for crisp matrix inspection without heavy React overhead
  useEffect(() => {
    const id = window.setInterval(() => {
      setUniverseSnapshot(Array.from(universeRef.current));
    }, 66);
    return () => window.clearInterval(id);
  }, [universeRef]);

  const channelOwnerMap = useMemo(() => {
    const map = new Map<number, Fixture>();
    fixtures.forEach((f) => {
      for (let c = f.dmxStart; c < f.dmxStart + f.channelCount && c <= 512; c += 1) {
        map.set(c, f);
      }
    });
    return map;
  }, [fixtures]);

  const nextFreeAddress = useMemo(() => {
    let maxEnd = 1;
    fixtures.forEach((f) => {
      maxEnd = Math.max(maxEnd, f.dmxStart + f.channelCount);
    });
    return Math.min(512, maxEnd);
  }, [fixtures]);

  const filteredFixtures = useMemo(() => {
    return fixtures.filter((f) => {
      if (groupFilter !== 'all' && f.group !== groupFilter) return false;
      if (
        search.trim() &&
        !f.name.toLowerCase().includes(search.toLowerCase()) &&
        !f.model.toLowerCase().includes(search.toLowerCase()) &&
        !(f.manufacturer || '').toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [fixtures, groupFilter, search]);

  const handleAddFixture = (e: React.FormEvent) => {
    e.preventDefault();
    const tpl = FIXTURE_TEMPLATES.find((t) => t.type === newType) ?? FIXTURE_TEMPLATES[0];
    if (nextFreeAddress + tpl.channelCount - 1 > 512) return;

    const sameTypeCount = fixtures.filter((f) => f.type === tpl.type).length + 1;
    const xPos = Number((0.15 + ((fixtures.length * 0.17) % 0.7)).toFixed(2));
    const yPos = tpl.type === 'pixel_bar' || tpl.type === 'fogger' ? 0.8 : 0.14;

    const created: Fixture = {
      id: `fix-${Date.now()}`,
      name: newName.trim() || `${t.fixtureTypeLabels[tpl.type]} #${sameTypeCount}`,
      model: tpl.model,
      type: tpl.type,
      group: tpl.group,
      dmxStart: nextFreeAddress,
      channelCount: tpl.channelCount,
      xPos,
      yPos,
      panInvert: false,
      tiltInvert: false,
    };
    onChangeFixtures([...fixtures, created]);
    setNewName('');
  };

  const processImportedFile = async (file: File) => {
    setImportError(null);
    setImportNotice(null);
    const lower = file.name.toLowerCase();

    try {
      let parsed: ParsedFixtureProfile;
      if (lower.endsWith('.json')) {
        const text = await file.text();
        parsed = parseOflJsonProfile(text, file.name);
      } else if (lower.endsWith('.csv')) {
        const text = await file.text();
        parsed = parseCsvProfile(text, file.name);
      } else if (lower.endsWith('.ssl2') || lower.endsWith('.ssl')) {
        const buf = await file.arrayBuffer();
        parsed = parseSsl2Profile(buf, file.name);
      } else {
        throw new Error(t.importUnsupportedErr);
      }

      setImportedProfile(parsed);
      setSelectedModeIdx(0);
      setImportTypeOverride(parsed.type);
      setImportChannelOverride(parsed.modes[0]?.channelCount ?? 7);
      setImportQty(1);
    } catch (err) {
      setImportedProfile(null);
      setImportError(
        err instanceof Error ? err.message : t.importReadErr,
      );
    }
  };

  const handlePatchImported = () => {
    if (!importedProfile) return;
    const mode = importedProfile.modes[selectedModeIdx] ?? importedProfile.modes[0];
    const chCount = Math.max(1, Math.min(64, importChannelOverride));
    const qty = Math.max(1, Math.min(8, importQty));

    if (nextFreeAddress + chCount * qty - 1 > 512) {
      setImportError(t.importInsufficientChErr(chCount * qty, nextFreeAddress));
      return;
    }

    const added: Fixture[] = [];
    let cursorAddr = nextFreeAddress;
    for (let i = 0; i < qty; i += 1) {
      const idxTotal = fixtures.length + i;
      const xPos = Number((0.14 + ((idxTotal * 0.16) % 0.74)).toFixed(2));
      const yPos =
        importTypeOverride === 'pixel_bar' || importTypeOverride === 'fogger' ? 0.8 : 0.14;
      const suffix = qty > 1 ? ` #${i + 1}` : '';

      added.push({
        id: `imp-${Date.now()}-${i}`,
        name: `${importedProfile.name}${suffix}`,
        model: importedProfile.model,
        manufacturer: importedProfile.manufacturer,
        type: importTypeOverride,
        group: TYPE_GROUP[importTypeOverride],
        dmxStart: cursorAddr,
        channelCount: chCount,
        channelLabels: mode?.channelLabels.slice(0, chCount),
        xPos,
        yPos,
        panInvert: false,
        tiltInvert: false,
      });
      cursorAddr += chCount;
    }

    onChangeFixtures([...fixtures, ...added]);
    setImportNotice(
      t.importPatchedNotice(
        qty,
        importedProfile.name,
        chCount,
        String(nextFreeAddress).padStart(3, '0'),
      ),
    );
    setImportedProfile(null);
  };

  const downloadSample = (content: string, fileName: string, mime: string) => {
    const blob = new Blob([content], {type: mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hoveredOwner = hoveredCh ? channelOwnerMap.get(hoveredCh) : undefined;
  const hoveredVal = hoveredCh ? universeSnapshot[hoveredCh - 1] ?? 0 : 0;
  const activeImportedMode = importedProfile?.modes[selectedModeIdx] ?? importedProfile?.modes[0];

  return (
    <div className="space-y-4">
      {/* Live 512 DMX Universe Matrix */}
      <section className="rounded-xl border border-white/10 bg-[#101624] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              {t.dmxMatrixTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.dmxMatrixSubtitle}
            </p>
          </div>
          <div className="text-xs text-slate-300 font-mono-tabular">
            {hoveredCh ? (
              <span>
                CH {String(hoveredCh).padStart(3, '0')} ·{' '}
                {hoveredOwner ? hoveredOwner.name : t.dmxFreeChannel} · {hoveredVal} (
                {Math.round((hoveredVal / 255) * 100)}%)
              </span>
            ) : (
              <span className="text-slate-400">
                {t.dmxHoverHint}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-16 gap-1 sm:grid-cols-32">
          {universeSnapshot.map((val, idx) => {
            const ch = idx + 1;
            const isPatched = channelOwnerMap.has(ch);
            const pct = val / 255;
            return (
              <button
                key={ch}
                type="button"
                onMouseEnter={() => setHoveredCh(ch)}
                onFocus={() => setHoveredCh(ch)}
                aria-label={`CH ${ch}: ${val}`}
                className={`h-4 rounded-[2px] border transition-colors ${
                  hoveredCh === ch
                    ? 'border-white'
                    : isPatched
                      ? 'border-sky-500/35'
                      : 'border-white/5'
                }`}
                style={{
                  backgroundColor:
                    val > 0
                      ? `rgba(14, 165, 233, ${0.18 + pct * 0.82})`
                      : isPatched
                        ? '#172033'
                        : '#0B101B',
                }}
              />
            );
          })}
        </div>
      </section>

      {/* RDM Autodiscovery Section */}
      <RdmAutodiscoveryPanel
        fixtures={fixtures}
        onAddFixtures={(added) => onChangeFixtures([...fixtures, ...added])}
      />

      {/* Fixture Patch & Add / Import Forms */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Patch Table */}
        <section className="rounded-xl border border-white/10 bg-[#101624] p-4 lg:col-span-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-semibold text-white">
                {t.patchedFixturesTitle}
              </h2>
              <span className="text-xs text-slate-400 font-mono-tabular">
                · {fixtures.length} {t.totalLabel}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.searchFixturesPlaceholder}
                  className="h-9 rounded-lg border border-white/10 bg-[#0B101B] pl-8 pr-3 text-xs text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-[#0B101B] p-1">
                {(
                  [
                    {id: 'all', label: t.filterAll},
                    {id: 'beam', label: t.filterBeams},
                    {id: 'wash', label: t.filterWash},
                    {id: 'fx', label: t.filterFx},
                  ] as const
                ).map((grp) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setGroupFilter(grp.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      groupFilter === grp.id
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onChangeFixtures(DEFAULT_FIXTURES)}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-[#151D2E] px-3 text-xs font-medium text-slate-300 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{t.resetRigBtn}</span>
              </button>
            </div>
          </div>

          {filteredFixtures.length === 0 ? (
            <div className="rounded-lg border border-white/8 bg-[#0B101B] py-10 text-center">
              <p className="text-sm text-slate-300">
                {t.noFixtureMatch}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setGroupFilter('all');
                }}
                className="mt-2 text-xs font-medium text-sky-400 hover:text-sky-300"
              >
                {t.clearFiltersBtn}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 pr-3 font-medium">{t.colFixture}</th>
                    <th className="py-2.5 px-3 font-medium">{t.colDmxAddr}</th>
                    <th className="py-2.5 px-3 font-medium">{t.colChannels}</th>
                    <th className="py-2.5 px-3 font-medium">{t.colInvert}</th>
                    <th className="py-2.5 pl-3 text-right font-medium">{t.colAction}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {filteredFixtures.map((f) => {
                    const isExpanded = expandedFixtureId === f.id;
                    return (
                      <tr key={f.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-3">
                          <div className="font-medium text-white">{f.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {f.manufacturer ? `${f.manufacturer} · ` : ''}
                            {f.model} · {f.group}
                            {f.rdmUid ? (
                              <span className="font-mono-tabular text-sky-400">
                                {' '}
                                · RDM {f.rdmUid}
                              </span>
                            ) : null}
                          </div>
                          {f.channelLabels && f.channelLabels.length > 0 && (
                            <div className="mt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedFixtureId(isExpanded ? null : f.id)
                                }
                                className="text-[11px] font-medium text-sky-400 hover:text-sky-300"
                              >
                                {isExpanded ? t.hideChannelMap : t.showChannelMap}
                              </button>
                              {isExpanded && (
                                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-300 font-mono-tabular">
                                  {f.channelLabels.map((lbl, cIdx) => (
                                    <span key={cIdx}>
                                      CH{cIdx + 1}: {lbl}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="number"
                            min={1}
                            max={512 - f.channelCount + 1}
                            value={f.dmxStart}
                            onChange={(e) => {
                              const val = Math.max(
                                1,
                                Math.min(512 - f.channelCount + 1, Number(e.target.value) || 1),
                              );
                              onChangeFixtures(
                                fixtures.map((item) =>
                                  item.id === f.id ? {...item, dmxStart: val} : item,
                                ),
                              );
                            }}
                            aria-label={`${t.colDmxAddr} ${f.name}`}
                            className="font-mono-tabular h-8 w-16 rounded border border-white/10 bg-[#0B101B] px-2 text-xs text-sky-300 focus:border-sky-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular text-slate-300">
                          {f.channelCount}ch ({String(f.dmxStart).padStart(3, '0')}–
                          {String(f.dmxStart + f.channelCount - 1).padStart(3, '0')})
                        </td>
                        <td className="py-2.5 px-3">
                          {f.type === 'moving_head' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onChangeFixtures(
                                    fixtures.map((item) =>
                                      item.id === f.id
                                        ? {...item, panInvert: !item.panInvert}
                                        : item,
                                    ),
                                  )
                                }
                                className={`rounded border px-2 py-1 text-[11px] font-medium ${
                                  f.panInvert
                                    ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                                    : 'border-white/10 text-slate-400 hover:text-white'
                                }`}
                              >
                                Pan
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChangeFixtures(
                                    fixtures.map((item) =>
                                      item.id === f.id
                                        ? {...item, tiltInvert: !item.tiltInvert}
                                        : item,
                                    ),
                                  )
                                }
                                className={`rounded border px-2 py-1 text-[11px] font-medium ${
                                  f.tiltInvert
                                    ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                                    : 'border-white/10 text-slate-400 hover:text-white'
                                }`}
                              >
                                Tilt
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              onChangeFixtures(fixtures.filter((item) => item.id !== f.id))
                            }
                            aria-label={`Remover ${f.name}`}
                            className="rounded p-1.5 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Column: Online Search / Import Profile + Quick Add Fixture */}
        <div className="space-y-4 lg:col-span-4">
          {/* Online Search & File Import Card */}
          <section className="rounded-xl border border-white/10 bg-[#101624] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-white">
                {t.fixtureLibraryTitle}
              </h2>
              <div className="flex items-center gap-1 rounded-lg bg-[#0B101B] p-1">
                <button
                  type="button"
                  onClick={() => setProfileSourceTab('online')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    profileSourceTab === 'online'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.onlineSearchTab}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileSourceTab('upload')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    profileSourceTab === 'upload'
                      ? 'bg-sky-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.uploadFileTab}
                </button>
              </div>
            </div>

            {profileSourceTab === 'online' ? (
              <OnlineFixtureSearch
                onSelectProfile={(parsed) => {
                  setImportError(null);
                  setImportNotice(null);
                  setImportedProfile(parsed);
                  setSelectedModeIdx(0);
                  setImportTypeOverride(parsed.type);
                  setImportChannelOverride(parsed.modes[0]?.channelCount ?? 7);
                  setImportQty(1);
                }}
              />
            ) : (
              <>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) void processImportedFile(file);
                  }}
                  className={`rounded-lg border border-dashed p-4 text-center transition-colors ${
                    isDraggingFile
                      ? 'border-sky-400 bg-sky-500/10'
                      : 'border-white/15 bg-[#0B101B]'
                  }`}
                >
                  <FileUp className="mx-auto h-5 w-5 text-sky-400" />
                  <p className="mt-1.5 text-xs text-slate-300">
                    {t.dropProfileHint}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2.5 min-h-[36px] rounded-lg border border-white/15 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-white hover:border-sky-500/50"
                  >
                    {t.selectProfileFileBtn}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.csv,.ssl,.ssl2"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void processImportedFile(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span>{t.samplesLabel}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        downloadSample(
                          SAMPLE_OFL_FIXTURE_JSON,
                          'chauvet-intimidator-spot-255.json',
                          'application/json',
                        )
                      }
                      className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300"
                    >
                      <Download className="h-3 w-3" />
                      <span>OFL .json</span>
                    </button>
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={() =>
                        downloadSample(SAMPLE_CSV_FIXTURE, 'par-7ch-dmx.csv', 'text/csv')
                      }
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300"
                    >
                      <Download className="h-3 w-3" />
                      <span>DMX .csv</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {importError && (
              <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {importError}
              </p>
            )}

            {importNotice && (
              <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                {importNotice}
              </p>
            )}

            {importedProfile && (
              <div className="mt-3 space-y-3 rounded-lg border border-sky-500/35 bg-[#151D2E] p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-white">{importedProfile.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {importedProfile.manufacturer} · {importedProfile.sourceFormat.toUpperCase()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportedProfile(null)}
                    aria-label={t.discardProfileAria}
                    className="rounded p-1 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {importedProfile.note && (
                  <p className="text-[11px] text-amber-200/90">{importedProfile.note}</p>
                )}

                {importedProfile.modes.length > 1 && (
                  <div>
                    <label
                      htmlFor="import-mode"
                      className="mb-1 block text-[11px] font-medium text-slate-300"
                    >
                      {t.dmxModeLabel}
                    </label>
                    <select
                      id="import-mode"
                      value={selectedModeIdx}
                      onChange={(e) => {
                        const idx = Number(e.target.value);
                        setSelectedModeIdx(idx);
                        setImportChannelOverride(
                          importedProfile.modes[idx]?.channelCount ?? 7,
                        );
                      }}
                      className="h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    >
                      {importedProfile.modes.map((m, idx) => (
                        <option key={idx} value={idx}>
                          {m.modeName} ({m.channelCount}ch)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label
                      htmlFor="import-type"
                      className="mb-1 block text-[11px] font-medium text-slate-300"
                    >
                      {t.stageBehaviorLabel}
                    </label>
                    <select
                      id="import-type"
                      value={importTypeOverride}
                      onChange={(e) => setImportTypeOverride(e.target.value as FixtureType)}
                      className="h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                    >
                      {(Object.keys(t.fixtureTypeLabels) as FixtureType[]).map((ft) => (
                        <option key={ft} value={ft}>
                          {t.fixtureTypeLabels[ft]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="import-qty"
                      className="mb-1 block text-[11px] font-medium text-slate-300"
                    >
                      {t.qtyLabel}
                    </label>
                    <input
                      id="import-qty"
                      type="number"
                      min={1}
                      max={8}
                      value={importQty}
                      onChange={(e) =>
                        setImportQty(Math.max(1, Math.min(8, Number(e.target.value) || 1)))
                      }
                      className="font-mono-tabular h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="import-channels"
                    className="mb-1 block text-[11px] font-medium text-slate-300"
                  >
                    {t.channelCountLabel}
                  </label>
                  <input
                    id="import-channels"
                    type="number"
                    min={1}
                    max={64}
                    value={importChannelOverride}
                    onChange={(e) =>
                      setImportChannelOverride(
                        Math.max(1, Math.min(64, Number(e.target.value) || 1)),
                      )
                    }
                    className="font-mono-tabular h-9 w-full rounded-lg border border-white/10 bg-[#0B101B] px-2.5 text-xs text-sky-300 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                {activeImportedMode && activeImportedMode.channelLabels.length > 0 && (
                  <div className="max-h-24 overflow-y-auto rounded border border-white/8 bg-[#0B101B] p-2 text-[11px] text-slate-400 font-mono-tabular">
                    {activeImportedMode.channelLabels
                      .slice(0, importChannelOverride)
                      .map((lbl, idx) => (
                        <div key={idx} className="truncate">
                          CH {String(idx + 1).padStart(2, '0')} · {lbl}
                        </div>
                      ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePatchImported}
                  className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    {t.patchImportedBtn(importQty, String(nextFreeAddress).padStart(3, '0'))}
                  </span>
                </button>
              </div>
            )}
          </section>

          {/* Add Built-in Fixture */}
          <section className="rounded-xl border border-white/10 bg-[#101624] p-4">
            <h2 className="font-display text-base font-semibold text-white">
              {t.quickAddTitle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {t.quickAddSubtitle}
            </p>

            <form onSubmit={handleAddFixture} className="mt-3.5 space-y-3">
              <div>
                <label
                  htmlFor="fixture-profile"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  {t.fixtureProfileLabel}
                </label>
                <select
                  id="fixture-profile"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as FixtureType)}
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#0B101B] px-3 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  {FIXTURE_TEMPLATES.map((tpl) => (
                    <option key={tpl.type} value={tpl.type}>
                      {t.fixtureTypeLabels[tpl.type]} ({tpl.model} · {tpl.channelCount}ch)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="fixture-name"
                  className="mb-1.5 block text-xs font-medium text-slate-300"
                >
                  {t.customNameLabel}
                </label>
                <input
                  id="fixture-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t.customNamePlaceholder}
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#0B101B] px-3 text-xs text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-white/8 bg-[#0B101B] px-3 py-2.5 text-xs">
                <span className="text-slate-400">{t.nextFreeDmxLabel}</span>
                <span className="font-mono-tabular font-semibold text-sky-300">
                  CH {String(nextFreeAddress).padStart(3, '0')}
                </span>
              </div>

              <button
                type="submit"
                className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400"
              >
                <Plus className="h-4 w-4" />
                <span>{t.patchToUniverseBtn}</span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
