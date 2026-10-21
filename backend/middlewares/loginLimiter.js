// Giới hạn đăng nhập sai theo (IP + tài khoản). Bộ nhớ trong tiến trình:
// trên serverless mỗi instance đếm riêng nên chỉ là lớp chặn cơ bản.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 10;

const attempts = new Map();

function keyOf(req) {
  const ip =
    String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  const account = String(req.body?.taiKhoan || req.body?.msnv || "")
    .trim()
    .toLowerCase();
  return `${ip}|${account}`;
}

function loginLimiter(req, res, next) {
  const key = keyOf(req);
  const now = Date.now();
  const entry = attempts.get(key);

  if (entry && now - entry.first > WINDOW_MS) {
    attempts.delete(key);
  }

  const current = attempts.get(key);
  if (current && current.count >= MAX_FAILS) {
    return res.status(429).json({
      success: false,
      message: "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
    });
  }

  res.on("finish", () => {
    if (res.statusCode === 401) {
      const e = attempts.get(key) || { count: 0, first: Date.now() };
      e.count += 1;
      attempts.set(key, e);
    } else if (res.statusCode < 400) {
      attempts.delete(key);
    }
  });

  next();
}

module.exports = loginLimiter;
