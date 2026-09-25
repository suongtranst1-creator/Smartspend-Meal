import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Utensils,
  ShoppingCart,
  Wallet,
  Check,
  CheckCircle2,
} from 'lucide-react';

export default function OnboardingModal({ isOpen, onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset slide when opened
  React.useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFinish = () => {
    localStorage.setItem('smartspend_onboarded', 'true');
    onClose();
  };

  // 4 BƯỚC NGẮN GỌN, SÚC TÍCH, DỄ NHỚ
  const TOUR_SLIDES = [
    {
      step: 1,
      badge: 'BƯỚC 1 / 4',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      icon: Sparkles,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/60 ring-8 ring-emerald-500/10',
      title: 'Trợ Lý Thu Chi & Bữa Ăn',
      subtitle: 'Quy trình khép kín độc nhất giữa Dinh dưỡng & Tài chính',
      bullets: [
        'Lên thực đơn tuần ➔ Tự sinh đồ đi chợ ➔ Chốt hóa đơn ghi vào Sổ thu chi.',
        'Giải quyết triệt để câu hỏi: "Hôm nay ăn gì?" và "Hết bao nhiêu tiền?".',
        'Đồng bộ tức thời trên cả máy tính và điện thoại.',
      ],
    },
    {
      step: 2,
      badge: 'BƯỚC 2 / 4',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      icon: Utensils,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/60 ring-8 ring-amber-500/10',
      title: 'Lên Món Nhanh & Tự Tính Calo',
      subtitle: 'Kế hoạch ăn uống từ Thứ 2 đến Chủ Nhật',
      bullets: [
        'Gõ phím để nhận gợi ý món có sẵn, bấm Enter tạo thẻ món gọn gàng.',
        'Chọn 1 món nhiều lần sẽ tự gộp tag x2, x3 và nhân đôi nguyên liệu.',
        'Calo ước tính tự động cộng dồn hoặc trừ ra khi đổi món.',
      ],
    },
    {
      step: 3,
      badge: 'BƯỚC 3 / 4',
      badgeColor: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700',
      icon: ShoppingCart,
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-100 dark:bg-teal-900/60 ring-8 ring-teal-500/10',
      title: 'Tự Động Sinh Giỏ Đi Chợ & Chốt Sổ',
      subtitle: 'Không quên đồ, không lo vượt ngân sách',
      bullets: [
        'Nguyên liệu cả tuần tự gom nhóm: Rau củ, Thịt cá, Gia vị.',
        'Tích chọn khi mua hàng tại chợ / siêu thị, sửa số lượng dễ dàng.',
        'Chốt sổ: Nhập tổng tiền thực tế ➔ Tự động hạch toán vào Sổ Thu Chi.',
      ],
    },
    {
      step: 4,
      badge: 'BƯỚC 4 / 4',
      badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      icon: Wallet,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/60 ring-8 ring-blue-500/10',
      title: 'Quản Lý Thu Chi & Mẹo Tiện Ích',
      subtitle: 'Kiểm soát dòng tiền thông minh và bảo mật',
      bullets: [
        'Theo dõi số dư, tổng thu, tổng chi và biểu đồ trực quan.',
        'Bấm icon Con mắt để ẩn số dư nhạy cảm nơi công cộng.',
        'Tự do thêm món ăn mẫu gia đình trong tab Cài Đặt.',
      ],
    },
  ];

  const currentItem = TOUR_SLIDES[currentSlide];
  const IconComp = currentItem.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Khung Modal: Màu nền tường minh cả Light mode (bg-white) và Dark mode (dark:bg-gray-900) */}
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-3xl max-w-lg w-full flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-3.5 sm:px-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-850/80">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${currentItem.badgeColor}`}>
              {currentItem.badge}
            </span>
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              Hướng dẫn nhanh
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Đóng hướng dẫn"
          >
            <X className="w-5 h-5 stroke-[2.25]" />
          </button>
        </div>

        {/* Nội dung Slide */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Hộp biểu tượng & Tiêu đề */}
          <div className="text-center pt-1">
            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-sm ${currentItem.iconBg}`}>
              <IconComp className={`w-7 h-7 sm:w-8 sm:h-8 ${currentItem.iconColor} stroke-[2.25]`} />
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white leading-snug">
              {currentItem.title}
            </h3>
            <p className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
              {currentItem.subtitle}
            </p>
          </div>

          {/* Danh sách ý chính (Ít chữ, rõ ràng, tương phản cao) */}
          <div className="space-y-2.5 bg-gray-50 dark:bg-gray-800/80 p-3.5 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80">
            {currentItem.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.25]" />
                <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-normal">
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer điều hướng: Chấm tròn & Nút Tiếp theo / Hoàn tất */}
        <div className="px-5 py-3.5 sm:px-6 bg-gray-50/80 dark:bg-gray-850/80 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          {/* Thanh chấm chuyển slide */}
          <div className="flex items-center gap-1.5">
            {TOUR_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx
                    ? 'w-6 bg-emerald-600 dark:bg-emerald-400'
                    : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400'
                }`}
                title={`Đến bước ${idx + 1}`}
              />
            ))}
          </div>

          {/* Các nút bấm */}
          <div className="flex items-center gap-2">
            {currentSlide > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
              >
                Bỏ qua
              </button>
            )}

            {currentSlide < TOUR_SLIDES.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-sm shadow-emerald-600/30 flex items-center gap-1 cursor-pointer transition-all active:scale-98"
              >
                <span>Tiếp tục</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Bắt đầu ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
