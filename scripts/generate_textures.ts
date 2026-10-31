import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';

// Minimal PNG generator without external dependencies
function createCRC32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toHash = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toHash), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodeRGBAtoPNG(width: number, height: number, rgba: Uint8Array): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let inOffset = 0;
  let outOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[outOffset++] = 0; // Filter None
    for (let x = 0; x < width * 4; x++) {
      scanlines[outOffset++] = rgba[inOffset++];
    }
  }

  // IDAT
  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Helpers to draw onto raw RGBA buffer
class PixelCanvas {
  width: number;
  height: number;
  rgba: Uint8Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.rgba = new Uint8Array(width * height * 4);
  }

  setPixel(x: number, y: number, r: number, g: number, b: number, a = 255) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    this.rgba[idx] = r;
    this.rgba[idx + 1] = g;
    this.rgba[idx + 2] = b;
    this.rgba[idx + 3] = a;
  }

  fillCircle(cx: number, cy: number, radius: number, r: number, g: number, b: number, a = 255) {
    const r2 = radius * radius;
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          this.setPixel(x, y, r, g, b, a);
        }
      }
    }
  }

  fillRect(rx: number, ry: number, rw: number, rh: number, r: number, g: number, b: number, a = 255) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        this.setPixel(x, y, r, g, b, a);
      }
    }
  }

  toPNG(): Buffer {
    return encodeRGBAtoPNG(this.width, this.height, this.rgba);
  }
}

// 1. Duck / Goose Idle texture (64x64)
function drawDuckIdle(): Buffer {
  const c = new PixelCanvas(64, 64);
  // Soft shadow
  c.fillCircle(32, 54, 18, 40, 80, 40, 80);
  // Goose/Duck Body (Cream white/golden feathers)
  c.fillCircle(32, 40, 16, 255, 235, 120);
  c.fillCircle(30, 38, 14, 255, 245, 150);
  // Wing
  c.fillCircle(24, 40, 9, 245, 215, 90);
  // Long neck & head
  c.fillCircle(38, 25, 11, 255, 240, 140);
  c.fillCircle(42, 19, 9, 255, 245, 160);
  // Orange Beak
  c.fillRect(49, 18, 9, 6, 255, 120, 0);
  // Dark Eye
  c.fillCircle(45, 16, 2, 20, 20, 30);
  // Green gardener leaf hat on head
  c.fillRect(39, 10, 3, 5, 46, 204, 113);
  c.fillCircle(42, 9, 4, 39, 174, 96);
  // Orange feet
  c.fillRect(26, 52, 6, 4, 255, 120, 0);
  c.fillRect(36, 52, 6, 4, 255, 120, 0);

  return c.toPNG();
}

// 2. Plastic Debris (64x64)
function drawPlasticDebris(): Buffer {
  const c = new PixelCanvas(64, 64);
  // Shimmering bottle body
  c.fillRect(24, 22, 16, 26, 180, 230, 255, 220);
  c.fillRect(26, 24, 12, 22, 220, 245, 255, 240);
  // Bottle Neck & Cap
  c.fillRect(28, 16, 8, 7, 180, 230, 255, 230);
  c.fillRect(27, 13, 10, 4, 41, 128, 185); // Blue cap
  // Crumple highlights
  c.fillRect(26, 32, 8, 3, 255, 255, 255, 200);
  c.fillRect(28, 40, 6, 2, 255, 255, 255, 180);
  return c.toPNG();
}

// 3. Wind Turbine (64x64)
function drawWindTurbine(): Buffer {
  const c = new PixelCanvas(64, 64);
  // Tower
  c.fillRect(30, 24, 4, 36, 240, 240, 245);
  c.fillRect(28, 58, 8, 4, 200, 200, 210); // Base
  // Hub
  c.fillCircle(32, 24, 4, 220, 220, 230);
  // 3 Aerofoil Blades
  // Vertical top blade
  c.fillRect(31, 4, 2, 20, 255, 255, 255);
  // Left angled blade
  for (let i = 0; i < 16; i++) {
    c.setPixel(32 - i, 24 + Math.floor(i * 0.7), 250, 250, 255);
    c.setPixel(32 - i, 25 + Math.floor(i * 0.7), 250, 250, 255);
  }
  // Right angled blade
  for (let i = 0; i < 16; i++) {
    c.setPixel(32 + i, 24 + Math.floor(i * 0.7), 250, 250, 255);
    c.setPixel(32 + i, 25 + Math.floor(i * 0.7), 250, 250, 255);
  }
  return c.toPNG();
}

// 4. UI Task Icon (64x64)
function drawTaskIcon(): Buffer {
  const c = new PixelCanvas(64, 64);
  // Outer circle badge
  c.fillCircle(32, 32, 28, 46, 204, 113); // Green border
  c.fillCircle(32, 32, 25, 24, 128, 70); // Deep forest green
  // White recycle / leaf motif
  c.fillCircle(32, 32, 14, 255, 255, 255);
  c.fillCircle(32, 32, 11, 24, 128, 70);
  c.fillRect(29, 20, 6, 24, 255, 255, 255);
  c.fillRect(20, 29, 24, 6, 255, 255, 255);
  return c.toPNG();
}

// 5. Grass Tile (64x64)
function drawGrassTile(): Buffer {
  const c = new PixelCanvas(64, 64);
  c.fillRect(0, 0, 64, 64, 76, 175, 80);
  // Subtle grass specks & tufts
  for (let y = 0; y < 64; y += 4) {
    for (let x = 0; x < 64; x += 4) {
      if ((x + y * 3) % 7 === 0) {
        c.setPixel(x, y, 92, 195, 96);
        c.setPixel(x, y - 1, 108, 210, 112);
      } else if ((x * 2 + y) % 11 === 0) {
        c.setPixel(x, y, 56, 142, 60);
      }
    }
  }
  return c.toPNG();
}

// 6. Water Tile (64x64)
function drawWaterTile(): Buffer {
  const c = new PixelCanvas(64, 64);
  c.fillRect(0, 0, 64, 64, 38, 166, 154);
  // Flowing ripple lines
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x++) {
      const wave = Math.sin((x / 64) * Math.PI * 4) * 2;
      c.setPixel(x, y + Math.floor(wave), 77, 208, 225, 240);
      c.setPixel(x, y + Math.floor(wave) + 1, 178, 235, 242, 160);
    }
  }
  return c.toPNG();
}

// Ensure folders exist
function ensureDir(p: string) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

const texturesDir = path.resolve(process.cwd(), 'textures');
ensureDir(path.join(texturesDir, 'player'));
ensureDir(path.join(texturesDir, 'objects'));
ensureDir(path.join(texturesDir, 'ui'));
ensureDir(path.join(texturesDir, 'world'));

fs.writeFileSync(path.join(texturesDir, 'player', 'duck_idle.png'), drawDuckIdle());
fs.writeFileSync(path.join(texturesDir, 'objects', 'plastic.png'), drawPlasticDebris());
fs.writeFileSync(path.join(texturesDir, 'objects', 'wind_turbine.png'), drawWindTurbine());
fs.writeFileSync(path.join(texturesDir, 'ui', 'task_icon.png'), drawTaskIcon());
fs.writeFileSync(path.join(texturesDir, 'world', 'grass_tile.png'), drawGrassTile());
fs.writeFileSync(path.join(texturesDir, 'world', 'water_tile.png'), drawWaterTile());

console.log('All textures generated successfully in /textures/!');
