const jwt = require("jsonwebtoken");

const LEGACY_QUYEN = new Set(["SUPER_ADMIN", "ADMIN", "WAREHOUSE", "DRIVER"]);

// Chế độ chuyển tiếp: khi chưa tắt (AUTH_LEGACY=off), vẫn chấp nhận header
// x-user-* như trước để bản frontend cũ không bị văng ra. Đặt AUTH_LEGACY=off
// sau khi cả 2 frontend đã dùng token.
function legacyEnabled() {
  return String(process.env.AUTH_LEGACY || "").toLowerCase() !== "off";
}

function tokenConfigured() {
  return Boolean(process.env.JWT_SECRET);
}

function signToken(user) {
  if (!tokenConfigured()) return null;

  const quyen = String(user.quyen || "").toUpperCase();
  const expiresIn =
    process.env.JWT_EXPIRES_IN || (quyen === "DRIVER" ? "24h" : "12h");

  return jwt.sign(
    { msnv: user.msnv || "SUPER_ADMIN", quyen, uid: user.id ?? 0 },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

function bearerToken(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1].trim() : null;
}

function unauthorized(res, message) {
  return res.status(401).json({
    success: false,
    message: message || "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
  });
}

// Xác thực: ưu tiên JWT; nếu không có token thì (chỉ khi còn chế độ cũ)
// dùng header x-user-*. Khi token hợp lệ, ghi đè header x-user-* bằng dữ liệu
// trong token để các middleware/controller phía sau (attachUser) không bị
// client giả mạo quyền hoặc kho phụ trách.
function authenticate(req, res, next, { anonymousDriver = false } = {}) {
  const token = bearerToken(req);

  if (token) {
    if (!tokenConfigured()) return unauthorized(res);

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.identity = { msnv: payload.msnv, quyen: payload.quyen };
      req.headers["x-user-msnv"] = payload.msnv;
      req.headers["x-user-quyen"] = payload.quyen;
      delete req.headers["x-user-kho"];
      return next();
    } catch {
      return unauthorized(res, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  if (legacyEnabled()) {
    const quyen = String(req.headers["x-user-quyen"] || "").toUpperCase();
    if (LEGACY_QUYEN.has(quyen)) {
      req.identity = {
        msnv: req.headers["x-user-msnv"] || null,
        quyen,
      };
      return next();
    }
  }

  // App tài xế bản cũ chưa gửi token/header: trong thời gian chuyển tiếp vẫn
  // cho vào các route của tài xế (identity ẩn danh, không có MSNV).
  if (anonymousDriver && legacyEnabled()) {
    req.identity = { msnv: null, quyen: "DRIVER", anonymous: true };
    return next();
  }

  return unauthorized(res);
}

function requireAuth(req, res, next) {
  return authenticate(req, res, next);
}

// Dành cho route của app tài xế (đang chuyển sang token).
function requireDriverPortalAuth(req, res, next) {
  return authenticate(req, res, next, { anonymousDriver: true });
}

function requireRole(...roles) {
  const allowed = new Set(roles);

  return (req, res, next) => {
    if (!req.identity || !allowed.has(req.identity.quyen)) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện thao tác này.",
      });
    }
    next();
  };
}

// Tài xế chỉ được xem dữ liệu của chính mình (/today/:msnv, /history/:msnv).
function driverSelfOnly(req, res, next) {
  if (
    req.identity?.quyen === "DRIVER" &&
    !req.identity.anonymous &&
    String(req.params.msnv || "").trim() !== String(req.identity.msnv || "").trim()
  ) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền xem dữ liệu của tài xế khác.",
    });
  }
  next();
}

module.exports = {
  signToken,
  requireAuth,
  requireDriverPortalAuth,
  requireRole,
  driverSelfOnly,
  tokenConfigured,
};
