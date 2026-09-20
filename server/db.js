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
    -- 4. Bảng categories
    CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'grocery')),
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_type_name UNIQUE (type, name)
    );
    CREATE INDEX IF NOT EXISTS idx_categories_type ON categories (type);

    -- 5. Bảng system_logs
    CREATE TABLE IF NOT EXISTS system_logs (
        id VARCHAR(50) PRIMARY KEY,
        action VARCHAR(50) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_system_logs_date ON system_logs (created_at DESC);
  `;

  try {
    await pool.query(initSql);
    
    // Seed default categories if empty
    const checkCat = await pool.query('SELECT count(*) FROM categories');
    if (parseInt(checkCat.rows[0].count) === 0) {
      const defaultCategories = [
        ['income', 'Lương'], ['income', 'Thưởng'], ['income', 'Khác'],
        ['expense', 'Ăn uống'], ['expense', 'Đi chợ'], ['expense', 'Tiền nhà'], ['expense', 'Hóa đơn'], ['expense', 'Mua sắm'],
        ['grocery', 'Rau củ'], ['grocery', 'Thịt cá'], ['grocery', 'Gia vị'], ['grocery', 'Trứng sữa'], ['grocery', 'Đồ khô']
      ];
      for (const [type, name] of defaultCategories) {
        const id = Date.now().toString() + Math.floor(Math.random()*1000);
        await pool.query('INSERT INTO categories (id, type, name) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [id, type, name]);
      }
    }
    
    console.log('✅ Đã xác minh & khởi tạo cấu trúc các bảng PostgreSQL hoàn tất!');
  } catch (err) {
    console.error('❌ Lỗi khi khởi tạo bảng trong PostgreSQL:', err.message);
  }

  return check;
}
