# 🌿 SmartSpend & Meal - Sổ Thu Chi và Thực Đơn Đi Chợ Tuần

> **Giải pháp ứng dụng web thông minh kết hợp quản lý tài chính cá nhân và kế hoạch ăn uống, đi chợ khoa học trong tuần dành cho dân văn phòng & gia đình hiện đại.**

[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/CSS-Tailwind%20CSS-38bdf8.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Status](https://img.shields.io/badge/B%E1%BA%A3ng%20d%E1%BB%B1%20thi-B%E1%BA%A3ng%20V%C4%83n%20ph%C3%B2ng-059669.svg?style=flat-square)](#)

---

## 📌 1. Thông Tin Đề Tài & Dự Thi

- **Tên sản phẩm**: SmartSpend & Meal - Sổ Thu Chi và Thực Đơn Đi Chợ Tuần
- **Nhóm đề tài**: Cá nhân / Đời sống (Tài chính cá nhân & Gia đình)
- **Bảng dự thi**: Bảng Văn phòng
- **Ý tưởng cốt lõi**: Giải quyết triệt để 3 câu hỏi muôn thuở của dân văn phòng: *"Hôm nay ăn gì?"*, *"Đi chợ cần mua những gì?"* và *"Tiền lương tháng này đã chi tiêu đi đâu?"*.

---

## 🎯 2. Mục Tiêu Sản Phẩm (PRD)

1. **Quản lý dòng tiền thông minh**: Theo dõi chi tiết mọi khoản thu nhập và chi tiêu sinh hoạt hàng ngày, hàng tháng với thẻ thống kê trực quan (Tổng Thu, Tổng Chi, Số Dư).
2. **Kế hoạch ăn uống dinh dưỡng & tiết kiệm**: Lập lịch thực đơn cho 7 ngày trong tuần (Thứ Hai ➔ Chủ Nhật) cho cả 3 bữa (Sáng - Trưa - Tối), hạn chế tối đa lãng phí thực phẩm thừa và tiết kiệm đến 30% chi phí ăn uống.
3. **Liên thông & Đồng bộ 1-Click (Cross-Feature Integration)**: Tự động gom nguyên liệu từ thực đơn sang danh sách đi chợ, sau đó hoàn tất chuyến đi chợ bằng nút **"Chốt đi chợ & Ghi vào Sổ Thu Chi"** để ghi nhận tức thì một khoản chi tiêu thực tế vào sổ quỹ.

---

## ✨ 3. Danh Sách Tính Năng Chi Tiết

### 📊 Phần A: Quản Lý Thu Chi (Expense Tracker)
* **3 Thẻ Thống Kê Tài Chính**:
  - `Tổng Thu`: Tự động cộng dồn các khoản lương, thưởng, thu nhập phụ kèm tỷ lệ & icon trực quan.
  - `Tổng Chi Tiêu`: Tổng hợp các khoản chi sinh hoạt, ăn uống, hóa đơn và đi chợ.
  - `Số Dư Hiện Tại`: Thể hiện tình trạng an toàn tài chính trong thẻ nền xanh ngọc sang trọng.
* **Ghi Chép Giao Dịch**: Thêm mới, chỉnh sửa và xóa khoản thu/chi linh hoạt với đầy đủ thông tin (Số tiền VNĐ, Danh mục: Ăn uống, Đi chợ, Tiền nhà, Hóa đơn..., Ngày ghi, Ghi chú).
* **Bộ Lọc & Phân Trang**: Lọc danh sách giao dịch theo *Tất cả*, *Khoản Chi*, *Khoản Thu* và **Khoảng thời gian (Từ ngày - Đến ngày)**. Tích hợp tính năng **Phân trang (Xem thêm)** tối ưu hiệu năng hiển thị.

### 🍱 Phần B: Thực Đơn & Đi Chợ Tuần (Meal & Market Planner)
* **Lên Thực Đơn Tuần Linh Hoạt**:
  - Thanh chọn ngày linh hoạt hỗ trợ **Chuyển Tuần** (Tuần trước, Tuần này, Tuần sau) và nhãn nổi bật "Nay" cho ngày hiện tại.
  - Bổ sung các Visual Indicator (chấm xanh) để dễ dàng nhận biết ngày nào đã có kế hoạch thực đơn.
  - **Khóa dữ liệu quá khứ**: Dữ liệu thực đơn của các ngày đã qua được bảo vệ an toàn (chỉ xem, không cho chỉnh sửa hoặc xóa).
  - Giao diện thêm bữa ăn hoàn toàn tự do (không giới hạn cố định Sáng/Trưa/Tối), cho phép tự đặt tên bữa ăn (VD: Bữa Sáng, Bữa Xế, Bữa Khuya...).
  - **Theo dõi nguyên liệu đã mua**: Quản lý trực tiếp trạng thái "Đã mua" (Tick chọn) trên từng nguyên liệu của thực đơn. Đồng bộ 2 chiều: Đánh dấu ở giỏ hàng sẽ tự động đánh dấu ở thực đơn.
  - Nút **"Thêm món chưa mua vào giỏ"**: Tối ưu hóa việc đi chợ với cơ chế Deduplication. Hệ thống tự động lọc và chỉ thêm các nguyên liệu còn thiếu vào giỏ đi chợ, báo số lượng thêm thành công và bỏ qua những món đã có sẵn trong giỏ hoặc đã được mua.
* **Checklist Đi Chợ Thông Minh**:
  - Ô nhập nhanh nguyên liệu, số lượng (VD: 500g, 2 bó...) và phân loại nhóm hàng (Rau củ, Thịt cá, Gia vị, Trứng sữa, Đồ khô).
  - Checkbox tương tác mượt mà: Tick chọn đổi màu xanh ngọc và tự động gạch ngang chữ (`line-through`).
  - Hỗ trợ chỉnh sửa và xóa từng món hoặc xóa toàn bộ các món đã mua xong.
* **Chốt Hóa Đơn & Chuyển Đổi Chi Tiêu Tự Động**:
  - Ô nhập số tiền thực tế trên hóa đơn đi chợ.
  - Nhấn nút **"Chốt đi chợ & Ghi vào Sổ Thu Chi"** ➔ Tự động tạo 1 giao dịch Chi tiêu "Đi chợ" trong Tab 1, cập nhật lại số dư ví và dọn dẹp các nguyên liệu đã mua.

### ⚙️ Phần C: Cài Đặt (Settings)
* **Tùy chỉnh Giao diện (Theme)**: Cho phép chuyển đổi giữa chế độ Sáng (Light), Tối (Dark) và Tự động theo Hệ thống (System default).
* **Quản lý Danh mục (Categories)**: Hỗ trợ Thêm, Sửa, Xóa danh mục Thu, Chi và Đi chợ. Các danh mục này tự động đồng bộ vào các menu thả xuống trong ứng dụng.
* **Nhật ký hệ thống (Audit Logs)**: Tự động ghi lại các thao tác quan trọng (Thêm, Sửa, Xóa dữ liệu) để dễ dàng theo dõi biến động dữ liệu.
* **Xuất dữ liệu (Export)**: Xuất Lịch sử giao dịch dưới định dạng file CSV chuẩn UTF-8, dễ dàng xem và quản lý trên Excel/Google Sheets.

---

## 🎨 4. Phong Cách Thiết Kế UI/UX

- **Tone màu chủ đạo**: Xanh ngọc / Emerald (`emerald-600`) đại diện cho sự tươi mát của thực phẩm sạch và sự an tâm trong tài chính; kết hợp nền xám dịu (`bg-gray-50`) giảm mỏi mắt.
- **Phong cách**: Clean & Minimalist, card bo góc mềm mại (`rounded-2xl`), đường viền mỏng (`border-gray-100`), bóng đổ nhẹ nhàng (`shadow-xs` ➔ `shadow-md`).
- **Typography**: Phông chữ quốc tế **Plus Jakarta Sans**, hiển thị các con số tiền tệ rõ ràng, dễ đọc.
- **Tối ưu Mobile-First**:
  - Trên máy tính: Menu điều hướng đặt ở Header trên cùng.
  - Trên điện thoại di động: Tự động chuyển thành **Bottom Navigation Bar** cố định ở chân màn hình kèm huy hiệu đếm số lượng giỏ hàng tiện lợi cho việc thao tác 1 tay khi đi chợ.

---

## 🗄️ 5. Thiết Kế Cơ Sở Dữ Liệu (PostgreSQL Database Schema)

Hệ thống được thiết kế theo chuẩn cơ sở dữ liệu quan hệ PostgreSQL (sẵn sàng khởi tạo trực tiếp qua tệp [schema.sql](file:///c:/Users/leduc/Downloads/SmartSpend%20&%20Meal/schema.sql) hoặc kết nối trên Cloud PostgreSQL / Supabase / Neon):

```bash
# Khởi tạo CSDL nhanh chóng bằng psql:
psql -U <username> -d <database_name> -f schema.sql
```

Cấu trúc các bảng cốt lõi trong `schema.sql`:
- **`transactions`**: Quản lý các giao dịch thu, chi, số tiền, ngày giao dịch và phân loại danh mục.
- **`meal_plans`**: Quản lý thực đơn 7 ngày trong tuần (Thứ 2 đến CN), phân loại 3 bữa (Sáng/Trưa/Tối), món chính, món phụ, calo và mảng nguyên liệu (`ingredients TEXT[]`).
- **`grocery_items`**: Quản lý danh sách checklist đi chợ, phân nhóm hàng (Rau củ, Thịt cá, Gia vị...), số lượng và trạng thái đã mua (`is_bought`).


---

## 🔒 6. Tiêu Chuẩn An Toàn & Bảo Mật Dữ Liệu

- **100% Dữ Liệu Mẫu Giả Định (Dummy Data)**: Ứng dụng tuân thủ nghiêm ngặt tiêu chuẩn bảo mật dữ liệu, không lưu trữ thông tin tài chính cá nhân thật, số tài khoản ngân hàng hay dữ liệu nội bộ của bất kỳ tổ chức nào.
- **Client-side Sandbox**: Mã nguồn hoạt động an toàn, có thể đóng gói độc lập hoặc kết nối API có cơ chế xác thực an toàn.

---

## 🚀 7. Hướng Dẫn Cài Đặt & Khởi Chạy Nhanh

### Yêu cầu hệ thống:
- [Node.js](https://nodejs.org/) phiên bản 18 trở lên
- Trình quản lý gói `npm`

### Các bước cài đặt:

1. **Di chuyển vào thư mục dự án**:
   ```bash
   cd "SmartSpend & Meal"
   ```

2. **Cài đặt các thư viện phụ thuộc**:
   ```bash
   npm install
   ```

3. **Khởi chạy môi trường phát triển (Dev Server)**:
3. **Chạy ứng dụng Local**:
   - Khởi chạy Backend API (kết nối PostgreSQL):
     ```bash
     node server/index.js
     ```
   - Khởi chạy Frontend:
     ```bash
     node node_modules/vite/bin/vite.js --port 5173
     ```
   - Mở trình duyệt: `http://localhost:5173/`

4. **Triển khai trên Vibe Host (`vibehost.matbao.ai`)**:
   - Kết nối trực tiếp repository GitHub: `https://github.com/suongtranst1-creator/Smartspend-Meal.git`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - CSDL PostgreSQL nội bộ trên Vibe Host sẽ được máy chủ tự động nhận diện và kết nối trực tiếp (qua biến môi trường `DATABASE_URL`), đồng thời tự động khởi tạo bảng (`Auto-migration`) ngay khi khởi động!

---

## 📁 8. Cấu Trúc Mã Nguồn

```text
SmartSpend & Meal/
├── index.html              # Tệp HTML chính tích hợp Plus Jakarta Sans & Tailwind
├── package.json            # Khai báo phụ thuộc (React 19, Express, pg, Lucide, Vite)
├── vite.config.js          # Cấu hình Vite dev server & proxy API
├── schema.sql              # Cấu trúc CSDL PostgreSQL chuẩn hóa & các chỉ mục (Indexes)
├── .env.example            # Tệp biến môi trường mẫu
├── server/
│   ├── db.js               # Kết nối PostgreSQL Pool, kiểm tra trạng thái & Auto-migration
│   └── index.js            # Máy chủ RESTful API & phục vụ static bundle trên Vibe Host
├── src/
│   ├── main.jsx            # Điểm khởi chạy React DOM
│   └── App.jsx             # Toàn bộ giao diện 3 Tab, logic tương tác & đồng bộ PostgreSQL
└── dist/                   # Bản build tối ưu sẵn sàng deploy trên Vibe Host
```

---

## 🏆 Đóng Góp Dự Thi
* **Đơn vị dự thi**: Bảng Văn phòng
* **Sản phẩm**: SmartSpend & Meal - Sổ Thu Chi và Thực Đơn Đi Chợ Tuần
* **Bản quyền**: © 2026 SmartSpend & Meal. Phát triển với sứ mệnh mang lại cuộc sống tiện nghi, tiết kiệm và lành mạnh cho mọi người.
