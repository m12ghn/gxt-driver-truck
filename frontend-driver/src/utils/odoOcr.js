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

function parseOcrOdo(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;

  const matches = text.match(/\d[\d\s.,]{1,}/g) || [];
  const candidates = matches
    .map((item) => normalizeOdoDigits(item))
    .filter((item) => item.length >= 4 && item.length <= 7);

  if (!candidates.length) {
    const all = normalizeOdoDigits(text);
    if (all.length >= 4 && all.length <= 7) return all;
    return null;
  }

  candidates.sort((a, b) => {
    const score = (value) =>
      value.length === 5 || value.length === 6 ? 50 + value.length : value.length;
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

function cropAndEnhance(img, crop, invert) {
  const sx = Math.round(img.width * crop.x);
  const sy = Math.round(img.height * crop.y);
  const sw = Math.max(8, Math.round(img.width * crop.w));
  const sh = Math.max(8, Math.round(img.height * crop.h));
  const scale = Math.max(2.4, 720 / sw);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  let sum = 0;
  const gray = new Array(pixels.length / 4);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    const value = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    gray[p] = value;
    sum += value;
  }
  const mean = sum / gray.length;
  const shouldInvert = invert ?? mean < 110;

  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {
    let value = gray[p];
    if (shouldInvert) value = 255 - value;
    value = (value - 128) * 2.1 + 128;
    value = value > 135 ? 255 : 0;
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function makeVariants(img) {
  const crops = [
    { x: 0.28, y: 0.28, w: 0.44, h: 0.38 },
    { x: 0.34, y: 0.34, w: 0.32, h: 0.24 },
    { x: 0.2, y: 0.22, w: 0.6, h: 0.5 },
  ];
  return crops.flatMap((crop) => [
    cropAndEnhance(img, crop, true),
    cropAndEnhance(img, crop, false),
  ]);
}

function tessBase() {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}tesseract`;
}

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import("tesseract.js");
      const root = tessBase();
      const worker = await createWorker("eng", 1, {
        workerPath: `${root}/worker.min.js`,
        corePath: `${root}/tesseract-core-lstm.wasm.js`,
        langPath: root,
        gzip: true,
        workerBlobURL: false,
      });
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      });
      return worker;
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
  const worker = await withTimeout(
    getWorker(),
    25000,
    "Tải bộ đọc số quá lâu. Kiểm tra mạng rồi thử lại."
  );
  const variants = makeVariants(img);
  let best = null;

  for (const canvas of variants) {
    const { data } = await worker.recognize(canvas);
    const parsed = parseOcrOdo(data?.text);
    if (!parsed) continue;
    if (
      !best ||
      parsed.length === 5 ||
      parsed.length === 6 ||
      parsed.length > best.length
    ) {
      best = parsed;
    }
    if (best.length === 5 || best.length === 6) break;
  }

  if (!best) {
    const { data } = await worker.recognize(blob);
    best = parseOcrOdo(data?.text);
  }

  return best;
}

export function compareEnteredOdo(entered, reading) {
  const match = odoValuesMatch(entered, reading);
  return { match, reading: reading ? Number(reading) : null };
}

export { normalizeOdoDigits, odoValuesMatch, parseOcrOdo };
