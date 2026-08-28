import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

function decodePng(buf) {
  let pos = 8;
  let w = 0, h = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = w * bpp;
  const pix = Buffer.alloc(w * h * 4);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? line[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (f === 1) v = (v + a) & 255;
      else if (f === 2) v = (v + b) & 255;
      else if (f === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
      line[x] = v;
    }
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) pix[(y * w + x) * 4 + c] = line[x * bpp + c];
      pix[(y * w + x) * 4 + 3] = colorType === 6 ? line[x * bpp + 3] : 255;
    }
    prev = line;
  }
  return { w, h, pix };
}

function rgba(pix, w, x, y) {
  const i = (y * w + x) * 4;
  return [pix[i], pix[i + 1], pix[i + 2], pix[i + 3]];
}

function countColor(pix, w, h, target, tol = 6) {
  let n = 0;
  for (let i = 0; i < w * h; i++) {
    const d = Math.abs(pix[i * 4] - target[0]) + Math.abs(pix[i * 4 + 1] - target[1]) + Math.abs(pix[i * 4 + 2] - target[2]);
    if (d <= tol * 3 && pix[i * 4 + 3] === 255) n++;
  }
  return n;
}

const RED = [229, 16, 45];
const RED_DARK = [180, 12, 36];
const WHITE = [255, 255, 255];

for (const file of ["public/icon-180.png", "public/icon-192.png", "public/icon-512.png", "public/og-image.png"]) {
  const { w, h, pix } = decodePng(readFileSync(file));
  const corner = rgba(pix, w, Math.floor(w * 0.02), Math.floor(h * 0.02));
  const reds = countColor(pix, w, h, RED);
  const whites = countColor(pix, w, h, WHITE);
  const darks = countColor(pix, w, h, RED_DARK, 10);
  console.log(
    `${file}: ${w}x${h} corner=${corner[0]},${corner[1]},${corner[2]},${corner[3]} ` +
      `redPx=${reds} whitePx=${whites} darkDashPx=${darks}` +
      (corner[3] !== 255 ? " OPACITY_ISSUE" : "")
  );
  if (file.includes("og")) {
    console.log(
      `  og top-center=${rgba(pix, w, Math.floor(w / 2), 10)}, center=${rgba(pix, w, Math.floor(w / 2), Math.floor(h / 2))}`
    );
  }
}

// rough token check of icon.svg geometry (ensure no blue remains)
const svg = readFileSync("public/icon.svg", "utf8");
console.log("icon.svg has #2a6df4 (old blue)?", svg.includes("#2a6df4"));
console.log("icon.svg has #e5102d (red)?", svg.includes("#e5102d"));
console.log("icon.svg size:", svg.length, "bytes");