import { pool } from './db.js';
import crypto from 'crypto';

/**
 * Tự động tạo bộ dữ liệu mẫu phong phú và thực tế cho người dùng mới đăng nhập lần đầu.
 * Đảm bảo ngày tháng được tính động tương đối theo ngày hiện tại để thực đơn luôn nằm trong tuần này.
 * @param {string} userEmail
 * @returns {Promise<boolean>} true nếu đã seed, false nếu user đã có dữ liệu từ trước
 */
export async function seedUserDataIfNew(userEmail) {
  if (!userEmail) return false;

  const email = userEmail.toLowerCase().trim();

  try {
    // 1. Kiểm tra xem người dùng này đã có dữ liệu nào chưa
    const checkTrans = await pool.query(
      'SELECT 1 FROM transactions WHERE user_email = $1 LIMIT 1;',
      [email]
    );
    if (checkTrans.rows.length > 0) {
      return false; // Đã có giao dịch -> Không ghi đè
    }

    const checkMeals = await pool.query(
      'SELECT 1 FROM meal_plans WHERE user_email = $1 LIMIT 1;',
      [email]
    );
    if (checkMeals.rows.length > 0) {
      return false; // Đã có thực đơn -> Không ghi đè
    }

    console.log(`🌱 Đang khởi tạo bộ dữ liệu mẫu phong phú cho người dùng mới: ${email}...`);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Hàm sinh ngày YYYY-MM-DD tương đối so với hôm nay
      const getOffsetDate = (daysOffset) => {
        const d = new Date();
        d.setDate(d.getDate() + daysOffset);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const todayStr = getOffsetDate(0);
      const yesterdayStr = getOffsetDate(-1);
      const dayAgo2Str = getOffsetDate(-2);
      const dayAgo4Str = getOffsetDate(-4);
      const dayAgo5Str = getOffsetDate(-5);
      const tomorrowStr = getOffsetDate(1);
      const dayAfterTomorrowStr = getOffsetDate(2);

      // ==========================================================
      // 1. SEED TRANSACTIONS (Sổ Thu Chi)
      // ==========================================================
      const sampleTransactions = [
        {
          id: `trans_${Date.now()}_1`,
          type: 'income',
          title: 'Lương chuyển khoản tháng này',
          amount: 18500000,
          category: 'Lương',
          date: dayAgo5Str,
        },
        {
          id: `trans_${Date.now()}_2`,
          type: 'income',
          title: 'Thưởng dự án hoàn thành xuất sắc',
          amount: 3500000,
          category: 'Thưởng',
          date: dayAgo2Str,
        },
        {
          id: `trans_${Date.now()}_3`,
          type: 'expense',
          title: 'Tiền thuê căn hộ & phí quản lý dịch vụ',
          amount: 5500000,
          category: 'Tiền nhà',
          date: dayAgo5Str,
        },
        {
          id: `trans_${Date.now()}_4`,
          type: 'expense',
          title: 'Hóa đơn tiền điện & nước sinh hoạt',
          amount: 850000,
          category: 'Hóa đơn',
          date: dayAgo4Str,
        },
        {
          id: `trans_${Date.now()}_5`,
          type: 'expense',
          title: 'Đi chợ tuần tại siêu thị WinMart',
          amount: 620000,
          category: 'Đi chợ',
          date: dayAgo2Str,
        },
        {
          id: `trans_${Date.now()}_6`,
          type: 'expense',
          title: 'Ăn trưa cơm văn phòng & Cafe đồng nghiệp',
          amount: 85000,
          category: 'Ăn uống',
          date: yesterdayStr,
        },
        {
          id: `trans_${Date.now()}_7`,
          type: 'expense',
          title: 'Mua sắm đồ dùng tiện ích gia đình',
          amount: 320000,
          category: 'Mua sắm',
          date: todayStr,
        },
      ];

      for (const t of sampleTransactions) {
        await client.query(
          `INSERT INTO transactions (id, user_email, type, title, amount, category, transaction_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING;`,
          [t.id, email, t.type, t.title, t.amount, t.category, t.date]
        );
      }

      // ==========================================================
      // 2. SEED MEAL PLANS (Thực Đơn Tuần - Bữa Trưa, Bữa Tối, Bữa Sáng)
      // ==========================================================
      const sampleMeals = [
        // Hôm nay: Bữa Trưa
        {
          plan_date: todayStr,
          meal_name: 'Bữa Trưa',
          main: 'Thịt kho tàu',
          side: 'Canh chua cá lóc',
          calories: '650 kcal',
          order_index: 0,
          ingredients: [
            { name: 'Thịt ba chỉ (400g)', isBought: true },
            { name: 'Trứng vịt (4 quả)', isBought: true },
            { name: 'Nước dừa tươi (300ml)', isBought: true },
            { name: 'Cá lóc (300g)', isBought: false },
            { name: 'Cà chua (2 quả)', isBought: false },
            { name: 'Đậu bắp (5 quả)', isBought: false },
            { name: 'Bạc hà (2 nhánh)', isBought: false },
          ],
        },
        // Hôm nay: Bữa Tối
        {
          plan_date: todayStr,
          meal_name: 'Bữa Tối',
          main: 'Sườn xào chua ngọt',
          side: 'Rau muống xào tỏi',
          calories: '520 kcal',
          order_index: 1,
          ingredients: [
            { name: 'Sườn heo (500g)', isBought: false },
            { name: 'Cà chua (2 quả)', isBought: false },
            { name: 'Hành tây (1 củ)', isBought: true },
            { name: 'Rau muống (1 bó)', isBought: false },
            { name: 'Tỏi (1 củ)', isBought: true },
          ],
        },
        // Ngày mai: Bữa Sáng
        {
          plan_date: tomorrowStr,
          meal_name: 'Bữa Sáng',
          main: 'Phở bò tái lăn',
          side: 'Quẩy giòn ăn kèm',
          calories: '480 kcal',
          order_index: 0,
          ingredients: [
            { name: 'Bánh phở tươi (500g)', isBought: false },
            { name: 'Thịt bò phi lê (250g)', isBought: false },
            { name: 'Hành hoa & Ngò gai (1 bó)', isBought: false },
          ],
        },
        // Ngày mai: Bữa Trưa
        {
          plan_date: tomorrowStr,
          meal_name: 'Bữa Trưa',
          main: 'Gà kho gừng',
          side: 'Canh bí đỏ thịt băm',
          calories: '580 kcal',
          order_index: 1,
          ingredients: [
            { name: 'Thịt gà ta (500g)', isBought: false },
            { name: 'Gừng tươi (1 củ)', isBought: false },
            { name: 'Bí đỏ (300g)', isBought: false },
            { name: 'Thịt heo băm (100g)', isBought: false },
          ],
        },
        // Ngày mốt: Bữa Tối
        {
          plan_date: dayAfterTomorrowStr,
          meal_name: 'Bữa Tối',
          main: 'Cá basa kho tộ',
          side: 'Canh rau ngót thịt băm',
          calories: '490 kcal',
          order_index: 0,
          ingredients: [
            { name: 'Cá basa tươi (400g)', isBought: false },
            { name: 'Hành tím (2 củ)', isBought: false },
            { name: 'Rau ngót non (1 bó)', isBought: false },
            { name: 'Thịt heo băm (150g)', isBought: false },
          ],
        },
      ];

      for (const m of sampleMeals) {
        const mealId = crypto.createHash('md5').update(`${email}_${m.plan_date}_${m.meal_name}`).digest('hex');
        await client.query(
          `INSERT INTO meal_plans (id, user_email, plan_date, meal_name, main_dish, side_dish, calories, ingredients, order_index, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, CURRENT_TIMESTAMP)
           ON CONFLICT (user_email, plan_date, meal_name) DO NOTHING;`,
          [mealId, email, m.plan_date, m.meal_name, m.main, m.side, m.calories, JSON.stringify(m.ingredients), m.order_index]
        );
      }

      // ==========================================================
      // 3. SEED GROCERY ITEMS (Danh Sách Đi Chợ Liên Thông)
      // ==========================================================
      const sampleGroceries = [
        {
          id: `groc_${Date.now()}_1`,
          name: 'Cá lóc tươi (300g)',
          quantity: '300g',
          category: 'Thịt cá',
          checked: false,
          plan_date: todayStr,
        },
        {
          id: `groc_${Date.now()}_2`,
          name: 'Đậu bắp & Bạc hà (Canh chua)',
          quantity: '1 phần',
          category: 'Rau củ',
          checked: false,
          plan_date: todayStr,
        },
        {
          id: `groc_${Date.now()}_3`,
          name: 'Sườn heo non (500g)',
          quantity: '500g',
          category: 'Thịt cá',
          checked: false,
          plan_date: todayStr,
        },
        {
          id: `groc_${Date.now()}_4`,
          name: 'Rau muống xanh giòn',
          quantity: '1 bó',
          category: 'Rau củ',
          checked: false,
          plan_date: todayStr,
        },
        {
          id: `groc_${Date.now()}_5`,
          name: 'Thịt ba chỉ rút sườn',
          quantity: '400g',
          category: 'Thịt cá',
          checked: true, // Đã mua sẵn
          plan_date: todayStr,
        },
        {
          id: `groc_${Date.now()}_6`,
          name: 'Trứng vịt tươi',
          quantity: '4 quả',
          category: 'Trứng sữa',
          checked: true, // Đã mua sẵn
          plan_date: todayStr,
        },
        {
          id: `groc_${Date.now()}_7`,
          name: 'Nước dừa tươi',
          quantity: '300ml',
          category: 'Đồ khô',
          checked: true, // Đã mua sẵn
          plan_date: todayStr,
        },
        {
          id: `groc_${Date.now()}_8`,
          name: 'Bánh phở tươi & Thịt bò',
          quantity: '1 phần',
          category: 'Thịt cá',
          checked: false,
          plan_date: tomorrowStr,
        },
      ];

      for (const g of sampleGroceries) {
        await client.query(
          `INSERT INTO grocery_items (id, user_email, item_name, quantity, category, is_bought, plan_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING;`,
          [g.id, email, g.name, g.quantity, g.category, g.checked, g.plan_date]
        );
      }

      // ==========================================================
      // 4. SEED CUSTOM PRESET DISH (Món Mẫu Tùy Chỉnh Riêng)
      // ==========================================================
      const customPresetDishes = [
        {
          id: `dish_custom_${Date.now()}_1`,
          name: 'Bún chả Hà Nội gia truyền',
          category: 'Món chính',
          calories: '550 kcal',
          ingredients: [
            { name: 'Thịt ba chỉ nướng', quantity: '300g' },
            { name: 'Thịt nạc vai băm', quantity: '200g' },
            { name: 'Bún tươi', quantity: '500g' },
            { name: 'Đu đủ & Cà rốt ngâm', quantity: '1 bát' },
            { name: 'Rau sống các loại', quantity: '1 rổ' },
          ],
        },
        {
          id: `dish_custom_${Date.now()}_2`,
          name: 'Salad ức gà sốt mè rang',
          category: 'Ăn sáng',
          calories: '280 kcal',
          ingredients: [
            { name: 'Ức gà áp chảo', quantity: '200g' },
            { name: 'Xà lách lolo xanh', quantity: '1 cây' },
            { name: 'Cà chua bi', quantity: '10 quả' },
            { name: 'Sốt mè rang', quantity: '2 muỗng' },
          ],
        },
      ];

      for (const d of customPresetDishes) {
        await client.query(
          `INSERT INTO preset_dishes (id, user_email, name, category, calories, ingredients)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)
           ON CONFLICT (id) DO NOTHING;`,
          [d.id, email, d.name, d.category, d.calories, JSON.stringify(d.ingredients)]
        );
      }

      // ==========================================================
      // 5. SEED SYSTEM LOG (Nhật ký khởi tạo)
      // ==========================================================
      await client.query(
        `INSERT INTO system_logs (user_email, action, entity_type, entity_name)
         VALUES ($1, 'Khởi tạo', 'Hệ thống', 'Nạp dữ liệu mẫu ban đầu cho tài khoản');`,
        [email]
      );

      await client.query('COMMIT');
      console.log(`✅ Đã nạp thành công bộ dữ liệu mẫu cho tài khoản mới: ${email}`);
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Lỗi khi nạp dữ liệu mẫu cho ${email}:`, err.message);
      return false;
    } finally {
      client.release();
    }
  } catch (outerErr) {
    console.error('Lỗi kiểm tra dữ liệu mẫu:', outerErr.message);
    return false;
  }
}
