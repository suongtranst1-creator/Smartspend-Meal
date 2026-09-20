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
  ChevronRight,
  AlertCircle,
  X,
  Pencil,
  Database,
  Settings,
  Download,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';

// Currency Formatter
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
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

export default function App() {
  const [activeTab, setActiveTab] = useState('spend'); // 'spend' | 'meal' | 'shop'
  
  // State: Thu Chi
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
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

  // Database Connection Status
  const [dbStatus, setDbStatus] = useState({ checked: false, connected: false, database: null, error: null });

  // Settings State
  const [themeMode, setThemeMode] = useState(localStorage.getItem('theme') || 'system');
  const [categories, setCategories] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');

  // Change Theme function
  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    if (mode === 'system') {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      localStorage.setItem('theme', mode);
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Export CSV function
  const exportTransactionsToCSV = () => {
    if (transactions.length === 0) {
      alert('Không có giao dịch nào để xuất!');
      return;
    }
    const headers = ['ID,Loại,Tiêu đề,Số tiền,Danh mục,Ngày tạo'];
    const rows = transactions.map(t => 
      \`\${t.id},\${t.type === 'income' ? 'Thu' : 'Chi'},\${t.title},\${t.amount},\${t.category},\${t.date}\`
    );
    const csvContent = "\\uFEFF" + headers.concat(rows).join('\\n'); // BOM for UTF-8
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'lich_su_giao_dich.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


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
            try {
              const mealsRes = await fetch('/api/meals');
              if (mealsRes.ok) {
                const mealsJson = await mealsRes.json();
                if (mealsJson) setMealData(mealsJson);
              }
            } catch (e) {
              console.error(e);
            }

            // Load groceries from PostgreSQL
            try {
              const grocRes = await fetch('/api/groceries');
              if (grocRes.ok) {
                const grocData = await grocRes.json();
                if (Array.isArray(grocData)) setShoppingList(grocData);
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

            // Load Logs
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
    let result = transactions;
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }
    if (dateRange.start) {
      result = result.filter((t) => t.date >= dateRange.start);
    }
    if (dateRange.end) {
      result = result.filter((t) => t.date <= dateRange.end);
    }
    return result;
  }, [transactions, filterType, dateRange]);

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
      amount: trans.amount.toString(),
      category: trans.category,
      date: trans.date,
    });
    setIsModalOpen(true);
  };

  // Save Transaction (Add or Update)
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    if (!newTrans.title.trim() || !newTrans.amount) return;

    if (editingTransaction) {
      // Update existing
      const updatedItem = {
        ...editingTransaction,
        type: newTrans.type,
        title: newTrans.title.trim(),
        amount: Number(newTrans.amount),
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
        amount: Number(newTrans.amount),
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

  const handleToggleIngredientBought = async (plan_date, meal_name, ingredientName) => {
    let dayMeals = mealData[plan_date] ? [...mealData[plan_date]] : [];
    let updatedMeal = null;

    dayMeals = dayMeals.map((m) => {
      if (m.meal_name === meal_name) {
        updatedMeal = {
          ...m,
          ingredients: m.ingredients.map((i) =>
            i.name === ingredientName ? { ...i, isBought: !i.isBought } : i
          ),
        };
        return updatedMeal;
      }
      return m;
    });

    setMealData({
      ...mealData,
      [plan_date]: dayMeals,
    });

    if (updatedMeal) {
      try {
        await fetch('/api/meals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_date, ...updatedMeal }),
        });
      } catch (err) {
        console.warn('API sync:', err);
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
      let dayMealsUpdated = false;
      const updatedDayMeals = newMealData[plan_date].map(meal => {
        let mealUpdated = false;
        const newIngredients = meal.ingredients?.map(ing => {
          if (ing.name === itemToToggle.name && !!ing.isBought !== newCheckedStatus) {
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
      category: newCategory,
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

  // Open Edit Shopping Item Modal
  const handleOpenEditShoppingItem = (item) => {
    setEditingShoppingItem(item);
    setShoppingEditForm({
      name: item.name,
      quantity: item.quantity,
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
      category: shoppingEditForm.category,
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
  const handleAddMealIngredientsToCart = async (mealTitle, ingredients) => {
    if (!ingredients || ingredients.length === 0) return;
    
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
        showToast(`Tất cả nguyên liệu của [${mealTitle}] đã được mua!`);
      } else {
        showToast("Tất cả món ăn đã có trong giỏ đi chợ");
      }
      return;
    }

    const newItems = pendingIngredients.map((ing, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: ing.name,
      quantity: 'Theo khẩu phần',
      category: 'Rau củ',
      checked: false,
    }));
    
    setShoppingList((prev) => [...prev, ...newItems]);
    showToast(`Đã thêm ${newItems.length} món mới vào giỏ đi chợ!`);

    try {
      await fetch('/api/groceries/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  // Finalize Grocery Shopping -> Sync into Tab 1 (Thu Chi)
  const handleFinalizeShopping = async () => {
    const billAmount = Number(actualTotalBill) || 0;
    if (billAmount <= 0) {
      alert('Vui lòng nhập số tiền hóa đơn hợp lệ!');
      return;
    }

    const completedItems = shoppingList.filter((i) => i.checked);
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
    setShoppingList(shoppingList.filter((i) => !i.checked));
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
    setShoppingList(shoppingList.filter((i) => !i.checked));
    showToast('Đã dọn dẹp các món đã mua');
    try {
      await fetch('/api/groceries/action/clear-completed', { method: 'DELETE' });
    } catch (err) {
      console.warn('API sync:', err);
    }
  };

  const currentMeal = mealData[selectedDay] || mealData[todayKey] || {
    sang: { main: '', side: '', calories: '', ingredients: [] },
    trua: { main: '', side: '', calories: '', ingredients: [] },
    toi: { main: '', side: '', calories: '', ingredients: [] },
  };
  const checkedShoppingCount = shoppingList.filter((i) => i.checked).length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 pb-20 md:pb-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none text-gray-900 tracking-tight flex items-center gap-1.5">
                SmartSpend <span className="text-emerald-600">&</span> Meal
              </h1>
              <p className="text-xs text-gray-500 mt-0.5 font-normal">
                Sổ Thu Chi & Thực Đơn Đi Chợ Tuần
              </p>
            </div>
          </div>

          {/* Database Connection Indicator & Navigation */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                dbStatus.connected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={
                dbStatus.connected
                  ? `Đã kết nối CSDL: ${dbStatus.database}`
                  : `Chạy 'npm run server' để kết nối backend PostgreSQL`
              }
            >
              <Database className="w-3.5 h-3.5 text-current shrink-0" />
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="hidden sm:inline">
                {dbStatus.connected ? 'PostgreSQL: Đã kết nối' : 'PostgreSQL: Sẵn sàng'}
              </span>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setActiveTab('spend')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'spend'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Sổ Thu Chi</span>
            </button>
            <button
              onClick={() => setActiveTab('meal')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'meal'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Thực Đơn Tuần</span>
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'shop'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Đi Chợ</span>
              {shoppingList.length > 0 && (
                <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {shoppingList.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cài Đặt</span>
            </button>
          </nav>
        </div>
      </div>
    </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        {/* ========================================================================= */}
        {/* TAB 1: THU CHI (EXPENSE TRACKER)                                          */}
        {/* ========================================================================= */}
        {activeTab === 'spend' && (
          <div className="space-y-6">
            {/* 3 Summary Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Card 1: Tổng Thu */}
              <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tổng Thu
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {formatVND(totalIncome)}
                </div>
                <p className="text-[10px] sm:text-xs text-emerald-600 font-medium mt-1 truncate">
                  Đã cộng dồn thu nhập
                </p>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50/50 rounded-full pointer-events-none" />
              </div>

              {/* Card 2: Tổng Chi Tiêu */}
              <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Tổng Chi
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">
                  {formatVND(totalExpense)}
                </div>
                <p className="text-[10px] sm:text-xs text-rose-500 font-medium mt-1 truncate">
                  Sinh hoạt & đi chợ
                </p>
                <div className="absolute -right-4 -bottom-4 w-16 h-16 sm:w-20 sm:h-20 bg-rose-50/40 rounded-full pointer-events-none" />
              </div>

              {/* Card 3: Số Dư Hiện Tại */}
              <div className="col-span-2 sm:col-span-1 bg-emerald-800 text-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-semibold text-emerald-200 uppercase tracking-wider">
                    Số Dư Hiện Tại
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 text-white flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 text-xl sm:text-2xl font-bold tracking-tight">
                  {formatVND(balance)}
                </div>
                <p className="text-[10px] sm:text-xs text-emerald-200 mt-1 truncate">
                  {balance >= 0 ? 'Tài chính ổn định' : 'Cần tối ưu ngân sách'}
                </p>
                <div className="absolute -right-6 -bottom-6 w-20 h-20 sm:w-24 sm:h-24 bg-white/5 rounded-full pointer-events-none" />
              </div>
            </div>

            {/* Actions Bar & Filter */}
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterType === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Tất cả ({filteredTransactions.length})
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterType === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Khoản Chi
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filterType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  Khoản Thu
                </button>
                <div className="flex items-center gap-1.5 sm:ml-2">
                  <input
                    type="date"
                    className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 outline-none focus:border-emerald-500"
                    value={dateRange.start}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                    title="Từ ngày"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="date"
                    className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 outline-none focus:border-emerald-500"
                    value={dateRange.end}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                    title="Đến ngày"
                  />
                </div>
              </div>

              <button
                onClick={handleOpenAddTransaction}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow active:scale-98 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm giao dịch mới</span>
              </button>
            </div>

            {/* Transaction History List with Edit and Delete */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  Lịch sử giao dịch gần đây
                </h3>
                <span className="text-xs text-gray-400">Thời gian thực</span>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 text-sm">
                    Chưa có giao dịch nào trong danh mục này.
                  </div>
                ) : (
                  filteredTransactions.slice(0, displayLimit).map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:px-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            item.type === 'income'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-500'
                          }`}
                        >
                          {item.type === 'income' ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                              {item.category}
                            </span>
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(item.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-bold text-sm sm:text-base ${
                            item.type === 'income'
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {item.type === 'income' ? '+' : '-'} {formatVND(item.amount)}
                        </span>
                        
                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditTransaction(item)}
                            className="text-gray-400 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                            title="Chỉnh sửa giao dịch"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(item.id)}
                            className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Xóa giao dịch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {filteredTransactions.length > displayLimit && (
                <div className="p-3 border-t border-gray-100 flex justify-center bg-gray-50/30">
                  <button 
                    onClick={() => setDisplayLimit((prev) => prev + 10)}
                    className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl transition-colors active:scale-95"
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
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-3 px-1 gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  Kế hoạch tuần từ Thứ Hai đến Chủ Nhật
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWeekOffset(prev => prev - 1)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    &lt; Tuần trước
                  </button>
                  <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors">
                    Tuần này
                  </button>
                  <button onClick={() => setWeekOffset(prev => prev + 1)} className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
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
                          : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700'
                      }`}
                    >
                      {hasMeals && !isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white shadow-xs"></span>
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
                          isSelected ? 'text-emerald-100' : 'text-gray-400'
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
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-10 text-center flex flex-col items-center justify-center text-gray-400 text-sm">
                      <Utensils className="w-8 h-8 text-gray-200 mb-2" />
                      Chưa có thực đơn nào cho ngày này.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {currentMeals.map((meal, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div className="p-5">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <Utensils className="w-4 h-4" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">{meal.meal_name}</h4>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {meal.calories && (
                                  <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                                    {meal.calories}
                                  </span>
                                )}
                                {!isPast && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEditMeal(selectedDay, meal)}
                                      className="text-gray-400 hover:text-emerald-600 p-1 rounded-lg hover:bg-emerald-50 transition-colors"
                                      title="Chỉnh sửa thực đơn"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteMeal(selectedDay, meal.meal_name)}
                                      className="text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                                      title="Xóa thực đơn"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="mt-4">
                              <h5 className={`font-bold text-base ${meal.main ? 'text-gray-900' : 'text-gray-400 italic font-normal'}`}>
                                {meal.main || 'Chưa lên thực đơn'}
                              </h5>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {meal.side ? `Kèm: ${meal.side}` : 'Chưa có món phụ'}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-50">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                                Nguyên liệu chuẩn bị:
                              </span>
                              <ul className="mt-2 space-y-2">
                                {meal.ingredients && meal.ingredients.length > 0 ? (
                                  meal.ingredients.map((ing, iIdx) => (
                                    <li key={iIdx} className="text-xs text-gray-600 flex items-start gap-2.5">
                                      <button 
                                        onClick={() => !isPast && handleToggleIngredientBought(selectedDay, meal.meal_name, ing.name)}
                                        disabled={isPast}
                                        className={`mt-0.5 w-4 h-4 shrink-0 rounded flex items-center justify-center border transition-colors ${
                                          ing.isBought ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white hover:border-emerald-400'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title={isPast ? "Đã qua ngày" : (ing.isBought ? "Đánh dấu chưa mua" : "Đánh dấu đã mua")}
                                      >
                                        {ing.isBought && <Check className="w-3 h-3" />}
                                      </button>
                                      <span className={ing.isBought ? 'line-through text-gray-400' : ''}>
                                        {ing.name}
                                      </span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-xs text-gray-400 italic flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                                    Chưa có nguyên liệu
                                  </li>
                                )}
                              </ul>
                            </div>
                          </div>

                          <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                            <button
                              disabled={!meal.ingredients || meal.ingredients.length === 0 || isPast || meal.ingredients.every(i => i.isBought)}
                              onClick={() => handleAddMealIngredientsToCart(`${meal.meal_name} - ${meal.main || 'Món ăn'}`, meal.ingredients || [])}
                              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
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
                        className="flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-98"
                      >
                        <Plus className="w-4 h-4" /> Thêm bữa ăn
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Smart Meal Insight Tip */}
            <div className="bg-emerald-50/70 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs sm:text-sm">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
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
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  Thêm nhanh nguyên liệu cần mua
                </h3>

                <form onSubmit={handleAddShoppingItem} className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    placeholder="Tên nguyên liệu (VD: Thịt bò, Cải ngọt...)"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Số lượng (VD: 500g, 2 bó)"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    className="w-full sm:w-36 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="Rau củ">Rau củ</option>
                    <option value="Thịt cá">Thịt cá</option>
                    <option value="Gia vị">Gia vị</option>
                    <option value="Trứng sữa">Trứng sữa</option>
                    <option value="Đồ khô">Đồ khô</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm</span>
                  </button>
                </form>
              </div>

              {/* Shopping Checklist with Edit and Delete */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      Danh sách thực phẩm
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                      {checkedShoppingCount} / {shoppingList.length} đã mua
                    </span>
                  </div>

                  {checkedShoppingCount > 0 && (
                    <button
                      onClick={handleClearCompletedGroceries}
                      className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                    >
                      Xóa món đã mua
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-100">
                  {shoppingList.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">
                      Giỏ đi chợ đang trống. Hãy thêm nguyên liệu từ Thực đơn hoặc nhập ở trên!
                    </div>
                  ) : (
                    shoppingList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleCheck(item.id)}
                        className={`p-3.5 sm:px-5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                          item.checked ? 'bg-gray-50/50' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                              item.checked
                                ? 'text-emerald-600'
                                : 'text-gray-300 hover:text-gray-400'
                            }`}
                          >
                            {item.checked ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <Circle className="w-5 h-5" />
                            )}
                          </button>

                          <span
                            className={`text-sm font-medium transition-all ${
                              item.checked
                                ? 'line-through text-gray-400'
                                : 'text-gray-800'
                            }`}
                          >
                            {item.name}
                          </span>

                          <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            {item.quantity}
                          </span>

                          <span className="hidden sm:inline-block text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                        </div>

                        {/* Actions: Edit and Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditShoppingItem(item);
                            }}
                            className="text-gray-300 hover:text-emerald-600 p-1 rounded-lg transition-colors"
                            title="Chỉnh sửa món này"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteShoppingItem(item.id);
                            }}
                            className="text-gray-300 hover:text-rose-500 p-1 rounded-lg transition-colors"
                            title="Xóa món"
                          >
                            <Trash2 className="w-4 h-4" />
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
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
                  <Receipt className="w-5 h-5" />
                  <h4>Chốt Sổ Hóa Đơn</h4>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  Sau khi hoàn thành chuyến đi chợ, nhập tổng số tiền trên hóa đơn để tự động đồng bộ vào mục <strong>Chi Tiêu</strong>.
                </p>

                {/* Total Bill Input */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                    Tổng tiền hóa đơn thực tế (VNĐ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={actualTotalBill}
                      onChange={(e) => setActualTotalBill(e.target.value)}
                      placeholder="VD: 350000"
                      className="w-full pl-3.5 pr-14 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-bold text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      VNĐ
                    </span>
                  </div>
                </div>

                {/* Summary Info */}
                <div className="p-3 bg-gray-50 rounded-xl space-y-1.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Đã hoàn thành:</span>
                    <strong className="text-emerald-700">{checkedShoppingCount} món</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Danh mục ghi sổ:</span>
                    <strong className="text-gray-800">Chi Tiêu ➔ Đi chợ</strong>
                  </div>
                </div>

                {/* Big Action Button */}
                <button
                  onClick={handleFinalizeShopping}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Chốt đi chợ & Ghi vào Sổ Thu Chi</span>
                </button>
              </div>

              <div className="bg-white/60 p-4 rounded-2xl border border-gray-100 flex items-start gap-2.5 text-xs text-gray-500">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
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
          <div className="space-y-6 pb-24">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Settings className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Cài Đặt Hệ Thống
            </h2>

            {/* Giao diện */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Giao diện
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-2 transition-colors ${
                    themeMode === 'light' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Sun className="w-4 h-4" /> Sáng
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-2 transition-colors ${
                    themeMode === 'dark' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Moon className="w-4 h-4" /> Tối
                </button>
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border flex items-center gap-2 transition-colors ${
                    themeMode === 'system' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Monitor className="w-4 h-4" /> Tự động (Hệ thống)
                </button>
              </div>
            </div>

            {/* Xuất Dữ Liệu */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Dữ liệu
              </h3>
              <button
                onClick={exportTransactionsToCSV}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" /> Xuất Lịch sử Giao dịch (CSV)
              </button>
            </div>

            {/* Quản lý Danh mục */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Quản lý Danh mục
              </h3>
              
              <div className="flex gap-2 mb-4">
                <select 
                  value={newCatType}
                  onChange={e => setNewCatType(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="expense">Chi tiêu</option>
                  <option value="income">Thu nhập</option>
                  <option value="grocery">Đi chợ</option>
                </select>
                <input 
                  type="text"
                  placeholder="Tên danh mục mới..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <button 
                  onClick={async () => {
                    if (!newCatName.trim()) return;
                    try {
                      const res = await fetch('/api/categories', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: newCatType, name: newCatName.trim() })
                      });
                      if (res.ok) {
                        const newCat = await res.json();
                        setCategories([...categories, newCat]);
                        setNewCatName('');
                        showToast('Thêm danh mục thành công');
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition-all"
                >
                  Thêm
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['expense', 'income', 'grocery'].map((typeLabel) => (
                  <div key={typeLabel} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center justify-between">
                      {typeLabel === 'expense' ? 'Danh mục Chi' : typeLabel === 'income' ? 'Danh mục Thu' : 'Danh mục Đi chợ'}
                      <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-[10px]">
                        {categories.filter(c => c.type === typeLabel).length}
                      </span>
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {categories.filter(c => c.type === typeLabel).map(cat => (
                        <div key={cat.id} className="flex items-center justify-between bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-600 shadow-xs">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mr-2">{cat.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button 
                              onClick={async () => {
                                const newName = prompt('Nhập tên danh mục mới:', cat.name);
                                if (!newName || newName.trim() === cat.name) return;
                                try {
                                  const res = await fetch(`/api/categories/${cat.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name: newName.trim() })
                                  });
                                  if (res.ok) {
                                    const updated = await res.json();
                                    setCategories(categories.map(c => c.id === cat.id ? updated : c));
                                    showToast('Sửa danh mục thành công');
                                  }
                                } catch (e) { console.error(e); }
                              }}
                              className="text-gray-400 hover:text-emerald-600 p-1 rounded transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={async () => {
                                if (!confirm(`Bạn có chắc muốn xóa danh mục "${cat.name}"?`)) return;
                                try {
                                  const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    setCategories(categories.filter(c => c.id !== cat.id));
                                    showToast('Xóa danh mục thành công');
                                  }
                                } catch (e) { console.error(e); }
                              }}
                              className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quản lý Log hệ thống */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xs">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-500 dark:text-gray-400" /> Nhật ký hoạt động (System Logs)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                      <th className="p-3 font-semibold">Thời gian</th>
                      <th className="p-3 font-semibold">Thao tác</th>
                      <th className="p-3 font-semibold">Loại</th>
                      <th className="p-3 font-semibold">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                    {systemLogs.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-4 text-center text-gray-500 dark:text-gray-400">Chưa có nhật ký nào.</td>
                      </tr>
                    ) : (
                      systemLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors text-gray-700 dark:text-gray-300">
                          <td className="p-3 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-3">
                            <span className="bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-md text-xs font-semibold">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 font-medium">{log.target_type}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400 max-w-[200px] sm:max-w-none truncate">{log.description}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: THÊM / CHỈNH SỬA GIAO DỊCH THU CHI                               */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                {editingTransaction ? (
                  <>
                    <Pencil className="w-4 h-4 text-emerald-600" />
                    Chỉnh Sửa Giao Dịch
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-emerald-600" />
                    Thêm Giao Dịch Mới
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingTransaction(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setNewTrans({ ...newTrans, type: 'expense' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    newTrans.type === 'expense'
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Khoản Chi
                </button>
                <button
                  type="button"
                  onClick={() => setNewTrans({ ...newTrans, type: 'income' })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    newTrans.type === 'income'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Khoản Thu
                </button>
              </div>

              {/* Title Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Nội dung giao dịch
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cà phê, Tiền điện, Lương..."
                  value={newTrans.title}
                  onChange={(e) => setNewTrans({ ...newTrans, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Số tiền (VNĐ)
                </label>
                <input
                  type="number"
                  required
                  placeholder="VD: 50000"
                  value={newTrans.amount}
                  onChange={(e) => setNewTrans({ ...newTrans, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Danh mục
                  </label>
                  <select
                    value={newTrans.category}
                    onChange={(e) => setNewTrans({ ...newTrans, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="Ăn uống">Ăn uống</option>
                    <option value="Đi chợ">Đi chợ</option>
                    <option value="Hóa đơn">Hóa đơn</option>
                    <option value="Mua sắm">Mua sắm</option>
                    <option value="Lương">Lương</option>
                    <option value="Thưởng">Thưởng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Ngày ghi
                  </label>
                  <input
                    type="date"
                    value={newTrans.date}
                    onChange={(e) => setNewTrans({ ...newTrans, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
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
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-98 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-emerald-600" />
                  {editingMealTarget.original_meal_name ? 'Chỉnh Sửa Thực Đơn' : 'Thêm Bữa Ăn Mới'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsMealModalOpen(false);
                  setEditingMealTarget(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="p-5 space-y-4">
              {/* Tên bữa ăn */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Tên bữa ăn
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Bữa Sáng, Bữa Xế..."
                  value={mealForm.mealName}
                  onChange={(e) => setMealForm({ ...mealForm, mealName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Main Dish */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Món chính
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cơm sườn nướng, Phở bò..."
                  value={mealForm.main}
                  onChange={(e) => setMealForm({ ...mealForm, main: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Side Dish & Calories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Món phụ / Canh kèm
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Canh rau ngót..."
                    value={mealForm.side}
                    onChange={(e) => setMealForm({ ...mealForm, side: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Calo ước tính
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 550 kcal"
                    value={mealForm.calories}
                    onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Ingredients Textarea */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Nguyên liệu chuẩn bị (mỗi dòng 1 nguyên liệu)
                </label>
                <textarea
                  rows={4}
                  placeholder="Thịt heo 300g&#10;Hành hoa&#10;Gia vị nấu"
                  value={mealForm.ingredientsStr}
                  onChange={(e) => setMealForm({ ...mealForm, ingredientsStr: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
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
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-98 transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600" />
                Chỉnh Sửa Nguyên Liệu Đi Chợ
              </h3>
              <button
                onClick={() => {
                  setIsShoppingModalOpen(false);
                  setEditingShoppingItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShoppingItem} className="p-5 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Tên nguyên liệu
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thịt ba chỉ, Rau muống..."
                  value={shoppingEditForm.name}
                  onChange={(e) => setShoppingEditForm({ ...shoppingEditForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              {/* Quantity and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Số lượng
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 500g, 2 bó..."
                    value={shoppingEditForm.quantity}
                    onChange={(e) => setShoppingEditForm({ ...shoppingEditForm, quantity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Phân loại
                  </label>
                  <select
                    value={shoppingEditForm.category}
                    onChange={(e) => setShoppingEditForm({ ...shoppingEditForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="Rau củ">Rau củ</option>
                    <option value="Thịt cá">Thịt cá</option>
                    <option value="Gia vị">Gia vị</option>
                    <option value="Trứng sữa">Trứng sữa</option>
                    <option value="Đồ khô">Đồ khô</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsShoppingModalOpen(false);
                    setEditingShoppingItem(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm active:scale-98 transition-all"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 px-6 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('spend')}
          className={`flex flex-col items-center py-1 gap-1 text-xs font-semibold transition-colors ${
            activeTab === 'spend' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span>Thu Chi</span>
        </button>
        <button
          onClick={() => setActiveTab('meal')}
          className={`flex flex-col items-center py-1 gap-1 text-xs font-semibold transition-colors ${
            activeTab === 'meal' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span>Thực Đơn</span>
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={`flex flex-col items-center py-1 gap-1 text-xs font-semibold transition-colors relative ${
            activeTab === 'shop' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            {shoppingList.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[9px] px-1 py-0.2 rounded-full font-bold">
                {shoppingList.length}
              </span>
            )}
          </div>
          <span>Đi Chợ</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={\`flex flex-col items-center py-1 gap-1 text-xs font-semibold transition-colors \${
            activeTab === 'settings' ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
          }\`}
        >
          <Settings className="w-5 h-5" />
          <span>Cài Đặt</span>
        </button>
      </nav>
    </div>
  );
}
