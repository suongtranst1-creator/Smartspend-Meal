import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Calendar,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Trash2,
  Utensils,
  Sun,
  Sunset,
  Moon,
  ArrowRight,
  Filter,
  Check,
  Plus,
  Sparkles,
  Receipt,
  Clock,
  Tag,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Pencil,
  Database,
  Settings,
  ArrowUpDown,
  Download,
  RotateCcw,
  Lightbulb,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
  User,
  Search,
  BookOpen,
  Eye,
  EyeOff
} from 'lucide-react';
import AuthScreen from './components/AuthScreen.jsx';
import UserAvatar from './components/UserAvatar.jsx';
import {
  mergeIngredients,
  subtractIngredients,
  textToIngredientsArray,
  ingredientsArrayToText,
  parseIngredientLine,
  parseDishItem,
  formatDishItem,
  parseCaloriesNumber,
} from './utils/ingredientHelper.js';

// Fetch Interceptor: Tự động đính kèm Bearer token vào các request /api
// và xử lý hủy phiên ngay lập tức khi nhận mã lỗi 401 hoặc 403
if (typeof window !== 'undefined' && !window.__smartspend_fetch_intercepted) {
  window.__smartspend_fetch_intercepted = true;
  const originalFetch = window.fetch;
  window.fetch = async (input, init = {}) => {
    let url = typeof input === 'string' ? input : input?.url || '';
    if (
      url.startsWith('/api') &&
      !url.startsWith('/api/auth/config') &&
      !url.startsWith('/api/auth/google') &&
      !url.startsWith('/api/auth/dev-login')
    ) {
      const token = localStorage.getItem('smartspend_token');
      if (token) {
        init = init || {};
        init.headers = {
          ...init.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
    const response = await originalFetch(input, init);
    // Nếu token hết hạn hoặc tài khoản bị cấm (401/403) trên các route dữ liệu nội bộ
    if (
      (response.status === 401 || response.status === 403) &&
      url.startsWith('/api') &&
      !url.startsWith('/api/auth/google') &&
      !url.startsWith('/api/auth/dev-login') &&
      !url.startsWith('/api/auth/config')
    ) {
      window.dispatchEvent(
        new CustomEvent('smartspend:auth_expired', {
          detail: { status: response.status }
        })
      );
    }
    return response;
  };
}

// Currency Formatter
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Format integer amount without decimals for CSV: e.g. 50000 -> "50000"
const formatAmountForCSV = (amount) => {
  return String(Math.round(Number(amount) || 0));
};

// Format time HH:mm from created_at or ISO string
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    // Handle ISO format: "2024-09-23T09:30:00.000Z" or "2024-09-23 09:30:00+07"
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  } catch { }
  return '';
};

// Format number input with thousand dots separator: e.g. "50000" -> "50.000", "1000000" -> "1.000.000"
const formatNumberInput = (val) => {
  if (val === null || val === undefined) return '';
  const clean = String(val).replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

// Parse formatted number input back to integer: e.g. "50.000" -> 50000
const parseNumberInput = (val) => {
  if (val === null || val === undefined) return 0;
  const clean = String(val).replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

// Date Formatter (YYYY-MM-DD -> DD/MM/YYYY)
const formatDate = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

// Meal tag formatter for groceries: e.g., "Bữa Trưa 24/09"
const formatMealTag = (dateString, mealName) => {
  let datePart = '';
  if (dateString) {
    const cleanDate = dateString.includes('T') ? dateString.split('T')[0] : dateString;
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
      datePart = `${parts[2]}/${parts[1]}`;
    }
  }

  const rawName = (mealName || '').trim();
  const baseName = rawName || 'Bữa Ăn';
  // Capitalize first letter of each word (e.g. "bữa trưa" -> "Bữa Trưa")
  const titleCaseName = baseName
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return datePart ? `${titleCaseName} ${datePart}` : titleCaseName;
};

// System Log Time Formatter (-> DD/MM/YYYY HH:mm:ss)
const formatLogTime = (timeStr) => {
  if (!timeStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}/.test(timeStr)) return timeStr;
  const parts = timeStr.trim().split(' ');
  if (parts.length >= 2 && parts[0].includes('-')) {
    const d = parts[0].split('-');
    if (d.length === 3) {
      return `${d[2]}/${d[1]}/${d[0]} ${parts[1].slice(0, 8)}`;
    }
  }
  if (timeStr.includes('T')) {
    const [datePart, timePart] = timeStr.split('T');
    const d = datePart.split('-');
    if (d.length === 3) {
      return `${d[2]}/${d[1]}/${d[0]} ${(timePart || '').slice(0, 8)}`;
    }
  }
  return timeStr;
};

// Initial Transactions (Empty, ready for user inputs or PostgreSQL sync)
const INITIAL_TRANSACTIONS = [];

// Weekdays definition dynamically calculated based on current week
const getWeekDays = (weekOffset = 0) => {
  const now = new Date();
  const currentDayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
  const mondayOffset = (currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek) + (weekOffset * 7);
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);

  const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  return dayNames.map((name, index) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + index);

    // So sánh isToday (chỉ tính ngày, tháng, năm)
    const isToday = d.toDateString() === now.toDateString();

    // So sánh isPast (đã qua hay chưa, loại trừ thời gian)
    const isPast = d.setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);

    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const dbDateStr = `${d.getFullYear()}-${monthStr}-${dayStr}`;

    return {
      key: dbDateStr, // key now uses YYYY-MM-DD
      label: dayLabels[index],
      name,
      dateStr: `${dayStr}/${monthStr}`,
      dbDateStr,
      isToday,
      isPast,
    };
  });
};

// Empty Meal template
const EMPTY_MEAL_SLOT = {
  main: '',
  side: '',
  calories: '',
  ingredients: [],
};

// Initial Shopping Items (Empty, ready for user inputs or PostgreSQL sync)
const INITIAL_SHOPPING_ITEMS = [];

// ==========================================================
// Helper: Parse YYYY-MM-DD safely into local Date (no UTC shift)
// ==========================================================
const parseLocalDate = (dateStr) => {
  if (!dateStr) return new Date();
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
};

// Hàm lọc bỏ các món đi chợ quá hạn chưa mua (plan_date < hôm nay)
const filterExpiredUnboughtGroceries = (items = []) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return items.filter((item) => {
    // 1. Nếu món đã mua tại giỏ đi chợ (checked), giữ lại để người dùng đối chiếu / chốt hóa đơn
    if (item.checked) return true;

    // 2. Nếu món thuộc thực đơn của ngày đã qua mà chưa mua -> tự động bỏ qua
    if (item.plan_date) {
      const pDate = parseLocalDate(item.plan_date);
      pDate.setHours(0, 0, 0, 0);
      if (pDate < today) return false;
    }

    return true;
  });
};

