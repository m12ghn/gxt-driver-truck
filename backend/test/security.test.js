// Chạy: DATABASE_URL=postgres://... DATABASE_SSL=false npm test
// Cần một Postgres trống để test (bảng được tạo bằng sequelize.sync()).
process.env.JWT_SECRET = "test-secret";
process.env.SUPER_ADMIN_USER = "root";
process.env.SUPER_ADMIN_PASS = "rootpass";
process.env.CORS_ORIGINS = "https://ok.example";
process.env.SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:1";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "x";
delete process.env.AUTH_LEGACY;

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

const app = require("../app");
const sequelize = require("../database/database");
const User = require("../models/User");
const Driver = require("../models/Driver");
const { verifyPassword } = require("../utils/password");

let server;
let base;

async function call(method, path, { token, headers = {}, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* không phải JSON */
  }
  return { status: res.status, json, headers: res.headers };
}

async function login(msnv, matKhau) {
  const r = await call("POST", "/api/auth/admin-login", {
    body: { taiKhoan: msnv, matKhau },
  });
  return r;
}

test.before(async () => {
  await sequelize.sync({ force: true });
  await User.bulkCreate([
    { msnv: "AD1", hoTen: "Admin", soDienThoai: "0900000001", matKhau: "adminpw", quyen: "ADMIN" },
    { msnv: "WH1", hoTen: "Kho", soDienThoai: "0900000002", matKhau: "whpw", quyen: "WAREHOUSE", kho: "[\"Kho A\"]" },
  ]);
  await Driver.create({ msnv: "DR1", hoTen: "Tai xe", soDienThoai: "0912345678", kho: "Kho A" });
  await Driver.create({ msnv: "DR2", hoTen: "Tai xe 2", soDienThoai: "0912345679", kho: "Kho A" });

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  server?.close();
  await sequelize.close();
});

test("API quản trị không còn mở cho người chưa đăng nhập", async () => {
  for (const path of ["/api/vehicles", "/api/drivers", "/api/users", "/api/warehouses", "/api/stats/dashboard"]) {
    const r = await call("GET", path);
    assert.equal(r.status, 401, path);
  }
  // route phân công cho phép "tài xế ẩn danh" khi còn chế độ chuyển tiếp nhưng vẫn chặn phần quản trị
  assert.equal((await call("GET", "/api/assignments")).status, 403);
  const del = await call("DELETE", "/api/vehicles/1");
  assert.equal(del.status, 401);
});

test("chế độ chuyển tiếp: header cũ vẫn dùng được khi AUTH_LEGACY chưa tắt", async () => {
  const r = await call("GET", "/api/vehicles", { headers: { "x-user-quyen": "ADMIN", "x-user-msnv": "AD1" } });
  assert.equal(r.status, 200);
});

test("đăng nhập trả token, không lộ mật khẩu, tự băm mật khẩu cũ", async () => {
  const r = await login("AD1", "adminpw");
  assert.equal(r.status, 200);
  assert.ok(r.json.data.token);
  assert.equal(r.json.data.matKhau, undefined);

  await new Promise((resolve) => setTimeout(resolve, 300));
  const row = await User.findOne({ where: { msnv: "AD1" } });
  assert.match(row.matKhau, /^\$2[aby]\$/);
  assert.equal(verifyPassword("adminpw", row.matKhau).ok, true);

  const again = await login("AD1", "adminpw");
  assert.equal(again.status, 200);
  const bad = await login("AD1", "sai");
  assert.equal(bad.status, 401);
});

test("super admin đăng nhập và đọc danh sách user không có matKhau", async () => {
  const r = await login("root", "rootpass");
  assert.equal(r.status, 200);
  const list = await call("GET", "/api/users", { token: r.json.data.token });
  assert.equal(list.status, 200);
  assert.ok(list.json.data.length >= 2);
  for (const u of list.json.data) assert.equal("matKhau" in u, false);
});

