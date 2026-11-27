function normalizeOdoDigits(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function odoValuesMatch(entered, read) {
  const a = normalizeOdoDigits(entered);
  const b = normalizeOdoDigits(read);
  if (!a || !b) return false;
  return a === b;
}

export function isReliableOdoReading(reading, entered) {
  const read = normalizeOdoDigits(reading);
  if (read.length < 4 || read.length > 6) return false;
  const ones = [...read].filter((digit) => digit === "1").length;
  if (ones >= Math.ceil(read.length * 0.6)) return false;

  const enteredDigits = normalizeOdoDigits(entered);
  if (!enteredDigits) return true;
  if (read.length !== enteredDigits.length) return false;

  const readNum = Number(read);
  const enteredNum = Number(enteredDigits);
  if (!Number.isFinite(readNum) || !Number.isFinite(enteredNum) || enteredNum <= 0) {
    return true;
  }
  return readNum >= enteredNum * 0.5 && readNum <= enteredNum * 1.5;
}

function looksLikeClock(digits) {
  if (digits.length !== 4) return false;
  const hours = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2, 4));
  return hours <= 23 && minutes <= 59;
}

function parseOcrOdo(raw, { allowClock = true } = {}) {
  const text = String(raw || "").trim();
  if (!text) return null;
  const matches = text.match(/\d[\d\s.,]{0,}/g) || [];
  const candidates = matches
    .map((item) => normalizeOdoDigits(item))
    .filter((item) => item.length >= 3 && item.length <= 7)
    .filter((item) => allowClock || !looksLikeClock(item));
  if (candidates.length) {
    candidates.sort((a, b) => b.length - a.length);
    return candidates[0];
  }
  const all = normalizeOdoDigits(text);
  if (all.length >= 3 && all.length <= 7) return all;
  return null;
}

function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không mở được ảnh ODO."));
    };
    img.src = url;
  });
}

function isLcdPixel(r, g, b) {
  return (
    (g > 50 && b > 65 && g + b > r * 1.7 && g + b > 140) ||
    (g > 85 && b > 65 && r < 95)
  );
}

function findLcdBox(img) {
  const maxW = 420;
  const scale = Math.min(1, maxW / img.width);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);
  const visited = new Uint8Array(width * height);
  let best = null;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      const p = idx * 4;
      if (!isLcdPixel(data[p], data[p + 1], data[p + 2])) {
        visited[idx] = 1;
        continue;
      }
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;
      const stack = [idx];
      visited[idx] = 1;
      while (stack.length) {
        const cur = stack.pop();
        count += 1;
        const cx = cur % width;
        const cy = (cur - cx) / width;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        const neighbors = [cur - 1, cur + 1, cur - width, cur + width];
        for (const next of neighbors) {
          if (next < 0 || next >= visited.length || visited[next]) continue;
          const nx = next % width;
          const ny = (next - nx) / width;
          if (Math.abs(nx - cx) + Math.abs(ny - cy) !== 1) continue;
          const np = next * 4;
          if (!isLcdPixel(data[np], data[np + 1], data[np + 2])) {
            visited[next] = 1;
            continue;
          }
          visited[next] = 1;
          stack.push(next);
        }
      }
      const bw = maxX - minX;
      const bh = maxY - minY;
      if (count < 40 || bw < 12 || bh < 10) continue;
      if (!best || count > best.count) {
        best = { minX, maxX, minY, maxY, count };
      }
    }
  }

  if (!best) {
    return { x: 0.3, y: 0.32, w: 0.4, h: 0.4 };
  }

  const padX = Math.max(3, (best.maxX - best.minX) * 0.06);
  const padY = Math.max(3, (best.maxY - best.minY) * 0.08);
  const minX = Math.max(0, best.minX - padX);
  const minY = Math.max(0, best.minY - padY);
  const maxX = Math.min(width - 1, best.maxX + padX);
  const maxY = Math.min(height - 1, best.maxY + padY);
  return {
    x: minX / width,
    y: minY / height,
    w: (maxX - minX) / width,
    h: (maxY - minY) / height,
  };
}

