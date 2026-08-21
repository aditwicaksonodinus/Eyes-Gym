// Generates valid PNG icons (192x192 and 512x512) for the PWA manifest.
// Dependency-free: raw RGBA -> PNG via zlib deflate + manual CRC32.
// Soft-teal rounded square with a white eye mark (matches manifest theme_color #3a9b8f).
import zlib from "node:zlib";
import { writeFileSync } from "node:fs";

const TEAL = [0x3a, 0x9b, 0x8f];
const BG = [0xea, 0xf6, 0xf3];
const WHITE = [0xff, 0xff, 0xff];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function makePNG(size) {
  const px = (x, y) => {
    const cx = size / 2;
    const cy = size / 2;
    const nx = (x - cx) / (size / 2);
    const ny = (y - cy) / (size / 2);
    // rounded-square background
    const r = size * 0.18;
    const inRoundRect =
      (x >= r && x <= size - r && y >= 0 && y <= size) ||
      (x >= 0 && x <= size && y >= r && y <= size - r) ||
      (x < r && y < r && Math.hypot(x - r, y - r) <= r) ||
      (x > size - r && y < r && Math.hypot(x - (size - r), y - r) <= r) ||
      (x < r && y > size - r && Math.hypot(x - r, y - (size - r)) <= r) ||
      (x > size - r && y > size - r && Math.hypot(x - (size - r), y - (size - r)) <= r);
    if (!inRoundRect) return null;
    // white eye: ellipse
    const eyeRX = size * 0.30;
    const eyeRY = size * 0.18;
    const inEye = (nx * nx) / (eyeRX / (size / 2)) ** 2 + (ny * ny) / (eyeRY / (size / 2)) ** 2 <= 1;
    if (inEye) {
      // teal pupil
      const pRX = size * 0.11;
      const pRY = size * 0.11;
      const inPupil = (nx * nx) / (pRX / (size / 2)) ** 2 + (ny * ny) / (pRY / (size / 2)) ** 2 <= 1;
      return inPupil ? TEAL : WHITE;
    }
    return TEAL;
  };

  const raw = Buffer.alloc(size * (size * 4 + 1));
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const c = px(x, y) || BG;
      raw[o++] = c[0];
      raw[o++] = c[1];
      raw[o++] = c[2];
      raw[o++] = 255;
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const png = makePNG(size);
  writeFileSync(`public/icon-${size}.png`, png);
  console.log(`wrote public/icon-${size}.png (${png.length} bytes)`);
}
