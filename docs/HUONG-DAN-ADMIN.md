# Hướng dẫn sử dụng web Admin — GXT Driver Truck

Tài liệu dành cho **admin / kho** thao tác trên web quản lý Check In / Check Out GHN (Giao Hàng Nặng).

Địa chỉ web admin: `https://gxt-driver-truck-vvk8.vercel.app`

App tài xế (điện thoại) là hệ thống khác. Tài xế đăng nhập bằng **MSNV** + mật khẩu là **số điện thoại**.

---

## 1. Đăng nhập

1. Mở web admin.
2. Nhập tài khoản và mật khẩu.
3. Bấm đăng nhập.

Sau khi vào:

| Quyền | Vào trang mặc định | Ghi chú |
|---|---|---|
| Super Admin / Admin | Dashboard | Đủ menu (User chỉ Super Admin) |
| Kho (WAREHOUSE) | Phân công | Chỉ thấy dữ liệu kho được gán |

Đăng xuất: góc trên → xác nhận **Đăng xuất**.

---

## 2. Nên làm theo thứ tự này

Trước khi phân chuyến trong ngày:

1. Có **kho** (tọa độ + bán kính GPS)
2. Có **xe** (biển số, loại xe, kho)
3. Có **tài xế** (MSNV, họ tên, SĐT, kho)
4. Mới **phân công** xe + tài xế theo ngày / ca / kho
5. Tài xế (hoặc admin) **Check In / Check Out**
6. Kho **xác nhận** sau Check Out (nếu dùng)

Quy tắc hệ thống:

- **1 xe chỉ 1 chuyến / 1 ngày** (không phân biệt Ca 1 hay Ca 2)
- **1 tài xế chỉ 1 chuyến / 1 ngày**
- Ca 1: 07:30–18:30, lương chuẩn 370.000
- Ca 2: 07:30–19:30, lương chuẩn 400.000

---

## 3. Dashboard

Menu **Dashboard**.

- Số chuyến hôm nay, Check In, hoàn thành, trễ, GPS ngoài bán kính
- Cảnh báo theo kho (chưa Check In, trễ, GPS, chờ kho xác nhận)
- Bấm **Thử lại** nếu không tải được số liệu

---

## 4. Quản lý User (chỉ Super Admin)

Menu **Quản lý User**.

### Thêm user

1. Bấm thêm user.
2. Nhập MSNV, họ tên, SĐT, quyền (`ADMIN` / `WAREHOUSE` / …).
3. User **WAREHOUSE**: chọn **một hoặc nhiều kho** phụ trách.
4. Lưu.

User kho chỉ xem / xử lý chuyến thuộc kho đã gán.

---

## 5. Quản lý xe

Menu **Quản lý xe**.

### Thêm 1 xe

1. Bấm **+ THÊM XE**.
2. Nhập:
   - **Biển số** (bắt buộc)
   - **Loại xe**: Van, Van điện, 1T9, 5T, 8T, 15T (bắt buộc)
   - **Kho** (bắt buộc)
   - Km hiện tại, trạng thái, ghi chú (nếu có)
3. Bấm lưu.

### Sửa / xóa

- **Sửa**: đổi thông tin xe.
- **Xóa**: xác nhận trước khi xóa.

### Tìm xe

Gõ biển số, loại xe, kho hoặc trạng thái ở ô tìm phía trên bảng.

### Import Excel nhiều xe

1. Bấm **TẢI MẪU** → mở file mẫu.
2. Điền các cột:

| Cột | Ví dụ |
|---|---|
| Biển số | 50H-12345 |
| Loại xe | 1T9 |
| Kho | Tân Bình |
| Km hiện tại | 0 |
| Trạng thái | Hoạt động |
| Ghi chú | |

Kho có thể viết tắt: `Tân Bình`, `Tân Tạo`, `Tân Thuận`, `Thủ Đức`, `Sóng Thần`…

3. Bấm **IMPORT EXCEL** → chọn file `.xlsx`.

---

## 6. Quản lý tài xế

Menu **Quản lý tài xế**.

### Thêm 1 tài xế

1. Bấm **+ THÊM TÀI XẾ**.
2. Nhập:
   - **MSNV** (bắt buộc) — cũng là tài khoản app tài xế
   - **Họ tên** (bắt buộc)
   - **SĐT** (bắt buộc) — cũng là mật khẩu app tài xế
   - Kho, GPLX, loại bằng, trạng thái
3. Lưu.

Hệ thống sẽ tạo luôn tài khoản Driver tương ứng.

### Sửa / khóa / xóa

- **Sửa**: đổi thông tin.
- **Khóa / Mở**: đổi trạng thái Đang làm ↔ Nghỉ việc.
- **Xóa**: xóa tài xế **và** tài khoản đăng nhập app.

### Tìm tài xế

Gõ MSNV, họ tên, SĐT hoặc kho.

### Import Excel nhiều tài xế

1. **TẢI MẪU**.
2. Điền:

| Cột | Ví dụ |
|---|---|
| MSNV | 123456 |
| Họ tên | Nguyễn Văn A |
| Số điện thoại | 0901234567 |
| Kho | Tân Bình |
| GPLX | 123456789 |
| Loại bằng | C |
| Trạng thái | Đang làm |

3. **IMPORT EXCEL**.

---

## 7. Quản lý kho

Menu **Quản lý kho**.

- Xem tên kho, tọa độ, bán kính (mét).
- **Sửa GPS**: chỉnh latitude, longitude, bán kính. Dùng để Check In/Out đúng vị trí kho.

