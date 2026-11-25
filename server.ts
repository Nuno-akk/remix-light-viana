import crypto from 'node:crypto';
import dgram from 'node:dgram';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import express from 'express';
import QRCode from 'qrcode';
import {WebSocket, WebSocketServer} from 'ws';
import {
  buildAndroidPackageZip,
  buildWindowsPackageZip,
} from './src/server/packageBuilder.ts';
import {
  computeDmxFrame,
  DEFAULT_BANKS,
  DEFAULT_FIXTURES,
  DEFAULT_GROUP_DIMMERS,
  DEFAULT_PRESETS,
} from './src/engine/dmxEngine.ts';
import {
  buildArtPollPacket,
  buildArtRdmPacket,
  buildArtTodControlFlushPacket,
  buildArtTodRequestPacket,
  buildRdmPacket,
  decodeRdmAsciiString,
  mapRdmCategoryToFixture,
  parseArtPollReply,
  parseArtRdmResponse,
  parseArtTodData,
  parseRdmDeviceInfo,
  RDM_COMMAND_CLASS,
  RDM_PID,
  type RdmDiscoveredDevice,
  type RdmDiscoveryResult,
  type RdmNodeInfo,
  type RdmProtocolLogEntry,
} from './src/engine/rdmDiscovery.ts';
import type {
  BeamFxState,
  ColorFxState,
  Fixture,
  FlashFxState,
  GroupDimmerState,
  MoveFxState,
  SceneBank,
  ShowPreset,
} from './src/types/dmx.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const HAS_BUILT_DIST = fs.existsSync(path.join(DIST_DIR, 'index.html'));
const IS_TSX_RUNNER =
  process.env.npm_lifecycle_event === 'dev' ||
  process.execArgv.some((arg) => arg.includes('tsx'));
const IS_PROD =
  process.env.NODE_ENV === 'production' ||
  (!IS_TSX_RUNNER && HAS_BUILT_DIST);
const USE_DEV_PROXY_PORT =
  !IS_PROD &&
  Boolean(process.env.NGINX_PORT && process.env.PORT === process.env.NGINX_PORT);

let PORT = Number(
  (USE_DEV_PROXY_PORT
    ? process.env.DEFAULT_APP_PORT || 3000
    : process.env.PORT || process.env.DEFAULT_APP_PORT) || 3000,
);

// Administrator Mode Auth (credentials verified strictly on server using scrypt + timingSafeEqual)
const DEFAULT_ADMIN_USER = 'Tuga';
const DEFAULT_ADMIN_SALT = 'lv-admin-v1-9c4e7b2a';
const DEFAULT_ADMIN_HASH =
  'd63220424d5eb17f7bfb1cf620d43849f3581a1d67da21db1b26c35e22e54938e881f6274adaa197dab37c22d7247d5ddf1cae20063a3175f3fe74bc81058bdb';
const ADMIN_SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const ENV_ADMIN_SALT = crypto.randomBytes(16).toString('hex');
const ENV_ADMIN_HASH = process.env.ADMIN_PASSWORD
  ? crypto.scryptSync(process.env.ADMIN_PASSWORD, ENV_ADMIN_SALT, 64)
  : null;

const adminLoginAttempts = new Map<string, {count: number; resetAt: number}>();
const MAX_ADMIN_ATTEMPTS = 8;
const ADMIN_RATE_WINDOW_MS = 10 * 60 * 1000;

const ADMIN_CREDENTIALS_FILE = path.join(
  __dirname,
  '.data',
  'admin-credentials.json',
);

interface StoredAdminCredentials {
  username: string;
  salt: string;
  hash: string;
  updatedAt: number;
}

