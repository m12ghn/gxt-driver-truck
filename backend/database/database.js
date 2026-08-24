require("dotenv").config();

require("pg");

const dns = require("dns");
const { Sequelize } = require("sequelize");

try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Node cũ không có API này
}

function resolveDatabaseUrl(raw) {
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    const isServerless = Boolean(process.env.VERCEL);
    const isSupabasePooler = url.hostname.includes("pooler.supabase.com");

    if (isServerless && isSupabasePooler && (url.port === "5432" || url.port === "")) {
      url.port = "6543";
    }

    if (isServerless && isSupabasePooler && url.port === "6543") {
      url.searchParams.set("pgbouncer", "true");
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
    keepAlive: true,
    family: 4,
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
