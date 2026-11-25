import type {Fixture, FixtureGroup, FixtureType} from '../types/dmx.ts';

// ANSI E1.20 RDM Start Codes & Command Classes
export const RDM_START_CODE = 0xcc;
export const RDM_SUB_START_CODE = 0x01;
export const RDM_BROADCAST_UID = 'FFFF:FFFFFFFF';
export const RDM_CONTROLLER_UID = '4C52:00000001'; // "LR" LightRider controller UID

export const RDM_COMMAND_CLASS = {
  DISCOVERY_COMMAND: 0x10,
  DISCOVERY_COMMAND_RESPONSE: 0x11,
  GET_COMMAND: 0x20,
  GET_COMMAND_RESPONSE: 0x21,
  SET_COMMAND: 0x30,
  SET_COMMAND_RESPONSE: 0x31,
} as const;

export const RDM_PID = {
  DISC_UNIQUE_BRANCH: 0x0001,
  DISC_MUTE: 0x0002,
  DISC_UN_MUTE: 0x0003,
  SUPPORTED_PARAMETERS: 0x0050,
  DEVICE_INFO: 0x0060,
  DEVICE_MODEL_DESCRIPTION: 0x0080,
  MANUFACTURER_LABEL: 0x0081,
  DEVICE_LABEL: 0x0082,
  DMX_PERSONALITY: 0x00e0,
  DMX_PERSONALITY_DESCRIPTION: 0x00e1,
  DMX_START_ADDRESS: 0x00f0,
  IDENTIFY_DEVICE: 0x1000,
} as const;

// Art-Net 4 OpCodes for RDM & Node Discovery
export const ARTNET_OP = {
  POLL: 0x2000,
  POLL_REPLY: 0x2100,
  DMX: 0x5000,
  TOD_REQUEST: 0x8000,
  TOD_DATA: 0x8100,
  TOD_CONTROL: 0x8200,
  RDM: 0x8300,
} as const;

export interface RdmDiscoveredDevice {
  uid: string;
  manufacturerId: number;
  manufacturerLabel: string;
  modelId: number;
  modelDescription: string;
  deviceLabel: string;
  productCategory: number;
  productCategoryName: string;
  dmxFootprint: number;
  dmxStartAddress: number;
  currentPersonality: number;
  personalityCount: number;
  softwareVersion: string;
  suggestedType: FixtureType;
  suggestedGroup: FixtureGroup;
  identifying: boolean;
  sourceNodeIp?: string;
  sourceUniverse?: number;
}

export interface RdmNodeInfo {
  ip: string;
  shortName: string;
  longName: string;
  rdmSupported: boolean;
  universes: number[];
}

export interface RdmProtocolLogEntry {
  id: string;
  timestamp: string;
  direction: 'TX' | 'RX' | 'INFO';
  protocol: 'ArtPoll' | 'ArtTod' | 'RDM' | 'Serial-RDM';
  summary: string;
}

export interface RdmDiscoveryResult {
  transport: 'artnet-rdm' | 'web-serial-rdm';
  targetIp: string;
  universe: number;
  elapsedMs: number;
  nodesFound: RdmNodeInfo[];
  devices: RdmDiscoveredDevice[];
  protocolLog: RdmProtocolLogEntry[];
}

export function formatUid(bytes: Uint8Array, offset = 0): string {
  const mfg = ((bytes[offset] << 8) | bytes[offset + 1])
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  const dev =
    ((bytes[offset + 2] << 24) |
      (bytes[offset + 3] << 16) |
      (bytes[offset + 4] << 8) |
      bytes[offset + 5]) >>>
    0;
  return `${mfg}:${dev.toString(16).toUpperCase().padStart(8, '0')}`;
}

export function parseUid(uid: string): Uint8Array {
  const clean = uid.replace(/[^0-9a-fA-F]/g, '').padStart(12, '0').slice(0, 12);
  const out = new Uint8Array(6);
  for (let i = 0; i < 6; i += 1) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return out;
}

export function computeRdmChecksum(bytes: Uint8Array, lengthWithoutChecksum: number): number {
  let sum = 0;
  for (let i = 0; i < lengthWithoutChecksum; i += 1) {
    sum = (sum + bytes[i]) & 0xffff;
  }
  return sum;
}

export interface BuildRdmPacketOptions {
  destUid: string;
  sourceUid?: string;
  transactionNumber: number;
  commandClass: number;
  pid: number;
  subDevice?: number;
  portId?: number;
  data?: Uint8Array;
  includeStartCode?: boolean; // true for RS-485 serial, false for Art-Net OpRdm payload
}