const DIGIT_TEMPLATES = {
  0: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  6: ["01110", "10000", "11110", "10001", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
};

function cropToCanvas(img, crop, width = 520) {
  const sx = Math.round(img.width * crop.x);
  const sy = Math.round(img.height * crop.y);
  const sw = Math.max(8, Math.round(img.width * crop.w));
  const sh = Math.max(8, Math.round(img.height * crop.h));
  const scale = width / sw;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = Math.max(48, Math.round(sh * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function otsuThreshold(values) {
  const hist = new Array(256).fill(0);
  for (const value of values) hist[Math.max(0, Math.min(255, value | 0))] += 1;
  const total = values.length;
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 140;
  for (let t = 0; t < 256; t += 1) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

function binarizeCanvas(source, invert) {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(source, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const gray = new Uint8Array(pixels.length / 4);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    let value = g * 0.52 + b * 0.48 - r * 0.32;
    if (value < 0) value = 0;
    if (value > 255) value = 255;
    if (invert) value = 255 - value;
    gray[p] = value;
  }
  const threshold = otsuThreshold(gray);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const value = gray[p] > threshold ? 255 : 0;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function sampleCell(pixels, width, x0, y0, x1, y1) {
  let ink = 0;
  let total = 0;
  const minX = Math.max(0, Math.floor(x0));
  const maxX = Math.min(width - 1, Math.ceil(x1));
  const minY = Math.max(0, Math.floor(y0));
  const height = pixels.length / 4 / width;
  const maxY = Math.min(height - 1, Math.ceil(y1));
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      total += 1;
      if (pixels[(y * width + x) * 4] < 128) ink += 1;
    }
  }
  return total ? ink / total : 0;
}

function classifyDigit(pixels, width, box) {
  const padX = box.w * 0.08;
  const padY = box.h * 0.06;
  const x0 = box.x - padX;
  const y0 = box.y - padY;
  const x1 = box.x + box.w + padX;
  const y1 = box.y + box.h + padY;
  const cols = 5;
  const rows = 7;
  const grid = [];
  for (let row = 0; row < rows; row += 1) {
    let line = "";
    for (let col = 0; col < cols; col += 1) {
      const ink = sampleCell(
        pixels,
        width,
        x0 + ((x1 - x0) * col) / cols,
        y0 + ((y1 - y0) * row) / rows,
        x0 + ((x1 - x0) * (col + 1)) / cols,
        y0 + ((y1 - y0) * (row + 1)) / rows
      );
      line += ink > 0.38 ? "1" : "0";
    }
    grid.push(line);
  }

  let best = null;
  let bestScore = 0;
  for (const [digit, template] of Object.entries(DIGIT_TEMPLATES)) {
    let same = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (grid[row][col] === template[row][col]) same += 1;
      }
    }
    const score = same / (rows * cols);
    if (score > bestScore) {
      bestScore = score;
      best = digit;
    }
  }
  if (bestScore < 0.68) return null;
  return best;
}

function readDigitsFromBinary(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { data, width, height } = ctx.getImageData(
    0,
    0,
    canvas.width,
    canvas.height
  );
  const colInk = new Float32Array(width);
  for (let x = 0; x < width; x += 1) {
    let ink = 0;
    for (let y = 0; y < height; y += 1) {
      if (data[(y * width + x) * 4] < 128) ink += 1;
    }
    colInk[x] = ink / height;
  }

  const minInk = 0.07;
  const runs = [];
  let start = -1;
  for (let x = 0; x <= width; x += 1) {
    const on = x < width && colInk[x] >= minInk;
    if (on && start < 0) start = x;
    if (!on && start >= 0) {
      runs.push({ x0: start, x1: x - 1 });
      start = -1;
    }
  }

  const boxes = [];
  for (const run of runs) {
    const w = run.x1 - run.x0 + 1;
    if (w < 4) continue;
    let minY = height;
    let maxY = 0;
    for (let x = run.x0; x <= run.x1; x += 1) {
      for (let y = 0; y < height; y += 1) {
        if (data[(y * width + x) * 4] >= 128) continue;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const h = maxY - minY + 1;
    if (h < height * 0.28 || h > height * 0.98) continue;
    boxes.push({ x: run.x0, y: minY, w, h, cy: minY + h / 2 });
  }

  if (boxes.length < 3) return null;
  const heights = boxes.map((box) => box.h).sort((a, b) => a - b);
  const medianH = heights[Math.floor(heights.length / 2)];
  const row = boxes.filter(
    (box) =>
      Math.abs(box.h - medianH) <= medianH * 0.28 &&
      Math.abs(box.cy - (boxes[0].cy + boxes[boxes.length - 1].cy) / 2) <=
        medianH * 0.45
  );
  const digits = [];
  for (const box of row) {
    const digit = classifyDigit(data, width, box);
    if (digit != null) digits.push(digit);
  }

  const text = digits.join("");
  if (text.length >= 3 && text.length <= 7) return text;
  return null;
}

function odometerCrops(lcd) {
  return [
    {
      x: lcd.x + lcd.w * 0.04,
      y: lcd.y + lcd.h * 0.52,
      w: lcd.w * 0.92,
      h: lcd.h * 0.46,
    },
    {
      x: lcd.x + lcd.w * 0.12,
      y: lcd.y + lcd.h * 0.62,
      w: lcd.w * 0.76,
      h: lcd.h * 0.34,
    },
  ];
}

function pickBestReading(readings, entered) {
  const valid = readings
    .map((item) => normalizeOdoDigits(item))
    .filter((item) => isReliableOdoReading(item, entered));
  if (!valid.length) return null;
  const notClock = valid.filter((item) => !looksLikeClock(item));
  const pool = notClock.length ? notClock : valid;
  pool.sort((a, b) => {
    const score = (value) =>
      value.length >= 4 && value.length <= 6 ? 10 + value.length : value.length;
    return score(b) - score(a);
  });
  return pool[0];
}

function tessBase() {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}tesseract`;
}

let workerPromise = null;
let ocrQueue = Promise.resolve();

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const root = tessBase();
      return createWorker("eng", 1, {
        workerPath: `${root}/worker.min.js`,
        corePath: `${root}/tesseract-core-lstm.wasm.js`,
        langPath: root,
        gzip: true,
      });
    })().catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

async function tesseractStrip(canvas) {
  const { PSM } = await import("tesseract.js");
  const worker = await withTimeout(getWorker(), 12000, "Tải bộ đọc số quá lâu.");
  await worker.setParameters({
    tessedit_char_whitelist: "0123456789",
    tessedit_pageseg_mode: PSM.SINGLE_LINE,
  });
  const { data } = await worker.recognize(canvas);
  return parseOcrOdo(data?.text, { allowClock: true });
}

async function readOdoFromPhotoLocked(blob, entered) {
  const img = await loadImage(blob);
  const lcd = findLcdBox(img);
  const readings = [];

  for (const crop of odometerCrops(lcd)) {
    const color = cropToCanvas(img, crop, 560);
    for (const invert of [true, false]) {
      const binary = binarizeCanvas(color, invert);
      const digits = readDigitsFromBinary(binary);
      if (digits) readings.push(digits);
    }
  }

  const fromDigits = pickBestReading(readings, entered);
  if (fromDigits) return fromDigits;

  const fallbackCrop = odometerCrops(lcd)[0];
  const strip = binarizeCanvas(cropToCanvas(img, fallbackCrop, 560), true);
  const tess = await tesseractStrip(strip);
  return isReliableOdoReading(tess, entered) ? tess : null;
}

export function readOdoFromPhoto(blob, entered) {
  const job = ocrQueue.then(
    () =>
      withTimeout(
        readOdoFromPhotoLocked(blob, entered),
        15000,
        "Đọc ảnh ODO quá lâu."
      ),
    () =>
      withTimeout(
        readOdoFromPhotoLocked(blob, entered),
        15000,
        "Đọc ảnh ODO quá lâu."
      )
  );
  ocrQueue = job.then(
    () => {},
    () => {}
  );
  return job;
}

export function compareEnteredOdo(entered, reading) {
  const match = odoValuesMatch(entered, reading);
  return { match, reading: reading ? Number(reading) : null };
}

export { normalizeOdoDigits, odoValuesMatch, parseOcrOdo };
