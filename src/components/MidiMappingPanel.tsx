import {useEffect, useMemo, useState} from 'react';
import {
  Check,
  Radio,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import {
  formatMidiBindingLabel,
  MIDI_TARGET_CATALOG,
  MidiAccessStatus,
} from '../hooks/useMidiMapping';
import {useLanguage} from '../i18n/LanguageContext';
import {
  BeamFxState,
  ColorFxState,
  FlashFxState,
  GroupDimmerState,
  MidiBinding,
  MidiDeviceInfo,
  MidiLastMessage,
  MidiMessageType,
  MidiTargetCategory,
  MidiTargetId,
  MidiTriggerMode,
  MoveFxState,
} from '../types/dmx';

type FilterScope = 'all' | 'dimmers' | 'fx_trigger' | 'fx_param' | 'assigned';

interface MidiMappingPanelProps {
  bindings: MidiBinding[];
  devices: MidiDeviceInfo[];
  selectedDeviceId: string;
  onSelectDeviceId: (id: string) => void;
  accessStatus: MidiAccessStatus;
  learningTargetId: MidiTargetId | null;
  lastMessage: MidiLastMessage | null;
  recentTargetHit: {targetId: MidiTargetId; timestamp: number} | null;
  onScanDevices: () => void;
  onStartLearn: (targetId: MidiTargetId) => void;
  onCancelLearn: () => void;
  onUpsertBinding: (
    targetId: MidiTargetId,
    partial: Partial<Omit<MidiBinding, 'id' | 'targetId'>>,
  ) => void;
  onRemoveBinding: (targetId: MidiTargetId) => void;
  onClearAllBindings: () => void;
  onLoadStandardTemplate: () => void;
  // Live state values for immediate feedback in the mapping table
  masterDimmer: number;
  groupDimmers: GroupDimmerState;
  flashFx: FlashFxState;
  moveFx: MoveFxState;
  colorFx: ColorFxState;
  beamFx: BeamFxState;
  bpm: number;
}

export function MidiMappingPanel({
  bindings,
  devices,
  selectedDeviceId,
  onSelectDeviceId,
  accessStatus,
  learningTargetId,
  lastMessage,
  recentTargetHit,
  onScanDevices,
  onStartLearn,
  onCancelLearn,
  onUpsertBinding,
  onRemoveBinding,
  onClearAllBindings,
  onLoadStandardTemplate,
  masterDimmer,
  groupDimmers,
  flashFx,
  moveFx,
  colorFx,
  beamFx,
  bpm,
}: MidiMappingPanelProps) {
  const {t} = useLanguage();
  const [scope, setScope] = useState<FilterScope>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTargetId, setEditingTargetId] = useState<MidiTargetId | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Cancel MIDI Learn with Escape key
  useEffect(() => {
    if (!learningTargetId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancelLearn();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [learningTargetId, onCancelLearn]);

  // Brief activity flash timer for recently triggered rows
  useEffect(() => {
    if (!recentTargetHit) return;
    setNowTick(Date.now());
    const timer = window.setTimeout(() => setNowTick(Date.now()), 380);
    return () => window.clearTimeout(timer);
  }, [recentTargetHit]);

  const bindingByTarget = useMemo(() => {
    const map = new Map<MidiTargetId, MidiBinding>();
    for (const b of bindings) {
      map.set(b.targetId, b);
    }
    return map;
  }, [bindings]);

  const getTargetLiveReadout = (
    targetId: MidiTargetId,
  ): {text: string; active: boolean} => {
    switch (targetId) {
      case 'master_dimmer':
        return {text: `${masterDimmer}%`, active: masterDimmer > 0};
      case 'group_beam':
        return {text: `${groupDimmers.beam}%`, active: groupDimmers.beam > 0};
      case 'group_wash':
        return {text: `${groupDimmers.wash}%`, active: groupDimmers.wash > 0};
      case 'group_fx':
        return {text: `${groupDimmers.fx}%`, active: groupDimmers.fx > 0};
      case 'group_smoke':
        return {text: `${groupDimmers.smoke}%`, active: groupDimmers.smoke > 0};
      case 'fx_strobe':
        return {text: flashFx.strobe ? t.midiLiveStateActive : 'OFF', active: flashFx.strobe};
      case 'fx_blinder':
        return {text: flashFx.blinder ? t.midiLiveStateActive : 'OFF', active: flashFx.blinder};
      case 'fx_smoke':
        return {text: flashFx.smoke ? t.midiLiveStateActive : 'OFF', active: flashFx.smoke};
      case 'fx_blackout':
        return {
          text: flashFx.blackout ? 'BLACKOUT' : t.midiLiveStateLive,
          active: flashFx.blackout,
        };
      case 'fx_freeze':
        return {
          text: flashFx.freeze ? t.midiLiveStateFrozen : t.midiLiveStateLive,
          active: flashFx.freeze,
        };
      case 'fx_tap_bpm':
        return {text: `${Math.round(bpm)} BPM`, active: true};
      case 'fx_move_toggle':
        return {text: moveFx.enabled ? 'ON' : 'OFF', active: moveFx.enabled};
      case 'fx_color_toggle':
        return {text: colorFx.enabled ? 'ON' : 'OFF', active: colorFx.enabled};
      case 'fx_gobo_spin':
        return {text: beamFx.goboSpin ? 'ON' : 'OFF', active: beamFx.goboSpin};
      case 'fx_prism':
        return {text: beamFx.prism ? 'ON' : 'OFF', active: beamFx.prism};
      case 'fx_iris_pulse':
        return {text: beamFx.irisPulse ? 'ON' : 'OFF', active: beamFx.irisPulse};
      case 'fx_uv_mode':
        return {text: beamFx.uvMode ? 'ON' : 'OFF', active: beamFx.uvMode};
      case 'fx_move_speed':
        return {text: `${moveFx.speed}%`, active: moveFx.enabled};
      case 'fx_move_size':
        return {text: `${moveFx.size}%`, active: moveFx.enabled};
      case 'fx_color_speed':
        return {text: `${colorFx.speed}%`, active: colorFx.enabled};
      case 'fx_color_fade':
        return {text: `${colorFx.fade}%`, active: colorFx.enabled};
      case 'fx_color_shift':
        return {text: `${colorFx.shift}%`, active: colorFx.enabled};
      case 'fx_beam_zoom':
        return {text: `${beamFx.beamSpread}%`, active: beamFx.beamSpread > 0};
      case 'fx_strobe_rate':
        return {text: `${flashFx.strobeRate} Hz`, active: flashFx.strobe};
    }
  };

  const filteredTargets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MIDI_TARGET_CATALOG.filter((item) => {
      if (scope === 'dimmers') {
        if (item.category !== 'master' && item.category !== 'group') return false;
      } else if (scope === 'fx_trigger') {
        if (item.category !== 'fx_trigger') return false;
      } else if (scope === 'fx_param') {
        if (item.category !== 'fx_param') return false;
      } else if (scope === 'assigned') {
        if (!bindingByTarget.has(item.id)) return false;
      }

      if (q) {
        const loc = t.midiTargets[item.id];
        const matchLabel = (loc?.label ?? item.label).toLowerCase().includes(q);
        const matchDesc = (loc?.description ?? item.description).toLowerCase().includes(q);
        const matchCat = (loc?.categoryLabel ?? item.categoryLabel).toLowerCase().includes(q);
        if (!matchLabel && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [scope, searchQuery, bindingByTarget, t.midiTargets]);

  const connectedDevices = devices.filter((d) => d.state === 'connected');

  const statusText = useMemo(() => {
    if (accessStatus === 'unsupported') {
      return t.midiStatusUnsupported;
    }
    if (accessStatus === 'denied') {
      return t.midiStatusDenied;
    }
    if (connectedDevices.length > 0) {
      return t.midiStatusActive(connectedDevices.length, bindings.length);
    }
    if (accessStatus === 'ready') {
      return t.midiStatusReady(bindings.length);
    }
    return t.midiStatusIdle(bindings.length);
  }, [accessStatus, connectedDevices.length, bindings.length, t]);

  const formatLastMessage = (msg: MidiLastMessage): string => {
    if (msg.messageType === 'cc') {
      return `CC ${String(msg.control).padStart(2, '0')} · Ch ${msg.channel} · Val ${msg.value} (${Math.round(msg.normalized * 100)}%)`;
    }
    if (msg.messageType === 'note') {
      return `Note ${msg.control} · Ch ${msg.channel} · Vel ${msg.value}`;
    }
    return `Pitch Bend · Ch ${msg.channel} · ${Math.round(msg.normalized * 100)}%`;
  };

  const categoryColorClass = (cat: MidiTargetCategory) => {
    if (cat === 'master') return 'text-amber-300';
    if (cat === 'group') return 'text-sky-300';
    if (cat === 'fx_trigger') return 'text-rose-300';
    return 'text-emerald-300';
  };

  return (
    <section className="rounded-xl border border-white/10 bg-[#101624] p-4 lg:col-span-12">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-white">
            {t.midiTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {t.midiSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t.midiFilterDeviceAria}
            value={selectedDeviceId}
            onChange={(e) => onSelectDeviceId(e.target.value)}
            className="min-h-[38px] rounded-lg border border-white/15 bg-[#0B101B] px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-sky-500 focus:outline-none"
          >
            <option value="all">{t.midiAllInputs(connectedDevices.length)}</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.state === 'disconnected' ? t.midiDisconnectedTag : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onScanDevices}
            className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#151D2E] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-500/50 hover:text-white whitespace-nowrap shrink-0"
          >
            <Radio className="h-3.5 w-3.5 text-amber-400" />
            <span>{t.scanMidiBtn}</span>
          </button>

          <button
            type="button"
            onClick={onLoadStandardTemplate}
            className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#151D2E] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-sky-500/50 hover:text-white whitespace-nowrap shrink-0"
          >
            <Wand2 className="h-3.5 w-3.5 text-sky-400" />
            <span>{t.midiStandardMap}</span>
          </button>

          <button
            type="button"
            disabled={bindings.length === 0}
            onClick={onClearAllBindings}
            className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#151D2E] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-rose-500/40 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t.midiClearAll}</span>
          </button>
        </div>
      </div>

      {/* Hardware Readiness & Live Monitor Strip */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-[#080B12] px-3.5 py-2.5 text-xs">
        <div
          className={`font-medium ${
            accessStatus === 'unsupported' || accessStatus === 'denied'
              ? 'text-rose-300'
              : connectedDevices.length > 0
                ? 'text-emerald-300'
                : 'text-slate-300'
          }`}
        >
          {statusText}
        </div>

        <div className="font-mono-tabular text-[11px] text-slate-400">
          {lastMessage ? (
            <span>
              {t.midiLastInput}{' '}
              <strong className="text-sky-300">
                {formatLastMessage(lastMessage)}
              </strong>{' '}
              <span className="text-slate-500">({lastMessage.deviceName})</span>
            </span>
          ) : (
            <span>{t.midiMonitorHint}</span>
          )}
        </div>
      </div>

      {/* Active MIDI Learn Prompt */}
      {learningTargetId && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3.5 py-2.5">
          <div className="text-xs text-amber-100">
            <strong className="font-semibold text-amber-300">{t.midiLearnActive}</strong>{' '}
            {t.midiLearnPrompt}{' '}
            <strong className="text-white">
              {t.midiTargets[learningTargetId]?.label}
            </strong>
          </div>
          <button
            type="button"
            onClick={onCancelLearn}
            className="flex min-h-[34px] items-center gap-1 rounded-md border border-amber-400/40 bg-[#0B101B] px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 whitespace-nowrap shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            <span>{t.midiCancelEsc}</span>
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#080B12] p-1 ring-1 ring-white/10">
          {(
            [
              {id: 'all', label: t.midiTabAll(MIDI_TARGET_CATALOG.length)},
              {id: 'dimmers', label: t.midiTabDimmers},
              {id: 'fx_trigger', label: t.midiTabTriggers},
              {id: 'fx_param', label: t.midiTabParams},
              {id: 'assigned', label: t.midiTabAssigned(bindings.length)},
            ] as Array<{id: FilterScope; label: string}>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScope(tab.id)}
              className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                scope === tab.id
                  ? 'bg-sky-500 text-slate-950'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px] flex-1 sm:max-w-[280px]">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.midiSearchPlaceholder}
            className="min-h-[38px] w-full rounded-lg border border-white/10 bg-[#0B101B] py-1.5 pr-8 pl-8 text-xs text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label={t.midiClearSearchAria}
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mapping Grid / Table */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-white/8 bg-[#0B101B]">
        {filteredTargets.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-300">
              {scope === 'assigned' && bindings.length === 0
                ? t.midiNoBindingsTitle
                : t.midiNoMatchTitle}
            </p>
            <p className="max-w-md text-xs text-slate-500">
              {scope === 'assigned' && bindings.length === 0
                ? t.midiNoBindingsHint
                : t.midiNoMatchHint}
            </p>
            <button
              type="button"
              onClick={() => {
                setScope('all');
                setSearchQuery('');
              }}
              className="mt-1 min-h-[36px] rounded-lg border border-white/15 bg-[#151D2E] px-3 py-1.5 text-xs font-semibold text-white hover:border-sky-500/50"
            >
              {t.midiShowAllBtn}
            </button>
          </div>
        ) : (
          <table className="w-full min-w-[780px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/8 bg-[#12192A] text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <th className="px-3.5 py-2.5">{t.midiColTarget}</th>
                <th className="px-3 py-2.5">{t.midiColLiveState}</th>
                <th className="px-3 py-2.5">{t.midiColAssignment}</th>
                <th className="px-3 py-2.5">{t.midiColBehavior}</th>
                <th className="px-3.5 py-2.5 text-right">{t.midiColActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/8">
              {filteredTargets.map((target) => {
                const localized = t.midiTargets[target.id];
                const targetLabel = localized?.label ?? target.label;
                const targetCatLabel = localized?.categoryLabel ?? target.categoryLabel;
                const targetDesc = localized?.description ?? target.description;
                const binding = bindingByTarget.get(target.id);
                const isLearning = learningTargetId === target.id;
                const isEditing = editingTargetId === target.id;
                const live = getTargetLiveReadout(target.id);
                const recentlyHit =
                  recentTargetHit?.targetId === target.id &&
                  nowTick - recentTargetHit.timestamp < 360;

                return (
                  <tr
                    key={target.id}
                    className={`transition-colors ${
                      isLearning
                        ? 'bg-amber-500/10'
                        : recentlyHit
                          ? 'bg-sky-500/10'
                          : 'hover:bg-white/[0.025]'
                    }`}
                  >
                    {/* Console Target */}
                    <td className="px-3.5 py-2.5 align-top">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{targetLabel}</span>
                        <span
                          className={`text-[11px] font-medium ${categoryColorClass(target.category)}`}
                        >
                          · {targetCatLabel}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {targetDesc}
                      </div>

                      {/* Inline Manual Editor when expanded */}
                      {isEditing && (
                        <div className="mt-2.5 flex flex-wrap items-end gap-2 rounded-lg border border-white/10 bg-[#151D2E] p-2.5">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase">
                              {t.midiMsgTypeLabel}
                            </label>
                            <select
                              value={
                                binding?.messageType ??
                                (target.defaultMode === 'fader' ? 'cc' : 'note')
                              }
                              onChange={(e) =>
                                onUpsertBinding(target.id, {
                                  messageType: e.target.value as MidiMessageType,
                                })
                              }
                              className="min-h-[32px] rounded border border-white/15 bg-[#0B101B] px-2 text-xs text-white"
                            >
                              <option value="cc">{t.midiMsgCc}</option>
                              <option value="note">{t.midiMsgNote}</option>
                              <option value="pitchbend">{t.midiMsgPitchBend}</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase">
                              {t.midiChannelLabel}
                            </label>
                            <select
                              value={binding?.channel ?? 0}
                              onChange={(e) =>
                                onUpsertBinding(target.id, {
                                  channel: Number(e.target.value),
                                })
                              }
                              className="font-mono-tabular min-h-[32px] rounded border border-white/15 bg-[#0B101B] px-2 text-xs text-white"
                            >
                              <option value={0}>{t.midiAnyChannel}</option>
                              {Array.from({length: 16}, (_, idx) => idx + 1).map((ch) => (
                                <option key={ch} value={ch}>
                                  Ch {ch}
                                </option>
                              ))}
                            </select>
                          </div>

                          {(binding?.messageType ??
                            (target.defaultMode === 'fader' ? 'cc' : 'note')) !==
                            'pitchbend' && (
                            <div>
                              <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase">
                                {(binding?.messageType ??
                                  (target.defaultMode === 'fader' ? 'cc' : 'note')) ===
                                'cc'
                                  ? 'CC #'
                                  : 'Note #'}
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={127}
                                value={binding?.control ?? 1}
                                onChange={(e) => {
                                  const num = Math.max(
                                    0,
                                    Math.min(127, Number(e.target.value) || 0),
                                  );
                                  onUpsertBinding(target.id, {control: num});
                                }}
                                className="font-mono-tabular min-h-[32px] w-16 rounded border border-white/15 bg-[#0B101B] px-2 text-xs text-white"
                              />
                            </div>
                          )}

                          {(binding?.mode ?? target.defaultMode) === 'fader' && (
                            <>
                              <div>
                                <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase">
                                  Min %
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={binding?.minValue ?? 0}
                                  onChange={(e) => {
                                    const num = Math.max(
                                      0,
                                      Math.min(100, Number(e.target.value) || 0),
                                    );
                                    onUpsertBinding(target.id, {minValue: num});
                                  }}
                                  className="font-mono-tabular min-h-[32px] w-16 rounded border border-white/15 bg-[#0B101B] px-2 text-xs text-white"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-semibold text-slate-400 uppercase">
                                  Max %
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={binding?.maxValue ?? 100}
                                  onChange={(e) => {
                                    const num = Math.max(
                                      0,
                                      Math.min(100, Number(e.target.value) || 0),
                                    );
                                    onUpsertBinding(target.id, {maxValue: num});
                                  }}
                                  className="font-mono-tabular min-h-[32px] w-16 rounded border border-white/15 bg-[#0B101B] px-2 text-xs text-white"
                                />
                              </div>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => setEditingTargetId(null)}
                            className="flex min-h-[32px] items-center gap-1 rounded border border-sky-500/40 bg-sky-500/15 px-2.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/25"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>{t.midiDoneBtn}</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Live State */}
                    <td className="px-3 py-2.5 align-top">
                      <span
                        className={`font-mono-tabular inline-block min-w-[64px] rounded border px-2 py-1 text-center text-[11px] font-semibold ${
                          live.active
                            ? 'border-sky-500/35 bg-sky-500/10 text-sky-200'
                            : 'border-white/10 bg-[#151D2E] text-slate-400'
                        }`}
                      >
                        {live.text}
                      </span>
                    </td>

                    {/* MIDI Assignment */}
                    <td className="px-3 py-2.5 align-top">
                      {binding ? (
                        <div>
                          <div className="font-mono-tabular font-semibold text-white">
                            {formatMidiBindingLabel(binding)}
                          </div>
                          {binding.deviceName && (
                            <div className="mt-0.5 text-[11px] text-slate-400">
                              {binding.deviceName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">{t.midiUnassigned}</span>
                      )}
                    </td>

                    {/* Behavior */}
                    <td className="px-3 py-2.5 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        {target.allowedModes.length > 1 ? (
                          <select
                            aria-label={targetLabel}
                            disabled={!binding}
                            value={binding?.mode ?? target.defaultMode}
                            onChange={(e) =>
                              onUpsertBinding(target.id, {
                                mode: e.target.value as MidiTriggerMode,
                              })
                            }
                            className="min-h-[34px] rounded-md border border-white/10 bg-[#151D2E] px-2 text-xs text-slate-200 disabled:opacity-45"
                          >
                            {target.allowedModes.map((m) => (
                              <option key={m} value={m}>
                                {t.midiModeLabels[m]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-300">
                            {t.midiModeLabels[target.defaultMode]}
                          </span>
                        )}

                        {binding && binding.mode === 'fader' && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpsertBinding(target.id, {invert: !binding.invert})
                            }
                            className={`min-h-[30px] rounded border px-2 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 ${
                              binding.invert
                                ? 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                                : 'border-white/10 bg-[#151D2E] text-slate-400 hover:text-white'
                            }`}
                          >
                            {binding.invert ? t.midiInverted : t.midiNormal}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3.5 py-2.5 text-right align-top">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            isLearning ? onCancelLearn() : onStartLearn(target.id)
                          }
                          className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            isLearning
                              ? 'border-amber-400 bg-amber-500 text-slate-950'
                              : 'border-sky-500/40 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25'
                          }`}
                        >
                          {isLearning ? t.midiListening : t.midiLearnBtn}
                        </button>

                        <button
                          type="button"
                          title={t.midiEditTitle}
                          onClick={() =>
                            setEditingTargetId(isEditing ? null : target.id)
                          }
                          className={`flex min-h-[36px] items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                            isEditing
                              ? 'border-sky-500 bg-sky-500/20 text-white'
                              : 'border-white/10 bg-[#151D2E] text-slate-300 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          <SlidersHorizontal className="h-3.5 w-3.5" />
                          <span>{t.midiEditBtn}</span>
                        </button>

                        {binding && (
                          <button
                            type="button"
                            aria-label={`${t.midiClearAll}: ${targetLabel}`}
                            onClick={() => onRemoveBinding(target.id)}
                            className="flex min-h-[36px] items-center justify-center rounded-lg border border-white/10 bg-[#151D2E] px-2.5 py-1.5 text-slate-400 hover:border-rose-500/40 hover:text-rose-300 whitespace-nowrap shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