export function buildRdmPacket(opts: BuildRdmPacketOptions): Uint8Array {
  const pdl = opts.data ? opts.data.length : 0;
  const msgLength = 24 + pdl; // ANSI E1.20 Message Length field (checksum starts at msgLength)
  const fullPacket = new Uint8Array(msgLength + 2);

  fullPacket[0] = RDM_START_CODE;
  fullPacket[1] = RDM_SUB_START_CODE;
  fullPacket[2] = msgLength;

  const dest = parseUid(opts.destUid);
  const src = parseUid(opts.sourceUid ?? RDM_CONTROLLER_UID);
  fullPacket.set(dest, 3);
  fullPacket.set(src, 9);

  fullPacket[15] = opts.transactionNumber & 0xff;
  fullPacket[16] = opts.portId ?? 1;
  fullPacket[17] = 0; // Message Count
  const subDev = opts.subDevice ?? 0;
  fullPacket[18] = (subDev >> 8) & 0xff;
  fullPacket[19] = subDev & 0xff;
  fullPacket[20] = opts.commandClass & 0xff;
  fullPacket[21] = (opts.pid >> 8) & 0xff;
  fullPacket[22] = opts.pid & 0xff;
  fullPacket[23] = pdl;

  if (opts.data && pdl > 0) {
    fullPacket.set(opts.data, 24);
  }

  const checksum = computeRdmChecksum(fullPacket, msgLength);
  fullPacket[msgLength] = (checksum >> 8) & 0xff;
  fullPacket[msgLength + 1] = checksum & 0xff;

  if (opts.includeStartCode === false) {
    // Art-Net 4 OpRdm omits the leading 0xCC Start Code byte
    return fullPacket.slice(1);
  }
  return fullPacket;
}

export interface ParsedRdmFrame {
  sourceUid: string;
  destUid: string;
  transactionNumber: number;
  responseType: number;
  commandClass: number;
  pid: number;
  data: Uint8Array;
  checksumValid: boolean;
}

export function parseRdmFrame(
  raw: Uint8Array,
  hasStartCodeByte = true,
): ParsedRdmFrame | null {
  const frame = hasStartCodeByte
    ? raw
    : (() => {
        const tmp = new Uint8Array(raw.length + 1);
        tmp[0] = RDM_START_CODE;
        tmp.set(raw, 1);
        return tmp;
      })();

  if (frame.length < 26) return null;
  if (frame[0] !== RDM_START_CODE || frame[1] !== RDM_SUB_START_CODE) return null;

  const msgLen = frame[2];
  if (msgLen < 24 || msgLen + 2 > frame.length) return null;

  const expectedSum = computeRdmChecksum(frame, msgLen);
  const actualSum = (frame[msgLen] << 8) | frame[msgLen + 1];
  const pdl = frame[23];
  const dataEnd = Math.min(msgLen, 24 + pdl);

  return {
    destUid: formatUid(frame, 3),
    sourceUid: formatUid(frame, 9),
    transactionNumber: frame[15],
    responseType: frame[16],
    commandClass: frame[20],
    pid: (frame[21] << 8) | frame[22],
    data: frame.slice(24, dataEnd),
    checksumValid: expectedSum === actualSum,
  };
}

// Art-Net 4 Header Helper
function writeArtNetHeader(buf: Uint8Array, opCode: number, protVer = 14) {
  const sig = 'Art-Net\0';
  for (let i = 0; i < 8; i += 1) {
    buf[i] = sig.charCodeAt(i);
  }
  // OpCode little-endian
  buf[8] = opCode & 0xff;
  buf[9] = (opCode >> 8) & 0xff;
  // Protocol version big-endian (14)
  buf[10] = (protVer >> 8) & 0xff;
  buf[11] = protVer & 0xff;
}

export function hasArtNetHeader(buf: Uint8Array): number | null {
  if (buf.length < 12) return null;
  const expected = 'Art-Net\0';
  for (let i = 0; i < 8; i += 1) {
    if (buf[i] !== expected.charCodeAt(i)) return null;
  }
  return buf[8] | (buf[9] << 8);
}

export function buildArtPollPacket(): Uint8Array {
  const buf = new Uint8Array(14);
  writeArtNetHeader(buf, ARTNET_OP.POLL);
  buf[12] = 0x06; // TalkToMe: send ArtPollReply whenever node conditions change
  buf[13] = 0x00; // Priority: DpAll
  return buf;
}

