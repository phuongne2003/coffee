# Danh sách trạng thái các module

## 1. AUTH (Xác thực)

### ✅ Đã có

- **Backend**: Route xác thực tại `backend/src/routes/auth.routes.ts`
  - POST /auth/login
  - POST /auth/register
  - GET /auth/me
- **Frontend**: Trang LoginPage và RegisterPage tại `frontend/src/pages/LoginPage.tsx` và `RegisterPage.tsx`
  - Xác thực JWT lưu vào localStorage
  - Chuyển hướng dựa vào role

### ❌ Còn thiếu

- Không có tính năng quên mật khẩu trên cả BE và FE
- Không có tính năng verify email

### ⚠️ Cần sửa

- Không phát hiện vấn đề lớn hiện tại

---

## 2. DANH MỤC (Categories)

### ✅ Đã có

- **Backend**: Service, controller, routes tại `backend/src/services/category.service.ts`, `controllers/category.controller.ts`, `routes/category.routes.ts`
  - GET /categories (list)
  - POST /categories (create)
  - GET /categories/{id} (detail)
  - PATCH /categories/{id} (update)
  - DELETE /categories/{id} (soft delete)
  - PATCH /categories/{id}/toggle (bật/tắt)
  - PATCH /categories/reorder (sắp xếp)
- **Frontend**: CategoriesPage tại `frontend/src/pages/CategoriesPage.tsx`
  - Danh sách, tạo, sửa, xóa, bật/tắt
  - Normalize dữ liệu từ backend

### ❌ Còn thiếu

- Không có lỗi lớn được phát hiện

### ⚠️ Cần sửa

- Không phát hiện vấn đề

---

## 3. MÓN ĂN (Menu Items)

### ✅ Đã có

- **Backend**: Service, controller, routes tại `backend/src/services/menu-item.service.ts`, `controllers/menu-item.controller.ts`, `routes/menu-item.routes.ts`
  - GET /menu-items (list)
  - POST /menu-items (create)
  - GET /menu-items/{id} (detail)
  - PATCH /menu-items/{id} (update)
  - DELETE /menu-items/{id} (soft delete)
  - PATCH /menu-items/{id}/toggle (bật/tắt bán)
  - Lưu recipe (nguyên liệu) trong mỗi món
- **Frontend**: MenuItemsPage tại `frontend/src/pages/MenuItemsPage.tsx`
  - Danh sách, tạo, sửa, xóa, bật/tắt
  - Thêm/sửa recipe (nguyên liệu và số lượng)

### ❌ Còn thiếu

- Không có lỗi lớn được phát hiện

### ⚠️ Cần sửa

- Không phát hiện vấn đề

---

## 4. BÀN (Tables)

### ✅ Đã có

- **Backend**: Service, controller, routes tại `backend/src/services/table.service.ts`, `controllers/table.controller.ts`, `routes/table.routes.ts`
  - GET /tables (list)
  - POST /tables (create)
  - GET /tables/{id} (detail)
  - PATCH /tables/{id} (update)
  - DELETE /tables/{id} (hard delete - xóa hẳn từ DB)
  - PATCH /tables/{id}/toggle (bật/tắt)
- **Frontend**: TablesPage tại `frontend/src/pages/TablesPage.tsx`
  - Danh sách, tạo, sửa, xóa bàn
  - Hiển thị mã QR cho mỗi bàn

### ❌ Còn thiếu

- QR chỉ encode `table-<code>` chứ không phải URL đến trang khách

### ⚠️ Cần sửa

- Không phát hiện vấn đề lớn

---

## 5. ĐƠN HÀNG (Orders / POS)

### ✅ Đã có

- **Backend**: Service, controller, routes tại `backend/src/services/order.service.ts`, `controllers/order.controller.ts`, `routes/order.routes.ts`
  - GET /orders (list)
  - POST /orders (create POS order)
  - GET /orders/{id} (detail)
  - DELETE /orders/{id} (hard delete)
  - PATCH /orders/{id}/items (add/remove items)
  - PATCH /orders/{id}/table (change table)
  - PATCH /orders/{id}/status (cập nhật trạng thái)
  - Guard: prevent multiple active orders trên cùng bàn
  - Tự động trừ kho nguyên liệu khi order chuyển sang "served"
- **Frontend**: OrdersPage tại `frontend/src/pages/OrdersPage.tsx`
  - Danh sách order (list view)
  - POS tạo order mới (pos view) với cart
  - Cập nhật trạng thái từ dropdown
  - Xóa order
  - Chọn bàn, chọn món

### ❌ Còn thiếu

- Không có lỗi lớn được phát hiện trên admin side

### ⚠️ Cần sửa

- Không phát hiện vấn đề

---

## 6. NGUYÊN LIỆU (Ingredients)

### ✅ Đã có

