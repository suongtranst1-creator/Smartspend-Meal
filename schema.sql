-- ==========================================================
-- Cơ sở dữ liệu: SmartSpend & Meal
-- Hệ quản trị CSDL: PostgreSQL (v12 trở lên)
-- Mục đích: Quản lý Sổ Thu Chi, Thực Đơn Tuần & Danh Sách Đi Chợ (Hỗ trợ Multi-Tenant qua user_email)
-- ==========================================================

-- Bật extension pgcrypto (nếu cần tự sinh UUID)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================================
-- 1. BẢNG TRANSACTIONS (Sổ Thu Chi Cá Nhân & Gia Đình)
-- ==========================================================
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(255),
    type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_email);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);

COMMENT ON TABLE transactions IS 'Bảng lưu trữ lịch sử giao dịch thu chi sinh hoạt và hóa đơn đi chợ theo từng user';
COMMENT ON COLUMN transactions.user_email IS 'Email định danh tài khoản Google của người dùng';
COMMENT ON COLUMN transactions.type IS 'Loại giao dịch: income (Thu) hoặc expense (Chi)';
COMMENT ON COLUMN transactions.amount IS 'Số tiền giao dịch (VNĐ)';
COMMENT ON COLUMN transactions.category IS 'Danh mục giao dịch: Ăn uống, Đi chợ, Tiền nhà, Hóa đơn, Lương, Thưởng...';


-- ==========================================================
-- 2. BẢNG MEAL_PLANS (Thực Đơn Tuần Theo Ngày & Bữa Ăn)
-- ==========================================================
CREATE TABLE IF NOT EXISTS meal_plans (
    id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(255),
    plan_date DATE NOT NULL,
    meal_name VARCHAR(100) NOT NULL,
    main_dish VARCHAR(255) NOT NULL,
    side_dish VARCHAR(255),
    calories VARCHAR(50),
    ingredients JSONB DEFAULT '[]'::jsonb,
    order_index INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_date_meal UNIQUE (user_email, plan_date, meal_name)
);

CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans (user_email);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans (user_email, plan_date);

COMMENT ON TABLE meal_plans IS 'Bảng lưu trữ kế hoạch thực đơn dinh dưỡng theo ngày và bữa ăn';
COMMENT ON COLUMN meal_plans.user_email IS 'Email định danh tài khoản Google của người dùng';
COMMENT ON COLUMN meal_plans.plan_date IS 'Ngày lên thực đơn (định dạng YYYY-MM-DD)';
COMMENT ON COLUMN meal_plans.meal_name IS 'Tên bữa ăn: Bữa Sáng, Bữa Trưa, Bữa Tối, Bữa Xế...';
COMMENT ON COLUMN meal_plans.ingredients IS 'Mảng nguyên liệu định lượng định dạng JSONB: [{"name": "Thịt heo (300g)", "isBought": false}]';


-- ==========================================================
-- 3. BẢNG GROCERY_ITEMS (Danh Sách Checklist Đi Chợ)
-- ==========================================================
CREATE TABLE IF NOT EXISTS grocery_items (
    id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(255),
    item_name VARCHAR(255) NOT NULL,
    quantity VARCHAR(50) NOT NULL DEFAULT '1 phần',
    category VARCHAR(50) DEFAULT 'Rau củ',
    estimated_price NUMERIC(15, 2) DEFAULT 0,
    is_bought BOOLEAN DEFAULT FALSE,
    plan_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grocery_user ON grocery_items (user_email);
CREATE INDEX IF NOT EXISTS idx_grocery_is_bought ON grocery_items (is_bought);
CREATE INDEX IF NOT EXISTS idx_grocery_plan_date ON grocery_items (plan_date);

COMMENT ON TABLE grocery_items IS 'Danh sách nguyên liệu và thực phẩm cần đi chợ';
COMMENT ON COLUMN grocery_items.user_email IS 'Email định danh tài khoản Google của người dùng';
COMMENT ON COLUMN grocery_items.is_bought IS 'Trạng thái hoàn thành: true (đã mua), false (chưa mua)';
COMMENT ON COLUMN grocery_items.plan_date IS 'Ngày thực đơn liên kết (để tự động bỏ qua khi quá hạn)';


-- ==========================================================
-- 4. BẢNG CATEGORIES (Danh Mục Tùy Chỉnh)
-- ==========================================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(255),
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'grocery')),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_email);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type);

