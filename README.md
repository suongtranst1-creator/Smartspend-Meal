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
* **Ghi Chép & Quản Lý Giao Dịch Nhanh Chóng & Chi Tiết**:
  - Thêm mới, chỉnh sửa và xóa khoản thu/chi linh hoạt với đầy đủ thông tin: Số tiền (VNĐ), Danh mục (Ăn uống, Tiền nhà, Hóa đơn, Lương...), Ngày ghi, Tiêu đề giao dịch.
  - **Hiển thị mốc thời gian thực tế (`· HH:mm`)**: Lịch sử giao dịch hiển thị rõ ràng ngày tháng kèm giờ phút ghi nhận giao dịch, bố cục co giãn tự động linh hoạt (`flex-wrap`) không bị che khuất ngay cả khi tiêu đề dài hoặc trên màn hình hẹp.
* **Trải Nghiệm Modal & Giao Diện Thân Thiện**:
  - **Khóa cuộn trang nền (Scroll-lock)**: Ngăn ngừa hoàn toàn tình trạng trượt cuộn giao diện nền khi đang mở các bảng Pop-up/Modal thêm sửa giao dịch, món ăn hay cài đặt.
* **Tự Động Định Dạng Ngắt Dấu Hàng Nghìn (Thousand Separator)**:
  - Khi gõ số tiền vào ô `SỐ TIỀN (VNĐ)`, hệ thống **tự động ngắt dấu chấm `.` cứ mỗi 3 chữ số** (ví dụ: gõ `50000` ➔ tự động hiển thị `50.000`, `1000000` ➔ `1.000.000`).
  - Giao diện hiện đại: Tích hợp huy hiệu `VNĐ` trực quan, loại bỏ các nút mũi tên spinner mặc định gây vướng mắt của trình duyệt, hỗ trợ bàn phím số thông minh (`inputMode="numeric"`) trên điện thoại di động.
  - Cơ chế xử lý 2 chiều: Tự động chuẩn hóa thành số nguyên an toàn khi lưu trữ vào CSDL PostgreSQL, đảm bảo các phép tính thu, chi, số dư luôn chính xác tuyệt đối.
* **Bộ Lọc Đa Chiều & Sắp Xếp Nâng Cao (Filter & Sort)**:
  - Lọc danh sách giao dịch theo: *Tất cả*, *Khoản Chi*, *Khoản Thu*.
  - **Bộ Chọn Khoảng Ngày Tinh Gọn 1 Ô Duy Nhất (Unified DateRangePicker)**:
    - Gom 2 ô nhập ngày riêng biệt thành **1 nút bấm duy nhất** cho phép chọn 2 mốc thời gian: *Từ ngày ➔ Đến ngày*.
    - Sau khi chọn 2 ngày, hiển thị gộp theo định dạng chuẩn: `19/09/2026 - 22/09/2026`.
    - **Tô đậm dải ngày liền mạch (Range Highlight Bar)**: Trên lịch tháng, khoảng ngày giữa 2 mốc được tô đậm màu xanh ngọc nối liền mượt mà, giúp người dùng nhận diện ngay phạm vi thời gian đang lọc.
    - Hỗ trợ xem trước khoảng chọn khi rê chuột (Hover Range Preview), các nút chọn nhanh (*Hôm nay*, *7 ngày qua*, *Tháng này*) và nút xóa nhanh `X`.
  - **Sắp xếp linh hoạt (Sort)**: Hỗ trợ 4 chế độ: *Mới nhất (Mặc định)*, *Cũ nhất*, *Số tiền: Cao ➔ Thấp*, *Số tiền: Thấp ➔ Cao*.
  - **Đặt Lại Bộ Lọc Tự Động (Dynamic Reset Filters)**:
    - Loại bỏ nút *"Mặc định"* dư thừa khi ở trạng thái ban đầu, giữ thanh công cụ luôn sạch sẽ, thoáng mắt.
    - Nút **"Đặt lại bộ lọc"** (kèm biểu tượng `RotateCcw`) chỉ tự động xuất hiện khi người dùng đang kích hoạt bộ lọc hoặc sắp xếp khác mặc định, khôi phục mọi thông số về ban đầu chỉ với 1 cú click.
  - Tích hợp tính năng **Phân trang (Xem thêm)** tối ưu tốc độ tải và hiệu năng hiển thị.
