const { v4: uuidv4 } = require("uuid");

const supabase = require("./supabaseClient");

const BUCKET = process.env.SUPABASE_BUCKET || "gxt-uploads";

// Upload 1 file (buffer từ multer memoryStorage) lên Supabase Storage,
// trả về URL công khai để lưu vào DB — thay cho đường dẫn local
// "/uploads/..." như trước đây.
async function uploadBufferToSupabase(file, folder) {
  const ext = (file.originalname?.split(".").pop() || "jpg").toLowerCase();
  const objectPath = `${folder}/${Date.now()}-${uuidv4()}.${ext}`;

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

module.exports = { uploadBufferToSupabase };
