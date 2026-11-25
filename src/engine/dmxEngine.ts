import type {
  BankScene,
  BeamFxState,
  ColorFxPattern,
  ColorFxState,
  Fixture,
  FixtureComputedOutput,
  FlashFxState,
  GroupDimmerState,
  MoveFxPattern,
  MoveFxState,
  SceneBank,
  ShowPreset,
} from '../types/dmx.ts';

import {type AppLanguage, TRANSLATIONS} from '../i18n/translations.ts';

export const DEFAULT_GROUP_DIMMERS: GroupDimmerState = {
  beam: 100,
  wash: 100,
  fx: 100,
  smoke: 0,
};

export function getFixtureChannelLabels(
  fixture: Fixture,
  lang: AppLanguage = 'en',
): string[] {
  if (Array.isArray(fixture.channelLabels) && fixture.channelLabels.length > 0) {
    return Array.from({length: fixture.channelCount}, (_, i) => {
      return fixture.channelLabels?.[i] || `CH ${i + 1}`;
    });
  }

  const labels = TRANSLATIONS[lang].channelLabels;

  if (fixture.type === 'moving_head') {
    return Array.from(
      {length: fixture.channelCount},
      (_, i) => labels.movingHead[i] || `Aux ${i + 1}`,
    );
  }

  if (fixture.type === 'led_par' || fixture.type === 'pixel_bar') {
    return Array.from(
      {length: fixture.channelCount},
      (_, i) => labels.ledPar[i] || `Pixel CH ${i + 1}`,
    );
  }

  if (fixture.type === 'blinder') {
    return Array.from(
      {length: fixture.channelCount},
      (_, i) => labels.blinder[i] || `Blinder ${i + 1}`,
    );
  }

  if (fixture.type === 'fogger') {
    return Array.from(
      {length: fixture.channelCount},
      (_, i) => labels.fogger[i] || `${lang === 'pt-PT' ? 'Fumo' : 'Smoke'} ${i + 1}`,
    );
  }

  return Array.from({length: fixture.channelCount}, (_, i) => `CH ${i + 1}`);
}

export const MOVE_FX_CATALOG: Array<{
  id: MoveFxPattern;
  label: string;
  shortDesc: string;
}> = [
  {id: 'circle', label: 'Círculo', shortDesc: 'Varredura contínua 360°'},
  {id: 'figure8', label: 'Figura 8', shortDesc: 'Laço infinito cruzado'},
  {id: 'pan_sweep', label: 'Varredura Pan', shortDesc: 'Varredura horizontal'},
  {id: 'tilt_wave', label: 'Onda Tilt', shortDesc: 'Onda vertical no público'},
  {id: 'cross', label: 'Cruz X', shortDesc: 'Feixes diagonais opostos'},
  {id: 'ballyhoo', label: 'Ballyhoo', shortDesc: 'Arco orgânico multieixo'},
  {id: 'diamond', label: 'Diamante', shortDesc: 'Geometria nítida de 4 pontos'},
  {id: 'snap_home', label: 'Centro Fixo', shortDesc: 'Foco centrado de feixe'},
];

export const COLOR_FX_CATALOG: Array<{
  id: ColorFxPattern;
  label: string;
  shortDesc: string;
  previewGradient: string;
}> = [
  {
    id: 'rainbow',
    label: 'Arco-Íris',
    shortDesc: 'Fluxo de espetro completo',
    previewGradient: 'linear-gradient(135deg, #ef4444, #f59e0b, #10b981, #0ea5e9, #8b5cf6)',
  },
  {
    id: 'dual_chase',
    label: 'Sequência Dupla',
    shortDesc: 'Alternância de duas cores',
    previewGradient: 'linear-gradient(135deg, #0ea5e9 0%, #0ea5e9 48%, #f59e0b 52%, #f59e0b 100%)',
  },
  {
    id: 'pulse_fade',
    label: 'Pulso Suave',
    shortDesc: 'Subida e descida ao ritmo',
    previewGradient: 'linear-gradient(135deg, #0284c7, #38bdf8, #0f172a)',
  },
  {
    id: 'ember',
    label: 'Brasa Quente',
    shortDesc: 'Âmbar quente e carmesim',
    previewGradient: 'linear-gradient(135deg, #dc2626, #ea580c, #facc15)',
  },
  {
    id: 'ocean',
    label: 'Deriva Oceano',
    shortDesc: 'Onda azul-mar e ciano gelo',
    previewGradient: 'linear-gradient(135deg, #0f766e, #0284c7, #67e8f9)',
  },
  {
    id: 'sparkle',
    label: 'Cintilação',
    shortDesc: 'Brilhos brancos de alto contraste',
    previewGradient: 'linear-gradient(135deg, #0ea5e9, #ffffff, #1e293b, #38bdf8)',
  },
  {
    id: 'split',
    label: 'Esq. / Dir.',
    shortDesc: 'Divisão simétrica no palco',
    previewGradient: 'linear-gradient(90deg, #06b6d4 0%, #06b6d4 50%, #f43f5e 50%, #f43f5e 100%)',
  },
  {
    id: 'static_wash',
    label: 'Wash Estático',
    shortDesc: 'Banho sólido de cor primária',
    previewGradient: 'linear-gradient(135deg, #38bdf8, #0284c7)',
  },
];