* **Xuất Báo Cáo CSV & Lịch Sử Hệ Thống Chuẩn Xác (Export Data)**:
  - Xuất toàn bộ lịch sử giao dịch và nhật ký hệ thống ra tệp CSV định dạng chuẩn UTF-8 (hỗ trợ BOM), mở trực tiếp trên Microsoft Excel hoặc Google Sheets không bị lỗi font tiếng Việt.
  - Cột số tiền định dạng số nguyên chuẩn xác (không bị thừa số thập phân `.00`), thông tin chi tiết nhật ký rõ ràng, trực quan.

---

### 🍱 Phần B: Thực Đơn Tuần & Đi Chợ Thông Minh (Meal & Grocery Planner)
* **Lập Kế Hoạch Thực Đơn Tuần Linh Hoạt**:
  - **Thanh chọn ngày thông minh**: Hỗ trợ chuyển tuần (*Tuần trước*, *Tuần này*, *Tuần sau*) kèm nút bấm nhanh "Nay" về ngày hiện tại.
  - **Chỉ báo trực quan (Visual Dots)**: Chấm xanh hiển thị trên thanh ngày giúp nhận biết ngay ngày nào đã có kế hoạch bữa ăn.
  - **Khóa bảo vệ dữ liệu quá khứ**: Các ngày đã qua được khóa an toàn (chế độ chỉ xem), ngăn chặn vô tình chỉnh sửa thực đơn cũ.
  - **Tự do đặt tên bữa ăn & Tùy chọn Calo linh hoạt**: Không giới hạn cố định, người dùng có thể thêm bất kỳ bữa ăn nào (Bữa Sáng, Bữa Trưa, Bữa Tối, Bữa Xế, Ăn Vặt...) kèm lượng calo ước tính (tùy chọn - không bắt buộc), món chính, món phụ và danh sách nguyên liệu.
* **Kéo Thả Sắp Xếp Thứ Tự Bữa Ăn Trong Ngày (Drag & Drop Reordering)**:
  - **Kéo thả trực tiếp trên thẻ (Direct Card Drag & Drop)**: Người dùng có thể nhấp chuột giữ và kéo thả trực tiếp thẻ bữa ăn để đổi thứ tự linh hoạt (ví dụ: đưa Bữa Trưa lên trước Bữa Tối dù được thêm vào sau).
  - **Hiệu ứng phản hồi mượt mà**: Thẻ đang kéo trở nên trong suốt nhẹ với viền đứt nét; vị trí thả hiển thị vòng viền xanh ngọc (`ring-2 ring-emerald-500`) phóng to nhẹ trực quan.
  - **Tự động lưu thứ tự vào PostgreSQL**: Thứ tự sắp xếp mới được đồng bộ tức thì qua API `PUT /api/meals/reorder` và lưu vào cột `order_index` trong CSDL, đảm bảo thứ tự luôn chuẩn xác khi tải lại trang.
* **Nút "Thêm Bữa Ăn" Tinh Gọn Duy Nhất & Trải Nghiệm Thẻ Nổi Bật**:
  - **Nút Chính Duy Nhất (Primary Action Button)**: Dải màu chuyển Teal - Emerald cao cấp, viền màu teal rõ nét (`border-teal-400/50`), chữ trắng in đậm đặt ngay tại thanh tiêu đề ngày, loại bỏ hoàn toàn các nút thừa để giữ giao diện thông thoáng.
  - **Khoảng trắng & Chiều sâu (Whitespace & Depth)**: Tăng khoảng cách lưới thẻ (`gap-6 lg:gap-7`), đệm lót rộng rãi (`p-6`) và hiệu ứng đổ bóng mềm mại (`shadow-[0_8px_30px_rgb(0,0,0,0.06)]`) tạo cảm giác thẻ đang nổi lên êm ái.
  - **Phân biệt 'Đã mua' vs 'Cần mua' trực quan**: Icon giỏ hàng nhỏ màu xám nhạt (`ShoppingCart`) cho món cần mua và tick xanh lá cây đậm (`bg-emerald-600`) cho món đã mua kèm gạch mờ và huy hiệu rõ ràng.
  - **Tương tác "Đã mua đủ" hoàn tất**: Tự động chuyển đổi nút sang màu xanh lá cây đậm sang trọng với icon `CheckCircle2` khi toàn bộ nguyên liệu hoàn thành.
  - **Hộp Mẹo Cách Điệu (Smart Tip Box)**: Nâng cấp biểu tượng bóng đèn (`Lightbulb`) vàng ấm và viền bo cong mềm mại `rounded-3xl` tích hợp hài hòa vào bố cục.
