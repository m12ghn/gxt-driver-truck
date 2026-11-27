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

function looksLikeClock(digits) {
  if (digits.length !== 4) return false;
  const hours = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2, 4));
  return hours <= 23 && minutes <= 59;
}

function parseOcrOdo(raw, { allowClock = false } = {}) {
  const text = String(raw || "").trim();
  if (!text) return null;

  const matches = text.match(/\d[\d\s.,]{0,}/g) || [];
  const candidates = matches
    .map((item) => normalizeOdoDigits(item))
    .filter((item) => item.length >= 3 && item.length <= 7)
    .filter((item) => allowClock || !looksLikeClock(item));

  if (!candidates.length) {
    const all = normalizeOdoDigits(text);
    if (all.length >= 3 && all.length <= 7 && (allowClock || !looksLikeClock(all))) {
      return all;
    }
    return null;
  }

  candidates.sort((a, b) => {
    const score = (value) => {
      if (value.length >= 4 && value.length <= 6) return 20 + value.length;
      return value.length;
    };
    return score(b) - score(a);
  });
  return candidates[0];
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
  const cyan = g > 55 && b > 70 && g + b > r * 1.85 && g + b > 150;
  const mint = g > 90 && b > 70 && r < 90;
  return cyan || mint;
}

function findLcdBox(img) {
  const maxW = 480;
  const scale = Math.min(1, maxW / img.width);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (!isLcdPixel(data[i], data[i + 1], data[i + 2])) continue;
      count += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (count < 30) return null;

  const padX = Math.max(4, (maxX - minX) * 0.08);
  const padY = Math.max(4, (maxY - minY) * 0.1);
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(width - 1, maxX + padX);
  maxY = Math.min(height - 1, maxY + padY);

  return {
    x: minX / width,
    y: minY / height,
    w: (maxX - minX) / width,
    h: (maxY - minY) / height,
  };
}

function cropFrac(box, { y = 0, h = 1, x = 0, w = 1 } = {}) {
  return {
    x: box.x + box.w * x,
    y: box.y + box.h * y,
    w: box.w * w,
    h: box.h * h,
  };
}

function enhanceCrop(img, crop, { invert = true, threshold = 145 } = {}) {
  const sx = Math.round(img.width * crop.x);
  const sy = Math.round(img.height * crop.y);
  const sw = Math.max(8, Math.round(img.width * crop.w));
  const sh = Math.max(8, Math.round(img.height * crop.h));
  const scale = Math.max(3.2, 960 / sw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const gray = new Float32Array(pixels.length / 4);
  let min = 255;
  let max = 0;

  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    let value = g * 0.5 + b * 0.5 - r * 0.35;
    if (value < 0) value = 0;
    if (invert) value = 255 - value;
    gray[p] = value;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const span = Math.max(1, max - min);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    let value = ((gray[p] - min) / span) * 255;
    if (threshold != null) value = value > threshold ? 255 : 0;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function makeVariants(img) {
  const lcd = findLcdBox(img);
  const crops = [];

  if (lcd) {
    crops.push({ crop: cropFrac(lcd, { y: 0.48, h: 0.52 }), allowClock: true, weight: 40 });
    crops.push({ crop: cropFrac(lcd, { y: 0.58, h: 0.42, x: 0.08, w: 0.84 }), allowClock: true, weight: 50 });
    crops.push({ crop: lcd, allowClock: false, weight: 10 });
  }

  crops.push(
    { crop: { x: 0.3, y: 0.32, w: 0.4, h: 0.36 }, allowClock: false, weight: 5 },
    { crop: { x: 0.34, y: 0.42, w: 0.32, h: 0.22 }, allowClock: true, weight: 8 }
  );

  const variants = [];
  for (const item of crops) {
    variants.push({
      canvas: enhanceCrop(img, item.crop, { invert: true, threshold: 140 }),
      allowClock: item.allowClock,
      weight: item.weight,
    });
    variants.push({
      canvas: enhanceCrop(img, item.crop, { invert: true, threshold: null }),
      allowClock: item.allowClock,
      weight: item.weight,
    });
  }
  return variants;
}

function tessBase() {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}tesseract`;
}

let workerPromise = null;

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
        workerBlobURL: false,
      });
    })();
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

export async function readOdoFromPhoto(blob) {
  const img = await loadImage(blob);
  const { PSM } = await import("tesseract.js");
  const worker = await withTimeout(
    getWorker(),
    25000,
    "Tải bộ đọc số quá lâu. Kiểm tra mạng rồi thử lại."
  );

  const modes = [PSM.SINGLE_LINE, PSM.SINGLE_WORD];
  const variants = makeVariants(img);
  let best = null;
  let bestScore = -1;

  for (const variant of variants) {
    for (const mode of modes) {
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
        tessedit_pageseg_mode: mode,
      });
      const { data } = await worker.recognize(variant.canvas);
      const parsed = parseOcrOdo(data?.text, { allowClock: variant.allowClock });
      if (!parsed) continue;
      const confidence = Number(data?.confidence) || 0;
      const score =
        variant.weight +
        confidence +
        (parsed.length >= 4 && parsed.length <= 6 ? 15 : 0);
      if (score > bestScore) {
        bestScore = score;
        best = parsed;
      }
    }
  }

  if (!best) {
    await worker.setParameters({
      tessedit_char_whitelist: "0123456789",
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
    });
    const { data } = await worker.recognize(blob);
    best = parseOcrOdo(data?.text, { allowClock: true });
  }

  return best;
}

export function compareEnteredOdo(entered, reading) {
  const match = odoValuesMatch(entered, reading);
  return { match, reading: reading ? Number(reading) : null };
}

export { normalizeOdoDigits, odoValuesMatch, parseOcrOdo };