export const DEFAULT_FIXTURES: Fixture[] = [
  {
    id: 'mh-1',
    name: 'Beam 230W #1',
    model: 'ProBeam 230R',
    type: 'moving_head',
    group: 'beam',
    dmxStart: 1,
    channelCount: 16,
    xPos: 0.18,
    yPos: 0.14,
    panInvert: false,
    tiltInvert: false,
  },
  {
    id: 'mh-2',
    name: 'Beam 230W #2',
    model: 'ProBeam 230R',
    type: 'moving_head',
    group: 'beam',
    dmxStart: 17,
    channelCount: 16,
    xPos: 0.39,
    yPos: 0.14,
    panInvert: false,
    tiltInvert: false,
  },
  {
    id: 'mh-3',
    name: 'Beam 230W #3',
    model: 'ProBeam 230R',
    type: 'moving_head',
    group: 'beam',
    dmxStart: 33,
    channelCount: 16,
    xPos: 0.61,
    yPos: 0.14,
    panInvert: true,
    tiltInvert: false,
  },
  {
    id: 'mh-4',
    name: 'Beam 230W #4',
    model: 'ProBeam 230R',
    type: 'moving_head',
    group: 'beam',
    dmxStart: 49,
    channelCount: 16,
    xPos: 0.82,
    yPos: 0.14,
    panInvert: true,
    tiltInvert: false,
  },
  {
    id: 'par-1',
    name: 'Wash Par #1',
    model: 'QuadPar 18x12W',
    type: 'led_par',
    group: 'wash',
    dmxStart: 65,
    channelCount: 7,
    xPos: 0.1,
    yPos: 0.14,
    panInvert: false,
    tiltInvert: false,
  },
  {
    id: 'par-2',
    name: 'Wash Par #2',
    model: 'QuadPar 18x12W',
    type: 'led_par',
    group: 'wash',
    dmxStart: 72,
    channelCount: 7,
    xPos: 0.29,
    yPos: 0.14,
    panInvert: false,
    tiltInvert: false,
  },
  {
    id: 'par-3',
    name: 'Wash Par #3',
    model: 'QuadPar 18x12W',
    type: 'led_par',
    group: 'wash',
    dmxStart: 79,
    channelCount: 7,
    xPos: 0.71,
    yPos: 0.14,
    panInvert: false,
    tiltInvert: false,
  },
  {
    id: 'par-4',
    name: 'Wash Par #4',
    model: 'QuadPar 18x12W',
    type: 'led_par',
    group: 'wash',
    dmxStart: 86,
    channelCount: 7,
    xPos: 0.9,
    yPos: 0.14,
    panInvert: false,
    tiltInvert: false,
  },
  {
    id: 'bar-1',
    name: 'Barra Pixel Esq.',
    model: 'LinearStrip 24',
    type: 'pixel_bar',
    group: 'wash',
    dmxStart: 93,
    channelCount: 12,
    xPos: 0.25,
    yPos: 0.78,
    panInvert: false,
    tiltInvert: false,
  },
  {
    id: 'bar-2',
    name: 'Barra Pixel Dir.',
    model: 'LinearStrip 24',
    type: 'pixel_bar',
    group: 'wash',
    dmxStart: 105,
    channelCount: 12,
    xPos: 0.75,
    yPos: 0.78,
    panInvert: false,
    tiltInvert: false,
  },
  {
    id: 'blind-1',
    name: 'Blinder Público',
    model: 'DualCOB 200W',
    type: 'blinder',
    group: 'fx',
    dmxStart: 117,
    channelCount: 4,
    xPos: 0.5,
    yPos: 0.14,
    panInvert: false,
    tiltInvert: false,
  },
  {
    id: 'smoke-1',
    name: 'Gerador Fumo',
    model: 'TourHaze 1500',
    type: 'fogger',
    group: 'fx',
    dmxStart: 121,
    channelCount: 2,
    xPos: 0.5,
    yPos: 0.85,
    panInvert: false,
    tiltInvert: false,
  },
];

