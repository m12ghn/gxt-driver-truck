require("dotenv").config();

// pg is required by Sequelize's postgres dialect, but Sequelize loads it
// dynamically (require(variableName) instead of require("pg")). Vercel's
// serverless bundler only packages dependencies it can see via a static
// require(), so without this explicit line, "pg" gets left out of the
// deployed function and the app crashes at startup with:
//   "Error: Please install pg package manually"
require("pg");

const dns = require("dns");
const { Sequelize } = require("sequelize");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Node cũ không có API này
}

const isServerless = Boolean(process.env.VERCEL);

// Dùng nguyên DATABASE_URL trên Vercel. Không đổi 5432 → 6543: Transaction
// pooler (6543) của một số project Supabase trả {:error, :nxdomain}, trong khi
// Session pooler (5432) vẫn kết nối được. Pool max=1 đã đủ tránh EMAXCONNSESSION.
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: isServerless ? 12000 : 30000,
  },
  pool: {
    max: isServerless ? 1 : 5,
    min: 0,
    acquire: isServerless ? 15000 : 30000,
    idle: isServerless ? 5000 : 10000,
    evict: isServerless ? 5000 : 10000,
  },
});

module.exports = sequelize;
