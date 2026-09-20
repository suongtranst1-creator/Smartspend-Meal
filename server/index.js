import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { pool, checkConnection, initializeDatabase } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Hàm helper để thêm log
const addLog = async (action, target_type, description) => {
  try {
    const id = Date.now().toString() + Math.floor(Math.random() * 1000);
    await pool.query(
      `INSERT INTO system_logs (id, action, target_type, description) VALUES ($1, $2, $3, $4)`,
      [id, action, target_type, description]
    );
  } catch (e) {
    console.error('Lỗi ghi log:', e.message);
  }
};

// ==========================================
// 1. Health & Connection Status
// ==========================================
app.get('/api/health', async (req, res) => {
  const dbStatus = await checkConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// ==========================================
// 2. Transactions API (Thu Chi)
// ==========================================

// Lấy danh sách giao dịch
app.get('/api/transactions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        type, 
        title, 
        amount::numeric, 
        category, 
        TO_CHAR(transaction_date, 'YYYY-MM-DD') as date,
        created_at
      FROM transactions
      ORDER BY transaction_date DESC, created_at DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm mới giao dịch
app.post('/api/transactions', async (req, res) => {
  const { id, type, title, amount, category, date } = req.body;
  const transId = id || Date.now().toString();
  const transDate = date || new Date().toISOString().split('T')[0];

  try {
    const result = await pool.query(
      `INSERT INTO transactions (id, type, title, amount, category, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, title, amount::numeric, category, TO_CHAR(transaction_date, 'YYYY-MM-DD') as date;`,
      [transId, type, title, amount, category, transDate]
    );
    await addLog('Thêm', 'Giao dịch', `Đã thêm giao dịch: ${title} (${amount})`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật giao dịch
app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { type, title, amount, category, date } = req.body;

  try {
    const result = await pool.query(
      `UPDATE transactions
       SET type = $1, title = $2, amount = $3, category = $4, transaction_date = $5
       WHERE id = $6
       RETURNING id, type, title, amount::numeric, category, TO_CHAR(transaction_date, 'YYYY-MM-DD') as date;`,
      [type, title, amount, category, date, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }
    await addLog('Sửa', 'Giao dịch', `Đã cập nhật giao dịch: ${title}`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa giao dịch
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING id;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }
    await addLog('Xóa', 'Giao dịch', `Đã xóa giao dịch ID: ${id}`);
    res.json({ message: 'Đã xóa giao dịch thành công', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. Meal Plans API (Thực Đơn Tuần)
// ==========================================

// Lấy toàn bộ thực đơn
app.get('/api/meals', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(plan_date, 'YYYY-MM-DD') as date_str, meal_name, main_dish, side_dish, calories, ingredients
      FROM meal_plans;
    `);

    // Chuẩn hóa format về object { "YYYY-MM-DD": [ { meal_name: '...', main: '...', ... } ], ... }
    const mealsMap = {};

    result.rows.forEach((row) => {
      const { date_str, meal_name, main_dish, side_dish, calories, ingredients } = row;
      if (!mealsMap[date_str]) {
        mealsMap[date_str] = [];
      }
      mealsMap[date_str].push({
        meal_name: meal_name || '',
        main: main_dish || '',
        side: side_dish || '',
        calories: calories || '',
        ingredients: Array.isArray(ingredients) ? ingredients : [],
      });
    });

    res.json(mealsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lưu / Cập nhật thực đơn 1 bữa
app.put('/api/meals', async (req, res) => {
  const { plan_date, meal_name, main, side, calories, ingredients } = req.body;
  if (!plan_date || !meal_name) {
    return res.status(400).json({ error: 'Thiếu thông tin plan_date hoặc meal_name' });
  }

  const id = `${plan_date}_${meal_name}`;
  const ingredientsArray = Array.isArray(ingredients) ? ingredients : [];

  try {
    await pool.query(
      `INSERT INTO meal_plans (id, plan_date, meal_name, main_dish, side_dish, calories, ingredients, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (plan_date, meal_name)
       DO UPDATE SET
         main_dish = EXCLUDED.main_dish,
         side_dish = EXCLUDED.side_dish,
         calories = EXCLUDED.calories,
         ingredients = EXCLUDED.ingredients,
         updated_at = CURRENT_TIMESTAMP;`,
      [id, plan_date, meal_name, main || '', side || '', calories || '', JSON.stringify(ingredientsArray)]
    );

    await addLog('Cập nhật', 'Thực đơn', `Đã cập nhật thực đơn: ${meal_name} ngày ${plan_date}`);
    res.json({ message: 'Lưu thực đơn thành công', plan_date, meal_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa thực đơn 1 bữa
app.delete('/api/meals', async (req, res) => {
  const { plan_date, meal_name } = req.body;
  if (!plan_date || !meal_name) {
    return res.status(400).json({ error: 'Thiếu thông tin plan_date hoặc meal_name' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM meal_plans WHERE plan_date = $1 AND meal_name = $2 RETURNING id;',
      [plan_date, meal_name]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thực đơn' });
    }
    await addLog('Xóa', 'Thực đơn', `Đã xóa thực đơn: ${meal_name} ngày ${plan_date}`);
    res.json({ message: 'Đã xóa thực đơn', plan_date, meal_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. Grocery Items API (Danh Sách Đi Chợ)
// ==========================================

// Lấy danh sách đi chợ
app.get('/api/groceries', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        item_name as name, 
        quantity, 
        category, 
        is_bought as checked,
        created_at
      FROM grocery_items
      ORDER BY is_bought ASC, created_at ASC;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm mới món đi chợ
app.post('/api/groceries', async (req, res) => {
  const { id, name, quantity, category, checked } = req.body;
  const itemId = id || Date.now().toString();

  try {
    const result = await pool.query(
      `INSERT INTO grocery_items (id, item_name, quantity, category, is_bought)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, item_name as name, quantity, category, is_bought as checked;`,
      [itemId, name, quantity || '1 phần', category || 'Rau củ', checked || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm hàng loạt món đi chợ (từ nguyên liệu thực đơn)
app.post('/api/groceries/batch', async (req, res) => {
  const { items } = req.body; // array of { name, quantity, category }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Danh sách nguyên liệu rỗng' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = `${Date.now()}-${i}`;
      const resItem = await client.query(
        `INSERT INTO grocery_items (id, item_name, quantity, category, is_bought)
         VALUES ($1, $2, $3, $4, false)
         RETURNING id, item_name as name, quantity, category, is_bought as checked;`,
        [id, item.name, item.quantity || 'Theo khẩu phần', item.category || 'Rau củ']
      );
      inserted.push(resItem.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json(inserted);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Cập nhật món đi chợ
app.put('/api/groceries/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quantity, category } = req.body;

  try {
    const result = await pool.query(
      `UPDATE grocery_items
       SET item_name = $1, quantity = $2, category = $3
       WHERE id = $4
       RETURNING id, item_name as name, quantity, category, is_bought as checked;`,
      [name, quantity, category, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đổi trạng thái tick chọn món (checked / unchecked)
app.patch('/api/groceries/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE grocery_items
       SET is_bought = NOT is_bought
       WHERE id = $1
       RETURNING id, item_name as name, quantity, category, is_bought as checked;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa 1 món đi chợ
app.delete('/api/groceries/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM grocery_items WHERE id = $1 RETURNING id;', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món' });
    }
    res.json({ message: 'Đã xóa món khỏi giỏ', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa các món đã mua (dọn dẹp giỏ hàng)
app.delete('/api/groceries/action/clear-completed', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM grocery_items WHERE is_bought = true RETURNING id;');
    res.json({ message: `Đã dọn dẹp ${result.rowCount} món đã mua`, count: result.rowCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chốt hóa đơn đi chợ: Ghi 1 khoản chi vào transactions và dọn dẹp các món đã mua trong CSDL
app.post('/api/groceries/finalize', async (req, res) => {
  const { billAmount } = req.body;
  const amount = Number(billAmount);

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Số tiền hóa đơn không hợp lệ' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Đếm và xóa các món đã mua
    const delRes = await client.query('DELETE FROM grocery_items WHERE is_bought = true RETURNING id;');
    const completedCount = delRes.rowCount;

    // 2. Tạo giao dịch chi tiêu mới
    const transId = Date.now().toString();
    const transTitle = `Đi chợ (${completedCount > 0 ? `${completedCount} món` : 'Hóa đơn tổng'})`;
    const transDate = new Date().toISOString().split('T')[0];

    const transRes = await client.query(
      `INSERT INTO transactions (id, type, title, amount, category, transaction_date)
       VALUES ($1, 'expense', $2, $3, 'Đi chợ', $4)
       RETURNING id, type, title, amount::numeric, category, TO_CHAR(transaction_date, 'YYYY-MM-DD') as date;`,
      [transId, transTitle, amount, transDate]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Đã chốt hóa đơn và ghi vào Sổ Thu Chi thành công!',
      transaction: transRes.rows[0],
      deletedCount: completedCount,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ==========================================
// 5. Categories & System Logs API (Settings)
// ==========================================

// Lấy danh sách Logs
app.get('/api/logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 100');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lấy danh mục
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY type ASC, name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm danh mục
app.post('/api/categories', async (req, res) => {
  const { type, name } = req.body;
  const id = Date.now().toString() + Math.floor(Math.random() * 1000);
  try {
    const result = await pool.query(
      'INSERT INTO categories (id, type, name) VALUES ($1, $2, $3) RETURNING *',
      [id, type, name]
    );
    await addLog('Thêm', 'Danh mục', \`Đã thêm danh mục mới: \${name}\`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sửa danh mục
app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy' });
    await addLog('Sửa', 'Danh mục', \`Đã đổi tên danh mục thành: \${name}\`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa danh mục
app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy' });
    await addLog('Xóa', 'Danh mục', \`Đã xóa danh mục: \${result.rows[0].name}\`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. Phục vụ Giao diện tĩnh (Production on Vibe Host)
// ==========================================
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Khởi chạy server và kết nối DB
app.listen(PORT, async () => {
  console.log(`🚀 SmartSpend & Meal Server đang chạy tại http://localhost:${PORT}`);
  await initializeDatabase();
});