export const DEFAULT_PRESETS: ShowPreset[] = [
  {
    id: 'preset-drop-cyan',
    name: 'Drop Ciano / Âmbar',
    bpm: 128,
    masterDimmer: 100,
    moveFx: {
      pattern: 'figure8',
      enabled: true,
      speed: 62,
      size: 74,
      fan: 38,
      centerPan: 50,
      centerTilt: 48,
    },
    colorFx: {
      pattern: 'dual_chase',
      enabled: true,
      speed: 58,
      fade: 45,
      shift: 42,
      colors: ['#0EA5E9', '#F59E0B', '#FFFFFF'],
    },
    beamFx: {
      goboSpin: false,
      prism: false,
      irisPulse: false,
      uvMode: false,
      beamSpread: 45,
    },
  },
  {
    id: 'preset-ballyhoo',
    name: 'Festival Ballyhoo',
    bpm: 132,
    masterDimmer: 100,
    moveFx: {
      pattern: 'ballyhoo',
      enabled: true,
      speed: 70,
      size: 85,
      fan: 65,
      centerPan: 50,
      centerTilt: 52,
    },
    colorFx: {
      pattern: 'rainbow',
      enabled: true,
      speed: 66,
      fade: 72,
      shift: 55,
      colors: ['#38BDF8', '#F43F5E', '#FACC15'],
    },
    beamFx: {
      goboSpin: true,
      prism: true,
      irisPulse: false,
      uvMode: false,
      beamSpread: 60,
    },
  },
  {
    id: 'preset-warm-intro',
    name: 'Intro Quente',
    bpm: 118,
    masterDimmer: 82,
    moveFx: {
      pattern: 'tilt_wave',
      enabled: true,
      speed: 28,
      size: 48,
      fan: 25,
      centerPan: 50,
      centerTilt: 42,
    },
    colorFx: {
      pattern: 'ember',
      enabled: true,
      speed: 32,
      fade: 85,
      shift: 30,
      colors: ['#F59E0B', '#EA580C', '#FDE68A'],
    },
    beamFx: {
      goboSpin: false,
      prism: false,
      irisPulse: false,
      uvMode: false,
      beamSpread: 70,
    },
  },
  {
    id: 'preset-ocean-drift',
    name: 'Deriva Oceano',
    bpm: 122,
    masterDimmer: 92,
    moveFx: {
      pattern: 'circle',
      enabled: true,
      speed: 40,
      size: 64,
      fan: 45,
      centerPan: 50,
      centerTilt: 48,
    },
    colorFx: {
      pattern: 'ocean',
      enabled: true,
      speed: 44,
      fade: 88,
      shift: 48,
      colors: ['#06B6D4', '#0284C7', '#14B8A6'],
    },
    beamFx: {
      goboSpin: true,
      prism: false,
      irisPulse: true,
      uvMode: false,
      beamSpread: 55,
    },
  },
  {
    id: 'preset-techno-cross',
    name: 'Techno Cruz X',
    bpm: 138,
    masterDimmer: 100,
    moveFx: {
      pattern: 'cross',
      enabled: true,
      speed: 80,
      size: 80,
      fan: -60,
      centerPan: 50,
      centerTilt: 50,
    },
    colorFx: {
      pattern: 'sparkle',
      enabled: true,
      speed: 78,
      fade: 15,
      shift: 65,
      colors: ['#FFFFFF', '#0EA5E9', '#1E293B'],
    },
    beamFx: {
      goboSpin: false,
      prism: true,
      irisPulse: false,
      uvMode: false,
      beamSpread: 28,
    },
  },
  {
    id: 'preset-diamond-fan',
    name: 'Leque Diamante',
    bpm: 126,
    masterDimmer: 96,
    moveFx: {
      pattern: 'diamond',
      enabled: true,
      speed: 54,
      size: 72,
      fan: 80,
      centerPan: 50,
      centerTilt: 46,
    },
    colorFx: {
      pattern: 'split',
      enabled: true,
      speed: 50,
      fade: 30,
      shift: 50,
      colors: ['#38BDF8', '#F43F5E', '#FFFFFF'],
    },
    beamFx: {
      goboSpin: true,
      prism: false,
      irisPulse: false,
      uvMode: false,
      beamSpread: 40,
    },
  },
  {
    id: 'preset-deep-uv',
    name: 'Lounge UV Profundo',
    bpm: 120,
    masterDimmer: 88,
    moveFx: {
      pattern: 'pan_sweep',
      enabled: true,
      speed: 34,
      size: 60,
      fan: 20,
      centerPan: 50,
      centerTilt: 55,
    },
    colorFx: {
      pattern: 'pulse_fade',
      enabled: true,
      speed: 38,
      fade: 80,
      shift: 35,
      colors: ['#4F46E5', '#2563EB', '#06B6D4'],
    },
    beamFx: {
      goboSpin: false,
      prism: true,
      irisPulse: true,
      uvMode: true,
      beamSpread: 65,
    },
  },
  {
    id: 'preset-solo-center',
    name: 'Foco ao Centro',
    bpm: 124,
    masterDimmer: 100,
    moveFx: {
      pattern: 'snap_home',
      enabled: true,
      speed: 50,
      size: 20,
      fan: 0,
      centerPan: 50,
      centerTilt: 62,
    },
    colorFx: {
      pattern: 'static_wash',
      enabled: true,
      speed: 40,
      fade: 50,
      shift: 0,
      colors: ['#F8FAFC', '#F59E0B', '#38BDF8'],
    },
    beamFx: {
      goboSpin: false,
      prism: false,
      irisPulse: false,
      uvMode: false,
      beamSpread: 32,
    },
  },
];