export function buildArtTodControlFlushPacket(universe = 0): Uint8Array {
  const buf = new Uint8Array(24);
  writeArtNetHeader(buf, ARTNET_OP.TOD_CONTROL);
  buf[21] = (universe >> 8) & 0x7f; // Net
  buf[22] = 0x01; // AtcFlush: force node to re-run RDM discovery
  buf[23] = universe & 0xff; // Address (Sub-Uni)
  return buf;
}

export function buildArtTodRequestPacket(universe = 0): Uint8Array {
  const buf = new Uint8Array(25);
  writeArtNetHeader(buf, ARTNET_OP.TOD_REQUEST);
  buf[21] = (universe >> 8) & 0x7f; // Net
  buf[22] = 0x00; // Command: TodFull
  buf[23] = 1; // AddCount
  buf[24] = universe & 0xff; // Address[0]
  return buf;
}

export function buildArtRdmPacket(universe: number, rdmWithoutStartCode: Uint8Array): Uint8Array {
  const buf = new Uint8Array(24 + rdmWithoutStartCode.length);
  writeArtNetHeader(buf, ARTNET_OP.RDM);
  buf[12] = 0x01; // RdmVer: 1.0
  buf[21] = (universe >> 8) & 0x7f; // Net
  buf[22] = 0x00; // Command: ArProcess
  buf[23] = universe & 0xff; // Address (Sub-Uni)
  buf.set(rdmWithoutStartCode, 24);
  return buf;
}

export function parseArtPollReply(buf: Uint8Array, sourceIp: string): RdmNodeInfo | null {
  if (hasArtNetHeader(buf) !== ARTNET_OP.POLL_REPLY || buf.length < 200) return null;
  const decodeAscii = (start: number, len: number) => {
    let out = '';
    for (let i = start; i < start + len; i += 1) {
      if (buf[i] === 0) break;
      out += String.fromCharCode(buf[i]);
    }
    return out.trim();
  };
  const shortName = decodeAscii(26, 18) || 'Art-Net Node';
  const longName = decodeAscii(44, 64) || shortName;
  const status1 = buf[23];
  const rdmSupported = Boolean(status1 & 0x02);
  const netSwitch = buf[18] & 0x7f;
  const subSwitch = buf[19] & 0x0f;
  const universes: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const swOut = buf[190 + i] & 0x0f;
    const portType = buf[174 + i];
    if (portType & 0x80) {
      universes.push((netSwitch << 8) | (subSwitch << 4) | swOut);
    }
  }
  return {
    ip: sourceIp,
    shortName,
    longName,
    rdmSupported,
    universes: universes.length > 0 ? universes : [0],
  };
}

export function parseArtTodData(buf: Uint8Array): {
  universe: number;
  uidTotal: number;
  uids: string[];
} | null {
  if (hasArtNetHeader(buf) !== ARTNET_OP.TOD_DATA || buf.length < 28) return null;
  const net = buf[21] & 0x7f;
  const addr = buf[23] & 0xff;
  const uidTotal = (buf[24] << 8) | buf[25];
  const uidCount = buf[27];
  const uids: string[] = [];
  let offset = 28;
  for (let i = 0; i < uidCount && offset + 6 <= buf.length; i += 1) {
    uids.push(formatUid(buf, offset));
    offset += 6;
  }
  return {
    universe: (net << 8) | addr,
    uidTotal,
    uids,
  };
}

export function parseArtRdmResponse(buf: Uint8Array): ParsedRdmFrame | null {
  if (hasArtNetHeader(buf) !== ARTNET_OP.RDM || buf.length < 49) return null;
  return parseRdmFrame(buf.slice(24), false);
}

// ANSI E1.20 Table A-5 Product Category classification
export function mapRdmCategoryToFixture(category: number): {
  categoryName: string;
  type: FixtureType;
  group: FixtureGroup;
} {
  const coarse = category & 0xff00;
  if (category === 0x0102 || category === 0x0101) {
    return {categoryName: 'Cabeça Móvel / Scanner', type: 'moving_head', group: 'beam'};
  }
  if (category === 0x0104 || category === 0x0105 || category === 0x0106) {
    return {categoryName: 'Wash / LED Color', type: 'led_par', group: 'wash'};
  }
  if (category === 0x0107 || category === 0x0109) {
    return {categoryName: 'Barra Pixel / Linear', type: 'pixel_bar', group: 'wash'};
  }
  if (category === 0x0108) {
    return {categoryName: 'Strobe / Blinder', type: 'blinder', group: 'fx'};
  }
  if (coarse === 0x0400) {
    return {categoryName: 'Efeitos Atmosféricos / Fumo', type: 'fogger', group: 'fx'};
  }
  if (coarse === 0x0500) {
    return {categoryName: 'Dimmer / Blinder', type: 'blinder', group: 'fx'};
  }
  if (coarse === 0x0100) {
    return {categoryName: 'Luminária DMX / Wash', type: 'led_par', group: 'wash'};
  }
  return {categoryName: 'Equipamento DMX Genérico', type: 'led_par', group: 'wash'};
}

