import {useCallback, useEffect, useRef, useState} from 'react';
import {AudioSyncView} from './components/AudioSyncView';
import {BankView} from './components/BankView';
import {ColorFxPanel} from './components/ColorFxPanel';
import {FaderWingPanel} from './components/FaderWingPanel';
import {FixturesDmxView} from './components/FixturesDmxView';
import {FlashFxCenter} from './components/FlashFxCenter';
import {LiveEditView} from './components/LiveEditView';
import {MoveFxPanel} from './components/MoveFxPanel';
import {NetworkRemoteView} from './components/NetworkRemoteView';
import {OfflineIndicator} from './components/PWAInstallButton';
import {PresetsDock} from './components/PresetsDock';
import {SavePresetModal} from './components/SavePresetModal';
import {SettingsModal} from './components/SettingsModal';
import {StageVisualizer} from './components/StageVisualizer';
import {TopBar} from './components/TopBar';
import {useLanguage} from './i18n/LanguageContext';
import {AudioBeatEngine} from './engine/audioBeatEngine';
import {
  computeDmxFrame,
  DEFAULT_BANKS,
  DEFAULT_FIXTURES,
  DEFAULT_GROUP_DIMMERS,
  DEFAULT_PRESETS,
} from './engine/dmxEngine';
import {
  BankConsoleSnapshot,
  useBankUndoRedo,
} from './hooks/useBankUndoRedo';
import {useMidiMapping} from './hooks/useMidiMapping';
import {
  detectDeviceRole,
  SyncedShowState,
  useRealtimeSync,
} from './hooks/useRealtimeSync';
import {
  AudioSourceMode,
  BankScene,
  BeamFxState,
  ColorFxState,
  ConsoleTab,
  FaderWingTab,
  Fixture,
  FixtureComputedOutput,
  FlashFxState,
  GroupDimmerState,
  LiveLayoutMode,
  MidiBinding,
  MoveFxState,
  SceneBank,
  ShowPreset,
} from './types/dmx';

const STORAGE_PRESETS_KEY = 'lightrider_presets_v1';
const STORAGE_FIXTURES_KEY = 'lightrider_fixtures_v1';
const STORAGE_BANKS_KEY = 'lightrider_banks_v1';
const STORAGE_CONSOLE_STATE_KEY = 'lightrider_console_state_v1';

interface PersistedConsoleState {
  activePresetId?: string | null;
  activeBankId?: string | null;
  activeSceneId?: string | null;
  autoCycleBeats?: number;
  moveFx?: MoveFxState;
  colorFx?: ColorFxState;
  beamFx?: BeamFxState;
  flashFx?: FlashFxState;
  bpm?: number;
  masterDimmer?: number;
  liveLayoutMode?: LiveLayoutMode;
  faderWingTab?: FaderWingTab;
  groupDimmers?: GroupDimmerState;
  fixtureDimmers?: Record<string, number>;
  fixtureMutes?: Record<string, boolean>;
  fixtureColors?: Record<string, string>;
  rawDmxOverrides?: Record<number, number>;
  tabletMode?: boolean;
}

function loadStoredConsoleState(): PersistedConsoleState {
  try {
    const raw = localStorage.getItem(STORAGE_CONSOLE_STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as PersistedConsoleState;
      }
    }
  } catch {
    // Fallback to initial preset defaults
  }
  return {};
}

