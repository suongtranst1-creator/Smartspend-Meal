# 🌿 SmartSpend & Meal - Sổ Thu Chi và Thực Đơn Đi Chợ Tuần

> **Giải pháp ứng dụng web thông minh kết hợp quản lý tài chính cá nhân, kế hoạch ăn uống khoa học, quản lý công thức món mẫu và đồng bộ giỏ đi chợ dành cho dân văn phòng & gia đình hiện đại.**

[![React](https://img.shields.io/badge/Frontend-React%2019-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/CSS-Tailwind%20CSS-38bdf8.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%206-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Google OAuth](https://img.shields.io/badge/Auth-Google%20OAuth%202.0-4285F4.svg?style=flat-square&logo=google)](https://developers.google.com/identity)
[![Status](https://img.shields.io/badge/B%E1%BA%A3ng%20d%E1%BB%B1%20thi-B%E1%BA%A3ng%20V%C4%83n%20ph%C3%B2ng-059669.svg?style=flat-square)](#)

---

## 📌 1. Thông Tin Đề Tài & Dự Thi

- **Tên sản phẩm**: SmartSpend & Meal - Sổ Thu Chi và Thực Đơn Đi Chợ Tuần
- **Nhóm đề tài**: Cá nhân / Đời sống (Tài chính cá nhân & Gia đình)
- **Bảng dự thi**: Bảng Văn phòng
- **Ý tưởng cốt lõi**: Giải quyết triệt để 3 câu hỏi muôn thuở của dân văn phòng & gia đình: *"Hôm nay ăn gì?"*, *"Đi chợ cần mua những gì?"* và *"Tiền lương tháng này đã chi tiêu đi đâu?"*.
- **Kho lưu trữ chính thức**: [https://github.com/suongtranst1-creator/Smartspend-Meal.git](https://github.com/suongtranst1-creator/Smartspend-Meal.git)

---

## 🎯 2. Mục Tiêu Sản Phẩm (PRD)

1. **Quản lý dòng tiền thông minh**: Theo dõi chi tiết mọi khoản thu nhập và chi tiêu sinh hoạt hàng ngày, hàng tháng với 3 thẻ thống kê trực quan (Tổng Thu, Tổng Chi, Số Dư).
2. **Kế hoạch ăn uống dinh dưỡng & tiết kiệm**: Lập lịch thực đơn 7 ngày trong tuần (Thứ Hai ➔ Chủ Nhật) linh hoạt các bữa (Sáng - Trưa - Tối - Phụ), hạn chế tối đa lãng phí thực phẩm thừa và tiết kiệm đến 30% chi phí sinh hoạt.
3. **Thư viện món mẫu & Công thức định lượng**: Cung cấp sẵn kho món ăn gia đình quen thuộc, cho phép người dùng tự định nghĩa công thức món mẫu và nguyên liệu để điền nhanh vào thực đơn tuần.
4. **Thuật toán gộp định lượng thông minh**: Tự động nhận diện và cộng dồn định lượng nguyên liệu trùng lặp khi nấu nhiều món cùng lúc (ví dụ: cùng dùng trứng, thịt, hành lá).
5. **Liên thông & Đồng bộ 1-Click (Cross-Feature Integration)**: Tự động gom nguyên liệu từ thực đơn sang danh sách đi chợ, sau đó hoàn tất chuyến đi chợ bằng nút **"Chốt hóa đơn & Ghi sổ"** để tự động tạo một giao dịch Chi tiêu thực tế vào sổ quỹ.
6. **Đăng nhập Google OAuth 2.0 & Phân vùng dữ liệu biệt lập (Per-Client Data Isolation)**: Đăng nhập an toàn không cần mật khẩu, dữ liệu của từng người dùng được phân tách và bảo vệ độc lập tuyệt đối.

---

## ✨ 3. Danh Sách Tính Năng Chi Tiết

### 📊 Phần A: Quản Lý Thu Chi (Expense Tracker)
* **3 Thẻ Thống Kê Tài Chính Trực Quan**:
  - `Tổng Thu`: Tự động cộng dồn các khoản lương, thưởng, thu nhập phụ kèm tỷ lệ & biểu đồ tăng trưởng (Sparkline).
  - `Tổng Chi Tiêu`: Tổng hợp toàn bộ các khoản chi sinh hoạt, ăn uống, hóa đơn và đi chợ kèm đồ thị biến thiên.
  - `Số Dư Hiện Tại`: Thể hiện tình trạng tài chính an toàn trong thẻ dải chuyển màu xanh ngọc (Teal - Emerald) sang trọng.
* **Chế Độ Ẩn / Hiện Số Tiền Riêng Tư (Mask/Unmask Balance, Income & Expense)**:
  - Tích hợp biểu tượng con mắt (`Eye` / `EyeOff`) ngay bên cạnh tiêu đề **"Số Dư Hiện Tại"**.
  - Cho phép người dùng linh hoạt ẩn hoặc hiện số tiền chỉ với 1 cú click: Khi kích hoạt, đồng loạt **Số Dư Hiện Tại**, **Tổng Thu** và **Tổng Chi** được bảo mật hiển thị dạng `•••••••• đ`, tránh để lộ thông tin tài chính cá nhân ở nơi công cộng hoặc chốn văn phòng.
  - Tự động ghi nhớ trạng thái ẩn/hiện qua `localStorage`, duy trì liên tục và mượt mà giữa các phiên truy cập.
* **Ghi Chép & Quản Lý Giao Dịch Nhanh Chóng & Chi Tiết**:
  - Thêm mới, chỉnh sửa và xóa khoản thu/chi linh hoạt với đầy đủ thông tin: Số tiền (VNĐ), Danh mục (Ăn uống, Tiền nhà, Hóa đơn, Lương...), Ngày ghi, Tiêu đề giao dịch.
  - **Hiển thị mốc thời gian thực tế (`· HH:mm`)**: Lịch sử giao dịch hiển thị rõ ràng ngày tháng kèm giờ phút ghi nhận giao dịch, bố cục co giãn tự động linh hoạt (`flex-wrap`) không bị che khuất ngay cả khi tiêu đề dài hoặc trên màn hình hẹp.
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
  - **Đặt Lại Bộ Lọc Tự Động & Êm Ái (Silent Reset Filters)**:
    - Nút **"Đặt lại bộ lọc"** (kèm biểu tượng `RotateCcw`) chỉ tự động xuất hiện khi người dùng đang kích hoạt bộ lọc hoặc sắp xếp khác mặc định, khôi phục mọi thông số về ban đầu chỉ với 1 cú click mà không gây gián đoạn hay hiện popup thông báo không cần thiết.
* **Xuất Báo Cáo CSV & Lịch Sử Hệ Thống Chuẩn Xác (Export Data)**:
  - Xuất toàn bộ lịch sử giao dịch và nhật ký hệ thống ra tệp CSV định dạng chuẩn UTF-8 (hỗ trợ BOM), mở trực tiếp trên Microsoft Excel hoặc Google Sheets không bị lỗi font tiếng Việt.
  - Cột số tiền định dạng số nguyên chuẩn xác (không bị thừa số thập phân `.00`), thông tin chi tiết nhật ký rõ ràng, trực quan.

---

### 🍱 Phần B: Thực Đơn Tuần & Đi Chợ Thông Minh (Meal & Grocery Planner)
* **Lập Kế Hoạch Thực Đơn Tuần Linh Hoạt**:
  - **Thanh chọn ngày thông minh**: Hỗ trợ chuyển tuần (*Tuần trước*, *Tuần này*, *Tuần sau*) kèm nút bấm nhanh "Nay" về ngày hiện tại.
  - **Chỉ báo trực quan (Visual Dots)**: Chấm xanh hiển thị trên thanh ngày giúp nhận biết ngay ngày nào đã có kế hoạch bữa ăn.
  - **Khóa bảo vệ dữ liệu quá khứ**: Các ngày đã qua được khóa an toàn (chế độ chỉ xem), ngăn chặn vô tình chỉnh sửa thực đơn cũ.
  - **Tự do đặt tên bữa ăn & Tùy chọn Calo linh hoạt**: Thêm bất kỳ bữa ăn nào (Bữa Sáng, Bữa Trưa, Bữa Tối, Bữa Xế...) kèm lượng calo ước tính (tùy chọn - không bắt buộc), món chính, món phụ và danh sách nguyên liệu.
* **Gợi Ý Chọn Nhanh Món Ăn Mẫu (Preset Dishes Integration)**:
  - **Dropdown Món chính**: Chỉ hiển thị các món ăn thuộc danh mục **"Món chính"** từ kho món mẫu, giúp người dùng chọn đúng trọng tâm bữa ăn.
  - **Dropdown Món phụ**: Tự động lọc bỏ các món chính, chỉ hiển thị các món thuộc **"Món canh"**, **"Món xào"**, **"Món phụ"**, **"Tráng miệng"**...
  - **Ràng buộc chống trùng lặp món ăn**: Không cho phép chọn cùng một món ăn 2 lần trong một bữa (kể cả giữa món chính và món phụ). Các món đã được chọn sẽ tự động bị vô hiệu hóa trong dropdown kèm nhãn `— (Đã chọn trong thực đơn)`.
* **Thuật Toán Gộp & Khấu Trừ Định Lượng Nguyên Liệu 2 Chiều (Two-Way Ingredient Sync)**:
  - Khi người dùng chọn món từ danh sách món mẫu, toàn bộ nguyên liệu định lượng sẽ được tự động điền vào danh sách bên dưới.
  - **Cộng dồn tự động**: Khi nhiều món (hoặc món chính và món phụ) dùng chung nguyên liệu (ví dụ: cùng dùng *Trứng gà*, *Hành lá*, *Thịt heo*...), hệ thống tự động nhận diện tên và đơn vị để gộp thành 1 dòng duy nhất và cộng dồn định lượng (ví dụ: `4 quả` + `3 quả` ➔ `Trứng gà (7 quả)`; `400g` + `0.5kg` ➔ `900g`).
  - **Khấu trừ tự động khi xóa món (`subtractIngredients`)**: Khi xóa bớt một món ăn khỏi thực đơn (xóa dòng chữ hoặc nhấn nút chip xóa nhanh `[Tên món ✕]`), hệ thống tự động nhận diện món bị loại bỏ và trừ đúng lượng nguyên liệu tương ứng khỏi danh sách bên dưới, giữ nguyên định lượng của các món còn lại.
* **Kéo Thả Sắp Xếp Thứ Tự Bữa Ăn (Drag & Drop Reordering)**:
  - Nhấp chuột giữ và kéo thả trực tiếp thẻ bữa ăn để đổi thứ tự linh hoạt (ví dụ: đưa Bữa Trưa lên trước Bữa Tối).
  - Tự động lưu thứ tự vào PostgreSQL qua API `PUT /api/meals/reorder` và cột `order_index`.
* **Đồng Bộ Nguyên Liệu Giữa Thực Đơn & Giỏ Đi Chợ**:
  - **Tự động loại bỏ món đã có sẵn ra khỏi Giỏ Đi Chợ**: Khi người dùng tick chọn nguyên liệu đã có sẵn ở Thực Đơn Tuần (Tab 2), hệ thống sẽ **tự động loại bỏ hoàn toàn món đó ra khỏi giỏ hàng Đi Chợ (Tab 3)** (xóa khỏi CSDL thay vì để gạch ngang), đảm bảo giỏ hàng chỉ tập trung vào những thứ cần mua. Bỏ tick sẽ tự động hoàn lại vào giỏ.
  - **Đồng bộ 2 chiều**: Trạng thái mua sắm ở Tab Đi Chợ cũng tự động phản hồi lên thẻ Thực Đơn.
* **Tự Động Bỏ Qua Món Thực Đơn Quá Hạn Chưa Mua (Auto-Skip Expired Items)**:
  - Khi một ngày thực đơn đã trôi qua (`plan_date < hôm nay`), bất kỳ nguyên liệu nào thuộc ngày đó mà **chưa mua** (`is_bought = false`) sẽ **tự động được bỏ qua khỏi Danh sách đi chợ**, tránh tồn đọng nguyên liệu cũ.
  - Trên thẻ thực đơn quá khứ, các nguyên liệu chưa mua được gắn nhãn `Đã bỏ qua` màu vàng cam rõ ràng.
* **Checklist Đi Chợ & Chốt Sổ Hóa Đơn 1-Click (Finalize & Sync to Wallet)**:
  - Sắp xếp thông minh từ bữa gần nhất tới xa nhất (Sáng ➔ Trưa ➔ Tối), ưu tiên món chưa mua lên đầu.
  - Nhập tổng số tiền hóa đơn thực tế có tự động ngắt dấu chấm hàng nghìn (VD: `350.000`).
  - Nhấn nút **"Chốt hóa đơn & Ghi sổ"** (kèm hiệu ứng Glow Shadow sang trọng) ➔ Tự động sinh ra 1 khoản chi tiêu `Đi chợ` bên Tab 1, cập nhật lại số dư ví và dọn dẹp các món đã mua trong giỏ hàng. Giao diện được tinh gọn tối đa, lược bỏ các ghi chú và thông báo dư thừa.

---

### 🍳 Phần C: Quản Lý Món Ăn Mẫu & Công Thức Nguyên Liệu (Preset Dishes & Recipes)
* **Kho Món Ăn Gia Đình Mẫu Đa Dạng**:
  - Tích hợp sẵn 10 món ăn gia đình quen thuộc của người Việt: *Thịt kho tàu*, *Canh chua cá lóc*, *Trứng chiên hành*, *Rau muống xào tỏi*, *Sườn xào chua ngọt*, *Bò xào bông cải*... với đầy đủ lượng calo ước tính và định lượng nguyên liệu chuẩn.
* **Tối Ưu Typography & Thẻ Món Gọn Gàng**:
  - Dòng tiêu đề danh sách nguyên liệu trong thẻ món mẫu được chuẩn hóa thành *"Nguyên liệu định lượng:"* (chữ thường chỉ viết hoa chữ cái đầu, phông màu xám nhạt nhẹ nhàng `text-gray-400 font-medium`), loại bỏ kiểu chữ in hoa toàn bộ thô ráp, giúp thẻ nhìn thanh thoát và tập trung vào tên món cùng các chip nguyên liệu.
  - Lược bỏ các nhãn trạng thái dư thừa ("Mẫu có sẵn", "Tùy chỉnh"), hiển thị trực quan nhóm danh mục và calo.
* **Tự Do Sáng Tạo, Chỉnh Sửa & Xóa Công Thức Linh Hoạt**:
  - Đặt tại vị trí ưu tiên hàng đầu trong Tab Cài Đặt (ngay dưới thẻ tài khoản).
  - Cho phép người dùng Thêm mới, Chỉnh sửa và Xóa bất kỳ món ăn mẫu nào trong danh sách.
  - **Nút xóa trực quan 2 vị trí**: Thao tác xóa với icon Thùng rác đỏ trực tiếp trên thẻ món hoặc nút "Xóa món này" trong popup chỉnh sửa, đi kèm hộp thoại xác nhận bảo vệ an toàn.
  - Phân loại rõ ràng: *Món chính*, *Món canh*, *Món xào*, *Món phụ*, *Ăn sáng*, *Tráng miệng*, *Ăn vặt*.
  - Tích hợp thanh tìm kiếm tức thì theo tên món ăn hoặc tên nguyên liệu.
* **Phân Quyền Linh Hoạt & Bảo Toàn Dữ Liệu Đa Người Dùng**:
  - Món tùy chỉnh do người dùng tạo được lưu riêng biệt và có thể xóa hoàn toàn khỏi CSDL.
  - Khi người dùng xóa một món mặc định của hệ thống, hệ thống ghi nhận ẩn (`user_deleted_preset_dishes`) cho riêng tài khoản đó, đảm bảo danh sách của họ sạch sẽ theo đúng ý muốn mà không ảnh hưởng tới người dùng khác.
  - Khi người dùng chỉnh sửa một món mặc định, hệ thống tự động lưu thành công thức tùy biến riêng và ẩn món gốc, loại bỏ hoàn toàn hiện tượng trùng lặp.

---

### 🔐 Phần D: Đăng Nhập Google OAuth 2.0 & Phân Vùng Dữ Liệu Độc Lập (Multi-Tenant Isolation)
* **Google Identity Services (GSI) Single Sign-On**:
  - Tích hợp nút *"Sign in with Google"* chính thức chuẩn mực từ máy chủ Google.
  - Hỗ trợ Google One-Tap tự động gợi ý đăng nhập một chạm tức thì ở góc màn hình.
  - **Tự động vào thẳng ứng dụng (`auto_select: true`)**: Nếu người dùng đã từng đăng nhập trước đó và duy trì phiên hoạt động của Google trên trình duyệt, hệ thống tự động xác thực một chạm mà không yêu cầu chọn lại tài khoản.
  - Không cần ghi nhớ mật khẩu, bảo mật tuyệt đối qua hạ tầng xác thực của Google Cloud Console.
* **Quản Lý Phiên Làm Việc JSON Web Token (JWT)**:
  - Cấp phát Token JWT an toàn với thời hạn lên đến 30 ngày, tự động lưu trữ tại `localStorage` và gửi kèm trong tiêu đề yêu cầu `Authorization: Bearer <token>`.
  - Middleware Backend `requireAuth` xác thực token trên từng yêu cầu truy cập dữ liệu.
* **Kiến Trúc Phân Vùng Dữ Liệu Biệt Lập Từng Client (Per-Client Data Isolation)**:
  - Mỗi tài khoản Google đăng nhập vào hệ thống là một không gian làm việc hoàn toàn độc lập.
  - Toàn bộ các bảng dữ liệu (`transactions`, `meal_plans`, `grocery_items`, `categories`, `system_logs`, `preset_dishes`) đều được gắn khóa phân vùng `user_email`.
  - Ràng buộc thực đơn tuần đa người dùng: `UNIQUE (user_email, plan_date, meal_name)` cho phép nhiều tài khoản cùng lên kế hoạch cho cùng một ngày mà không bị ghi đè hay xung đột.
  - Khi đăng xuất hoặc hết hạn phiên, bộ nhớ đệm phía trình duyệt được xóa sạch (`clearUserData()`), ngăn chặn triệt để tình trạng lộ lọt hoặc hiển thị chồng chéo dữ liệu giữa các tài khoản dùng chung thiết bị.
* **Tự Động Nạp Bộ Dữ Liệu Mẫu Phong Phú Cho Người Dùng Mới (Smart Onboarding Dummy Data)**:
  - Khi một người dùng mới đăng nhập lần đầu vào hệ thống (qua Google SSO hoặc môi trường thử nghiệm), hệ thống tự động nhận diện tài khoản mới và nạp sẵn một bộ dữ liệu mẫu sinh động, phong phú và thực tế để người dùng trải nghiệm ngay mà không phải bắt đầu từ trang trắng.
  - **Tính toán ngày tương đối theo tuần hiện tại**: Ngày tháng của các bữa ăn và giao dịch thu chi được tính toán động dựa trên `new Date()` (Hôm nay, Hôm qua, Ngày mai, Ngày mốt), đảm bảo các bữa ăn luôn hiển thị trực tiếp trong "Tuần này" trên khung lịch 7 ngày.
  - **Bộ dữ liệu mẫu đa dạng gồm**:
    + **7 giao dịch Thu Chi thực tế**: 2 khoản thu (Lương chuyển khoản 18.5M, Thưởng dự án 3.5M) và 5 khoản chi sinh hoạt gia đình (Tiền nhà, Hóa đơn điện nước, Đi chợ WinMart, Ăn trưa văn phòng & cafe, Mua sắm đồ dùng) với số dư khởi tạo chuẩn xác 14.625.000 VNĐ.
    + **5 bữa ăn Thực Đơn Tuần**: Được lên lịch chu đáo cho Hôm nay (Bữa Trưa: Thịt kho tàu + Canh chua cá lóc; Bữa Tối: Sườn xào chua ngọt + Rau muống xào tỏi), Ngày mai (Bữa Sáng: Phở bò tái lăn; Bữa Trưa: Gà kho gừng + Canh bí đỏ), Ngày mốt (Bữa Tối: Cá basa kho tộ) kèm lượng calo và danh sách nguyên liệu định lượng.
    + **8 món trong Giỏ Đi Chợ**: Đầy đủ phân loại với trạng thái mua sắm thực tế (các món gia vị, đồ khô, trứng dừa đã có sẵn và các món thịt cá, rau tươi cần mua).
    + **2 món ăn mẫu cá nhân tùy chỉnh**: (*Bún chả Hà Nội gia truyền*, *Salad ức gà sốt mè rang*) nạp sẵn vào kho món riêng của tài khoản.
  - **Cơ chế Idempotent an toàn tuyệt đối**: Hệ thống kiểm tra trước khi ghi; nếu tài khoản đã có dữ liệu từ trước sẽ giữ nguyên vẹn 100%, không bao giờ ghi đè hoặc tạo dữ liệu trùng lặp.

---

### ⚙️ Phần E: Cài Đặt & Trải Nghiệm Giao Diện (Settings & UI Experience)
* **Tinh Gọn Thẻ Tài Khoản Profile & Nút Đăng Xuất Mobile**:
  - Gỡ bỏ huy hiệu trạng thái thừa `[✓] Đã đăng nhập`, hiển thị trực tiếp Avatar, Họ tên và Email người dùng.
  - Trên màn hình nhỏ (Mobile), nút Đăng xuất được tối ưu thành icon rời cửa nhỏ gọn (`LogOut`) đặt tại góc trên cùng bên phải thẻ, giải phóng hoàn toàn một hàng ngang riêng biệt, giúp thẻ Profile cực kỳ nhỏ gọn và hiện đại.
* **Tinh Gọn Khối Dữ Liệu & Quản Lý Danh Mục**:
  - Khối xuất CSV lịch sử và Audit Log được chuyển thành các hàng ngang gọn nhẹ với nút tải nhanh thanh lịch.
  - Form thêm danh mục inline 1 hàng kết hợp danh sách phân loại cuộn mượt tối đa `max-h-48` có color coding trực quan (Đỏ cho Chi, Xanh cho Thu), tiết kiệm hơn 50% diện tích trang Cài Đặt.
* **Chạm Tab Đang Mở Để Cuộn Lên Đầu Trang (Tap Active Tab to Scroll To Top)**:
  - Khi người dùng đang ở bất kỳ tab nào và cuộn xuống dưới, chạm lại vào tab đó (cả trên thanh điều hướng Desktop lẫn Mobile) sẽ tự động cuộn mượt lên đầu trang (`window.scrollTo({ top: 0, behavior: 'smooth' })`).
* **Tối Ưu Bottom Navigation Bar Trên Mobile**:
  - Kích thước icon thanh điều hướng dưới chân màn hình thu gọn xuống `w-4 h-4`, tối ưu hóa padding dọc và kích cỡ chữ (text-[10px]), mở rộng tối đa không gian hiển thị nội dung trên các smartphone màn hình nhỏ.
* **Đồng Bộ Giao Diện Dark / Light Mode Toàn Diện**:
  - Chuyển đổi linh hoạt giữa 3 chế độ: **Sáng (Light)**, **Tối (Dark)** và **Tự động (System default)**.
  - Nút chuyển nhanh Dark/Light Mode với icon Mặt Trời / Mặt Trăng đặt ngay trên thanh Header.
  - Tích hợp script inline chống hiện tượng nhấp nháy sáng (FOUC).
* **Định Vị Thông Báo Toast Không Che Menu**:
  - Hộp thông báo nổi (Toast Notification) được định vị tại góc dưới bên phải màn hình (`bottom-right` trên máy tính / `bottom-20` trên điện thoại), giải phóng 100% không gian thanh điều hướng các tab bên trên.
* **Khóa Cuộn Nền Khi Mở Modal (Scroll-lock)**:
  - Tự động khóa cuộn trang (`document.body.style.overflow = 'hidden'`) khi có bất kỳ cửa sổ popup/modal nào đang mở, chống trượt màn hình xuyên thấu (`overscrollBehavior: 'contain'`).

---

## 🎨 4. Phong Cách Thiết Kế UI/UX Cao Cấp

- **Tone màu chủ đạo**: Xanh ngọc / Emerald (`emerald-600`) đại diện cho thực phẩm sạch và sự an tâm tài chính; kết hợp nền xám dịu (`bg-gray-50`) giảm mỏi mắt.
- **Thẻ Số Dư Gradient Sang Trọng**: Dải màu chuyển từ Xanh ngọc (Teal) sang Xanh lá cây thẫm (`from-teal-600 via-emerald-700 to-emerald-950`), kết hợp viền sáng phản chiếu mỏng.
- **Biểu Đồ Đường Kẻ Mờ (Sparklines)**: Đồ thị xu hướng SVG dạng đường uốn lượn mờ phía sau các con số ở thẻ Tổng Thu và Tổng Chi.
- **Định Vị Tab Rõ Nét (Active Tab Indicator)**: Chữ in đậm (`font-bold text-emerald-800 dark:text-emerald-300`) kết hợp đường gạch chân xanh ngọc (`h-[3px] bg-emerald-600 rounded-full`).
- **Đổ Bóng Mềm Mại & Chiều Sâu (Soft Diffused Drop-Shadow)**: Bề mặt nổi êm dịu (`shadow-[0_8px_30px_rgb(0,0,0,0.06)]`) kết hợp hiệu ứng vi dịch chuyển khi rê chuột (`hover:-translate-y-0.5`).
- **Typography & Nhận Diện Thương Hiệu**: Phông chữ quốc tế **Plus Jakarta Sans** đồng bộ logo thương hiệu sắc nét (`Logo.png`) tại Favicon và Header.
- **Tối ưu Mobile-First**: Tự động chuyển thành **Bottom Navigation Bar** cố định ở chân màn hình kèm huy hiệu đếm giỏ hàng tiện lợi khi thao tác bằng 1 tay trong lúc đi chợ.

---

## 🗄️ 5. Thiết Kế Cơ Sở Dữ Liệu (PostgreSQL Schema)

Hệ thống được thiết kế theo chuẩn cơ sở dữ liệu quan hệ PostgreSQL với cơ chế tự động khởi tạo bảng (Auto-migration) trong [server/db.js](file:///c:/Users/leduc/Downloads/SmartSpend%20&%20Meal/server/db.js):

### Các bảng dữ liệu cốt lõi:
1. **`transactions`**: Quản lý thu chi theo tài khoản (`id`, `user_email`, `type`, `amount`, `category`, `date`, `description`, `created_at`).
2. **`meal_plans`**: Thực đơn tuần theo tài khoản (`id`, `user_email`, `plan_date`, `meal_name`, `dish_name`, `side_dish`, `calories`, `ingredients` (JSONB), `order_index`, `created_at`).
3. **`grocery_items`**: Danh sách đi chợ theo tài khoản (`id`, `user_email`, `name`, `quantity`, `is_bought`, `plan_date`, `created_at`).
4. **`preset_dishes`**: Kho món ăn mẫu & công thức định lượng (`id`, `user_email`, `name`, `category`, `calories`, `ingredients` (JSONB), `created_at`).
5. **`categories`**: Danh mục tùy chỉnh phân loại theo tài khoản (`id`, `user_email`, `name`, `type`).
6. **`system_logs`**: Nhật ký kiểm toán hành động hệ thống (`id`, `user_email`, `action`, `entity_type`, `entity_name`, `created_at`).

---

## 🔒 6. Tiêu Chuẩn An Toàn & Bảo Mật Dữ Liệu

- **Đăng nhập Google OAuth 2.0 an toàn**: Xác thực chữ ký token trực tiếp với Google APIs thông qua thư viện chính thức `google-auth-library`, không bao giờ lưu trữ mật khẩu của người dùng và từ chối mọi token không có chữ ký số hợp lệ.
- **Phân quyền truy cập đa tài khoản (Multi-Tenant Isolation)**: Mọi truy vấn SQL đều được gán chặt chẽ với định danh `user_email` trích xuất từ Token JWT đã ký. Người dùng A tuyệt đối không thể xem, sửa hoặc xóa dữ liệu của người dùng B.
- **Chống SQL Injection**: 100% câu lệnh truy vấn đều sử dụng cú pháp Parameterized Query (`$1, $2, $3...`), không ghép chuỗi SQL trực tiếp.
- **Bảo vệ môi trường Production**: Vô hiệu hóa toàn bộ endpoint thử nghiệm (`/api/auth/dev-login`) trên Production (`NODE_ENV === 'production'`) ngăn chặn mọi nguy cơ backdoor.
- **Bảo mật biến môi trường**: Tệp cấu hình nhạy cảm (`.env`) chứa Secret Key và thông tin kết nối CSDL được loại trừ hoàn toàn khỏi Git thông qua `.gitignore`, chỉ cấu hình biến môi trường trực tiếp trên hosting (như Vibe Host).
- **Giao diện xác thực tối giản**: Khi chưa cấu hình Google Client ID trên máy chủ, màn hình chỉ hiển thị thông báo trạng thái thanh lịch, không để lộ thông tin nhạy cảm hay form nhập cấu hình ra giao diện công cộng.

---

## 🚀 7. Hướng Dẫn Cài Đặt & Khởi Chạy Nhanh

### Yêu cầu hệ thống:
- [Node.js](https://nodejs.org/) phiên bản 18 trở lên
- Trình quản lý gói `npm`
- Cơ sở dữ liệu PostgreSQL (local hoặc cloud)
- Mã Google OAuth 2.0 Client ID & Secret từ [Google Cloud Console](https://console.cloud.google.com/)

### Các bước khởi chạy:

1. **Cài đặt thư viện phụ thuộc**:
   ```bash
   npm install
   ```

2. **Cấu hình môi trường**:
   Tạo tệp `.env` dựa theo `.env.example`:
   ```env
   # Kết nối CSDL PostgreSQL
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_database_password
   DB_NAME=smartspend_meal_db
   PORT=5000

   # Cấu hình Google OAuth 2.0 Single Sign-On
   GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_super_secret_jwt_key
   ```

3. **Chạy ứng dụng Local**:
   - **Khởi chạy Backend API**:
     ```bash
     node server/index.js
     ```
   - **Khởi chạy Frontend Dev Server**:
     ```bash
     npm run dev
     ```
   - Truy cập giao diện ứng dụng tại: `http://localhost:5173/`

4. **Triển khai trên Cloud / Production Server**:
   - **Build Frontend**:
     ```bash
     node "node_modules/vite/bin/vite.js" build
     ```
   - **Khởi chạy máy chủ Production**:
     ```bash
     npm start
     ```
   - Express Server sẽ tự động phục vụ các tệp tĩnh từ `dist/` và tự động Auto-migration cấu trúc CSDL PostgreSQL.

---

## 📁 8. Cấu Trúc Mã Nguồn

```text
SmartSpend & Meal/
├── Logo.png                    # Logo thương hiệu gốc độ phân giải cao
├── public/
│   ├── Logo.png                # Logo phục vụ tĩnh cho Header, Favicon & bản build Vite
│   └── og-image.jpg            # Ảnh xem trước mạng xã hội OpenGraph
├── index.html                  # Tệp HTML chính tích hợp Google GSI SDK, Plus Jakarta Sans & theme loader
├── package.json                # Khai báo phụ thuộc (React 19, Express, pg, google-auth-library, jsonwebtoken)
├── vite.config.js              # Cấu hình Vite & proxy API (/api -> localhost:5000)
├── schema.sql                  # Cấu trúc CSDL PostgreSQL chuẩn hóa & các chỉ mục (Indexes)
├── DAILY_NOTES.txt             # Nhật ký theo dõi tiến độ và lịch sử công việc hàng ngày
├── .env.example                # Tệp biến môi trường mẫu chuẩn bảo mật
├── server/
│   ├── auth.js                 # Xử lý xác thực Google OAuth 2.0 & middleware requireAuth (JWT)
│   ├── db.js                   # Kết nối PostgreSQL Pool, kiểm tra trạng thái & Auto-migration
│   └── index.js                # Toàn bộ RESTful API (Thu chi, Thực đơn, Đi chợ, Món mẫu, Logs)
├── src/
│   ├── main.jsx                # Điểm khởi chạy React DOM
│   ├── App.jsx                 # Toàn bộ giao diện 3 Tab chính + Cài đặt & đồng bộ CSDL
│   ├── components/
│   │   └── AuthScreen.jsx      # Giao diện màn hình Đăng nhập Google OAuth 2.0 cao cấp
│   └── utils/
│       └── ingredientHelper.js # Thuật toán thông minh tự động gộp và cộng dồn định lượng nguyên liệu
└── dist/                       # Bản build tối ưu sẵn sàng deploy lên môi trường Production
```

---

## 🏆 Đóng Góp Dự Thi
* **Đơn vị dự thi**: Bảng Văn phòng
* **Sản phẩm**: SmartSpend & Meal - Sổ Thu Chi và Thực Đơn Đi Chợ Tuần
* **Bản quyền**: © 2026 SmartSpend & Meal. Phát triển với sứ mệnh mang lại cuộc sống tiện nghi, tiết kiệm và lành mạnh cho mọi người.
