require("dotenv").config();

const { Sequelize } = require("sequelize");

// ==============================
// Kết nối Postgres (Supabase) qua DATABASE_URL trong .env
// Lấy connection string tại: Supabase Dashboard → Project Settings →
// Database → Connection string → chọn "URI". Nên dùng chế độ Session
// (hoặc kết nối trực tiếp) cho app Node chạy dài hạn như backend này —
// không dùng "Transaction pooler" (port 6543) vì không hợp với cách
// Sequelize giữ connection pool riêng.
// ==============================
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

module.exports = sequelize;
