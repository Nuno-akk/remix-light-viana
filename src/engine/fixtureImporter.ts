import type {FixtureGroup, FixtureType} from '../types/dmx.ts';

export interface ParsedFixtureMode {
  modeName: string;
  channelCount: number;
  channelLabels: string[];
}

export interface ParsedFixtureProfile {
  sourceFormat: 'ofl-json' | 'csv' | 'ssl2';
  name: string;
  manufacturer: string;
  model: string;
  type: FixtureType;
  group: FixtureGroup;
  modes: ParsedFixtureMode[];
  note?: string;
}

function classifyFixture(
  categories: string[],
  channelNames: string[],
  fileName: string,
): {type: FixtureType; group: FixtureGroup} {
  const joinedCats = categories.join(' ').toLowerCase();
  const joinedCh = channelNames.join(' ').toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (
    joinedCats.includes('smoke') ||
    joinedCats.includes('haze') ||
    joinedCats.includes('fog') ||
    joinedCh.includes('fog') ||
    joinedCh.includes('haze') ||
    lowerName.includes('haze') ||
    lowerName.includes('fog')
  ) {
    return {type: 'fogger', group: 'fx'};
  }

  if (
    joinedCats.includes('blinder') ||
    joinedCats.includes('strobe') ||
    lowerName.includes('blinder')
  ) {
    return {type: 'blinder', group: 'fx'};
  }

  if (
    joinedCats.includes('moving head') ||
    joinedCats.includes('scanner') ||
    (joinedCh.includes('pan') && joinedCh.includes('tilt'))
  ) {
    return {type: 'moving_head', group: 'beam'};
  }

  if (
    joinedCats.includes('pixel bar') ||
    joinedCats.includes('led bar') ||
    lowerName.includes('bar') ||
    lowerName.includes('strip')
  ) {
    return {type: 'pixel_bar', group: 'wash'};
  }

  return {type: 'led_par', group: 'wash'};
}

interface OflJsonShape {
  name?: string;
  shortName?: string;
  manufacturerKey?: string;
  categories?: string[];
  meta?: {
    manufacturer?: string;
  };
  modes?: Array<{
    name?: string;
    shortName?: string;
    channels?: Array<string | null>;
  }>;
}

export function parseOflJsonProfile(
  rawText: string,
  fileName: string,
): ParsedFixtureProfile {
  const data = JSON.parse(rawText) as OflJsonShape;
  if (!data || typeof data !== 'object') {
    throw new Error('Estrutura JSON inválida.');
  }

  const baseName = fileName.replace(/\.json$/i, '');
  const fixtureName = (data.name || data.shortName || baseName).trim();
  const manufacturer = (
    data.meta?.manufacturer ||
    data.manufacturerKey ||
    'Open Fixture Library'
  ).trim();

  const rawModes = Array.isArray(data.modes) ? data.modes : [];
  const modes: ParsedFixtureMode[] = rawModes
    .filter((m) => Array.isArray(m.channels) && m.channels.length > 0)
    .map((m, idx) => {
      const labels = (m.channels || []).map((c, chIdx) =>
        c ? String(c) : `CH não utilizado ${chIdx + 1}`,
      );
      return {
        modeName: m.name || m.shortName || `Modo ${idx + 1} (${labels.length}ch)`,
        channelCount: Math.min(64, labels.length),
        channelLabels: labels,
      };
    });

  if (modes.length === 0) {
    throw new Error(
      'Nenhum modo/canal DMX encontrado. Era esperado um perfil Open Fixture Library (.json).',
    );
  }

  const allLabels = modes.flatMap((m) => m.channelLabels);
  const {type, group} = classifyFixture(
    Array.isArray(data.categories) ? data.categories : [],
    allLabels,
    fixtureName,
  );

  return {
    sourceFormat: 'ofl-json',
    name: fixtureName,
    manufacturer,
    model: fixtureName,
    type,
    group,
    modes,
  };
}

