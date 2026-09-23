import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình kết nối PostgreSQL từ biến môi trường (Environment Variables)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const poolConfig = connectionString
  ? {
      connectionString,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
      user: process.env.DB_USER || process.env.PGUSER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
      database: process.env.DB_NAME || process.env.PGDATABASE || 'postgres',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

export const pool = new Pool({
  ...poolConfig,
  connectionTimeoutMillis: 6000, // Timeout 6s nếu host không phản hồi
});

// Hàm kiểm tra kết nối CSDL
export async function checkConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version(), current_database() as db_name;');
    client.release();
    return {
      connected: true,
      database: result.rows[0].db_name,
      version: result.rows[0].version,
    };
  } catch (err) {
    return {
      connected: false,
      error: err.message,
      code: err.code,
    };
  }
}

// Hàm tự động khởi tạo bảng nếu chưa có (Auto-migration)
export async function initializeDatabase() {
  const check = await checkConnection();
  if (!check.connected) {
    console.warn('⚠️  Chưa thể kết nối CSDL PostgreSQL:', check.error);
    console.warn('👉 Lưu ý: Nếu chạy trên máy cá nhân, hãy đảm bảo Host (ngoài) được mở hoặc deploy app lên cùng hệ thống máy chủ.');
    return check;
  }

  console.log(`✅ Kết nối PostgreSQL thành công tới CSDL: "${check.database}"`);

  const initSql = `
    -- 1. Bảng transactions
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
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_email);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (transaction_date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);

    -- 2. Bảng meal_plans
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
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
    ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
    ALTER TABLE meal_plans DROP CONSTRAINT IF EXISTS uq_date_meal;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_date_meal') THEN
        ALTER TABLE meal_plans ADD CONSTRAINT uq_user_date_meal UNIQUE (user_email, plan_date, meal_name);
      END IF;
    END $$;
    CREATE INDEX IF NOT EXISTS idx_meal_plans_user ON meal_plans (user_email);
    CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans (user_email, plan_date);

    -- 3. Bảng grocery_items
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
    ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
    ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS plan_date DATE;
    CREATE INDEX IF NOT EXISTS idx_grocery_user ON grocery_items (user_email);
    CREATE INDEX IF NOT EXISTS idx_grocery_is_bought ON grocery_items (is_bought);
    CREATE INDEX IF NOT EXISTS idx_grocery_plan_date ON grocery_items (plan_date);

    -- 4. Bảng categories
    CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        user_email VARCHAR(255),
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'grocery')),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
    ALTER TABLE categories DROP CONSTRAINT IF EXISTS uq_type_name;
    CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_email);
    CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type);

    -- Insert default categories if not exists
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
    ON CONFLICT DO NOTHING;

    -- 5. Bảng system_logs
    CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255),
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
    ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
    ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS entity_name VARCHAR(255);
    CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs (user_email);
    CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);

    -- Đồng bộ sequence id của system_logs
    SELECT setval(pg_get_serial_sequence('system_logs', 'id'), COALESCE((SELECT MAX(id) FROM system_logs), 0) + 1, false);

    -- 6. Bảng preset_dishes (Món ăn mẫu & Công thức nguyên liệu)
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
    ALTER TABLE preset_dishes ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
    ALTER TABLE preset_dishes ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Món chính';
    ALTER TABLE preset_dishes ADD COLUMN IF NOT EXISTS calories VARCHAR(50);
    ALTER TABLE preset_dishes ADD COLUMN IF NOT EXISTS ingredients JSONB DEFAULT '[]'::jsonb;
    CREATE INDEX IF NOT EXISTS idx_preset_dishes_user ON preset_dishes (user_email);
    CREATE INDEX IF NOT EXISTS idx_preset_dishes_name ON preset_dishes (name);

    -- Nạp các món ăn mẫu mặc định của Việt Nam nếu chưa có
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
  `;

  try {
    await pool.query(initSql);

    // Gán dữ liệu cũ chưa có user_email về tài khoản mặc định (ADMIN_EMAIL hoặc cấu hình)
    const defaultAdminEmail = process.env.ADMIN_EMAIL || process.env.DEFAULT_USER_EMAIL || 'suongtranst1@gmail.com';
    if (defaultAdminEmail) {
      await pool.query('UPDATE transactions SET user_email = $1 WHERE user_email IS NULL;', [defaultAdminEmail]);
      await pool.query('UPDATE meal_plans SET user_email = $1 WHERE user_email IS NULL;', [defaultAdminEmail]);
      await pool.query('UPDATE grocery_items SET user_email = $1 WHERE user_email IS NULL;', [defaultAdminEmail]);
      await pool.query('UPDATE system_logs SET user_email = $1 WHERE user_email IS NULL;', [defaultAdminEmail]);
    }

    // Tự động bỏ qua / xóa các món đi chợ chưa mua của các ngày đã qua
    try {
      const cleanupSql = `
        DELETE FROM grocery_items 
        WHERE (plan_date IS NOT NULL AND plan_date < CURRENT_DATE AND is_bought = false)
           OR (plan_date IS NULL AND is_bought = false AND EXISTS (
                SELECT 1 FROM meal_plans mp, jsonb_array_elements(mp.ingredients) ing
                WHERE mp.plan_date < CURRENT_DATE 
                  AND LOWER(TRIM(ing->>'name')) = LOWER(TRIM(grocery_items.item_name))
                  AND (ing->>'isBought')::boolean = false
              ));
      `;
      const cleanupResult = await pool.query(cleanupSql);
      if (cleanupResult.rowCount > 0) {
        console.log(`🧹 Đã tự động dọn dẹp ${cleanupResult.rowCount} món chưa mua của ngày đã qua khỏi danh sách đi chợ.`);
      }
    } catch (cleanupErr) {
      console.warn('Cảnh báo dọn dẹp món đi chợ quá hạn:', cleanupErr.message);
    }

    console.log('✅ Đã xác minh & khởi tạo cấu trúc các bảng PostgreSQL hoàn tất!');
  } catch (err) {
    console.error('❌ Lỗi khi khởi tạo bảng trong PostgreSQL:', err.message);
  }

  return check;
}
