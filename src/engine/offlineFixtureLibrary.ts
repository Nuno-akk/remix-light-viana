import {ParsedFixtureProfile} from './fixtureImporter';

export interface OfflineSearchEntry {
  path: string;
  manufacturerKey: string;
  manufacturerName: string;
  fixtureSlug: string;
  displayName: string;
  isOfflineBuiltIn?: boolean;
}

export const OFFLINE_FIXTURE_PROFILES: Record<string, ParsedFixtureProfile> = {
  'offline://generic/moving-head-beam-16ch': {
    sourceFormat: 'ofl-json',
    name: 'Moving Head Beam 230W',
    manufacturer: 'Generic Stage',
    model: 'Beam 230W (16ch)',
    type: 'moving_head',
    group: 'beam',
    modes: [
      {
        modeName: '16-Channel Standard',
        channelCount: 16,
        channelLabels: [
          'Color Wheel',
          'Shutter / Strobe',
          'Dimmer',
          'Gobo Wheel',
          'Prism',
          'Prism Rotate',
          'Frost',
          'Focus',
          'Pan',
          'Pan Fine',
          'Tilt',
          'Tilt Fine',
          'Pan/Tilt Speed',
          'Macro',
          'Lamp Control',
          'Reset',
        ],
      },
      {
        modeName: '12-Channel Compact',
        channelCount: 12,
        channelLabels: [
          'Pan',
          'Pan Fine',
          'Tilt',
          'Tilt Fine',
          'Pan/Tilt Speed',
          'Color Wheel',
          'Shutter / Strobe',
          'Dimmer',
          'Gobo Wheel',
          'Prism',
          'Focus',
          'Reset',
        ],
      },
    ],
  },
  'offline://generic/moving-head-wash-rgbw': {
    sourceFormat: 'ofl-json',
    name: 'Moving Head LED Wash RGBW',
    manufacturer: 'Generic Stage',
    model: 'Wash 19x15W RGBW',
    type: 'moving_head',
    group: 'wash',
    modes: [
      {
        modeName: '14-Channel RGBW',
        channelCount: 14,
        channelLabels: [
          'Pan',
          'Pan Fine',
          'Tilt',
          'Tilt Fine',
          'Pan/Tilt Speed',
          'Dimmer',
          'Strobe',
          'Red',
          'Green',
          'Blue',
          'White',
          'CTO',
          'Zoom',
          'Reset',
        ],
      },
    ],
  },
  'offline://generic/led-par-rgbw-8ch': {
    sourceFormat: 'ofl-json',
    name: 'LED Par 64 RGBW',
    manufacturer: 'Generic Stage',
    model: 'Par RGBW 8ch',
    type: 'led_par',
    group: 'wash',
    modes: [
      {
        modeName: '8-Channel Full',
        channelCount: 8,
        channelLabels: [
          'Dimmer',
          'Red',
          'Green',
          'Blue',
          'White',
          'Strobe',
          'Color Macro',
          'Auto Mode',
        ],
      },
      {
        modeName: '4-Channel RGBW',
        channelCount: 4,
        channelLabels: ['Red', 'Green', 'Blue', 'White'],
      },
      {
        modeName: '3-Channel RGB',
        channelCount: 3,
        channelLabels: ['Red', 'Green', 'Blue'],
      },
    ],
  },
  'offline://generic/led-par-rgbaw-uv': {
    sourceFormat: 'ofl-json',
    name: 'LED Par RGBAW+UV',
    manufacturer: 'Generic Stage',
    model: 'Hex LED 10ch',
    type: 'led_par',
    group: 'wash',
    modes: [
      {
        modeName: '10-Channel Hex',
        channelCount: 10,
        channelLabels: [
          'Dimmer',
          'Red',
          'Green',
          'Blue',
          'Amber',
          'White',
          'UV',
          'Strobe',
          'Color Macro',
          'Dimmer Speed',
        ],
      },
      {
        modeName: '6-Channel RGBAW+UV',
        channelCount: 6,
        channelLabels: ['Red', 'Green', 'Blue', 'Amber', 'White', 'UV'],
      },
    ],
  },
  'offline://generic/led-pixel-bar-12ch': {
    sourceFormat: 'ofl-json',
    name: 'LED Pixel Bar 8-Zone',
    manufacturer: 'Generic Stage',
    model: 'Pixel Bar RGB',
    type: 'pixel_bar',
    group: 'wash',
    modes: [
      {
        modeName: '12-Channel Bar',
        channelCount: 12,
        channelLabels: [
          'Dimmer',
          'Strobe',
          'Program',
          'Speed',
          'Red 1',
          'Green 1',
          'Blue 1',
          'Red 2',
          'Green 2',
          'Blue 2',
          'Red 3',
          'Blue 3',
        ],
      },
      {
        modeName: '6-Channel Wash Bar',
        channelCount: 6,
        channelLabels: ['Dimmer', 'Strobe', 'Red', 'Green', 'Blue', 'White'],
      },
    ],
  },
  'offline://generic/strobe-blinder-4ch': {
    sourceFormat: 'ofl-json',
    name: 'LED Strobe / Audience Blinder',
    manufacturer: 'Generic Stage',
    model: 'Blinder Strobe 4ch',
    type: 'blinder',
    group: 'fx',
    modes: [
      {
        modeName: '4-Channel Standard',
        channelCount: 4,
        channelLabels: ['Dimmer', 'Duration', 'Flash Rate', 'Macro FX'],
      },
      {
        modeName: '2-Channel Blinder',
        channelCount: 2,
        channelLabels: ['Dimmer', 'Strobe'],
      },
    ],
  },
  'offline://generic/hazer-smoke-2ch': {
    sourceFormat: 'ofl-json',
    name: 'DMX Hazer / Fog Machine',
    manufacturer: 'Generic Stage',
    model: 'Hazer Pro 2ch',
    type: 'fogger',
    group: 'fx',
    modes: [
      {
        modeName: '2-Channel Haze + Fan',
        channelCount: 2,
        channelLabels: ['Fog Output', 'Fan Speed'],
      },
      {
        modeName: '1-Channel Smoke',
        channelCount: 1,
        channelLabels: ['Fog Output'],
      },
    ],
  },
};