- **Backend**: Service, controller, routes tại `backend/src/services/ingredient.service.ts`, `controllers/ingredient.controller.ts`, `routes/ingredient.routes.ts`
  - GET /ingredients (list)
  - POST /ingredients (create)
  - GET /ingredients/{id} (detail)
  - PATCH /ingredients/{id} (update)
  - DELETE /ingredients/{id} (delete)
  - PATCH /ingredients/{id}/stock (update stock)
  - GET /ingredients/{id}/movements (lịch sử biến động kho)
  - GET /ingredients/alerts/low-stock (danh sách sắp hết)
- **Frontend**: IngredientsPage tại `frontend/src/pages/IngredientsPage.tsx`
  - Danh sách, tạo, sửa, xóa
  - Cập nhật tồn kho
  - Lịch sử biến động kho

### ❌ Còn thiếu

- Không có lỗi lớn được phát hiện

### ⚠️ Cần sửa

- Không phát hiện vấn đề

---

## 7. DASHBOARD (Báo cáo)

### ✅ Đã có

- **Frontend**: DashboardPage tại `frontend/src/pages/DashboardPage.tsx`
  - Gọi `reportsApi.summary()` lấy tổng doanh thu, tổng đơn, giá trị TB, món bán chạy
  - Gọi `reportsApi.byCategory()` hiển thị biểu đồ pie doanh thu theo danh mục
  - Gọi `reportsApi.trend()` hiển thị biểu đồ đường doanh thu 7 ngày
  - Gọi `reportsApi.inventory()` hiển thị danh sách nguyên liệu sắp hết

### ❌ Còn thiếu

- **Backend**: Không tìm thấy route `/reports/summary`, `/reports/by-category`, `/reports/trend`, `/reports/inventory` trong backend
- FE vẫn dựa vào mock data từ `frontend/src/services/mockData.ts`

### ⚠️ Cần sửa

- **Ưu tiên cao**: Cần thêm backend report routes và logic để frontend có thể lấy dữ liệu thực

---

## 8. MOBILE (Khách hàng quét QR)

### ✅ Đã có

- **Backend**: Route mobile tại `backend/src/routes/mobile-order.routes.ts` và controller `backend/src/controllers/mobile-order.controller.ts`
  - GET /mobile/menu/{tableCode} - khách quét QR lấy menu
  - POST /mobile/orders - khách tạo đơn hàng
- **Backend Swagger**: Định nghĩa endpoint ở `backend/src/swagger/swagger.ts` (dòng 848, 869)
- **Frontend**: QR hiện được tạo và hiển thị trong TablesPage

### ❌ Còn thiếu

- **Frontend**: KHÔNG CÓ route/page cho khách hàng
  - Không có route `/menu/{tableCode}` trong `frontend/src/App.tsx`
  - Không có MobileMenuPage hoặc CustomerPage để khách xem menu
  - Không có UI để khách đặt món qua mobile
- QR hiện chỉ encode dạng `table-<code>` chứ không phải URL đến trang khách

### ⚠️ Cần sửa

- **Ưu tiên RẤT CAO**: Cần tạo:
  1. Frontend page cho mobile menu (MobileMenuPage hoặc tương tự)
  2. Route `/menu/:tableCode` trong App.tsx để khách hàng truy cập
  3. UI cho khách đặt món qua LTE/4G (gọi `/api/mobile/orders`)
  4. Thay đổi QR để encode URL của frontend thay vì chỉ `table-<code>`

---

## 9. BẢNG KHÁCH

| Trang       | Route              | Trạng thái       | Ghi chú                                    |
| ----------- | ------------------ | ---------------- | ------------------------------------------ |
| Login       | `/login`           | Đã có            | Khách hoặc admin đều dùng để đăng nhập     |
| Register    | `/register`        | Đã có            | Trang đăng ký tài khoản                    |
| Mobile Menu | `/menu/:tableCode` | Đã có            | Trang khách quét QR để xem menu và đặt món |
| Dashboard   | `/dashboard`       | Không phải khách | Trang admin                                |
| Categories  | `/categories`      | Không phải khách | Trang admin                                |
| Ingredients | `/ingredients`     | Không phải khách | Trang admin                                |
| Menu Items  | `/menu-items`      | Không phải khách | Trang admin                                |
| Orders      | `/orders`          | Không phải khách | Trang admin                                |
| Tables      | `/tables`          | Không phải khách | Trang admin, có QR cho khách               |

---

## Tóm tắt ưu tiên

| Mức độ     | Công việc                             | Phần          |
| ---------- | ------------------------------------- | ------------- |
| 🔴 RẤT CAO | Tạo frontend mobile menu page + route | Mobile        |
| 🔴 RẤT CAO | Thay QR thành URL động                | Mobile/Tables |
| 🟡 CAO     | Thêm backend báo cáo routes           | Dashboard     |
| 🟢 THẤP    | Quên mật khẩu, verify email           | Auth          |