* **Đồng Bộ Nguyên Liệu Giữa Thực Đơn & Giỏ Đi Chợ (Thông Minh & Thực Tế)**:
  - **Tự động loại bỏ món đã có sẵn ra khỏi Giỏ Đi Chợ**: Khi người dùng đánh dấu nguyên liệu đã có sẵn / đã chuẩn bị ở Thực Đơn Tuần (Tab 2), hệ thống sẽ **tự động loại bỏ hoàn toàn món đó ra khỏi giỏ hàng Đi Chợ (Tab 3)** (xóa khỏi danh sách và CSDL thay vì để gạch ngang), đảm bảo giỏ hàng chỉ tập trung vào những thứ cần đi mua và số lượng đếm trên huy hiệu menu luôn chuẩn xác. Nếu bỏ tick ở Thực Đơn, nguyên liệu sẽ tự động được thêm lại vào giỏ.
  - **Theo dõi nguyên liệu 2 chiều**: Đánh dấu mua sắm tại Tab Đi Chợ cũng tự động liên thông đồng bộ với trạng thái nguyên liệu trên thẻ Thực Đơn.
  - **Nút "Thêm món chưa mua vào giỏ"**: Tự động lọc các nguyên liệu còn thiếu và chuyển vào giỏ đi chợ, tích hợp cơ chế Deduplication (bỏ qua những món đã có trong giỏ hoặc đã có sẵn).
* **Cải Tiến Nhãn Món Đi Chợ (Gán Tên Bữa Ăn & Ngày Cụ Thể)**:
  - Loại bỏ hoàn toàn chữ *"Theo khẩu phần"* chung chung.
  - Thay thế bằng **tên bữa ăn cụ thể kèm ngày tháng** (ví dụ: `Bữa Trưa 24/09`, `Bữa Tối 21/09`), giúp người dùng nhận biết tức thì nguyên liệu này được mua cho bữa ăn nào.
  - Tự động ẩn huy hiệu trùng lặp ngày khi nhãn số lượng đã hiển thị ngày tháng, giữ giao diện luôn gọn gàng và dễ nhìn.
* **Tự Động Bỏ Qua Món Thực Đơn Quá Hạn Chưa Mua (Auto-Skip Expired Items)**:
  - Khi một ngày thực đơn đã trôi qua (`plan_date < hôm nay`), bất kỳ nguyên liệu nào thuộc thực đơn ngày đó mà **chưa mua** (`is_bought = false`) sẽ **tự động được bỏ qua / loại bỏ hoàn toàn khỏi Danh sách đi chợ**, giữ cho giỏ hàng luôn sạch sẽ, không bị tồn đọng nguyên liệu của các ngày cũ.
  - Trên thẻ thực đơn của ngày quá khứ, các nguyên liệu chưa mua được gắn nhãn `Đã bỏ qua` màu vàng cam rõ ràng, trực quan.
  - Các món **đã mua** (`is_bought = true`) vẫn được giữ lại đầy đủ để bạn đối chiếu và thanh toán hóa đơn.
* **Checklist Đi Chợ Tinh Gọn (Streamlined Grocery Checklist)**:
  - **Sắp xếp thông minh từ bữa gần nhất tới xa nhất**: Các nguyên liệu trong giỏ tự động xếp theo thứ tự ngày thực đơn tăng dần (22/09 -> 23/09 -> ...), kết hợp thứ tự bữa trong ngày (Sáng -> Trưa -> Tối). Món chưa mua được xếp lên trước, món đã mua gom xuống dưới giúp người dùng theo dõi mạch lạc.
  - **Form thêm nhanh tối giản**: Chỉ gồm ô nhập *Tên nguyên liệu* và *Số lượng* (VD: 500g, 2 bó), loại bỏ các bước chọn phân loại rườm rà giúp việc ghi chép đi chợ nhanh hơn bao giờ hết.
  - **Tương tác mượt mà**: Checkbox tick chọn chuyển màu xanh ngọc kèm hiệu ứng gạch ngang (`line-through`).
  - **Thống kê tiến độ mua sắm**: Thanh trạng thái hiển thị `X / Y đã mua` kèm huy hiệu số lượng trên menu điều hướng.
  - **Dọn dẹp nhanh**: Hỗ trợ nút *"Xóa món đã mua"* để dọn sạch các món đã hoàn thành khỏi giao diện và CSDL.
