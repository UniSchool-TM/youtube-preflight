import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public");
const APP = join(ROOT, "src", "app");

// ---- container helpers -----------------------------------------------------

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
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
  ihdr[8] = 8;
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

// ---- brand palette ---------------------------------------------------------

const RED = [229, 16, 45]; // --accent #e5102d
const RED_DARK = [180, 12, 36]; // dashes on the red tile
const WHITE = [255, 255, 255];
const WARM_TOP = [247, 244, 238]; // --background light
const WARM_BOT = [240, 231, 216];

// ---- paper-plane logo geometry (Header 32x32 viewBox) ----------------------

// plane body pentagon, hull A->B->C->D->E (convex, clockwise)
const A = [7.2, 17.7];
const B = [16.4, 24];
const C = [24.8, 10.4];
const D = [24.3, 9.5];
const E = [8.6, 15];
const BODY_TRI = [
  [A, B, C],
  [A, C, D],
  [A, D, E],
];
// accent fold (punch-out): F(16.9,23.9) G(12,17.2) H(22,14.8)
const PUNCH = [
  [16.9, 23.9],
  [12, 17.2],
  [22, 14.8],
];
// left wing fold (semi-transparent white): L(12.2,20.6) M(6.5,14.4) N(10.1,14.4)
const WING = [
  [12.2, 20.6],
  [6.5, 14.4],
  [10.1, 14.4],
];
// takeoff dashes
const DASHES = [
  [6.5, 15.8, 8.7, 15.8],
  [9.2, 18.2, 11.1, 18.2],
];

const BBOX = { u: 6.5, v: 14.4, w: 18.3, h: 9.6 };

function sign(x1, y1, x2, y2, x3, y3) {
  return (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);
}

function inTri(px, py, t) {
  const d1 = sign(px, py, t[0][0], t[0][1], t[1][0], t[1][1]);
  const d2 = sign(px, py, t[1][0], t[1][1], t[2][0], t[2][1]);
  const d3 = sign(px, py, t[2][0], t[2][1], t[0][0], t[0][1]);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// logo mapper: plane window -> tile of `tile` px, centered
function makeMapper(tile) {
  const k = (tile * 0.72) / BBOX.w;
  const xu = tile / 2 - (BBOX.u + BBOX.w / 2) * k;
  const yv = tile / 2 - (BBOX.v + BBOX.h / 2) * k;
  return {
    toPx(u, v) {
      return [xu + u * k, yv + v * k];
    },
    toUnit(px, py) {
      return [(px - xu) / k, (py - yv) / k];
    },
  };
}

// sample the logo at unit coords (u,v) -> RGB on the tile
function sampleLogo(u, v, dashThickness = 0.9) {
  let c = RED;
  for (const [x1, y1, x2, y2] of DASHES) {
    const rw = dashThickness / 2;
    if (u >= x1 - rw && u <= x2 + rw && v >= y1 - rw && v <= y2 + rw) {
      // rounded dash (circle caps)
      if (
        (u - x1) * (u - x1) + (v - y1) * (v - y1) <= rw * rw ||
        (u - x2) * (u - x2) + (v - y2) * (v - y2) <= rw * rw ||
        (u >= x1 && u <= x2 && v >= y1 - rw && v <= y2 + rw)
      ) {
        c = RED_DARK;
      }
    }
  }
  if (BODY_TRI.some((t) => inTri(u, v, t)) && !inTri(u, v, PUNCH)) {
    c = WHITE;
  }
  if (inTri(u, v, WING)) {
    c = mix(c, WHITE, 0.75);
  }
  return c;
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

// ---- tile drawing with 2x2 supersampling -----------------------------------

function drawTile(size, { rounded = 0 } = {}) {
  const data = Buffer.alloc(size * size * 4);
  const map = makeMapper(size);
  const sub = [1 / 3, 2 / 3];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (rounded && !inRoundedRect(x + 0.5, y + 0.5, size, rounded)) {
        data[i + 3] = 0;
        continue;
      }
      let r = 0, g = 0, b = 0;
      for (const sy of sub) {
        for (const sx of sub) {
          const [u, v] = map.toUnit(x + sx, y + sy);
          const s = sampleLogo(u, v);
          r += s[0];
          g += s[1];
          b += s[2];
        }
      }
      data[i] = Math.round(r / 4);
      data[i + 1] = Math.round(g / 4);
      data[i + 2] = Math.round(b / 4);
      data[i + 3] = 255;
    }
  }
  return data;
}

// ---- ICO (BMP-in-ICO) ------------------------------------------------------

function drawIconBmp(size, { dashThickness = 0.9 } = {}) {
  // 32bpp BGRA with alpha
  const map = makeMapper(size);
  const sub = [1 / 3, 2 / 3];
  const bgra = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (const sy of sub) {
        for (const sx of sub) {
          const [u, v] = map.toUnit(x + sx, y + sy);
          const s = sampleLogo(u, v, dashThickness);
          r += s[0];
          g += s[1];
          b += s[2];
        }
      }
      const dst = (y * size + x) * 4;
      bgra[dst] = Math.round(b / 4);
      bgra[dst + 1] = Math.round(g / 4);
      bgra[dst + 2] = Math.round(r / 4);
      bgra[dst + 3] = 255;
    }
  }
  return { bgra };
}

