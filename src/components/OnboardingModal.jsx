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

  // 4 BƯỚC HÌNH ẢNH TRỰC QUAN - TIÊU ĐỀ & 1 DÒNG DUY NHẤT CHUẨN XÁC
  const TOUR_SLIDES = [
    {
      step: 1,
      badge: 'BƯỚC 1 / 4',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      image: '/tour-step1.jpg',
      alt: 'Quản Lý Bữa Ăn & Chi Tiêu',
      title: 'Quản Lý Bữa Ăn & Chi Tiêu',
      line: 'Lên thực đơn cả tuần ➔ Tự động tạo danh sách đi chợ',
    },
    {
      step: 2,
      badge: 'BƯỚC 2 / 4',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      image: '/tour-step2.jpg',
      alt: 'Lên Thực Đơn Nhanh',
      title: 'Lên Thực Đơn Nhanh',
      line: 'Gợi ý món có sẵn, tự thêm nguyên liệu đi chợ',
    },
    {
      step: 3,
      badge: 'BƯỚC 3 / 4',
      badgeColor: 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700',
      image: '/tour-step3.jpg',
      alt: 'Đi Chợ Thông Minh',
      title: 'Đi Chợ Thông Minh',
      line: 'Nhập tổng tiền trên hóa đơn để tự động hạch toán vào Sổ Thu Chi',
    },
    {
      step: 4,
      badge: 'BƯỚC 4 / 4',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      image: '/tour-step4.jpg',
      alt: 'Quản Lý Thu Chi',
      title: 'Quản Lý Thu Chi',
      line: 'Theo dõi số dư, thu chi và biểu đồ tài chính trực quan.',
    },
  ];

  const currentItem = TOUR_SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Khung Modal: Tương phản cao tuyệt đối cho cả Dark Mode & Light Mode */}
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl max-w-md sm:max-w-lg w-full flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        
        {/* Header Modal */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/90">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${currentItem.badgeColor}`}>
              {currentItem.badge}
            </span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
              Hướng dẫn trực quan
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            title="Đóng hướng dẫn"
          >
            <X className="w-5 h-5 stroke-[2.25]" />
          </button>
        </div>

        {/* Nội dung Slide: Hình ảnh lớn + Tiêu đề + 1 dòng nội dung súc tích */}
        <div className="p-4 sm:p-5 space-y-3">
          {/* Banner Hình Ảnh Minh Họa 16:9 Sắc Nét */}
          <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-video">
            <img
              src={currentItem.image}
              alt={currentItem.alt}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
              loading="eager"
            />
          </div>

          {/* Tiêu đề ngắn gọn theo đúng yêu cầu */}
          <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-tight pt-0.5">
            {currentItem.title}
          </h3>

          {/* 1 Dòng mô tả duy nhất trong khung ngọc bích tương phản cao */}
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-3 sm:p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-2.5 shadow-2xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.25]" />
            <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 leading-snug">
              {currentItem.line}
            </span>
          </div>
        </div>

        {/* Footer: Chấm tròn & Nút điều hướng không bị vỡ layout */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
          {/* Chấm tròn chuyển bước */}
          <div className="flex items-center gap-1.5 shrink-0">
            {TOUR_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSlide === idx
                    ? 'w-6 bg-emerald-600 dark:bg-emerald-400'
                    : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                }`}
                title={`Đến bước ${idx + 1}`}
              />
            ))}
          </div>

          {/* Nhóm nút bấm: Giữ trọn layout, không bị tràn trên màn hình nhỏ */}
          <div className="flex items-center gap-2 shrink-0">
            {currentSlide > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Trước</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                Bỏ qua
              </button>
            )}

            {currentSlide < TOUR_SLIDES.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentSlide((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 shadow-sm shadow-emerald-600/30 flex items-center gap-1 cursor-pointer transition-all active:scale-98 whitespace-nowrap shrink-0"
              >
                <span>Tiếp tục</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98 whitespace-nowrap shrink-0"
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