function sceneFromPreset(
  preset: ShowPreset,
  id: string,
  name: string,
  colorTag: string,
  extra?: Partial<BankScene>,
): BankScene {
  return {
    id,
    name,
    colorTag,
    fadePercent: preset.colorFx.fade,
    moveFx: {...preset.moveFx},
    colorFx: {
      ...preset.colorFx,
      colors: [...preset.colorFx.colors] as [string, string, string],
    },
    beamFx: {...preset.beamFx},
    flashFx: {
      blinder: false,
      strobe: false,
      strobeRate: 14,
      smoke: false,
      freeze: false,
      blackout: false,
    },
    bpm: preset.bpm,
    masterDimmer: preset.masterDimmer,
    groupDimmers: {...DEFAULT_GROUP_DIMMERS},
    fixtureDimmers: {},
    fixtureMutes: {},
    fixtureColors: {},
    rawDmxOverrides: {},
    ...extra,
  };
}

export const DEFAULT_BANKS: SceneBank[] = [
  {
    id: 'bank-show-1',
    name: 'Bank 1 · Abertura',
    color: '#0EA5E9',
    scenes: [
      sceneFromPreset(DEFAULT_PRESETS[2], 'sc-warm-doors', 'Abertura Quente', '#F59E0B', {
        groupDimmers: {beam: 45, wash: 100, fx: 0, smoke: 0},
      }),
      sceneFromPreset(DEFAULT_PRESETS[3], 'sc-ocean-wave', 'Onda Oceano', '#06B6D4'),
      sceneFromPreset(DEFAULT_PRESETS[0], 'sc-cyan-amber', 'Groove Ciano / Âmbar', '#0EA5E9'),
      sceneFromPreset(DEFAULT_PRESETS[6], 'sc-deep-uv', 'Ambiente UV Profundo', '#4F46E5'),
    ],
  },
  {
    id: 'bank-club-2',
    name: 'Bank 2 · Drop & Pista',
    color: '#F59E0B',
    scenes: [
      sceneFromPreset(DEFAULT_PRESETS[1], 'sc-festival-drop', 'Drop de Festival', '#F59E0B', {
        groupDimmers: {beam: 100, wash: 100, fx: 100, smoke: 35},
      }),
      sceneFromPreset(DEFAULT_PRESETS[4], 'sc-techno-x', 'Techno Cruz X', '#F43F5E'),
      sceneFromPreset(DEFAULT_PRESETS[5], 'sc-diamond-split', 'Diamante Esq./Dir.', '#10B981'),
      sceneFromPreset(DEFAULT_PRESETS[7], 'sc-solo-spot', 'Foco Solo ao Centro', '#FFFFFF', {
        groupDimmers: {beam: 100, wash: 25, fx: 0, smoke: 0},
      }),
    ],
  },
];

export const QUICK_COLOR_SWATCHES = [
  '#0EA5E9', // Sky Cyan
  '#38BDF8', // Ice Blue
  '#2563EB', // Royal Blue
  '#10B981', // Emerald
  '#F59E0B', // Warm Amber
  '#EA580C', // Sunset Orange
  '#EF4444', // Crimson Red
  '#F43F5E', // Coral Rose
  '#4F46E5', // Deep Indigo / UV
  '#FFFFFF', // Pure White
];

