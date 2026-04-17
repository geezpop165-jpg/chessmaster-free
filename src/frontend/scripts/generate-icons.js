#!/usr/bin/env node
/**
 * Generates placeholder icon PNGs (icon16.png, icon48.png) by writing
 * minimal valid PNG files with a dark indigo background.
 * Run: node scripts/generate-icons.js
 *
 * For Chrome Web Store submission, replace with properly designed icons.
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

// Minimal 1×1 dark indigo PNG (#0f1117) — base64 encoded
// We'll construct valid PNG files using Buffer manipulation

function createPng(size, r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk: width, height, bit depth (8), color type (2=RGB), compression, filter, interlace
  function ihdrChunk(w, h) {
    const data = Buffer.alloc(13);
    data.writeUInt32BE(w, 0);
    data.writeUInt32BE(h, 4);
    data[8] = 8;  // bit depth
    data[9] = 2;  // RGB color type
    data[10] = 0; // compression
    data[11] = 0; // filter
    data[12] = 0; // interlace
    return makeChunk("IHDR", data);
  }

  // IDAT chunk: compressed image data (using zlib)
  // For simplicity, create raw scanlines and compress them
  function idatChunk(w, h, r, g, b) {
    // Each scanline: filter byte (0) + RGB pixels
    const scanlineSize = 1 + w * 3;
    const rawData = Buffer.alloc(h * scanlineSize);
    for (let row = 0; row < h; row++) {
      rawData[row * scanlineSize] = 0; // filter byte = None
      for (let col = 0; col < w; col++) {
        const offset = row * scanlineSize + 1 + col * 3;
        rawData[offset] = r;
        rawData[offset + 1] = g;
        rawData[offset + 2] = b;
      }
    }
    // Compress with zlib
    const zlib = require("node:zlib");
    const compressed = zlib.deflateSync(rawData);
    return makeChunk("IDAT", compressed);
  }

  // IEND chunk
  function iendChunk() {
    return makeChunk("IEND", Buffer.alloc(0));
  }

  function makeChunk(type, data) {
    const crc = require("node:zlib").crc32
      ? require("node:zlib").crc32(Buffer.concat([Buffer.from(type), data]))
      : computeCrc32(Buffer.concat([Buffer.from(type), data]));
    const chunk = Buffer.alloc(4 + 4 + data.length + 4);
    chunk.writeUInt32BE(data.length, 0);
    Buffer.from(type).copy(chunk, 4);
    data.copy(chunk, 8);
    chunk.writeInt32BE(crc >>> 0, 8 + data.length);
    return chunk;
  }

  // Simple CRC32 implementation
  function computeCrc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let k = 0; k < 8; k++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  return Buffer.concat([
    sig,
    ihdrChunk(size, size),
    idatChunk(size, size, r, g, b),
    iendChunk(),
  ]);
}

// Dark indigo color: #0f1117 = rgb(15, 17, 23)
const iconColor = [15, 17, 23];

for (const size of [16, 48]) {
  const png = createPng(size, ...iconColor);
  const outPath = resolve(publicDir, `icon${size}.png`);
  writeFileSync(outPath, png);
  console.log(`Generated ${outPath} (${size}x${size})`);
}

console.log("Done. Replace with real icons before Chrome Web Store submission.");