Đổi bán kính / tọa độ sẽ ảnh hưởng chuyến Check In GPS sau đó (trong / ngoài bán kính).

---

## 8. Phân công (thao tác chính)

Menu **Phân công**.

### 8.1. Xem danh sách

- Chọn **Từ ngày** / **Đến ngày**.
- Lọc: tìm BSX / loại xe / MSNV / tên / SĐT, kho, trạng thái chuyến, trạng thái kho.
- Các chip trên bảng: Tổng, Check In, Hoàn thành, Đã xác nhận, Không xác nhận.

### 8.2. Thêm 1 phân công

1. Bấm **+ PHÂN CÔNG**.
2. Chọn **Ngày**, **Ca** (Ca 1 hoặc Ca 2), **Kho**.
3. Ô **Xe**: gõ biển số hoặc loại xe, rồi chọn.
4. Ô **Tài xế**: gõ MSNV, họ tên hoặc SĐT, rồi chọn.
5. Bấm **Lưu**.

Nếu báo xe/tài xế **đã được phân công trong ngày này** → đã có chuyến cùng ngày, không thêm trùng được.

### 8.3. Sửa / xóa

- **Sửa**: đổi ngày, ca, kho, xe, tài xế (vẫn không được trùng xe/tài xế trong ngày).
- **Xóa**: xác nhận trước khi xóa.

### 8.4. Import Excel nhiều chuyến

1. Bấm **IMPORT EXCEL**.
2. File cần các cột:

| Cột | Ví dụ | Ghi chú |
|---|---|---|
| Ngày | `13/09/2026` hoặc `13/09` hoặc `2026-09-13` | Chỉ `13/09` = ngày đó **năm hiện tại** |
| Ca | Ca 1 / Ca 2 | |
| Kho | Tân Bình | Hoặc tên kho đầy đủ |
| Biển số | 50H-94184 | Phải trùng xe đã có trên hệ thống |
| MSNV | 3136261 | Phải trùng tài xế đã có |

3. Đợi xử lý xong. Dòng lỗi (xe không có, trùng chuyến, ngày sai) hiện trong kết quả — không làm hỏng cả file nếu chỉ vài dòng sai.

**Không import lại** cùng xe/tài xế cùng ngày khi chuyến đã Check In — hệ thống sẽ từ chối trùng.

### 8.5. Xuất Excel

Bấm **Xuất Excel**. File gồm ngày (`dd/mm/yyyy`), ca, giờ ca chuẩn, loại, lương, biển số, tài xế, giờ Check In/Out thật, ODO, kho xác nhận.

### 8.6. Kho xác nhận (sau Check Out)

Khi tài xế đã Check Out:

- Trạng thái kho: **Chờ xác nhận**
- User kho / admin: xem chi tiết → **Xác nhận** hoặc **Không xác nhận** (có lý do)

---

## 9. Check In

Menu **Check In**.

- Chọn khoảng ngày, có thể **tìm** BSX / MSNV / tên / kho.
- Tài xế tự Check In trên **app điện thoại** (ảnh xe + ODO + GPS trong bán kính kho).
- Admin có thể **CHECK IN HỘ** với chuyến **Chưa thực hiện**.
- **XEM**: ảnh, giờ, GPS, ODO.

Chip **Trễ**: Check In sau 07:30.

---

## 10. Check Out

Menu **Check Out**.

- Tương tự Check In, lọc theo ngày + ô tìm.
- Tài xế tự Check Out trên app.
- Admin **CHECK OUT HỘ** khi chuyến **Đã Check In** hoặc **Chưa hoàn thành** (quá hạn).
- **XEM**: ảnh, giờ, GPS, ODO Check Out.

---

## 11. Bản đồ GPS

Menu **Bản đồ GPS**.

- Vòng tròn: bán kính kho.
- Điểm xe: vị trí GPS lúc Check In / Check Out (không phải GPS chạy realtime trên đường).
- Lọc theo kho / ngày tùy giao diện đang có.

---

## 12. Báo cáo

Menu **Báo cáo** (Admin / Super Admin).

- Chọn khoảng ngày, kho (nếu cần).
- Xem KPI: hoàn thành, trễ, GPS, theo tài xế / kho.
- **Xuất Excel** báo cáo.

---

## 13. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| Không tải Dashboard / Phân công | Đợi vài giây, bấm Thử lại. Vẫn lỗi: kiểm tra kết nối database (Supabase). |
| Import Excel `Invalid date` / ngày không hợp lệ | Cột Ngày ghi `13/09/2026` hoặc `13/09`. Không để ô Ngày trống / lỗi format Excel. |
| Import: không tìm thấy xe / tài xế | Thêm xe, tài xế trước; biển số và MSNV phải **khớp** danh sách. |
| Không thêm được phân công | Xe hoặc tài xế đã có chuyến **cùng ngày**. |
| Check In GPS sai | Đứng trong bán kính kho (xem **Quản lý kho**). |
| Tài xế không đăng nhập app được | Username = MSNV, mật khẩu = SĐT đã lưu ở Quản lý tài xế. |
| User kho không thấy chuyến | User đó chưa được gán đúng kho. Super Admin sửa User. |

---

## 14. Liên hệ nội bộ

- Product Owner: Phạm Ngọc Huy
- Web admin: `gxt-driver-truck-vvk8.vercel.app`
- App tài xế: `gxt-driver-truck-d7ir.vercel.app`
