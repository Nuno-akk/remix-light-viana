import {useCallback, useEffect, useMemo, useState} from 'react';
import {Pause, Play, RotateCcw, Search, X} from 'lucide-react';
import {useLanguage} from '../i18n/LanguageContext';

export interface UniverseChannelOwner {
  fixtureName: string;
  label: string;
}

type ValueDisplayFormat = 'both' | 'dec' | 'hex';
type ChannelFilterMode = 'all' | 'active' | 'patched' | 'overridden';

const STORAGE_UNIVERSE_LABELS_KEY = 'lightrider_universe_labels_v1';

function loadStoredChannelLabels(): Record<number, string> {
  try {
    const raw = localStorage.getItem(STORAGE_UNIVERSE_LABELS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const clean: Record<number, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      const ch = Number(k);
      if (
        Number.isInteger(ch) &&
        ch >= 1 &&
        ch <= 512 &&
        typeof v === 'string' &&
        v.length > 0
      ) {
        clean[ch] = v.slice(0, 48);
      }
    }
    return clean;
  } catch {
    return {};
  }
}

interface UniverseMonitorProps {
  universeRef: React.MutableRefObject<Uint8Array>;
  channelOwnerMap: Map<number, UniverseChannelOwner>;
  rawDmxOverrides: Record<number, number>;
  onSetRawDmxOverride: (channel1Based: number, value: number | null) => void;
  onClearRawDmxOverrides: (channels?: number[]) => void;
}