* **Chốt Sổ Hóa Đơn 1-Click (Finalize & Sync to Wallet)**:
  - **Nút hành động nổi bật (Glow CTA Button)**: Nút "Chốt hóa đơn & Ghi sổ" tinh gọn nhãn, trang bị hiệu ứng đổ bóng mờ (Glow Shadow) màu xanh ngọc sang trọng và hiệu ứng nâng nhẹ khi rê chuột.
  - Nhập tổng số tiền thực tế trên hóa đơn đi chợ với tính năng **tự động ngắt dấu chấm hàng nghìn** (VD: `350.000`).
  - Nhấn nút **"Chốt hóa đơn & Ghi sổ"** ➔ Tự động sinh ra 1 khoản chi tiêu `Đi chợ` bên Tab 1, cập nhật lại số dư ví và dọn dẹp các món đã mua trong giỏ hàng.
  - **Hộp thông tin đồng bộ**: Nền xanh ngọc nhạt êm dịu, viền bo tròn mềm mại `rounded-3xl` và icon dấu chấm than xanh thương hiệu.

---

### ⚙️ Phần C: Cài Đặt & Quản Trị Hệ Thống (Settings & System)
* **Khối "Dữ Liệu & Hệ Thống" Hợp Nhất**:
  - Tích hợp 2 tính năng *Xuất Lịch Sử Giao Dịch* và *Nhật Ký Hệ Thống (Logs)* vào 1 thẻ lớn duy nhất với 2 hàng độc lập, giúp giao diện thông thoáng, ngăn nắp.
  - **Thống nhất màu sắc**: Chuyển đổi toàn bộ nút xuất CSV sang tông màu xanh ngọc (Emerald/Teal) chủ đạo của thương hiệu.
  - **Phân cấp nút bấm rõ ràng**: Dùng nút viền (Outlined Button) màu xanh ngọc gọn gàng cho các tác vụ tải CSV phụ, và nút đặc (Solid Gradient Button) nổi bật cho tác vụ chính "+ Thêm" danh mục.
* **Quản Lý Danh Mục Trực Quan Với Color Coding**:
  - Thêm vạch màu viền trái nổi bật cho mỗi dòng danh mục: **vạch đỏ (`border-l-rose-500`)** cho Khoản Chi (Expense) và **vạch xanh lá (`border-l-emerald-500`)** cho Khoản Thu (Income), giúp người dùng phân loại tức thì bằng mắt.
* **Đồng Bộ Giao Diện Dark / Light Mode Toàn Diện**:
  - Chuyển đổi linh hoạt giữa 3 chế độ: **Sáng (Light)**, **Tối (Dark)** và **Tự động theo hệ điều hành (System default)**. Cài đặt được lưu trữ bền vững tại `localStorage`.
  - **Đồng bộ 100% diện tích ứng dụng**: Bao phủ hoàn chỉnh Header, thanh điều hướng, 4 tab chức năng, 3 popup modal và thanh điều hướng di động.
  - **Nút chuyển nhanh Dark/Light Mode ngay trên Header**: Icon Mặt Trời / Mặt Trăng đặt ngay trên thanh điều hướng chính, cho phép chuyển đổi chế độ giao diện tức thì từ bất kỳ màn hình nào chỉ với 1 cú click.
  - **Chống nhấp nháy sáng (FOUC Prevention)**: Nhận diện theme bằng script inline trong `<head>` trước khi nạp DOM, đảm bảo trải nghiệm êm dịu mắt khi tải lại trang.
