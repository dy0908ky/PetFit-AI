/**
 * PetFit 아이콘 생성 스크립트
 * 256x256 PNG 아이콘을 순수 Node.js로 생성
 * 오렌지 그라데이션 배경 + 발자국 심볼 + PetFit 텍스트
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const WIDTH = 256;
const HEIGHT = 256;

// ── 색상 유틸 ──
function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function getGradientColor(x, y) {
  const t = (x + y) / (WIDTH + HEIGHT);
  // #e8790a → #f5a623
  return {
    r: lerp(0xe8, 0xf5, t),
    g: lerp(0x79, 0xa6, t),
    b: lerp(0x0a, 0x23, t),
    a: 255
  };
}

// ── 둥근 사각형 마스크 ──
function isInsideRoundedRect(x, y, radius) {
  if (x >= radius && x < WIDTH - radius) return true;
  if (y >= radius && y < HEIGHT - radius) return true;
  
  // 코너 체크
  let cx, cy;
  if (x < radius && y < radius) { cx = radius; cy = radius; }
  else if (x >= WIDTH - radius && y < radius) { cx = WIDTH - radius; cy = radius; }
  else if (x < radius && y >= HEIGHT - radius) { cx = radius; cy = HEIGHT - radius; }
  else if (x >= WIDTH - radius && y >= HEIGHT - radius) { cx = WIDTH - radius; cy = HEIGHT - radius; }
  else return true;
  
  const dx = x - cx;
  const dy = y - cy;
  return (dx * dx + dy * dy) <= radius * radius;
}

// ── 원 그리기 (발자국 패드) ──
function isInsideEllipse(x, y, cx, cy, rx, ry) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return (dx * dx + dy * dy) <= 1;
}

// ── 발자국 모양 정의 ──
function isPawPrint(x, y) {
  // 중앙 큰 패드 (하단)
  if (isInsideEllipse(x, y, 128, 130, 32, 28)) return true;
  
  // 4개 발가락 (상단)
  if (isInsideEllipse(x, y, 95, 82, 16, 18)) return true;
  if (isInsideEllipse(x, y, 118, 68, 15, 17)) return true;
  if (isInsideEllipse(x, y, 142, 68, 15, 17)) return true;
  if (isInsideEllipse(x, y, 163, 82, 16, 18)) return true;
  
  return false;
}

// ── 간단한 비트맵 폰트 "PetFit" ──
// 5x7 pixel font for each character
const FONT = {
  'P': [0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b10000],
  'e': [0b00000,0b00000,0b01110,0b10001,0b11111,0b10000,0b01110],
  't': [0b00100,0b00100,0b01110,0b00100,0b00100,0b00100,0b00011],
  'F': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
  'i': [0b00100,0b00000,0b01100,0b00100,0b00100,0b00100,0b01110],
};

function isTextPixel(px, py) {
  const text = 'PetFit';
  const scale = 3;
  const charW = 5 * scale + 2;
  const totalW = text.length * charW;
  const startX = Math.floor((WIDTH - totalW) / 2);
  const startY = 175;
  
  for (let ci = 0; ci < text.length; ci++) {
    const ch = text[ci];
    const glyph = FONT[ch];
    if (!glyph) continue;
    
    const cx = startX + ci * charW;
    const relX = Math.floor((px - cx) / scale);
    const relY = Math.floor((py - startY) / scale);
    
    if (relX >= 0 && relX < 5 && relY >= 0 && relY < 7) {
      if ((glyph[relY] >> (4 - relX)) & 1) return true;
    }
  }
  return false;
}

// ── 이미지 생성 ──
const pixels = Buffer.alloc(WIDTH * HEIGHT * 4);

for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    const idx = (y * WIDTH + x) * 4;
    
    if (!isInsideRoundedRect(x, y, 48)) {
      // 투명 영역
      pixels[idx] = 0;
      pixels[idx+1] = 0;
      pixels[idx+2] = 0;
      pixels[idx+3] = 0;
    } else if (isPawPrint(x, y) || isTextPixel(x, y)) {
      // 흰색 (발자국 + 텍스트)
      pixels[idx] = 255;
      pixels[idx+1] = 255;
      pixels[idx+2] = 255;
      pixels[idx+3] = 255;
    } else {
      // 그라데이션 배경
      const c = getGradientColor(x, y);
      pixels[idx] = c.r;
      pixels[idx+1] = c.g;
      pixels[idx+2] = c.b;
      pixels[idx+3] = c.a;
    }
  }
}

// ── PNG 인코딩 ──
function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

// IHDR
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type (RGBA)
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

// IDAT - raw image data with filter bytes
const rawData = Buffer.alloc(HEIGHT * (1 + WIDTH * 4));
for (let y = 0; y < HEIGHT; y++) {
  rawData[y * (1 + WIDTH * 4)] = 0; // filter: none
  for (let x = 0; x < WIDTH; x++) {
    const srcIdx = (y * WIDTH + x) * 4;
    const dstIdx = y * (1 + WIDTH * 4) + 1 + x * 4;
    rawData[dstIdx] = pixels[srcIdx];
    rawData[dstIdx+1] = pixels[srcIdx+1];
    rawData[dstIdx+2] = pixels[srcIdx+2];
    rawData[dstIdx+3] = pixels[srcIdx+3];
  }
}

const compressed = zlib.deflateSync(rawData);

// Assemble PNG
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdrChunk = createChunk('IHDR', ihdr);
const idatChunk = createChunk('IDAT', compressed);
const iendChunk = createChunk('IEND', Buffer.alloc(0));

const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);

const outPath = path.join(__dirname, 'icon.png');
fs.writeFileSync(outPath, png);
console.log(`✓ icon.png 생성 완료 (${WIDTH}x${HEIGHT}, ${Math.round(png.length/1024)}KB)`);
