# 🌿 SmartSpend & Meal - Sổ Thu Chi và Thực Đơn Đi Chợ Tuần

> **Giải pháp ứng dụng web thông minh kết hợp quản lý tài chính cá nhân và kế hoạch ăn uống, đi chợ khoa học trong tuần dành cho dân văn phòng & gia đình hiện đại.**

[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/CSS-Tailwind%20CSS-38bdf8.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
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

1. **Quản lý dòng tiền thông minh**: Theo dõi chi tiết mọi khoản thu nhập và chi tiêu sinh hoạt hàng ngày, hàng tháng với 3 thẻ thống kê trực quan (Tổng Thu, Tổng Chi, Số Dư).
2. **Kế hoạch ăn uống dinh dưỡng & tiết kiệm**: Lập lịch thực đơn cho 7 ngày trong tuần (Thứ Hai ➔ Chủ Nhật) linh hoạt các bữa (Sáng - Trưa - Tối - Phụ), hạn chế tối đa lãng phí thực phẩm thừa và tiết kiệm đến 30% chi phí ăn uống.
3. **Liên thông & Đồng bộ 1-Click (Cross-Feature Integration)**: Tự động gom nguyên liệu từ thực đơn sang danh sách đi chợ, sau đó hoàn tất chuyến đi chợ bằng nút **"Chốt đi chợ & Ghi vào Sổ Thu Chi"** để tự động tạo một giao dịch Chi tiêu thực tế vào sổ quỹ.

---

## ✨ 3. Danh Sách Tính Năng Chi Tiết

### 📊 Phần A: Quản Lý Thu Chi (Expense Tracker)
* **3 Thẻ Thống Kê Tài Chính Trực Quan**:
  - `Tổng Thu`: Tự động cộng dồn các khoản lương, thưởng, thu nhập phụ kèm tỷ lệ & biểu tượng trực quan.
  - `Tổng Chi Tiêu`: Tổng hợp toàn bộ các khoản chi sinh hoạt, ăn uống, hóa đơn và đi chợ.
  - `Số Dư Hiện Tại`: Thể hiện tình trạng tài chính an toàn trong thẻ nền xanh ngọc sang trọng.
* **Ghi Chép & Quản Lý Giao Dịch**:
  - Thêm mới, chỉnh sửa và xóa khoản thu/chi linh hoạt với đầy đủ thông tin: Số tiền (VNĐ), Danh mục (Ăn uống, Tiền nhà, Hóa đơn, Lương...), Ngày ghi, Tiêu đề giao dịch.
* **Bộ Lọc Đa Chiều & Phân Trang**:
  - Lọc danh sách giao dịch theo: *Tất cả*, *Khoản Chi*, *Khoản Thu*.
  - Lọc theo **Khoảng thời gian (Từ ngày ➔ Đến ngày)**.
  - Tích hợp tính năng **Phân trang (Xem thêm)** tối ưu tốc độ tải và hiệu năng hiển thị.
* **Xuất Báo Cáo CSV (Export Data)**:
  - Xuất toàn bộ lịch sử giao dịch ra tệp CSV định dạng chuẩn UTF-8 (hỗ trợ BOM), mở trực tiếp trên Microsoft Excel hoặc Google Sheets không bị lỗi font tiếng Việt.

---

### 🍱 Phần B: Thực Đơn Tuần & Đi Chợ Thông Minh (Meal & Grocery Planner)
* **Lập Kế Hoạch Thực Đơn Tuần Linh Hoạt**:
  - **Thanh chọn ngày thông minh**: Hỗ trợ chuyển tuần (*Tuần trước*, *Tuần này*, *Tuần sau*) kèm nút bấm nhanh "Nay" về ngày hiện tại.
  - **Chỉ báo trực quan (Visual Dots)**: Chấm xanh hiển thị trên thanh ngày giúp nhận biết ngay ngày nào đã có kế hoạch bữa ăn.
  - **Khóa bảo vệ dữ liệu quá khứ**: Các ngày đã qua được khóa an toàn (chế độ chỉ xem), ngăn chặn vô tình chỉnh sửa thực đơn cũ.
  - **Tự do đặt tên bữa ăn**: Không giới hạn cố định, người dùng có thể thêm bất kỳ bữa ăn nào (Bữa Sáng, Bữa Trưa, Bữa Tối, Bữa Xế, Ăn Vặt...) kèm lượng calo, món chính, món phụ và danh sách nguyên liệu.
* **Đồng Bộ Nguyên Liệu Giữa Thực Đơn & Giỏ Đi Chợ**:
  - **Theo dõi nguyên liệu đã mua 2 chiều**: Có thể đánh dấu đã mua trực tiếp ngay trên thẻ thực đơn hoặc từ danh sách đi chợ, hệ thống tự động đồng bộ trạng thái giữa 2 tab theo đúng ngày.
  - **Nút "Thêm món chưa mua vào giỏ"**: Tự động lọc các nguyên liệu còn thiếu và chuyển vào giỏ đi chợ kèm nhãn ngày (`plan_date`), tích hợp cơ chế Deduplication (bỏ qua những món đã có trong giỏ hoặc đã mua).
* **Tự Động Bỏ Qua Món Thực Đơn Quá Hạn Chưa Mua (Auto-Skip Expired Items)**:
  - Khi một ngày thực đơn đã trôi qua (`plan_date < hôm nay`), bất kỳ nguyên liệu nào thuộc thực đơn ngày đó mà **chưa mua** (`is_bought = false`) sẽ **tự động được bỏ qua / loại bỏ hoàn toàn khỏi Danh sách đi chợ**, giữ cho giỏ hàng luôn gọn gàng và không tồn đọng nguyên liệu của các ngày đã qua.
  - Trên thẻ thực đơn của ngày quá khứ, các nguyên liệu chưa mua được gắn nhãn `Đã bỏ qua` màu vàng cam rõ ràng, trực quan.
  - Các món **đã mua** (`is_bought = true`) vẫn được giữ lại đầy đủ để bạn đối chiếu và thanh toán.
* **Checklist Đi Chợ Tinh Gọn (Streamlined Grocery Checklist)**:
  - **Form thêm nhanh tối giản**: Chỉ gồm ô nhập *Tên nguyên liệu* và *Số lượng* (VD: 500g, 2 bó), loại bỏ các bước chọn phân loại rườm rà giúp việc ghi chép đi chợ nhanh hơn bao giờ hết.
  - **Gắn nhãn ngày thực đơn**: Món nào được gom từ thực đơn sẽ hiển thị nhãn `Thực đơn DD/MM/YYYY` để dễ dàng tra cứu nguồn gốc.
  - **Tương tác mượt mà**: Checkbox tick chọn chuyển màu xanh ngọc kèm hiệu ứng gạch ngang (`line-through`).
  - **Thống kê tiến độ mua sắm**: Thanh trạng thái hiển thị `X / Y đã mua` kèm huy hiệu số lượng trên menu điều hướng.
  - **Dọn dẹp nhanh**: Hỗ trợ nút *"Xóa món đã mua"* để dọn sạch các món đã hoàn thành.
* **Chốt Sổ Hóa Đơn 1-Click (Finalize & Sync to Wallet)**:
  - Nhập tổng số tiền thực tế trên hóa đơn đi chợ.
  - Nhấn nút **"Chốt đi chợ & Ghi vào Sổ Thu Chi"** ➔ Tự động sinh ra 1 khoản chi tiêu `Đi chợ` bên Tab 1, cập nhật lại số dư ví và dọn dẹp các món đã mua trong giỏ hàng.

---

### ⚙️ Phần C: Cài Đặt & Quản Trị Hệ Thống (Settings & System)
* **Tùy Chỉnh Giao Diện (Theme Mode)**:
  - Chuyển đổi linh hoạt giữa 3 chế độ: **Sáng (Light)**, **Tối (Dark)** và **Tự động theo hệ điều hành (System default)**. Cài đặt được lưu trữ bền vững tại `localStorage`.
* **Quản Lý Danh Mục Tùy Biến (Categories)**:
  - Hỗ trợ thêm và xóa các danh mục thu, chi theo thói quen cá nhân. Danh mục cập nhật tức thì vào các menu thả xuống trong toàn bộ ứng dụng.
* **Nhật Ký Hoạt Động Hệ Thống (Audit Logs)**:
  - Tự động ghi nhận mọi thao tác quan trọng (Thêm, Sửa, Xóa giao dịch, thực đơn, đi chợ, danh mục) kèm thời gian chi tiết, hỗ trợ người dùng rà soát biến động dữ liệu.
* **Chỉ Báo Trạng Thái Kết Nối CSDL (DB Health Indicator)**:
  - Hiển thị trực quan trạng thái kết nối PostgreSQL (`PostgreSQL: Đã kết nối` / `Sẵn sàng`) ngay trên thanh Header.
* **Tự Động Khởi Tạo & Di Trú Cấu Trúc (Auto-migration)**:
  - Máy chủ tự động kiểm tra, khởi tạo bảng và nâng cấp các cột CSDL mới (`plan_date`, khóa chính `id SERIAL` cho nhật ký...) mà không cần can thiệp thủ công.

---

## 🎨 4. Phong Cách Thiết Kế UI/UX

- **Tone màu chủ đạo**: Xanh ngọc / Emerald (`emerald-600`) đại diện cho sự tươi mát của thực phẩm sạch và sự an tâm trong tài chính; kết hợp nền xám dịu (`bg-gray-50`) giảm mỏi mắt.
- **Phong cách**: Clean & Modern, card bo góc mềm mại (`rounded-2xl`), đường viền siêu mỏng (`border-gray-100`), đổ bóng nhẹ nhàng (`shadow-xs` ➔ `shadow-md`).
- **Typography**: Phông chữ quốc tế **Plus Jakarta Sans**, hiển thị các con số tiền tệ và tiếng Việt rõ ràng, sắc nét.
- **Tối ưu Mobile-First**:
  - **Trên Desktop**: Menu điều hướng đặt ở Header trên cùng, hiển thị đầy đủ các cột và bảng phân tích.
  - **Trên Mobile / Tablet**: Tự động chuyển thành **Bottom Navigation Bar** cố định ở chân màn hình kèm huy hiệu đếm giỏ hàng tiện lợi khi thao tác bằng 1 tay trong lúc đi chợ.

---

## 🗄️ 5. Thiết Kế Cơ Sở Dữ Liệu (PostgreSQL Schema)

Hệ thống được thiết kế theo chuẩn cơ sở dữ liệu quan hệ PostgreSQL (tệp [schema.sql](file:///c:/Users/leduc/Downloads/SmartSpend%20&%20Meal/schema.sql)):

```bash
# Khởi tạo CSDL nhanh chóng bằng psql (nếu cần):
psql -U <username> -d <database_name> -f schema.sql
```

### Các bảng dữ liệu cốt lõi:
1. **`transactions`**: Lưu trữ lịch sử thu, chi, số tiền, danh mục, ngày giao dịch và ghi chú.
2. **`meal_plans`**: Lưu trữ thực đơn theo ngày (`plan_date`), tên bữa ăn, món chính, món phụ, calories và mảng nguyên liệu JSONB (`[{ name, isBought }]`).
3. **`grocery_items`**: Lưu danh sách đi chợ, tên món, số lượng, trạng thái đã mua (`is_bought`), ngày thực đơn liên kết (`plan_date`) và thời gian tạo.
4. **`categories`**: Danh mục tùy chỉnh phân loại `income` (Thu) và `expense` (Chi).
5. **`system_logs`**: Nhật ký ghi vết kiểm toán hệ thống (`id SERIAL`, `action`, `entity_type`, `entity_name`, `created_at`).

---

## 🔒 6. Tiêu Chuẩn An Toàn & Bảo Mật Dữ Liệu

- **100% Dữ Liệu Mẫu Giả Định (Dummy Data)**: Ứng dụng tuân thủ nghiêm ngặt tiêu chuẩn bảo mật dữ liệu, không lưu trữ thông tin tài chính cá nhân thật, số tài khoản ngân hàng hay dữ liệu nội bộ của bất kỳ tổ chức nào.
- **Bảo mật tệp môi trường**: Tệp cấu hình chứa mật khẩu CSDL (`.env`) được đưa vào `.gitignore` nghiêm ngặt, chỉ chia sẻ cấu trúc mẫu qua `.env.example`.
- **Client-side Sandbox & SQL Injection Safe**: Toàn bộ truy vấn CSDL đều sử dụng Parameterized Query (`$1, $2, $3...`) ngăn ngừa tuyệt đối nguy cơ SQL Injection.

---

## 🚀 7. Hướng Dẫn Cài Đặt & Khởi Chạy Nhanh

### Yêu cầu hệ thống:
- [Node.js](https://nodejs.org/) phiên bản 18 trở lên
- Trình quản lý gói `npm`
- Cơ sở dữ liệu PostgreSQL (local hoặc cloud)

### Các bước khởi chạy:

1. **Cài đặt thư viện phụ thuộc**:
   ```bash
   npm install
   ```

2. **Cấu hình môi trường**:
   Tạo tệp `.env` dựa theo `.env.example`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=smartspend_meal_db
   PORT=5000
   ```

3. **Chạy ứng dụng Local**:
   - **Khởi chạy Backend API**:
     ```bash
     npm run server
     # hoặc: node server/index.js
     ```
   - **Khởi chạy Frontend Dev Server**:
     ```bash
     npm run dev
     ```
   - Truy cập giao diện ứng dụng tại: `http://localhost:5173/`

4. **Triển khai trên Vibe Host (`vibehost.matbao.ai`) hoặc Cloud**:
   - Kết nối repository GitHub: `https://github.com/suongtranst1-creator/Smartspend-Meal.git`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - CSDL PostgreSQL nội bộ trên máy chủ sẽ được nhận diện tự động qua biến môi trường `DATABASE_URL` và tự động Auto-migration cấu trúc bảng ngay khi ứng dụng khởi chạy!

---

## 📁 8. Cấu Trúc Mã Nguồn

```text
SmartSpend & Meal/
├── index.html              # Tệp HTML chính tích hợp Plus Jakarta Sans
├── package.json            # Khai báo phụ thuộc (React 19, Express, pg, Lucide React, Vite)
├── vite.config.js          # Cấu hình Vite dev server & proxy API (/api -> localhost:5000)
├── schema.sql              # Cấu trúc CSDL PostgreSQL chuẩn hóa & các chỉ mục (Indexes)
├── .env.example            # Tệp biến môi trường mẫu
├── server/
│   ├── db.js               # Kết nối PostgreSQL Pool, kiểm tra trạng thái & Auto-migration
│   └── index.js            # RESTful API (Thu chi, Thực đơn, Đi chợ, Danh mục, Logs)
├── src/
│   ├── main.jsx            # Điểm khởi chạy React DOM
│   └── App.jsx             # Toàn bộ giao diện 3 Tab chính + Cài đặt & đồng bộ CSDL
└── dist/                   # Bản build tối ưu sẵn sàng deploy lên môi trường Production
```

---

## 🏆 Đóng Góp Dự Thi
* **Đơn vị dự thi**: Bảng Văn phòng
* **Sản phẩm**: SmartSpend & Meal - Sổ Thu Chi và Thực Đơn Đi Chợ Tuần
* **Bản quyền**: © 2026 SmartSpend & Meal. Phát triển với sứ mệnh mang lại cuộc sống tiện nghi, tiết kiệm và lành mạnh cho mọi người.