* **Chỉ Báo Trạng Thái Kết Nối Tinh Gọn (Online Status Dot)**:
  - Hiển thị chấm tròn phát sáng siêu nhỏ gọn trên thanh Header. Khi rê chuột (hover), tooltip hiển thị trực quan và tối giản đúng 2 trạng thái: **`Đã kết nối`** hoặc **`Không thể kết nối`**, không gây rối mắt hay chiếm dụng không gian.

---

## 🎨 4. Phong Cách Thiết Kế UI/UX Cao Cấp

- **Tone màu chủ đạo**: Xanh ngọc / Emerald (`emerald-600`) đại diện cho sự tươi mát của thực phẩm sạch và sự an tâm trong tài chính; kết hợp nền xám dịu (`bg-gray-50`) giảm mỏi mắt.
- **Thẻ Số Dư Hiện Tại Gradient Sang Trọng**: Sử dụng dải màu chuyển từ Xanh ngọc (Teal) sang Xanh lá cây thẫm (`from-teal-600 via-emerald-700 to-emerald-950`), kết hợp viền sáng phản chiếu mỏng tạo vẻ ngoài cao cấp và đẳng cấp cho thẻ tài chính trung tâm.
- **Biểu Đồ Đường Kẻ Mờ (Sparklines)**: Tích hợp đồ thị xu hướng SVG dạng đường kẻ uốn lượn mờ phía sau các con số ở thẻ Tổng Thu (xu hướng tăng trưởng) và thẻ Tổng Chi (xu hướng biến thiên), tạo cảm giác phân tích dữ liệu chuyên nghiệp.
- **Định Vị Tab Rõ Nét (Active Tab Indicator)**: Tab đang kích hoạt được làm nổi bật với chữ in đậm (`font-bold text-emerald-800 dark:text-emerald-300`) kết hợp đường gạch chân màu xanh ngọc rõ nét (`h-[3px] bg-emerald-600 dark:bg-emerald-400 rounded-full`), giúp người dùng nhận biết ngay lập tức trang mình đang xem.
- **Đổ Bóng Mềm Mại & Chiều Sâu (Soft Diffused Drop-Shadow)**: Áp dụng hiệu ứng bề mặt nổi êm dịu (`shadow-[0_8px_30px_rgb(0,0,0,0.06)]`) kết hợp hiệu ứng vi dịch chuyển khi rê chuột (`hover:-translate-y-0.5`).
- **Typography & Nhận Diện Thương Hiệu**: Phông chữ quốc tế **Plus Jakarta Sans** đồng bộ logo thương hiệu sắc nét (`Logo.png`) tại Favicon trình duyệt và Header ứng dụng.
- **Tối ưu Mobile-First**:
  - **Trên Desktop**: Menu điều hướng đặt ở Header trên cùng, hiển thị đầy đủ các cột và bảng phân tích.
  - **Trên Mobile / Tablet**: Tự động chuyển thành **Bottom Navigation Bar** cố định ở chân màn hình kèm huy hiệu đếm giỏ hàng tiện lợi khi thao tác bằng 1 tay trong lúc đi chợ.
  - **Chống vỡ layout và nhảy dòng (Responsive Layout Protection)**: Bổ sung các cơ chế `whitespace-nowrap tabular-nums shrink-0`, cắt ngắn văn bản dài `truncate min-w-0 flex-1` và căn chỉnh tỷ lệ icon/nút bấm giúp hàng giao dịch và giỏ đi chợ hiển thị gọn gàng, liền mạch không bị rớt dấu tiền tệ hay ngắt chữ theo chiều dọc trên các dòng điện thoại màn hình nhỏ (< 380px).

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
├── Logo.png                # Logo thương hiệu gốc độ phân giải cao
├── public/
│   └── Logo.png            # Logo phục vụ tĩnh cho Header, Favicon & bản build Vite
├── index.html              # Tệp HTML chính tích hợp Plus Jakarta Sans, Favicon & theme loader
├── package.json            # Khai báo phụ thuộc (React 19, Express, pg, Lucide React, Vite)
├── vite.config.js          # Cấu hình Vite dev server & proxy API (/api -> localhost:5000)
├── schema.sql              # Cấu trúc CSDL PostgreSQL chuẩn hóa & các chỉ mục (Indexes)
├── DAILY_NOTES.txt         # Nhật ký theo dõi tiến độ và lịch sử công việc theo từng ngày
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
