import {useRef, useState} from 'react';
import {Download, Mic, Radio, Upload, Usb, Volume2} from 'lucide-react';
import {MidiAccessStatus} from '../hooks/useMidiMapping';
import {
  AudioSourceMode,
  BeamFxState,
  ColorFxState,
  Fixture,
  FlashFxState,
  GroupDimmerState,
  MidiBinding,
  MidiDeviceInfo,
  MidiLastMessage,
  MidiTargetId,
  MoveFxState,
  ShowPreset,
} from '../types/dmx';
import {MidiMappingPanel} from './MidiMappingPanel';
import {useLanguage} from '../i18n/LanguageContext';

interface AudioSyncViewProps {
  audioMode: AudioSourceMode;
  onChangeAudioMode: (mode: AudioSourceMode) => void;
  audioError: string | null;
  sensitivity: number;
  onChangeSensitivity: (val: number) => void;
  spectrumRef: React.MutableRefObject<number[]>;
  bpm: number;
  onTapBpm: () => void;
  fixtures: Fixture[];
  presets: ShowPreset[];
  onImportShow: (data: {
    fixtures?: Fixture[];
    presets?: ShowPreset[];
    midiBindings?: MidiBinding[];
  }) => void;
  // Global MIDI mapping props
  midiBindings: MidiBinding[];
  midiDevices: MidiDeviceInfo[];
  selectedMidiDeviceId: string;
  onSelectMidiDeviceId: (id: string) => void;
  midiAccessStatus: MidiAccessStatus;
  learningTargetId: MidiTargetId | null;
  lastMidiMessage: MidiLastMessage | null;
  recentTargetHit: {targetId: MidiTargetId; timestamp: number} | null;
  onScanMidiDevices: () => void;
  onStartMidiLearn: (targetId: MidiTargetId) => void;
  onCancelMidiLearn: () => void;
  onUpsertMidiBinding: (
    targetId: MidiTargetId,
    partial: Partial<Omit<MidiBinding, 'id' | 'targetId'>>,
  ) => void;
  onRemoveMidiBinding: (targetId: MidiTargetId) => void;
  onClearAllMidiBindings: () => void;
  onLoadStandardMidiTemplate: () => void;
  // Live console state for mapping table readouts
  masterDimmer: number;
  groupDimmers: GroupDimmerState;
  flashFx: FlashFxState;
  moveFx: MoveFxState;
  colorFx: ColorFxState;
  beamFx: BeamFxState;
}

