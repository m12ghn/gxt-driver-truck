// Phone camera photos are often 2–8MB each. Vercel serverless rejects
// request bodies over ~4.5MB (HTTP 413), so 6 check-in photos fail.
// Shrink + JPEG-encode before upload.

const MAX_EDGE = 1280;
const MAX_BYTES = 350 * 1024;
const START_QUALITY = 0.72;
const MIN_QUALITY = 0.4;

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

export async function compressImage(file) {
  if (!file) return file;

  let source;
  try {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    source = await loadImageFallback(file);
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0, width, height);
  source.close?.();

  let quality = START_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob && blob.size > MAX_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.1);
    blob = await canvasToBlob(canvas, quality);
  }

  if (!blob) return file;
  if (file.size && blob.size >= file.size) return file;

  return blob;
}

export function uploadErrorMessage(err, fallback) {
  if (err.response?.status === 413) {
    return "Ảnh quá nặng, server không nhận được. Vui lòng thử lại (ảnh sẽ được nén tự động).";
  }

  return err.response?.data?.message || err.message || fallback;
}
