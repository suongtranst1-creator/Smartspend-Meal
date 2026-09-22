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
  RotateCcw
} from 'lucide-react';

// Currency Formatter
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
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

// Hàm lọc bỏ các món không cần mua (đã có sẵn trong thực đơn hoặc quá hạn chưa mua)
const filterExpiredUnboughtGroceries = (items = [], meals = {}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return items.filter((item) => {
    // 1. Nếu nguyên liệu đã được đánh dấu "Có rồi" bên Thực Đơn Tuần (isBought: true) -> Bỏ luôn khỏi giỏ hàng
    if (meals && typeof meals === 'object') {
      const targetDates = item.plan_date ? [item.plan_date] : Object.keys(meals);
      for (const dStr of targetDates) {
        const dayMeals = meals[dStr];
        if (Array.isArray(dayMeals)) {
          for (const m of dayMeals) {
            const matchingIng = m.ingredients?.find(
              (i) => i.name?.trim().toLowerCase() === item.name?.trim().toLowerCase()
            );
            if (matchingIng?.isBought) {
              return false; // Bỏ hoàn toàn khỏi giỏ hàng, không hiển thị gạch ngang
            }
          }
        }
      }
    }

    // 2. Nếu món đã mua tại giỏ đi chợ (checked), giữ lại để người dùng đối chiếu / chốt hóa đơn
    if (item.checked) return true;

    // 3. Kiểm tra plan_date gắn kèm: nếu ngày thực đơn đã qua mà chưa mua -> tự động bỏ qua
    if (item.plan_date) {
      const pDate = new Date(item.plan_date);
      pDate.setHours(0, 0, 0, 0);
      if (pDate < today) return false;
    }

    // 4. Kiểm tra chéo với mealData đối với dữ liệu cũ chưa có plan_date
    if (meals && typeof meals === 'object') {
      for (const [dateStr, dayMeals] of Object.entries(meals)) {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        if (d < today && Array.isArray(dayMeals)) {
          for (const m of dayMeals) {
            const hasMatchingUnboughtIng = m.ingredients?.some(
              (ing) =>
                ing.name?.trim().toLowerCase() === item.name?.trim().toLowerCase() &&
                !ing.isBought
            );
            if (hasMatchingUnboughtIng) {
              return false;
            }
          }
        }
      }
    }

    return true;
  });
};

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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shadow-xs ${
          hasRange
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
                    className={`relative z-10 w-7 h-7 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isStart || isEnd
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
  
  // Database Connection Status
  const [dbStatus, setDbStatus] = useState({ checked: false, connected: false, database: null, error: null });

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

  // Initial load from PostgreSQL Backend API
  useEffect(() => {
    async function loadData() {
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
                  setShoppingList(filterExpiredUnboughtGroceries(grocData, loadedMeals));
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
          }
        }
      } catch (err) {
        setDbStatus({ checked: true, connected: false, error: 'Server API chưa chạy' });
      }
    }
    loadData();
  }, []);

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
    showToast('Đã đặt lại bộ lọc và sắp xếp lịch sử về mặc định');
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
        await fetch(`/api/transactions/${editingTransaction.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedItem),
        });
      } catch (err) {
        console.warn('API sync:', err);
      }
    } else {
      // Create new
      const item = {
        id: Date.now().toString(),
        type: newTrans.type,
        title: newTrans.title.trim(),
        amount: parsedAmount,
        category: newTrans.category,
        date: newTrans.date,
      };
      setTransactions([item, ...transactions]);
      showToast(`Đã thêm giao dịch: "${item.title}"`);

      try {
        await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
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

    setIsMealModalOpen(true);
  };

  const handleSaveMeal = async (e) => {
    e.preventDefault();
    if (!editingMealTarget || !mealForm.main.trim() || !mealForm.mealName.trim()) return;

    const { plan_date, original_meal_name } = editingMealTarget;
    
    // Parse ingredients and preserve isBought state if it exists
    const ingredientsArray = mealForm.ingredientsStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => {
        let isBought = false;
        if (original_meal_name) {
          const oldMeal = mealData[plan_date]?.find((m) => m.meal_name === original_meal_name);
          const oldIngr = oldMeal?.ingredients?.find((i) => i.name === name);
          if (oldIngr) isBought = oldIngr.isBought;
        }
        return { name, isBought };
      });

    const mealPayload = {
      meal_name: mealForm.mealName.trim(),
      main: mealForm.main.trim(),
      side: mealForm.side.trim(),
      calories: mealForm.calories.trim(),
      ingredients: ingredientsArray,
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

    // Lấy danh sách tên món đã có trong giỏ (không phân biệt hoa thường)
    const existingInCartNames = shoppingList.map(i => i.name.toLowerCase().trim());
    
    // Lọc ra các món: chưa mua VÀ chưa có trong giỏ
    const pendingIngredients = ingredients.filter(ing => {
      if (ing.isBought) return false;
      if (existingInCartNames.includes(ing.name.toLowerCase().trim())) return false;
      return true;
    });

    if (pendingIngredients.length === 0) {
      const allBought = ingredients.every(i => i.isBought);
      if (allBought) {
        showToast(`Tất cả nguyên liệu của [${mealTag}] đã được mua!`);
      } else {
        showToast("Tất cả món ăn đã có trong giỏ đi chợ");
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

  // Finalize Grocery Shopping -> Sync into Tab 1 (Thu Chi)
  const handleFinalizeShopping = async () => {
    const billAmount = parseNumberInput(actualTotalBill);
    if (billAmount <= 0) {
      alert('Vui lòng nhập số tiền hóa đơn hợp lệ!');
      return;
    }

    const completedItems = activeShoppingList.filter((i) => i.checked);
    const completedCount = completedItems.length;

    const newExpense = {
      id: Date.now().toString(),
      type: 'expense',
      title: `Đi chợ (${completedCount > 0 ? `${completedCount} món` : 'Hóa đơn tổng'})`,
      amount: billAmount,
      category: 'Đi chợ',
      date: new Date().toISOString().split('T')[0],
    };

    setTransactions([newExpense, ...transactions]);
    setShoppingList(activeShoppingList.filter((i) => !i.checked));
    setActualTotalBill('');
    showToast(`Đã chốt hóa đơn ${formatVND(billAmount)} và ghi vào Sổ Thu Chi!`);

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
    setShoppingList(activeShoppingList.filter((i) => !i.checked));
    showToast('Đã dọn dẹp các món đã mua');
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
    const header = ['Thời gian', 'Loại', 'Số tiền', 'Danh mục', 'Tiêu đề'];
    const csvContent = [
      header.join(','),
      ...transactions.map(t => [
        `"${formatDate(t.date)}"`,
        t.type === 'income' ? 'Thu' : 'Chi',
        t.amount,
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
    const header = ['Thời gian', 'Hành động', 'Loại', 'Chi tiết'];
    const csvContent = [
      header.join(','),
      ...systemLogs.map(log => [
        `"${formatLogTime(log.time)}"`,
        `"${(log.action || '').replace(/"/g, '""')}"`,
        `"${(log.entity_type || '').replace(/"/g, '""')}"`,
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


  // Danh sách đi chợ hợp lệ (tự động bỏ qua các món chưa mua của ngày đã qua)
  const activeShoppingList = useMemo(() => {
    return filterExpiredUnboughtGroceries(shoppingList, mealData);
  }, [shoppingList, mealData]);

  const checkedShoppingCount = useMemo(() => {
    return activeShoppingList.filter((i) => i.checked).length;
  }, [activeShoppingList]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 pb-20 md:pb-10 transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 dark:bg-emerald-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
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
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    dbStatus.connected ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    dbStatus.connected
                      ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                      : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                  }`}
                />
              </span>

              {/* Floating Tooltip on Hover */}
              <div className="absolute top-full right-0 mt-2 z-50 pointer-events-none opacity-0 translate-y-1 scale-95 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-150 ease-out whitespace-nowrap">
                <div className="bg-gray-900/95 dark:bg-gray-800 text-white text-[11px] font-medium py-1.5 px-3 rounded-lg shadow-xl border border-gray-700/50 flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      dbStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
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
                onClick={() => setActiveTab('spend')}
                className={`relative flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm whitespace-nowrap transition-all ${
                  activeTab === 'spend'
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
                onClick={() => setActiveTab('meal')}
                className={`relative flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm whitespace-nowrap transition-all ${
                  activeTab === 'meal'
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
                onClick={() => setActiveTab('shop')}
                className={`relative flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm whitespace-nowrap transition-all ${
                  activeTab === 'shop'
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
                onClick={() => setActiveTab('settings')}
                className={`relative flex items-center gap-1.5 px-3 py-2 lg:px-4 lg:py-2 rounded-lg text-xs lg:text-sm whitespace-nowrap transition-all ${
                  activeTab === 'settings'
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
                  {formatVND(totalIncome)}
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
                  {formatVND(totalExpense)}
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
                  <span className="text-[10px] sm:text-xs font-semibold text-teal-100 uppercase tracking-wider">
                    Số Dư Hiện Tại
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 backdrop-blur-xs text-teal-100 flex items-center justify-center border border-white/20 shadow-xs">
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
                  {formatVND(balance)}
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
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterType === 'all'
                      ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Tất cả ({filteredTransactions.length})
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterType === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Khoản Chi
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterType === 'income'
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
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            item.type === 'income'
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
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 overflow-hidden">
                            <span className="text-[10px] sm:text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 sm:px-2 py-0.5 rounded-md font-medium whitespace-nowrap shrink-0">
                              {item.category}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 whitespace-nowrap shrink-0">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                              {formatDate(item.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Formatted Amount (Never Wrap) + Edit/Delete Buttons */}
                      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 text-right ml-1">
                        <span
                          className={`font-bold text-xs sm:text-base whitespace-nowrap tabular-nums shrink-0 ${
                            item.type === 'income'
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
                      className={`relative flex flex-col items-center py-2.5 sm:py-3 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20 scale-102'
                          : 'bg-gray-50 dark:bg-gray-700/60 hover:bg-emerald-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 hover:text-emerald-700 dark:hover:text-emerald-300'
                      }`}
                    >
                      {hasMeals && !isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-xs"></span>
                      )}
                      {day.isToday && (
                        <span
                          className={`absolute -top-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            isSelected
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          Nay
                        </span>
                      )}
                      <span className="text-xs sm:text-sm">{day.label}</span>
                      <span
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? 'text-emerald-100' : 'text-gray-400 dark:text-gray-400'
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
                <div className="space-y-4">
                  {currentMeals.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs p-10 text-center flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
                      <Utensils className="w-8 h-8 text-gray-200 dark:text-gray-600 mb-2" />
                      Chưa có thực đơn nào cho ngày này.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {currentMeals.map((meal, idx) => (
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
                          className={`bg-white dark:bg-gray-800 rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition-all duration-200 ${
                            !isPast && currentMeals.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                          } ${
                            draggedMealIdx === idx
                              ? 'opacity-40 scale-95 border-dashed border-emerald-500 shadow-none'
                              : dragOverMealIdx === idx
                              ? 'border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg scale-[1.02]'
                              : 'border-gray-100 dark:border-gray-700 hover:shadow-md'
                          }`}
                        >
                          <div className="p-5">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                  <Utensils className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">{meal.meal_name}</h4>
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
                                      className="text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 p-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                      title="Chỉnh sửa thực đơn"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMeal(selectedDay, meal.meal_name)}
                                      className="text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                      title="Xóa thực đơn"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 space-y-1.5">
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
                                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                                  {meal.side.split('\n').map((sDish, sIdx) => {
                                    const cleanSide = sDish.trim();
                                    if (!cleanSide) return null;
                                    return (
                                      <p key={sIdx} className="leading-relaxed">
                                        {sIdx === 0 && (
                                          <span className="font-medium text-emerald-600 dark:text-emerald-400 mr-1.5">
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

                            <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Nguyên liệu chuẩn bị:
                              </span>
                              <ul className="mt-2 space-y-2">
                                {meal.ingredients && meal.ingredients.length > 0 ? (
                                  meal.ingredients.map((ing, iIdx) => (
                                    <li key={iIdx} className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-2.5">
                                      <button 
                                        onClick={() => !isPast && handleToggleIngredientBought(selectedDay, meal.meal_name, ing.name)}
                                        disabled={isPast}
                                        className={`mt-0.5 w-4 h-4 shrink-0 rounded flex items-center justify-center border transition-colors ${
                                          ing.isBought ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-emerald-400'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title={isPast ? "Đã qua ngày" : (ing.isBought ? "Đánh dấu chưa mua" : "Đánh dấu đã mua")}
                                      >
                                        {ing.isBought && <Check className="w-3 h-3" />}
                                      </button>
                                      <span className={ing.isBought ? 'line-through text-gray-400 dark:text-gray-500' : ''}>
                                        {ing.name}
                                      </span>
                                      {isPast && !ing.isBought && (
                                        <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded ml-auto font-medium">
                                          Đã bỏ qua
                                        </span>
                                      )}
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
                                    Chưa có nguyên liệu
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>

                          <div className="p-4 bg-gray-50/50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-700">
                            <button
                              disabled={!meal.ingredients || meal.ingredients.length === 0 || isPast || meal.ingredients.every(i => i.isBought)}
                              onClick={() => handleAddMealIngredientsToCart(selectedDay, meal.meal_name, meal.ingredients || [])}
                              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-white dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-gray-600 border border-emerald-200 dark:border-emerald-700 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{isPast ? 'Đã qua hạn đi chợ' : (meal.ingredients?.every(i => i.isBought) ? 'Đã mua đủ' : 'Thêm món chưa mua vào giỏ')}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!isPast && (
                    <div className="flex justify-center mt-6">
                      <button 
                        onClick={() => handleOpenEditMeal(selectedDay)}
                        className="flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-98"
                      >
                        <Plus className="w-4 h-4" /> Thêm bữa ăn
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Smart Meal Insight Tip */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
              <Sparkles className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p>
                <strong>Mẹo:</strong> Bạn có thể đánh dấu nguyên liệu <strong>Đã mua</strong> bằng ô check vuông ngay trên thực đơn. Khi bấm "Thêm vào giỏ", hệ thống sẽ chỉ nhặt những món <strong>Chưa mua</strong> để bạn không bị trùng lặp.
              </p>
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

                  {checkedShoppingCount > 0 && (
                    <button
                      onClick={handleClearCompletedGroceries}
                      className="text-xs text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium cursor-pointer"
                    >
                      Xóa món đã mua
                    </button>
                  )}
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
                        className={`p-3 sm:p-3.5 sm:px-5 flex items-center justify-between gap-2 cursor-pointer select-none transition-colors ${
                          item.checked ? 'bg-gray-50/50 dark:bg-gray-800/40' : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                              item.checked
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
                            className={`text-xs sm:text-sm font-medium transition-all truncate min-w-0 ${
                              item.checked
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
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-base">
                  <Receipt className="w-5 h-5" />
                  <h4>Chốt Sổ Hóa Đơn</h4>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Sau khi hoàn thành chuyến đi chợ, nhập tổng số tiền trên hóa đơn để tự động đồng bộ vào mục <strong>Chi Tiêu</strong>.
                </p>

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
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Đã hoàn thành:</span>
                    <strong className="text-emerald-700 dark:text-emerald-400">{checkedShoppingCount} món</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Danh mục ghi sổ:</span>
                    <strong className="text-gray-800 dark:text-white">Chi Tiêu ➔ Đi chợ</strong>
                  </div>
                </div>

                {/* Big Action Button */}
                <button
                  onClick={handleFinalizeShopping}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Chốt đi chợ & Ghi vào Sổ Thu Chi</span>
                </button>
              </div>

              <div className="bg-white/60 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-2.5 text-xs text-gray-500 dark:text-gray-400">
                <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Khi bấm chốt, các món đã đánh dấu "đã mua" sẽ tự động được dọn dẹp để bạn chuẩn bị cho lần mua tiếp theo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CÀI ĐẶT (SETTINGS)                                                 */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cột trái: 2 Khối Xuất dữ liệu */}
              <div className="space-y-6">
                {/* Export 1: Lịch sử Giao dịch */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-2 dark:text-gray-100">
                    <Database className="w-5 h-5 text-blue-500" /> Xuất dữ liệu
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Tải về toàn bộ lịch sử giao dịch dưới dạng file CSV để dễ dàng xem và chỉnh sửa trên Excel/Google Sheets.
                  </p>
                  <button onClick={handleExportCSV} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm cursor-pointer">
                    <Download className="w-4 h-4" />
                    <span>Xuất Lịch Sử Giao Dịch (CSV)</span>
                  </button>
                </div>

                {/* Export 2: Nhật ký hệ thống (Logs) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-2 dark:text-gray-100">
                    <Clock className="w-5 h-5 text-emerald-500" /> Nhật ký hệ thống (Logs)
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Tải về toàn bộ nhật ký thao tác hệ thống (thêm, sửa, xóa, sắp xếp) dưới dạng file CSV để theo dõi và lưu trữ.
                  </p>
                  <button
                    onClick={handleExportLogsCSV}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất Nhật Ký Hệ Thống (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Cột phải: Quản lý danh mục */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4 dark:text-gray-100">
                    <Tag className="w-5 h-5 text-purple-500" /> Quản lý danh mục
                  </h2>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target;
                      handleAddCategory(form.type.value, form.name.value);
                      form.reset();
                    }}
                    className="flex gap-2 mb-4"
                  >
                    <select name="type" className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white" required>
                      <option value="expense" className="dark:bg-gray-800">Khoản Chi</option>
                      <option value="income" className="dark:bg-gray-800">Khoản Thu</option>
                    </select>
                    <input name="name" placeholder="Tên danh mục mới" className="flex-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" required />
                    <button type="submit" className="px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer">
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>
                <div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar flex-1">
                  {categories.filter(c => c.type === 'expense' || c.type === 'income').map(c => (
                    <div key={c.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium dark:text-gray-200">{c.name}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">{c.type}</span>
                      </div>
                      <button onClick={() => handleDeleteCategory(c.id, c.name)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg cursor-pointer">
                        <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
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
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    newTrans.type === 'expense'
                      ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                  }`}
                >
                  Khoản Chi
                </button>
                <button
                  type="button"
                  onClick={() => setNewTrans({ ...newTrans, type: 'income' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    newTrans.type === 'income'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Calo ước tính
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

              {/* Main Dish Textarea (Có chỗ xuống dòng thêm nhiều món) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                  <span>Món chính</span>
                  <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 lowercase">(mỗi dòng 1 món)</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="VD: Cơm chiên hải sản&#10;Thịt kho trứng cút..."
                  value={mealForm.main}
                  onChange={(e) => setMealForm({ ...mealForm, main: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 custom-scrollbar"
                />
              </div>

              {/* Side Dish Textarea (Có chỗ xuống dòng thêm nhiều món) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                  <span>Món phụ / Canh ăn kèm</span>
                  <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 lowercase">(mỗi dòng 1 món)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Canh rau ngót thịt băm&#10;Dưa leo, cà chua..."
                  value={mealForm.side}
                  onChange={(e) => setMealForm({ ...mealForm, side: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 custom-scrollbar"
                />
              </div>

              {/* Ingredients Textarea */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between">
                  <span>Nguyên liệu chuẩn bị</span>
                  <span className="text-[11px] font-normal text-gray-400 dark:text-gray-500 lowercase">(mỗi dòng 1 nguyên liệu)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Thịt heo 300g&#10;Hành hoa&#10;Gia vị nấu..."
                  value={mealForm.ingredientsStr}
                  onChange={(e) => setMealForm({ ...mealForm, ingredientsStr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 custom-scrollbar"
                />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
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
      {/* MOBILE BOTTOM NAVIGATION BAR                                              */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800 px-6 py-2 flex items-center justify-around shadow-lg transition-colors">
        <button
          onClick={() => setActiveTab('spend')}
          className={`relative flex flex-col items-center py-1 gap-1 text-xs transition-colors ${
            activeTab === 'spend'
              ? 'font-bold text-emerald-700 dark:text-emerald-400'
              : 'font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Wallet className={`w-5 h-5 ${activeTab === 'spend' ? 'stroke-[2.25]' : ''}`} />
          <span>Thu Chi</span>
          {activeTab === 'spend' && (
            <span className="w-5 h-[2.5px] bg-emerald-600 dark:bg-emerald-400 rounded-full mt-0.5 shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('meal')}
          className={`relative flex flex-col items-center py-1 gap-1 text-xs transition-colors ${
            activeTab === 'meal'
              ? 'font-bold text-emerald-700 dark:text-emerald-400'
              : 'font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Utensils className={`w-5 h-5 ${activeTab === 'meal' ? 'stroke-[2.25]' : ''}`} />
          <span>Thực Đơn</span>
          {activeTab === 'meal' && (
            <span className="w-5 h-[2.5px] bg-emerald-600 dark:bg-emerald-400 rounded-full mt-0.5 shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`relative flex flex-col items-center py-1 gap-1 text-xs transition-colors ${
            activeTab === 'shop'
              ? 'font-bold text-emerald-700 dark:text-emerald-400'
              : 'font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <div className="relative">
            <ShoppingCart className={`w-5 h-5 ${activeTab === 'shop' ? 'stroke-[2.25]' : ''}`} />
            {activeShoppingList.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] px-1 py-0.2 rounded-full font-bold">
                {activeShoppingList.length}
              </span>
            )}
          </div>
          <span>Đi Chợ</span>
          {activeTab === 'shop' && (
            <span className="w-5 h-[2.5px] bg-emerald-600 dark:bg-emerald-400 rounded-full mt-0.5 shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`relative flex flex-col items-center py-1 gap-1 text-xs transition-colors ${
            activeTab === 'settings'
              ? 'font-bold text-emerald-700 dark:text-emerald-400'
              : 'font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
        >
          <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.25]' : ''}`} />
          <span>Cài Đặt</span>
          {activeTab === 'settings' && (
            <span className="w-5 h-[2.5px] bg-emerald-600 dark:bg-emerald-400 rounded-full mt-0.5 shadow-[0_1px_3px_rgba(16,185,129,0.5)]" />
          )}
        </button>
      </nav>
    </div>
  );
}