function loadAdminCredentialOverride(): StoredAdminCredentials | null {
  try {
    if (!fs.existsSync(ADMIN_CREDENTIALS_FILE)) return null;
    const raw = fs.readFileSync(ADMIN_CREDENTIALS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoredAdminCredentials>;
    if (
      typeof parsed.username === 'string' &&
      parsed.username.trim().length >= 2 &&
      typeof parsed.salt === 'string' &&
      parsed.salt.length >= 16 &&
      typeof parsed.hash === 'string' &&
      /^[0-9a-f]{128}$/i.test(parsed.hash) &&
      typeof parsed.updatedAt === 'number'
    ) {
      return {
        username: parsed.username.trim(),
        salt: parsed.salt,
        hash: parsed.hash,
        updatedAt: parsed.updatedAt,
      };
    }
  } catch {
    // Ignore malformed override file and fall back to default/env credentials
  }
  return null;
}

function saveAdminCredentialOverride(record: StoredAdminCredentials): void {
  const dir = path.dirname(ADMIN_CREDENTIALS_FILE);
  fs.mkdirSync(dir, {recursive: true, mode: 0o700});
  const tmpPath = `${ADMIN_CREDENTIALS_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(record, null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
  fs.renameSync(tmpPath, ADMIN_CREDENTIALS_FILE);
}

let adminCredentialOverride = loadAdminCredentialOverride();
let adminMinTokenIat = adminCredentialOverride?.updatedAt ?? 0;

function timingSafeTextEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyAdminCredentials(username: string, password: string): boolean {
  if (adminCredentialOverride) {
    if (!timingSafeTextEqual(username.trim(), adminCredentialOverride.username)) {
      return false;
    }
    const candidate = crypto.scryptSync(
      password,
      adminCredentialOverride.salt,
      64,
    );
    const expected = Buffer.from(adminCredentialOverride.hash, 'hex');
    return (
      candidate.length === expected.length &&
      crypto.timingSafeEqual(candidate, expected)
    );
  }

  const expectedUser = process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USER;
  if (!timingSafeTextEqual(username.trim(), expectedUser)) {
    return false;
  }
  if (ENV_ADMIN_HASH) {
    const candidate = crypto.scryptSync(password, ENV_ADMIN_SALT, 64);
    return crypto.timingSafeEqual(candidate, ENV_ADMIN_HASH);
  }
  const candidate = crypto.scryptSync(password, DEFAULT_ADMIN_SALT, 64);
  const expected = Buffer.from(DEFAULT_ADMIN_HASH, 'hex');
  return (
    candidate.length === expected.length &&
    crypto.timingSafeEqual(candidate, expected)
  );
}

function createAdminSessionToken(
  username: string,
  issuedAt = Date.now(),
): string {
  const iat = Math.max(issuedAt, adminMinTokenIat);
  const payload = Buffer.from(
    JSON.stringify({sub: username, iat, exp: iat + ADMIN_TOKEN_TTL_MS}),
    'utf8',
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifyAdminSessionToken(token: string): {sub: string} | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const payload = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!payload || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as {sub?: string; iat?: number; exp?: number};
    if (
      !parsed.sub ||
      typeof parsed.iat !== 'number' ||
      parsed.iat < adminMinTokenIat ||
      typeof parsed.exp !== 'number' ||
      parsed.exp < Date.now()
    ) {
      return null;
    }
    return {sub: parsed.sub};
  } catch {
    return null;
  }
}

function requireAdminAuth(
  req: express.Request,
  res: express.Response,
): {sub: string} | null {
  const authHeader = String(req.headers.authorization || '');
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) {
    res.status(401).json({error: 'Administrator authentication required.'});
    return null;
  }
  const session = verifyAdminSessionToken(match[1].trim());
  if (!session) {
    res.status(401).json({error: 'Invalid or expired administrator session.'});
    return null;
  }
  return session;
}

export interface SyncedShowState {
  moveFx: MoveFxState;
  colorFx: ColorFxState;
  flashFx: FlashFxState;
  beamFx: BeamFxState;
  bpm: number;
  masterDimmer: number;
  groupDimmers: GroupDimmerState;
  fixtureDimmers: Record<string, number>;
  fixtureMutes: Record<string, boolean>;
  fixtureColors: Record<string, string>;
  rawDmxOverrides: Record<number, number>;
  fixtures: Fixture[];
  presets: ShowPreset[];
  activePresetId: string | null;
  banks: SceneBank[];
  activeBankId: string | null;
  activeSceneId: string | null;
}

export interface ConnectedDeviceInfo {
  id: string;
  name: string;
  role: 'windows' | 'android' | 'web';
  connectedAt: number;
}

interface RoomRecord {
  id: string;
  state: SyncedShowState;
  clients: Map<WebSocket, ConnectedDeviceInfo>;
}

function createInitialShowState(): SyncedShowState {
  const initialPreset = DEFAULT_PRESETS[0];
  return {
    moveFx: structuredClone(initialPreset.moveFx),
    colorFx: structuredClone(initialPreset.colorFx),
    beamFx: structuredClone(initialPreset.beamFx),
    flashFx: {
      blinder: false,
      strobe: false,
      strobeRate: 14,
      smoke: false,
      freeze: false,
      blackout: false,
    },
    bpm: initialPreset.bpm,
    masterDimmer: initialPreset.masterDimmer,
    groupDimmers: structuredClone(DEFAULT_GROUP_DIMMERS),
    fixtureDimmers: {},
    fixtureMutes: {},
    fixtureColors: {},
    rawDmxOverrides: {},
    fixtures: structuredClone(DEFAULT_FIXTURES),
    presets: structuredClone(DEFAULT_PRESETS),
    activePresetId: initialPreset.id,
    banks: structuredClone(DEFAULT_BANKS),
    activeBankId: DEFAULT_BANKS[0]?.id ?? null,
    activeSceneId: null,
  };
}

const rooms = new Map<string, RoomRecord>();

function getOrCreateRoom(roomId: string): RoomRecord {
  const cleanId = (roomId || 'MAIN-SHOW').trim().toUpperCase().slice(0, 24) || 'MAIN-SHOW';
  let room = rooms.get(cleanId);
  if (!room) {
    room = {
      id: cleanId,
      state: createInitialShowState(),
      clients: new Map(),
    };
    rooms.set(cleanId, room);
  }
  return room;
}

function getLanAddresses(): Array<{name: string; address: string}> {
  const ifaces = os.networkInterfaces();
  const list: Array<{name: string; address: string}> = [];
  for (const [name, entries] of Object.entries(ifaces)) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.family === 'IPv4' && !entry.internal) {
        list.push({name, address: entry.address});
      }
    }
  }
  // Prefer typical Wi-Fi / LAN subnets (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  list.sort((a, b) => {
    const score = (ip: string) =>
      ip.startsWith('192.168.') ? 3 : ip.startsWith('10.') ? 2 : 1;
    return score(b.address) - score(a.address);
  });
  return list;
}

// Art-Net UDP Transmitter (Port 6454) for Windows -> Physical DMX Nodes
interface ArtNetConfig {
  enabled: boolean;
  targetIp: string;
  universe: number;
  roomId: string;
  packetsSent: number;
  lastError: string | null;
}

const artNetConfig: ArtNetConfig = {
  enabled: false,
  targetIp: '255.255.255.255',
  universe: 0,
  roomId: 'MAIN-SHOW',
  packetsSent: 0,
  lastError: null,
};

let artNetSocket: dgram.Socket | null = null;
let artNetSequence = 1;
const serverStartTime = Date.now();

function ensureArtNetSocket(): dgram.Socket {
  if (!artNetSocket) {
    artNetSocket = dgram.createSocket('udp4');
    artNetSocket.on('error', (err) => {
      artNetConfig.lastError = err.message;
    });
    artNetSocket.bind(() => {
      try {
        artNetSocket?.setBroadcast(true);
      } catch {
        // Ignore broadcast flag errors on restricted sandboxes
      }
    });
  }
  return artNetSocket;
}

function buildArtDmxPacket(universe: number, dmx512: Uint8Array, sequence: number): Buffer {
  // Art-Net 4 ArtDmx packet: 18-byte header + 512 bytes DMX data = 530 bytes
  const packet = Buffer.alloc(18 + 512);
  packet.write('Art-Net\0', 0, 'ascii'); // ID (8 bytes)
  packet.writeUInt16LE(0x5000, 8); // OpDmx (0x5000 little-endian)
  packet.writeUInt16BE(14, 10); // Protocol version 14 (big-endian)
  packet[12] = sequence & 0xff; // Sequence (1..255)
  packet[13] = 0; // Physical port
  packet.writeUInt16LE(universe & 0x7fff, 14); // SubUni + Net
  packet.writeUInt16BE(512, 16); // Data length (512)
  Buffer.from(dmx512).copy(packet, 18, 0, 512);
  return packet;
}

let artNetTimer: ReturnType<typeof setInterval> | null = null;

function syncArtNetLoop() {
  if (artNetConfig.enabled && !artNetTimer) {
    artNetTimer = setInterval(() => {
      if (!artNetConfig.enabled) return;
      const room = rooms.get(artNetConfig.roomId);
      if (!room) return;
      const s = room.state;
      if (s.flashFx.freeze) return;

      const elapsedSec = (Date.now() - serverStartTime) / 1000;
      const {universe} = computeDmxFrame({
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
        fixtureColors: s.fixtureColors,
        rawDmxOverrides: s.rawDmxOverrides,
        timeSec: elapsedSec,
        audioEnergy: 0,
        audioPulseActive: false,
      });

      const sock = ensureArtNetSocket();
      const pkt = buildArtDmxPacket(artNetConfig.universe, universe, artNetSequence);
      artNetSequence = artNetSequence >= 255 ? 1 : artNetSequence + 1;

      sock.send(pkt, 0, pkt.length, 6454, artNetConfig.targetIp, (err) => {
        if (err) {
          artNetConfig.lastError = err.message;
        } else {
          artNetConfig.lastError = null;
          artNetConfig.packetsSent += 1;
        }
      });
    }, 25);
  } else if (!artNetConfig.enabled && artNetTimer) {
    clearInterval(artNetTimer);
    artNetTimer = null;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({limit: '2mb'}));

  app.get('/api/health', (_req, res) => {
    res.json({status: 'ok', platform: os.platform(), port: PORT});
  });

  app.get('/api/network-info', async (req, res) => {
    const roomId = String(req.query.room || 'MAIN-SHOW').toUpperCase();
    const lanIps = getLanAddresses();
    const primaryLan = lanIps[0]?.address || null;
    const reqHost = req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';

    const tabletUrl = primaryLan
      ? `http://${primaryLan}:${PORT}/?room=${encodeURIComponent(roomId)}&mode=tablet`
      : `${protocol}://${reqHost}/?room=${encodeURIComponent(roomId)}&mode=tablet`;

    let qrSvg = '';
    try {
      qrSvg = await QRCode.toString(tabletUrl, {
        type: 'svg',
        margin: 1,
        width: 220,
        color: {dark: '#F8FAFC', light: '#090C12'},
      });
    } catch {
      qrSvg = '';
    }

    res.json({
      hostname: os.hostname(),
      platform: os.platform(),
      port: PORT,
      lanIps,
      tabletUrl,
      qrSvg,
    });
  });

  app.get('/api/artnet/config', (_req, res) => {
    res.json(artNetConfig);
  });

  app.post('/api/artnet/config', (req, res) => {
    const body = req.body as Partial<ArtNetConfig>;
    if (typeof body.enabled === 'boolean') artNetConfig.enabled = body.enabled;
    if (typeof body.targetIp === 'string' && body.targetIp.trim()) {
      artNetConfig.targetIp = body.targetIp.trim();
    }
    if (typeof body.universe === 'number') {
      artNetConfig.universe = Math.max(0, Math.min(15, Math.floor(body.universe)));
    }
    if (typeof body.roomId === 'string' && body.roomId.trim()) {
      artNetConfig.roomId = body.roomId.trim().toUpperCase();
    }
    if (artNetConfig.enabled) {
      ensureArtNetSocket();
    }
    syncArtNetLoop();
    res.json(artNetConfig);
  });

  // Art-Net 4 / ANSI E1.20 RDM Autodiscovery Endpoint
  app.post('/api/rdm/discover', async (req, res) => {
    const body = (req.body || {}) as {
      targetIp?: string;
      universe?: number;
      flushTod?: boolean;
      timeoutMs?: number;
    };
    const targetIp =
      typeof body.targetIp === 'string' && body.targetIp.trim()
        ? body.targetIp.trim()
        : artNetConfig.targetIp || '255.255.255.255';
    const universe = Math.max(
      0,
      Math.min(15, Math.floor(Number(body.universe ?? artNetConfig.universe ?? 0))),
    );
    const flushTod = Boolean(body.flushTod);
    const timeoutMs = Math.max(400, Math.min(4000, Number(body.timeoutMs ?? 1100)));

    const startedAt = Date.now();
    const protocolLog: RdmProtocolLogEntry[] = [];
    const pushLog = (
      direction: RdmProtocolLogEntry['direction'],
      protocol: RdmProtocolLogEntry['protocol'],
      summary: string,
    ) => {
      protocolLog.push({
        id: `log-${protocolLog.length}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pt-PT', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        direction,
        protocol,
        summary,
      });
    };

    const nodesByIp = new Map<string, RdmNodeInfo>();
    const uidOrigin = new Map<string, {nodeIp: string; universe: number}>();
    const deviceMeta = new Map<
      string,
      {
        info?: ReturnType<typeof parseRdmDeviceInfo>;
        manufacturerLabel?: string;
        modelDescription?: string;
        deviceLabel?: string;
      }
    >();

    const sock = dgram.createSocket({type: 'udp4', reuseAddr: true});
    let txCounter = 1;
    const nextTx = () => {
      txCounter = (txCounter % 254) + 1;
      return txCounter;
    };

    const sendUdp = (payload: Uint8Array, ip: string) =>
      new Promise<void>((resolve) => {
        sock.send(Buffer.from(payload), 0, payload.length, 6454, ip, () => resolve());
      });

    try {
      await new Promise<void>((resolve) => {
        const onError = () => {
          // Fallback to ephemeral port if 6454 is already bound
          try {
            sock.bind(0, () => {
              try {
                sock.setBroadcast(true);
              } catch {
                // ignore
              }
              resolve();
            });
          } catch {
            resolve();
          }
        };
        sock.once('error', onError);
        sock.bind(6454, () => {
          sock.removeListener('error', onError);
          try {
            sock.setBroadcast(true);
          } catch {
            // ignore
          }
          resolve();
        });
      });

      const queryUidDetails = async (uid: string, nodeIp: string, uni: number) => {
        const pids = [
          RDM_PID.DEVICE_INFO,
          RDM_PID.MANUFACTURER_LABEL,
          RDM_PID.DEVICE_MODEL_DESCRIPTION,
          RDM_PID.DEVICE_LABEL,
        ];
        for (const pid of pids) {
          const rdmPayload = buildRdmPacket({
            destUid: uid,
            transactionNumber: nextTx(),
            commandClass: RDM_COMMAND_CLASS.GET_COMMAND,
            pid,
            includeStartCode: false,
          });
          const artRdm = buildArtRdmPacket(uni, rdmPayload);
          await sendUdp(artRdm, nodeIp);
        }
        pushLog(
          'TX',
          'RDM',
          `GET:DEVICE_INFO + LABELS para UID ${uid} via ${nodeIp} (Uni ${uni})`,
        );
      };

      sock.on('message', (msg, rinfo) => {
        const bytes = new Uint8Array(msg);

        const pollReply = parseArtPollReply(bytes, rinfo.address);
        if (pollReply) {
          nodesByIp.set(rinfo.address, pollReply);
          pushLog(
            'RX',
            'ArtPoll',
            `ArtPollReply de ${rinfo.address} (${pollReply.shortName} · RDM=${
              pollReply.rdmSupported ? 'Sim' : 'Não'
            })`,
          );
          return;
        }

        const todData = parseArtTodData(bytes);
        if (todData) {
          pushLog(
            'RX',
            'ArtTod',
            `OpTodData de ${rinfo.address} · Uni ${todData.universe} · ${todData.uids.length} UID(s)`,
          );
          for (const uid of todData.uids) {
            if (!uidOrigin.has(uid)) {
              uidOrigin.set(uid, {nodeIp: rinfo.address, universe: todData.universe});
              void queryUidDetails(uid, rinfo.address, todData.universe);
            }
          }
          return;
        }

        const rdmResp = parseArtRdmResponse(bytes);
        if (rdmResp && rdmResp.checksumValid) {
          const entry = deviceMeta.get(rdmResp.sourceUid) || {};
          if (rdmResp.pid === RDM_PID.DEVICE_INFO) {
            entry.info = parseRdmDeviceInfo(rdmResp.data);
            pushLog(
              'RX',
              'RDM',
              `DEVICE_INFO ${rdmResp.sourceUid}: ${entry.info?.dmxFootprint ?? '?'}ch @ CH ${
                entry.info?.dmxStartAddress ?? '?'
              }`,
            );
          } else if (rdmResp.pid === RDM_PID.MANUFACTURER_LABEL) {
            entry.manufacturerLabel = decodeRdmAsciiString(rdmResp.data);
          } else if (rdmResp.pid === RDM_PID.DEVICE_MODEL_DESCRIPTION) {
            entry.modelDescription = decodeRdmAsciiString(rdmResp.data);
          } else if (rdmResp.pid === RDM_PID.DEVICE_LABEL) {
            entry.deviceLabel = decodeRdmAsciiString(rdmResp.data);
          }
          deviceMeta.set(rdmResp.sourceUid, entry);
        }
      });

      await sendUdp(buildArtPollPacket(), targetIp);
      pushLog('TX', 'ArtPoll', `OpPoll enviado para ${targetIp}:6454`);

      if (flushTod) {
        await sendUdp(buildArtTodControlFlushPacket(universe), targetIp);
        pushLog('TX', 'ArtTod', `OpTodControl (AtcFlush) enviado para Universo ${universe}`);
        await new Promise((r) => setTimeout(r, 150));
      }

      await sendUdp(buildArtTodRequestPacket(universe), targetIp);
      pushLog('TX', 'ArtTod', `OpTodRequest (TodFull) enviado para Universo ${universe}`);

      await new Promise((r) => setTimeout(r, timeoutMs));

      if (uidOrigin.size === 0) {
        pushLog(
          'INFO',
          'ArtTod',
          `Sem respostas RDM em ${targetIp}:6454 (${timeoutMs} ms). Verifica se o nó Art-Net/RDM está ligado na mesma rede.`,
        );
      }
    } catch (err) {
      pushLog(
        'INFO',
        'RDM',
        err instanceof Error ? err.message : 'Erro na sondagem UDP Art-RDM.',
      );
    } finally {
      try {
        sock.close();
      } catch {
        // ignore
      }
    }

    const devices: RdmDiscoveredDevice[] = Array.from(uidOrigin.entries()).map(
      ([uid, origin]) => {
        const meta = deviceMeta.get(uid);
        const info = meta?.info;
        const mfgId = parseInt(uid.slice(0, 4), 16) || 0;
        const cat = mapRdmCategoryToFixture(info?.productCategory ?? 0x0104);
        return {
          uid,
          manufacturerId: mfgId,
          manufacturerLabel: meta?.manufacturerLabel || `Mfg 0x${uid.slice(0, 4)}`,
          modelId: info?.modelId ?? 0,
          modelDescription: meta?.modelDescription || 'RDM Responder',
          deviceLabel: meta?.deviceLabel || '',
          productCategory: info?.productCategory ?? 0x0104,
          productCategoryName: cat.categoryName,
          dmxFootprint: info?.dmxFootprint ?? 7,
          dmxStartAddress: info?.dmxStartAddress ?? 1,
          currentPersonality: info?.currentPersonality ?? 1,
          personalityCount: info?.personalityCount ?? 1,
          softwareVersion: info?.softwareVersion ?? 'v1.0',
          suggestedType: cat.type,
          suggestedGroup: cat.group,
          identifying: false,
          sourceNodeIp: origin.nodeIp,
          sourceUniverse: origin.universe,
        };
      },
    );

    const response: RdmDiscoveryResult = {
      transport: 'artnet-rdm',
      targetIp,
      universe,
      elapsedMs: Date.now() - startedAt,
      nodesFound: Array.from(nodesByIp.values()),
      devices,
      protocolLog,
    };

    res.json(response);
  });

  app.post('/api/rdm/identify', async (req, res) => {
    const body = (req.body || {}) as {
      targetIp?: string;
      universe?: number;
      uid?: string;
      active?: boolean;
    };
    if (!body.uid) {
      res.status(400).json({error: 'UID RDM obrigatório.'});
      return;
    }
    const targetIp =
      typeof body.targetIp === 'string' && body.targetIp.trim()
        ? body.targetIp.trim()
        : artNetConfig.targetIp || '255.255.255.255';
    const universe = Math.max(0, Math.min(15, Math.floor(Number(body.universe ?? 0))));
    const sock = ensureArtNetSocket();
    const pkt = buildArtRdmPacket(
      universe,
      buildRdmPacket({
        destUid: body.uid,
        transactionNumber: 1,
        commandClass: RDM_COMMAND_CLASS.SET_COMMAND,
        pid: RDM_PID.IDENTIFY_DEVICE,
        data: new Uint8Array([body.active ? 1 : 0]),
        includeStartCode: false,
      }),
    );
    sock.send(Buffer.from(pkt), 0, pkt.length, 6454, targetIp, (err) => {
      if (err) {
        res.status(502).json({error: err.message});
      } else {
        res.json({ok: true, uid: body.uid, active: Boolean(body.active)});
      }
    });
  });

  app.post('/api/rdm/set-address', async (req, res) => {
    const body = (req.body || {}) as {
      targetIp?: string;
      universe?: number;
      uid?: string;
      startAddress?: number;
    };
    const startAddress = Math.max(1, Math.min(512, Math.floor(Number(body.startAddress ?? 1))));
    if (!body.uid) {
      res.status(400).json({error: 'UID RDM obrigatório.'});
      return;
    }
    const targetIp =
      typeof body.targetIp === 'string' && body.targetIp.trim()
        ? body.targetIp.trim()
        : artNetConfig.targetIp || '255.255.255.255';
    const universe = Math.max(0, Math.min(15, Math.floor(Number(body.universe ?? 0))));
    const sock = ensureArtNetSocket();
    const pkt = buildArtRdmPacket(
      universe,
      buildRdmPacket({
        destUid: body.uid,
        transactionNumber: 2,
        commandClass: RDM_COMMAND_CLASS.SET_COMMAND,
        pid: RDM_PID.DMX_START_ADDRESS,
        data: new Uint8Array([(startAddress >> 8) & 0xff, startAddress & 0xff]),
        includeStartCode: false,
      }),
    );
    sock.send(Buffer.from(pkt), 0, pkt.length, 6454, targetIp, (err) => {
      if (err) {
        res.status(502).json({error: err.message});
      } else {
        res.json({ok: true, uid: body.uid, startAddress});
      }
    });
  });

  app.get('/api/windows-launcher', (_req, res) => {
    const batPath = path.join(__dirname, 'Start-LightViana-Windows.bat');
    if (fs.existsSync(batPath)) {
      res.download(batPath, 'Start-LightViana-Windows.bat');
    } else {
      res.status(404).json({error: 'Launcher file not found'});
    }
  });

  // Administrator Mode: Authentication + Windows / Android full package downloads
  app.post('/api/admin/login', (req, res) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = adminLoginAttempts.get(clientIp);
    if (record && record.resetAt > now && record.count >= MAX_ADMIN_ATTEMPTS) {
      res
        .status(429)
        .json({error: 'Too many login attempts. Try again in a few minutes.'});
      return;
    }

    const body = (req.body || {}) as {username?: unknown; password?: unknown};
    const username = typeof body.username === 'string' ? body.username : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!verifyAdminCredentials(username, password)) {
      const nextRecord =
        record && record.resetAt > now
          ? {count: record.count + 1, resetAt: record.resetAt}
          : {count: 1, resetAt: now + ADMIN_RATE_WINDOW_MS};
      adminLoginAttempts.set(clientIp, nextRecord);
      res.status(401).json({error: 'Invalid administrator credentials.'});
      return;
    }

    adminLoginAttempts.delete(clientIp);
    const cleanUser = username.trim();
    const token = createAdminSessionToken(cleanUser);
    res.json({
      token,
      username: cleanUser,
      expiresAt: now + ADMIN_TOKEN_TTL_MS,
    });
  });

  app.get('/api/admin/status', (req, res) => {
    const session = requireAdminAuth(req, res);
    if (!session) return;
    res.json({authenticated: true, username: session.sub});
  });

  app.post('/api/admin/credentials', (req, res) => {
    const session = requireAdminAuth(req, res);
    if (!session) return;

    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = adminLoginAttempts.get(clientIp);
    if (record && record.resetAt > now && record.count >= MAX_ADMIN_ATTEMPTS) {
      res
        .status(429)
        .json({error: 'Too many attempts. Try again in a few minutes.'});
      return;
    }

    const body = (req.body || {}) as {
      currentPassword?: unknown;
      newUsername?: unknown;
      newPassword?: unknown;
    };
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newUsername =
      typeof body.newUsername === 'string' ? body.newUsername.trim() : '';
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';

    if (
      newUsername.length < 2 ||
      newUsername.length > 32 ||
      /[\r\n\t\0]/.test(newUsername)
    ) {
      res.status(400).json({
        code: 'INVALID_USERNAME',
        error: 'Username must be between 2 and 32 characters.',
      });
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      res.status(400).json({
        code: 'INVALID_PASSWORD',
        error: 'New password must be between 6 and 128 characters.',
      });
      return;
    }

    if (!verifyAdminCredentials(session.sub, currentPassword)) {
      const nextRecord =
        record && record.resetAt > now
          ? {count: record.count + 1, resetAt: record.resetAt}
          : {count: 1, resetAt: now + ADMIN_RATE_WINDOW_MS};
      adminLoginAttempts.set(clientIp, nextRecord);
      res.status(401).json({
        code: 'INVALID_CURRENT_PASSWORD',
        error: 'Current password is incorrect.',
      });
      return;
    }

    adminLoginAttempts.delete(clientIp);
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(newPassword, salt, 64).toString('hex');
    const rotatedAt = Math.max(Date.now(), adminMinTokenIat + 1);
    const updatedRecord: StoredAdminCredentials = {
      username: newUsername,
      salt,
      hash,
      updatedAt: rotatedAt,
    };

    try {
      saveAdminCredentialOverride(updatedRecord);
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Failed to persist administrator credentials.',
      });
      return;
    }

    adminCredentialOverride = updatedRecord;
    adminMinTokenIat = rotatedAt;
    const token = createAdminSessionToken(newUsername, rotatedAt);
    res.json({
      token,
      username: newUsername,
      expiresAt: rotatedAt + ADMIN_TOKEN_TTL_MS,
    });
  });

  app.get('/api/admin/download/windows', (req, res) => {
    if (!requireAdminAuth(req, res)) return;
    try {
      const zipBuf = buildWindowsPackageZip(__dirname);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="LightViana-DMX-Windows.zip"',
      );
      res.setHeader('Cache-Control', 'no-store');
      res.send(zipBuf);
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Failed to build Windows package.',
      });
    }
  });

  app.get('/api/admin/download/android', (req, res) => {
    if (!requireAdminAuth(req, res)) return;
    try {
      const zipBuf = buildAndroidPackageZip(__dirname);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="LightViana-DMX-Android.zip"',
      );
      res.setHeader('Cache-Control', 'no-store');
      res.send(zipBuf);
    } catch (err) {
      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : 'Failed to build Android package.',
      });
    }
  });

  // Online Open Fixture Library (OFL) index cache + live search
  interface OflIndexEntry {
    path: string;
    manufacturerKey: string;
    manufacturerName: string;
    fixtureSlug: string;
    displayName: string;
  }

  let oflCache: {
    fetchedAt: number;
    manufacturers: Array<{key: string; name: string}>;
    entries: OflIndexEntry[];
  } | null = null;

  async function ensureOflIndex() {
    const ONE_HOUR = 60 * 60 * 1000;
    if (oflCache && Date.now() - oflCache.fetchedAt < ONE_HOUR) {
      return oflCache;
    }
    const headers = {'User-Agent': 'LightViana-DMX-Console'};
    const [mfgRes, treeRes] = await Promise.all([
      fetch(
        'https://raw.githubusercontent.com/OpenLightingProject/open-fixture-library/master/fixtures/manufacturers.json',
        {headers},
      ),
      fetch(
        'https://api.github.com/repos/OpenLightingProject/open-fixture-library/git/trees/master?recursive=1',
        {headers},
      ),
    ]);

    if (!mfgRes.ok || !treeRes.ok) {
      throw new Error('Could not reach Open Fixture Library repository.');
    }

    const mfgJson = (await mfgRes.json()) as Record<string, {name?: string}>;
    const treeJson = (await treeRes.json()) as {
      tree?: Array<{path?: string; type?: string}>;
    };

    const entries: OflIndexEntry[] = [];
    for (const item of treeJson.tree || []) {
      if (item.type !== 'blob' || !item.path) continue;
      const match = /^fixtures\/([^/]+)\/([^/]+)\.json$/.exec(item.path);
      if (!match) continue;
      const [, mfgKey, slug] = match;
      const mfgName = mfgJson[mfgKey]?.name || mfgKey;
      const displayName = slug
        .split('-')
        .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ');
      entries.push({
        path: item.path,
        manufacturerKey: mfgKey,
        manufacturerName: mfgName,
        fixtureSlug: slug,
        displayName,
      });
    }

    const manufacturers = Object.entries(mfgJson)
      .filter(([k]) => k !== '$schema')
      .map(([key, v]) => ({key, name: v?.name || key}))
      .sort((a, b) => a.name.localeCompare(b.name));

    oflCache = {
      fetchedAt: Date.now(),
      manufacturers,
      entries,
    };
    return oflCache;
  }

  app.get('/api/fixtures/online/search', async (req, res) => {
    try {
      const q = String(req.query.q || '').trim().toLowerCase();
      const mfgFilter = String(req.query.manufacturer || '').trim().toLowerCase();
      const index = await ensureOflIndex();

      const filtered = index.entries.filter((entry) => {
        if (mfgFilter && entry.manufacturerKey !== mfgFilter) return false;
        if (!q) return true;
        return (
          entry.displayName.toLowerCase().includes(q) ||
          entry.manufacturerName.toLowerCase().includes(q) ||
          entry.fixtureSlug.toLowerCase().includes(q)
        );
      });

      res.json({
        totalCount: index.entries.length,
        matchCount: filtered.length,
        manufacturers: index.manufacturers,
        results: filtered.slice(0, 40),
      });
    } catch (err) {
      res.status(502).json({
        error:
          err instanceof Error
            ? err.message
            : 'Online fixture search is currently unavailable.',
      });
    }
  });

  app.get('/api/fixtures/online/profile', async (req, res) => {
    try {
      const fixturePath = String(req.query.path || '').trim();
      if (!/^fixtures\/[a-z0-9-]+\/[a-z0-9-]+\.json$/.test(fixturePath)) {
        res.status(400).json({error: 'Invalid fixture path.'});
        return;
      }

      const rawUrl = `https://raw.githubusercontent.com/OpenLightingProject/open-fixture-library/master/${fixturePath}`;
      const resp = await fetch(rawUrl, {
        headers: {'User-Agent': 'LightViana-DMX-Console'},
      });
      if (!resp.ok) {
        res.status(resp.status).json({error: 'Failed to fetch fixture profile.'});
        return;
      }
      const json = (await resp.json()) as Record<string, unknown>;
      const mfgKey = fixturePath.split('/')[1] || '';
      const index = oflCache;
      const mfgName =
        index?.manufacturers.find((m) => m.key === mfgKey)?.name || mfgKey;

      res.json({
        manufacturerName: mfgName,
        profile: json,
      });
    } catch (err) {
      res.status(502).json({
        error:
          err instanceof Error ? err.message : 'Failed to load fixture profile.',
      });
    }
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({noServer: true});

  server.on('upgrade', (req, socket, head) => {
    const pathname = (req.url || '').split('?')[0];
    if (pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
  });

  function broadcastToRoom(
    room: RoomRecord,
    payload: unknown,
    excludeWs?: WebSocket,
  ) {
    const raw = JSON.stringify(payload);
    for (const [clientWs] of room.clients) {
      if (clientWs !== excludeWs && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(raw);
      }
    }
  }

  function broadcastPresence(room: RoomRecord) {
    const devices = Array.from(room.clients.values());
    broadcastToRoom(room, {type: 'presence:update', devices});
  }

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/ws', `http://localhost:${PORT}`);
    const roomId = url.searchParams.get('room') || 'MAIN-SHOW';
    const roleParam = url.searchParams.get('role');
    const role: 'windows' | 'android' | 'web' =
      roleParam === 'windows' || roleParam === 'android' ? roleParam : 'web';
    const deviceName =
      url.searchParams.get('name') ||
      (role === 'android'
        ? 'Android Tablet'
        : role === 'windows'
          ? 'Windows Host'
          : 'Web Console');

    const room = getOrCreateRoom(roomId);
    const clientInfo: ConnectedDeviceInfo = {
      id: `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: deviceName.slice(0, 32),
      role,
      connectedAt: Date.now(),
    };
    room.clients.set(ws, clientInfo);

    // Initial full authoritative state sync
    ws.send(
      JSON.stringify({
        type: 'state:init',
        roomId: room.id,
        selfId: clientInfo.id,
        state: room.state,
        devices: Array.from(room.clients.values()),
      }),
    );
    broadcastPresence(room);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as {
          type?: string;
          patch?: Partial<SyncedShowState>;
          deviceName?: string;
          role?: 'windows' | 'android' | 'web';
        };

        if (msg.type === 'state:patch' && msg.patch && typeof msg.patch === 'object') {
          const p = msg.patch;
          if (p.moveFx) room.state.moveFx = p.moveFx;
          if (p.colorFx) room.state.colorFx = p.colorFx;
          if (p.flashFx) room.state.flashFx = p.flashFx;
          if (p.beamFx) room.state.beamFx = p.beamFx;
          if (typeof p.bpm === 'number') {
            room.state.bpm = Math.max(60, Math.min(200, p.bpm));
          }
          if (typeof p.masterDimmer === 'number') {
            room.state.masterDimmer = Math.max(0, Math.min(100, p.masterDimmer));
          }
          if (p.groupDimmers) room.state.groupDimmers = p.groupDimmers;
          if (p.fixtureDimmers) room.state.fixtureDimmers = p.fixtureDimmers;
          if (p.fixtureMutes) room.state.fixtureMutes = p.fixtureMutes;
          if (p.fixtureColors) room.state.fixtureColors = p.fixtureColors;
          if (p.rawDmxOverrides) room.state.rawDmxOverrides = p.rawDmxOverrides;
          if (Array.isArray(p.fixtures)) room.state.fixtures = p.fixtures;
          if (Array.isArray(p.presets)) room.state.presets = p.presets;
          if (p.activePresetId !== undefined) room.state.activePresetId = p.activePresetId;
          if (Array.isArray(p.banks)) room.state.banks = p.banks;
          if (p.activeBankId !== undefined) room.state.activeBankId = p.activeBankId;
          if (p.activeSceneId !== undefined) room.state.activeSceneId = p.activeSceneId;

          broadcastToRoom(
            room,
            {
              type: 'state:patch',
              senderId: clientInfo.id,
              patch: p,
            },
            ws,
          );
        } else if (msg.type === 'device:rename' && msg.deviceName) {
          clientInfo.name = msg.deviceName.slice(0, 32);
          if (msg.role) clientInfo.role = msg.role;
          broadcastPresence(room);
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      room.clients.delete(ws);
      broadcastPresence(room);
    });
  });

  if (!IS_PROD) {
    const vitePromise = import('vite').then(({createServer: createViteServer}) =>
      createViteServer({
        server: {
          middlewareMode: true,
          hmr: false,
          ws: {
            server,
            path: '/__vite_ws',
          },
          allowedHosts: true,
        },
        appType: 'spa',
      }),
    );

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    app.use(
      express.static(DIST_DIR, {
        setHeaders(res, filePath) {
          if (
            filePath.endsWith('index.html') ||
            filePath.endsWith('sw.js') ||
            filePath.endsWith('manifest.webmanifest')
          ) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
        },
      }),
    );
    app.all('/api/*', (_req, res) => {
      res.status(404).json({error: 'Not found'});
    });
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  let triedFallback = false;
  server.on('error', (err: NodeJS.ErrnoException) => {
    const fallbackPort = Number(process.env.DEFAULT_APP_PORT || 3000);
    if (err.code === 'EADDRINUSE' && !triedFallback && PORT !== fallbackPort) {
      triedFallback = true;
      PORT = fallbackPort;
      server.listen(PORT, '0.0.0.0');
      return;
    }
    throw err;
  });

  const shutdown = () => {
    if (artNetTimer) {
      clearInterval(artNetTimer);
      artNetTimer = null;
    }
    try {
      artNetSocket?.close();
    } catch {
      // ignore
    }
    wss.close();
    server.close(() => {
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 2000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);

  server.listen(PORT, '0.0.0.0', () => {
    const ips = getLanAddresses();
    console.log(`LightViana DMX server listening on http://localhost:${PORT}`);
    if (ips.length > 0) {
      console.log(`Wi-Fi Tablet URL: http://${ips[0].address}:${PORT}/?room=MAIN-SHOW&mode=tablet`);
    }
  });
}

void startServer();