function loadStoredFixtures(): Fixture[] {
  try {
    const raw = localStorage.getItem(STORAGE_FIXTURES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Fixture[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback to default rig
  }
  return DEFAULT_FIXTURES;
}

function loadStoredPresets(): ShowPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ShowPreset[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback to factory presets
  }
  return DEFAULT_PRESETS;
}

function loadStoredBanks(): SceneBank[] {
  try {
    const raw = localStorage.getItem(STORAGE_BANKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SceneBank[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback to default banks
  }
  return DEFAULT_BANKS;
}

function getInitialNetworkSettings() {
  const params = new URLSearchParams(window.location.search);
  const detected = detectDeviceRole();
  const room = (params.get('room') || 'MAIN-SHOW').toUpperCase();
  const tabletMode = params.get('mode') === 'tablet' || detected.role === 'android';
  return {
    room,
    role: detected.role,
    name: detected.defaultName,
    tabletMode,
  };
}

export default function App() {
  const {t, language, setLanguage} = useLanguage();
  const initialPreset = DEFAULT_PRESETS[0];
  const initialNet = getInitialNetworkSettings();
  const [savedConsole] = useState<PersistedConsoleState>(loadStoredConsoleState);

  const [activeTab, setActiveTab] = useState<ConsoleTab>('live');
  const [fixtures, setFixtures] = useState<Fixture[]>(loadStoredFixtures);
  const [presets, setPresets] = useState<ShowPreset[]>(loadStoredPresets);
  const [activePresetId, setActivePresetId] = useState<string | null>(() =>
    savedConsole.activePresetId !== undefined
      ? savedConsole.activePresetId
      : initialPreset.id,
  );
  const [banks, setBanks] = useState<SceneBank[]>(loadStoredBanks);
  const [activeBankId, setActiveBankId] = useState<string | null>(() =>
    savedConsole.activeBankId !== undefined
      ? savedConsole.activeBankId
      : loadStoredBanks()[0]?.id ?? null,
  );
  const [activeSceneId, setActiveSceneId] = useState<string | null>(
    () => savedConsole.activeSceneId ?? null,
  );
  const [autoCycleBeats, setAutoCycleBeats] = useState<number>(() =>
    typeof savedConsole.autoCycleBeats === 'number' ? savedConsole.autoCycleBeats : 0,
  );

  const [moveFx, setMoveFx] = useState<MoveFxState>(
    () => savedConsole.moveFx ?? initialPreset.moveFx,
  );
  const [colorFx, setColorFx] = useState<ColorFxState>(
    () => savedConsole.colorFx ?? initialPreset.colorFx,
  );
  const [beamFx, setBeamFx] = useState<BeamFxState>(
    () => savedConsole.beamFx ?? initialPreset.beamFx,
  );
  const [flashFx, setFlashFx] = useState<FlashFxState>(() => ({
    blinder: false,
    strobe: false,
    strobeRate: savedConsole.flashFx?.strobeRate ?? 14,
    smoke: false,
    freeze: Boolean(savedConsole.flashFx?.freeze),
    blackout: Boolean(savedConsole.flashFx?.blackout),
  }));

  const [bpm, setBpm] = useState<number>(() =>
    typeof savedConsole.bpm === 'number' ? savedConsole.bpm : initialPreset.bpm,
  );
  const [masterDimmer, setMasterDimmer] = useState<number>(() =>
    typeof savedConsole.masterDimmer === 'number'
      ? savedConsole.masterDimmer
      : initialPreset.masterDimmer,
  );
  const [liveLayoutMode, setLiveLayoutMode] = useState<LiveLayoutMode>(() =>
    savedConsole.liveLayoutMode === 'fx' ||
    savedConsole.liveLayoutMode === 'split' ||
    savedConsole.liveLayoutMode === 'faders'
      ? savedConsole.liveLayoutMode
      : 'split',
  );
  const [faderWingTab, setFaderWingTab] = useState<FaderWingTab>(() =>
    savedConsole.faderWingTab === 'groups' ||
    savedConsole.faderWingTab === 'fixtures' ||
    savedConsole.faderWingTab === 'channels' ||
    savedConsole.faderWingTab === 'dmx512' ||
    savedConsole.faderWingTab === 'universe'
      ? savedConsole.faderWingTab
      : 'groups',
  );
  const [groupDimmers, setGroupDimmers] = useState<GroupDimmerState>(() => ({
    ...DEFAULT_GROUP_DIMMERS,
    ...(savedConsole.groupDimmers ?? {}),
  }));
  const [fixtureDimmers, setFixtureDimmers] = useState<Record<string, number>>(
    () => savedConsole.fixtureDimmers ?? {},
  );
  const [fixtureMutes, setFixtureMutes] = useState<Record<string, boolean>>(
    () => savedConsole.fixtureMutes ?? {},
  );
  const [fixtureFlashes, setFixtureFlashes] = useState<Record<string, boolean>>({});
  const [fixtureColors, setFixtureColors] = useState<Record<string, string>>(
    () => savedConsole.fixtureColors ?? {},
  );
  const [rawDmxOverrides, setRawDmxOverrides] = useState<Record<number, number>>(
    () => savedConsole.rawDmxOverrides ?? {},
  );
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [audioMode, setAudioMode] = useState<AudioSourceMode>('off');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(0.65);
  const [, setAudioUiTick] = useState(0);

  // Multi-device Wi-Fi Sync State
  const [roomId, setRoomId] = useState<string>(initialNet.room);
  const [deviceRole, setDeviceRole] = useState<'windows' | 'android' | 'web'>(initialNet.role);
  const [deviceName, setDeviceName] = useState<string>(initialNet.name);
  const [tabletMode, setTabletMode] = useState<boolean>(() =>
    typeof savedConsole.tabletMode === 'boolean'
      ? savedConsole.tabletMode
      : initialNet.tabletMode,
  );

  // Refs for real-time 60fps DMX engine
  const universeRef = useRef<Uint8Array>(new Uint8Array(512));
  const outputsRef = useRef<FixtureComputedOutput[]>([]);
  const beatProgressRef = useRef<number>(0);
  const audioEnergyRef = useRef<number>(0);
  const spectrumRef = useRef<number[]>(Array.from({length: 24}, () => 0));
  const frozenTimeRef = useRef<number>(0);
  const tapTimesRef = useRef<number[]>([]);
  const audioEngineRef = useRef<AudioBeatEngine | null>(null);

  const smoothedRgbRef = useRef<Record<string, {r: number; g: number; b: number}>>({});

  const handleRemoteInit = useCallback((remote: SyncedShowState) => {
    setMoveFx(remote.moveFx);
    setColorFx(remote.colorFx);
    setFlashFx(remote.flashFx);
    setBeamFx(remote.beamFx);
    setBpm(remote.bpm);
    setMasterDimmer(remote.masterDimmer);
    if (remote.groupDimmers) setGroupDimmers(remote.groupDimmers);
    if (remote.fixtureDimmers) setFixtureDimmers(remote.fixtureDimmers);
    if (remote.fixtureMutes) setFixtureMutes(remote.fixtureMutes);
    if (remote.fixtureColors) setFixtureColors(remote.fixtureColors);
    if (remote.rawDmxOverrides) setRawDmxOverrides(remote.rawDmxOverrides);
    if (Array.isArray(remote.fixtures) && remote.fixtures.length > 0) {
      setFixtures(remote.fixtures);
    }
    if (Array.isArray(remote.presets) && remote.presets.length > 0) {
      setPresets(remote.presets);
    }
    if (Array.isArray(remote.banks) && remote.banks.length > 0) {
      setBanks(remote.banks);
    }
    if (remote.activeBankId !== undefined) setActiveBankId(remote.activeBankId);
    if (remote.activeSceneId !== undefined) setActiveSceneId(remote.activeSceneId);
    setActivePresetId(remote.activePresetId);
  }, []);

  const handleRemotePatch = useCallback((patch: Partial<SyncedShowState>) => {
    if (patch.moveFx) setMoveFx(patch.moveFx);
    if (patch.colorFx) setColorFx(patch.colorFx);
    if (patch.flashFx) setFlashFx(patch.flashFx);
    if (patch.beamFx) setBeamFx(patch.beamFx);
    if (typeof patch.bpm === 'number') setBpm(patch.bpm);
    if (typeof patch.masterDimmer === 'number') setMasterDimmer(patch.masterDimmer);
    if (patch.groupDimmers) setGroupDimmers(patch.groupDimmers);
    if (patch.fixtureDimmers) setFixtureDimmers(patch.fixtureDimmers);
    if (patch.fixtureMutes) setFixtureMutes(patch.fixtureMutes);
    if (patch.fixtureColors) setFixtureColors(patch.fixtureColors);
    if (patch.rawDmxOverrides) setRawDmxOverrides(patch.rawDmxOverrides);
    if (Array.isArray(patch.fixtures)) setFixtures(patch.fixtures);
    if (Array.isArray(patch.presets)) setPresets(patch.presets);
    if (Array.isArray(patch.banks)) setBanks(patch.banks);
    if (patch.activeBankId !== undefined) setActiveBankId(patch.activeBankId);
    if (patch.activeSceneId !== undefined) setActiveSceneId(patch.activeSceneId);
    if (patch.activePresetId !== undefined) setActivePresetId(patch.activePresetId);
  }, []);

  const {status: syncStatus, devices, selfId, sendPatch} = useRealtimeSync({
    roomId,
    deviceName,
    deviceRole,
    onRemoteInit: handleRemoteInit,
    onRemotePatch: handleRemotePatch,
  });

  const stateRef = useRef({
    fixtures,
    moveFx,
    colorFx,
    flashFx,
    beamFx,
    bpm,
    masterDimmer,
    groupDimmers,
    fixtureDimmers,
    fixtureMutes,
    fixtureFlashes,
    fixtureColors,
    rawDmxOverrides,
    audioMode,
    sensitivity,
  });

  stateRef.current = {
    fixtures,
    moveFx,
    colorFx,
    flashFx,
    beamFx,
    bpm,
    masterDimmer,
    groupDimmers,
    fixtureDimmers,
    fixtureMutes,
    fixtureFlashes,
    fixtureColors,
    rawDmxOverrides,
    audioMode,
    sensitivity,
  };

  // Persist fixtures & presets cleanly
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FIXTURES_KEY, JSON.stringify(fixtures));
    } catch {
      // Ignore storage quota errors
    }
  }, [fixtures]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRESETS_KEY, JSON.stringify(presets));
    } catch {
      // Ignore storage quota errors
    }
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BANKS_KEY, JSON.stringify(banks));
    } catch {
      // Ignore storage quota errors
    }
  }, [banks]);

  // Persist active console parameters locally so offline reloads keep exact faders, FX, and overrides
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const snapshot: PersistedConsoleState = {
          activePresetId,
          activeBankId,
          activeSceneId,
          autoCycleBeats,
          moveFx,
          colorFx,
          beamFx,
          flashFx: {
            ...flashFx,
            blinder: false,
            strobe: false,
            smoke: false,
          },
          bpm,
          masterDimmer,
          liveLayoutMode,
          faderWingTab,
          groupDimmers,
          fixtureDimmers,
          fixtureMutes,
          fixtureColors,
          rawDmxOverrides,
          tabletMode,
        };
        localStorage.setItem(STORAGE_CONSOLE_STATE_KEY, JSON.stringify(snapshot));
      } catch {
        // Ignore storage quota errors
      }
    }, 220);
    return () => window.clearTimeout(timer);
  }, [
    activePresetId,
    activeBankId,
    activeSceneId,
    autoCycleBeats,
    moveFx,
    colorFx,
    beamFx,
    flashFx,
    bpm,
    masterDimmer,
    liveLayoutMode,
    faderWingTab,
    groupDimmers,
    fixtureDimmers,
    fixtureMutes,
    fixtureColors,
    rawDmxOverrides,
    tabletMode,
  ]);

  // Audio Beat Engine lifecycle
  const handleChangeAudioMode = useCallback(async (nextMode: AudioSourceMode) => {
    setAudioError(null);
    if (!audioEngineRef.current) {
      audioEngineRef.current = new AudioBeatEngine();
    }
    const engine = audioEngineRef.current;

    if (nextMode === 'off') {
      engine.stop();
      setAudioMode('off');
      return;
    }

    if (nextMode === 'synth') {
      engine.startSynth(() => stateRef.current.bpm);
      setAudioMode('synth');
      return;
    }

    if (nextMode === 'mic') {
      try {
        await engine.startMic();
        setAudioMode('mic');
      } catch {
        engine.stop();
        setAudioMode('off');
        setAudioError(t.audioMicError);
      }
    }
  }, [t.audioMicError]);

  useEffect(() => {
    return () => {
      audioEngineRef.current?.stop();
    };
  }, []);

  // Main 60fps DMX Engine loop
  useEffect(() => {
    let rafId = 0;
    const startMs = performance.now();

    const tick = (nowMs: number) => {
      const s = stateRef.current;
      const elapsedSec = (nowMs - startMs) / 1000;

      // Sample audio beat engine
      const audioFrame = audioEngineRef.current
        ? audioEngineRef.current.sample(s.audioMode, s.sensitivity)
        : {energy: 0, isBeat: false, spectrum: spectrumRef.current};

      audioEnergyRef.current = audioFrame.energy;
      spectrumRef.current = audioFrame.spectrum;

      // Beat progress bar (0..1)
      const beatsPerSec = s.bpm / 60;
      beatProgressRef.current = (elapsedSec * beatsPerSec) % 1;

      if (!s.flashFx.freeze) {
        frozenTimeRef.current = elapsedSec;
        const result = computeDmxFrame({
          fixtures: s.fixtures,
          moveFx: s.moveFx,
          colorFx: s.colorFx,
          flashFx: s.flashFx,
          beamFx: s.beamFx,
          bpm: s.bpm,
          masterDimmer: s.masterDimmer,
          groupDimmers: s.groupDimmers,
          fixtureDimmers: s.fixtureDimmers,
          fixtureMutes: s.fixtureMutes,
          fixtureFlashes: s.fixtureFlashes,
          fixtureColors: s.fixtureColors,
          rawDmxOverrides: s.rawDmxOverrides,
          timeSec: elapsedSec,
          audioEnergy: audioFrame.energy,
          audioPulseActive: s.audioMode !== 'off',
        });

        // Smooth RGB transitions according to the Color Fade fader (0 = instant, 100 = slow glide)
        const fadeFactor =
          s.flashFx.blinder || s.flashFx.strobe || s.flashFx.blackout || s.colorFx.fade <= 2
            ? 1
            : Math.max(0.035, 1 - (s.colorFx.fade / 100) * 0.94);

        for (let i = 0; i < result.outputs.length; i += 1) {
          const out = result.outputs[i];
          const prev = smoothedRgbRef.current[out.fixtureId];
          if (!prev || fadeFactor >= 1) {
            smoothedRgbRef.current[out.fixtureId] = {r: out.r, g: out.g, b: out.b};
          } else {
            const nr = prev.r + (out.r - prev.r) * fadeFactor;
            const ng = prev.g + (out.g - prev.g) * fadeFactor;
            const nb = prev.b + (out.b - prev.b) * fadeFactor;
            prev.r = nr;
            prev.g = ng;
            prev.b = nb;
            out.r = Math.round(nr);
            out.g = Math.round(ng);
            out.b = Math.round(nb);

            const fx = s.fixtures[i];
            if (fx) {
              const ch = fx.dmxStart - 1;
              if (fx.type === 'moving_head' && ch + 8 < 512) {
                if (typeof s.rawDmxOverrides[fx.dmxStart + 6] !== 'number') {
                  result.universe[ch + 6] = Math.round(out.r * out.dimmer);
                }
                if (typeof s.rawDmxOverrides[fx.dmxStart + 7] !== 'number') {
                  result.universe[ch + 7] = Math.round(out.g * out.dimmer);
                }
                if (typeof s.rawDmxOverrides[fx.dmxStart + 8] !== 'number') {
                  result.universe[ch + 8] = Math.round(out.b * out.dimmer);
                }
              } else if (
                (fx.type === 'led_par' || fx.type === 'pixel_bar') &&
                ch + 3 < 512
              ) {
                if (typeof s.rawDmxOverrides[fx.dmxStart + 1] !== 'number') {
                  result.universe[ch + 1] = out.r;
                }
                if (typeof s.rawDmxOverrides[fx.dmxStart + 2] !== 'number') {
                  result.universe[ch + 2] = out.g;
                }
                if (typeof s.rawDmxOverrides[fx.dmxStart + 3] !== 'number') {
                  result.universe[ch + 3] = out.b;
                }
              }
            }
          }
        }

        universeRef.current = result.universe;
        outputsRef.current = result.outputs;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Periodic UI refresh for Audio Spectrum view when active
  useEffect(() => {
    if (activeTab !== 'audio') return;
    const id = window.setInterval(() => {
      setAudioUiTick((t) => t + 1);
    }, 55);
    return () => window.clearInterval(id);
  }, [activeTab]);

  // Tap Tempo calculator
  const handleTapBpm = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    if (taps.length > 0 && now - taps[taps.length - 1] > 2000) {
      tapTimesRef.current = [now];
      return;
    }
    const nextTaps = [...taps, now].slice(-5);
    tapTimesRef.current = nextTaps;
    if (nextTaps.length >= 2) {
      let sum = 0;
      for (let i = 1; i < nextTaps.length; i += 1) {
        sum += nextTaps[i] - nextTaps[i - 1];
      }
      const avgMs = sum / (nextTaps.length - 1);
      const calcBpm = Math.round(Math.max(60, Math.min(200, 60000 / avgMs)));
      setBpm(calcBpm);
      sendPatch({bpm: calcBpm});
    }
  }, [sendPatch]);

  // Global External MIDI Controller Engine (runs across all console tabs)
  const pendingMidiPatchRef = useRef<Partial<SyncedShowState>>({});

  const midi = useMidiMapping({
    onSetMasterDimmer: (val, syncPatch) => {
      setMasterDimmer(val);
      if (syncPatch) {
        sendPatch({masterDimmer: val});
      } else {
        pendingMidiPatchRef.current.masterDimmer = val;
      }
    },
    onSetGroupDimmer: (group, val, syncPatch) => {
      setGroupDimmers((prev) => {
        const next = {...prev, [group]: val};
        if (syncPatch) {
          sendPatch({groupDimmers: next});
        } else {
          pendingMidiPatchRef.current.groupDimmers = next;
        }
        return next;
      });
    },
    onUpdateFlashFx: (updater, syncPatch) => {
      setFlashFx((prev) => {
        const next = updater(prev);
        if (syncPatch) {
          sendPatch({flashFx: next});
        } else {
          pendingMidiPatchRef.current.flashFx = next;
        }
        return next;
      });
    },
    onUpdateMoveFx: (updater, syncPatch) => {
      setActivePresetId(null);
      setMoveFx((prev) => {
        const next = updater(prev);
        if (syncPatch) {
          sendPatch({moveFx: next, activePresetId: null});
        } else {
          pendingMidiPatchRef.current.moveFx = next;
          pendingMidiPatchRef.current.activePresetId = null;
        }
        return next;
      });
    },
    onUpdateColorFx: (updater, syncPatch) => {
      setActivePresetId(null);
      setColorFx((prev) => {
        const next = updater(prev);
        if (syncPatch) {
          sendPatch({colorFx: next, activePresetId: null});
        } else {
          pendingMidiPatchRef.current.colorFx = next;
          pendingMidiPatchRef.current.activePresetId = null;
        }
        return next;
      });
    },
    onUpdateBeamFx: (updater, syncPatch) => {
      setActivePresetId(null);
      setBeamFx((prev) => {
        const next = updater(prev);
        if (syncPatch) {
          sendPatch({beamFx: next, activePresetId: null});
        } else {
          pendingMidiPatchRef.current.beamFx = next;
          pendingMidiPatchRef.current.activePresetId = null;
        }
        return next;
      });
    },
    onTapBpm: handleTapBpm,
    onFlushContinuousSync: () => {
      const patch = pendingMidiPatchRef.current;
      if (Object.keys(patch).length > 0) {
        pendingMidiPatchRef.current = {};
        sendPatch(patch);
      }
    },
  });

  // Undo/Redo engine for Bank & Scene creation/editing + console state recovery
  const bankSnapshotRef = useRef<BankConsoleSnapshot>({
    banks,
    activeBankId,
    activeSceneId,
    moveFx,
    colorFx,
    beamFx,
    flashFx,
    bpm,
    masterDimmer,
    groupDimmers,
    fixtureDimmers,
    fixtureMutes,
    fixtureColors,
    rawDmxOverrides,
  });

  bankSnapshotRef.current = {
    banks,
    activeBankId,
    activeSceneId,
    moveFx,
    colorFx,
    beamFx,
    flashFx,
    bpm,
    masterDimmer,
    groupDimmers,
    fixtureDimmers,
    fixtureMutes,
    fixtureColors,
    rawDmxOverrides,
  };

  const bankUndo = useBankUndoRedo({
    getCurrentSnapshot: () => bankSnapshotRef.current,
    applySnapshot: (snap) => {
      bankSnapshotRef.current = snap;
      setBanks(snap.banks);
      setActiveBankId(snap.activeBankId);
      setActiveSceneId(snap.activeSceneId);
      setActivePresetId(null);
      setMoveFx(snap.moveFx);
      setColorFx(snap.colorFx);
      setBeamFx(snap.beamFx);
      setFlashFx(snap.flashFx);
      setBpm(snap.bpm);
      setMasterDimmer(snap.masterDimmer);
      setGroupDimmers(snap.groupDimmers);
      setFixtureDimmers(snap.fixtureDimmers);
      setFixtureMutes(snap.fixtureMutes);
      setFixtureColors(snap.fixtureColors);
      setRawDmxOverrides(snap.rawDmxOverrides);

      sendPatch({
        banks: snap.banks,
        activeBankId: snap.activeBankId,
        activeSceneId: snap.activeSceneId,
        activePresetId: null,
        moveFx: snap.moveFx,
        colorFx: snap.colorFx,
        beamFx: snap.beamFx,
        flashFx: snap.flashFx,
        bpm: snap.bpm,
        masterDimmer: snap.masterDimmer,
        groupDimmers: snap.groupDimmers,
        fixtureDimmers: snap.fixtureDimmers,
        fixtureMutes: snap.fixtureMutes,
        fixtureColors: snap.fixtureColors,
        rawDmxOverrides: snap.rawDmxOverrides,
      });
    },
  });

  // Keyboard performance & Bank Undo/Redo shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA')
      ) {
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (mod && activeTab === 'bank') {
        const lower = e.key.toLowerCase();
        if (lower === 'z' && !e.shiftKey) {
          e.preventDefault();
          bankUndo.undo();
          return;
        }
        if (lower === 'y' || (lower === 'z' && e.shiftKey)) {
          e.preventDefault();
          bankUndo.redo();
          return;
        }
      }
      if (mod || e.altKey) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setFlashFx((prev) => {
          const next = {...prev, blackout: !prev.blackout};
          sendPatch({flashFx: next});
          return next;
        });
      } else if (e.key === 'f' || e.key === 'F') {
        setFlashFx((prev) => {
          const next = {...prev, freeze: !prev.freeze};
          sendPatch({flashFx: next});
          return next;
        });
      } else if (e.key === 't' || e.key === 'T') {
        handleTapBpm();
      } else if ((e.key === 's' || e.key === 'S') && !e.repeat) {
        setFlashFx((prev) => {
          const next = {...prev, strobe: true};
          sendPatch({flashFx: next});
          return next;
        });
      } else if ((e.key === 'b' || e.key === 'B') && !e.repeat) {
        setFlashFx((prev) => {
          const next = {...prev, blinder: true};
          sendPatch({flashFx: next});
          return next;
        });
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === 'S') {
        setFlashFx((prev) => {
          const next = {...prev, strobe: false};
          sendPatch({flashFx: next});
          return next;
        });
      } else if (e.key === 'b' || e.key === 'B') {
        setFlashFx((prev) => {
          const next = {...prev, blinder: false};
          sendPatch({flashFx: next});
          return next;
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeTab, bankUndo, handleTapBpm, sendPatch]);

  const handleSelectPreset = (preset: ShowPreset) => {
    const nextMove = {...preset.moveFx};
    const nextColor = {
      ...preset.colorFx,
      colors: [...preset.colorFx.colors] as [string, string, string],
    };
    const nextBeam = {...preset.beamFx};
    const nextFlash = {...flashFx, blackout: false, freeze: false};

    setActivePresetId(preset.id);
    setMoveFx(nextMove);
    setColorFx(nextColor);
    setBeamFx(nextBeam);
    setBpm(preset.bpm);
    setMasterDimmer(preset.masterDimmer);
    setFlashFx(nextFlash);

    sendPatch({
      activePresetId: preset.id,
      moveFx: nextMove,
      colorFx: nextColor,
      beamFx: nextBeam,
      bpm: preset.bpm,
      masterDimmer: preset.masterDimmer,
      flashFx: nextFlash,
    });
  };

  const handleSavePreset = (name: string) => {
    const created: ShowPreset = {
      id: `custom-${Date.now()}`,
      name,
      moveFx: {...moveFx},
      colorFx: {...colorFx, colors: [...colorFx.colors] as [string, string, string]},
      beamFx: {...beamFx},
      bpm,
      masterDimmer,
      isCustom: true,
    };
    const nextPresets = [created, ...presets];
    setPresets(nextPresets);
    setActivePresetId(created.id);
    sendPatch({presets: nextPresets, activePresetId: created.id});
  };

  const handleDeletePreset = (id: string) => {
    const nextPresets = presets.filter((p) => p.id !== id);
    const nextActive = activePresetId === id ? null : activePresetId;
    setPresets(nextPresets);
    setActivePresetId(nextActive);
    sendPatch({presets: nextPresets, activePresetId: nextActive});
  };

  // Bank & Scene Management
  const captureCurrentSceneSnapshot = (
    id: string,
    name: string,
    colorTag: string,
  ): BankScene => ({
    id,
    name,
    colorTag,
    fadePercent: colorFx.fade,
    moveFx: {...moveFx},
    colorFx: {...colorFx, colors: [...colorFx.colors] as [string, string, string]},
    beamFx: {...beamFx},
    flashFx: {...flashFx, blackout: false, freeze: false},
    bpm,
    masterDimmer,
    groupDimmers: {...groupDimmers},
    fixtureDimmers: {...fixtureDimmers},
    fixtureMutes: {...fixtureMutes},
    fixtureColors: {...fixtureColors},
    rawDmxOverrides: {...rawDmxOverrides},
  });

  const handleTriggerScene = useCallback(
    (bankId: string, scene: BankScene, recordHistory = true) => {
      if (recordHistory) {
        bankUndo.recordCheckpoint(t.chkTriggerScene(scene.name));
      }

      const nextMove = {...scene.moveFx};
      const nextColor = {
        ...scene.colorFx,
        colors: [...scene.colorFx.colors] as [string, string, string],
      };
      const nextBeam = {...scene.beamFx};
      const nextFlash = {...scene.flashFx, blackout: false, freeze: false};
      const nextGroups = {...scene.groupDimmers};
      const nextFixDim = {...(scene.fixtureDimmers || {})};
      const nextFixMute = {...(scene.fixtureMutes || {})};
      const nextFixColors = {...(scene.fixtureColors || {})};
      const nextRawDmx = {...(scene.rawDmxOverrides || {})};

      setActiveBankId(bankId);
      setActiveSceneId(scene.id);
      setActivePresetId(null);
      setMoveFx(nextMove);
      setColorFx(nextColor);
      setBeamFx(nextBeam);
      setFlashFx(nextFlash);
      setBpm(scene.bpm);
      setMasterDimmer(scene.masterDimmer);
      setGroupDimmers(nextGroups);
      setFixtureDimmers(nextFixDim);
      setFixtureMutes(nextFixMute);
      setFixtureColors(nextFixColors);
      setRawDmxOverrides(nextRawDmx);

      sendPatch({
        activeBankId: bankId,
        activeSceneId: scene.id,
        activePresetId: null,
        moveFx: nextMove,
        colorFx: nextColor,
        beamFx: nextBeam,
        flashFx: nextFlash,
        bpm: scene.bpm,
        masterDimmer: scene.masterDimmer,
        groupDimmers: nextGroups,
        fixtureDimmers: nextFixDim,
        fixtureMutes: nextFixMute,
        fixtureColors: nextFixColors,
        rawDmxOverrides: nextRawDmx,
      });
    },
    [bankUndo, sendPatch, t],
  );

  // Auto-Run Bank Scenes synced to BPM
  useEffect(() => {
    if (autoCycleBeats <= 0) return;
    const currentBank = banks.find((b) => b.id === activeBankId) || banks[0];
    if (!currentBank || currentBank.scenes.length < 2) return;

    const intervalMs = Math.max(800, (60000 / Math.max(60, bpm)) * autoCycleBeats);
    const id = window.setInterval(() => {
      const idx = currentBank.scenes.findIndex((s) => s.id === activeSceneId);
      const nextIdx = (idx + 1) % currentBank.scenes.length;
      const nextScene = currentBank.scenes[nextIdx];
      if (nextScene) {
        handleTriggerScene(currentBank.id, nextScene, false);
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [autoCycleBeats, banks, activeBankId, activeSceneId, bpm, handleTriggerScene]);

  const handleCreateBank = (name: string, color: string) => {
    bankUndo.recordCheckpoint(t.chkCreateBank(name));
    const newBank: SceneBank = {
      id: `bank-${Date.now()}`,
      name,
      color,
      scenes: [],
    };
    const nextBanks = [...banks, newBank];
    setBanks(nextBanks);
    setActiveBankId(newBank.id);
    sendPatch({banks: nextBanks, activeBankId: newBank.id});
  };

  const handleDeleteBank = (bankId: string) => {
    if (banks.length <= 1) return;
    const targetBank = banks.find((b) => b.id === bankId);
    bankUndo.recordCheckpoint(t.chkDeleteBank(targetBank?.name ?? 'Bank'));
    const nextBanks = banks.filter((b) => b.id !== bankId);
    const nextBankId = activeBankId === bankId ? nextBanks[0]?.id ?? null : activeBankId;
    setBanks(nextBanks);
    setActiveBankId(nextBankId);
    sendPatch({banks: nextBanks, activeBankId: nextBankId});
  };

  const handleCreateSceneInBank = (bankId: string, name: string, colorTag: string) => {
    bankUndo.recordCheckpoint(t.chkCreateScene(name));
    const created = captureCurrentSceneSnapshot(`sc-${Date.now()}`, name, colorTag);
    const nextBanks = banks.map((b) =>
      b.id === bankId ? {...b, scenes: [...b.scenes, created]} : b,
    );
    setBanks(nextBanks);
    setActiveBankId(bankId);
    setActiveSceneId(created.id);
    sendPatch({banks: nextBanks, activeBankId: bankId, activeSceneId: created.id});
  };

  const handleOverwriteSceneInBank = (bankId: string, sceneId: string) => {
    const bank = banks.find((b) => b.id === bankId);
    const targetScene = bank?.scenes.find((sc) => sc.id === sceneId);
    bankUndo.recordCheckpoint(t.chkSaveScene(targetScene?.name ?? 'Scene'));
    const nextBanks = banks.map((b) => {
      if (b.id !== bankId) return b;
      return {
        ...b,
        scenes: b.scenes.map((sc) =>
          sc.id === sceneId
            ? captureCurrentSceneSnapshot(sc.id, sc.name, sc.colorTag)
            : sc,
        ),
      };
    });
    setBanks(nextBanks);
    setActiveSceneId(sceneId);
    sendPatch({banks: nextBanks, activeSceneId: sceneId});
  };

  const handleUpdateSceneMetaInBank = (
    bankId: string,
    sceneId: string,
    name: string,
    colorTag: string,
  ) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const bank = banks.find((b) => b.id === bankId);
    const targetScene = bank?.scenes.find((sc) => sc.id === sceneId);
    bankUndo.recordCheckpoint(t.chkEditScene(targetScene?.name ?? cleanName));
    const nextBanks = banks.map((b) => {
      if (b.id !== bankId) return b;
      return {
        ...b,
        scenes: b.scenes.map((sc) =>
          sc.id === sceneId ? {...sc, name: cleanName, colorTag} : sc,
        ),
      };
    });
    setBanks(nextBanks);
    sendPatch({banks: nextBanks});
  };

  const handleDuplicateSceneInBank = (bankId: string, sceneId: string) => {
    const bank = banks.find((b) => b.id === bankId);
    const targetScene = bank?.scenes.find((sc) => sc.id === sceneId);
    bankUndo.recordCheckpoint(t.chkDuplicateScene(targetScene?.name ?? 'Scene'));
    const nextBanks = banks.map((b) => {
      if (b.id !== bankId) return b;
      const orig = b.scenes.find((sc) => sc.id === sceneId);
      if (!orig) return b;
      const copy: BankScene = {
        ...structuredClone(orig),
        id: `sc-${Date.now()}`,
        name: `${orig.name} ${t.sceneCopySuffix}`,
      };
      return {...b, scenes: [...b.scenes, copy]};
    });
    setBanks(nextBanks);
    sendPatch({banks: nextBanks});
  };

  const handleDeleteSceneInBank = (bankId: string, sceneId: string) => {
    const bank = banks.find((b) => b.id === bankId);
    const targetScene = bank?.scenes.find((sc) => sc.id === sceneId);
    bankUndo.recordCheckpoint(t.chkDeleteScene(targetScene?.name ?? 'Scene'));
    const nextBanks = banks.map((b) => {
      if (b.id !== bankId) return b;
      return {...b, scenes: b.scenes.filter((sc) => sc.id !== sceneId)};
    });
    const nextActiveScene = activeSceneId === sceneId ? null : activeSceneId;
    setBanks(nextBanks);
    setActiveSceneId(nextActiveScene);
    sendPatch({banks: nextBanks, activeSceneId: nextActiveScene});
  };

  // Full User Backup (Download / Upload) & Factory Reset
  const handleDownloadBackup = useCallback(() => {
    const payload = {
      app: 'LightViana DMX',
      format: 'lightviana-full-backup',
      version: 3,
      exportedAt: new Date().toISOString(),
      fixtures,
      presets,
      banks,
      midiBindings: midi.bindings,
      selectedMidiDeviceId: midi.selectedDeviceId,
      preferences: {
        language,
        tabletMode,
        audioSensitivity: sensitivity,
        roomId,
        deviceName,
      },
      consoleState: {
        activePresetId,
        activeBankId,
        activeSceneId,
        autoCycleBeats,
        moveFx,
        colorFx,
        beamFx,
        flashFx: {...flashFx, blackout: false, freeze: false},
        bpm,
        masterDimmer,
        liveLayoutMode,
        faderWingTab,
        groupDimmers,
        fixtureDimmers,
        fixtureMutes,
        fixtureColors,
        rawDmxOverrides,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lightviana-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return {
      presets: presets.length,
      banks: banks.length,
      fixtures: fixtures.length,
    };
  }, [
    fixtures,
    presets,
    banks,
    midi.bindings,
    midi.selectedDeviceId,
    language,
    tabletMode,
    sensitivity,
    roomId,
    deviceName,
    activePresetId,
    activeBankId,
    activeSceneId,
    autoCycleBeats,
    moveFx,
    colorFx,
    beamFx,
    flashFx,
    bpm,
    masterDimmer,
    liveLayoutMode,
    faderWingTab,
    groupDimmers,
    fixtureDimmers,
    fixtureMutes,
    fixtureColors,
    rawDmxOverrides,
  ]);

  const handleUploadBackup = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        const text = await file.text();
        const raw = JSON.parse(text) as unknown;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
          return false;
        }
        const data = raw as {
          fixtures?: unknown;
          presets?: unknown;
          banks?: unknown;
          midiBindings?: unknown;
          selectedMidiDeviceId?: unknown;
          preferences?: {
            language?: unknown;
            tabletMode?: unknown;
            audioSensitivity?: unknown;
            roomId?: unknown;
            deviceName?: unknown;
          };
          consoleState?: {
            activePresetId?: string | null;
            activeBankId?: string | null;
            activeSceneId?: string | null;
            autoCycleBeats?: number;
            moveFx?: MoveFxState;
            colorFx?: ColorFxState;
            beamFx?: BeamFxState;
            flashFx?: FlashFxState;
            bpm?: number;
            masterDimmer?: number;
            liveLayoutMode?: LiveLayoutMode;
            faderWingTab?: FaderWingTab;
            groupDimmers?: GroupDimmerState;
            fixtureDimmers?: Record<string, number>;
            fixtureMutes?: Record<string, boolean>;
            fixtureColors?: Record<string, string>;
            rawDmxOverrides?: Record<number, number>;
          };
        };

        const hasKnownSection =
          Array.isArray(data.fixtures) ||
          Array.isArray(data.presets) ||
          Array.isArray(data.banks) ||
          Array.isArray(data.midiBindings) ||
          Boolean(data.consoleState) ||
          Boolean(data.preferences);

        if (!hasKnownSection) {
          return false;
        }

        const patch: Partial<SyncedShowState> = {};

        if (Array.isArray(data.fixtures) && data.fixtures.length > 0) {
          const nextFixtures = data.fixtures as Fixture[];
          setFixtures(nextFixtures);
          patch.fixtures = nextFixtures;
        }
        if (Array.isArray(data.presets) && data.presets.length > 0) {
          const nextPresets = data.presets as ShowPreset[];
          setPresets(nextPresets);
          patch.presets = nextPresets;
        }
        if (Array.isArray(data.banks) && data.banks.length > 0) {
          const nextBanks = data.banks as SceneBank[];
          setBanks(nextBanks);
          patch.banks = nextBanks;
          if (!data.consoleState?.activeBankId) {
            const fallbackBankId = nextBanks[0]?.id ?? null;
            setActiveBankId(fallbackBankId);
            patch.activeBankId = fallbackBankId;
          }
        }
        if (Array.isArray(data.midiBindings)) {
          midi.setBindings(data.midiBindings as MidiBinding[]);
        }
        if (typeof data.selectedMidiDeviceId === 'string') {
          midi.setSelectedDeviceId(data.selectedMidiDeviceId);
        }

        if (data.preferences) {
          if (
            data.preferences.language === 'en' ||
            data.preferences.language === 'pt-PT'
          ) {
            setLanguage(data.preferences.language);
          }
          if (typeof data.preferences.tabletMode === 'boolean') {
            setTabletMode(data.preferences.tabletMode);
          }
          if (typeof data.preferences.audioSensitivity === 'number') {
            setSensitivity(
              Math.max(0.2, Math.min(0.95, data.preferences.audioSensitivity)),
            );
          }
          if (
            typeof data.preferences.roomId === 'string' &&
            data.preferences.roomId.trim()
          ) {
            setRoomId(data.preferences.roomId.trim().toUpperCase());
          }
          if (
            typeof data.preferences.deviceName === 'string' &&
            data.preferences.deviceName.trim()
          ) {
            setDeviceName(data.preferences.deviceName.trim());
          }
        }

        if (data.consoleState) {
          const cs = data.consoleState;
          if (cs.moveFx) {
            setMoveFx(cs.moveFx);
            patch.moveFx = cs.moveFx;
          }
          if (cs.colorFx) {
            setColorFx(cs.colorFx);
            patch.colorFx = cs.colorFx;
          }
          if (cs.beamFx) {
            setBeamFx(cs.beamFx);
            patch.beamFx = cs.beamFx;
          }
          if (cs.flashFx) {
            setFlashFx(cs.flashFx);
            patch.flashFx = cs.flashFx;
          }
          if (typeof cs.bpm === 'number') {
            setBpm(cs.bpm);
            patch.bpm = cs.bpm;
          }
          if (typeof cs.masterDimmer === 'number') {
            setMasterDimmer(cs.masterDimmer);
            patch.masterDimmer = cs.masterDimmer;
          }
          if (cs.groupDimmers) {
            setGroupDimmers(cs.groupDimmers);
            patch.groupDimmers = cs.groupDimmers;
          }
          if (cs.fixtureDimmers) {
            setFixtureDimmers(cs.fixtureDimmers);
            patch.fixtureDimmers = cs.fixtureDimmers;
          }
          if (cs.fixtureMutes) {
            setFixtureMutes(cs.fixtureMutes);
            patch.fixtureMutes = cs.fixtureMutes;
          }
          if (cs.fixtureColors) {
            setFixtureColors(cs.fixtureColors);
            patch.fixtureColors = cs.fixtureColors;
          }
          if (cs.rawDmxOverrides) {
            setRawDmxOverrides(cs.rawDmxOverrides);
            patch.rawDmxOverrides = cs.rawDmxOverrides;
          }
          if (cs.activePresetId !== undefined) {
            setActivePresetId(cs.activePresetId);
            patch.activePresetId = cs.activePresetId;
          }
          if (cs.activeBankId !== undefined) {
            setActiveBankId(cs.activeBankId);
            patch.activeBankId = cs.activeBankId;
          }
          if (cs.activeSceneId !== undefined) {
            setActiveSceneId(cs.activeSceneId);
            patch.activeSceneId = cs.activeSceneId;
          }
          if (typeof cs.autoCycleBeats === 'number') {
            setAutoCycleBeats(cs.autoCycleBeats);
          }
          if (
            cs.liveLayoutMode === 'fx' ||
            cs.liveLayoutMode === 'split' ||
            cs.liveLayoutMode === 'faders'
          ) {
            setLiveLayoutMode(cs.liveLayoutMode);
          }
          if (
            cs.faderWingTab === 'groups' ||
            cs.faderWingTab === 'fixtures' ||
            cs.faderWingTab === 'channels' ||
            cs.faderWingTab === 'dmx512' ||
            cs.faderWingTab === 'universe'
          ) {
            setFaderWingTab(cs.faderWingTab);
          }
        }

        bankUndo.clearHistory();
        if (Object.keys(patch).length > 0) {
          sendPatch(patch);
        }
        return true;
      } catch {
        return false;
      }
    },
    [bankUndo, midi, sendPatch, setLanguage],
  );

  const handleFactoryReset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_FIXTURES_KEY);
      localStorage.removeItem(STORAGE_PRESETS_KEY);
      localStorage.removeItem(STORAGE_BANKS_KEY);
      localStorage.removeItem(STORAGE_CONSOLE_STATE_KEY);
      localStorage.removeItem('lightrider_universe_labels_v1');
      localStorage.removeItem('lightrider_midi_mappings_v1');
      localStorage.removeItem('lightrider_midi_device_v1');
      localStorage.removeItem('lightrider_language_v1');
    } catch {
      // Ignore storage errors
    }

    const factoryFixtures = structuredClone(DEFAULT_FIXTURES);
    const factoryPresets = structuredClone(DEFAULT_PRESETS);
    const factoryBanks = structuredClone(DEFAULT_BANKS);
    const factoryInitialPreset = factoryPresets[0];
    const factoryGroups: GroupDimmerState = {...DEFAULT_GROUP_DIMMERS};
    const factoryFlash: FlashFxState = {
      blinder: false,
      strobe: false,
      strobeRate: 14,
      smoke: false,
      freeze: false,
      blackout: false,
    };
    const detected = detectDeviceRole();

    void handleChangeAudioMode('off');
    setSensitivity(0.65);

    setFixtures(factoryFixtures);
    setPresets(factoryPresets);
    setBanks(factoryBanks);
    setActivePresetId(factoryInitialPreset.id);
    setActiveBankId(factoryBanks[0]?.id ?? null);
    setActiveSceneId(null);
    setAutoCycleBeats(0);

    setMoveFx({...factoryInitialPreset.moveFx});
    setColorFx({
      ...factoryInitialPreset.colorFx,
      colors: [...factoryInitialPreset.colorFx.colors] as [string, string, string],
    });
    setBeamFx({...factoryInitialPreset.beamFx});
    setFlashFx(factoryFlash);
    setBpm(factoryInitialPreset.bpm);
    setMasterDimmer(factoryInitialPreset.masterDimmer);
    setLiveLayoutMode('split');
    setFaderWingTab('groups');
    setGroupDimmers(factoryGroups);
    setFixtureDimmers({});
    setFixtureMutes({});
    setFixtureFlashes({});
    setFixtureColors({});
    setRawDmxOverrides({});
    setSelectedFixtureId(null);

    midi.clearAllBindings();
    midi.setSelectedDeviceId('all');
    setLanguage('en');
    setRoomId('MAIN-SHOW');
    setDeviceRole(detected.role);
    setDeviceName(detected.defaultName);
    setTabletMode(detected.role === 'android');
    bankUndo.clearHistory();

    sendPatch({
      fixtures: factoryFixtures,
      presets: factoryPresets,
      banks: factoryBanks,
      activePresetId: factoryInitialPreset.id,
      activeBankId: factoryBanks[0]?.id ?? null,
      activeSceneId: null,
      moveFx: {...factoryInitialPreset.moveFx},
      colorFx: {
        ...factoryInitialPreset.colorFx,
        colors: [...factoryInitialPreset.colorFx.colors] as [string, string, string],
      },
      beamFx: {...factoryInitialPreset.beamFx},
      flashFx: factoryFlash,
      bpm: factoryInitialPreset.bpm,
      masterDimmer: factoryInitialPreset.masterDimmer,
      groupDimmers: factoryGroups,
      fixtureDimmers: {},
      fixtureMutes: {},
      fixtureColors: {},
      rawDmxOverrides: {},
    });
  }, [bankUndo, handleChangeAudioMode, midi, sendPatch, setLanguage]);

  return (
    <div
      className={`min-h-screen bg-[#090C12] text-slate-100 ${
        tabletMode ? 'select-none touch-manipulation' : ''
      }`}
    >
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSavePreset={() => setSaveModalOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 sm:px-6">
        {/* Live Stage Visualizer persists at top across Live Console, Bank & Live Edit */}
        {(activeTab === 'live' || activeTab === 'bank' || activeTab === 'edit') && (
          <StageVisualizer
            fixtures={fixtures}
            outputsRef={outputsRef}
            selectedFixtureId={selectedFixtureId}
            onSelectFixture={setSelectedFixtureId}
            blackout={flashFx.blackout}
            freeze={flashFx.freeze}
            smokeActive={flashFx.smoke || groupDimmers.smoke > 15}
            bpm={bpm}
            beatProgressRef={beatProgressRef}
            audioEnergyRef={audioEnergyRef}
            onJumpToLiveEdit={(id) => {
              setSelectedFixtureId(id);
              setActiveTab('edit');
            }}
          />
        )}

        {activeTab === 'live' && (
          <>
            {/* Compact Console View Switcher: FX Deck | FX + Faders | Fader Wing */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#101624] px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono-tabular text-slate-300">
                <span>
                  {t.readoutMaster} <strong className="text-white">{masterDimmer}%</strong>
                </span>
                <span>
                  {t.readoutBeams} <strong className="text-sky-300">{groupDimmers.beam}%</strong>
                </span>
                <span>
                  {t.readoutWash} <strong className="text-emerald-300">{groupDimmers.wash}%</strong>
                </span>
                <span>
                  {t.readoutFx} <strong className="text-amber-300">{groupDimmers.fx}%</strong>
                </span>
                {groupDimmers.smoke > 0 && (
                  <span>
                    {t.readoutSmoke} <strong className="text-indigo-300">{groupDimmers.smoke}%</strong>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 rounded-lg bg-[#080B12] p-1 ring-1 ring-white/10">
                {(
                  [
                    {id: 'fx', label: t.layoutFxDeck},
                    {id: 'split', label: t.layoutSplit},
                    {id: 'faders', label: t.layoutFaderWing},
                  ] as Array<{id: LiveLayoutMode; label: string}>
                ).map((modeOpt) => (
                  <button
                    key={modeOpt.id}
                    type="button"
                    onClick={() => setLiveLayoutMode(modeOpt.id)}
                    className={`min-h-[34px] rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      liveLayoutMode === modeOpt.id
                        ? 'bg-sky-500 text-slate-950'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {modeOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {liveLayoutMode !== 'faders' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-3">
                  <MoveFxPanel
                    moveFx={moveFx}
                    onChange={(next) => {
                      setMoveFx(next);
                      setActivePresetId(null);
                      sendPatch({moveFx: next, activePresetId: null});
                    }}
                  />
                </div>

                <div className="lg:col-span-6">
                  <FlashFxCenter
                    moveFx={moveFx}
                    onChangeMoveFx={(next) => {
                      setMoveFx(next);
                      setActivePresetId(null);
                      sendPatch({moveFx: next, activePresetId: null});
                    }}
                    flashFx={flashFx}
                    onChangeFlashFx={(next) => {
                      setFlashFx(next);
                      sendPatch({flashFx: next});
                    }}
                    beamFx={beamFx}
                    onChangeBeamFx={(next) => {
                      setBeamFx(next);
                      setActivePresetId(null);
                      sendPatch({beamFx: next, activePresetId: null});
                    }}
                    bpm={bpm}
                    onTapBpm={handleTapBpm}
                    onChangeBpm={(val) => {
                      setBpm(val);
                      sendPatch({bpm: val});
                    }}
                    masterDimmer={masterDimmer}
                    onChangeMasterDimmer={(val) => {
                      setMasterDimmer(val);
                      sendPatch({masterDimmer: val});
                    }}
                    audioMode={audioMode}
                    onChangeAudioMode={handleChangeAudioMode}
                  />
                </div>

                <div className="lg:col-span-3">
                  <ColorFxPanel
                    colorFx={colorFx}
                    onChange={(next) => {
                      setColorFx(next);
                      setActivePresetId(null);
                      sendPatch({colorFx: next, activePresetId: null});
                    }}
                  />
                </div>
              </div>
            )}

            {liveLayoutMode !== 'fx' && (
              <FaderWingPanel
                mode={liveLayoutMode === 'faders' ? 'full' : 'strip'}
                wingTab={faderWingTab}
                onChangeWingTab={setFaderWingTab}
                onOpenFullWing={(tab, fixtureId) => {
                  if (tab) setFaderWingTab(tab);
                  if (fixtureId) setSelectedFixtureId(fixtureId);
                  setLiveLayoutMode('faders');
                }}
                fixtures={fixtures}
                universeRef={universeRef}
                outputsRef={outputsRef}
                masterDimmer={masterDimmer}
                onChangeMasterDimmer={(val) => {
                  setMasterDimmer(val);
                  sendPatch({masterDimmer: val});
                }}
                groupDimmers={groupDimmers}
                onChangeGroupDimmers={(next) => {
                  setGroupDimmers(next);
                  sendPatch({groupDimmers: next});
                }}
                fixtureDimmers={fixtureDimmers}
                onChangeFixtureDimmer={(fixtureId, val) => {
                  setFixtureDimmers((prev) => {
                    const next = {...prev, [fixtureId]: val};
                    sendPatch({fixtureDimmers: next});
                    return next;
                  });
                }}
                onResetAllFixtureDimmers={() => {
                  setFixtureDimmers({});
                  sendPatch({fixtureDimmers: {}});
                }}
                fixtureMutes={fixtureMutes}
                onToggleFixtureMute={(fixtureId) => {
                  setFixtureMutes((prev) => {
                    const next = {...prev, [fixtureId]: !prev[fixtureId]};
                    sendPatch({fixtureMutes: next});
                    return next;
                  });
                }}
                onUnmuteAllFixtures={() => {
                  setFixtureMutes({});
                  sendPatch({fixtureMutes: {}});
                }}
                fixtureFlashes={fixtureFlashes}
                onSetFixtureFlash={(fixtureId, active) => {
                  setFixtureFlashes((prev) => ({...prev, [fixtureId]: active}));
                }}
                fixtureColors={fixtureColors}
                onChangeFixtureColor={(fixtureId, hex) => {
                  setFixtureColors((prev) => {
                    const next = {...prev};
                    if (hex === null) {
                      delete next[fixtureId];
                    } else {
                      next[fixtureId] = hex;
                    }
                    sendPatch({fixtureColors: next});
                    return next;
                  });
                }}
                onClearAllFixtureColors={() => {
                  setFixtureColors({});
                  sendPatch({fixtureColors: {}});
                }}
                selectedFixtureId={selectedFixtureId}
                onSelectFixture={setSelectedFixtureId}
                rawDmxOverrides={rawDmxOverrides}
                onSetRawDmxOverride={(channel1Based, value) => {
                  setRawDmxOverrides((prev) => {
                    const next = {...prev};
                    if (value === null) {
                      delete next[channel1Based];
                    } else {
                      next[channel1Based] = value;
                    }
                    sendPatch({rawDmxOverrides: next});
                    return next;
                  });
                }}
                onClearRawDmxOverrides={(channels) => {
                  setRawDmxOverrides((prev) => {
                    if (!channels) {
                      sendPatch({rawDmxOverrides: {}});
                      return {};
                    }
                    const next = {...prev};
                    for (const ch of channels) {
                      delete next[ch];
                    }
                    sendPatch({rawDmxOverrides: next});
                    return next;
                  });
                }}
                moveFx={moveFx}
                onChangeMoveFx={(next) => {
                  setMoveFx(next);
                  setActivePresetId(null);
                  sendPatch({moveFx: next, activePresetId: null});
                }}
                colorFx={colorFx}
                onChangeColorFx={(next) => {
                  setColorFx(next);
                  setActivePresetId(null);
                  sendPatch({colorFx: next, activePresetId: null});
                }}
                beamFx={beamFx}
                onChangeBeamFx={(next) => {
                  setBeamFx(next);
                  setActivePresetId(null);
                  sendPatch({beamFx: next, activePresetId: null});
                }}
                flashFx={flashFx}
                onChangeFlashFx={(next) => {
                  setFlashFx(next);
                  sendPatch({flashFx: next});
                }}
              />
            )}

            {/* Bottom Presets Dock */}
            <PresetsDock
              presets={presets}
              activePresetId={activePresetId}
              onSelectPreset={handleSelectPreset}
              onDeletePreset={handleDeletePreset}
              onOpenSaveModal={() => setSaveModalOpen(true)}
            />
          </>
        )}

        {activeTab === 'bank' && (
          <BankView
            banks={banks}
            activeBankId={activeBankId}
            activeSceneId={activeSceneId}
            autoCycleBeats={autoCycleBeats}
            onChangeAutoCycleBeats={setAutoCycleBeats}
            onSelectBank={(id) => {
              setActiveBankId(id);
              sendPatch({activeBankId: id});
            }}
            onCreateBank={handleCreateBank}
            onDeleteBank={handleDeleteBank}
            onTriggerScene={(bankId, scene) => handleTriggerScene(bankId, scene, true)}
            onCreateSceneInBank={handleCreateSceneInBank}
            onOverwriteSceneInBank={handleOverwriteSceneInBank}
            onUpdateSceneMetaInBank={handleUpdateSceneMetaInBank}
            onDuplicateSceneInBank={handleDuplicateSceneInBank}
            onDeleteSceneInBank={handleDeleteSceneInBank}
            canUndo={bankUndo.canUndo}
            canRedo={bankUndo.canRedo}
            nextUndoLabel={bankUndo.nextUndoLabel}
            nextRedoLabel={bankUndo.nextRedoLabel}
            undoStack={bankUndo.undoStack}
            redoStack={bankUndo.redoStack}
            undoFeedback={bankUndo.lastFeedback}
            onUndo={bankUndo.undo}
            onRedo={bankUndo.redo}
            onRestoreUndoIndex={bankUndo.restoreUndoIndex}
            fixtures={fixtures}
            universeRef={universeRef}
            outputsRef={outputsRef}
            moveFx={moveFx}
            onChangeMoveFx={(next) => {
              bankUndo.recordCheckpoint(t.chkAdjustMoveFx, 'move_fx');
              setMoveFx(next);
              setActivePresetId(null);
              sendPatch({moveFx: next, activePresetId: null});
            }}
            colorFx={colorFx}
            onChangeColorFx={(next) => {
              bankUndo.recordCheckpoint(t.chkAdjustColorFx, 'color_fx');
              setColorFx(next);
              setActivePresetId(null);
              sendPatch({colorFx: next, activePresetId: null});
            }}
            flashFx={flashFx}
            onChangeFlashFx={(next) => {
              bankUndo.recordCheckpoint(t.chkAdjustFlashFx, 'flash_fx');
              setFlashFx(next);
              sendPatch({flashFx: next});
            }}
            beamFx={beamFx}
            onChangeBeamFx={(next) => {
              bankUndo.recordCheckpoint(t.chkAdjustBeamFx, 'beam_fx');
              setBeamFx(next);
              setActivePresetId(null);
              sendPatch({beamFx: next, activePresetId: null});
            }}
            bpm={bpm}
            onTapBpm={() => {
              bankUndo.recordCheckpoint(t.chkTapBpm, 'bpm');
              handleTapBpm();
            }}
            onChangeBpm={(val) => {
              bankUndo.recordCheckpoint(t.chkAdjustBpm, 'bpm');
              setBpm(val);
              sendPatch({bpm: val});
            }}
            masterDimmer={masterDimmer}
            onChangeMasterDimmer={(val) => {
              bankUndo.recordCheckpoint(t.chkAdjustMasterDimmer, 'master_dimmer');
              setMasterDimmer(val);
              sendPatch({masterDimmer: val});
            }}
            audioMode={audioMode}
            onChangeAudioMode={handleChangeAudioMode}
            groupDimmers={groupDimmers}
            onChangeGroupDimmers={(next) => {
              bankUndo.recordCheckpoint(t.chkAdjustGroupDimmers, 'group_dimmers');
              setGroupDimmers(next);
              sendPatch({groupDimmers: next});
            }}
            fixtureDimmers={fixtureDimmers}
            onChangeFixtureDimmer={(fixtureId, val) => {
              bankUndo.recordCheckpoint(
                t.chkAdjustFixtureDimmer,
                `fix_dim_${fixtureId}`,
              );
              setFixtureDimmers((prev) => {
                const next = {...prev, [fixtureId]: val};
                sendPatch({fixtureDimmers: next});
                return next;
              });
            }}
            onResetAllFixtureDimmers={() => {
              bankUndo.recordCheckpoint(t.chkResetFixtureDimmers);
              setFixtureDimmers({});
              sendPatch({fixtureDimmers: {}});
            }}
            fixtureMutes={fixtureMutes}
            onToggleFixtureMute={(fixtureId) => {
              bankUndo.recordCheckpoint(t.chkToggleFixtureMute);
              setFixtureMutes((prev) => {
                const next = {...prev, [fixtureId]: !prev[fixtureId]};
                sendPatch({fixtureMutes: next});
                return next;
              });
            }}
            onUnmuteAllFixtures={() => {
              bankUndo.recordCheckpoint(t.chkUnmuteAllFixtures);
              setFixtureMutes({});
              sendPatch({fixtureMutes: {}});
            }}
            fixtureFlashes={fixtureFlashes}
            onSetFixtureFlash={(fixtureId, active) => {
              setFixtureFlashes((prev) => ({...prev, [fixtureId]: active}));
            }}
            fixtureColors={fixtureColors}
            onChangeFixtureColor={(fixtureId, hex) => {
              bankUndo.recordCheckpoint(
                t.chkChangeFixtureColor,
                `fix_color_${fixtureId}`,
              );
              setFixtureColors((prev) => {
                const next = {...prev};
                if (hex === null) {
                  delete next[fixtureId];
                } else {
                  next[fixtureId] = hex;
                }
                sendPatch({fixtureColors: next});
                return next;
              });
            }}
            onClearAllFixtureColors={() => {
              bankUndo.recordCheckpoint(t.chkClearFixtureColors);
              setFixtureColors({});
              sendPatch({fixtureColors: {}});
            }}
            selectedFixtureId={selectedFixtureId}
            onSelectFixture={setSelectedFixtureId}
            rawDmxOverrides={rawDmxOverrides}
            onSetRawDmxOverride={(channel1Based, value) => {
              bankUndo.recordCheckpoint(
                t.chkAdjustDmxChannel(channel1Based),
                `raw_dmx_${channel1Based}`,
              );
              setRawDmxOverrides((prev) => {
                const next = {...prev};
                if (value === null) {
                  delete next[channel1Based];
                } else {
                  next[channel1Based] = value;
                }
                sendPatch({rawDmxOverrides: next});
                return next;
              });
            }}
            onClearRawDmxOverrides={(channels) => {
              bankUndo.recordCheckpoint(t.chkClearManualDmx);
              setRawDmxOverrides((prev) => {
                if (!channels) {
                  sendPatch({rawDmxOverrides: {}});
                  return {};
                }
                const next = {...prev};
                for (const ch of channels) {
                  delete next[ch];
                }
                sendPatch({rawDmxOverrides: next});
                return next;
              });
            }}
          />
        )}

        {activeTab === 'fixtures' && (
          <FixturesDmxView
            fixtures={fixtures}
            universeRef={universeRef}
            onChangeFixtures={(next) => {
              setFixtures(next);
              sendPatch({fixtures: next});
            }}
          />
        )}

        {activeTab === 'edit' && (
          <LiveEditView
            fixtures={fixtures}
            selectedFixtureId={selectedFixtureId}
            onSelectFixture={(id) => setSelectedFixtureId(id)}
            onChangeFixtures={(next) => {
              setFixtures(next);
              sendPatch({fixtures: next});
            }}
          />
        )}

        {activeTab === 'audio' && (
          <AudioSyncView
            audioMode={audioMode}
            onChangeAudioMode={handleChangeAudioMode}
            audioError={audioError}
            sensitivity={sensitivity}
            onChangeSensitivity={setSensitivity}
            spectrumRef={spectrumRef}
            bpm={bpm}
            onTapBpm={handleTapBpm}
            fixtures={fixtures}
            presets={presets}
            onImportShow={(data) => {
              const patch: Partial<SyncedShowState> = {};
              if (Array.isArray(data.fixtures) && data.fixtures.length > 0) {
                setFixtures(data.fixtures);
                patch.fixtures = data.fixtures;
              }
              if (Array.isArray(data.presets) && data.presets.length > 0) {
                setPresets(data.presets);
                patch.presets = data.presets;
              }
              if (Array.isArray((data as {midiBindings?: MidiBinding[]}).midiBindings)) {
                midi.setBindings(
                  (data as {midiBindings: MidiBinding[]}).midiBindings,
                );
              }
              if (Object.keys(patch).length > 0) {
                sendPatch(patch);
              }
            }}
            midiBindings={midi.bindings}
            midiDevices={midi.devices}
            selectedMidiDeviceId={midi.selectedDeviceId}
            onSelectMidiDeviceId={midi.setSelectedDeviceId}
            midiAccessStatus={midi.accessStatus}
            learningTargetId={midi.learningTargetId}
            lastMidiMessage={midi.lastMessage}
            recentTargetHit={midi.recentTargetHit}
            onScanMidiDevices={midi.scanDevices}
            onStartMidiLearn={midi.startLearn}
            onCancelMidiLearn={midi.cancelLearn}
            onUpsertMidiBinding={midi.upsertBindingForTarget}
            onRemoveMidiBinding={midi.removeBindingForTarget}
            onClearAllMidiBindings={midi.clearAllBindings}
            onLoadStandardMidiTemplate={midi.loadStandardTemplate}
            masterDimmer={masterDimmer}
            groupDimmers={groupDimmers}
            flashFx={flashFx}
            moveFx={moveFx}
            colorFx={colorFx}
            beamFx={beamFx}
          />
        )}

        {activeTab === 'network' && (
          <NetworkRemoteView
            roomId={roomId}
            onChangeRoomId={setRoomId}
            deviceName={deviceName}
            onChangeDeviceName={setDeviceName}
            deviceRole={deviceRole}
            onChangeDeviceRole={setDeviceRole}
            syncStatus={syncStatus}
            devices={devices}
            selfId={selfId}
            tabletMode={tabletMode}
            onToggleTabletMode={() => setTabletMode((t) => !t)}
          />
        )}
      </main>

      <SavePresetModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSavePreset}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        tabletMode={tabletMode}
        onToggleTabletMode={() => setTabletMode((prev) => !prev)}
        onDownloadBackup={handleDownloadBackup}
        onUploadBackup={handleUploadBackup}
        onFactoryReset={handleFactoryReset}
      />

      <OfflineIndicator />
    </div>
  );
}
