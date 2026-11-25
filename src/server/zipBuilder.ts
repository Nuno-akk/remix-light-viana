import zlib from 'node:zlib';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date: Date): {dosTime: number; dosDate: number} {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return {dosTime, dosDate};
}

interface ZipEntry {
  nameBuf: Buffer;
  crc: number;
  compressedSize: number;
  uncompressedSize: number;
  method: number;
  dosTime: number;
  dosDate: number;
  localOffset: number;
}

/**
 * Dependency-free PKZIP builder with DEFLATE compression, UTF-8 filenames,
 * and strict entry-path deduplication. Compatible with Node 22 native ESM.
 */
export class ZipBuilder {
  #chunks: Buffer[] = [];
  #entries: ZipEntry[] = [];
  #seenPaths = new Set<string>();
  #offset = 0;

  addFile(zipPath: string, content: Buffer | string, modifiedAt = new Date()): void {
    const normalizedPath = zipPath
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .replace(/\/{2,}/g, '/');

    if (!normalizedPath || this.#seenPaths.has(normalizedPath)) {
      return;
    }
    this.#seenPaths.add(normalizedPath);

    const raw = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const nameBuf = Buffer.from(normalizedPath, 'utf8');
    const crc = crc32(raw);

    const compressed = raw.length > 64 ? zlib.deflateRawSync(raw, {level: 6}) : raw;
    const useDeflate = raw.length > 64 && compressed.length < raw.length;
    const data = useDeflate ? compressed : raw;
    const method = useDeflate ? 8 : 0;

    const {dosTime, dosDate} = getDosDateTime(modifiedAt);
    const localOffset = this.#offset;

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // Local file header signature
    localHeader.writeUInt16LE(20, 4); // Version needed to extract (2.0)
    localHeader.writeUInt16LE(0x0800, 6); // General purpose bit flag: UTF-8 filename
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(raw.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // Extra field length

    this.#chunks.push(localHeader, nameBuf, data);
    this.#offset += localHeader.length + nameBuf.length + data.length;

    this.#entries.push({
      nameBuf,
      crc,
      compressedSize: data.length,
      uncompressedSize: raw.length,
      method,
      dosTime,
      dosDate,
      localOffset,
    });
  }

  toBuffer(): Buffer {
    const centralDirOffset = this.#offset;
    let centralDirSize = 0;

    for (const entry of this.#entries) {
      const cdHeader = Buffer.alloc(46);
      cdHeader.writeUInt32LE(0x02014b50, 0); // Central directory file header
      cdHeader.writeUInt16LE(20, 4); // Version made by
      cdHeader.writeUInt16LE(20, 6); // Version needed
      cdHeader.writeUInt16LE(0x0800, 8); // UTF-8 filename flag
      cdHeader.writeUInt16LE(entry.method, 10);
      cdHeader.writeUInt16LE(entry.dosTime, 12);
      cdHeader.writeUInt16LE(entry.dosDate, 14);
      cdHeader.writeUInt32LE(entry.crc, 16);
      cdHeader.writeUInt32LE(entry.compressedSize, 20);
      cdHeader.writeUInt32LE(entry.uncompressedSize, 24);
      cdHeader.writeUInt16LE(entry.nameBuf.length, 28);
      cdHeader.writeUInt16LE(0, 30); // Extra field length
      cdHeader.writeUInt16LE(0, 32); // File comment length
      cdHeader.writeUInt16LE(0, 34); // Disk number start
      cdHeader.writeUInt16LE(0, 36); // Internal file attributes
      cdHeader.writeUInt32LE(0, 38); // External file attributes
      cdHeader.writeUInt32LE(entry.localOffset, 42);

      this.#chunks.push(cdHeader, entry.nameBuf);
      centralDirSize += cdHeader.length + entry.nameBuf.length;
    }

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // End of central directory signature
    eocd.writeUInt16LE(0, 4); // Disk number
    eocd.writeUInt16LE(0, 6); // Start disk
    eocd.writeUInt16LE(this.#entries.length, 8);
    eocd.writeUInt16LE(this.#entries.length, 10);
    eocd.writeUInt32LE(centralDirSize, 12);
    eocd.writeUInt32LE(centralDirOffset, 16);
    eocd.writeUInt16LE(0, 20); // Comment length

    this.#chunks.push(eocd);
    return Buffer.concat(this.#chunks);
  }
}
