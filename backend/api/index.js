// Entry point cho Vercel Serverless Function — Vercel tự nhận file trong
// thư mục api/ làm 1 function. vercel.json rewrite mọi request về đây,
// Express (app.js) tự lo phần định tuyến /api/... bên trong.
module.exports = require("../app");
