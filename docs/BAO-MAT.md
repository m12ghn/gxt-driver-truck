# Nâng cấp bảo mật đăng nhập / phân quyền

## Đã thay đổi
- Đăng nhập (admin và tài xế) trả về **token JWT**; frontend gửi `Authorization: Bearer ...`.
- Mọi API quản trị (`/users`, `/vehicles`, `/drivers`, `/warehouses`, `/stats`, `/assignments`, `/upload/excel`) **bắt buộc đăng nhập** và kiểm tra vai trò ở server:
  - `/users`: chỉ SUPER_ADMIN.
  - Thêm/sửa/xóa/import xe, tài xế: SUPER_ADMIN, ADMIN.
  - Xem danh sách xe/tài xế/kho, thống kê, phân công: SUPER_ADMIN, ADMIN, WAREHOUSE.
  - Tài xế chỉ gọi được các API của tài xế và chỉ xem được dữ liệu của chính mình.
- Khi có token hợp lệ, server bỏ qua header `x-user-quyen` / `x-user-kho` do client gửi (không thể nâng quyền).
- API không còn trả cột `matKhau`.
- Mật khẩu admin/kho được **băm bcrypt**: mật khẩu cũ (chữ thường) tự được băm ở lần đăng nhập đúng đầu tiên.
- Giới hạn 10 lần đăng nhập sai / 15 phút (theo IP + tài khoản).
- CORS có thể giới hạn theo domain.

## Biến môi trường (Vercel → project backend → Settings → Environment Variables)
| Biến | Ý nghĩa |
|---|---|
| `JWT_SECRET` | **Bắt buộc để bật token.** Chuỗi ngẫu nhiên dài (≥ 32 ký tự). Chưa đặt thì hệ thống chạy như cũ (không cấp token). |
| `JWT_EXPIRES_IN` | Tùy chọn. Mặc định 12h (admin/kho), 24h (tài xế). |
| `AUTH_LEGACY` | Đặt `off` để **tắt hẳn** chế độ cũ (header `x-user-*`, app tài xế không token). |
| `CORS_ORIGINS` | Tùy chọn. Danh sách domain frontend, cách nhau bằng dấu phẩy. |

## Các bước triển khai an toàn
1. Merge nhánh. Cả 3 project Vercel build lại. Chưa đặt biến nào → hệ thống vẫn chạy như cũ, chỉ riêng các API quản trị **không còn mở cho người chưa đăng nhập**.
2. Đặt `JWT_SECRET` → redeploy backend. Người dùng đăng nhập lại **một lần** để nhận token.
3. Kiểm tra admin và tài xế dùng bình thường vài ngày. Nếu có tài xế còn mở bản app cũ (cache), họ vẫn chạy được ở chế độ chuyển tiếp.
4. Đặt `AUTH_LEGACY=off` (và `CORS_ORIGINS`) → redeploy backend. Từ lúc này header giả không còn tác dụng.
5. Trước bước 2, nên backup bảng `Users` trên Supabase.

## Chạy test
```
cd backend
DATABASE_URL=postgres://user@host:5432/db_test DATABASE_SSL=false npm test
```
Test dùng `sequelize.sync({ force: true })` — **chỉ trỏ vào database test trống, không trỏ vào Supabase thật.**

## Còn lại (chưa làm)
- Mật khẩu tài xế vẫn là số điện thoại (so với `soDienThoai`) — nên cho tài xế đặt mật khẩu riêng.
- Màn Sửa User đang đặt lại mật khẩu = MSNV mỗi lần lưu.
- `driver-checkin/checkout` theo `:id` chưa kiểm tra phân công đó có thuộc tài xế đăng nhập hay không.
