-- ==========================================================
-- Cơ sở dữ liệu: SmartSpend & Meal
-- Hệ quản trị CSDL: PostgreSQL (v12 trở lên)
-- Mục đích: Quản lý Sổ Thu Chi, Thực Đơn Tuần & Danh Sách Đi Chợ
-- ==========================================================

-- Bật extension pgcrypto (nếu cần tự sinh UUID)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 1. BẢNG TRANSACTIONS (Sổ Thu Chi Cá Nhân & Gia Đình)
-- ==========================================================
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Đánh chỉ mục (Indexes) tăng tốc độ lọc và tìm kiếm thu chi
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category);

COMMENT ON TABLE transactions IS 'Bảng lưu trữ lịch sử giao dịch thu chi sinh hoạt và hóa đơn đi chợ';
COMMENT ON COLUMN transactions.type IS 'Loại giao dịch: income (Thu) hoặc expense (Chi)';
COMMENT ON COLUMN transactions.amount IS 'Số tiền giao dịch (VNĐ)';
COMMENT ON COLUMN transactions.category IS 'Danh mục giao dịch: Ăn uống, Đi chợ, Tiền nhà, Hóa đơn, Lương, Thưởng...';


-- ==========================================================
-- 2. BẢNG MEAL_PLANS (Thực Đơn Tuần 7 Ngày - Sáng / Trưa / Tối)
-- ==========================================================
CREATE TABLE IF NOT EXISTS meal_plans (
    id VARCHAR(50) PRIMARY KEY,
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('t2', 't3', 't4', 't5', 't6', 't7', 'cn')),
    meal_type VARCHAR(10) NOT NULL CHECK (meal_type IN ('sang', 'trua', 'toi')),
    main_dish VARCHAR(255) NOT NULL,
    side_dish VARCHAR(255),
    calories VARCHAR(50),
    ingredients TEXT[] DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_day_meal UNIQUE (day_of_week, meal_type)
);

-- Đánh chỉ mục tăng tốc lọc theo ngày trong tuần
CREATE INDEX IF NOT EXISTS idx_meal_plans_day ON meal_plans (day_of_week);

COMMENT ON TABLE meal_plans IS 'Bảng lưu trữ kế hoạch thực đơn dinh dưỡng 7 ngày trong tuần';
COMMENT ON COLUMN meal_plans.day_of_week IS 'Thứ trong tuần: t2, t3, t4, t5, t6, t7, cn';
COMMENT ON COLUMN meal_plans.meal_type IS 'Bữa ăn: sang (Bữa Sáng), trua (Bữa Trưa), toi (Bữa Tối)';
COMMENT ON COLUMN meal_plans.ingredients IS 'Mảng nguyên liệu chuẩn bị (vd: {Thịt bò 300g, Cải ngọt 1 bó})';


-- ==========================================================
-- 3. BẢNG GROCERY_ITEMS (Danh Sách Checklist Đi Chợ)
-- ==========================================================
CREATE TABLE IF NOT EXISTS grocery_items (
    id VARCHAR(50) PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    quantity VARCHAR(50) NOT NULL DEFAULT '1 phần',
    category VARCHAR(50) DEFAULT 'Rau củ',
    estimated_price NUMERIC(15, 2) DEFAULT 0,
    is_bought BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Đánh chỉ mục tăng tốc lọc các món chưa mua / đã mua
CREATE INDEX IF NOT EXISTS idx_grocery_is_bought ON grocery_items (is_bought);
CREATE INDEX IF NOT EXISTS idx_grocery_category ON grocery_items (category);

COMMENT ON TABLE grocery_items IS 'Danh sách nguyên liệu và thực phẩm cần đi chợ';
COMMENT ON COLUMN grocery_items.category IS 'Nhóm thực phẩm: Rau củ, Thịt cá, Trứng sữa, Gia vị, Đồ khô';
COMMENT ON COLUMN grocery_items.is_bought IS 'Trạng thái hoàn thành: true (đã mua), false (chưa mua)';
