const { randomUUID } = require("crypto");

const supabase = require("./supabaseClient");

const BUCKET = process.env.SUPABASE_BUCKET || "gxt-uploads";

// Upload 1 file (buffer từ multer memoryStorage) lên Supabase Storage,
// trả về URL công khai để lưu vào DB — thay cho đường dẫn local
// "/uploads/..." như trước đây.
async function uploadBufferToSupabase(file, folder) {
  await ensureStorageBucket();
  const ext = (file.originalname?.split(".").pop() || "jpg").toLowerCase();
  const objectPath = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Upload Supabase Storage thất bại (${objectPath}): ${error.message}`
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

  return data.publicUrl;
}

async function createSignedUpload(folder) {
  await ensureStorageBucket();
  const safeFolder = String(folder || "checkin").replace(/[^a-z0-9-]/gi, "");
  const objectPath = `${safeFolder || "checkin"}/${Date.now()}-${randomUUID()}.jpg`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(objectPath);

  if (error) {
    throw new Error(`Tạo signed upload URL thất bại: ${error.message}`);
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);

  return {
    path: objectPath,
    signedUrl: data.signedUrl,
    token: data.token,
    publicUrl: pub.publicUrl,
  };
}

async function ensureStorageBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw new Error(`Không liệt kê được Storage bucket: ${listError.message}`);
  }

  const existing = (buckets || []).find((item) => item.name === BUCKET);

  if (!existing) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });

    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Không tạo được Storage bucket: ${error.message}`);
    }
  } else if (!existing.public) {
    const { error } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
    });

    if (error) {
      console.error("Không đặt bucket public:", error.message);
    }
  }
}

function objectPathFromUrl(url) {
  if (!url || typeof url !== "string") return null;

  const publicMarker = `/object/public/${BUCKET}/`;
  const signMarker = `/object/sign/${BUCKET}/`;
  const publicIdx = url.indexOf(publicMarker);
  const signIdx = url.indexOf(signMarker);

  if (publicIdx !== -1) {
    return url.slice(publicIdx + publicMarker.length).split("?")[0];
  }

  if (signIdx !== -1) {
    return url.slice(signIdx + signMarker.length).split("?")[0];
  }

  return null;
}

async function toReadableUrl(url) {
  const objectPath = objectPathFromUrl(url);
  if (!objectPath) return url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, 60 * 60 * 24 * 7);

  if (error || !data?.signedUrl) {
    return url;
  }

  return data.signedUrl;
}

async function signPhotoMap(photos) {
  if (!photos || typeof photos !== "object" || Array.isArray(photos)) {
    if (Array.isArray(photos)) {
      return Promise.all(photos.map((item) => toReadableUrl(item)));
    }
    return photos;
  }

  const next = { ...photos };
  const keys = Object.keys(next);

  await Promise.all(
    keys.map(async (key) => {
      next[key] = await toReadableUrl(next[key]);
    })
  );

  return next;
}

async function withReadablePhotos(assignment) {
  if (!assignment) return assignment;

  const json = typeof assignment.toJSON === "function"
    ? assignment.toJSON()
    : assignment;

  json.checkInPhotos = await signPhotoMap(json.checkInPhotos);
  json.checkOutPhotos = await signPhotoMap(json.checkOutPhotos);

  if (Array.isArray(json.incidents)) {
    json.incidents = await Promise.all(
      json.incidents.map(async (item) => {
        const row = typeof item.toJSON === "function" ? item.toJSON() : item;
        row.photos = await signPhotoMap(row.photos);
        return row;
      })
    );
  }

  return json;
}

async function withReadablePhotosList(list) {
  return Promise.all((list || []).map((item) => withReadablePhotos(item)));
}

module.exports = {
  uploadBufferToSupabase,
  createSignedUpload,
  ensureStorageBucket,
  toReadableUrl,
  withReadablePhotos,
  withReadablePhotosList,
  BUCKET,
};
