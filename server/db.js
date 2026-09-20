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
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_date_meal UNIQUE (plan_date, meal_name)
    );
    CREATE INDEX IF NOT EXISTS idx_meal_plans_date ON meal_plans (plan_date);

    -- 3. Bảng grocery_items
    CREATE TABLE IF NOT EXISTS grocery_items (
        id VARCHAR(50) PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        quantity VARCHAR(50) NOT NULL DEFAULT '1 phần',
        category VARCHAR(50) DEFAULT 'Rau củ',
        estimated_price NUMERIC(15, 2) DEFAULT 0,
        is_bought BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_grocery_is_bought ON grocery_items (is_bought);

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
        action VARCHAR(20) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs (created_at DESC);
  `;

  try {
    await pool.query(initSql);
    console.log('✅ Đã xác minh & khởi tạo cấu trúc các bảng PostgreSQL hoàn tất!');
  } catch (err) {
    console.error('❌ Lỗi khi khởi tạo bảng trong PostgreSQL:', err.message);
  }

  return check;
}