export function hexToRgb(hex: string): {r: number; g: number; b: number} {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0');
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hslToRgb(h: number, s: number, l: number): {r: number; g: number; b: number} {
  const hue = ((h % 1) + 1) % 1;
  if (s === 0) {
    const v = Math.round(l * 255);
    return {r: v, g: v, b: v};
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return {
    r: Math.round(hue2rgb(hue + 1 / 3) * 255),
    g: Math.round(hue2rgb(hue) * 255),
    b: Math.round(hue2rgb(hue - 1 / 3) * 255),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export interface DmxComputeInput {
  fixtures: Fixture[];
  moveFx: MoveFxState;
  colorFx: ColorFxState;
  flashFx: FlashFxState;
  beamFx: BeamFxState;
  bpm: number;
  masterDimmer: number; // 0..100
  timeSec: number;
  audioEnergy: number; // 0..1
  audioPulseActive: boolean;
  groupDimmers?: GroupDimmerState;
  fixtureDimmers?: Record<string, number>;
  fixtureMutes?: Record<string, boolean>;
  fixtureFlashes?: Record<string, boolean>;
  fixtureColors?: Record<string, string>;
  rawDmxOverrides?: Record<number, number>;
}

export interface DmxFrameResult {
  universe: Uint8Array;
  outputs: FixtureComputedOutput[];
}

export function computeDmxFrame(input: DmxComputeInput): DmxFrameResult {
  const {
    fixtures,
    moveFx,
    colorFx,
    flashFx,
    beamFx,
    bpm,
    masterDimmer,
    timeSec,
    audioEnergy,
    audioPulseActive,
    groupDimmers,
    fixtureDimmers,
    fixtureMutes,
    fixtureFlashes,
    fixtureColors,
    rawDmxOverrides,
  } = input;

  const universe = new Uint8Array(512);
  const outputs: FixtureComputedOutput[] = [];

  const beatFreq = bpm / 60;
  const moveSpeedMul = 0.15 + (moveFx.speed / 100) * 1.45;
  const colorSpeedMul = 0.15 + (colorFx.speed / 100) * 1.65;

  const movePhaseBase = timeSec * beatFreq * moveSpeedMul * Math.PI * 0.5;
  const colorPhaseBase = timeSec * beatFreq * colorSpeedMul * 0.45;

  const sizeScale = moveFx.size / 100;
  const fanRad = (moveFx.fan / 100) * Math.PI * 0.85;
  const shiftFactor = colorFx.shift / 100;
  const fadeSmooth = colorFx.fade / 100;

  const c1 = hexToRgb(colorFx.colors[0] || '#0EA5E9');
  const c2 = hexToRgb(colorFx.colors[1] || '#F59E0B');
  const c3 = hexToRgb(colorFx.colors[2] || '#FFFFFF');

  const masterScale = flashFx.blackout ? 0 : clamp(masterDimmer / 100, 0, 1);
  const strobeWave = flashFx.strobe
    ? Math.sin(timeSec * flashFx.strobeRate * Math.PI * 2) > 0.08
    : true;

  const irisFactor = beamFx.irisPulse
    ? 0.55 + 0.45 * Math.sin(timeSec * beatFreq * Math.PI)
    : 1;
  const baseBeamWidth = (0.35 + (beamFx.beamSpread / 100) * 1.05) * irisFactor;

  const totalBeamFixtures = Math.max(
    1,
    fixtures.filter((f) => f.type === 'moving_head').length,
  );
  let beamIndex = 0;

  fixtures.forEach((fixture, idx) => {
    const normIdx = fixtures.length > 1 ? idx / (fixtures.length - 1) : 0;

    // 1. Movement computation
    let panNorm = (moveFx.centerPan - 50) / 50; // -1..1
    let tiltNorm = (moveFx.centerTilt - 50) / 50; // -1..1

    if (fixture.type === 'moving_head') {
      const fNorm =
        totalBeamFixtures > 1 ? beamIndex / (totalBeamFixtures - 1) - 0.5 : 0;
      const phase = movePhaseBase + fNorm * fanRad * 2;
      beamIndex += 1;

      if (moveFx.enabled) {
        let dx = 0;
        let dy = 0;
        switch (moveFx.pattern) {
          case 'circle':
            dx = Math.cos(phase);
            dy = Math.sin(phase);
            break;
          case 'figure8':
            dx = Math.sin(phase);
            dy = Math.sin(phase * 2) * 0.72;
            break;
          case 'pan_sweep':
            dx = Math.sin(phase);
            dy = 0;
            break;
          case 'tilt_wave':
            dx = 0;
            dy = Math.sin(phase);
            break;
          case 'cross': {
            const dir = idx % 2 === 0 ? 1 : -1;
            dx = Math.sin(phase) * dir;
            dy = Math.cos(phase) * 0.85;
            break;
          }
          case 'ballyhoo':
            dx = Math.sin(phase * 1.0) * 0.7 + Math.cos(phase * 1.7) * 0.35;
            dy = Math.cos(phase * 1.3) * 0.65 + Math.sin(phase * 0.7) * 0.35;
            break;
          case 'diamond': {
            const t = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
            if (t < 0.25) {
              const p = t / 0.25;
              dx = lerp(0, 1, p);
              dy = lerp(-1, 0, p);
            } else if (t < 0.5) {
              const p = (t - 0.25) / 0.25;
              dx = lerp(1, 0, p);
              dy = lerp(0, 1, p);
            } else if (t < 0.75) {
              const p = (t - 0.5) / 0.25;
              dx = lerp(0, -1, p);
              dy = lerp(1, 0, p);
            } else {
              const p = (t - 0.75) / 0.25;
              dx = lerp(-1, 0, p);
              dy = lerp(0, -1, p);
            }
            break;
          }
          case 'snap_home':
            dx = 0;
            dy = 0;
            break;
        }
        panNorm += dx * sizeScale * 0.88;
        tiltNorm += dy * sizeScale * 0.72;
      }

      if (fixture.panInvert) {
        panNorm = -panNorm;
      }
      if (fixture.tiltInvert) {
        tiltNorm = -tiltNorm;
      }
    }

    panNorm = clamp(panNorm, -1, 1);
    tiltNorm = clamp(tiltNorm, -1, 1);

    // 2. Color computation
    let r = c1.r;
    let g = c1.g;
    let b = c1.b;
    let w = 0;
    let dimmer = 1;

    if (colorFx.enabled) {
      const cPhase = colorPhaseBase + normIdx * shiftFactor;
      const frac = ((cPhase % 1) + 1) % 1;

      switch (colorFx.pattern) {
        case 'rainbow': {
          const rgb = hslToRgb(frac, 0.92, 0.54);
          r = rgb.r;
          g = rgb.g;
          b = rgb.b;
          break;
        }
        case 'dual_chase': {
          const wave = Math.sin(cPhase * Math.PI * 2);
          const mix =
            fadeSmooth > 0.15
              ? clamp((wave + 1) * 0.5, 0, 1)
              : wave >= 0
                ? 1
                : 0;
          r = Math.round(lerp(c1.r, c2.r, mix));
          g = Math.round(lerp(c1.g, c2.g, mix));
          b = Math.round(lerp(c1.b, c2.b, mix));
          break;
        }
        case 'pulse_fade': {
          const pulse = Math.pow(0.5 + 0.5 * Math.sin(cPhase * Math.PI * 2), 1.8);
          dimmer = 0.18 + 0.82 * pulse;
          r = Math.round(lerp(c2.r, c1.r, pulse));
          g = Math.round(lerp(c2.g, c1.g, pulse));
          b = Math.round(lerp(c2.b, c1.b, pulse));
          break;
        }
        case 'ember': {
          const flicker =
            0.5 +
            0.35 * Math.sin(cPhase * Math.PI * 4) +
            0.15 * Math.cos(timeSec * 11 + idx * 2.1);
          const m = clamp(flicker, 0, 1);
          r = Math.round(lerp(220, 255, m));
          g = Math.round(lerp(38, 175, m));
          b = Math.round(lerp(10, 45, m));
          dimmer = 0.55 + 0.45 * m;
          break;
        }
        case 'ocean': {
          const wave = 0.5 + 0.5 * Math.sin(cPhase * Math.PI * 2);
          r = Math.round(lerp(6, 56, wave));
          g = Math.round(lerp(120, 210, wave));
          b = Math.round(lerp(185, 248, wave));
          break;
        }
        case 'sparkle': {
          const trig = Math.sin(cPhase * Math.PI * 6 + idx * 1.9);
          if (trig > 0.78) {
            r = 255;
            g = 255;
            b = 255;
            w = 220;
            dimmer = 1;
          } else {
            r = c1.r;
            g = c1.g;
            b = c1.b;
            dimmer = 0.35 + 0.3 * clamp((trig + 1) * 0.5, 0, 1);
          }
          break;
        }
        case 'split': {
          const isRight = fixture.xPos >= 0.5;
          const flip = Math.floor(colorPhaseBase * 2) % 2 === 1;
          const useSecond = flip ? !isRight : isRight;
          const target = useSecond ? c2 : c1;
          r = target.r;
          g = target.g;
          b = target.b;
          break;
        }
        case 'static_wash': {
          r = c1.r;
          g = c1.g;
          b = c1.b;
          break;
        }
      }
    } else {
      dimmer = 0.25;
      r = c3.r;
      g = c3.g;
      b = c3.b;
    }

    // Per-fixture Color override (keeps Move FX & Dimmer FX active while locking fixture color)
    const customHex = fixtureColors?.[fixture.id];
    if (customHex) {
      const customRgb = hexToRgb(customHex);
      r = customRgb.r;
      g = customRgb.g;
      b = customRgb.b;
      w = r === 255 && g === 255 && b === 255 ? 255 : 0;
      if (!colorFx.enabled) {
        dimmer = 1;
      }
    }

    // UV Blacklight override
    if (beamFx.uvMode && !customHex) {
      r = Math.round(r * 0.25 + 62);
      g = Math.round(g * 0.1 + 12);
      b = Math.min(255, Math.round(b * 0.45 + 195));
    }

    // Audio energy modulation when Audio Sync is active
    if (audioPulseActive) {
      const boost = 0.42 + audioEnergy * 0.58;
      dimmer = clamp(dimmer * boost, 0.12, 1);
    }

    // Manual Fixture Override (from Live Edit)
    if (fixture.manualOverride?.active) {
      const mo = fixture.manualOverride;
      panNorm = clamp((mo.pan - 50) / 50, -1, 1);
      tiltNorm = clamp((mo.tilt - 50) / 50, -1, 1);
      dimmer = clamp(mo.dimmer / 100, 0, 1);
      const rgb = hexToRgb(mo.color);
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    }

    // Blinder & Fogger special behavior
    if (fixture.type === 'blinder') {
      if (flashFx.blinder && !flashFx.blackout) {
        r = 255;
        g = 216;
        b = 158;
        w = 255;
        dimmer = 1;
      } else {
        dimmer = 0;
      }
    } else if (flashFx.blinder && !flashFx.blackout) {
      r = Math.round(lerp(r, 255, 0.65));
      g = Math.round(lerp(g, 224, 0.65));
      b = Math.round(lerp(b, 175, 0.65));
      w = 255;
      dimmer = 1;
    }

    // Per-fixture and Group Dimmer / Mute / Flash controls
    const groupScale = groupDimmers ? clamp(groupDimmers[fixture.group] / 100, 0, 1) : 1;
    const fixtureDimScale = clamp((fixtureDimmers?.[fixture.id] ?? 100) / 100, 0, 1);
    const isMuted = Boolean(fixtureMutes?.[fixture.id]);
    const isFlashing = Boolean(fixtureFlashes?.[fixture.id]);

    let smokeIntensity = 0;
    if (fixture.type === 'fogger') {
      const smokeFader = clamp((groupDimmers?.smoke ?? 0) / 100, 0, 1);
      const baseSmoke = Math.max(flashFx.smoke ? 1 : 0, smokeFader);
      smokeIntensity = flashFx.blackout
        ? 0
        : isFlashing
          ? 1
          : isMuted
            ? 0
            : baseSmoke * fixtureDimScale;
      dimmer = smokeIntensity;
    }

    // Apply master dimmer, group dimmer, fixture dimmer, mute, flash, and strobe
    let finalDimmer =
      fixture.type === 'fogger'
        ? smokeIntensity
        : dimmer * masterScale * groupScale * fixtureDimScale;

    if (isMuted) {
      finalDimmer = 0;
    }

    if (isFlashing && !flashFx.blackout && fixture.type !== 'fogger') {
      r = 255;
      g = 255;
      b = 255;
      w = 255;
      finalDimmer = 1;
    }

    if (flashFx.strobe && !flashFx.blackout && fixture.type !== 'fogger') {
      finalDimmer = strobeWave ? finalDimmer : 0;
    }

    // Write actual 512 DMX channels
    const ch = fixture.dmxStart - 1; // 0-indexed
    if (ch >= 0 && ch < 512) {
      if (fixture.type === 'moving_head') {
        const panByte = Math.round(((panNorm + 1) * 0.5) * 255);
        const tiltByte = Math.round(((tiltNorm + 1) * 0.5) * 255);
        universe[ch] = panByte; // CH1 Pan
        if (ch + 1 < 512) universe[ch + 1] = (panByte * 17) & 255; // CH2 Pan Fine
        if (ch + 2 < 512) universe[ch + 2] = tiltByte; // CH3 Tilt
        if (ch + 3 < 512) universe[ch + 3] = (tiltByte * 17) & 255; // CH4 Tilt Fine
        if (ch + 4 < 512) universe[ch + 4] = Math.round(finalDimmer * 255); // CH5 Dimmer
        if (ch + 5 < 512) universe[ch + 5] = flashFx.strobe ? Math.round((flashFx.strobeRate / 25) * 255) : 0; // CH6 Shutter
        if (ch + 6 < 512) universe[ch + 6] = Math.round(r * finalDimmer); // CH7 R
        if (ch + 7 < 512) universe[ch + 7] = Math.round(g * finalDimmer); // CH8 G
        if (ch + 8 < 512) universe[ch + 8] = Math.round(b * finalDimmer); // CH9 B
        if (ch + 9 < 512) universe[ch + 9] = Math.round(w * finalDimmer); // CH10 W
        if (ch + 10 < 512) universe[ch + 10] = beamFx.goboSpin ? 180 : 0; // CH11 Gobo
        if (ch + 11 < 512) universe[ch + 11] = beamFx.prism ? 200 : 0; // CH12 Prism
        if (ch + 12 < 512) universe[ch + 12] = Math.round((beamFx.beamSpread / 100) * 255); // CH13 Zoom/Focus
      } else if (fixture.type === 'led_par' || fixture.type === 'pixel_bar') {
        universe[ch] = Math.round(finalDimmer * 255); // Dimmer
        if (ch + 1 < 512) universe[ch + 1] = r;
        if (ch + 2 < 512) universe[ch + 2] = g;
        if (ch + 3 < 512) universe[ch + 3] = b;
        if (ch + 4 < 512) universe[ch + 4] = w;
        if (ch + 5 < 512) universe[ch + 5] = flashFx.strobe ? 220 : 0;
      } else if (fixture.type === 'blinder') {
        universe[ch] = Math.round(finalDimmer * 255);
        if (ch + 1 < 512) universe[ch + 1] = Math.round(finalDimmer * 255);
      } else if (fixture.type === 'fogger') {
        universe[ch] = Math.round(smokeIntensity * 255);
        if (ch + 1 < 512) universe[ch + 1] = Math.round(smokeIntensity * 200);
      }
    }

    // Apply raw DMX channel fader overrides (HTP/LTP override per channel)
    let outPanNorm = panNorm;
    let outTiltNorm = tiltNorm;
    let outR = r;
    let outG = g;
    let outB = b;
    let outW = w;
    let outDimmer = finalDimmer;
    let outPrism = beamFx.prism;
    let outBeamWidth = baseBeamWidth;
    let outSmoke = smokeIntensity;

    if (rawDmxOverrides) {
      const hasOverride = (offset: number): number | undefined => {
        const channel1 = fixture.dmxStart + offset;
        const val = rawDmxOverrides[channel1];
        return typeof val === 'number' ? clamp(Math.round(val), 0, 255) : undefined;
      };

      if (fixture.type === 'moving_head') {
        const panO = hasOverride(0);
        const tiltO = hasOverride(2);
        const dimO = hasOverride(4);
        const rO = hasOverride(6);
        const gO = hasOverride(7);
        const bO = hasOverride(8);
        const wO = hasOverride(9);
        const prismO = hasOverride(11);
        const zoomO = hasOverride(12);

        if (panO !== undefined) outPanNorm = (panO / 255) * 2 - 1;
        if (tiltO !== undefined) outTiltNorm = (tiltO / 255) * 2 - 1;
        if (dimO !== undefined) outDimmer = dimO / 255;
        if (rO !== undefined) outR = rO;
        if (gO !== undefined) outG = gO;
        if (bO !== undefined) outB = bO;
        if (wO !== undefined) outW = wO;
        if (prismO !== undefined) outPrism = prismO >= 128;
        if (zoomO !== undefined) outBeamWidth = 0.35 + (zoomO / 255) * 1.05;
      } else if (fixture.type === 'led_par' || fixture.type === 'pixel_bar') {
        const dimO = hasOverride(0);
        const rO = hasOverride(1);
        const gO = hasOverride(2);
        const bO = hasOverride(3);
        const wO = hasOverride(4);
        if (dimO !== undefined) outDimmer = dimO / 255;
        if (rO !== undefined) outR = rO;
        if (gO !== undefined) outG = gO;
        if (bO !== undefined) outB = bO;
        if (wO !== undefined) outW = wO;
      } else if (fixture.type === 'blinder') {
        const dimO = hasOverride(0);
        if (dimO !== undefined) outDimmer = dimO / 255;
      } else if (fixture.type === 'fogger') {
        const fogO = hasOverride(0);
        if (fogO !== undefined) {
          outSmoke = fogO / 255;
          outDimmer = outSmoke;
        }
      }
    }

    outputs.push({
      fixtureId: fixture.id,
      panNorm: outPanNorm,
      tiltNorm: outTiltNorm,
      panDeg: Math.round(outPanNorm * 270),
      tiltDeg: Math.round(outTiltNorm * 135),
      r: outR,
      g: outG,
      b: outB,
      w: outW,
      dimmer: outDimmer,
      strobeOpen: strobeWave,
      goboAngle: beamFx.goboSpin ? timeSec * 2.4 : 0,
      prismActive: outPrism,
      beamWidth: outBeamWidth,
      smokeIntensity: outSmoke,
    });
  });

  if (rawDmxOverrides) {
    for (const [chKey, val] of Object.entries(rawDmxOverrides)) {
      const chNum = Number(chKey);
      if (Number.isFinite(chNum) && chNum >= 1 && chNum <= 512 && typeof val === 'number') {
        universe[chNum - 1] = clamp(Math.round(val), 0, 255);
      }
    }
  }

  return {universe, outputs};
}