export const OFFLINE_BUILTIN_ENTRIES: OfflineSearchEntry[] = Object.entries(
  OFFLINE_FIXTURE_PROFILES,
).map(([path, profile]) => ({
  path,
  manufacturerKey: 'generic-stage',
  manufacturerName: profile.manufacturer,
  fixtureSlug: path.split('/').pop() || profile.model,
  displayName: `${profile.name} (${profile.model})`,
  isOfflineBuiltIn: true,
}));

const OFL_INDEX_CACHE_KEY = 'lightrider_ofl_index_v1';
const OFL_PROFILES_CACHE_KEY = 'lightrider_ofl_profiles_v1';

interface CachedOflIndex {
  manufacturers: Array<{key: string; name: string}>;
  entries: OfflineSearchEntry[];
}

export function saveCachedOflIndex(data: CachedOflIndex): void {
  try {
    localStorage.setItem(
      OFL_INDEX_CACHE_KEY,
      JSON.stringify({
        manufacturers: data.manufacturers,
        entries: data.entries.slice(0, 1500),
      }),
    );
  } catch {
    // Ignore storage quota limits
  }
}

export function loadCachedOflIndex(): CachedOflIndex | null {
  try {
    const raw = localStorage.getItem(OFL_INDEX_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedOflIndex>;
    if (Array.isArray(parsed.entries) && Array.isArray(parsed.manufacturers)) {
      return {
        manufacturers: parsed.manufacturers,
        entries: parsed.entries,
      };
    }
  } catch {
    // Ignore invalid cache
  }
  return null;
}

export function saveCachedOflProfile(
  path: string,
  profile: ParsedFixtureProfile,
): void {
  try {
    const raw = localStorage.getItem(OFL_PROFILES_CACHE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, ParsedFixtureProfile>) : {};
    map[path] = profile;
    const keys = Object.keys(map);
    if (keys.length > 40) {
      delete map[keys[0]];
    }
    localStorage.setItem(OFL_PROFILES_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota limits
  }
}

export function loadCachedOflProfile(path: string): ParsedFixtureProfile | null {
  if (OFFLINE_FIXTURE_PROFILES[path]) {
    return OFFLINE_FIXTURE_PROFILES[path];
  }
  try {
    const raw = localStorage.getItem(OFL_PROFILES_CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, ParsedFixtureProfile>;
    return map[path] ?? null;
  } catch {
    return null;
  }
}

export function loadCachedProfileEntries(): OfflineSearchEntry[] {
  try {
    const raw = localStorage.getItem(OFL_PROFILES_CACHE_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, ParsedFixtureProfile>;
    return Object.entries(map).map(([path, profile]) => ({
      path,
      manufacturerKey: profile.manufacturer.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      manufacturerName: profile.manufacturer,
      fixtureSlug: profile.model,
      displayName: profile.name,
      isOfflineBuiltIn: true,
    }));
  } catch {
    return [];
  }
}
