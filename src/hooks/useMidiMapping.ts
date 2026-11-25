import {useCallback, useEffect, useRef, useState} from 'react';
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

const STORAGE_MIDI_BINDINGS_KEY = 'lightrider_midi_mappings_v1';
const STORAGE_MIDI_DEVICE_KEY = 'lightrider_midi_device_v1';

interface WebMidiInputPort {
  id: string;
  name?: string;
  manufacturer?: string;
  state?: 'connected' | 'disconnected';
  onmidimessage: ((event: {data: Uint8Array; timeStamp: number}) => void) | null;
}

interface WebMidiAccessLike {
  inputs: Map<string, WebMidiInputPort>;
  onstatechange: ((event: unknown) => void) | null;
}

export interface MidiTargetDefinition {
  id: MidiTargetId;
  label: string;
  category: MidiTargetCategory;
  categoryLabel: string;
  defaultMode: MidiTriggerMode;
  allowedModes: MidiTriggerMode[];
  description: string;
}

export const MIDI_TARGET_CATALOG: MidiTargetDefinition[] = [
  // Master
  {
    id: 'master_dimmer',
    label: 'Master Dimmer',
    category: 'master',
    categoryLabel: 'Master',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Global console output dimmer (0–100%)',
  },
  // Group Dimmers
  {
    id: 'group_beam',
    label: 'Group: Beams',
    category: 'group',
    categoryLabel: 'Group Dimmer',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Moving head & beam group submaster',
  },
  {
    id: 'group_wash',
    label: 'Group: Wash / Pars',
    category: 'group',
    categoryLabel: 'Group Dimmer',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'LED pars & wash fixtures submaster',
  },
  {
    id: 'group_fx',
    label: 'Group: FX / Bars',
    category: 'group',
    categoryLabel: 'Group Dimmer',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Pixel bars & effect fixtures submaster',
  },
  {
    id: 'group_smoke',
    label: 'Group: Smoke / Haze',
    category: 'group',
    categoryLabel: 'Group Dimmer',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Continuous haze / fog output level',
  },
  // Flash & Performance FX Triggers
  {
    id: 'fx_strobe',
    label: 'Flash: Strobe',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'momentary',
    allowedModes: ['momentary', 'toggle'],
    description: 'High-speed white strobe burst',
  },
  {
    id: 'fx_blinder',
    label: 'Flash: Blinder',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'momentary',
    allowedModes: ['momentary', 'toggle'],
    description: 'Full crowd blinder override',
  },
  {
    id: 'fx_smoke',
    label: 'Flash: Smoke Jet',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'momentary',
    allowedModes: ['momentary', 'toggle'],
    description: 'Momentary fogger burst trigger',
  },
  {
    id: 'fx_blackout',
    label: 'Toggle: Blackout',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'toggle',
    allowedModes: ['toggle', 'momentary'],
    description: 'Mute all DMX dimmer output',
  },
  {
    id: 'fx_freeze',
    label: 'Toggle: Freeze',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'toggle',
    allowedModes: ['toggle', 'momentary'],
    description: 'Hold current DMX frame',
  },
  {
    id: 'fx_tap_bpm',
    label: 'Trigger: Tap BPM',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'trigger',
    allowedModes: ['trigger'],
    description: 'Tap tempo beat detection',
  },
  {
    id: 'fx_move_toggle',
    label: 'Engine: Move FX On/Off',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'toggle',
    allowedModes: ['toggle', 'momentary'],
    description: 'Enable or pause movement generator',
  },
  {
    id: 'fx_color_toggle',
    label: 'Engine: Color FX On/Off',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'toggle',
    allowedModes: ['toggle', 'momentary'],
    description: 'Enable or pause color chase generator',
  },
  {
    id: 'fx_gobo_spin',
    label: 'Beam FX: Gobo Spin',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'toggle',
    allowedModes: ['toggle', 'momentary'],
    description: 'Toggle moving head gobo rotation',
  },
  {
    id: 'fx_prism',
    label: 'Beam FX: 3-Facet Prism',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'toggle',
    allowedModes: ['toggle', 'momentary'],
    description: 'Split beam into prism array',
  },
  {
    id: 'fx_iris_pulse',
    label: 'Beam FX: Iris Pulse',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'toggle',
    allowedModes: ['toggle', 'momentary'],
    description: 'Beat-synced iris aperture pulse',
  },
  {
    id: 'fx_uv_mode',
    label: 'Beam FX: UV Wash',
    category: 'fx_trigger',
    categoryLabel: 'FX Trigger',
    defaultMode: 'toggle',
    allowedModes: ['toggle', 'momentary'],
    description: 'Deep ultraviolet wash override',
  },
  // Continuous FX Parameters
  {
    id: 'fx_move_speed',
    label: 'Move FX: Speed',
    category: 'fx_param',
    categoryLabel: 'FX Parameter',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Pan/tilt movement speed (0–100%)',
  },
  {
    id: 'fx_move_size',
    label: 'Move FX: Size / Amplitude',
    category: 'fx_param',
    categoryLabel: 'FX Parameter',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Movement sweep range (0–100%)',
  },
  {
    id: 'fx_color_speed',
    label: 'Color FX: Speed',
    category: 'fx_param',
    categoryLabel: 'FX Parameter',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Color chase rate (0–100%)',
  },
  {
    id: 'fx_color_fade',
    label: 'Color FX: Fade Glide',
    category: 'fx_param',
    categoryLabel: 'FX Parameter',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'RGB crossfade smoothness (0–100%)',
  },
  {
    id: 'fx_color_shift',
    label: 'Color FX: Phase Shift',
    category: 'fx_param',
    categoryLabel: 'FX Parameter',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Fixture-to-fixture color offset (0–100%)',
  },
  {
    id: 'fx_beam_zoom',
    label: 'Beam FX: Zoom / Spread',
    category: 'fx_param',
    categoryLabel: 'FX Parameter',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Beam aperture angle (0–100%)',
  },
  {
    id: 'fx_strobe_rate',
    label: 'Flash FX: Strobe Rate',
    category: 'fx_param',
    categoryLabel: 'FX Parameter',
    defaultMode: 'fader',
    allowedModes: ['fader'],
    description: 'Strobe flash frequency (2–24 Hz)',
  },
];

