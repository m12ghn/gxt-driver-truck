import api from "../api/api";
import { compressImage } from "./compressImage";

const UPLOAD_CONCURRENCY = 3;

function maybeCompress(blob) {
  if (blob?.type === "image/jpeg" && blob.size && blob.size <= 250 * 1024) {
    return Promise.resolve(blob);
  }
  return compressImage(blob);
}

async function putToSignedUrl(blob, slot) {
  const put = await fetch(slot.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg",
    },
    body: blob,
  });

  if (!put.ok) {
    throw new Error(`Upload storage thất bại (${put.status}).`);
  }

  return slot.publicUrl;
}

async function uploadViaBackend(blob, folder) {
  const formData = new FormData();
  formData.append("photo", blob, "photo.jpg");
  formData.append("folder", folder);

  const { data } = await api.post("/upload/driver-photo", formData);
  return data.url;
}

async function mapPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => run()
  );
  await Promise.all(workers);
  return results;
}

async function requestSignedSlots(folder, count) {
  const { data } = await api.post("/upload/signed", { folder, count });
  if (Array.isArray(data?.files) && data.files.length) {
    return data.files;
  }
  if (data?.signedUrl) {
    return [data];
  }
  return [];
}

export async function uploadDriverPhotos(photos, folder, onProgress) {
  const entries = Object.entries(photos);
  if (!entries.length) return {};

  const compressed = await Promise.all(
    entries.map(async ([key, blob]) => [key, await maybeCompress(blob)])
  );

  let slots = [];
  try {
    slots = await requestSignedSlots(folder, compressed.length);
  } catch (err) {
    console.warn("Batch signed URL failed:", err);
  }

  let done = 0;
  const urls = {};

  await mapPool(compressed, UPLOAD_CONCURRENCY, async ([key, blob], index) => {
    try {
      if (slots[index]?.signedUrl) {
        urls[key] = await putToSignedUrl(blob, slots[index]);
      } else {
        throw new Error("Thiếu signed URL");
      }
    } catch (err) {
      console.warn("Signed PUT failed, falling back to API:", err);
      urls[key] = await uploadViaBackend(blob, folder);
    }

    done += 1;
    onProgress?.(done, compressed.length);
  });

  return urls;
}

export async function uploadDriverPhoto(blob, folder) {
  const result = await uploadDriverPhotos({ photo: blob }, folder);
  return result.photo;
}
