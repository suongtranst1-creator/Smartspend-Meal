import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
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

  // 4 BƯỚC HÌNH ẢNH TRỰC QUAN - RẤT ÍT CHỮ - DỄ DÀNG THEO DÕI
  const TOUR_SLIDES = [
    {
      step: 1,
      badge: 'BƯỚC 1 / 4',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      image: '/tour-step1.jpg',
      alt: 'Quy trình khép kín SmartSpend & Meal',
      title: 'Quy Trình Khép Kín Độc Nhất',
      bullets: [
        'Lên thực đơn tuần ➔ Tự sinh giỏ đi chợ ➔ Chốt hóa đơn vào Sổ thu chi.',
        'Đồng bộ tức thời trên cả máy tính và điện thoại qua Google.',
      ],
    },
    {
      step: 2,
      badge: 'BƯỚC 2 / 4',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      image: '/tour-step2.jpg',
      alt: 'Lên thực đơn tuần và calo',
      title: 'Lên Thực Đơn Nhanh & Chuẩn Calo',
      bullets: [
        'Gõ phím nhận gợi ý món có sẵn, bấm Enter tạo thẻ món gọn gàng.',
        'Tag x2, x3 tự động nhân định lượng nguyên liệu và cộng dồn calo.',
      ],
    },
    {
      step: 3,
      badge: 'BƯỚC 3 / 4',
      badgeColor: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700',
      image: '/tour-step3.jpg',
      alt: 'Đi chợ thông minh và chốt sổ',
      title: 'Đi Chợ Thông Minh & Chốt Sổ',
      bullets: [
        'Nguyên liệu tự gom nhóm: Rau củ, Thịt cá, Gia vị kèm checklist mua sắm.',
        'Nhập tổng tiền thực tế trên hóa đơn để tự động hạch toán vào Sổ Thu Chi.',
      ],
    },
    {
      step: 4,
      badge: 'BƯỚC 4 / 4',
      badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      image: '/tour-step4.jpg',
      alt: 'Quản lý thu chi và bảo mật',
      title: 'Quản Lý Thu Chi & Riêng Tư',
      bullets: [
        'Theo dõi số dư, thu chi và biểu đồ tài chính trực quan.',
        'Nút con mắt ẩn số dư bảo vệ riêng tư nhạy cảm nơi công cộng.',
      ],
    },
  ];

  const currentItem = TOUR_SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Khung Modal: Tương phản cao, bố cục hình ảnh trực quan */}
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-3xl max-w-lg w-full flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-850/80">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${currentItem.badgeColor}`}>
              {currentItem.badge}
            </span>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
              Hướng dẫn trực quan
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

        {/* Nội dung Slide: Hình ảnh lớn + 2 gạch đầu dòng siêu ngắn */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Banner Hình Ảnh Minh Họa 16:9 Sắc Nét */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200/80 dark:border-gray-700/80 bg-gray-100 dark:bg-gray-800 aspect-video">
            <img
              src={currentItem.image}
              alt={currentItem.alt}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
              loading="eager"
            />
          </div>

          {/* Tiêu đề ngắn gọn */}
          <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-tight">
            {currentItem.title}
          </h3>

          {/* Chỉ 2 gạch đầu dòng siêu ngắn gọn, chữ rõ ràng tương phản cao */}
          <div className="space-y-2 bg-gray-50 dark:bg-gray-800/80 p-3 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
            {currentItem.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0 stroke-[2.25]" />
                <span className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-medium leading-normal">
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Chấm tròn & Nút điều hướng */}
        <div className="px-5 py-3 sm:px-6 bg-gray-50/80 dark:bg-gray-850/80 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          {/* Chấm tròn chuyển bước */}
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

          {/* Nút bấm */}
          <div className="flex items-center gap-2">
            {currentSlide > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
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
