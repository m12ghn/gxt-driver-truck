import api from "../api/api";
import { compressImage } from "./compressImage";

async function uploadViaSignedUrl(blob, folder) {
  const { data } = await api.post("/upload/signed", { folder });

  const put = await fetch(data.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg",
    },
    body: blob,
  });

  if (!put.ok) {
    throw new Error(`Upload storage thất bại (${put.status}).`);
  }

  return data.publicUrl;
}

async function uploadViaBackend(blob, folder) {
  const formData = new FormData();
  formData.append("photo", blob, "photo.jpg");
  formData.append("folder", folder);

  const { data } = await api.post("/upload/driver-photo", formData);
  return data.url;
}

export async function uploadDriverPhoto(blob, folder) {
  const compressed = await compressImage(blob);

  try {
    return await uploadViaSignedUrl(compressed, folder);
  } catch (err) {
    console.warn("Signed upload failed, falling back to API:", err);
    return uploadViaBackend(compressed, folder);
  }
}

export async function uploadDriverPhotos(photos, folder, onProgress) {
  const urls = {};
  const entries = Object.entries(photos);

  for (let i = 0; i < entries.length; i++) {
    const [key, blob] = entries[i];
    onProgress?.(i + 1, entries.length);
    urls[key] = await uploadDriverPhoto(blob, folder);
  }

  return urls;
}