export interface RdmDeviceInfoPayload {
  modelId: number;
  productCategory: number;
  softwareVersion: string;
  dmxFootprint: number;
  currentPersonality: number;
  personalityCount: number;
  dmxStartAddress: number;
}

export function parseRdmDeviceInfo(data: Uint8Array): RdmDeviceInfoPayload | null {
  if (data.length < 19) return null;
  const modelId = (data[2] << 8) | data[3];
  const productCategory = (data[4] << 8) | data[5];
  const swVer =
    ((data[6] << 24) | (data[7] << 16) | (data[8] << 8) | data[9]) >>> 0;
  const dmxFootprint = Math.max(1, (data[10] << 8) | data[11]);
  const currentPersonality = data[12] || 1;
  const personalityCount = data[13] || 1;
  const rawAddr = (data[14] << 8) | data[15];
  const dmxStartAddress = rawAddr >= 1 && rawAddr <= 512 ? rawAddr : 1;

  return {
    modelId,
    productCategory,
    softwareVersion: `v${(swVer >>> 24) & 0xff}.${(swVer >>> 16) & 0xff}.${swVer & 0xffff}`,
    dmxFootprint,
    currentPersonality,
    personalityCount,
    dmxStartAddress,
  };
}

export function decodeRdmAsciiString(data: Uint8Array): string {
  let out = '';
  for (let i = 0; i < data.length; i += 1) {
    if (data[i] === 0) break;
    if (data[i] >= 32 && data[i] <= 126) {
      out += String.fromCharCode(data[i]);
    }
  }
  return out.trim();
}

export function convertRdmDevicesToFixtures(
  discovered: RdmDiscoveredDevice[],
  existingFixtures: Fixture[],
  options: {autoResolveConflicts?: boolean} = {},
): Fixture[] {
  const occupied = new Set<number>();
  existingFixtures.forEach((f) => {
    for (let ch = f.dmxStart; ch < f.dmxStart + f.channelCount && ch <= 512; ch += 1) {
      occupied.add(ch);
    }
  });

  const findNextFreeStart = (footprint: number): number => {
    for (let start = 1; start <= 512 - footprint + 1; start += 1) {
      let free = true;
      for (let off = 0; off < footprint; off += 1) {
        if (occupied.has(start + off)) {
          free = false;
          break;
        }
      }
      if (free) return start;
    }
    return 1;
  };

  const created: Fixture[] = [];
  discovered.forEach((dev, idx) => {
    const footprint = Math.max(1, Math.min(64, dev.dmxFootprint));
    let startAddr = dev.dmxStartAddress;

    if (options.autoResolveConflicts) {
      let hasOverlap = false;
      for (let off = 0; off < footprint; off += 1) {
        if (occupied.has(startAddr + off)) {
          hasOverlap = true;
          break;
        }
      }
      if (hasOverlap || startAddr < 1 || startAddr + footprint - 1 > 512) {
        startAddr = findNextFreeStart(footprint);
      }
    }

    for (let off = 0; off < footprint; off += 1) {
      if (startAddr + off <= 512) occupied.add(startAddr + off);
    }

    const totalIdx = existingFixtures.length + idx;
    const xPos = Number((0.14 + ((totalIdx * 0.16) % 0.74)).toFixed(2));
    const yPos =
      dev.suggestedType === 'pixel_bar' || dev.suggestedType === 'fogger' ? 0.8 : 0.14;

    created.push({
      id: `rdm-${dev.uid.replace(':', '')}-${Date.now()}-${idx}`,
      name: dev.deviceLabel || `${dev.modelDescription} (${dev.uid.slice(-4)})`,
      model: dev.modelDescription || `RDM Model 0x${dev.modelId.toString(16).toUpperCase()}`,
      manufacturer: dev.manufacturerLabel || undefined,
      type: dev.suggestedType,
      group: dev.suggestedGroup,
      dmxStart: startAddr,
      channelCount: footprint,
      xPos,
      yPos,
      panInvert: false,
      tiltInvert: false,
      rdmUid: dev.uid,
    });
  });

  return created;
}
