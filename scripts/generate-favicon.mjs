import fs from "fs";
import path from "path";
import sharp from "sharp";

const root = path.resolve("public");
const src = path.join(root, "logo-home-queen.png");
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

function isBackground(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 24;
}

function knockOutBlack(data, w, h) {
  const visited = new Uint8Array(w * h);
  const q = [];

  const tryPush = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    const i = idx * 4;
    if (!isBackground(data[i], data[i + 1], data[i + 2])) return;
    visited[idx] = 1;
    q.push(idx);
  };

  for (let x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }

  for (let qi = 0; qi < q.length; qi++) {
    const idx = q[qi];
    const x = idx % w;
    const y = (idx / w) | 0;
    data[idx * 4 + 3] = 0;
    tryPush(x + 1, y);
    tryPush(x - 1, y);
    tryPush(x, y + 1);
    tryPush(x, y - 1);
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] === 0) continue;
      let nextToClear = false;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (data[(ny * w + nx) * 4 + 3] === 0) {
          nextToClear = true;
          break;
        }
      }
      if (!nextToClear) continue;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum < 70) {
        data[i + 3] = Math.max(0, Math.min(255, Math.round((lum / 70) * 255)));
      }
    }
  }
}

function pngToIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  const payloads = [];
  let offset = 6 + 16 * images.length;

  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    payloads.push(png);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...payloads]);
}

async function toSquarePng(input, size) {
  return sharp(input)
    .resize(size, size, { fit: "contain", background: transparent })
    .png()
    .toBuffer();
}

async function main() {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  knockOutBlack(data, w, h);

  const cleared = await sharp(data, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();

  const fullTransparent = path.join(root, "logo-home-queen-transparent.png");
  await sharp(cleared).png().toFile(fullTransparent);
  console.log("ok", path.basename(fullTransparent));

  const iconPad = 56;
  const extracted = await sharp(cleared)
    .extract({
      left: 400,
      top: 70,
      width: 720,
      height: 534,
    })
    .trim({ threshold: 8 })
    .extend({
      top: iconPad,
      bottom: iconPad,
      left: iconPad,
      right: iconPad,
      background: transparent,
    })
    .png()
    .toBuffer();

  const markPath = path.join(root, "logo-home-queen-mark.png");
  const markBuf = await sharp(extracted)
    .resize(512, 512, { fit: "contain", background: transparent })
    .png()
    .toBuffer();
  fs.writeFileSync(markPath, markBuf);
  console.log("ok", path.basename(markPath));

  const sizes = [
    [48, "favicon-48.png"],
    [96, "favicon-96.png"],
    [192, "favicon-192.png"],
    [180, "apple-touch-icon.png"],
  ];

  const icoFrames = [];
  for (const [size, name] of sizes) {
    const buf = await toSquarePng(markBuf, size);
    fs.writeFileSync(path.join(root, name), buf);
    console.log("ok", name, size);
  }

  for (const size of [16, 32, 48]) {
    icoFrames.push({ size, png: await toSquarePng(markBuf, size) });
  }
  fs.writeFileSync(path.join(root, "favicon.ico"), pngToIco(icoFrames));
  console.log("ok favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
