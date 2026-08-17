require("dotenv").config();

// pg is required by Sequelize's postgres dialect, but Sequelize loads it
// dynamically (require(variableName) instead of require("pg")). Vercel's
// serverless bundler only packages dependencies it can see via a static
// require(), so without this explicit line, "pg" gets left out of the
// deployed function and the app crashes at startup with:
//   "Error: Please install pg package manually"
require("pg");

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