// ==========================================================
// Component: DateRangePicker (Chọn khoảng 2 ngày có tô đậm)
// ==========================================================
function DateRangePicker({ startDate, endDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  const initialDate = startDate ? parseLocalDate(startDate) : new Date();
  const [viewDate, setViewDate] = useState(initialDate);
  const [hoverDate, setHoverDate] = useState(null);
  const [tempStart, setTempStart] = useState(startDate);

  useEffect(() => {
    setTempStart(startDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (isOpen && startDate) {
      setViewDate(parseLocalDate(startDate));
    }
  }, [isOpen, startDate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth(); // 0 - 11

  const prevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const nextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun, 1 is Mon...
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const handleSelectDay = (day) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const clickedDate = `${viewYear}-${monthStr}-${dayStr}`;

    if (!tempStart || (tempStart && endDate)) {
      setTempStart(clickedDate);
      onChange({ start: clickedDate, end: '' });
    } else {
      if (clickedDate < tempStart) {
        onChange({ start: clickedDate, end: tempStart });
        setTempStart(clickedDate);
      } else {
        onChange({ start: tempStart, end: clickedDate });
      }
      setIsOpen(false);
    }
  };

  const setPreset = (type, e) => {
    e.stopPropagation();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (type === 'today') {
      onChange({ start: todayStr, end: todayStr });
      setTempStart(todayStr);
      setIsOpen(false);
    } else if (type === 'last7') {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      const pastStr = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(past.getDate()).padStart(2, '0')}`;
      onChange({ start: pastStr, end: todayStr });
      setTempStart(pastStr);
      setIsOpen(false);
    } else if (type === 'thisMonth') {
      const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const lastDayNum = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const lastDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;
      onChange({ start: firstDay, end: lastDay });
      setTempStart(firstDay);
      setIsOpen(false);
    } else if (type === 'clear') {
      onChange({ start: '', end: '' });
      setTempStart('');
      setIsOpen(false);
    }
  };

  const displayText = () => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate && !endDate) {
      return `${formatDate(startDate)} - Chọn ngày kết thúc`;
    }
    return 'dd/mm/yyyy - dd/mm/yyyy';
  };

  const hasRange = Boolean(startDate || endDate);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button: 1 nút duy nhất hiển thị khoảng ngày (dd/mm/yyyy - dd/mm/yyyy) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-xs ${hasRange
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        title="Chọn khoảng thời gian (dd/mm/yyyy - dd/mm/yyyy)"
      >
        <Calendar className={`w-3.5 h-3.5 shrink-0 ${hasRange ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
        <span className={hasRange ? 'font-bold tracking-tight text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400'}>
          {displayText()}
        </span>
        {hasRange && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange({ start: '', end: '' });
              setTempStart('');
            }}
            className="p-0.5 ml-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full text-emerald-700 dark:text-emerald-300 transition-colors"
            title="Xóa khoảng ngày"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </button>

      {/* Popover Calendar (Tô đậm khoảng 2 mốc ngày đã chọn) */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 w-72 sm:w-80 max-w-[calc(100vw-2rem)] animate-in fade-in duration-200">
          {/* Header trạng thái lựa chọn */}
          <div className="mb-2.5 pb-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Khoảng ngày:</span>
            {startDate && endDate ? (
              <span className="font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                {formatDate(startDate)} ➔ {formatDate(endDate)}
              </span>
            ) : tempStart ? (
              <span className="font-semibold text-amber-600 dark:text-amber-400 text-[11px]">
                {formatDate(tempStart)} ➔ Chọn ngày kết thúc
              </span>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-[11px]">
                Chọn 2 mốc thời gian
              </span>
            )}
          </div>

          {/* Điều hướng Tháng / Năm */}
          <div className="flex items-center justify-between pb-2 mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100">
              Tháng {viewMonth + 1}, {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Tiêu đề Thứ trong tuần */}
          <div className="grid grid-cols-7 gap-y-1 text-center mb-1">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
              <span key={i} className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                {d}
              </span>
            ))}
          </div>

          {/* Lưới các ô ngày trong tháng (Tô đậm khoảng ngày liền mạch) */}
          <div className="grid grid-cols-7 gap-y-1 text-center">
            {/* Ô trống trước ngày mùng 1 */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {/* Các ngày trong tháng */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const monthStr = String(viewMonth + 1).padStart(2, '0');
              const dayStr = String(day).padStart(2, '0');
              const dateStr = `${viewYear}-${monthStr}-${dayStr}`;

              const currentStart = startDate || tempStart;
              const isStart = dateStr === currentStart;
              const isEnd = dateStr === endDate;
              const hasFullRange = Boolean(currentStart && endDate);

              // Khoảng ngày đã chọn chốt
              const inRange = Boolean(hasFullRange && currentStart && endDate && dateStr > currentStart && dateStr < endDate);

              // Xem trước khoảng hover khi đang chọn ngày thứ 2
              let isHoverRange = false;
              let isHoverStart = false;
              let isHoverEnd = false;
              if (!endDate && currentStart && hoverDate && currentStart !== hoverDate) {
                const min = currentStart < hoverDate ? currentStart : hoverDate;
                const max = currentStart < hoverDate ? hoverDate : currentStart;
                isHoverRange = dateStr > min && dateStr < max;
                isHoverStart = dateStr === min;
                isHoverEnd = dateStr === max;
              }

              return (
                <div
                  key={day}
                  onMouseEnter={() => setHoverDate(dateStr)}
                  onMouseLeave={() => setHoverDate(null)}
                  className="h-8 flex items-center justify-center relative"
                >
                  {/* Dải màu tô đậm giữa 2 ngày (Range Highlight Bar) */}
                  {inRange && (
                    <div className="absolute inset-y-0 inset-x-0 bg-emerald-100 dark:bg-emerald-950/60" />
                  )}
                  {isStart && hasFullRange && !isEnd && (
                    <div className="absolute inset-y-0 right-0 left-1/2 bg-emerald-100 dark:bg-emerald-950/60" />
                  )}
                  {isEnd && hasFullRange && !isStart && (
                    <div className="absolute inset-y-0 left-0 right-1/2 bg-emerald-100 dark:bg-emerald-950/60" />
                  )}

                  {/* Dải màu xem trước khi rê chuột (Hover Range Preview) */}
                  {isHoverRange && (
                    <div className="absolute inset-y-0 inset-x-0 bg-emerald-50 dark:bg-emerald-950/30" />
                  )}
                  {isHoverStart && (
                    <div className="absolute inset-y-0 right-0 left-1/2 bg-emerald-50 dark:bg-emerald-950/30" />
                  )}
                  {isHoverEnd && (
                    <div className="absolute inset-y-0 left-0 right-1/2 bg-emerald-50 dark:bg-emerald-950/30" />
                  )}

                  {/* Nút bấm ngày */}
                  <button
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`relative z-10 w-7 h-7 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${isStart || isEnd
                        ? 'bg-emerald-600 text-white shadow-xs font-bold'
                        : inRange
                          ? 'text-emerald-900 dark:text-emerald-200 font-bold'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Phím tắt chọn nhanh & Xóa */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => setPreset('today', e)}
                className="px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 rounded font-medium transition-colors cursor-pointer"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={(e) => setPreset('last7', e)}
                className="px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 rounded font-medium transition-colors cursor-pointer"
              >
                7 ngày qua
              </button>
              <button
                type="button"
                onClick={(e) => setPreset('thisMonth', e)}
                className="px-2 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 rounded font-medium transition-colors cursor-pointer"
              >
                Tháng này
              </button>
            </div>
            {hasRange && (
              <button
                type="button"
                onClick={(e) => setPreset('clear', e)}
                className="text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
              >
                Xóa chọn
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('spend'); // 'spend' | 'meal' | 'shop'

  // State: Xác thực & Phiên làm việc (Google OAuth 2.0 & Access Control)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('smartspend_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [authError, setAuthError] = useState('');

  // State: Thu Chi
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'
  const [displayLimit, setDisplayLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null); // null when creating new
  const [newTrans, setNewTrans] = useState({
    type: 'expense',
    title: '',
    amount: '',
    category: 'Ăn uống',
    date: new Date().toISOString().split('T')[0],
  });

  // State: Thực Đơn
  const [weekOffset, setWeekOffset] = useState(0);
  const WEEK_DAYS = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  const todayKey = useMemo(() => {
    return WEEK_DAYS.find((d) => d.isToday)?.key || WEEK_DAYS[0].key;
  }, [WEEK_DAYS]);

  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [mealData, setMealData] = useState({}); // { "YYYY-MM-DD": [ { meal_name: "Bữa Sáng", main: "...", ... } ] }

  // Sync selected day to today when week changes if today is in this week
  useEffect(() => {
    if (weekOffset === 0) {
      setSelectedDay(todayKey);
    } else {
      setSelectedDay(WEEK_DAYS[0].key);
    }
  }, [weekOffset, todayKey, WEEK_DAYS]);

  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editingMealTarget, setEditingMealTarget] = useState(null); // { plan_date: 'YYYY-MM-DD', meal_name: 'Bữa Sáng' } or null for new
  const [mealForm, setMealForm] = useState({
    mealName: '',
    main: '',
    side: '',
    calories: '',
    ingredientsStr: '',
  });

  // State: Ô nhập liệu & Gợi ý (Autocomplete) trong modal Thực Đơn
  const [mainInputText, setMainInputText] = useState('');
  const [sideInputText, setSideInputText] = useState('');
  const [showMainSuggestions, setShowMainSuggestions] = useState(false);
  const [showSideSuggestions, setShowSideSuggestions] = useState(false);

  // State: Popup xác thực chốt hóa đơn đi chợ
  const [isConfirmFinalizeOpen, setIsConfirmFinalizeOpen] = useState(false);


  // State: Kéo thả sắp xếp bữa ăn
  const [draggedMealIdx, setDraggedMealIdx] = useState(null);
  const [dragOverMealIdx, setDragOverMealIdx] = useState(null);

  // State: Đi Chợ
  const [shoppingList, setShoppingList] = useState(INITIAL_SHOPPING_ITEMS);
  const [newIngredient, setNewIngredient] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newCategory, setNewCategory] = useState('Rau củ');
  const [actualTotalBill, setActualTotalBill] = useState('');

  // State: Chỉnh sửa món đi chợ
  const [isShoppingModalOpen, setIsShoppingModalOpen] = useState(false);
  const [editingShoppingItem, setEditingShoppingItem] = useState(null);
  const [shoppingEditForm, setShoppingEditForm] = useState({
    name: '',
    quantity: '',
    category: 'Rau củ',
  });

  // State: Settings
  const [categories, setCategories] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  // State: Ẩn/Hiện số dư tài khoản
  const [showBalance, setShowBalance] = useState(() => {
    return localStorage.getItem('smartspend_show_balance') !== 'false';
  });

  // Chuyển tab hoặc cuộn mượt lên đầu trang khi bấm lại tab đang chọn (Scroll to top on tab re-tap)
  const handleTabClick = (tabKey) => {
    if (activeTab === tabKey) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setActiveTab(tabKey);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // State: Món Ăn Mẫu (Preset Dishes & Ingredients)
  const [presetDishes, setPresetDishes] = useState([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPresetDish, setEditingPresetDish] = useState(null);
  const [presetForm, setPresetForm] = useState({
    name: '',
    category: 'Món chính',
    calories: '',
    ingredientsStr: '',
  });
  const [presetCategoryFilter, setPresetCategoryFilter] = useState('all');
  const [presetSearch, setPresetSearch] = useState('');

  // Gợi ý món chính từ Món Mẫu (Autocomplete)
  const mainSuggestions = useMemo(() => {
    const q = mainInputText.trim().toLowerCase();
    if (!q) return [];
    return presetDishes
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [mainInputText, presetDishes]);

  // Gợi ý món phụ từ Món Mẫu (Autocomplete)
  const sideSuggestions = useMemo(() => {
    const q = sideInputText.trim().toLowerCase();
    if (!q) return [];
    return presetDishes
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [sideInputText, presetDishes]);

  // Bản đồ số lượng món chính & món phụ hiện tại để hiển thị số phần
  const mainDishesMap = useMemo(() => {
    const lines = (mealForm.main || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const map = new Map();
    for (const l of lines) {
      const item = parseDishItem(l);
      map.set(item.name.toLowerCase(), item.count);
    }
    return map;
  }, [mealForm.main]);

  const sideDishesMap = useMemo(() => {
    const lines = (mealForm.side || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const map = new Map();
    for (const l of lines) {
      const item = parseDishItem(l);
      map.set(item.name.toLowerCase(), item.count);
    }
    return map;
  }, [mealForm.side]);


  // Database Connection Status
  const [dbStatus, setDbStatus] = useState({ checked: false, connected: false, database: null, error: null });

  // Xóa toàn bộ dữ liệu trong bộ nhớ state để đảm bảo tách biệt giữa các tài khoản
  const clearUserData = () => {
    setTransactions([]);
    setMealData({});
    setShoppingList([]);
    setSystemLogs([]);
    setPresetDishes([]);
  };

  // Hàm xử lý Đăng xuất
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('smartspend_token');
    localStorage.removeItem('smartspend_user');
    setCurrentUser(null);
    setAuthError('');
    clearUserData();
  };

  // Lắng nghe sự kiện phiên hết hạn hoặc bị hủy truy cập
  useEffect(() => {
    const handleAuthExpired = () => {
      localStorage.removeItem('smartspend_token');
      localStorage.removeItem('smartspend_user');
      setCurrentUser(null);
      clearUserData();
      setAuthError(
        'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.'
      );
    };

    window.addEventListener('smartspend:auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('smartspend:auth_expired', handleAuthExpired);
    };
  }, []);

  // Xác minh phiên đăng nhập qua /api/auth/me khi mở ứng dụng
  useEffect(() => {
    const token = localStorage.getItem('smartspend_token');
    if (!token) {
      setCurrentUser(null);
      setIsAuthChecking(false);
      return;
    }

    fetch('/api/auth/me')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          localStorage.setItem('smartspend_user', JSON.stringify(data.user));
        } else {
          localStorage.removeItem('smartspend_token');
          localStorage.removeItem('smartspend_user');
          setCurrentUser(null);
          clearUserData();
          if (res.status === 403) {
            setAuthError(
              'Tài khoản của bạn không có quyền truy cập vào hệ thống.'
            );
          }
        }
      })
      .catch(() => {
        // Lỗi kết nối mạng, tạm giữ token
      })
      .finally(() => {
        setIsAuthChecking(false);
      });
  }, []);

  // Handle Theme Change
  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
      root.classList.remove('dark', 'light');
      if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.classList.add(isDark ? 'dark' : 'light');
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme();
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Lock body scroll when any modal is open
  const anyModalOpen = isModalOpen || isMealModalOpen || isShoppingModalOpen || isPresetModalOpen || isConfirmFinalizeOpen;
  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [anyModalOpen]);

  // Initial load from PostgreSQL Backend API
  useEffect(() => {
    async function loadData() {
      // Chỉ tải dữ liệu người dùng khi đã đăng nhập hợp lệ
      if (!currentUser) return;

      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          if (healthData.database) {
            setDbStatus({
              checked: true,
              connected: healthData.database.connected,
              database: healthData.database.database,
              error: healthData.database.error,
            });
          }

          if (healthData.database?.connected) {
            // Load transactions from PostgreSQL
            try {
              const transRes = await fetch('/api/transactions');
              if (transRes.ok) {
                const transData = await transRes.json();
                if (Array.isArray(transData)) setTransactions(transData);
              }
            } catch (e) {
              console.error(e);
            }

            // Load meal plans from PostgreSQL
            let loadedMeals = {};
            try {
              const mealsRes = await fetch('/api/meals');
              if (mealsRes.ok) {
                const mealsJson = await mealsRes.json();
                if (mealsJson) {
                  loadedMeals = mealsJson;
                  setMealData(mealsJson);
                }
              }
            } catch (e) {
              console.error(e);
            }

            // Load groceries from PostgreSQL
            try {
              const grocRes = await fetch('/api/groceries');
              if (grocRes.ok) {
                const grocData = await grocRes.json();
                if (Array.isArray(grocData)) {
                  setShoppingList(filterExpiredUnboughtGroceries(grocData));
                }
              }
            } catch (e) {
              console.error(e);
            }

            // Load Categories
            try {
              const catRes = await fetch('/api/categories');
              if (catRes.ok) {
                const catData = await catRes.json();
                if (Array.isArray(catData)) setCategories(catData);
              }
            } catch (e) {
              console.error(e);
            }

            // Load System Logs
            try {
              const logRes = await fetch('/api/logs');
              if (logRes.ok) {
                const logData = await logRes.json();
                if (Array.isArray(logData)) setSystemLogs(logData);
              }
            } catch (e) {
              console.error(e);
            }

            // Load Preset Dishes
            try {
              const dishRes = await fetch('/api/preset-dishes');
              if (dishRes.ok) {
                const dishData = await dishRes.json();
                if (Array.isArray(dishData)) setPresetDishes(dishData);
              }
            } catch (e) {
              console.error(e);
            }
          }
        }
      } catch (err) {
        setDbStatus({ checked: true, connected: false, error: 'Server API chưa chạy' });
      }
    }
    loadData();
  }, [currentUser]);

  // Toast notification
  const [toastMessage, setToastMessage] = useState(null);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Calculations for Thu Chi
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }
    if (dateRange.start) {
      result = result.filter((t) => t.date >= dateRange.start);
    }
    if (dateRange.end) {
      result = result.filter((t) => t.date <= dateRange.end);
    }

    // Sắp xếp danh sách
    result.sort((a, b) => {
      if (sortBy === 'date-asc') {
        const dateDiff = (a.date || '').localeCompare(b.date || '');
        if (dateDiff !== 0) return dateDiff;
        return (a.created_at || '').localeCompare(b.created_at || '');
      }
      if (sortBy === 'amount-desc') {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }
      if (sortBy === 'amount-asc') {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }
      // Mặc định: 'date-desc' (Mới nhất trước)
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });

    return result;
  }, [transactions, filterType, dateRange, sortBy]);

  // Kiểm tra xem có đang lọc hoặc sort khác mặc định không
  const isFilterOrSortActive = filterType !== 'all' || Boolean(dateRange.start) || Boolean(dateRange.end) || sortBy !== 'date-desc';

  // Hàm đặt lại toàn bộ filter và sort về bình thường (mặc định)
  const handleResetFilters = () => {
    setFilterType('all');
    setDateRange({ start: '', end: '' });
    setSortBy('date-desc');
    setDisplayLimit(10);
  };

  // Open modal to add new transaction
  const handleOpenAddTransaction = () => {
    setEditingTransaction(null);
    setNewTrans({
      type: 'expense',
      title: '',
      amount: '',
      category: 'Ăn uống',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  // Open modal to edit transaction
  const handleOpenEditTransaction = (trans) => {
    setEditingTransaction(trans);
    setNewTrans({
      type: trans.type,
      title: trans.title,
      amount: formatNumberInput(trans.amount),
      category: trans.category,
      date: trans.date,
    });
    setIsModalOpen(true);
  };

  // Save Transaction (Add or Update)
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const parsedAmount = parseNumberInput(newTrans.amount);
    if (!newTrans.title.trim() || parsedAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ lớn hơn 0!');
      return;
    }

    if (editingTransaction) {
      // Update existing
      const updatedItem = {
        ...editingTransaction,
        type: newTrans.type,
        title: newTrans.title.trim(),
        amount: parsedAmount,
        category: newTrans.category,
        date: newTrans.date,
      };

      setTransactions(
        transactions.map((t) => (t.id === editingTransaction.id ? updatedItem : t))
      );
      showToast(`Đã cập nhật giao dịch: "${updatedItem.title}"`);

      try {
        const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem),
        });
        if (res.ok) {
          const saved = await res.json();
          // Sync created_at from server response
          if (saved && saved.created_at) {
            setTransactions((prev) =>
              prev.map((t) => (t.id === editingTransaction.id ? { ...updatedItem, created_at: saved.created_at } : t))
            );
          }
        }
      } catch (err) {
        console.warn('API sync:', err);
      }
    } else {
      // Create new — set created_at optimistically so time shows immediately
      const item = {
        id: Date.now().toString(),
        type: newTrans.type,
        title: newTrans.title.trim(),
        amount: parsedAmount,
        category: newTrans.category,
        date: newTrans.date,
        created_at: new Date().toISOString(),
      };
      setTransactions([item, ...transactions]);
      showToast(`Đã thêm giao dịch: "${item.title}"`);

      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (res.ok) {
          const saved = await res.json();
          // Sync id & created_at from server response
          if (saved && saved.id) {
            setTransactions((prev) =>
              prev.map((t) => (t.id === item.id ? { ...item, ...saved } : t))
            );
          }
        }
      } catch (err) {
        console.warn('API sync:', err);
      }
    }

    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
    showToast('Đã xóa giao dịch khỏi sổ');

    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  // ==========================================
  // Meal Editing Handlers
  // ==========================================
  const handleOpenEditMeal = (plan_date, meal = null) => {
    setEditingMealTarget({
      plan_date,
      original_meal_name: meal ? meal.meal_name : '',
    });

    setMealForm({
      mealName: meal ? meal.meal_name : '',
      main: meal ? meal.main : '',
      side: meal ? meal.side : '',
      calories: meal ? meal.calories : '',
      ingredientsStr: meal && meal.ingredients ? meal.ingredients.map((i) => i.name).join('\n') : '',
    });

    setMainInputText('');
    setSideInputText('');
    setShowMainSuggestions(false);
    setShowSideSuggestions(false);

    setIsMealModalOpen(true);
  };

  /**
   * Thêm món (Món chính hoặc Món phụ):
   * - Hỗ trợ nhập 1 món nhiều lần: Tự động cộng dồn tag x2, x3... (VD: "Cá basa kho tộ x2")
   * - Tự động đối chiếu món mẫu (kể cả khi gõ tay đúng tên món mẫu):
   *   + Tự động cộng dồn/merge nguyên liệu tương ứng vào danh sách nguyên liệu.
   *   + Tự động cộng dồn lượng calo vào ô "Calo ước tính".
   * - Xóa trắng ô nhập liệu sau khi thêm.
   */
  const handleAddDish = (type, dishName) => {
    const cleanName = (dishName || '').trim();
    if (!cleanName) return;

    // Parse tên nếu người dùng gõ sẵn đuôi x2, x3... hoặc lấy tên gốc
    const parsedInput = parseDishItem(cleanName);
    const baseName = parsedInput.name;
    const addCount = parsedInput.count || 1;

    const currentLines = (mealForm[type] || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedItems = currentLines.map(parseDishItem);

    const existingIdx = parsedItems.findIndex(
      (item) => item.name.toLowerCase() === baseName.toLowerCase()
    );

    let finalCount = addCount;
    if (existingIdx !== -1) {
      parsedItems[existingIdx].count += addCount;
      finalCount = parsedItems[existingIdx].count;
    } else {
      parsedItems.push({ name: baseName, count: addCount });
    }

    const updatedDishString = parsedItems.map(formatDishItem).join('\n');

    // Kiểm tra xem món có trong Món mẫu không (kể cả chọn gợi ý hoặc gõ tay đúng tên)
    const matchedPreset = presetDishes.find(
      (p) => p.name.trim().toLowerCase() === baseName.toLowerCase()
    );

    let updatedIngredientsStr = mealForm.ingredientsStr;
    let updatedCalories = mealForm.calories;

    if (matchedPreset) {
      // 1. Tự động cộng dồn nguyên liệu
      const currentIngrs = textToIngredientsArray(updatedIngredientsStr);
      const presetIngrs = Array.isArray(matchedPreset.ingredients) ? matchedPreset.ingredients : [];
      let merged = currentIngrs;
      for (let c = 0; c < addCount; c++) {
        merged = mergeIngredients(merged, presetIngrs);
      }
      updatedIngredientsStr = ingredientsArrayToText(merged);

      // 2. Tự động cộng dồn calo
      const presetCal = parseCaloriesNumber(matchedPreset.calories);
      if (presetCal > 0) {
        const currentCal = parseCaloriesNumber(mealForm.calories);
        const totalCal = currentCal + presetCal * addCount;
        updatedCalories = `${Math.round(totalCal)} kcal`;
      }

      showToast(
        `Đã thêm "${baseName}" ${finalCount > 1 ? `(x${finalCount})` : ''} và tự động nạp nguyên liệu, calo!`
      );
    } else {
      showToast(`Đã thêm món "${baseName}" ${finalCount > 1 ? `(x${finalCount})` : ''}!`);
    }

    setMealForm((prev) => ({
      ...prev,
      [type]: updatedDishString,
      calories: updatedCalories,
      ingredientsStr: updatedIngredientsStr,
    }));

    if (type === 'main') {
      setMainInputText('');
      setShowMainSuggestions(false);
    } else {
      setSideInputText('');
      setShowSideSuggestions(false);
    }
  };

  /**
   * Giảm bớt hoặc xóa món:
   * - Nếu tag có x2, x3...: Giảm 1 phần (x2 -> x1, hoặc x1 -> xóa)
   * - Tự động trừ nguyên liệu và lượng calo tương ứng khỏi thực đơn nếu món đó có trong món mẫu.
   */
  const handleRemoveDish = (type, dishLine) => {
    const target = parseDishItem(dishLine);
    const baseName = target.name;

    const currentLines = (mealForm[type] || '')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedItems = currentLines.map(parseDishItem);

    const existingIdx = parsedItems.findIndex(
      (item) => item.name.toLowerCase() === baseName.toLowerCase()
    );

    if (existingIdx === -1) return;

    // Đối chiếu món mẫu để trừ nguyên liệu & calo
    const matchedPreset = presetDishes.find(
      (p) => p.name.trim().toLowerCase() === baseName.toLowerCase()
    );

    let updatedIngredientsStr = mealForm.ingredientsStr;
    let updatedCalories = mealForm.calories;

    if (matchedPreset) {
      // 1. Trừ nguyên liệu
      if (Array.isArray(matchedPreset.ingredients) && matchedPreset.ingredients.length > 0) {
        const currentIngs = textToIngredientsArray(updatedIngredientsStr);
        const remaining = subtractIngredients(currentIngs, matchedPreset.ingredients);
        updatedIngredientsStr = ingredientsArrayToText(remaining);
      }

      // 2. Trừ calo
      const presetCal = parseCaloriesNumber(matchedPreset.calories);
      if (presetCal > 0) {
        const currentCal = parseCaloriesNumber(mealForm.calories);
        const remCal = Math.max(0, currentCal - presetCal);
        updatedCalories = remCal > 0 ? `${Math.round(remCal)} kcal` : '';
      }
    }

    if (parsedItems[existingIdx].count > 1) {
      parsedItems[existingIdx].count -= 1;
      const newCount = parsedItems[existingIdx].count;
      showToast(
        `Đã giảm 1 phần "${baseName}" ${newCount > 1 ? `(còn x${newCount})` : ''} và trừ nguyên liệu, calo!`
      );
    } else {
      parsedItems.splice(existingIdx, 1);
      showToast(`Đã xóa món "${baseName}" và tự động trừ nguyên liệu, calo!`);
    }

    const updatedDishString = parsedItems.map(formatDishItem).join('\n');

    setMealForm((prev) => ({
      ...prev,
      [type]: updatedDishString,
      calories: updatedCalories,
      ingredientsStr: updatedIngredientsStr,
    }));
  };

  // Chọn món chính từ dropdown Món ăn mẫu
  const handleSelectPresetForMain = (preset) => {
    if (!preset) return;
    handleAddDish('main', preset.name);
  };

  // Chọn món phụ từ dropdown Món ăn mẫu
  const handleSelectPresetForSide = (preset) => {
    if (!preset) return;
    handleAddDish('side', preset.name);
  };

  // Tự động quét và cộng dồn định lượng nguyên liệu trùng lặp trong form
  const handleSmartDeduplicateIngredients = () => {
    if (!mealForm.ingredientsStr.trim()) {
      showToast('Chưa có nguyên liệu nào để gộp');
      return;
    }
    const current = textToIngredientsArray(mealForm.ingredientsStr);
    const formatted = ingredientsArrayToText(current);
    setMealForm((prev) => ({ ...prev, ingredientsStr: formatted }));
    showToast('✨ Đã quét và tự động cộng dồn tất cả nguyên liệu trùng lặp!');
  };

  const handleSaveMeal = async (e) => {
    e.preventDefault();
    if (!editingMealTarget || !mealForm.mealName.trim()) {
      alert('Vui lòng nhập tên bữa ăn!');
      return;
    }

    // Nếu người dùng còn đang gõ ở ô món chính hoặc món phụ mà chưa bấm Thêm/Enter, tự động bổ sung
    let finalMain = mealForm.main;
    let finalSide = mealForm.side;
    let finalIngredients = mealForm.ingredientsStr;
    let finalCalories = mealForm.calories;

    if (mainInputText.trim()) {
      const parsedInput = parseDishItem(mainInputText.trim());
      const baseName = parsedInput.name;
      const addCount = parsedInput.count || 1;
      const currentLines = finalMain.split('\n').map((s) => s.trim()).filter(Boolean);
      const parsedItems = currentLines.map(parseDishItem);
      const exIdx = parsedItems.findIndex((i) => i.name.toLowerCase() === baseName.toLowerCase());
      if (exIdx !== -1) parsedItems[exIdx].count += addCount;
      else parsedItems.push({ name: baseName, count: addCount });
      finalMain = parsedItems.map(formatDishItem).join('\n');

      const matched = presetDishes.find((p) => p.name.trim().toLowerCase() === baseName.toLowerCase());
      if (matched) {
        const curIngrs = textToIngredientsArray(finalIngredients);
        const pIngrs = Array.isArray(matched.ingredients) ? matched.ingredients : [];
        let merged = curIngrs;
        for (let c = 0; c < addCount; c++) {
          merged = mergeIngredients(merged, pIngrs);
        }
        finalIngredients = ingredientsArrayToText(merged);
        const pCal = parseCaloriesNumber(matched.calories);
        if (pCal > 0) {
          const curCal = parseCaloriesNumber(finalCalories);
          finalCalories = `${Math.round(curCal + pCal * addCount)} kcal`;
        }
      }
    }

    if (sideInputText.trim()) {
      const parsedInput = parseDishItem(sideInputText.trim());
      const baseName = parsedInput.name;
      const addCount = parsedInput.count || 1;
      const currentLines = finalSide.split('\n').map((s) => s.trim()).filter(Boolean);
      const parsedItems = currentLines.map(parseDishItem);
      const exIdx = parsedItems.findIndex((i) => i.name.toLowerCase() === baseName.toLowerCase());
      if (exIdx !== -1) parsedItems[exIdx].count += addCount;
      else parsedItems.push({ name: baseName, count: addCount });
      finalSide = parsedItems.map(formatDishItem).join('\n');

      const matched = presetDishes.find((p) => p.name.trim().toLowerCase() === baseName.toLowerCase());
      if (matched) {
        const curIngrs = textToIngredientsArray(finalIngredients);
        const pIngrs = Array.isArray(matched.ingredients) ? matched.ingredients : [];
        let merged = curIngrs;
        for (let c = 0; c < addCount; c++) {
          merged = mergeIngredients(merged, pIngrs);
        }
        finalIngredients = ingredientsArrayToText(merged);
      }
    }

    if (!finalMain.trim()) {
      alert('Vui lòng thêm ít nhất 1 món chính vào thực đơn!');
      return;
    }

    const { plan_date, original_meal_name } = editingMealTarget;

    // Parse ingredients and preserve isBought state if it exists
    const parsedIngredients = textToIngredientsArray(mealForm.ingredientsStr).map((ing) => {
      let isBought = false;
      const formattedName = ing.quantity ? `${ing.name} (${ing.quantity})` : ing.name;
      if (original_meal_name) {
        const oldMeal = mealData[plan_date]?.find((m) => m.meal_name === original_meal_name);
        const oldIngr = oldMeal?.ingredients?.find((i) => {
          const normOld = (i.name || '').toLowerCase().trim();
          const normIng = (ing.name || '').toLowerCase().trim();
          return normOld.includes(normIng) || normIng.includes(normOld);
        });
        if (oldIngr) isBought = oldIngr.isBought;
      }
      return {
        name: formattedName,
        isBought,
      };
    });

    const mealPayload = {
      meal_name: mealForm.mealName.trim(),
      main: mealForm.main.trim(),
      side: mealForm.side.trim(),
      calories: mealForm.calories.trim(),
      ingredients: parsedIngredients,
    };

    let dayMeals = mealData[plan_date] ? [...mealData[plan_date]] : [];
    if (original_meal_name) {
      dayMeals = dayMeals.map((m) => (m.meal_name === original_meal_name ? mealPayload : m));
    } else {
      dayMeals.push(mealPayload);
    }

    setMealData({
      ...mealData,
      [plan_date]: dayMeals,
    });

    setIsMealModalOpen(false);
    setEditingMealTarget(null);
    showToast(`Đã lưu thực đơn ${mealPayload.meal_name}!`);

    try {
      await fetch('/api/meals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_date, ...mealPayload }),
      });

      // If renamed, delete the old one
      if (original_meal_name && original_meal_name !== mealPayload.meal_name) {
        await fetch('/api/meals', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_date, meal_name: original_meal_name }),
        });
      }
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  // ==========================================
  // Preset Dishes Handlers (Món Ăn Mẫu)
  // ==========================================
  const handleOpenNewPresetDish = () => {
    setEditingPresetDish(null);
    setPresetForm({
      name: '',
      category: 'Món chính',
      calories: '',
      ingredientsStr: '',
    });
    setIsPresetModalOpen(true);
  };

  const handleOpenEditPresetDish = (dish) => {
    setEditingPresetDish(dish);
    const ingrText = Array.isArray(dish.ingredients)
      ? ingredientsArrayToText(dish.ingredients)
      : '';
    setPresetForm({
      name: dish.name || '',
      category: dish.category || 'Món chính',
      calories: dish.calories || '',
      ingredientsStr: ingrText,
    });
    setIsPresetModalOpen(true);
  };

  const handleSavePresetDish = async (e) => {
    e.preventDefault();
    if (!presetForm.name.trim()) return;

    const parsedIngredients = textToIngredientsArray(presetForm.ingredientsStr);

    const payload = {
      name: presetForm.name.trim(),
      category: presetForm.category || 'Món chính',
      calories: presetForm.calories.trim(),
      ingredients: parsedIngredients,
    };

    if (editingPresetDish) {
      try {
        const res = await fetch(`/api/preset-dishes/${editingPresetDish.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setPresetDishes((prev) =>
            prev.map((d) => (d.id === editingPresetDish.id ? updated : d))
          );
          showToast(`Đã cập nhật món mẫu "${payload.name}"!`);
        }
      } catch (err) {
        console.warn('Save preset dish error:', err);
      }
    } else {
      try {
        const res = await fetch('/api/preset-dishes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setPresetDishes((prev) => [created, ...prev]);
          showToast(`Đã thêm món mẫu "${payload.name}"!`);
        }
      } catch (err) {
        console.warn('Create preset dish error:', err);
      }
    }

    setIsPresetModalOpen(false);
    setEditingPresetDish(null);
  };

  const handleDeletePresetDish = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa món mẫu "${name}" khỏi danh sách?`)) return;

    try {
      const res = await fetch(`/api/preset-dishes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPresetDishes((prev) => prev.filter((d) => d.id !== id));
        showToast(`Đã xóa món mẫu "${name}"!`);
      } else {
        const data = await res.json();
        alert(data.error || 'Không thể xóa món mẫu này');
      }
    } catch (err) {
      console.warn('Delete preset dish error:', err);
    }
  };

  const handleDeleteMeal = async (plan_date, meal_name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bữa ${meal_name}?`)) return;

    let dayMeals = mealData[plan_date] ? [...mealData[plan_date]] : [];
    dayMeals = dayMeals.filter((m) => m.meal_name !== meal_name);

    setMealData({
      ...mealData,
      [plan_date]: dayMeals,
    });

    showToast(`Đã xóa thực đơn ${meal_name}`);

    try {
      await fetch('/api/meals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_date, meal_name }),
      });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  // Sắp xếp lại thứ tự bữa ăn (Drag & Drop Reorder)
  const handleReorderMeal = async (fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
    const currentMeals = mealData[selectedDay] ? [...mealData[selectedDay]] : [];
    if (!currentMeals[fromIndex] || !currentMeals[toIndex]) return;

    const [movedMeal] = currentMeals.splice(fromIndex, 1);
    currentMeals.splice(toIndex, 0, movedMeal);

    setMealData((prev) => ({
      ...prev,
      [selectedDay]: currentMeals,
    }));
    setDraggedMealIdx(null);
    setDragOverMealIdx(null);
    showToast(`Đã chuyển "${movedMeal.meal_name}" ${toIndex < fromIndex ? 'lên trước' : 'xuống sau'}!`);

    try {
      await fetch('/api/meals/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_date: selectedDay,
          meals: currentMeals,
        }),
      });
    } catch (err) {
      console.warn('API sync reorder error:', err);
    }
  };

  const handleToggleIngredientBought = async (plan_date, meal_name, ingredientName) => {
    let dayMeals = mealData[plan_date] ? [...mealData[plan_date]] : [];
    let updatedMeal = null;
    let newBoughtStatus = false;

    dayMeals = dayMeals.map((m) => {
      if (m.meal_name === meal_name) {
        const updatedIngredients = m.ingredients.map((i) => {
          if (i.name.toLowerCase().trim() === ingredientName.toLowerCase().trim()) {
            newBoughtStatus = !i.isBought;
            return { ...i, isBought: newBoughtStatus };
          }
          return i;
        });
        updatedMeal = { ...m, ingredients: updatedIngredients };
        return updatedMeal;
      }
      return m;
    });

    setMealData({
      ...mealData,
      [plan_date]: dayMeals,
    });

    // 1. Xử lý đồng bộ danh sách Đi Chợ (Tab 3):
    if (newBoughtStatus) {
      // Khi đã có sẵn nguyên liệu (tick chọn) -> Bỏ luôn khỏi giỏ hàng đi chợ, không để gạch ngang
      const itemsToRemove = shoppingList.filter((item) => {
        const isMatchName = item.name.toLowerCase().trim() === ingredientName.toLowerCase().trim();
        const isMatchDate = !item.plan_date || item.plan_date === plan_date;
        return isMatchName && isMatchDate;
      });

      // Xóa khỏi state shoppingList
      setShoppingList((prev) =>
        prev.filter((item) => {
          const isMatchName = item.name.toLowerCase().trim() === ingredientName.toLowerCase().trim();
          const isMatchDate = !item.plan_date || item.plan_date === plan_date;
          return !(isMatchName && isMatchDate);
        })
      );

      // Xóa khỏi CSDL (bảng grocery_items)
      for (const item of itemsToRemove) {
        fetch(`/api/groceries/${item.id}`, { method: 'DELETE' }).catch((e) =>
          console.warn('Delete grocery item error:', e)
        );
      }
      showToast(`Đã bỏ "${ingredientName}" ra khỏi giỏ đi chợ (vì đã có sẵn)`);
    } else {
      // Khi bỏ tick (chưa có sẵn) -> Tự động thêm lại vào giỏ đi chợ nếu chưa có
      const existsInCart = shoppingList.some((item) => {
        const isMatchName = item.name.toLowerCase().trim() === ingredientName.toLowerCase().trim();
        const isMatchDate = !item.plan_date || item.plan_date === plan_date;
        return isMatchName && isMatchDate;
      });

      if (!existsInCart) {
        const mealTag = formatMealTag(plan_date, meal_name);
        const newItem = {
          id: `${Date.now()}`,
          name: ingredientName,
          quantity: mealTag,
          category: '',
          checked: false,
          plan_date: plan_date || null,
        };

        setShoppingList((prev) => [...prev, newItem]);

        fetch('/api/groceries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newItem),
        }).catch((e) => console.warn('Re-add grocery error:', e));

        showToast(`Đã thêm lại "${ingredientName}" vào giỏ đi chợ`);
      }
    }

    // 2. Lưu thực đơn xuống DB
    if (updatedMeal) {
      try {
        await fetch('/api/meals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_date, ...updatedMeal }),
        });
      } catch (err) {
        console.warn('API sync meal error:', err);
      }
    }
  };

  // ==========================================
  // Shopping Item Handlers
  // ==========================================
  const handleToggleCheck = async (id) => {
    const itemToToggle = shoppingList.find((i) => i.id === id);
    if (!itemToToggle) return;

    const newCheckedStatus = !itemToToggle.checked;

    setShoppingList(
      shoppingList.map((item) =>
        item.id === id ? { ...item, checked: newCheckedStatus } : item
      )
    );

    try {
      await fetch(`/api/groceries/${id}/toggle`, { method: 'PATCH' });
    } catch (err) {
      console.warn('API sync:', err);
    }

    // --- Sync with Meal Planner ---
    let mealDataUpdated = false;
    const newMealData = { ...mealData };

    Object.keys(newMealData).forEach(plan_date => {
      // Nếu món có lưu plan_date cụ thể, chỉ cập nhật đúng ngày đó
      if (itemToToggle.plan_date && itemToToggle.plan_date !== plan_date) {
        return;
      }
      let dayMealsUpdated = false;
      const updatedDayMeals = newMealData[plan_date].map(meal => {
        let mealUpdated = false;
        const newIngredients = meal.ingredients?.map(ing => {
          if (ing.name.toLowerCase().trim() === itemToToggle.name.toLowerCase().trim() && !!ing.isBought !== newCheckedStatus) {
            mealUpdated = true;
            return { ...ing, isBought: newCheckedStatus };
          }
          return ing;
        });

        if (mealUpdated) {
          dayMealsUpdated = true;
          const updatedMeal = { ...meal, ingredients: newIngredients };
          // Background sync to DB
          fetch('/api/meals', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_date, ...updatedMeal }),
          }).catch(e => console.warn('Sync meal error:', e));

          return updatedMeal;
        }
        return meal;
      });

      if (dayMealsUpdated) {
        mealDataUpdated = true;
        newMealData[plan_date] = updatedDayMeals;
      }
    });

    if (mealDataUpdated) {
      setMealData(newMealData);
    }
  };

  const handleDeleteShoppingItem = async (id) => {
    setShoppingList(shoppingList.filter((item) => item.id !== id));
    try {
      await fetch(`/api/groceries/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  const handleAddShoppingItem = async (e) => {
    e.preventDefault();
    if (!newIngredient.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      name: newIngredient.trim(),
      quantity: newQuantity.trim() || '1 phần',
      category: '',
      checked: false,
    };
    setShoppingList([...shoppingList, newItem]);
    setNewIngredient('');
    setNewQuantity('');
    showToast(`Đã thêm "${newItem.name}" vào danh sách đi chợ!`);

    try {
      await fetch('/api/groceries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  // Helper to safely format or migrate quantity if it was previously 'Theo khẩu phần'
  const getDisplayQuantity = (item) => {
    if (item.quantity && item.quantity !== 'Theo khẩu phần') {
      return item.quantity;
    }
    if (item.plan_date) {
      const dayMeals = mealData[item.plan_date] || [];
      const foundMeal = dayMeals.find((m) =>
        m.ingredients?.some((i) => i.name.toLowerCase() === item.name.toLowerCase())
      );
      if (foundMeal) {
        return formatMealTag(item.plan_date, foundMeal.meal_name);
      }
      return formatMealTag(item.plan_date, 'Thực Đơn');
    }
    return '1 phần';
  };

  // Open Edit Shopping Item Modal
  const handleOpenEditShoppingItem = (item) => {
    setEditingShoppingItem(item);
    setShoppingEditForm({
      name: item.name,
      quantity: getDisplayQuantity(item),
      category: item.category,
    });
    setIsShoppingModalOpen(true);
  };

  // Save Shopping Item Edit
  const handleSaveShoppingItem = async (e) => {
    e.preventDefault();
    if (!editingShoppingItem || !shoppingEditForm.name.trim()) return;

    const updatedItem = {
      ...editingShoppingItem,
      name: shoppingEditForm.name.trim(),
      quantity: shoppingEditForm.quantity.trim() || '1 phần',
      category: '',
    };

    setShoppingList(
      shoppingList.map((i) =>
        i.id === editingShoppingItem.id ? updatedItem : i
      )
    );

    setIsShoppingModalOpen(false);
    setEditingShoppingItem(null);
    showToast(`Đã cập nhật món "${updatedItem.name}"!`);

    try {
      await fetch(`/api/groceries/${editingShoppingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  // Batch add ingredients from meal
  const handleAddMealIngredientsToCart = async (planDate, mealName, ingredients) => {
    if (!ingredients || ingredients.length === 0) return;

    const mealTag = formatMealTag(planDate, mealName);

    // Lọc ra các món chưa mua trong bữa ăn này mà CHƯA có trong giỏ đi chợ của chính bữa ăn này
    const pendingIngredients = ingredients.filter((ing) => {
      if (ing.isBought) return false;

      // Chỉ bỏ qua nếu món này đã có trong giỏ của chính ngày và bữa ăn này mà chưa mua
      const isAlreadyInCartForThisMeal = shoppingList.some((item) => {
        const isMatchName = item.name?.toLowerCase().trim() === ing.name?.toLowerCase().trim();
        const isMatchDate = !item.plan_date || item.plan_date === planDate;
        const isMatchMeal = !item.quantity || item.quantity.includes(mealName) || item.quantity === mealTag;
        return isMatchName && isMatchDate && isMatchMeal && !item.checked;
      });

      return !isAlreadyInCartForThisMeal;
    });

    if (pendingIngredients.length === 0) {
      const allBought = ingredients.every((i) => i.isBought);
      if (allBought) {
        showToast(`Tất cả nguyên liệu của [${mealTag}] đã được mua!`);
      } else {
        showToast(`Tất cả món chưa mua của [${mealTag}] đã có trong giỏ đi chợ!`);
      }
      return;
    }

    const newItems = pendingIngredients.map((ing, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: ing.name,
      quantity: mealTag,
      category: '',
      checked: false,
      plan_date: planDate || null,
    }));

    setShoppingList((prev) => [...prev, ...newItems]);
    showToast(`Đã thêm ${newItems.length} món của ${mealTag} vào giỏ đi chợ!`);

    try {
      await fetch('/api/groceries/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems, plan_date: planDate || null }),
      });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  // Bắt đầu quy trình chốt sổ: Kiểm tra điều kiện và mở popup xác thực
  const handleInitiateFinalizeShopping = () => {
    const completedItems = activeShoppingList.filter((i) => i.checked);
    const completedCount = completedItems.length;

    // Yêu cầu 7: Chốt sổ hoá đơn mà ko có nguyên liệu nào đc mua là ko đc, hiển thị popup cảnh báo
    if (completedCount === 0) {
      alert('⚠️ Bạn chưa chọn nguyên liệu nào đã mua! Vui lòng tích chọn ít nhất 1 món đã mua trong danh sách trước khi chốt hóa đơn.');
      return;
    }

    const billAmount = parseNumberInput(actualTotalBill);
    if (billAmount <= 0) {
      alert('⚠️ Vui lòng nhập số tiền hóa đơn thực tế hợp lệ lớn hơn 0đ!');
      return;
    }

    // Yêu cầu 8: Mở popup xác thực số lượng món & số tiền trước khi ghi sổ
    setIsConfirmFinalizeOpen(true);
  };

  // Xác nhận chốt hóa đơn & ghi sổ từ Popup Verify
  const handleConfirmFinalizeShopping = async () => {
    const billAmount = parseNumberInput(actualTotalBill);
    const completedItems = activeShoppingList.filter((i) => i.checked);
    const completedCount = completedItems.length;

    if (completedCount === 0 || billAmount <= 0) {
      setIsConfirmFinalizeOpen(false);
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      type: 'expense',
      title: `Đi chợ (${completedCount > 0 ? `${completedCount} món` : 'Hóa đơn tổng'})`,
      amount: billAmount,
      category: 'Đi chợ',
      date: new Date().toISOString().split('T')[0],
    };

    setTransactions([newExpense, ...transactions]);
    setShoppingList((prev) => prev.filter((i) => !i.checked));
    setActualTotalBill('');
    setIsConfirmFinalizeOpen(false);
    showToast(`Đã chốt hóa đơn ${formatVND(billAmount)} (${completedCount} món) và ghi vào Sổ Thu Chi!`);

    try {
      await fetch('/api/groceries/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billAmount }),
      });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  const handleClearCompletedGroceries = async () => {
    const completedCount = shoppingList.filter((i) => i.checked).length;
    setShoppingList((prev) => prev.filter((i) => !i.checked));
    showToast(completedCount > 0 ? `Đã dọn dẹp ${completedCount} món đã mua khỏi danh sách` : 'Đã dọn dẹp các món đã mua');
    try {
      await fetch('/api/groceries/bought', { method: 'DELETE' });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  // ==========================================
  // Settings Handlers
  // ==========================================
  const handleAddCategory = async (type, name) => {
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name: name.trim() })
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        showToast(`Đã thêm danh mục "${name}"`);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Xóa danh mục "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter(c => c.id !== id));
        showToast(`Đã xóa danh mục "${name}"`);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleExportCSV = () => {
    const header = ['Thời gian', 'Giờ', 'Loại', 'Số tiền (VNĐ)', 'Danh mục', 'Tiêu đề'];
    const csvContent = [
      header.join(','),
      ...transactions.map(t => [
        `"${formatDate(t.date)}"`,
        `"${formatTime(t.created_at)}"`,
        t.type === 'income' ? 'Thu' : 'Chi',
        formatAmountForCSV(t.amount),
        `"${t.category}"`,
        `"${t.title.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    // Add BOM for UTF-8 in Excel
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lich-su-giao-dich-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  const handleExportLogsCSV = () => {
    if (!systemLogs || systemLogs.length === 0) {
      alert('Chưa có bản ghi nhật ký nào để xuất!');
      return;
    }
    const header = ['Thời gian', 'Hành động', 'Loại dữ liệu', 'Chi tiết (Tên đối tượng)'];
    const actionLabel = (action) => {
      const map = { CREATE: 'Thêm mới', UPDATE: 'Cập nhật', DELETE: 'Xóa', TOGGLE: 'Thay đổi trạng thái', FINALIZE: 'Chốt hóa đơn', REORDER: 'Sắp xếp lại', BATCH: 'Thêm hàng loạt' };
      return map[action?.toUpperCase()] || action || '';
    };
    const entityLabel = (type) => {
      const map = { transaction: 'Giao dịch thu chi', meal: 'Thực đơn bữa ăn', grocery: 'Nguyên liệu đi chợ', category: 'Danh mục', shopping: 'Đi chợ' };
      return map[type?.toLowerCase()] || type || '';
    };
    const csvContent = [
      header.join(','),
      ...systemLogs.map(log => [
        `"${formatLogTime(log.created_at || log.time)}"`,
        `"${actionLabel(log.action).replace(/"/g, '""')}"`,
        `"${entityLabel(log.entity_type).replace(/"/g, '""')}"`,
        `"${(log.entity_name || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhat-ky-he-thong-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file nhật ký (CSV) thành công!');
  };

  const currentMeal = mealData[selectedDay] || mealData[todayKey] || {
    sang: { main: '', side: '', calories: '', ingredients: [] },
    trua: { main: '', side: '', calories: '', ingredients: [] },
    toi: { main: '', side: '', calories: '', ingredients: [] },
  };


  // Danh sách đi chợ hợp lệ, tự động sắp xếp theo thứ tự bữa ăn từ gần nhất tới xa nhất
  const activeShoppingList = useMemo(() => {
    const list = filterExpiredUnboughtGroceries(shoppingList);

    const getMealRank = (str = '') => {
      const s = (str || '').toLowerCase();
      if (s.includes('sáng')) return 1;
      if (s.includes('trưa')) return 2;
      if (s.includes('chiều') || s.includes('xế')) return 3;
      if (s.includes('tối')) return 4;
      return 5;
    };

    return [...list].sort((a, b) => {
      // 1. Món chưa mua hiển thị trước, món đã tick mua hiển thị sau
      if (a.checked !== b.checked) return a.checked ? 1 : -1;

      // 2. Ngày thực đơn: gần nhất tới xa nhất (YYYY-MM-DD tăng dần)
      // Các món thêm tự do không gắn ngày sẽ xếp cùng ngày hôm nay (todayKey) để ưu tiên mua
      const dateA = a.plan_date || todayKey;
      const dateB = b.plan_date || todayKey;
      if (dateA !== dateB) return dateA.localeCompare(dateB);

      // 3. Thứ tự bữa trong ngày: Sáng (1) -> Trưa (2) -> Chiều (3) -> Tối (4)
      const rankA = getMealRank(a.quantity);
      const rankB = getMealRank(b.quantity);
      if (rankA !== rankB) return rankA - rankB;

      // 4. Theo thời gian tạo hoặc theo tên
      if (a.created_at && b.created_at) {
        return a.created_at.localeCompare(b.created_at);
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [shoppingList, todayKey]);

  const checkedShoppingCount = useMemo(() => {
    return activeShoppingList.filter((i) => i.checked).length;
  }, [activeShoppingList]);

  // Màn hình tải trạng thái phiên đăng nhập ban đầu
  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
            <img
              src="/Logo.png"
              alt="SmartSpend Logo"
              className="w-full h-full object-cover rounded-[14px]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-2">
            <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <span>Đang xác minh phiên đăng nhập...</span>
          </div>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập hoặc bị từ chối truy cập -> Hiển thị Màn hình xác thực Google SSO
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setAuthError('');
        }}
        initialError={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 pb-16 md:pb-10 transition-colors duration-200">
      {/* Toast Notification (Repositioned to bottom-right on desktop to avoid covering top tabs) */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 z-50 bg-gray-900/95 dark:bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl shadow-black/20 flex items-center gap-2.5 text-xs sm:text-sm font-medium backdrop-blur-md border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400 dark:text-emerald-200 shrink-0" />
          <span className="whitespace-nowrap">{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-xs transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <img
              src="/Logo.png?v=2"
              alt="SmartSpend & Meal Logo"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700/80 p-0.5 shrink-0"
            />
            <div className="shrink-0">
              <h1 className="font-bold text-base sm:text-lg leading-none text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap">
                SmartSpend <span className="text-emerald-600 dark:text-emerald-400">&</span> Meal
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-normal whitespace-nowrap">
                Sổ Thu Chi & Thực Đơn Đi Chợ Tuần
              </p>
            </div>
          </div>

          {/* Database Connection Indicator, Quick Dark Mode Toggle & Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Compact Server Online Status Dot with Tooltip on Hover */}
            <div
              className="relative group shrink-0 flex items-center justify-center p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer shadow-2xs"
              title={dbStatus.connected ? 'Đã kết nối' : 'Không thể kết nối'}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dbStatus.connected ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dbStatus.connected
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                    }`}
                />
              </span>

              {/* Floating Tooltip on Hover */}
              <div className="absolute top-full right-0 mt-2 z-50 pointer-events-none opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-150 ease-out whitespace-nowrap">
                <div className="bg-gray-900/95 dark:bg-gray-800 text-white text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-xl border border-gray-700/50 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${dbStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                      }`}
                  />
                  <span>
                    {dbStatus.connected ? 'Đã kết nối' : 'Không thể kết nối'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Dark Mode Toggle Button */}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-2xs shrink-0 cursor-pointer"
              title={theme === 'dark' ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/90 dark:bg-gray-800/90 p-1 rounded-xl border border-gray-200/70 dark:border-gray-700/70 shrink-0">
              <button
                onClick={() => handleTabClick('spend')}
                className={`relative flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm whitespace-nowrap transition-all ${activeTab === 'spend'
                    ? 'font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-gray-700 shadow-sm border border-emerald-500/25 dark:border-emerald-500/30'
                    : 'font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <Wallet className={`w-4 h-4 shrink-0 ${activeTab === 'spend' ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.25]' : ''}`} />
                <span className="whitespace-nowrap">Sổ Thu Chi</span>
                {activeTab === 'spend' && (
                  <span className="absolute bottom-0.5 left-2.5 right-2.5 h-[3px] bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
                )}
              </button>
              <button
                onClick={() => handleTabClick('meal')}
                className={`relative flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm whitespace-nowrap transition-all ${activeTab === 'meal'
                    ? 'font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-gray-700 shadow-sm border border-emerald-500/25 dark:border-emerald-500/30'
                    : 'font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <Utensils className={`w-4 h-4 shrink-0 ${activeTab === 'meal' ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.25]' : ''}`} />
                <span className="whitespace-nowrap">Thực Đơn Tuần</span>
                {activeTab === 'meal' && (
                  <span className="absolute bottom-0.5 left-2.5 right-2.5 h-[3px] bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
                )}
              </button>
              <button
                onClick={() => handleTabClick('shop')}
                className={`relative flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm whitespace-nowrap transition-all ${activeTab === 'shop'
                    ? 'font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-gray-700 shadow-sm border border-emerald-500/25 dark:border-emerald-500/30'
                    : 'font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <ShoppingCart className={`w-4 h-4 shrink-0 ${activeTab === 'shop' ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.25]' : ''}`} />
                <span className="whitespace-nowrap">Đi Chợ</span>
                {activeShoppingList.length > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                    {activeShoppingList.length}
                  </span>
                )}
                {activeTab === 'shop' && (
                  <span className="absolute bottom-0.5 left-2.5 right-2.5 h-[3px] bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
                )}
              </button>
              <button
                onClick={() => handleTabClick('settings')}
                className={`relative flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm whitespace-nowrap transition-all ${activeTab === 'settings'
                    ? 'font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-gray-700 shadow-sm border border-emerald-500/25 dark:border-emerald-500/30'
                    : 'font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
              >
                <Settings className={`w-4 h-4 shrink-0 ${activeTab === 'settings' ? 'text-emerald-600 dark:text-emerald-400 stroke-[2.25]' : ''}`} />
                <span className="whitespace-nowrap">Cài Đặt</span>
                {activeTab === 'settings' && (
                  <span className="absolute bottom-0.5 left-2.5 right-2.5 h-[3px] bg-emerald-600 dark:bg-emerald-400 rounded-full shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
                )}
              </button>
            </nav>

            {/* User Profile & Logout Action */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-gray-200/80 dark:border-gray-700/80 shrink-0">
                <div
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => handleTabClick('settings')}
                  title={`Đang đăng nhập: ${currentUser.email}`}
                >
                  <UserAvatar
                    user={currentUser}
                    size="sm"
                    className="group-hover:ring-2 group-hover:ring-emerald-500/30"
                  />
                  <div className="hidden xl:flex flex-col text-left leading-tight max-w-[120px]">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                      {currentUser.name || 'Người dùng'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                      {currentUser.email}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-gray-500 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-gray-200/70 dark:border-gray-700/70 bg-gray-50/50 dark:bg-gray-800/50 transition-all cursor-pointer shadow-2xs"
                  title="Đăng xuất khỏi hệ thống"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* ========================================================================= */}
        {/* TAB 1: THU CHI (EXPENSE TRACKER)                                          */}
        {/* ========================================================================= */}
        {activeTab === 'spend' && (
          <div className="space-y-6">
            {/* 3 Summary Statistics Cards with Soft Drop-Shadow & Depth */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-5">
              {/* Card 1: Tổng Thu */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_14px_36px_rgb(0,0,0,0.09)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tổng Thu
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight relative z-10">
                  {showBalance ? formatVND(totalIncome) : '•••••••• đ'}
                </div>
                <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 truncate relative z-10">
                  Đã cộng dồn thu nhập
                </p>

                {/* Biểu đồ Sparkline mờ làm nền (Income Upward Trend) */}
                <div className="absolute right-0 bottom-0 w-36 sm:w-48 h-14 sm:h-18 pointer-events-none opacity-45 dark:opacity-30">
                  <svg viewBox="0 0 160 60" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="incomeSparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 48 C 25 48, 40 40, 65 38 C 90 36, 105 42, 125 22 C 140 10, 150 14, 160 6 L 160 60 L 0 60 Z"
                      fill="url(#incomeSparkGrad)"
                    />
                    <path
                      d="M 0 48 C 25 48, 40 40, 65 38 C 90 36, 105 42, 125 22 C 140 10, 150 14, 160 6"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="160" cy="6" r="3" fill="#10b981" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Tổng Chi Tiêu */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_14px_36px_rgb(0,0,0,0.09)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tổng Chi
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight relative z-10">
                  {showBalance ? formatVND(totalExpense) : '•••••••• đ'}
                </div>
                <p className="text-[10px] sm:text-xs text-rose-500 dark:text-rose-400 font-medium mt-1 truncate relative z-10">
                  Sinh hoạt & đi chợ
                </p>

                {/* Biểu đồ Sparkline mờ làm nền (Expense Fluctuating Trend) */}
                <div className="absolute right-0 bottom-0 w-36 sm:w-48 h-14 sm:h-18 pointer-events-none opacity-45 dark:opacity-30">
                  <svg viewBox="0 0 160 60" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="expenseSparkGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 38 C 25 38, 35 18, 60 25 C 85 32, 95 14, 120 30 C 135 40, 148 24, 160 16 L 160 60 L 0 60 Z"
                      fill="url(#expenseSparkGrad)"
                    />
                    <path
                      d="M 0 38 C 25 38, 35 18, 60 25 C 85 32, 95 14, 120 30 C 135 40, 148 24, 160 16"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="160" cy="16" r="3" fill="#f43f5e" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Số Dư Hiện Tại (Dải màu chuyển từ Xanh Ngọc Teal sang Xanh Lá Cây Thẫm) */}
              <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-teal-600 via-emerald-700 to-emerald-950 dark:from-teal-700 dark:via-emerald-900 dark:to-gray-950 text-white p-4 sm:p-5 rounded-2xl shadow-[0_8px_30px_rgba(13,148,136,0.25)] hover:shadow-[0_14px_36px_rgba(13,148,136,0.35)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden border border-teal-400/25 dark:border-teal-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] sm:text-xs font-semibold text-teal-100 uppercase tracking-wider">
                      Số Dư Hiện Tại
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBalance((prev) => {
                        const next = !prev;
                        localStorage.setItem('smartspend_show_balance', String(next));
                        return next;
                      })}
                      className="p-1 rounded-md text-teal-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
                      title={showBalance ? "Ẩn số tiền (số dư, tổng thu, tổng chi)" : "Hiện số tiền (số dư, tổng thu, tổng chi)"}
                      aria-label={showBalance ? "Ẩn số tiền (số dư, tổng thu, tổng chi)" : "Hiện số tiền (số dư, tổng thu, tổng chi)"}
                    >
                      {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 backdrop-blur-xs text-teal-100 flex items-center justify-center border border-white/20 shadow-xs">
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
                  {showBalance ? formatVND(balance) : '•••••••• đ'}
                </div>
                <p className="text-[10px] sm:text-xs text-teal-200 mt-1 truncate">
                  {balance >= 0 ? 'Tài chính ổn định' : 'Cần tối ưu ngân sách'}
                </p>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none blur-sm" />
                <div className="absolute -left-6 -top-6 w-20 h-20 bg-teal-300/10 rounded-full pointer-events-none blur-sm" />
              </div>
            </div>

            {/* Actions Bar & Filter */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterType === 'all'
                      ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  Tất cả ({filteredTransactions.length})
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterType === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  Khoản Chi
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${filterType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  Khoản Thu
                </button>
                {/* 1 nút duy nhất chọn khoảng ngày có tô đậm */}
                <DateRangePicker
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onChange={(range) => setDateRange(range)}
                />

                {/* Sắp xếp danh sách */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-300 shadow-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-xs text-gray-700 dark:text-gray-200 bg-transparent dark:bg-gray-800 outline-none cursor-pointer font-medium pr-1"
                    title="Sắp xếp danh sách giao dịch"
                  >
                    <option value="date-desc" className="dark:bg-gray-800">Mới nhất (Mặc định)</option>
                    <option value="date-asc" className="dark:bg-gray-800">Cũ nhất</option>
                    <option value="amount-desc" className="dark:bg-gray-800">Số tiền: Cao ➔ Thấp</option>
                    <option value="amount-asc" className="dark:bg-gray-800">Số tiền: Thấp ➔ Cao</option>
                  </select>
                </div>

                {/* Nút Đặt lại bộ lọc (chỉ hiển thị khi đang lọc để xóa/đặt lại, không có nút mặc định dư thừa) */}
                {isFilterOrSortActive && (
                  <button
                    onClick={handleResetFilters}
                    title="Đặt lại toàn bộ bộ lọc và sắp xếp về ban đầu"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all shadow-xs cursor-pointer animate-in fade-in"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Đặt lại bộ lọc</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleOpenAddTransaction}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow active:scale-98 transition-all shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm giao dịch mới</span>
              </button>
            </div>

            {/* Transaction History List with Edit and Delete */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs overflow-hidden">
              <div className="p-3.5 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base whitespace-nowrap">
                    Lịch sử giao dịch gần đây
                  </h3>
                  {isFilterOrSortActive && (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                      Đang tùy chỉnh
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  <span>{filteredTransactions.length} giao dịch</span>
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredTransactions.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                    Chưa có giao dịch nào trong danh mục này.
                  </div>
                ) : (
                  filteredTransactions.slice(0, displayLimit).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 sm:p-4 sm:px-5 flex items-center justify-between gap-2 sm:gap-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors group"
                    >
                      {/* Left: Type Icon + Title + Category & Date Badges */}
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'income'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400'
                            }`}
                        >
                          {item.type === 'income' ? (
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="font-semibold text-gray-900 dark:text-white text-xs sm:text-sm truncate"
                            title={item.title}
                          >
                            {item.title}
                          </div>
                          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
                            <span className="text-[10px] sm:text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 sm:px-2 py-0.5 rounded-md font-medium whitespace-nowrap shrink-0">
                              {item.category}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 whitespace-nowrap shrink-0">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                              {formatDate(item.date)}
                              {formatTime(item.created_at) && (
                                <>
                                  <span className="text-gray-300 dark:text-gray-600">·</span>
                                  <span>{formatTime(item.created_at)}</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Formatted Amount (Never Wrap) + Edit/Delete Buttons */}
                      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 text-right ml-1">
                        <span
                          className={`font-bold text-xs sm:text-base whitespace-nowrap tabular-nums shrink-0 ${item.type === 'income'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                            }`}
                        >
                          {item.type === 'income' ? '+' : '-'}&nbsp;{formatVND(item.amount)}
                        </span>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-0.5 sm:gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                          <button
                            onClick={() => handleOpenEditTransaction(item)}
                            className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 sm:p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Chỉnh sửa giao dịch"
                          >
                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(item.id)}
                            className="text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 sm:p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Xóa giao dịch"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {filteredTransactions.length > displayLimit && (
                <div className="p-3 border-t border-gray-100 dark:border-gray-700 flex justify-center bg-gray-50/30 dark:bg-gray-800/40">
                  <button
                    onClick={() => setDisplayLimit((prev) => prev + 10)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-5 py-2.5 rounded-xl transition-colors active:scale-95"
                  >
                    Xem thêm giao dịch
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: THỰC ĐƠN TUẦN (MEAL PLANNER)                                       */}
        {/* ========================================================================= */}
        {activeTab === 'meal' && (
          <div className="space-y-6">
            {/* Weekday Selector Bar */}
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-3 px-1 gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Kế hoạch tuần từ Thứ Hai đến Chủ Nhật
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWeekOffset(prev => prev - 1)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    &lt; Tuần trước
                  </button>
                  <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                    Tuần này
                  </button>
                  <button onClick={() => setWeekOffset(prev => prev + 1)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    Tuần sau &gt;
                  </button>
                </div>
              </div>

              {/* Grid 7 days */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {WEEK_DAYS.map((day) => {
                  const isSelected = selectedDay === day.key;
                  const currentMeals = mealData[day.key] || [];
                  const hasMeals = currentMeals.length > 0;

                  return (
                    <button
                      key={day.key}
                      onClick={() => setSelectedDay(day.key)}
                      className={`relative flex flex-col items-center py-2.5 sm:py-3 rounded-xl transition-all ${isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20 scale-102'
                          : 'bg-gray-50 dark:bg-gray-700/60 hover:bg-emerald-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-300'
                        }`}
                    >
                      {hasMeals && !isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-xs"></span>
                      )}
                      {day.isToday && (
                        <span
                          className={`absolute -top-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${isSelected
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-emerald-600 text-white'
                            }`}
                        >
                          Nay
                        </span>
                      )}
                      <span className="text-xs sm:text-sm">{day.label}</span>
                      <span
                        className={`text-[10px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-gray-400 dark:text-gray-400'
                          }`}
                      >
                        {day.dateStr}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Meal Cards */}
            {(() => {
              const currentDayObj = WEEK_DAYS.find(d => d.key === selectedDay);
              const isPast = currentDayObj?.isPast;
              const currentMeals = mealData[selectedDay] || [];

              return (
                <div className="space-y-6 sm:space-y-7">
                  {/* Selected Day Header Bar with the SINGLE Primary Action Button */}
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                      <span>{currentDayObj?.label}</span>
                      <span className="text-gray-400 dark:text-gray-500 font-normal text-xs sm:text-sm">
                        ({currentDayObj?.dateStr})
                      </span>
                      {isPast ? (
                        <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                          Đã qua
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                          {currentMeals.length} bữa ăn
                        </span>
                      )}
                    </h3>

                    {/* The ONLY 1 'Thêm bữa ăn' Button */}
                    {!isPast && (
                      <button
                        onClick={() => handleOpenEditMeal(selectedDay)}
                        className="flex items-center gap-2 bg-gradient-to-r from-teal-600 via-teal-700 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 sm:px-5 sm:py-2.5 rounded-xl border border-teal-400/50 shadow-md shadow-teal-900/20 hover:shadow-lg hover:shadow-teal-900/30 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Thêm bữa ăn</span>
                      </button>
                    )}
                  </div>

                  {currentMeals.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] p-12 text-center flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                      <div className="w-16 h-16 rounded-3xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3">
                        <Utensils className="w-8 h-8 stroke-[1.75]" />
                      </div>
                      <p className="font-bold text-gray-800 dark:text-gray-100 text-base mb-1.5">
                        Chưa có thực đơn nào cho ngày này
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm">
                        Lên kế hoạch ăn uống khoa học giúp bạn tiết kiệm chi phí, ăn uống lành mạnh và chủ động chuẩn bị nguyên liệu đi chợ.
                      </p>
                    </div>
                  ) : (
                    /* Enhanced Spacing & Soft Drop-Shadow for Elevated Depth */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-7">
                      {currentMeals.map((meal, idx) => {
                        const hasIngredients = meal.ingredients && meal.ingredients.length > 0;
                        const isAllBought = hasIngredients && meal.ingredients.every(i => i.isBought);

                        return (
                          <div
                            key={meal.meal_name || idx}
                            draggable={!isPast && currentMeals.length > 1}
                            onDragStart={(e) => {
                              setDraggedMealIdx(idx);
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', idx.toString());
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverMealIdx !== idx) {
                                setDragOverMealIdx(idx);
                              }
                            }}
                            onDragLeave={(e) => {
                              if (e.currentTarget.contains(e.relatedTarget)) return;
                              if (dragOverMealIdx === idx) {
                                setDragOverMealIdx(null);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              handleReorderMeal(draggedMealIdx, idx);
                            }}
                            onDragEnd={() => {
                              setDraggedMealIdx(null);
                              setDragOverMealIdx(null);
                            }}
                            className={`bg-white dark:bg-gray-800 rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-300 relative ${!isPast && currentMeals.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                              } ${draggedMealIdx === idx
                                ? 'opacity-40 scale-95 border-dashed border-emerald-500 shadow-none'
                                : dragOverMealIdx === idx
                                  ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-2xl scale-[1.02]'
                                  : 'border-gray-100 dark:border-gray-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] hover:shadow-[0_16px_40px_rgb(0,0,0,0.1)] hover:-translate-y-1'
                              }`}
                          >
                            <div className="p-6">
                              <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 dark:border-gray-700/80">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                                    <Utensils className="w-4 h-4" />
                                  </div>
                                  <h4 className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{meal.meal_name}</h4>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-1.5">
                                  {meal.calories && (
                                    <span className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                                      {meal.calories}
                                    </span>
                                  )}
                                  {!isPast && (
                                    <>
                                      <button
                                        onClick={() => handleOpenEditMeal(selectedDay, meal)}
                                        className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                                        title="Chỉnh sửa thực đơn"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMeal(selectedDay, meal.meal_name)}
                                        className="text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                        title="Xóa thực đơn"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                {meal.main ? (
                                  <div className="space-y-1">
                                    {meal.main.split('\n').map((dish, dIdx) => {
                                      const cleanDish = dish.trim();
                                      if (!cleanDish) return null;
                                      return (
                                        <h5
                                          key={dIdx}
                                          className="font-bold text-base text-gray-900 dark:text-white leading-snug"
                                        >
                                          {cleanDish}
                                        </h5>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <h5 className="font-normal text-base text-gray-400 dark:text-gray-500 italic">
                                    Chưa lên thực đơn
                                  </h5>
                                )}

                                {meal.side ? (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 pt-0.5">
                                    {meal.side.split('\n').map((sDish, sIdx) => {
                                      const cleanSide = sDish.trim();
                                      if (!cleanSide) return null;
                                      return (
                                        <p key={sIdx} className="leading-relaxed">
                                          {sIdx === 0 && (
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-1.5">
                                              Kèm:
                                            </span>
                                          )}
                                          <span>{cleanSide}</span>
                                        </p>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                    Chưa có món phụ
                                  </p>
                                )}
                              </div>

                              {/* Nguyên liệu chuẩn bị với trạng thái Đã mua vs Cần mua trực quan */}
                              <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-700/80">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    Nguyên liệu chuẩn bị:
                                  </span>
                                  {hasIngredients && (
                                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                      {meal.ingredients.filter(i => i.isBought).length}/{meal.ingredients.length}
                                    </span>
                                  )}
                                </div>
                                <ul className="space-y-1.5">
                                  {hasIngredients ? (
                                    meal.ingredients.map((ing, iIdx) => {
                                      const isBought = Boolean(ing.isBought);
                                      return (
                                        <li
                                          key={iIdx}
                                          className={`flex items-center justify-between py-1.5 px-2 rounded-xl text-xs transition-all ${isBought
                                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'
                                            }`}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <button
                                              type="button"
                                              onClick={() => !isPast && handleToggleIngredientBought(selectedDay, meal.meal_name, ing.name)}
                                              disabled={isPast}
                                              className={`w-5 h-5 shrink-0 rounded-lg flex items-center justify-center transition-all ${isBought
                                                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-xs'
                                                  : 'bg-gray-100 dark:bg-gray-700/70 text-gray-400 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-gray-200 dark:border-gray-600'
                                                } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                                              title={isPast ? "Đã qua ngày" : (isBought ? "Đã mua - Bấm để chuyển về Cần mua" : "Cần mua - Bấm để đánh dấu Đã mua")}
                                            >
                                              {isBought ? (
                                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                              ) : (
                                                <ShoppingCart className="w-3 h-3 text-gray-400 dark:text-gray-400" />
                                              )}
                                            </button>
                                            <span
                                              className={`truncate ${isBought
                                                  ? 'line-through text-emerald-800/80 dark:text-emerald-300/70 font-medium decoration-emerald-500/50'
                                                  : 'font-medium text-gray-800 dark:text-gray-200'
                                                }`}
                                            >
                                              {ing.name}
                                            </span>
                                          </div>

                                          {/* Right Status Badge */}
                                          {isPast && !isBought ? (
                                            <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full font-medium shrink-0 ml-2">
                                              Đã bỏ qua
                                            </span>
                                          ) : isBought ? (
                                            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full font-bold shrink-0 ml-2">
                                              Đã mua
                                            </span>
                                          ) : (
                                            <span className="text-[10px] text-gray-400 dark:text-gray-400 bg-gray-100/90 dark:bg-gray-700/60 px-2 py-0.5 rounded-full font-normal shrink-0 ml-2">
                                              Cần mua
                                            </span>
                                          )}
                                        </li>
                                      );
                                    })
                                  ) : (
                                    <li className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center gap-2 py-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                                      Chưa có nguyên liệu
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>

                            {/* Tương tác "Đã mua đủ" vs "Thêm món chưa mua vào giỏ" */}
                            <div className="p-4 bg-gray-50/60 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700/80">
                              {isAllBought ? (
                                <div className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-emerald-600 dark:bg-emerald-600 shadow-sm shadow-emerald-700/30 border border-emerald-500 select-none transition-all duration-300">
                                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                  <span className="tracking-wide">Đã mua đủ nguyên liệu</span>
                                </div>
                              ) : (
                                <button
                                  disabled={!hasIngredients || isPast}
                                  onClick={() => handleAddMealIngredientsToCart(selectedDay, meal.meal_name, meal.ingredients || [])}
                                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${isPast
                                      ? 'text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 cursor-not-allowed'
                                      : 'text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-700/80 shadow-2xs hover:shadow-xs active:scale-98 cursor-pointer'
                                    }`}
                                >
                                  <Plus className="w-4 h-4 stroke-[2.5]" />
                                  <span>{isPast ? 'Đã qua hạn đi chợ' : 'Thêm món chưa mua vào giỏ'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Smart Meal Insight Tip (Hộp Mẹo Gọn Gàng) */}
            <div className="bg-gradient-to-r from-amber-50/80 via-emerald-50/40 to-teal-50/60 dark:from-gray-800/90 dark:via-emerald-950/20 dark:to-gray-800/90 border border-amber-200/60 dark:border-gray-700/80 p-3 sm:p-3.5 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs border border-amber-200/60 dark:border-amber-800/60">
                <Lightbulb className="w-4 h-4 stroke-[2.25]" />
              </div>
              <div className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed flex-1">
                <strong className="text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider text-[11px] mr-1.5">
                  Mẹo:
                </strong>
                Nhấp vào icon trước nguyên liệu để đổi trạng thái <strong>Cần mua ⇄ Đã mua</strong>. Hệ thống sẽ chỉ nhặt món chưa mua vào giỏ hàng.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ĐI CHỢ (SHOPPING CHECKLIST & CHECKOUT)                              */}
        {/* ========================================================================= */}
        {activeTab === 'shop' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Quick Add Form + Checklist */}
            <div className="lg:col-span-2 space-y-5">
              {/* Quick Add Form */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Thêm nhanh nguyên liệu cần mua
                </h3>

                <form onSubmit={handleAddShoppingItem} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    placeholder="Tên nguyên liệu (VD: Thịt bò, Cải ngọt...)"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Số lượng (VD: 500g, 2 bó)"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full sm:w-44 px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm</span>
                  </button>
                </form>
              </div>

              {/* Shopping Checklist with Edit and Delete */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                      Danh sách thực phẩm
                    </h3>
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium px-2 py-0.5 rounded-full">
                      {checkedShoppingCount} / {activeShoppingList.length} đã mua
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {activeShoppingList.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                      Giỏ đi chợ đang trống. Hãy thêm nguyên liệu từ Thực đơn hoặc nhập ở trên!
                    </div>
                  ) : (
                    activeShoppingList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleCheck(item.id)}
                        className={`p-3 sm:p-3.5 sm:px-5 flex items-center justify-between gap-2 cursor-pointer select-none transition-colors ${item.checked ? 'bg-gray-50/50 dark:bg-gray-800/40' : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/40'
                          }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${item.checked
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'
                              }`}
                          >
                            {item.checked ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <span
                            className={`text-xs sm:text-sm font-medium transition-all truncate min-w-0 ${item.checked
                                ? 'line-through text-gray-400 dark:text-gray-500'
                                : 'text-gray-800 dark:text-gray-200'
                              }`}
                            title={item.name}
                          >
                            {item.name}
                          </span>

                          <span className="text-[10px] sm:text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 sm:px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                            {getDisplayQuantity(item)}
                          </span>

                          {item.plan_date && !getDisplayQuantity(item)?.includes('/') && (
                            <span className="hidden sm:inline-flex items-center text-[10px] bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-md font-medium whitespace-nowrap shrink-0">
                              Thực đơn {formatDate(item.plan_date)}
                            </span>
                          )}
                        </div>

                        {/* Actions: Edit and Delete */}
                        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditShoppingItem(item);
                            }}
                            className="text-gray-300 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded-lg transition-colors"
                            title="Chỉnh sửa món này"
                          >
                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShoppingItem(item.id);
                            }}
                            className="text-gray-300 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded-lg transition-colors"
                            title="Xóa món"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Col: Bill Confirmation & Sync into Tab 1 */}
            <div className="space-y-4">
              {/* Checkout Card with Soft Elevation & Depth */}
              <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400 font-bold text-base">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <h4>Chốt Sổ Hóa Đơn</h4>
                </div>

                {/* Total Bill Input */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                    Tổng tiền hóa đơn thực tế (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatNumberInput(actualTotalBill)}
                      onChange={(e) => setActualTotalBill(formatNumberInput(e.target.value))}
                      placeholder="VD: 350.000"
                      className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-bold text-base focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500">
                      VNĐ
                    </span>
                  </div>
                </div>

                {/* Summary Info */}
                <div className="p-3.5 bg-gray-50/90 dark:bg-gray-700/50 rounded-2xl text-xs text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-600/40">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Đã hoàn thành:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-bold text-xs sm:text-sm">
                      {checkedShoppingCount} món
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInitiateFinalizeShopping}
                  className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-600/35 hover:shadow-xl hover:shadow-emerald-600/50 hover:-translate-y-0.5 active:scale-98 transition-all flex items-center justify-center gap-2.5 text-sm cursor-pointer border border-emerald-400/30"
                >
                  <CheckCircle2 className="w-5 h-5 stroke-[2.25] shrink-0" />
                  <span className="tracking-wide">Chốt hóa đơn & Ghi sổ</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CÀI ĐẶT (SETTINGS)                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Thẻ Tài khoản & Bảo mật (Google OAuth 2.0 & Access Control) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] border border-gray-100 dark:border-gray-700/80">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-2">
                  <UserAvatar
                    user={currentUser}
                    size="lg"
                    className="shadow-sm"
                  />
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                      {currentUser?.name || 'Tài khoản Google'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60 transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
                  title="Đăng xuất khỏi ứng dụng"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4 stroke-[2.25]" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            </div>

            {/* ================================================================= */}
            {/* KHỐI QUẢN LÝ MÓN ĂN MẪU & CÔNG THỨC NGUYÊN LIỆU (PRESET RECIPES) */}
            {/* ================================================================= */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.25)] border border-gray-100 dark:border-gray-700/80 space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                      Món Ăn Mẫu & Công Thức Nguyên Liệu
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {presetDishes.length} món
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Thiết lập món kèm định lượng chuẩn khi lên thực đơn.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenNewPresetDish}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Thêm Món Mẫu</span>
                </button>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'Món chính', label: 'Món chính' },
                    { id: 'Món canh', label: 'Món canh' },
                    { id: 'Món xào', label: 'Món xào' },
                    { id: 'Món phụ', label: 'Món phụ' },
                    { id: 'Ăn sáng', label: 'Ăn sáng' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPresetCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                        presetCategoryFilter === cat.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên món hoặc nguyên liệu..."
                    value={presetSearch}
                    onChange={(e) => setPresetSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-200 placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                  {presetSearch && (
                    <button
                      type="button"
                      onClick={() => setPresetSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {presetDishes
                  .filter((dish) => {
                    const matchCat =
                      presetCategoryFilter === 'all' || dish.category === presetCategoryFilter;
                    const q = presetSearch.toLowerCase().trim();
                    const matchQ =
                      !q ||
                      dish.name.toLowerCase().includes(q) ||
                      (Array.isArray(dish.ingredients) &&
                        dish.ingredients.some(
                          (i) =>
                            i.name?.toLowerCase().includes(q) ||
                            i.quantity?.toLowerCase().includes(q)
                        ));
                    return matchCat && matchQ;
                  })
                  .map((dish) => (
                    <div
                      key={dish.id}
                      className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600/50 transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        {/* Top: Name & Badges */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                              {dish.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                                {dish.category || 'Món chính'}
                              </span>
                              {dish.calories && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300">
                                   {dish.calories}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditPresetDish(dish)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-gray-600 transition-colors cursor-pointer"
                              title="Chỉnh sửa công thức món mẫu"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePresetDish(dish.id, dish.name)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-white dark:hover:bg-gray-600 transition-colors cursor-pointer"
                              title="Xóa món mẫu này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Ingredients Tag Chips */}
                        <div className="mt-2.5 pt-2 border-t border-gray-200/50 dark:border-gray-600/50">
                          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-400 block mb-1">
                            Nguyên liệu định lượng:
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar pr-0.5">
                            {Array.isArray(dish.ingredients) && dish.ingredients.length > 0 ? (
                              dish.ingredients.map((ing, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/70 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium"
                                >
                                  {ing.name}
                                  {ing.quantity ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold ml-1">
                                      ({ing.quantity})
                                    </span>
                                  ) : null}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">Chưa có nguyên liệu</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Empty state when filtering */}
              {presetDishes.filter((dish) => {
                const matchCat =
                  presetCategoryFilter === 'all' || dish.category === presetCategoryFilter;
                const q = presetSearch.toLowerCase().trim();
                return (
                  matchCat &&
                  (!q ||
                    dish.name.toLowerCase().includes(q) ||
                    (Array.isArray(dish.ingredients) &&
                      dish.ingredients.some((i) => i.name?.toLowerCase().includes(q))))
                );
              }).length === 0 && (
                <div className="py-8 text-center text-gray-400 dark:text-gray-500 text-xs">
                  Không tìm thấy món ăn mẫu nào phù hợp với bộ lọc hiện tại.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* Cột trái: Khối Dữ liệu & Hệ thống làm gọn gàng */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-700/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-100 dark:border-gray-700/60">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Database className="w-3.5 h-3.5 stroke-[2.25]" />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                      Dữ liệu & Hệ thống
                    </h2>
                  </div>

                  <div className="space-y-2">
                    {/* Hàng 1: Xuất lịch sử giao dịch (CSV) */}
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            Xuất Lịch Sử Giao Dịch
                          </h3>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            File CSV thu chi (Excel / Google Sheets)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleExportCSV}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-gray-800 border border-emerald-600/70 dark:border-emerald-500/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs hover:shadow-xs active:scale-98 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                        title="Tải về file CSV lịch sử thu chi"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[2.25]" />
                        <span>Tải CSV</span>
                      </button>
                    </div>

                    {/* Hàng 2: Nhật ký hệ thống (Logs) */}
                    <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700/60 hover:border-emerald-200 dark:hover:border-emerald-800/60 transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                            Nhật Ký Thao Tác (Audit Logs)
                          </h3>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            Lịch sử thêm, sửa, xóa để đối soát
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleExportLogsCSV}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-gray-800 border border-emerald-600/70 dark:border-emerald-500/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shadow-2xs hover:shadow-xs active:scale-98 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                        title="Tải về file CSV nhật ký hệ thống"
                      >
                        <Download className="w-3.5 h-3.5 stroke-[2.25]" />
                        <span>Tải CSV</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cột phải: Quản lý danh mục làm gọn gàng */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-gray-100 dark:border-gray-700/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-gray-100 dark:border-gray-700/60">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Tag className="w-3.5 h-3.5 stroke-[2.25]" />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                      Quản lý danh mục
                    </h2>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target;
                      handleAddCategory(form.type.value, form.name.value);
                      form.reset();
                    }}
                    className="flex items-center gap-2 mb-3"
                  >
                    <select
                      name="type"
                      className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shrink-0 cursor-pointer"
                      required
                    >
                      <option value="expense" className="dark:bg-gray-800">Khoản Chi</option>
                      <option value="income" className="dark:bg-gray-800">Khoản Thu</option>
                    </select>
                    <input
                      name="name"
                      placeholder="Tên danh mục mới..."
                      className="flex-1 min-w-0 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg font-bold text-xs shadow-xs active:scale-98 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Thêm</span>
                    </button>
                  </form>
                </div>

                {/* Danh sách danh mục gọn gàng */}
                <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar flex-1">
                  {categories.filter(c => c.type === 'expense' || c.type === 'income').map(c => (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all ${c.type === 'expense'
                          ? 'border-l-3 border-l-rose-500 border-gray-100 dark:border-gray-700/80 bg-rose-50/20 dark:bg-rose-950/10'
                          : 'border-l-3 border-l-emerald-500 border-gray-100 dark:border-gray-700/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                        }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${c.type === 'expense'
                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                          }`}>
                          {c.type === 'expense' ? 'Chi' : 'Thu'}
                        </span>
                        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {c.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Xóa danh mục này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Thông tin thương hiệu ứng dụng */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <img
                src="/Logo.png?v=2"
                alt="SmartSpend & Meal Logo"
                className="w-16 h-16 rounded-2xl object-contain bg-white dark:bg-gray-700 p-1 border border-gray-100 dark:border-gray-600 shadow-xs shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">SmartSpend & Meal</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">v1.0.0</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Hệ thống quản lý chi tiêu thông minh kết hợp lập kế hoạch thực đơn dinh dưỡng và đi chợ tuần cho gia đình.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: THÊM / CHỈNH SỬA GIAO DỊCH THU CHI                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in" style={{ overscrollBehavior: 'contain' }} onWheel={e => e.stopPropagation()} >
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                {editingTransaction ? (
                  <>
                    <Pencil className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Chỉnh Sửa Giao Dịch
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Thêm Giao Dịch Mới
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTransaction(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setNewTrans({ ...newTrans, type: 'expense' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${newTrans.type === 'expense'
                      ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                    }`}
                >
                  Khoản Chi
                </button>
                <button
                  type="button"
                  onClick={() => setNewTrans({ ...newTrans, type: 'income' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${newTrans.type === 'income'
                      ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                    }`}
                >
                  Khoản Thu
                </button>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Nội dung giao dịch
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cà phê, Tiền điện, Lương..."
                  value={newTrans.title}
                  onChange={(e) => setNewTrans({ ...newTrans, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Số tiền (VNĐ)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="VD: 50.000"
                    value={formatNumberInput(newTrans.amount)}
                    onChange={(e) => {
                      const formatted = formatNumberInput(e.target.value);
                      setNewTrans({ ...newTrans, amount: formatted });
                    }}
                    className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white font-bold placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 dark:text-gray-500 pointer-events-none">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={newTrans.category}
                    onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    {categories.filter(c => c.type === newTrans.type).map(c => (
                      <option key={c.id} value={c.name} className="dark:bg-gray-800">{c.name}</option>
                    ))}
                    {categories.filter(c => c.type === newTrans.type).length === 0 && (
                      <option value="Khác" className="dark:bg-gray-800">Khác</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Ngày ghi
                  </label>
                  <input
                    type="date"
                    value={newTrans.date}
                    onChange={(e) => setNewTrans({ ...newTrans, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-800 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  {editingTransaction ? 'Cập nhật giao dịch' : 'Lưu giao dịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CHỈNH SỬA THỰC ĐƠN BỮA ĂN (MEAL EDIT MODAL)                      */}
      {/* ========================================================================= */}
      {isMealModalOpen && editingMealTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in" style={{ overscrollBehavior: 'contain' }} onWheel={e => e.stopPropagation()} >
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  {editingMealTarget.original_meal_name ? 'Chỉnh Sửa Thực Đơn' : 'Thêm Bữa Ăn Mới'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsMealModalOpen(false);
                  setEditingMealTarget(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="p-5 space-y-4">
              {/* Tên bữa ăn & Calo ước tính */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Tên bữa ăn
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Bữa Sáng, Bữa Trưa..."
                    value={mealForm.mealName}
                    onChange={(e) => setMealForm({ ...mealForm, mealName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    Calo ước tính
                    <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 normal-case">(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 550 kcal"
                    value={mealForm.calories}
                    onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Main Dish with Preset Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Món chính
                  </label>
                </div>

                {/* Quick Select from Preset Dishes (Chỉ hiển thị Món chính) */}
                {presetDishes && presetDishes.some((p) => (p.category || '').toLowerCase() === 'món chính') && (
                  <div className="mb-2">
                    <select
                      onChange={(e) => {
                        const found = presetDishes.find((p) => p.id === e.target.value);
                        if (found) {
                          handleSelectPresetForMain(found);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="w-full text-xs py-2 px-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="" disabled>✨ Chọn nhanh Món Chính Mẫu...</option>
                      {presetDishes
                        .filter((p) => (p.category || '').toLowerCase() === 'món chính')
                        .map((p) => {
                          const count = mainDishesMap.get(p.name.trim().toLowerCase()) || 0;
                          return (
                            <option
                              key={p.id}
                              value={p.id}
                            >
                              {p.name} {count > 0 ? `(Đang có x${count} - chọn để thêm)` : (p.calories ? `• ${p.calories}` : '')}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                )}

                {/* Danh sách món chính đã chọn dạng chip (hỗ trợ tag x2, x3...) */}
                {mealForm.main.split('\n').map((s) => s.trim()).filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {mealForm.main.split('\n').map((s) => s.trim()).filter(Boolean).map((dishLine, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300/60 dark:border-emerald-700/60 shadow-2xs"
                      >
                        <span>{dishLine}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDish('main', dishLine)}
                          className="p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded text-emerald-700 dark:text-emerald-300 cursor-pointer"
                          title={`Bớt 1 phần hoặc xóa món "${dishLine}"`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Ô nhập 1 dòng kèm Autocomplete Gợi Ý Món Mẫu */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Gõ tên món chính rồi nhấn Enter (hoặc chọn gợi ý)..."
                      value={mainInputText}
                      onChange={(e) => {
                        setMainInputText(e.target.value);
                        setShowMainSuggestions(true);
                      }}
                      onFocus={() => setShowMainSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowMainSuggestions(false), 200)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (mainInputText.trim()) {
                            handleAddDish('main', mainInputText.trim());
                          }
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (mainInputText.trim()) {
                          handleAddDish('main', mainInputText.trim());
                        }
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                      title="Thêm món chính"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span className="hidden sm:inline">Thêm</span>
                    </button>
                  </div>

                  {/* Dropdown Gợi ý Autocomplete */}
                  {showMainSuggestions && mainSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
                      <div className="p-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 px-2.5 flex items-center justify-between">
                        <span>Gợi ý từ Món mẫu</span>
                        <span className="text-[10px]">Nhấn để chọn</span>
                      </div>
                      {mainSuggestions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddDish('main', p.name);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-between text-xs text-gray-800 dark:text-gray-200 transition-colors border-b last:border-b-0 border-gray-50 dark:border-gray-700/40 cursor-pointer"
                        >
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300">{p.name}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            {p.calories && <span className="text-amber-600 dark:text-amber-400 font-medium">🔥 {p.calories}</span>}
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px]">{p.category || 'Món chính'}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Side Dish with Preset Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Món phụ / Canh ăn kèm
                  </label>
                </div>

                {/* Quick Select from Preset Dishes (Lọc bỏ Món chính, chỉ hiển thị Món canh, Món xào, Món phụ...) */}
                {presetDishes && presetDishes.some((p) => (p.category || '').toLowerCase() !== 'món chính') && (
                  <div className="mb-2">
                    <select
                      onChange={(e) => {
                        const found = presetDishes.find((p) => p.id === e.target.value);
                        if (found) {
                          handleSelectPresetForSide(found);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="w-full text-xs py-2 px-2.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="" disabled>✨ Chọn nhanh Món Phụ / Canh Mẫu...</option>
                      {presetDishes
                        .filter((p) => (p.category || '').toLowerCase() !== 'món chính')
                        .map((p) => {
                          const count = sideDishesMap.get(p.name.trim().toLowerCase()) || 0;
                          return (
                            <option
                              key={p.id}
                              value={p.id}
                            >
                              {p.name} {count > 0 ? `(Đang có x${count} - chọn để thêm)` : `(${p.category || 'Món phụ'})`}
                            </option>
                          );
                        })}
                    </select>
                  </div>
                )}

                {/* Danh sách món phụ đã chọn dạng chip (hỗ trợ tag x2, x3...) */}
                {mealForm.side.split('\n').map((s) => s.trim()).filter(Boolean).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {mealForm.side.split('\n').map((s) => s.trim()).filter(Boolean).map((dishLine, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 text-xs font-semibold border border-teal-300/60 dark:border-teal-700/60 shadow-2xs"
                      >
                        <span>{dishLine}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDish('side', dishLine)}
                          className="p-0.5 hover:bg-teal-200 dark:hover:bg-teal-800 rounded text-teal-700 dark:text-teal-300 cursor-pointer"
                          title={`Bớt 1 phần hoặc xóa món "${dishLine}"`}
                        >
                          <X className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Ô nhập 1 dòng kèm Autocomplete Gợi Ý Món Phụ */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Nhập món phụ / canh rồi nhấn Enter..."
                      value={sideInputText}
                      onChange={(e) => {
                        setSideInputText(e.target.value);
                        setShowSideSuggestions(true);
                      }}
                      onFocus={() => setShowSideSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSideSuggestions(false), 200)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (sideInputText.trim()) {
                            handleAddDish('side', sideInputText.trim());
                          }
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (sideInputText.trim()) {
                          handleAddDish('side', sideInputText.trim());
                        }
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                      title="Thêm món phụ"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span className="hidden sm:inline">Thêm</span>
                    </button>
                  </div>

                  {/* Dropdown Gợi ý Autocomplete Món Phụ */}
                  {showSideSuggestions && sideSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
                      <div className="p-1.5 text-[11px] font-semibold text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700 px-2.5 flex items-center justify-between">
                        <span>Gợi ý từ Món mẫu</span>
                        <span className="text-[10px]">Nhấn để chọn</span>
                      </div>
                      {sideSuggestions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAddDish('side', p.name);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-teal-50 dark:hover:bg-teal-950/50 flex items-center justify-between text-xs text-gray-800 dark:text-gray-200 transition-colors border-b last:border-b-0 border-gray-50 dark:border-gray-700/40 cursor-pointer"
                        >
                          <span className="font-semibold text-teal-800 dark:text-teal-300">{p.name}</span>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            {p.calories && <span className="text-amber-600 dark:text-amber-400 font-medium">🔥 {p.calories}</span>}
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-[10px]">{p.category || 'Món phụ'}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ingredients Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Nguyên liệu chuẩn bị
                  </label>
                </div>
                <textarea
                  rows={3}
                  placeholder="Thịt heo 300g&#10;Hành hoa&#10;Gia vị nấu..."
                  value={mealForm.ingredientsStr}
                  onChange={(e) => setMealForm({ ...mealForm, ingredientsStr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 custom-scrollbar"
                />
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                  <span>💡 Khi chọn hoặc xóa món mẫu, định lượng nguyên liệu sẽ tự động được đồng bộ và cộng trừ tương ứng.</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsMealModalOpen(false);
                    setEditingMealTarget(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  Lưu thực đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CHỈNH SỬA MÓN ĐI CHỢ (SHOPPING ITEM EDIT MODAL)                   */}
      {/* ========================================================================= */}
      {isShoppingModalOpen && editingShoppingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in" style={{ overscrollBehavior: 'contain' }} onWheel={e => e.stopPropagation()} >
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Chỉnh Sửa Nguyên Liệu Đi Chợ
              </h3>
              <button
                onClick={() => {
                  setIsShoppingModalOpen(false);
                  setEditingShoppingItem(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShoppingItem} className="p-5 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Tên nguyên liệu
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thịt ba chỉ, Rau muống..."
                  value={shoppingEditForm.name}
                  onChange={(e) => setShoppingEditForm({ ...shoppingEditForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Số lượng
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 500g, 2 bó..."
                  value={shoppingEditForm.quantity}
                  onChange={(e) => setShoppingEditForm({ ...shoppingEditForm, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsShoppingModalOpen(false);
                    setEditingShoppingItem(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-98 transition-all cursor-pointer"
                >
                  Cập nhật món
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: THÊM / CHỈNH SỬA MÓN ĂN MẪU (PRESET DISH MODAL)                  */}
      {/* ========================================================================= */}
      {isPresetModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
          style={{ overscrollBehavior: 'contain' }}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-gray-900 dark:text-white text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {editingPresetDish ? 'Chỉnh Sửa Món Ăn Mẫu' : 'Thêm Món Ăn Mẫu Mới'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsPresetModalOpen(false);
                  setEditingPresetDish(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePresetDish} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* Tên món ăn */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Tên món ăn <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thịt kho tàu, Canh chua cá lóc..."
                  value={presetForm.name}
                  onChange={(e) => setPresetForm({ ...presetForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-medium"
                />
              </div>

              {/* Danh mục & Calo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Danh mục món
                  </label>
                  <select
                    value={presetForm.category}
                    onChange={(e) => setPresetForm({ ...presetForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Món chính">Món chính</option>
                    <option value="Món canh">Món canh</option>
                    <option value="Món xào">Món xào</option>
                    <option value="Món phụ">Món phụ</option>
                    <option value="Ăn sáng">Ăn sáng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    Calo ước tính
                    <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 normal-case">(tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 450 kcal"
                    value={presetForm.calories}
                    onChange={(e) => setPresetForm({ ...presetForm, calories: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Danh sách nguyên liệu & định lượng */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                  <span>Nguyên liệu & Định lượng chuẩn</span>
                  <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 lowercase">(mỗi dòng 1 nguyên liệu)</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder={'Thịt ba chỉ 400g\nTrứng vịt 4 quả\nNước dừa tươi 300ml\nHành tím 3 củ\nNước mắm 2 muỗng'}
                  value={presetForm.ingredientsStr}
                  onChange={(e) => setPresetForm({ ...presetForm, ingredientsStr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 custom-scrollbar font-mono text-xs leading-relaxed"
                />
                <div className="mt-1.5 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Hệ thống tự động cộng dồn thông minh:</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Khi lên thực đơn, nếu nhiều món cùng dùng một nguyên liệu (ví dụ: cùng dùng trứng, thịt heo, hành lá...), hệ thống sẽ gộp tên và cộng dồn định lượng (vd: 4 quả + 2 quả = 6 quả; 400g + 0.5kg = 900g).
                  </p>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-between gap-2.5">
                {editingPresetDish ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPresetModalOpen(false);
                      handleDeletePresetDish(editingPresetDish.id, editingPresetDish.name);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 transition-colors cursor-pointer"
                    title="Xóa món mẫu này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa món này</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPresetModalOpen(false);
                      setEditingPresetDish(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-98 transition-all cursor-pointer"
                  >
                    {editingPresetDish ? 'Cập nhật món mẫu' : 'Lưu món mẫu'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: XÁC THỰC CHỐT HÓA ĐƠN & GHI SỔ (VERIFICATION POPUP)               */}
      {/* ========================================================================= */}
      {isConfirmFinalizeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in"
          style={{ overscrollBehavior: 'contain' }}
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5 stroke-[2.25]" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Xác Nhận Chốt Hóa Đơn
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Kiểm tra số lượng món & số tiền trước khi ghi sổ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmFinalizeOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Card Tổng quan thông tin */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Số lượng mặt hàng đã mua:</span>
                  <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                    {activeShoppingList.filter((i) => i.checked).length} nguyên liệu
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Tổng tiền thanh toán thực tế:</span>
                  <span className="font-extrabold text-lg text-emerald-800 dark:text-emerald-300">
                    {formatVND(parseNumberInput(actualTotalBill))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/40">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Hạng mục vào Sổ Thu Chi:</span>
                  <span className="font-semibold text-xs text-emerald-700 dark:text-emerald-400 bg-white/70 dark:bg-gray-800/80 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-700/60">
                    Chi Tiêu ➔ Đi chợ
                  </span>
                </div>
              </div>

              {/* Danh sách các nguyên liệu sẽ được chốt & dọn dẹp */}
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                  <span>Chi tiết các món đã mua:</span>
                  <span className="text-[10px] text-gray-400 font-normal">(Sẽ tự động xóa khỏi giỏ hàng)</span>
                </p>
                <div className="max-h-36 overflow-y-auto rounded-xl bg-gray-50 dark:bg-gray-700/50 p-2.5 space-y-1.5 custom-scrollbar border border-gray-100 dark:border-gray-700/60">
                  {activeShoppingList
                    .filter((i) => i.checked)
                    .map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between text-xs text-gray-800 dark:text-gray-200 py-1 px-1.5 rounded-lg bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/40"
                      >
                        <span className="font-medium truncate pr-2 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{item.name}</span>
                        </span>
                        {item.quantity && (
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 shrink-0 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmFinalizeOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmFinalizeShopping}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.25]" />
                <span>Xác nhận chốt sổ</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Compact & Scroll to top on re-tap)         */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800 px-4 py-1.5 flex items-center justify-around shadow-lg transition-colors">
        <button
          onClick={() => handleTabClick('spend')}
          className={`relative flex flex-col items-center py-0.5 gap-0.5 text-[10px] transition-colors cursor-pointer ${activeTab === 'spend'
              ? 'font-bold text-emerald-700 dark:text-emerald-400'
              : 'font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
        >
          <Wallet className={`w-4 h-4 ${activeTab === 'spend' ? 'stroke-[2.25]' : ''}`} />
          <span>Thu Chi</span>
          {activeTab === 'spend' && (
            <span className="w-4 h-[2px] bg-emerald-600 dark:bg-emerald-400 rounded-full mt-0.5 shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
          )}
        </button>
        <button
          onClick={() => handleTabClick('meal')}
          className={`relative flex flex-col items-center py-0.5 gap-0.5 text-[10px] transition-colors cursor-pointer ${activeTab === 'meal'
              ? 'font-bold text-emerald-700 dark:text-emerald-400'
              : 'font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
        >
          <Utensils className={`w-4 h-4 ${activeTab === 'meal' ? 'stroke-[2.25]' : ''}`} />
          <span>Thực Đơn</span>
          {activeTab === 'meal' && (
            <span className="w-4 h-[2px] bg-emerald-600 dark:bg-emerald-400 rounded-full mt-0.5 shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
          )}
        </button>
        <button
          onClick={() => handleTabClick('shop')}
          className={`relative flex flex-col items-center py-0.5 gap-0.5 text-[10px] transition-colors cursor-pointer ${activeTab === 'shop'
              ? 'font-bold text-emerald-700 dark:text-emerald-400'
              : 'font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
        >
          <div className="relative">
            <ShoppingCart className={`w-4 h-4 ${activeTab === 'shop' ? 'stroke-[2.25]' : ''}`} />
            {activeShoppingList.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[8px] px-1 py-0.2 rounded-full font-bold">
                {activeShoppingList.length}
              </span>
            )}
          </div>
          <span>Đi Chợ</span>
          {activeTab === 'shop' && (
            <span className="w-4 h-[2px] bg-emerald-600 dark:bg-emerald-400 rounded-full mt-0.5 shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
          )}
        </button>
        <button
          onClick={() => handleTabClick('settings')}
          className={`relative flex flex-col items-center py-0.5 gap-0.5 text-[10px] transition-colors cursor-pointer ${activeTab === 'settings'
              ? 'font-bold text-emerald-700 dark:text-emerald-400'
              : 'font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
        >
          <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'stroke-[2.25]' : ''}`} />
          <span>Cài Đặt</span>
          {activeTab === 'settings' && (
            <span className="w-4 h-[2px] bg-emerald-600 dark:bg-emerald-400 rounded-full mt-0.5 shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
          )}
        </button>
      </nav>
    </div>
  );
}