export const MIDI_TARGET_BY_ID: Record<MidiTargetId, MidiTargetDefinition> =
  MIDI_TARGET_CATALOG.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<MidiTargetId, MidiTargetDefinition>,
  );

export const STANDARD_MIDI_PRESET: MidiBinding[] = [
  {
    id: 'std-master',
    targetId: 'master_dimmer',
    messageType: 'cc',
    channel: 1,
    control: 7,
    mode: 'fader',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-beam',
    targetId: 'group_beam',
    messageType: 'cc',
    channel: 1,
    control: 1,
    mode: 'fader',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-wash',
    targetId: 'group_wash',
    messageType: 'cc',
    channel: 1,
    control: 2,
    mode: 'fader',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-fx',
    targetId: 'group_fx',
    messageType: 'cc',
    channel: 1,
    control: 3,
    mode: 'fader',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-smoke-grp',
    targetId: 'group_smoke',
    messageType: 'cc',
    channel: 1,
    control: 4,
    mode: 'fader',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-strobe',
    targetId: 'fx_strobe',
    messageType: 'note',
    channel: 1,
    control: 36,
    mode: 'momentary',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-blinder',
    targetId: 'fx_blinder',
    messageType: 'note',
    channel: 1,
    control: 37,
    mode: 'momentary',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-smoke-flash',
    targetId: 'fx_smoke',
    messageType: 'note',
    channel: 1,
    control: 38,
    mode: 'momentary',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-blackout',
    targetId: 'fx_blackout',
    messageType: 'note',
    channel: 1,
    control: 39,
    mode: 'toggle',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-freeze',
    targetId: 'fx_freeze',
    messageType: 'note',
    channel: 1,
    control: 40,
    mode: 'toggle',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-tap',
    targetId: 'fx_tap_bpm',
    messageType: 'note',
    channel: 1,
    control: 41,
    mode: 'trigger',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-move-spd',
    targetId: 'fx_move_speed',
    messageType: 'cc',
    channel: 1,
    control: 14,
    mode: 'fader',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-move-size',
    targetId: 'fx_move_size',
    messageType: 'cc',
    channel: 1,
    control: 15,
    mode: 'fader',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-color-spd',
    targetId: 'fx_color_speed',
    messageType: 'cc',
    channel: 1,
    control: 16,
    mode: 'fader',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
  {
    id: 'std-color-fade',
    targetId: 'fx_color_fade',
    messageType: 'cc',
    channel: 1,
    control: 17,
    mode: 'fader',
    invert: false,
    minValue: 0,
    maxValue: 100,
  },
];

export function formatMidiNoteName(note: number): string {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(note / 12) - 1;
  return `${names[note % 12]}${octave}`;
}

export function formatMidiBindingLabel(binding: MidiBinding): string {
  const chText = binding.channel === 0 ? 'Any Ch' : `Ch ${binding.channel}`;
  if (binding.messageType === 'cc') {
    return `CC ${String(binding.control).padStart(2, '0')} · ${chText}`;
  }
  if (binding.messageType === 'note') {
    return `Note ${binding.control} (${formatMidiNoteName(binding.control)}) · ${chText}`;
  }
  return `Pitch Bend · ${chText}`;
}

function loadStoredBindings(): MidiBinding[] {
  try {
    const raw = localStorage.getItem(STORAGE_MIDI_BINDINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MidiBinding[];
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (b) =>
            b &&
            typeof b.targetId === 'string' &&
            b.targetId in MIDI_TARGET_BY_ID &&
            typeof b.control === 'number',
        );
      }
    }
  } catch {
    // Ignore invalid storage
  }
  return [];
}

