export type MoveFxPattern =
  | 'circle'
  | 'figure8'
  | 'pan_sweep'
  | 'tilt_wave'
  | 'cross'
  | 'ballyhoo'
  | 'diamond'
  | 'snap_home';

export type ColorFxPattern =
  | 'rainbow'
  | 'dual_chase'
  | 'pulse_fade'
  | 'ember'
  | 'ocean'
  | 'sparkle'
  | 'split'
  | 'static_wash';

export type FixtureType = 'moving_head' | 'led_par' | 'pixel_bar' | 'blinder' | 'fogger';

export type FixtureGroup = 'beam' | 'wash' | 'fx';

export interface ManualOverride {
  active: boolean;
  pan: number; // 0..100
  tilt: number; // 0..100
  dimmer: number; // 0..100
  color: string; // hex
}

export interface Fixture {
  id: string;
  name: string;
  model: string;
  manufacturer?: string;
  type: FixtureType;
  group: FixtureGroup;
  dmxStart: number; // 1..512
  channelCount: number;
  channelLabels?: string[];
  xPos: number; // 0.05..0.95 horizontal stage position
  yPos: number; // 0.1..0.85 vertical stage position (truss vs floor)
  panInvert: boolean;
  tiltInvert: boolean;
  rdmUid?: string;
  manualOverride?: ManualOverride;
}

export interface MoveFxState {
  pattern: MoveFxPattern;
  enabled: boolean;
  speed: number; // 0..100
  size: number; // 0..100
  fan: number; // -100..100
  centerPan: number; // 0..100 (50 = center)
  centerTilt: number; // 0..100 (50 = mid stage)
}

export interface ColorFxState {
  pattern: ColorFxPattern;
  enabled: boolean;
  speed: number; // 0..100
  fade: number; // 0..100
  shift: number; // 0..100
  colors: [string, string, string];
}

export interface FlashFxState {
  blinder: boolean;
  strobe: boolean;
  strobeRate: number; // 1..25 Hz
  smoke: boolean;
  freeze: boolean;
  blackout: boolean;
}

export interface BeamFxState {
  goboSpin: boolean;
  prism: boolean;
  irisPulse: boolean;
  uvMode: boolean;
  beamSpread: number; // 0..100
}

export interface ShowPreset {
  id: string;
  name: string;
  moveFx: MoveFxState;
  colorFx: ColorFxState;
  beamFx: BeamFxState;
  bpm: number;
  masterDimmer: number;
  isCustom?: boolean;
}

export interface FixtureComputedOutput {
  fixtureId: string;
  panNorm: number; // -1..1
  tiltNorm: number; // -1..1
  panDeg: number; // -270..270
  tiltDeg: number; // -135..135
  r: number; // 0..255
  g: number; // 0..255
  b: number; // 0..255
  w: number; // 0..255
  dimmer: number; // 0..1
  strobeOpen: boolean;
  goboAngle: number; // radians
  prismActive: boolean;
  beamWidth: number; // 0.3..1.6
  smokeIntensity: number; // 0..1
}

export interface GroupDimmerState {
  beam: number; // 0..100
  wash: number; // 0..100
  fx: number; // 0..100
  smoke: number; // 0..100
}

export interface BankScene {
  id: string;
  name: string;
  colorTag: string;
  fadePercent: number; // 0..100
  moveFx: MoveFxState;
  colorFx: ColorFxState;
  beamFx: BeamFxState;
  flashFx: FlashFxState;
  bpm: number;
  masterDimmer: number;
  groupDimmers: GroupDimmerState;
  fixtureDimmers: Record<string, number>;
  fixtureMutes: Record<string, boolean>;
  fixtureColors: Record<string, string>;
  rawDmxOverrides: Record<number, number>;
}

export interface SceneBank {
  id: string;
  name: string;
  color: string;
  scenes: BankScene[];
}

export type ConsoleTab = 'live' | 'bank' | 'fixtures' | 'edit' | 'audio' | 'network';

export type LiveLayoutMode = 'fx' | 'split' | 'faders';

export type FaderWingTab = 'groups' | 'fixtures' | 'channels' | 'dmx512' | 'universe';

export type AudioSourceMode = 'off' | 'synth' | 'mic';

export type MidiMessageType = 'cc' | 'note' | 'pitchbend';

export type MidiTriggerMode = 'fader' | 'momentary' | 'toggle' | 'trigger';

export type MidiTargetCategory = 'master' | 'group' | 'fx_trigger' | 'fx_param';

export type MidiTargetId =
  | 'master_dimmer'
  | 'group_beam'
  | 'group_wash'
  | 'group_fx'
  | 'group_smoke'
  | 'fx_strobe'
  | 'fx_blinder'
  | 'fx_smoke'
  | 'fx_blackout'
  | 'fx_freeze'
  | 'fx_tap_bpm'
  | 'fx_move_toggle'
  | 'fx_color_toggle'
  | 'fx_gobo_spin'
  | 'fx_prism'
  | 'fx_iris_pulse'
  | 'fx_uv_mode'
  | 'fx_move_speed'
  | 'fx_move_size'
  | 'fx_color_speed'
  | 'fx_color_fade'
  | 'fx_color_shift'
  | 'fx_beam_zoom'
  | 'fx_strobe_rate';

export interface MidiBinding {
  id: string;
  targetId: MidiTargetId;
  messageType: MidiMessageType;
  channel: number; // 0 = Any (1..16), 1..16 = specific MIDI channel
  control: number; // 0..127 CC or Note number (0 for pitchbend)
  mode: MidiTriggerMode;
  invert: boolean;
  minValue: number; // 0..100 (%)
  maxValue: number; // 0..100 (%)
  deviceName?: string;
}

export interface MidiDeviceInfo {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
}

export interface MidiLastMessage {
  deviceId: string;
  deviceName: string;
  messageType: MidiMessageType;
  channel: number; // 1..16
  control: number; // 0..127
  value: number; // 0..127 (or 0..16383 for pitchbend)
  normalized: number; // 0..1
  timestamp: number;
}