export function UniverseMonitor({
  universeRef,
  channelOwnerMap,
  rawDmxOverrides,
  onSetRawDmxOverride,
  onClearRawDmxOverrides,
}: UniverseMonitorProps) {
  const {t} = useLanguage();
  const [format, setFormat] = useState<ValueDisplayFormat>('both');
  const [filterMode, setFilterMode] = useState<ChannelFilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [paused, setPaused] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<number>(1);
  const [anchorChannel, setAnchorChannel] = useState<number>(1);
  const [selectedChannels, setSelectedChannels] = useState<number[]>([1]);
  const [bulkLabelInput, setBulkLabelInput] = useState<string>('');
  const [customLabels, setCustomLabels] = useState<Record<number, string>>(
    loadStoredChannelLabels,
  );
  const [snapshot, setSnapshot] = useState<Uint8Array>(() => {
    const copy = new Uint8Array(512);
    copy.set(universeRef.current.subarray(0, 512));
    return copy;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_UNIVERSE_LABELS_KEY,
        JSON.stringify(customLabels),
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [customLabels]);

  const handleChangeChannelLabel = useCallback((ch: number, value: string) => {
    const nextVal = value.slice(0, 48);
    setCustomLabels((prev) => {
      if (nextVal === '') {
        if (!(ch in prev)) return prev;
        const copy = {...prev};
        delete copy[ch];
        return copy;
      }
      return {...prev, [ch]: nextVal};
    });
  }, []);

  const handleBulkApplyLabel = useCallback(
    (channels: number[], rawLabel: string) => {
      const nextVal = rawLabel.trim().slice(0, 48);
      if (!nextVal || channels.length === 0) return;
      setCustomLabels((prev) => {
        const next = {...prev};
        for (const ch of channels) {
          next[ch] = nextVal;
        }
        return next;
      });
    },
    [],
  );

  const handleBulkClearLabels = useCallback((channels: number[]) => {
    if (channels.length === 0) return;
    setCustomLabels((prev) => {
      let changed = false;
      const next = {...prev};
      for (const ch of channels) {
        if (ch in next) {
          delete next[ch];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setBulkLabelInput('');
  }, []);

  useEffect(() => {
    if (paused) return;

    const sample = () => {
      const next = new Uint8Array(512);
      next.set(universeRef.current.subarray(0, 512));
      setSnapshot(next);
    };

    sample();
    const id = window.setInterval(sample, 70);
    return () => window.clearInterval(id);
  }, [paused, universeRef]);

  const overrideCount = Object.keys(rawDmxOverrides).length;

  const stats = useMemo(() => {
    let activeCount = 0;
    for (let i = 0; i < 512; i += 1) {
      const ch = i + 1;
      const val =
        typeof rawDmxOverrides[ch] === 'number'
          ? rawDmxOverrides[ch]
          : (snapshot[i] ?? 0);
      if (val > 0) activeCount += 1;
    }
    return {
      activeCount,
      patchedCount: channelOwnerMap.size,
      overrideCount,
    };
  }, [snapshot, rawDmxOverrides, channelOwnerMap, overrideCount]);

  const visibleChannels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list: number[] = [];

    for (let ch = 1; ch <= 512; ch += 1) {
      const overridden = typeof rawDmxOverrides[ch] === 'number';
      const val = overridden ? rawDmxOverrides[ch] : (snapshot[ch - 1] ?? 0);
      const owner = channelOwnerMap.get(ch);
      const customLabel = customLabels[ch] || '';

      if (filterMode === 'active' && val === 0) continue;
      if (filterMode === 'patched' && !owner) continue;
      if (filterMode === 'overridden' && !overridden) continue;

      if (q) {
        const chStr = String(ch);
        const chPad = chStr.padStart(3, '0');
        const hexStr = val.toString(16).toUpperCase().padStart(2, '0');
        const matchesQuery =
          chStr.includes(q) ||
          chPad.includes(q) ||
          `0x${hexStr.toLowerCase()}`.includes(q) ||
          customLabel.toLowerCase().includes(q) ||
          (owner &&
            (owner.fixtureName.toLowerCase().includes(q) ||
              owner.label.toLowerCase().includes(q)));
        if (!matchesQuery) continue;
      }

      list.push(ch);
    }

    return list;
  }, [
    searchQuery,
    filterMode,
    snapshot,
    rawDmxOverrides,
    channelOwnerMap,
    customLabels,
  ]);

  const selectedSet = useMemo(
    () => new Set(selectedChannels),
    [selectedChannels],
  );
  const isMultiSelected = selectedChannels.length > 1;
  const selectionBounds = useMemo(() => {
    let min = 512;
    let max = 1;
    let labeledCount = 0;
    for (const ch of selectedChannels) {
      if (ch < min) min = ch;
      if (ch > max) max = ch;
      if (customLabels[ch]) labeledCount += 1;
    }
    return {min, max, labeledCount};
  }, [selectedChannels, customLabels]);

  const handleSelectChannel = useCallback(
    (ch: number, e: React.MouseEvent<HTMLButtonElement>) => {
      if (e.shiftKey) {
        const anchorIdx = visibleChannels.indexOf(anchorChannel);
        const targetIdx = visibleChannels.indexOf(ch);
        if (anchorIdx !== -1 && targetIdx !== -1) {
          const start = Math.min(anchorIdx, targetIdx);
          const end = Math.max(anchorIdx, targetIdx);
          const range = visibleChannels.slice(start, end + 1);
          setSelectedChannels(range);
        } else {
          const start = Math.min(anchorChannel, ch);
          const end = Math.max(anchorChannel, ch);
          const range: number[] = [];
          for (let i = start; i <= end; i += 1) {
            range.push(i);
          }
          setSelectedChannels(range);
        }
        setSelectedChannel(ch);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        setSelectedChannels((prev) => {
          const exists = prev.includes(ch);
          if (exists) {
            if (prev.length === 1) return prev;
            const filtered = prev.filter((item) => item !== ch);
            const fallback = filtered[filtered.length - 1] ?? ch;
            setSelectedChannel(fallback);
            setAnchorChannel(fallback);
            return filtered;
          }
          const next = [...prev, ch].sort((a, b) => a - b);
          setSelectedChannel(ch);
          setAnchorChannel(ch);
          return next;
        });
        return;
      }

      setSelectedChannel(ch);
      setAnchorChannel(ch);
      setSelectedChannels([ch]);
    },
    [anchorChannel, visibleChannels],
  );

  const selectedOverridden = typeof rawDmxOverrides[selectedChannel] === 'number';
  const selectedVal = selectedOverridden
    ? rawDmxOverrides[selectedChannel]
    : (snapshot[selectedChannel - 1] ?? 0);
  const selectedHex = selectedVal.toString(16).toUpperCase().padStart(2, '0');
  const selectedPct = Math.round((selectedVal / 255) * 100);
  const selectedOwner = channelOwnerMap.get(selectedChannel);
  const selectedCustomLabel = customLabels[selectedChannel] ?? '';

  return (
    <div className="space-y-3">
      {/* Header & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-sm font-semibold text-white">
            {t.universeTitle}
          </h3>
          <p className="text-xs text-slate-400">
            {t.universeSubtitle}
          </p>
        </div>

        <div className="font-mono-tabular text-xs text-slate-400">
          {t.universeStatsLine(
            stats.activeCount,
            stats.patchedCount,
            stats.overrideCount,
          )}
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-y border-white/8 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Selector: DEC + HEX | DEC | HEX */}
          <div className="flex items-center gap-1 rounded-lg bg-[#080B12] p-1 ring-1 ring-white/10">
            {(
              [
                {id: 'both', label: t.universeFormatBoth},
                {id: 'dec', label: t.universeFormatDec},
                {id: 'hex', label: t.universeFormatHex},
              ] as Array<{id: ValueDisplayFormat; label: string}>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFormat(opt.id)}
                className={`min-h-[34px] rounded-md px-2.5 py-1 font-mono-tabular text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  format === opt.id
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Filter Mode Selector */}
          <div className="flex items-center gap-1 rounded-lg bg-[#080B12] p-1 ring-1 ring-white/10">
            {(
              [
                {id: 'all', label: t.universeFilterAll},
                {id: 'active', label: t.universeFilterActive},
                {id: 'patched', label: t.universeFilterPatched},
                {id: 'overridden', label: t.universeFilterOverridden},
              ] as Array<{id: ChannelFilterMode; label: string}>
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterMode(opt.id)}
                className={`min-h-[34px] rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  filterMode === opt.id
                    ? 'bg-slate-200 text-slate-950'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.universeSearchPlaceholder}
              aria-label={t.universeSearchPlaceholder}
              className="min-h-[36px] w-56 rounded-lg border border-white/10 bg-[#080B12] pl-8 pr-7 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none sm:w-64"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={t.closeBtn}
                className="absolute right-1.5 rounded p-1 text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Freeze / Live Readout Toggle */}
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className={`flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              paused
                ? 'border-amber-500/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25'
                : 'border-white/15 bg-[#151D2E] text-slate-200 hover:border-sky-500/50 hover:text-white'
            }`}
          >
            {paused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
            <span>{paused ? t.universeResumeBtn : t.universePauseBtn}</span>
          </button>

          {overrideCount > 0 && (
            <button
              type="button"
              onClick={() => onClearRawDmxOverrides()}
              className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t.releaseAllCount(overrideCount)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Channel Inspector or Multi-Selection Bulk Label Bar */}
      {isMultiSelected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-500/40 bg-[#0B101B] px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="font-mono-tabular text-xs font-semibold text-sky-300">
              {t.universeBulkSelectedSummary(
                selectedChannels.length,
                selectionBounds.min,
                selectionBounds.max,
              )}
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleBulkApplyLabel(selectedChannels, bulkLabelInput);
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={bulkLabelInput}
                onChange={(e) => setBulkLabelInput(e.target.value)}
                maxLength={48}
                placeholder={t.universeBulkLabelPlaceholder}
                aria-label={t.universeBulkLabelAria}
                className="min-h-[36px] w-52 rounded-lg border border-white/15 bg-[#080B12] px-2.5 pr-7 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none sm:w-64"
              />
              {bulkLabelInput && (
                <button
                  type="button"
                  onClick={() => setBulkLabelInput('')}
                  aria-label={t.closeBtn}
                  className="absolute right-1.5 rounded p-0.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={bulkLabelInput.trim().length === 0}
              className="min-h-[36px] rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-sky-400 whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t.universeBulkApplyBtn}
            </button>

            <button
              type="button"
              disabled={selectionBounds.labeledCount === 0}
              onClick={() => handleBulkClearLabels(selectedChannels)}
              className="min-h-[36px] rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/25 whitespace-nowrap shrink-0 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {t.universeBulkClearLabelsBtn(selectionBounds.labeledCount)}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedChannels([selectedChannel]);
                setAnchorChannel(selectedChannel);
              }}
              className="min-h-[36px] rounded-lg border border-white/15 bg-[#151D2E] px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              {t.universeBulkDeselectBtn}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#0B101B] px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-mono-tabular text-sm font-bold text-sky-300">
              {t.universeInspectorChannel(selectedChannel)}
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="font-medium text-slate-200">
              {selectedOwner
                ? `${selectedOwner.fixtureName} · ${selectedOwner.label}`
                : t.universeUnpatchedLabel}
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-tabular text-slate-300">
              DEC <strong className="text-white">{String(selectedVal).padStart(3, '0')}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-tabular text-slate-300">
              HEX <strong className="text-sky-300">0x{selectedHex}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="font-mono-tabular text-slate-400">
              {selectedPct}%
            </span>

            <div className="relative flex items-center">
              <input
                type="text"
                value={selectedCustomLabel}
                onChange={(e) =>
                  handleChangeChannelLabel(selectedChannel, e.target.value)
                }
                maxLength={48}
                placeholder={t.universeLabelPlaceholder}
                aria-label={t.universeInspectorLabelAria(selectedChannel)}
                className="min-h-[32px] w-44 rounded border border-white/12 bg-[#080B12] px-2.5 pr-6 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none sm:w-52"
              />
              {selectedCustomLabel && (
                <button
                  type="button"
                  onClick={() => handleChangeChannelLabel(selectedChannel, '')}
                  aria-label={t.universeClearLabelAria(selectedChannel)}
                  className="absolute right-1 rounded p-0.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-500">
              {t.universeShiftClickHint}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="range"
              aria-label={t.universeInspectorChannel(selectedChannel)}
              min={0}
              max={255}
              value={selectedVal}
              onChange={(e) =>
                onSetRawDmxOverride(selectedChannel, Number(e.target.value))
              }
              className="console-slider w-36 sm:w-44"
            />
            <button
              type="button"
              onClick={() => onSetRawDmxOverride(selectedChannel, 0)}
              className="min-h-[32px] rounded border border-white/10 bg-[#151D2E] px-2.5 py-1 font-mono-tabular text-[11px] font-medium text-slate-300 hover:text-white whitespace-nowrap shrink-0"
            >
              {t.universeInspectorSetZero}
            </button>
            <button
              type="button"
              onClick={() => onSetRawDmxOverride(selectedChannel, 255)}
              className="min-h-[32px] rounded border border-white/10 bg-[#151D2E] px-2.5 py-1 font-mono-tabular text-[11px] font-medium text-slate-300 hover:text-white whitespace-nowrap shrink-0"
            >
              {t.universeInspectorSetFull}
            </button>
            {selectedOverridden && (
              <button
                type="button"
                onClick={() => onSetRawDmxOverride(selectedChannel, null)}
                className="min-h-[32px] rounded border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/25 whitespace-nowrap shrink-0"
              >
                {t.universeInspectorRelease}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 512-Channel Matrix */}
      {visibleChannels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#0B101B] py-10 text-center">
          <p className="text-xs text-slate-400">{t.universeEmptyFiltered}</p>
          <button
            type="button"
            onClick={() => {
              setFilterMode('all');
              setSearchQuery('');
            }}
            className="min-h-[36px] rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-sky-400"
          >
            {t.universeResetFilters}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:grid-cols-8 lg:grid-cols-12 2xl:grid-cols-[repeat(16,minmax(0,1fr))]">
          {visibleChannels.map((ch) => {
            const overridden = typeof rawDmxOverrides[ch] === 'number';
            const val = overridden ? rawDmxOverrides[ch] : (snapshot[ch - 1] ?? 0);
            const hex = val.toString(16).toUpperCase().padStart(2, '0');
            const owner = channelOwnerMap.get(ch);
            const customLabel = customLabels[ch] ?? '';
            const isSelected = selectedSet.has(ch);
            const isPrimary = selectedChannel === ch;
            const isActive = val > 0;

            return (
              <div
                key={ch}
                title={
                  customLabel
                    ? `CH ${String(ch).padStart(3, '0')} · ${customLabel} · DEC ${val} / 0x${hex}`
                    : owner
                      ? `CH ${String(ch).padStart(3, '0')} · ${owner.fixtureName} (${owner.label}) · DEC ${val} / 0x${hex}`
                      : `CH ${String(ch).padStart(3, '0')} · ${t.universeUnpatchedLabel} · DEC ${val} / 0x${hex}`
                }
                className={`relative flex flex-col justify-between overflow-hidden rounded border px-1.5 pt-1 pb-1.5 transition-colors ${
                  isSelected
                    ? isMultiSelected && isPrimary
                      ? 'border-sky-300 bg-sky-500/25 ring-1 ring-sky-400/60'
                      : 'border-sky-400 bg-sky-500/20'
                    : overridden
                      ? 'border-amber-500/60 bg-amber-500/10 hover:border-amber-400'
                      : owner
                        ? isActive
                          ? 'border-sky-500/35 bg-[#121B2E] hover:border-sky-400/60'
                          : 'border-white/12 bg-[#0D1322] hover:border-white/25'
                        : isActive
                          ? 'border-white/15 bg-[#111726] hover:border-white/25'
                          : 'border-white/6 bg-[#090D16] hover:border-white/15'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => handleSelectChannel(ch, e)}
                  aria-pressed={isSelected}
                  aria-label={`DMX ${ch} ${customLabel || owner?.fixtureName || ''} ${val} 0x${hex}`}
                  className="w-full select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-sm"
                >
                  <div className="flex w-full items-center justify-between gap-1 font-mono-tabular text-[10px] leading-none">
                    <span
                      className={
                        isSelected
                          ? 'font-bold text-sky-200'
                          : owner
                            ? 'text-slate-400'
                            : 'text-slate-500'
                      }
                    >
                      {String(ch).padStart(3, '0')}
                    </span>
                    {overridden ? (
                      <span className="text-[9px] font-bold text-amber-300">
                        {t.universeOverriddenTag}
                      </span>
                    ) : owner ? (
                      <span className="truncate text-[9px] text-sky-400/75">
                        {owner.label.slice(0, 5)}
                      </span>
                    ) : null}
                  </div>

                  {format === 'both' && (
                    <div className="mt-1 flex w-full items-baseline justify-between gap-1 font-mono-tabular leading-tight">
                      <span
                        className={`text-xs font-semibold ${
                          overridden
                            ? 'text-amber-200'
                            : isActive
                              ? 'text-white'
                              : 'text-slate-500'
                        }`}
                      >
                        {val}
                      </span>
                      <span
                        className={`text-[10px] ${
                          overridden
                            ? 'text-amber-300/90'
                            : isActive
                              ? 'text-sky-300'
                              : 'text-slate-600'
                        }`}
                      >
                        {hex}
                      </span>
                    </div>
                  )}

                  {format === 'dec' && (
                    <div
                      className={`mt-1 font-mono-tabular text-xs font-semibold leading-tight ${
                        overridden
                          ? 'text-amber-200'
                          : isActive
                            ? 'text-white'
                            : 'text-slate-500'
                      }`}
                    >
                      {String(val).padStart(3, '0')}
                    </div>
                  )}

                  {format === 'hex' && (
                    <div
                      className={`mt-1 font-mono-tabular text-xs font-semibold leading-tight ${
                        overridden
                          ? 'text-amber-200'
                          : isActive
                            ? 'text-sky-300'
                            : 'text-slate-500'
                      }`}
                    >
                      0x{hex}
                    </div>
                  )}
                </button>

                <input
                  type="text"
                  value={customLabel}
                  onFocus={() => {
                    setSelectedChannel(ch);
                    if (!selectedSet.has(ch)) {
                      setSelectedChannels([ch]);
                      setAnchorChannel(ch);
                    }
                  }}
                  onChange={(e) => handleChangeChannelLabel(ch, e.target.value)}
                  maxLength={48}
                  placeholder={owner ? owner.label : t.universeLabelPlaceholder}
                  aria-label={t.universeCustomLabelAria(ch)}
                  className={`mt-1 w-full rounded border bg-[#070A11]/90 px-1 py-0.5 text-[10px] leading-tight focus:border-sky-400 focus:outline-none ${
                    customLabel
                      ? 'border-sky-500/40 text-slate-100'
                      : 'border-white/8 text-slate-300 placeholder:text-slate-600'
                  }`}
                />

                <span
                  aria-hidden="true"
                  className={`absolute right-0 bottom-0 left-0 h-[2px] origin-left ${
                    overridden
                      ? 'bg-amber-400'
                      : owner
                        ? 'bg-sky-400'
                        : 'bg-slate-400'
                  }`}
                  style={{transform: `scaleX(${val / 255})`}}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
