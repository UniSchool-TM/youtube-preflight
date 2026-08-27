import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function inRoundedRect(x, y, size, radius) {
  const r = Math.min(radius, size / 2);
  const cx = Math.min(Math.max(x, r), size - r);
  const cy = Math.min(Math.max(y, r), size - r);
  const dx = x - cx;
  const dy = y - cy;
  if (dx === 0 || dy === 0) return true;
  return dx * dx + dy * dy <= r * r;
}

function pointInTriangle(px, py, a, b, c) {
  const sign = (x1, y1, x2, y2, x3, y3) =>
    (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
  const d1 = sign(px, py, a[0], a[1], b[0], b[1]);
  const d2 = sign(px, py, b[0], b[1], c[0], c[1]);
  const d3 = sign(px, py, c[0], c[1], a[0], a[1]);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

// Brand colors
const BG = [13, 15, 20];
const ACCENT = [77, 139, 255];
const WHITE = [255, 255, 255];

function draw(size, corner, triangleColor = ACCENT) {
  const data = Buffer.alloc(size * size * 4);
  const pad = Math.floor(size * 0.06);
  const a = [pad, pad];
  const b = [size - pad, pad];
  const c = [(size + pad) / 2, size - pad];
  const sA = [pad, pad + Math.floor(size * 0.02)];
  const sB = [size - pad, pad + Math.floor(size * 0.02)];
  const sC = [(size + pad) / 2, size - pad + Math.floor(size * 0.02)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let r = BG[0];
      let g = BG[1];
      let bl = BG[2];
      let alpha = 0;
      if (inRoundedRect(x + 0.5, y + 0.5, size, corner)) {
        alpha = 255;
      } else {
        data[i + 3] = 0;
        continue;
      }
      // subtle vertical gradient
      const t = y / size;
      r = Math.round(r * (1 - t * 0.12));
      g = Math.round(g * (1 - t * 0.12));
      bl = Math.round(bl * (1 - t * 0.12));

      if (pointInTriangle(x + 0.5, y + 0.5, sA, sB, sC)) {
        r = Math.round(ACCENT[0] * 0.45);
        g = Math.round(ACCENT[1] * 0.45);
        bl = Math.round(ACCENT[2] * 0.45);
      }
      if (pointInTriangle(x + 0.5, y + 0.5, a, b, c)) {
        const inner = pointInTriangle(x + 0.5, y + 0.5, a, b, c) && !pointInTriangle(x + 1.5, y + 1.5, a, b, c) && !pointInTriangle(x - 0.5, y - 0.5, a, b, c);
        void inner;
        r = triangleColor[0];
        g = triangleColor[1];
        bl = triangleColor[2];
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = bl;
      data[i + 3] = alpha;
    }
  }
  return data;
}

mkdirSync(OUT, { recursive: true });

// App icons
const sizes = [192, 512, 180];
for (const s of sizes) {
  const png = encodePng(s, s, draw(s, Math.round(s * 0.2)));
  writeFileSync(join(OUT, s === 180 ? "icon-180.png" : `icon-${s >= 200 ? "512" : "192"}.png`), png);
  console.log(`generated icon for ${s}px`);
}

// favicon with different corner style (full rounded for favicon tray)
writeFileSync(join(OUT, "icon-192.png"), encodePng(192, 192, draw(192, Math.round(192 * 0.22))));
console.log("wrote icon-192.png");

// OGP image 1200x630
{
  const W = 1200;
  const H = 630;
  const data = Buffer.alloc(W * H * 4);
  // dark bg with subtle gradient
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const t = y / H;
      data[i] = Math.round(15 + 20 * t);
      data[i + 1] = Math.round(17 + 20 * t);
      data[i + 2] = Math.round(22 + 24 * t);
      data[i + 3] = 255;
    }
  }
  // accent bar at top
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      data[i] = ACCENT[0];
      data[i + 1] = ACCENT[1];
      data[i + 2] = ACCENT[2];
      data[i + 3] = 255;
    }
  }

  // Simple raster text helpers: draw a bold-ish "Y" triangle motif on the left
  const logoSize = 220;
  const ox = 120;
  const oy = 120;
  for (let y = 0; y < logoSize; y++) {
    for (let x = 0; x < logoSize; x++) {
      const ax = ox + x;
      const ay = oy + y;
      if (!inRoundedRect(x, y, logoSize, 44)) continue;
      const i = (ay * W + ax) * 4;
      data[i] = ACCENT[0];
      data[i + 1] = ACCENT[1];
      data[i + 2] = ACCENT[2];
      data[i + 3] = 255;
    }
  }
  const L = 150;
  const tri = [
    [ox + 70, oy + 60],
    [ox + 70 + L * 0.75, oy + (L * 1.15) / 2],
    [ox + 70, oy + 60 + L * 1.15],
  ];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (pointInTriangle(x + 0.5, y + 0.5, tri[0], tri[1], tri[2])) {
        const i = (y * W + x) * 4;
        data[i] = WHITE[0];
        data[i + 1] = WHITE[1];
        data[i + 2] = WHITE[2];
        data[i + 3] = 255;
      }
    }
  }
  writeFileSync(join(OUT, "og-image.png"), encodePng(W, H, data));
  console.log("wrote og-image.png");
}

console.log("icons done");