function loadStoredDeviceId(): string {
  try {
    return localStorage.getItem(STORAGE_MIDI_DEVICE_KEY) || 'all';
  } catch {
    return 'all';
  }
}

export interface MidiStateCallbacks {
  onSetMasterDimmer: (val: number, syncPatch: boolean) => void;
  onSetGroupDimmer: (
    group: keyof GroupDimmerState,
    val: number,
    syncPatch: boolean,
  ) => void;
  onUpdateFlashFx: (
    updater: (prev: FlashFxState) => FlashFxState,
    syncPatch: boolean,
  ) => void;
  onUpdateMoveFx: (
    updater: (prev: MoveFxState) => MoveFxState,
    syncPatch: boolean,
  ) => void;
  onUpdateColorFx: (
    updater: (prev: ColorFxState) => ColorFxState,
    syncPatch: boolean,
  ) => void;
  onUpdateBeamFx: (
    updater: (prev: BeamFxState) => BeamFxState,
    syncPatch: boolean,
  ) => void;
  onTapBpm: () => void;
  onFlushContinuousSync: () => void;
}

export type MidiAccessStatus = 'idle' | 'ready' | 'unsupported' | 'denied';

interface ParsedMidiEvent {
  messageType: MidiMessageType;
  channel: number; // 1..16
  control: number; // 0..127
  value: number; // 0..127 or 0..16383
  normalized: number; // 0..1
  isPressed: boolean;
  isLearnEligible: boolean;
}

function parseMidiData(data: Uint8Array): ParsedMidiEvent | null {
  if (!data || data.length < 2) return null;
  const status = data[0];
  // Ignore System Common & System Real-Time (MIDI Clock 0xF8, Active Sensing 0xFE, SysEx 0xF0)
  if (status >= 0xf0 || status < 0x80) return null;

  const command = status & 0xf0;
  const channel = (status & 0x0f) + 1;
  const data1 = data[1] ?? 0;
  const data2 = data[2] ?? 0;

  if (command === 0xb0) {
    // Control Change
    const normalized = Math.max(0, Math.min(1, data2 / 127));
    return {
      messageType: 'cc',
      channel,
      control: data1,
      value: data2,
      normalized,
      isPressed: data2 >= 64,
      isLearnEligible: true,
    };
  }

  if (command === 0x90) {
    // Note On (velocity 0 is equivalent to Note Off)
    const pressed = data2 > 0;
    return {
      messageType: 'note',
      channel,
      control: data1,
      value: data2,
      normalized: pressed ? 1 : 0,
      isPressed: pressed,
      isLearnEligible: pressed,
    };
  }

  if (command === 0x80) {
    // Note Off
    return {
      messageType: 'note',
      channel,
      control: data1,
      value: 0,
      normalized: 0,
      isPressed: false,
      isLearnEligible: false,
    };
  }

  if (command === 0xe0) {
    // 14-bit Pitch Bend
    const raw14 = ((data2 & 0x7f) << 7) | (data1 & 0x7f);
    const normalized = Math.max(0, Math.min(1, raw14 / 16383));
    return {
      messageType: 'pitchbend',
      channel,
      control: 0,
      value: raw14,
      normalized,
      isPressed: raw14 >= 8192,
      isLearnEligible: true,
    };
  }

  return null;
}