test("phân quyền theo vai trò", async () => {
  const admin = (await login("AD1", "adminpw")).json.data.token;
  const wh = (await login("WH1", "whpw")).json.data.token;

  assert.equal((await call("GET", "/api/users", { token: admin })).status, 403);
  assert.equal((await call("GET", "/api/vehicles", { token: admin })).status, 200);
  assert.equal((await call("GET", "/api/vehicles", { token: wh })).status, 200);
  assert.equal((await call("POST", "/api/vehicles", { token: wh, body: { bienSo: "51A-1" } })).status, 403);
  assert.equal((await call("POST", "/api/vehicles", { token: admin, body: { bienSo: "51A-1" } })).status, 201);
  assert.equal((await call("DELETE", "/api/vehicles/1", { token: wh })).status, 403);
});

test("không thể nâng quyền bằng header khi đã có token", async () => {
  const wh = (await login("WH1", "whpw")).json.data.token;
  const r = await call("GET", "/api/users", {
    token: wh,
    headers: { "x-user-quyen": "SUPER_ADMIN", "x-user-msnv": "WH1" },
  });
  assert.equal(r.status, 403);
});

test("token sai hoặc hết hạn bị từ chối", async () => {
  assert.equal((await call("GET", "/api/vehicles", { token: "abc.def.ghi" })).status, 401);
  const expired = jwt.sign({ msnv: "AD1", quyen: "ADMIN" }, "test-secret", { expiresIn: -10 });
  assert.equal((await call("GET", "/api/vehicles", { token: expired })).status, 401);
  const forged = jwt.sign({ msnv: "AD1", quyen: "SUPER_ADMIN" }, "other-secret");
  assert.equal((await call("GET", "/api/users", { token: forged })).status, 401);
});

test("tài xế: chỉ xem dữ liệu của mình, không vào được API quản trị", async () => {
  const r = await call("POST", "/api/auth/driver-login", { body: { msnv: "DR1", matKhau: "0912345678" } });
  assert.equal(r.status, 200);
  const token = r.json.data.token;
  assert.ok(token);
  assert.equal(r.json.data.matKhau, undefined);

  // 404 = hợp lệ nhưng hôm nay chưa có phân công (không bị chặn quyền)
  assert.equal((await call("GET", "/api/assignments/today/DR1", { token })).status, 404);
  assert.equal((await call("GET", "/api/assignments/today/DR2", { token })).status, 403);
  assert.equal((await call("GET", "/api/assignments", { token })).status, 403);
  assert.equal((await call("GET", "/api/vehicles", { token })).status, 403);
  assert.equal((await call("GET", "/api/stats/dashboard", { token })).status, 403);
});

test("chuyển tiếp: app tài xế cũ (chưa gửi token) vẫn dùng được route tài xế, không dùng được route quản trị", async () => {
  assert.equal((await call("GET", "/api/assignments/today/DR1")).status, 404);
  assert.equal((await call("GET", "/api/assignments")).status, 403);
});

test("giới hạn đăng nhập sai liên tiếp", async () => {
  let last;
  for (let i = 0; i < 11; i += 1) last = await login("WH1", "sai-" + i);
  assert.equal(last.status, 429);
});

test("CORS chỉ cho domain trong CORS_ORIGINS", async () => {
  const ok = await call("GET", "/api/auth/x", { headers: { Origin: "https://ok.example" } });
  assert.equal(ok.headers.get("access-control-allow-origin"), "https://ok.example");
  const bad = await call("GET", "/api/auth/x", { headers: { Origin: "https://evil.example" } });
  assert.equal(bad.headers.get("access-control-allow-origin"), null);
});

test("AUTH_LEGACY=off: header cũ và app tài xế không token bị từ chối", async () => {
  process.env.AUTH_LEGACY = "off";
  try {
    const hdr = await call("GET", "/api/vehicles", { headers: { "x-user-quyen": "SUPER_ADMIN" } });
    assert.equal(hdr.status, 401);
    assert.equal((await call("GET", "/api/assignments/today/DR1")).status, 401);
    const admin = (await login("AD1", "adminpw")).json.data.token;
    assert.equal((await call("GET", "/api/vehicles", { token: admin })).status, 200);
  } finally {
    delete process.env.AUTH_LEGACY;
  }
});
