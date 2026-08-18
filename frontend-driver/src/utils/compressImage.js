// Phone camera photos are often 2–8MB each. Vercel serverless rejects
// request bodies over ~4.5MB (HTTP 413). Always return a JPEG blob.

const MAX_EDGE = 1024;
const MAX_BYTES = 220 * 1024;
const START_QUALITY = 0.7;
const MIN_QUALITY = 0.35;

function loadImageFallback(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

function drawToCanvas(source, edge) {
  const scale = Math.min(1, edge / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

export async function compressImage(file) {
  if (!file) {
    throw new Error("Thiếu ảnh để nén.");
  }

  let source;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    source = await loadImageFallback(file);
  }

  let edge = MAX_EDGE;
  let best = null;

  for (let attempt = 0; attempt < 4; attempt++) {
    const canvas = drawToCanvas(source, edge);
    let quality = START_QUALITY;
    let blob = await canvasToBlob(canvas, quality);

    while (blob && blob.size > MAX_BYTES && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.1);
      blob = await canvasToBlob(canvas, quality);
    }

    if (blob && (!best || blob.size < best.size)) {
      best = blob;
    }

    if (blob && blob.size <= MAX_BYTES) {
      source.close?.();
      return blob;
    }

    edge = Math.round(edge * 0.75);
  }

  source.close?.();

  if (!best) {
    throw new Error("Không nén được ảnh. Vui lòng chụp lại.");
  }

  return best;
}

export function uploadErrorMessage(err, fallback) {
  if (err.response?.status === 413) {
    return "Ảnh quá nặng, server không nhận được. Vui lòng tải lại trang rồi chụp lại.";
  }

  return err.response?.data?.message || err.message || fallback;
}
