import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  Utensils,
  ShoppingCart,
  Wallet,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Flame,
  Check,
  RotateCcw,
  Receipt,
  FileSpreadsheet,
  Eye,
  Plus,
  HelpCircle,
} from 'lucide-react';

export default function OnboardingModal({
  isOpen,
  onClose,
  initialMode = 'guide', // 'tour' | 'guide'
}) {
  const [mode, setMode] = useState(initialMode); // 'tour' | 'guide'
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeGuideTab, setActiveGuideTab] = useState('workflow'); // 'workflow' | 'meal' | 'shop' | 'spend' | 'preset'
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Sync mode if initialMode changes
  React.useEffect(() => {
    setMode(initialMode);
    setCurrentSlide(0);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('smartspend_onboarded', 'true');
    }
    onClose();
  };

  const handleFinishTour = () => {
    localStorage.setItem('smartspend_onboarded', 'true');
    onClose();
  };

  // ==========================================
  // DỮ LIỆU SLIDE CỦA QUICK WELCOME TOUR (4 BƯỚC)
  // ==========================================
  const TOUR_SLIDES = [
    {
      step: 1,
      badge: 'Chào mừng bạn mới',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      icon: Sparkles,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 ring-8 ring-emerald-500/10',
      title: 'Chào Mừng Đến SmartSpend & Meal!',
      subtitle: 'Trợ lý tài chính & dinh dưỡng thông minh dành cho bạn và gia đình',
      description:
        'SmartSpend & Meal kết nối độc nhất giữa Quản lý Thu Chi và Lên Thực Đơn Thông Minh. Giải quyết triệt để bài toán: "Hôm nay ăn gì?", "Mua nguyên liệu hết bao nhiêu?" và "Dòng tiền tháng này ra sao?".',
      highlights: [
        'Quy trình khép kín: Lên thực đơn ➔ Sinh giỏ đi chợ ➔ Chốt hóa đơn vào Sổ thu chi.',
        'Đồng bộ tức thì trên mọi thiết bị qua tài khoản Google.',
        'Hỗ trợ chế độ Sáng / Tối (Dark Mode) dịu mắt, giao diện chuẩn di động.',
      ],
    },
    {
      step: 2,
      badge: 'Bữa Ăn Khoa Học',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      icon: Utensils,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 ring-8 ring-amber-500/10',
      title: 'Lên Thực Đơn Tuần Cực Nhanh',
      subtitle: 'Kế hoạch ăn uống từ Thứ 2 đến Chủ Nhật với gợi ý calo & định lượng',
      description:
        'Lên lịch cho từng bữa sáng, trưa, tối chỉ trong vài giây. Hệ thống tự động gợi ý món, tính calo và gộp số phần ăn theo nhu cầu gia đình.',
      highlights: [
        'Gõ phím là có gợi ý thông minh, bấm Enter tạo thẻ món gọn gàng.',
        'Hỗ trợ nhân số phần ăn (tag x2, x3...) tự động nhân định lượng nguyên liệu.',
        'Calo ước tính tự cộng dồn khi thêm món và tự khấu trừ khi bớt món.',
        'Kéo thả mượt mà để sắp xếp lại các bữa ăn trong ngày.',
      ],
    },
    {
      step: 3,
      badge: 'Mua Sắm Thông Minh',
      badgeColor: 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-700',
      icon: ShoppingCart,
      iconColor: 'text-teal-600 dark:text-teal-400',
      iconBg: 'bg-teal-50 dark:bg-teal-950/60 ring-8 ring-teal-500/10',
      title: 'Tự Động Sinh Giỏ Đi Chợ & Chốt Sổ',
      subtitle: 'Không bao giờ quên mua đồ, không bao giờ chi tiêu vượt ngân sách',
      description:
        'Tất cả nguyên liệu từ thực đơn cả tuần sẽ tự động được gộp định lượng và phân loại theo nhóm (Rau củ, Thịt cá, Gia vị) trong giỏ Đi Chợ.',
      highlights: [
        'Tích chọn từng món khi nhặt đồ vào xe đẩy trong siêu thị / chợ.',
        'Chặn chốt sổ khi giỏ rỗng, ngăn ngừa ghi nhầm dữ liệu.',
        'Nhập tổng tiền thực tế trên hóa đơn ➔ Hệ thống tự động hạch toán một khoản chi vào Sổ Thu Chi!',
      ],
    },
    {
      step: 4,
      badge: 'Quản Lý Dòng Tiền',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      icon: Wallet,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/60 ring-8 ring-blue-500/10',
      title: 'Kiểm Soát Tài Chính & Món Mẫu',
      subtitle: 'Nắm chắc số dư, biểu đồ chi tiêu và tùy biến kho công thức nấu ăn',
      description:
        'Ghi chép thu chi nhanh chóng, theo dõi tổng thu - tổng chi - số dư tức thì, cùng kho công thức món mẫu do chính bạn thiết lập.',
      highlights: [
        'Biểu đồ chi tiêu trực quan theo danh mục & thời gian.',
        'Nút con mắt bảo vệ riêng tư: Bật / Tắt ẩn số dư tài khoản nhạy cảm.',
        'Xuất file Excel CSV lịch sử giao dịch và nhật ký thao tác để đối soát.',
        'Kho món mẫu trong Cài Đặt giúp tái sử dụng món ăn yêu thích mỗi tuần.',
      ],
    },
  ];

  const currentTourItem = TOUR_SLIDES[currentSlide];
  const IconComponent = currentTourItem.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-850 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700/80 overflow-hidden">
        {/* ========================================================================= */}
        {/* MODAL HEADER                                                              */}
        {/* ========================================================================= */}
        <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white dark:from-emerald-950/20 dark:via-gray-800 dark:to-gray-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
              {mode === 'tour' ? <Sparkles className="w-5 h-5 stroke-[2.25]" /> : <BookOpen className="w-5 h-5 stroke-[2.25]" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {mode === 'tour' ? 'Khám Phá SmartSpend & Meal' : 'Trung Tâm Hướng Dẫn & Cẩm Nang'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mode === 'tour'
                  ? `Bước ${currentSlide + 1} trên ${TOUR_SLIDES.length}: ${currentTourItem.badge}`
                  : 'Cẩm nang tra cứu và mẹo sử dụng toàn diện'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Switch Mode Buttons */}
            {mode === 'tour' ? (
              <button
                type="button"
                onClick={() => setMode('guide')}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Xem cẩm nang</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('tour');
                  setCurrentSlide(0);
                }}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xem Tour 4 bước</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors cursor-pointer"
              title="Đóng hộp thoại"
            >
              <X className="w-5 h-5 stroke-[2.25]" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY: CHẾ ĐỘ 1 - QUICK WELCOME TOUR                                 */}
        {/* ========================================================================= */}
        {mode === 'tour' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 custom-scrollbar flex flex-col justify-between">
            <div>
              {/* Top Banner Icon & Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${currentTourItem.badgeColor}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentTourItem.badge}</span>
                </span>
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                  {currentSlide + 1} / {TOUR_SLIDES.length}
                </span>
              </div>

              {/* Main Illustration Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/80 dark:to-gray-800/40 border border-gray-100 dark:border-gray-700/80 mb-5 text-center relative overflow-hidden">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-md ${currentTourItem.iconBg}`}>
                  <IconComponent className={`w-8 h-8 sm:w-10 sm:h-10 ${currentTourItem.iconColor}`} />
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white mb-1.5">
                  {currentTourItem.title}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-3">
                  {currentTourItem.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto">
                  {currentTourItem.description}
                </p>
              </div>

              {/* Highlights Checklist */}
              <div className="space-y-2.5 mb-5 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100/60 dark:border-emerald-900/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Điểm nổi bật cần nhớ:</span>
                </h4>
                {currentTourItem.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300 leading-normal">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Dot Indicators */}
              <div className="flex items-center gap-2">
                {TOUR_SLIDES.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentSlide === idx
                        ? 'w-7 bg-emerald-600 dark:bg-emerald-400'
                        : 'w-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300'
                    }`}
                    title={`Đến bước ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {currentSlide > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => prev - 1)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Bỏ qua tour
                  </button>
                )}

                {currentSlide < TOUR_SLIDES.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentSlide((prev) => prev + 1)}
                    className="px-4.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-600/30 flex items-center gap-1 cursor-pointer transition-all active:scale-98"
                  >
                    <span>Tiếp theo</span>
                    <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishTour}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:opacity-95 shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98 animate-pulse"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Bắt đầu trải nghiệm ngay!</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL BODY: CHẾ ĐỘ 2 - TRUNG TÂM CẨM NANG & TRA CỨU TOÀN DIỆN              */}
        {/* ========================================================================= */}
        {mode === 'guide' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sub-tabs Navigation Bar */}
            <div className="flex items-center gap-1.5 px-4 sm:px-6 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700/60 overflow-x-auto custom-scrollbar bg-gray-50/60 dark:bg-gray-800/40 shrink-0">
              <button
                type="button"
                onClick={() => setActiveGuideTab('workflow')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeGuideTab === 'workflow'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Quy Trình 3 Bước</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('meal')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeGuideTab === 'meal'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Thực Đơn Tuần</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('shop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeGuideTab === 'shop'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Đi Chợ & Chốt Sổ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('spend')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeGuideTab === 'spend'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Sổ Thu Chi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGuideTab('preset')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeGuideTab === 'preset'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Mẹo & Món Mẫu</span>
              </button>
            </div>

            {/* Sub-tab Content Area */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar space-y-4">
              {/* TAB 1: QUY TRÌNH 3 BƯỚC KHÉP KÍN */}
              {activeGuideTab === 'workflow' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20">
                    <h3 className="text-sm sm:text-base font-extrabold text-emerald-900 dark:text-emerald-200 mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Luồng Vận Hành Khép Kín Cốt Lõi (Đặc Trưng Của Ứng Dụng)</span>
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Điểm sáng tạo nhất của SmartSpend & Meal là sự kết nối tự động 100% giữa kế hoạch ăn uống và quản lý tài chính thực tế:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Bước 1 */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 relative flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center justify-center mb-2.5">
                          1
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1">
                          Lên Thực Đơn Tuần
                        </h4>
                        <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          Chọn món chính, món phụ cho từng bữa sáng, trưa, tối. Hệ thống tự động gộp nguyên liệu định lượng và cộng dồn calo.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <span>Tab: Thực Đơn Tuần</span>
                      </div>
                    </div>

                    {/* Bước 2 */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 relative flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-sm flex items-center justify-center mb-2.5">
                          2
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1">
                          Đi Chợ Thông Minh
                        </h4>
                        <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          Nguyên liệu tự động xuất hiện trong giỏ Đi Chợ (phân nhóm Rau củ, Thịt cá, Gia vị). Cầm điện thoại đi chợ và tích chọn món đã mua.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[10px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                        <span>Tab: Đi Chợ</span>
                      </div>
                    </div>

                    {/* Bước 3 */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 relative flex flex-col justify-between">
                      <div>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center mb-2.5">
                          3
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1">
                          Chốt Hóa Đơn & Ghi Sổ
                        </h4>
                        <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          Bấm "Chốt sổ", nhập số tiền thực tế trên hóa đơn siêu thị. Hệ thống tự động ghi 1 khoản chi vào Sổ Thu Chi kèm ghi chú chi tiết.
                        </p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span>Tab: Sổ Thu Chi</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: THỰC ĐƠN TUẦN */}
              {activeGuideTab === 'meal' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                    💡 <strong>Thực Đơn Tuần</strong> giúp bạn không còn phải đau đầu nghĩ xem "Hôm nay ăn gì?" và quản lý calo chính xác.
                  </div>

                  <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Cách chọn món chính & món phụ:</span>
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                        <li><strong>Chọn nhanh từ menu:</strong> Bấm dropdown <em>"✨ Chọn nhanh Món Chính..."</em> hoặc <em>"✨ Chọn nhanh Món Phụ / Canh..."</em> để chọn món có sẵn.</li>
                        <li><strong>Gõ phím để nhận gợi ý (Autocomplete):</strong> Gõ vài chữ cái đầu tên món, bảng gợi ý kèm mức calo sẽ hiện ra tức thì để bạn chạm chọn.</li>
                        <li><strong>Nhập tay & bấm Enter:</strong> Bạn có thể gõ bất kỳ món nào và bấm phím Enter (hoặc bấm nút "Thêm") để tạo thẻ món 1 dòng thanh lịch.</li>
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Tính năng thẻ Tag x2, x3 và Calo hai chiều:</span>
                      </h4>
                      <p className="mb-1 text-gray-600 dark:text-gray-300">
                        Khi bạn chọn hoặc nhập cùng 1 món nhiều lần (ví dụ gia đình ăn nhiều phần), món sẽ tự động gộp thành thẻ tag <code>Cá basa kho tộ x2</code>, đồng thời nhân gấp đôi nguyên liệu và lượng calo tương ứng.
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        Khi bấm icon <span className="font-bold text-rose-500">✕</span> trên thẻ tag, hệ thống sẽ giảm bớt 1 phần (x2 ➔ x1) và tự động trừ calo cùng nguyên liệu ra khỏi thực đơn.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <span>Kéo thả sắp xếp bữa ăn:</span>
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Bạn có thể nhấn giữ biểu tượng kéo thả bên góc thẻ bữa ăn để đảo thứ tự các bữa (ví dụ đổi Bữa Trưa lên trước Bữa Sáng nếu cần).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ĐI CHỢ & CHỐT SỔ */}
              {activeGuideTab === 'shop' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-900/40 text-xs text-teal-900 dark:text-teal-200">
                    🛒 <strong>Đi Chợ</strong> là chiếc giỏ hàng thông minh đồng hành cùng bạn tại quầy thực phẩm siêu thị hoặc chợ truyền thống.
                  </div>

                  <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500" />
                        <span>Nguyên liệu tự động gom nhóm:</span>
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Hệ thống tự động gom tất cả nguyên liệu trong tuần theo danh mục: <strong>Rau củ</strong>, <strong>Thịt cá</strong>, <strong>Gia vị</strong>, <strong>Trái cây</strong>. Bạn không cần ngồi chép tay danh sách ra giấy nữa!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Tích chọn khi mua hàng & chỉnh sửa định lượng:</span>
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300 mb-1">
                        Khi nhặt món vào giỏ, bạn bấm vào ô tròn để đánh dấu đã mua (món sẽ đổi màu xanh và chuyển xuống dưới). Bạn cũng có thể bấm nút Cây bút để sửa lại số lượng (ví dụ mua 500g thay vì 300g).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Chốt hóa đơn & Popup xác thực thông minh:</span>
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                        <li><strong>Chống giỏ rỗng:</strong> Nếu chưa chọn món nào mà bấm chốt sổ, hệ thống sẽ cảnh báo để tránh ghi nhầm dữ liệu trống.</li>
                        <li><strong>Nhập tiền thực tế:</strong> Nhập số tiền thanh toán ghi trên hóa đơn vào ô <em>"Tổng tiền hóa đơn thực tế (VNĐ)"</em>.</li>
                        <li><strong>Popup xác thực:</strong> Khi bấm chốt, hệ thống mở hộp thoại tóm tắt số món đã mua, tổng tiền và danh mục ghi sổ để bạn kiểm tra lần cuối trước khi lưu vào Sổ Thu Chi.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SỔ THU CHI */}
              {activeGuideTab === 'spend' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200">
                    💰 <strong>Sổ Thu Chi</strong> giúp bạn theo dõi từng đồng tiền vào/ra, cân đối chi tiêu gia đình và không bao giờ bị âm ngân sách.
                  </div>

                  <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Bảo vệ quyền riêng tư (Ẩn/Hiện Số Dư):</span>
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Bấm biểu tượng Con mắt ở thẻ <strong>Số Dư Tài Khoản</strong> để làm mờ số tiền thành dạng <code>•••••••• VNĐ</code>, bảo vệ thông tin tài chính nhạy cảm khi bạn mở app ở quán cà phê hay nơi công cộng.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Bộ lọc đa năng & Xuất báo cáo Excel (CSV):</span>
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Lọc theo Khoản Thu / Khoản Chi, lọc theo khoảng ngày cụ thể hoặc sắp xếp theo số tiền lớn nhất. Trong tab <strong>Cài Đặt</strong>, bạn có thể bấm <strong>"Tải CSV"</strong> để mở trực tiếp trên Excel hoặc Google Sheets.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: MẸO HAY & MÓN MẪU */}
              {activeGuideTab === 'preset' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-200">
                    ✨ <strong>Món Ăn Mẫu (Preset Dishes)</strong> giúp bạn cá nhân hóa khẩu vị ăn uống của gia đình mình.
                  </div>

                  <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Tự thêm món ăn mẫu của riêng bạn:</span>
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Vào tab <strong>Cài Đặt ➔ Món Ăn Mẫu</strong>, bấm <strong>"Thêm Món Mẫu"</strong>. Nhập tên món, lượng calo và danh sách nguyên liệu chuẩn (mỗi nguyên liệu 1 dòng, ví dụ: <code>Thịt bò 300g</code>). Món này sẽ tự động xuất hiện trong gợi ý của Thực Đơn Tuần!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span>Mẹo thao tác nhanh trên điện thoại:</span>
                      </h4>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
                        <li><strong>Chạm lại tab đang chọn:</strong> Sẽ tự động cuộn mượt (scroll to top) lên đầu trang.</li>
                        <li><strong>Không bị zoom màn hình:</strong> Khi chạm vào ô nhập dữ liệu trên điện thoại, giao diện giữ nguyên tỷ lệ chuẩn 100%, không bị phóng to bất ngờ.</li>
                        <li><strong>Đồng bộ Google:</strong> Đăng nhập cùng một tài khoản Google trên cả máy tính và điện thoại để dữ liệu luôn tức thời.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Guide Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setMode('tour');
                  setCurrentSlide(0);
                }}
                className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Xem lại Tour 4 bước chào mừng</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