export function useMidiMapping(callbacks: MidiStateCallbacks) {
  const [bindings, setBindings] = useState<MidiBinding[]>(loadStoredBindings);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(loadStoredDeviceId);
  const [devices, setDevices] = useState<MidiDeviceInfo[]>([]);
  const [accessStatus, setAccessStatus] = useState<MidiAccessStatus>(() => {
    const nav = navigator as unknown as {requestMIDIAccess?: unknown};
    return typeof nav.requestMIDIAccess === 'function' ? 'idle' : 'unsupported';
  });
  const [learningTargetId, setLearningTargetId] = useState<MidiTargetId | null>(null);
  const [lastMessage, setLastMessage] = useState<MidiLastMessage | null>(null);
  const [recentTargetHit, setRecentTargetHit] = useState<{
    targetId: MidiTargetId;
    timestamp: number;
  } | null>(null);

  const accessRef = useRef<WebMidiAccessLike | null>(null);
  const bindingsRef = useRef<MidiBinding[]>(bindings);
  const selectedDeviceIdRef = useRef<string>(selectedDeviceId);
  const learningTargetRef = useRef<MidiTargetId | null>(learningTargetId);
  const callbacksRef = useRef<MidiStateCallbacks>(callbacks);
  const prevActiveMapRef = useRef<Record<string, boolean>>({});
  const syncTimerRef = useRef<number | null>(null);
  const lastUiMessageAtRef = useRef<number>(0);

  bindingsRef.current = bindings;
  selectedDeviceIdRef.current = selectedDeviceId;
  learningTargetRef.current = learningTargetId;
  callbacksRef.current = callbacks;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MIDI_BINDINGS_KEY, JSON.stringify(bindings));
    } catch {
      // Ignore storage errors
    }
  }, [bindings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MIDI_DEVICE_KEY, selectedDeviceId);
    } catch {
      // Ignore storage errors
    }
  }, [selectedDeviceId]);

  const scheduleContinuousSync = useCallback(() => {
    if (syncTimerRef.current !== null) return;
    syncTimerRef.current = window.setTimeout(() => {
      syncTimerRef.current = null;
      callbacksRef.current.onFlushContinuousSync();
    }, 45);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current !== null) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, []);

  const applyTargetValue = useCallback(
    (
      binding: MidiBinding,
      parsed: ParsedMidiEvent,
      wasActive: boolean,
      isActive: boolean,
    ) => {
      const cb = callbacksRef.current;
      const risingEdge = isActive && !wasActive;
      const rawNorm = binding.invert ? 1 - parsed.normalized : parsed.normalized;
      const minV = Math.max(0, Math.min(100, binding.minValue));
      const maxV = Math.max(0, Math.min(100, binding.maxValue));
      const scaledPct = Math.round(minV + rawNorm * (maxV - minV));

      switch (binding.targetId) {
        case 'master_dimmer': {
          cb.onSetMasterDimmer(scaledPct, false);
          scheduleContinuousSync();
          break;
        }
        case 'group_beam': {
          cb.onSetGroupDimmer('beam', scaledPct, false);
          scheduleContinuousSync();
          break;
        }
        case 'group_wash': {
          cb.onSetGroupDimmer('wash', scaledPct, false);
          scheduleContinuousSync();
          break;
        }
        case 'group_fx': {
          cb.onSetGroupDimmer('fx', scaledPct, false);
          scheduleContinuousSync();
          break;
        }
        case 'group_smoke': {
          cb.onSetGroupDimmer('smoke', scaledPct, false);
          scheduleContinuousSync();
          break;
        }
        case 'fx_strobe': {
          if (binding.mode === 'toggle') {
            if (risingEdge) {
              cb.onUpdateFlashFx((p) => ({...p, strobe: !p.strobe}), true);
            }
          } else {
            cb.onUpdateFlashFx((p) => ({...p, strobe: isActive}), true);
          }
          break;
        }
        case 'fx_blinder': {
          if (binding.mode === 'toggle') {
            if (risingEdge) {
              cb.onUpdateFlashFx((p) => ({...p, blinder: !p.blinder}), true);
            }
          } else {
            cb.onUpdateFlashFx((p) => ({...p, blinder: isActive}), true);
          }
          break;
        }
        case 'fx_smoke': {
          if (binding.mode === 'toggle') {
            if (risingEdge) {
              cb.onUpdateFlashFx((p) => ({...p, smoke: !p.smoke}), true);
            }
          } else {
            cb.onUpdateFlashFx((p) => ({...p, smoke: isActive}), true);
          }
          break;
        }
        case 'fx_blackout': {
          if (binding.mode === 'momentary') {
            cb.onUpdateFlashFx((p) => ({...p, blackout: isActive}), true);
          } else if (risingEdge) {
            cb.onUpdateFlashFx((p) => ({...p, blackout: !p.blackout}), true);
          }
          break;
        }
        case 'fx_freeze': {
          if (binding.mode === 'momentary') {
            cb.onUpdateFlashFx((p) => ({...p, freeze: isActive}), true);
          } else if (risingEdge) {
            cb.onUpdateFlashFx((p) => ({...p, freeze: !p.freeze}), true);
          }
          break;
        }
        case 'fx_tap_bpm': {
          if (risingEdge) {
            cb.onTapBpm();
          }
          break;
        }
        case 'fx_move_toggle': {
          if (binding.mode === 'momentary') {
            cb.onUpdateMoveFx((p) => ({...p, enabled: isActive}), true);
          } else if (risingEdge) {
            cb.onUpdateMoveFx((p) => ({...p, enabled: !p.enabled}), true);
          }
          break;
        }
        case 'fx_color_toggle': {
          if (binding.mode === 'momentary') {
            cb.onUpdateColorFx((p) => ({...p, enabled: isActive}), true);
          } else if (risingEdge) {
            cb.onUpdateColorFx((p) => ({...p, enabled: !p.enabled}), true);
          }
          break;
        }
        case 'fx_gobo_spin': {
          if (binding.mode === 'momentary') {
            cb.onUpdateBeamFx((p) => ({...p, goboSpin: isActive}), true);
          } else if (risingEdge) {
            cb.onUpdateBeamFx((p) => ({...p, goboSpin: !p.goboSpin}), true);
          }
          break;
        }
        case 'fx_prism': {
          if (binding.mode === 'momentary') {
            cb.onUpdateBeamFx((p) => ({...p, prism: isActive}), true);
          } else if (risingEdge) {
            cb.onUpdateBeamFx((p) => ({...p, prism: !p.prism}), true);
          }
          break;
        }
        case 'fx_iris_pulse': {
          if (binding.mode === 'momentary') {
            cb.onUpdateBeamFx((p) => ({...p, irisPulse: isActive}), true);
          } else if (risingEdge) {
            cb.onUpdateBeamFx((p) => ({...p, irisPulse: !p.irisPulse}), true);
          }
          break;
        }
        case 'fx_uv_mode': {
          if (binding.mode === 'momentary') {
            cb.onUpdateBeamFx((p) => ({...p, uvMode: isActive}), true);
          } else if (risingEdge) {
            cb.onUpdateBeamFx((p) => ({...p, uvMode: !p.uvMode}), true);
          }
          break;
        }
        case 'fx_move_speed': {
          cb.onUpdateMoveFx((p) => ({...p, speed: scaledPct}), false);
          scheduleContinuousSync();
          break;
        }
        case 'fx_move_size': {
          cb.onUpdateMoveFx((p) => ({...p, size: scaledPct}), false);
          scheduleContinuousSync();
          break;
        }
        case 'fx_color_speed': {
          cb.onUpdateColorFx((p) => ({...p, speed: scaledPct}), false);
          scheduleContinuousSync();
          break;
        }
        case 'fx_color_fade': {
          cb.onUpdateColorFx((p) => ({...p, fade: scaledPct}), false);
          scheduleContinuousSync();
          break;
        }
        case 'fx_color_shift': {
          cb.onUpdateColorFx((p) => ({...p, shift: scaledPct}), false);
          scheduleContinuousSync();
          break;
        }
        case 'fx_beam_zoom': {
          cb.onUpdateBeamFx((p) => ({...p, beamSpread: scaledPct}), false);
          scheduleContinuousSync();
          break;
        }
        case 'fx_strobe_rate': {
          const hz = Math.round(2 + (scaledPct / 100) * 22);
          cb.onUpdateFlashFx((p) => ({...p, strobeRate: hz}), false);
          scheduleContinuousSync();
          break;
        }
      }
    },
    [scheduleContinuousSync],
  );

  const handleIncomingMidi = useCallback(
    (port: WebMidiInputPort, rawData: Uint8Array) => {
      const filterId = selectedDeviceIdRef.current;
      if (filterId !== 'all' && port.id !== filterId) return;

      const parsed = parseMidiData(rawData);
      if (!parsed) return;

      const deviceName = port.name || 'MIDI Controller';
      const now = Date.now();

      // Throttle UI monitor updates slightly to avoid excessive re-renders on dense 14-bit sweeps
      if (now - lastUiMessageAtRef.current > 24 || parsed.messageType === 'note') {
        lastUiMessageAtRef.current = now;
        setLastMessage({
          deviceId: port.id,
          deviceName,
          messageType: parsed.messageType,
          channel: parsed.channel,
          control: parsed.control,
          value: parsed.value,
          normalized: parsed.normalized,
          timestamp: now,
        });
      }

      // MIDI Learn interception
      const activeLearnTarget = learningTargetRef.current;
      if (activeLearnTarget) {
        if (!parsed.isLearnEligible) return;
        const catalogDef = MIDI_TARGET_BY_ID[activeLearnTarget];
        setBindings((prev) => {
          const existing = prev.find((b) => b.targetId === activeLearnTarget);
          const nextBinding: MidiBinding = {
            id: existing?.id ?? `midi-${activeLearnTarget}-${Date.now()}`,
            targetId: activeLearnTarget,
            messageType: parsed.messageType,
            channel: parsed.channel,
            control: parsed.control,
            mode: existing?.mode ?? catalogDef.defaultMode,
            invert: existing?.invert ?? false,
            minValue: existing?.minValue ?? 0,
            maxValue: existing?.maxValue ?? 100,
            deviceName,
          };
          if (existing) {
            return prev.map((b) => (b.id === existing.id ? nextBinding : b));
          }
          return [...prev, nextBinding];
        });
        learningTargetRef.current = null;
        setLearningTargetId(null);
        setRecentTargetHit({targetId: activeLearnTarget, timestamp: now});
        return;
      }

      // Normal mapping execution
      const currentBindings = bindingsRef.current;
      for (let i = 0; i < currentBindings.length; i += 1) {
        const b = currentBindings[i];
        if (b.messageType !== parsed.messageType) continue;
        if (b.channel !== 0 && b.channel !== parsed.channel) continue;
        if (b.messageType !== 'pitchbend' && b.control !== parsed.control) continue;

        const isActive =
          parsed.messageType === 'note'
            ? parsed.isPressed
            : b.invert
              ? parsed.normalized <= 0.5
              : parsed.normalized >= 0.5;
        const wasActive = Boolean(prevActiveMapRef.current[b.id]);
        prevActiveMapRef.current[b.id] = isActive;

        applyTargetValue(b, parsed, wasActive, isActive);
        setRecentTargetHit({targetId: b.targetId, timestamp: now});
      }
    },
    [applyTargetValue],
  );

  const attachAccessListeners = useCallback(
    (access: WebMidiAccessLike) => {
      const list: MidiDeviceInfo[] = [];
      access.inputs.forEach((port) => {
        const state = port.state === 'disconnected' ? 'disconnected' : 'connected';
        list.push({
          id: port.id,
          name: port.name || 'MIDI Input Device',
          manufacturer: port.manufacturer || 'Generic USB MIDI',
          state,
        });
        port.onmidimessage = (evt) => {
          handleIncomingMidi(port, evt.data);
        };
      });
      setDevices(list);
    },
    [handleIncomingMidi],
  );

  const scanDevices = useCallback(async () => {
    const nav = navigator as unknown as {
      requestMIDIAccess?: (opts?: {sysex?: boolean}) => Promise<WebMidiAccessLike>;
    };
    if (typeof nav.requestMIDIAccess !== 'function') {
      setAccessStatus('unsupported');
      return;
    }

    try {
      const access = await nav.requestMIDIAccess({sysex: false});
      accessRef.current = access;
      setAccessStatus('ready');
      attachAccessListeners(access);
      access.onstatechange = () => {
        if (accessRef.current) {
          attachAccessListeners(accessRef.current);
        }
      };
    } catch {
      setAccessStatus('denied');
    }
  }, [attachAccessListeners]);

  // Auto-initialize Web MIDI listeners across the entire app on mount if supported
  useEffect(() => {
    const nav = navigator as unknown as {
      requestMIDIAccess?: (opts?: {sysex?: boolean}) => Promise<WebMidiAccessLike>;
    };
    if (typeof nav.requestMIDIAccess !== 'function') {
      setAccessStatus('unsupported');
      return;
    }

    let cancelled = false;
    nav
      .requestMIDIAccess({sysex: false})
      .then((access) => {
        if (cancelled) return;
        accessRef.current = access;
        setAccessStatus('ready');
        attachAccessListeners(access);
        access.onstatechange = () => {
          if (accessRef.current) {
            attachAccessListeners(accessRef.current);
          }
        };
      })
      .catch(() => {
        if (!cancelled) {
          setAccessStatus('idle');
        }
      });

    return () => {
      cancelled = true;
      if (accessRef.current) {
        accessRef.current.onstatechange = null;
        accessRef.current.inputs.forEach((port) => {
          port.onmidimessage = null;
        });
      }
    };
  }, [attachAccessListeners]);

  const startLearn = useCallback((targetId: MidiTargetId) => {
    setLearningTargetId((prev) => (prev === targetId ? null : targetId));
  }, []);

  const cancelLearn = useCallback(() => {
    setLearningTargetId(null);
  }, []);

  const upsertBindingForTarget = useCallback(
    (
      targetId: MidiTargetId,
      partial: Partial<Omit<MidiBinding, 'id' | 'targetId'>>,
    ) => {
      const def = MIDI_TARGET_BY_ID[targetId];
      setBindings((prev) => {
        const existing = prev.find((b) => b.targetId === targetId);
        if (existing) {
          return prev.map((b) => (b.id === existing.id ? {...b, ...partial} : b));
        }
        const created: MidiBinding = {
          id: `midi-${targetId}-${Date.now()}`,
          targetId,
          messageType: partial.messageType ?? (def.defaultMode === 'fader' ? 'cc' : 'note'),
          channel: partial.channel ?? 0,
          control: partial.control ?? 1,
          mode: partial.mode ?? def.defaultMode,
          invert: partial.invert ?? false,
          minValue: partial.minValue ?? 0,
          maxValue: partial.maxValue ?? 100,
          deviceName: partial.deviceName,
        };
        return [...prev, created];
      });
    },
    [],
  );

  const removeBindingForTarget = useCallback((targetId: MidiTargetId) => {
    setBindings((prev) => prev.filter((b) => b.targetId !== targetId));
  }, []);

  const clearAllBindings = useCallback(() => {
    setBindings([]);
    setLearningTargetId(null);
  }, []);

  const loadStandardTemplate = useCallback(() => {
    setBindings(STANDARD_MIDI_PRESET);
    setLearningTargetId(null);
  }, []);

  return {
    bindings,
    setBindings,
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    accessStatus,
    learningTargetId,
    lastMessage,
    recentTargetHit,
    scanDevices,
    startLearn,
    cancelLearn,
    upsertBindingForTarget,
    removeBindingForTarget,
    clearAllBindings,
    loadStandardTemplate,
  };
}