export function parseCsvProfile(
  rawText: string,
  fileName: string,
): ParsedFixtureProfile {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    throw new Error('O ficheiro CSV está vazio.');
  }

  const baseName = fileName.replace(/\.csv$/i, '');
  const firstCols = lines[0].split(',').map((s) => s.trim().toLowerCase());
  const hasHeader =
    firstCols.some((c) => c === 'channel' || c === 'ch' || c === 'name' || c === 'function');

  const dataLines = hasHeader ? lines.slice(1) : lines;
  if (dataLines.length === 0) {
    throw new Error('O CSV contém apenas cabeçalhos e nenhuma linha de canais.');
  }

  const channelLabels: string[] = [];
  for (const row of dataLines) {
    const cols = row.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
    if (cols.length === 1) {
      channelLabels.push(cols[0]);
    } else {
      // Support "1,Pan" or "Pan,Movement"
      const firstIsNum = /^\d+$/.test(cols[0]);
      channelLabels.push(firstIsNum ? cols[1] || `CH ${cols[0]}` : cols[0]);
    }
  }

  const {type, group} = classifyFixture([], channelLabels, baseName);

  return {
    sourceFormat: 'csv',
    name: baseName,
    manufacturer: 'CSV Personalizado',
    model: baseName,
    type,
    group,
    modes: [
      {
        modeName: `Mapa CSV (${channelLabels.length}ch)`,
        channelCount: Math.max(1, Math.min(64, channelLabels.length)),
        channelLabels,
      },
    ],
  };
}

export function parseSsl2Profile(
  buffer: ArrayBuffer,
  fileName: string,
): ParsedFixtureProfile {
  const bytes = new Uint8Array(buffer);
  const cleanName = fileName.replace(/\.ssl2?$/i, '').replace(/[_-]+/g, ' ').trim();

  // Extract printable ASCII tokens from SSL2 header to help identify manufacturer/model if visible
  let ascii = '';
  for (let i = 0; i < Math.min(bytes.length, 4096); i += 1) {
    const b = bytes[i];
    ascii += b >= 32 && b <= 126 ? String.fromCharCode(b) : ' ';
  }

  const {type, group} = classifyFixture([], [ascii], cleanName);
  const defaultChannels =
    type === 'moving_head'
      ? 16
      : type === 'pixel_bar'
        ? 12
        : type === 'led_par'
          ? 7
          : type === 'blinder'
            ? 4
            : 2;

  return {
    sourceFormat: 'ssl2',
    name: cleanName || 'Equipamento SSL2',
    manufacturer: 'Nicolaudie SSL2',
    model: cleanName || 'Perfil SSL2',
    type,
    group,
    modes: [
      {
        modeName: `Perfil SSL2 (${defaultChannels}ch predefinidos)`,
        channelCount: defaultChannels,
        channelLabels: Array.from({length: defaultChannels}, (_, i) => `SSL2 CH ${i + 1}`),
      },
    ],
    note: 'O formato SSL2 usa codificação binária proprietária Nicolaudie. Verifica ou ajusta o tipo de equipamento e o número de canais antes de endereçar.',
  };
}

export const SAMPLE_OFL_FIXTURE_JSON = JSON.stringify(
  {
    $schema:
      'https://raw.githubusercontent.com/OpenLightingProject/open-fixture-library/master/schemas/fixture.json',
    name: 'Intimidator Spot 255 IRC',
    categories: ['Moving Head', 'Color Changer'],
    meta: {
      manufacturer: 'Chauvet DJ',
    },
    modes: [
      {
        name: '13-Channel',
        shortName: '13ch',
        channels: [
          'Pan',
          'Pan fine',
          'Tilt',
          'Tilt fine',
          'Pan/Tilt speed',
          'Color wheel',
          'Shutter',
          'Dimmer',
          'Gobo wheel',
          'Gobo rotation',
          'Prism',
          'Control',
          'Movement macros',
        ],
      },
      {
        name: '8-Channel',
        shortName: '8ch',
        channels: [
          'Pan',
          'Tilt',
          'Color wheel',
          'Shutter',
          'Dimmer',
          'Gobo wheel',
          'Gobo rotation',
          'Prism',
        ],
      },
    ],
  },
  null,
  2,
);

export const SAMPLE_CSV_FIXTURE = [
  'channel,name',
  '1,Dimmer',
  '2,Red',
  '3,Green',
  '4,Blue',
  '5,White',
  '6,Strobe',
  '7,Macro',
].join('\n');