function encodeIco(sizes) {
  const imgs = sizes.map((s) => {
    const { bgra } = drawIconBmp(s);
    const bottomUpInsets = 1 + (s % 2); // odd sizes need extra padding row
    const bottomUp = Buffer.alloc((s * 4 + 1 - bottomUpInsets) * s);
    // BMP rows are bottom-up
    for (let y = 0; y < s; y++) {
      const srcRow = y * s * 4;
      const dstRow = (s - 1 - y) * (s * 4) + 1;
      bgra.copy(bottomUp, dstRow, srcRow, srcRow + s * 4);
    }
    // AND mask: 1bpp, opaque, each scanline padded to 32 bits
    const maskRowBytes = Math.ceil(s / 8);
    const maskStride = Math.ceil(maskRowBytes / 4) * 4;
    const andMask = Buffer.alloc(maskStride * s, 0);
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0);
    header.writeInt32LE(s, 4);
    header.writeInt32LE(s * 2, 8);
    header.writeUInt16LE(1, 12);
    header.writeUInt16LE(32, 14);
    header.writeUInt32LE(0, 16);
    header.writeUInt32LE(bottomUp.length + andMask.length, 20);
    header.writeInt32LE(0, 24);
    header.writeInt32LE(0, 28);
    header.writeUInt32LE(0, 32);
    header.writeUInt32LE(0, 36);
    return { size: s, data: Buffer.concat([header, bottomUp, andMask]) };
  });
  const dir = Buffer.alloc(6);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2);
  dir.writeUInt16LE(sizes.length, 4);
  let offset = 6 + imgs.length * 16;
  const entries = [];
  for (const img of imgs) {
    const e = Buffer.alloc(16);
    e[0] = img.size >= 256 ? 0 : img.size;
    e[1] = img.size >= 256 ? 0 : img.size;
    e[2] = 0;
    e[3] = 0;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(img.data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += img.data.length;
  }
  return Buffer.concat([dir, ...entries, ...imgs.map((i) => i.data)]);
}

// ---- OGP image -------------------------------------------------------------

function drawOg() {
  const W = 1200;
  const H = 630;
  const data = Buffer.alloc(W * H * 4);
  const logoSize = 260;
  const tl = 150;
  const tt = 175;
  const map = makeMapper(logoSize);
  const sub = [1 / 3, 2 / 3];
  const corner = Math.round(logoSize * 0.28);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const t = y / H;
      let c = mix(WARM_TOP, WARM_BOT, t);
      // big soft accent circle top-right
      const dx = x - 950;
      const dy = y - 180;
      const d2 = dx * dx + dy * dy;
      if (d2 < 190 * 190) {
        const a = 1 - d2 / (190 * 190);
        c = mix(c, RED, a * 0.12);
      }
      // faint dashed takeoff arc behind logo
      const rx = x - (tl + logoSize * 0.92);
      const ry = y - (tt + logoSize * 0.42);
      const rad = Math.sqrt(rx * rx + ry * ry);
      if (Math.abs(rad - 120) < 5 && ((x + y) % 26) < 13) {
        c = mix(c, RED, 0.35);
      }
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
  // logo tile
  for (let y = 0; y < logoSize; y++) {
    for (let x = 0; x < logoSize; x++) {
      const ax = tl + x;
      const ay = tt + y;
      if (!inRoundedRect(x + 0.5, y + 0.5, logoSize, corner)) continue;
      const i = (ay * W + ax) * 4;
      let r = 0, g = 0, b = 0;
      for (const sy of sub) {
        for (const sx of sub) {
          const [u, v] = map.toUnit(x + sx, y + sy);
          const s = sampleLogo(u, v);
          r += s[0];
          g += s[1];
          b += s[2];
        }
      }
      data[i] = Math.round(r / 4);
      data[i + 1] = Math.round(g / 4);
      data[i + 2] = Math.round(b / 4);
      data[i + 3] = 255;
    }
  }
  // accent ruling line + hand-drawn star sparkle
  for (let x = 0; x < 300; x++) {
    const y = 412;
    const i = (y * W + (150 + x)) * 4;
    data[i] = RED[0];
    data[i + 1] = RED[1];
    data[i + 2] = RED[2];
    data[i + 3] = Math.round(255 * (0.4 + 0.6 * ((y + x) % 7 === 0 ? 1 : 1)));
  }
  writeSparkle(data, W, 460, 505, RED, 0.9);
  writeSparkle(data, W, 585, 335, WHITE, 1);

  return data;
}

function writeSparkle(data, W, cx, cy, color, alpha) {
  const pts = 4;
  for (let p = 0; p < pts; p++) {
    const ang = (p / pts) * Math.PI * 2;
    const dx = Math.cos(ang) * 20;
    const dy = Math.sin(ang) * 20;
    const steps = 40 * Math.abs(dx);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(cx + (dx * s) / steps);
      const y = Math.round(cy + (dy * s) / steps);
      if (x < 0 || y < 0 || x >= W) continue;
      const i = (y * W + x) * 4;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = Math.round(255 * alpha);
    }
    const cx2 = cx + dx * 0.8;
    const cy2 = cy + dy * 0.8;
    for (let s = 1; s <= 6; s++) {
      const x = Math.round(cx2 - (dx * 0.2 * s) / 6);
      const y = Math.round(cy2 - (dy * 0.2 * s) / 6);
      if (x < 0 || y < 0 || x >= W) continue;
      const i = (y * W + x) * 4;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = Math.round(255 * alpha * 0.7);
    }
  }
}

// ---- write outputs ---------------------------------------------------------

mkdirSync(OUT, { recursive: true });
mkdirSync(APP, { recursive: true });

for (const s of [180, 192, 512]) {
  const png = encodePng(s, s, drawTile(s));
  const name = s === 180 ? "icon-180.png" : `icon-${s}.png`;
  writeFileSync(join(OUT, name), png);
  console.log(`generated public/${name}`);
}

writeFileSync(join(APP, "favicon.ico"), encodeIco([16, 32, 48]));
console.log("generated src/app/favicon.ico (16/32/48)");

writeFileSync(join(OUT, "og-image.png"), encodePng(1200, 630, drawOg()));
console.log("generated public/og-image.png");

console.log("icons done");