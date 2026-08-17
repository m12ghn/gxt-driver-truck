require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "⚠️  Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env — upload ảnh lên Supabase Storage sẽ lỗi."
  );
}

// Dùng service_role key (không phải anon key) vì server cần quyền ghi
// trực tiếp vào bucket, bỏ qua Row Level Security. Key này chỉ được
// dùng ở backend, tuyệt đối không đưa vào code frontend.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
