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

  const matches = text.match(/\d[\d\s.,]{2,}/g) || [];
  const candidates = matches
    .map((item) => normalizeOdoDigits(item))
    .filter((item) => item.length >= 3 && item.length <= 8)
    .sort((a, b) => b.length - a.length);

  if (candidates[0]) return candidates[0];

  const all = normalizeOdoDigits(text);
  if (all.length >= 3 && all.length <= 8) return all;
  return null;
}

let workerPromise = null;

async function getWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789",
      });
      return worker;
    })();
  }
  return workerPromise;
}

export async function readOdoFromPhoto(blob) {
  const worker = await getWorker();
  const { data } = await worker.recognize(blob);
  return parseOcrOdo(data?.text);
}

export function compareEnteredOdo(entered, reading) {
  const match = odoValuesMatch(entered, reading);
  return { match, reading: reading ? Number(reading) : null };
}

export { normalizeOdoDigits, odoValuesMatch, parseOcrOdo };
