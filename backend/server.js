// Entry point khi chạy local (npm run dev / node server.js).
// Trên Vercel, entry point thật là api/index.js (serverless function) —
// file này không được dùng khi deploy, chỉ dùng để chạy `app.listen()`
// cho môi trường dev / server thường trực.
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
