require("dotenv").config();

// pg is required by Sequelize's postgres dialect, but Sequelize loads it
// dynamically (require(variableName) instead of require("pg")). Vercel's
// serverless bundler only packages dependencies it can see via a static
// require(), so without this explicit line, "pg" gets left out of the
// deployed function and the app crashes at startup with:
//   "Error: Please install pg package manually"
require("pg");

const { Sequelize } = require("sequelize");

// Vercel spins up many short-lived instances. Each instance used to open
// Sequelize's default pool (5 connections) against Supabase session mode
// (cap 15) → EMAXCONNSESSION. Use a tiny pool, and on serverless prefer
// the Transaction pooler (port 6543) which multiplexes clients.
function resolveDatabaseUrl(raw) {
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    const isServerless = Boolean(process.env.VERCEL);
    const isSupabasePooler = url.hostname.includes("pooler.supabase.com");

    if (isServerless && isSupabasePooler && (url.port === "5432" || url.port === "")) {
      url.port = "6543";
    }

    return url.toString();
  } catch {
    return raw;
  }
}

const isServerless = Boolean(process.env.VERCEL);

const sequelize = new Sequelize(resolveDatabaseUrl(process.env.DATABASE_URL), {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: isServerless ? 1 : 5,
    min: 0,
    acquire: 30000,
    idle: isServerless ? 5000 : 10000,
    evict: isServerless ? 5000 : 10000,
  },
});

module.exports = sequelize;