export function AudioSyncView({
  audioMode,
  onChangeAudioMode,
  audioError,
  sensitivity,
  onChangeSensitivity,
  spectrumRef,
  bpm,
  onTapBpm,
  fixtures,
  presets,
  onImportShow,
  midiBindings,
  midiDevices,
  selectedMidiDeviceId,
  onSelectMidiDeviceId,
  midiAccessStatus,
  learningTargetId,
  lastMidiMessage,
  recentTargetHit,
  onScanMidiDevices,
  onStartMidiLearn,
  onCancelMidiLearn,
  onUpsertMidiBinding,
  onRemoveMidiBinding,
  onClearAllMidiBindings,
  onLoadStandardMidiTemplate,
  masterDimmer,
  groupDimmers,
  flashFx,
  moveFx,
  colorFx,
  beamFx,
}: AudioSyncViewProps) {
  const {t} = useLanguage();
  const [dmxPortState, setDmxPortState] = useState<
    'disconnected' | 'unsupported' | 'connected' | 'cancelled'
  >('disconnected');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const dmxPortStatus =
    dmxPortState === 'unsupported'
      ? t.dmxUnsupported
      : dmxPortState === 'connected'
        ? t.dmxConnected
        : dmxPortState === 'cancelled'
          ? t.dmxCancelled
          : t.dmxDisconnected;

  const connectedMidiDevices = midiDevices.filter((d) => d.state === 'connected');
  const midiSummaryStatus =
    midiAccessStatus === 'unsupported'
      ? t.midiUnsupported
      : midiAccessStatus === 'denied'
        ? t.midiDenied
        : connectedMidiDevices.length > 0
          ? t.midiReadySummary(connectedMidiDevices.length, midiBindings.length)
          : midiAccessStatus === 'ready'
            ? t.midiNoHwSummary(midiBindings.length)
            : t.midiNotScanned;

  const handleConnectSerialDmx = async () => {
    const nav = navigator as unknown as {
      serial?: {requestPort: () => Promise<{open: (opts: {baudRate: number}) => Promise<void>}>};
    };
    if (!nav.serial) {
      setDmxPortState('unsupported');
      return;
    }
    try {
      const port = await nav.serial.requestPort();
      await port.open({baudRate: 250000});
      setDmxPortState('connected');
    } catch {
      setDmxPortState('cancelled');
    }
  };

  const handleExportShow = () => {
    const payload = JSON.stringify(
      {version: 2, fixtures, presets, midiBindings},
      null,
      2,
    );
    const blob = new Blob([payload], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lightviana-show-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        fixtures?: Fixture[];
        presets?: ShowPreset[];
        midiBindings?: MidiBinding[];
      };
      onImportShow(parsed);
    } catch {
      // Ignore malformed JSON gracefully
    }
    e.target.value = '';
  };

  const bars = spectrumRef.current;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Audio Pulse & Spectrum Analyzer */}
      <section className="rounded-xl border border-white/10 bg-[#101624] p-4 lg:col-span-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              {t.audioEngineTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.audioEngineSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tabular text-sm font-semibold text-white">
              {bpm.toFixed(0)} BPM
            </span>
            <button
              type="button"
              onClick={onTapBpm}
              className="rounded-lg border border-sky-500/40 bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25"
            >
              TAP
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => onChangeAudioMode('off')}
            className={`flex min-h-[56px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              audioMode === 'off'
                ? 'border-slate-500 bg-slate-800 text-white'
                : 'border-white/8 bg-[#151D2E] text-slate-400 hover:text-white'
            }`}
          >
            <span>{t.clockOnly}</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeAudioMode('synth')}
            className={`flex min-h-[56px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              audioMode === 'synth'
                ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                : 'border-white/8 bg-[#151D2E] text-slate-300 hover:text-white'
            }`}
          >
            <Volume2 className="h-4 w-4" />
            <span>{t.testBeatSynth}</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeAudioMode('mic')}
            className={`flex min-h-[56px] items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
              audioMode === 'mic'
                ? 'border-sky-500 bg-sky-500/20 text-sky-200'
                : 'border-white/8 bg-[#151D2E] text-slate-300 hover:text-white'
            }`}
          >
            <Mic className="h-4 w-4" />
            <span>{t.liveMic}</span>
          </button>
        </div>

        {audioError && (
          <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {audioError}
          </p>
        )}

        {/* Spectrum Visualizer */}
        <div className="mt-4 flex h-36 items-end gap-1.5 rounded-lg border border-white/8 bg-[#080B12] p-3">
          {bars.map((val, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-t-sm transition-all duration-75"
              style={{
                height: `${Math.max(4, Math.round(val * 100))}%`,
                backgroundColor: idx < 6 ? '#F59E0B' : '#0EA5E9',
                opacity: 0.4 + val * 0.6,
              }}
            />
          ))}
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <label htmlFor="mic-sensitivity" className="font-medium text-slate-300">
              {t.beatSensitivity}
            </label>
            <span className="font-mono-tabular text-amber-300">
              {Math.round(sensitivity * 100)}%
            </span>
          </div>
          <input
            id="mic-sensitivity"
            type="range"
            min={20}
            max={95}
            value={Math.round(sensitivity * 100)}
            onChange={(e) => onChangeSensitivity(Number(e.target.value) / 100)}
            className="console-slider w-full"
          />
        </div>
      </section>

      {/* Hardware Bridge & Show Backup */}
      <section className="flex flex-col justify-between gap-4 rounded-xl border border-white/10 bg-[#101624] p-4 lg:col-span-5">
        <div className="space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-white">
              {t.hwBackupTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {t.hwBackupSubtitle}
            </p>
          </div>

          <div className="rounded-lg border border-white/8 bg-[#151D2E] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white">{t.usbDmxOutput}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{dmxPortStatus}</div>
              </div>
              <button
                type="button"
                onClick={handleConnectSerialDmx}
                className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#0B101B] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500/50 hover:text-white whitespace-nowrap shrink-0"
              >
                <Usb className="h-3.5 w-3.5 text-sky-400" />
                <span>{t.connectDmxBtn}</span>
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-white/8 bg-[#151D2E] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-white">{t.midiInputTitle}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">{midiSummaryStatus}</div>
              </div>
              <button
                type="button"
                onClick={onScanMidiDevices}
                className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#0B101B] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-sky-500/50 hover:text-white whitespace-nowrap shrink-0"
              >
                <Radio className="h-3.5 w-3.5 text-amber-400" />
                <span>{t.scanMidiBtn}</span>
              </button>
            </div>
            {connectedMidiDevices.length > 0 && (
              <ul className="mt-2.5 space-y-1 border-t border-white/8 pt-2 text-xs text-slate-300">
                {connectedMidiDevices.map((d) => (
                  <li key={d.id} className="font-mono-tabular flex items-center justify-between">
                    <span>{d.name}</span>
                    <span className="text-[11px] text-slate-500">{d.manufacturer}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 border-t border-white/8 pt-4">
          <button
            type="button"
            onClick={handleExportShow}
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#151D2E] px-3 py-2 text-xs font-semibold text-white hover:border-white/25"
          >
            <Download className="h-4 w-4 text-sky-400" />
            <span>{t.exportShowBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-white/10 bg-[#151D2E] px-3 py-2 text-xs font-semibold text-white hover:border-white/25"
          >
            <Upload className="h-4 w-4 text-amber-400" />
            <span>{t.importShowBtn}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </section>

      {/* Full MIDI Mapping & Learn Console */}
      <MidiMappingPanel
        bindings={midiBindings}
        devices={midiDevices}
        selectedDeviceId={selectedMidiDeviceId}
        onSelectDeviceId={onSelectMidiDeviceId}
        accessStatus={midiAccessStatus}
        learningTargetId={learningTargetId}
        lastMessage={lastMidiMessage}
        recentTargetHit={recentTargetHit}
        onScanDevices={onScanMidiDevices}
        onStartLearn={onStartMidiLearn}
        onCancelLearn={onCancelMidiLearn}
        onUpsertBinding={onUpsertMidiBinding}
        onRemoveBinding={onRemoveMidiBinding}
        onClearAllBindings={onClearAllMidiBindings}
        onLoadStandardTemplate={onLoadStandardMidiTemplate}
        masterDimmer={masterDimmer}
        groupDimmers={groupDimmers}
        flashFx={flashFx}
        moveFx={moveFx}
        colorFx={colorFx}
        beamFx={beamFx}
        bpm={bpm}
      />
    </div>
  );
}