-- Nạp danh mục mặc định của hệ thống
INSERT INTO categories (id, user_email, type, name) 
VALUES 
    ('cat_inc_1', NULL, 'income', 'Lương'),
    ('cat_inc_2', NULL, 'income', 'Thưởng'),
    ('cat_inc_3', NULL, 'income', 'Khác'),
    ('cat_exp_1', NULL, 'expense', 'Ăn uống'),
    ('cat_exp_2', NULL, 'expense', 'Đi chợ'),
    ('cat_exp_3', NULL, 'expense', 'Tiền nhà'),
    ('cat_exp_4', NULL, 'expense', 'Hóa đơn'),
    ('cat_exp_5', NULL, 'expense', 'Mua sắm'),
    ('cat_groc_1', NULL, 'grocery', 'Rau củ'),
    ('cat_groc_2', NULL, 'grocery', 'Thịt cá'),
    ('cat_groc_3', NULL, 'grocery', 'Gia vị'),
    ('cat_groc_4', NULL, 'grocery', 'Trứng sữa'),
    ('cat_groc_5', NULL, 'grocery', 'Đồ khô')
ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- 5. BẢNG PRESET_DISHES (Kho Món Ăn Mẫu & Công Thức)
-- ==========================================================
CREATE TABLE IF NOT EXISTS preset_dishes (
    id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'Món chính',
    calories VARCHAR(50),
    ingredients JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_preset_dishes_user ON preset_dishes (user_email);
CREATE INDEX IF NOT EXISTS idx_preset_dishes_name ON preset_dishes (name);

-- Nạp 10 món ăn mẫu mặc định quen thuộc của gia đình Việt
INSERT INTO preset_dishes (id, user_email, name, category, calories, ingredients)
VALUES
    ('dish_def_1', NULL, 'Thịt kho tàu', 'Món chính', '450 kcal', '[{"name":"Thịt ba chỉ","quantity":"400g"},{"name":"Trứng vịt","quantity":"4 quả"},{"name":"Nước dừa tươi","quantity":"300ml"},{"name":"Hành tím","quantity":"2 củ"}]'::jsonb),
    ('dish_def_2', NULL, 'Canh chua cá lóc', 'Món canh', '220 kcal', '[{"name":"Cá lóc","quantity":"300g"},{"name":"Cà chua","quantity":"2 quả"},{"name":"Thơm/Dứa","quantity":"1/4 quả"},{"name":"Bạc hà","quantity":"2 nhánh"},{"name":"Đậu bắp","quantity":"5 quả"},{"name":"Giá đỗ","quantity":"100g"}]'::jsonb),
    ('dish_def_3', NULL, 'Trứng chiên hành', 'Món phụ', '180 kcal', '[{"name":"Trứng gà","quantity":"3 quả"},{"name":"Hành lá","quantity":"2 nhánh"},{"name":"Dầu ăn","quantity":"1 muỗng"}]'::jsonb),
    ('dish_def_4', NULL, 'Rau muống xào tỏi', 'Món xào', '120 kcal', '[{"name":"Rau muống","quantity":"1 bó"},{"name":"Tỏi","quantity":"1 củ"},{"name":"Dầu ăn","quantity":"2 muỗng"}]'::jsonb),
    ('dish_def_5', NULL, 'Sườn xào chua ngọt', 'Món chính', '380 kcal', '[{"name":"Sườn heo","quantity":"500g"},{"name":"Cà chua","quantity":"2 quả"},{"name":"Hành tây","quantity":"1 củ"},{"name":"Tỏi","quantity":"3 tép"}]'::jsonb),
    ('dish_def_6', NULL, 'Canh rau ngót thịt băm', 'Món canh', '150 kcal', '[{"name":"Rau ngót","quantity":"1 bó"},{"name":"Thịt heo băm","quantity":"150g"},{"name":"Hành tím","quantity":"1 củ"}]'::jsonb),
    ('dish_def_7', NULL, 'Gà kho gừng', 'Món chính', '350 kcal', '[{"name":"Thịt gà","quantity":"500g"},{"name":"Gừng tươi","quantity":"1 củ"},{"name":"Hành tím","quantity":"2 củ"},{"name":"Ớt","quantity":"1 quả"}]'::jsonb),
    ('dish_def_8', NULL, 'Bò xào bông cải', 'Món xào', '280 kcal', '[{"name":"Thịt bò","quantity":"250g"},{"name":"Bông cải xanh","quantity":"1 búp"},{"name":"Tỏi","quantity":"3 tép"},{"name":"Dầu hào","quantity":"1 muỗng"}]'::jsonb),
    ('dish_def_9', NULL, 'Cá basa kho tộ', 'Món chính', '320 kcal', '[{"name":"Cá basa","quantity":"400g"},{"name":"Hành tím","quantity":"2 củ"},{"name":"Tiêu đen","quantity":"1 muỗng"},{"name":"Ớt hiểm","quantity":"2 quả"}]'::jsonb),
    ('dish_def_10', NULL, 'Canh bí đỏ thịt băm', 'Món canh', '160 kcal', '[{"name":"Bí đỏ","quantity":"300g"},{"name":"Thịt heo băm","quantity":"100g"},{"name":"Hành lá","quantity":"2 nhánh"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;


-- ==========================================================
-- 6. BẢNG SYSTEM_LOGS (Nhật Ký Thao Tác Hệ Thống)
-- ==========================================================
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs (user_email);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);
