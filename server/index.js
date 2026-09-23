import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { pool, checkConnection, initializeDatabase } from './db.js';

import {
  checkEmailAccess,
  verifyGoogleCredential,
  generateSessionToken,
  requireAuth
} from './auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Hàm ghi log hệ thống
const logAction = async (action, entity_type, entity_name, user_email = null) => {
  try {
    await pool.query(
      `INSERT INTO system_logs (action, entity_type, entity_name, user_email) VALUES ($1, $2, $3, $4)`,
      [action, entity_type, entity_name, user_email]
    );
  } catch (err) {
    console.error('Lỗi khi ghi log:', err.message);
  }
};

// ==========================================
// 0. AUTHENTICATION & ACCESS CONTROL API
// ==========================================

// Lấy cấu hình public (Google Client ID) cho frontend
app.get('/api/auth/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    authEnabled: true,
  });
});

// Cập nhật Google Client ID vào .env và bộ nhớ (Chỉ cho phép môi trường dev / local)
app.post('/api/auth/save-client-id', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Không được phép thay đổi cấu hình môi trường trực tiếp trong môi trường production.' });
  }

  const { clientId } = req.body;
  if (!clientId || !clientId.trim()) {
    return res.status(400).json({ error: 'Client ID không được để trống.' });
  }

  const cleanClientId = clientId.trim();
  // Regex kiểm tra định dạng chuẩn của Google OAuth 2.0 Client ID để chống tiêm ký tự lạ (CRLF/Injection)
  const GOOGLE_CLIENT_ID_REGEX = /^[0-9]+-[a-z0-9_]+\.apps\.googleusercontent\.com$/i;
  if (!GOOGLE_CLIENT_ID_REGEX.test(cleanClientId)) {
    return res.status(400).json({
      error: 'Định dạng Client ID không hợp lệ. Phải có định dạng: <chuỗi_số>-<chuỗi_ký_tự>.apps.googleusercontent.com'
    });
  }

  process.env.GOOGLE_CLIENT_ID = cleanClientId;

  try {
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (envContent.includes('GOOGLE_CLIENT_ID=')) {
      envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/g, `GOOGLE_CLIENT_ID=${cleanClientId}`);
    } else {
      envContent += `\nGOOGLE_CLIENT_ID=${cleanClientId}\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    res.json({ success: true, googleClientId: cleanClientId });
  } catch (err) {
    res.status(500).json({ error: 'Không thể lưu file .env: ' + err.message });
  }
});

// Xác thực tài khoản Google (One Tap & Sign in with Google)
app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Thiếu thông tin xác thực Google (credential).' });
  }

  try {
    const userPayload = await verifyGoogleCredential(credential);

    // Cấp phát Session Token (JWT) cho người dùng
    const token = generateSessionToken(userPayload);

    // Ghi log đăng nhập thành công
    await logAction('Đăng nhập', 'Tài khoản', userPayload.email, userPayload.email);

    res.json({
      token,
      user: {
        email: userPayload.email,
        name: userPayload.name,
        picture: userPayload.picture,
      },
    });
  } catch (err) {
    console.error('Lỗi xác thực Google SSO:', err.message);
    res.status(401).json({
      error: 'Xác thực Google không thành công. Vui lòng thử lại.',
      details: err.message,
    });
  }
});

// Endpoint đăng nhập thử nghiệm (Dev / Test Mode) - Chặn hoàn toàn trên Production trừ khi bật rõ cờ
app.post('/api/auth/dev-login', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEV_LOGIN !== 'true') {
    return res.status(403).json({
      error: 'Đăng nhập thử nghiệm (dev-login) bị vô hiệu hóa trên môi trường production vì lý do bảo mật.'
    });
  }

  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Vui lòng cung cấp địa chỉ email.' });
  }

  const userPayload = {
    email: email.trim().toLowerCase(),
    name: name || email.split('@')[0],
    picture: '',
  };

  const token = generateSessionToken(userPayload);
  await logAction('Đăng nhập', 'Tài khoản', userPayload.email, userPayload.email);

  res.json({
    token,
    user: userPayload,
  });
});

// Kiểm tra phiên đăng nhập hiện tại
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: req.user,
    valid: true,
  });
});

// Đăng xuất
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  try {
    await logAction('Đăng xuất', 'Tài khoản', req.user.email, req.user.email);
  } catch {}
  res.json({ message: 'Đăng xuất thành công.' });
});

// Middleware bảo vệ toàn bộ các API bắt đầu bằng /api (ngoại trừ /api/auth/* và /api/health)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth') || req.path === '/health') {
    return next();
  }
  return requireAuth(req, res, next);
});

// ==========================================
// 5. Categories API (Danh Mục)
// ==========================================
app.get('/api/categories', async (req, res) => {
  try {
    const userEmail = req.user.email;
    const result = await pool.query(
      'SELECT * FROM categories WHERE user_email = $1 OR user_email IS NULL ORDER BY type ASC, created_at ASC;',
      [userEmail]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { type, name } = req.body;
  const id = `cat_${Date.now()}`;
  const userEmail = req.user.email;
  try {
    const result = await pool.query(
      `INSERT INTO categories (id, user_email, type, name) VALUES ($1, $2, $3, $4) RETURNING *;`,
      [id, userEmail, type, name]
    );
    await logAction('Thêm', 'Danh mục', name, userEmail);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userEmail = req.user.email;
  try {
    const result = await pool.query(
      `UPDATE categories SET name = $1 WHERE id = $2 AND (user_email = $3 OR user_email IS NULL) RETURNING *;`,
      [name, id, userEmail]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    await logAction('Sửa', 'Danh mục', name, userEmail);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.email;
  try {
    const result = await pool.query(
      `DELETE FROM categories WHERE id = $1 AND (user_email = $2 OR user_email IS NULL) RETURNING *;`,
      [id, userEmail]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy danh mục' });
    await logAction('Xóa', 'Danh mục', result.rows[0].name, userEmail);
    res.json({ message: 'Xóa danh mục thành công', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. System Logs API (Nhật Ký)
// ==========================================
app.get('/api/logs', async (req, res) => {
  try {
    const userEmail = req.user.email;
    const result = await pool.query(`
      SELECT id, action, entity_type, entity_name, TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as time
      FROM system_logs 
      WHERE user_email = $1
      ORDER BY created_at DESC 
      LIMIT 100;
    `, [userEmail]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. Preset Dishes API (Món Ăn Mẫu & Công Thức)
// ==========================================
app.get('/api/preset-dishes', async (req, res) => {
  try {
    const userEmail = req.user.email;
    const result = await pool.query(`
      SELECT id, user_email, name, category, calories, ingredients, created_at, updated_at
      FROM preset_dishes
      WHERE user_email = $1 OR user_email IS NULL
      ORDER BY 
        CASE WHEN user_email IS NOT NULL THEN 0 ELSE 1 END,
        category ASC, name ASC;
    `, [userEmail]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/preset-dishes', async (req, res) => {
  const { name, category, calories, ingredients } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Tên món không được để trống' });
  }
  const id = `dish_${Date.now()}`;
  const userEmail = req.user.email;
  const ingrArray = Array.isArray(ingredients) ? ingredients : [];

  try {
    const result = await pool.query(
      `INSERT INTO preset_dishes (id, user_email, name, category, calories, ingredients)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING *;`,
      [id, userEmail, name.trim(), category || 'Món chính', calories || '', JSON.stringify(ingrArray)]
    );
    await logAction('Thêm', 'Món mẫu', name.trim(), userEmail);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/preset-dishes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, calories, ingredients } = req.body;
  const userEmail = req.user.email;
  const ingrArray = Array.isArray(ingredients) ? ingredients : [];

  try {
    const checkRes = await pool.query('SELECT * FROM preset_dishes WHERE id = $1;', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món ăn mẫu' });
    }

    const dish = checkRes.rows[0];
    if (!dish.user_email) {
      // Nếu là món mặc định, nhân bản thành món riêng của user
      const newId = `dish_${Date.now()}`;
      const newRes = await pool.query(
        `INSERT INTO preset_dishes (id, user_email, name, category, calories, ingredients)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb)
         RETURNING *;`,
        [newId, userEmail, name || dish.name, category || dish.category, calories !== undefined ? calories : dish.calories, JSON.stringify(ingrArray)]
      );
      await logAction('Sửa (Tùy biến)', 'Món mẫu', name || dish.name, userEmail);
      return res.json(newRes.rows[0]);
    }

    if (dish.user_email !== userEmail) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa món này' });
    }

    const updateRes = await pool.query(
      `UPDATE preset_dishes
       SET name = $1, category = $2, calories = $3, ingredients = $4::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_email = $6
       RETURNING *;`,
      [name.trim(), category || 'Món chính', calories || '', JSON.stringify(ingrArray), id, userEmail]
    );
    await logAction('Sửa', 'Món mẫu', name.trim(), userEmail);
    res.json(updateRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/preset-dishes/:id', async (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.email;

  try {
    const result = await pool.query(
      'DELETE FROM preset_dishes WHERE id = $1 AND user_email = $2 RETURNING *;',
      [id, userEmail]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món hoặc đây là món mặc định không thể xóa' });
    }
    await logAction('Xóa', 'Món mẫu', result.rows[0].name, userEmail);
    res.json({ message: 'Xóa món mẫu thành công', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const userEmail = req.user.email;
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
      WHERE user_email = $1
      ORDER BY transaction_date DESC, created_at DESC;
    `, [userEmail]);
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
  const userEmail = req.user.email;

  try {
    const result = await pool.query(
      `INSERT INTO transactions (id, user_email, type, title, amount, category, transaction_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, type, title, amount::numeric, category, TO_CHAR(transaction_date, 'YYYY-MM-DD') as date, created_at;`,
      [transId, userEmail, type, title, amount, category, transDate]
    );
    
    // Ghi log
    await logAction('Thêm', 'Giao dịch', `${title} (${amount})`, userEmail);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cập nhật giao dịch
app.put('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const { type, title, amount, category, date } = req.body;
  const userEmail = req.user.email;

  try {
    const result = await pool.query(
      `UPDATE transactions
       SET type = $1, title = $2, amount = $3, category = $4, transaction_date = $5
       WHERE id = $6 AND user_email = $7
       RETURNING id, type, title, amount::numeric, category, TO_CHAR(transaction_date, 'YYYY-MM-DD') as date, created_at;`,
      [type, title, amount, category, date, id, userEmail]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }
    
    // Ghi log
    await logAction('Sửa', 'Giao dịch', `${title} (${amount})`, userEmail);
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa giao dịch
app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.email;
  try {
    const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_email = $2 RETURNING id;', [id, userEmail]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy giao dịch' });
    }
    
    // Ghi log
    await logAction('Xóa', 'Giao dịch', `ID: ${id}`, userEmail);
    
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
    const userEmail = req.user.email;
    const result = await pool.query(`
      SELECT TO_CHAR(plan_date, 'YYYY-MM-DD') as date_str, meal_name, main_dish, side_dish, calories, ingredients, COALESCE(order_index, 0) as order_index
      FROM meal_plans
      WHERE user_email = $1
      ORDER BY plan_date ASC, COALESCE(order_index, 0) ASC, updated_at ASC;
    `, [userEmail]);

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

// Sắp xếp lại thứ tự các bữa ăn trong ngày (Drag & Drop Reorder)
app.put('/api/meals/reorder', async (req, res) => {
  const { plan_date, meals } = req.body;
  const userEmail = req.user.email;
  if (!plan_date || !Array.isArray(meals)) {
    return res.status(400).json({ error: 'Thiếu thông tin plan_date hoặc danh sách meals' });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < meals.length; i++) {
        const m = meals[i];
        const mealName = typeof m === 'string' ? m : m.meal_name;
        await client.query(
          `UPDATE meal_plans 
           SET order_index = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE plan_date = $2 AND meal_name = $3 AND user_email = $4;`,
          [i, plan_date, mealName, userEmail]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await logAction('Sắp xếp', 'Thực đơn', `${plan_date} (${meals.length} bữa)`, userEmail);
    res.json({ message: 'Đã cập nhật thứ tự thực đơn', plan_date });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lưu / Cập nhật thực đơn 1 bữa
app.put('/api/meals', async (req, res) => {
  const { plan_date, meal_name, main, side, calories, ingredients, order_index } = req.body;
  const userEmail = req.user.email;
  if (!plan_date || !meal_name) {
    return res.status(400).json({ error: 'Thiếu thông tin plan_date hoặc meal_name' });
  }

  const id = `${userEmail}_${plan_date}_${meal_name}`;
  const ingredientsArray = Array.isArray(ingredients) ? ingredients : [];

  try {
    // Nếu không truyền order_index và là món mới, lấy vị trí kế tiếp
    let finalOrderIndex = order_index;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      const countRes = await pool.query(
        'SELECT COALESCE(MAX(order_index), -1) + 1 as next_idx FROM meal_plans WHERE plan_date = $1 AND user_email = $2;',
        [plan_date, userEmail]
      );
      finalOrderIndex = countRes.rows[0]?.next_idx || 0;
    }

    await pool.query(
      `INSERT INTO meal_plans (id, user_email, plan_date, meal_name, main_dish, side_dish, calories, ingredients, order_index, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, CURRENT_TIMESTAMP)
       ON CONFLICT (user_email, plan_date, meal_name)
       DO UPDATE SET
         main_dish = EXCLUDED.main_dish,
         side_dish = EXCLUDED.side_dish,
         calories = EXCLUDED.calories,
         ingredients = EXCLUDED.ingredients,
         updated_at = CURRENT_TIMESTAMP;`,
      [id, userEmail, plan_date, meal_name, main || '', side || '', calories || '', JSON.stringify(ingredientsArray), finalOrderIndex]
    );

    // Ghi log
    await logAction('Cập nhật', 'Thực đơn', `${meal_name} - ${plan_date}`, userEmail);

    res.json({ message: 'Lưu thực đơn thành công', plan_date, meal_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa thực đơn 1 bữa
app.delete('/api/meals', async (req, res) => {
  const { plan_date, meal_name } = req.body;
  const userEmail = req.user.email;
  if (!plan_date || !meal_name) {
    return res.status(400).json({ error: 'Thiếu thông tin plan_date hoặc meal_name' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM meal_plans WHERE plan_date = $1 AND meal_name = $2 AND user_email = $3 RETURNING id;',
      [plan_date, meal_name, userEmail]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy thực đơn' });
    }
    
    // Ghi log
    await logAction('Xóa', 'Thực đơn', `${meal_name} - ${plan_date}`, userEmail);
    
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
  const userEmail = req.user.email;
  try {
    // Tự động loại bỏ / xóa các món đi chợ chưa mua của những ngày đã qua
    try {
      await pool.query(`
        DELETE FROM grocery_items 
        WHERE user_email = $1 
          AND (
            (plan_date IS NOT NULL AND plan_date < CURRENT_DATE AND is_bought = false)
            OR (plan_date IS NULL AND is_bought = false AND EXISTS (
                 SELECT 1 FROM meal_plans mp, jsonb_array_elements(mp.ingredients) ing
                 WHERE mp.user_email = $1
                   AND mp.plan_date < CURRENT_DATE 
                   AND LOWER(TRIM(ing->>'name')) = LOWER(TRIM(grocery_items.item_name))
                   AND (ing->>'isBought')::boolean = false
               ))
          );
      `, [userEmail]);
    } catch (cleanErr) {
      console.warn('Lỗi dọn dẹp món đi chợ quá hạn:', cleanErr.message);
    }

    const result = await pool.query(`
      SELECT 
        id, 
        item_name as name, 
        quantity, 
        category, 
        is_bought as checked,
        TO_CHAR(plan_date, 'YYYY-MM-DD') as plan_date,
        created_at
      FROM grocery_items
      WHERE user_email = $1
        AND NOT (plan_date IS NOT NULL AND plan_date < CURRENT_DATE AND is_bought = false)
      ORDER BY is_bought ASC, created_at ASC;
    `, [userEmail]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm mới món đi chợ
app.post('/api/groceries', async (req, res) => {
  const { id, name, quantity, category, checked, plan_date } = req.body;
  const itemId = id || Date.now().toString();
  const userEmail = req.user.email;

  try {
    const result = await pool.query(
      `INSERT INTO grocery_items (id, user_email, item_name, quantity, category, is_bought, plan_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, item_name as name, quantity, category, is_bought as checked, TO_CHAR(plan_date, 'YYYY-MM-DD') as plan_date;`,
      [itemId, userEmail, name, quantity || '1 phần', category || 'Rau củ', checked || false, plan_date || null]
    );
    
    // Ghi log
    await logAction('Thêm', 'Món đi chợ', name, userEmail);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm hàng loạt món đi chợ (từ nguyên liệu thực đơn)
app.post('/api/groceries/batch', async (req, res) => {
  const { items, plan_date } = req.body; // array of { name, quantity, category, plan_date? }
  const userEmail = req.user.email;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Danh sách nguyên liệu rỗng' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const id = item.id || `${Date.now()}-${i}`;
      const itemPlanDate = item.plan_date || plan_date || null;
      const resItem = await client.query(
        `INSERT INTO grocery_items (id, user_email, item_name, quantity, category, is_bought, plan_date)
         VALUES ($1, $2, $3, $4, false, $5)
         RETURNING id, item_name as name, quantity, category, is_bought as checked, TO_CHAR(plan_date, 'YYYY-MM-DD') as plan_date;`,
        [id, userEmail, item.name, item.quantity || (itemPlanDate ? 'Thực đơn' : '1 phần'), item.category || 'Rau củ', itemPlanDate]
      );
      inserted.push(resItem.rows[0]);
    }
    await client.query('COMMIT');
    
    // Ghi log
    await logAction('Thêm', 'Món đi chợ', `Thêm ${items.length} món từ thực đơn`, userEmail);
    
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
  const userEmail = req.user.email;

  try {
    const result = await pool.query(
      `UPDATE grocery_items
       SET item_name = $1, quantity = $2, category = $3
       WHERE id = $4 AND user_email = $5
       RETURNING id, item_name as name, quantity, category, is_bought as checked;`,
      [name, quantity, category, id, userEmail]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món' });
    }
    
    // Ghi log
    await logAction('Sửa', 'Món đi chợ', name, userEmail);
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đổi trạng thái tick chọn món (checked / unchecked)
app.patch('/api/groceries/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.email;
  try {
    const result = await pool.query(
      `UPDATE grocery_items
       SET is_bought = NOT is_bought
       WHERE id = $1 AND user_email = $2
       RETURNING id, item_name as name, quantity, category, is_bought as checked;`,
      [id, userEmail]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Đồng bộ trạng thái đã mua từ Thực đơn sang Đi chợ (theo plan_date và tên món)
app.patch('/api/groceries/sync-status', async (req, res) => {
  const { plan_date, name, checked } = req.body;
  const userEmail = req.user.email;
  if (!name) {
    return res.status(400).json({ error: 'Thiếu tên món nguyên liệu' });
  }

  try {
    let query;
    let params;
    if (plan_date) {
      query = `
        UPDATE grocery_items
        SET is_bought = $1
        WHERE LOWER(TRIM(item_name)) = LOWER(TRIM($2))
          AND (plan_date = $3 OR plan_date IS NULL)
          AND user_email = $4
        RETURNING id, item_name as name, is_bought as checked, plan_date;
      `;
      params = [!!checked, name, plan_date, userEmail];
    } else {
      query = `
        UPDATE grocery_items
        SET is_bought = $1
        WHERE LOWER(TRIM(item_name)) = LOWER(TRIM($2))
          AND user_email = $3
        RETURNING id, item_name as name, is_bought as checked, plan_date;
      `;
      params = [!!checked, name, userEmail];
    }

    const result = await pool.query(query, params);
    res.json({ updatedCount: result.rowCount, items: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa các món đã mua (dọn dẹp giỏ hàng) - Phải đặt trước /:id để không bị Express coi 'bought' là tham số :id
app.delete('/api/groceries/bought', async (req, res) => {
  const userEmail = req.user.email;
  try {
    const result = await pool.query('DELETE FROM grocery_items WHERE is_bought = true AND user_email = $1 RETURNING id;', [userEmail]);
    
    // Ghi log
    await logAction('Xóa', 'Món đi chợ', `Xóa ${result.rows.length} món đã mua`, userEmail);
    
    res.json({ message: `Đã xóa ${result.rows.length} món đã mua`, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xóa 1 món đi chợ theo ID
app.delete('/api/groceries/:id', async (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.email;
  try {
    const result = await pool.query('DELETE FROM grocery_items WHERE id = $1 AND user_email = $2 RETURNING id;', [id, userEmail]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy món' });
    }
    
    // Ghi log
    await logAction('Xóa', 'Món đi chợ', `ID: ${id}`, userEmail);
    
    res.json({ message: 'Đã xóa món', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Chốt hóa đơn đi chợ: Ghi 1 khoản chi vào transactions và dọn dẹp các món đã mua trong CSDL
app.post('/api/groceries/finalize', async (req, res) => {
  const { billAmount } = req.body;
  const userEmail = req.user.email;
  const amount = Number(billAmount);

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Số tiền hóa đơn không hợp lệ' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Đếm và xóa các món đã mua của user
    const delRes = await client.query('DELETE FROM grocery_items WHERE is_bought = true AND user_email = $1 RETURNING id;', [userEmail]);
    const completedCount = delRes.rowCount;

    // 2. Tạo giao dịch chi tiêu mới cho user
    const transId = Date.now().toString();
    const transTitle = `Đi chợ (${completedCount > 0 ? `${completedCount} món` : 'Hóa đơn tổng'})`;
    const transDate = new Date().toISOString().split('T')[0];

    const transRes = await client.query(
      `INSERT INTO transactions (id, user_email, type, title, amount, category, transaction_date)
       VALUES ($1, $2, 'expense', $3, $4, 'Đi chợ', $5)
       RETURNING id, type, title, amount::numeric, category, TO_CHAR(transaction_date, 'YYYY-MM-DD') as date;`,
      [transId, userEmail, transTitle, amount, transDate]
    );

    // Ghi log
    await logAction('Thêm', 'Giao dịch', `${transTitle} (${amount})`, userEmail);

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
// 5. Phục vụ Giao diện tĩnh (Production on Vibe Host)
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
