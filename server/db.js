import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình kết nối PostgreSQL từ biến môi trường (Environment Variables)
// Lưu ý: Nếu VibeHost tự động tiêm DATABASE_URL trỏ vào container nội bộ (vays-db-) mà người dùng đã cung cấp DB_HOST thật, ta ưu tiên DB_HOST thật.
const isVaysInternalUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('vays-db-');
const hasExternalHost = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && !process.env.DB_HOST.includes('vays-db-');

const connectionString = (isVaysInternalUrl && hasExternalHost)
  ? null
  : (process.env.DATABASE_URL || process.env.POSTGRES_URL);

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
  const targetHost = poolConfig.connectionString
    ? (poolConfig.connectionString.includes('@') ? poolConfig.connectionString.split('@')[1] : 'DATABASE_URL')
    : `${poolConfig.host}:${poolConfig.port}`;
  console.log(`🔌 Đang kết nối CSDL tại: ${targetHost}...`);

  const check = await checkConnection();
  if (!check.connected) {
    console.warn('⚠️  Chưa thể kết nối CSDL PostgreSQL:', check.error);
    console.warn('👉 Lưu ý: Hãy đảm bảo đã cấu hình đúng biến môi trường (DATABASE_URL hoặc DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT) ở tab "Biến môi trường" trên VibeHost.');
    return check;
  }

  console.log(`✅ Kết nối PostgreSQL thành công tới CSDL: "${check.database}"`);

  const initSql = `
    -- 1. Bảng transactions
    CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        title VARCHAR(255) NOT NULL,
        amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        category VARCHAR(100) NOT NULL,
        transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (transaction_date DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions (type);

    -- 2. Bảng meal_plans
    CREATE TABLE IF NOT EXISTS meal_plans (
        id VARCHAR(50) PRIMARY KEY,
        plan_date DATE NOT NULL,
        meal_name VARCHAR(100) NOT NULL,
        main_dish VARCHAR(255) NOT NULL,
        side_dish VARCHAR(255),
        calories VARCHAR(50),
        ingredients JSONB DEFAULT '[]'::jsonb,
        order_index INT DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_date_meal UNIQUE (plan_date, meal_name)
    );
    CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans (plan_date);
    ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS order_index INT DEFAULT 0;
    CREATE INDEX IF NOT EXISTS idx_meal_plans_order ON meal_plans (plan_date, order_index);

    -- 3. Bảng grocery_items
    CREATE TABLE IF NOT EXISTS grocery_items (
        id VARCHAR(50) PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        quantity VARCHAR(50) NOT NULL DEFAULT '1 phần',
        category VARCHAR(50) DEFAULT 'Rau củ',
        estimated_price NUMERIC(15, 2) DEFAULT 0,
        is_bought BOOLEAN DEFAULT FALSE,
        plan_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_grocery_is_bought ON grocery_items (is_bought);
    ALTER TABLE grocery_items ADD COLUMN IF NOT EXISTS plan_date DATE;
    CREATE INDEX IF NOT EXISTS idx_grocery_plan_date ON grocery_items (plan_date);

    -- 4. Bảng categories
    CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'grocery')),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_type_name UNIQUE (type, name)
    );
    CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type);

    -- Insert default categories if not exists
    INSERT INTO categories (id, type, name) 
    VALUES 
        ('cat_inc_1', 'income', 'Lương'),
        ('cat_inc_2', 'income', 'Thưởng'),
        ('cat_inc_3', 'income', 'Khác'),
        ('cat_exp_1', 'expense', 'Ăn uống'),
        ('cat_exp_2', 'expense', 'Đi chợ'),
        ('cat_exp_3', 'expense', 'Tiền nhà'),
        ('cat_exp_4', 'expense', 'Hóa đơn'),
        ('cat_exp_5', 'expense', 'Mua sắm'),
        ('cat_groc_1', 'grocery', 'Rau củ'),
        ('cat_groc_2', 'grocery', 'Thịt cá'),
        ('cat_groc_3', 'grocery', 'Gia vị'),
        ('cat_groc_4', 'grocery', 'Trứng sữa'),
        ('cat_groc_5', 'grocery', 'Đồ khô')
    ON CONFLICT (type, name) DO NOTHING;

    -- 5. Bảng system_logs
    CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);
    ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
    ALTER TABLE system_logs ADD COLUMN IF NOT EXISTS entity_name VARCHAR(255);
  `;

  try {
    await pool.query(initSql);

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
