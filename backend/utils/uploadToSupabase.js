const { randomUUID } = require("crypto");

const supabase = require("./supabaseClient");

const BUCKET = process.env.SUPABASE_BUCKET || "gxt-uploads";

// Upload 1 file (buffer từ multer memoryStorage) lên Supabase Storage,
// trả về URL công khai để lưu vào DB — thay cho đường dẫn local
// "/uploads/..." như trước đây.
async function uploadBufferToSupabase(file, folder) {
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

module.exports = { uploadBufferToSupabase, createSignedUpload };
