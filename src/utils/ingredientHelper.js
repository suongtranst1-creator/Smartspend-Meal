/**
 * Smart Ingredient Parsing & Aggregation Utilities
 * Hỗ trợ phân tích, chuẩn hóa và cộng dồn định lượng nguyên liệu thông minh
 */

// Bảng ánh xạ đơn vị tương thích
const WEIGHT_UNITS = {
  g: 1,
  gr: 1,
  gram: 1,
  gam: 1,
  kg: 1000,
  kilo: 1000,
  kilogram: 1000,
  lạng: 100,
};

const VOLUME_UNITS = {
  ml: 1,
  mililit: 1,
  l: 1000,
  lit: 1000,
  lít: 1000,
};

/**
 * Chuẩn hóa tên nguyên liệu để so sánh trùng lặp
 * Ví dụ: "  Trứng Gà  " -> "trứng gà", "Cá Lóc tươi" -> "cá lóc tươi"
 */
export function normalizeIngredientName(name = '') {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Xóa các ghi chú trong ngoặc đơn nếu có khi so sánh tên chính (VD: "Trứng gà (ta)" -> "trứng gà")
    .replace(/\s*\([^)]*\)/g, '');
}

/**
 * Bóc tách chuỗi định lượng thành số và đơn vị
 * Ví dụ: "400g" -> { num: 400, unit: "g" }, "0.5 kg" -> { num: 0.5, unit: "kg" }
 * "4 quả" -> { num: 4, unit: "quả" }, "vừa đủ" -> { num: null, unit: "vừa đủ" }
 */
export function parseQuantity(qtyStr = '') {
  const cleanStr = String(qtyStr).trim();
  if (!cleanStr) {
    return { num: null, unit: '', raw: '' };
  }

  // Regex bắt số (hỗ trợ cả dấu chấm và phẩy: 0.5 hoặc 0,5 hoặc 1/2)
  const fractionMatch = cleanStr.match(/^(\d+)\/(\d+)\s*(.*)$/);
  if (fractionMatch) {
    const num = parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2]);
    return { num, unit: fractionMatch[3].trim(), raw: cleanStr };
  }

  const match = cleanStr.match(/^([\d]+(?:[.,]\d+)?)\s*(.*)$/);
  if (match) {
    const num = parseFloat(match[1].replace(',', '.'));
    const unit = match[2].trim();
    return { num, unit, raw: cleanStr };
  }

  return { num: null, unit: cleanStr, raw: cleanStr };
}

/**
 * Cộng dồn 2 định lượng với nhau
 * Ví dụ:
 * - "400g" + "200g" => "600g"
 * - "0.5kg" + "300g" => "800g"
 * - "1kg" + "1kg" => "2kg"
 * - "4 quả" + "2 quả" => "6 quả"
 * - "1 bó" + "2 bó" => "3 bó"
 * - "2 quả" + "100g" => "2 quả + 100g" (không cùng hệ đơn vị)
 */
export function combineQuantities(qty1 = '', qty2 = '') {
  if (!qty1 && !qty2) return '';
  if (!qty1) return qty2;
  if (!qty2) return qty1;

  const p1 = parseQuantity(qty1);
  const p2 = parseQuantity(qty2);

  // Cả 2 đều có giá trị số
  if (p1.num !== null && p2.num !== null) {
    const u1 = p1.unit.toLowerCase();
    const u2 = p2.unit.toLowerCase();

    // 1. Cùng là đơn vị khối lượng (g, kg, lạng)
    if (WEIGHT_UNITS[u1] && WEIGHT_UNITS[u2]) {
      const totalGrams = p1.num * WEIGHT_UNITS[u1] + p2.num * WEIGHT_UNITS[u2];
      if (totalGrams >= 1000 && totalGrams % 100 === 0) {
        return `${Number((totalGrams / 1000).toFixed(2))}kg`;
      }
      return `${Number(totalGrams.toFixed(1))}g`;
    }

    // 2. Cùng là đơn vị thể tích (ml, l, lít)
    if (VOLUME_UNITS[u1] && VOLUME_UNITS[u2]) {
      const totalMl = p1.num * VOLUME_UNITS[u1] + p2.num * VOLUME_UNITS[u2];
      if (totalMl >= 1000 && totalMl % 100 === 0) {
        return `${Number((totalMl / 1000).toFixed(2))}l`;
      }
      return `${Number(totalMl.toFixed(1))}ml`;
    }

    // 3. Cùng đơn vị đếm thông thường (quả, củ, nhánh, tép, bó, muỗng, gói, hộp, miếng...)
    if (u1 === u2 || !u1 || !u2) {
      const unit = p1.unit || p2.unit;
      const total = Number((p1.num + p2.num).toFixed(2));
      return unit ? `${total} ${unit}`.trim() : `${total}`;
    }

    // Khác đơn vị không thể quy đổi (VD: 2 quả + 100g)
    return `${qty1} + ${qty2}`;
  }

  // Nếu 1 trong 2 không có số (VD: "vừa đủ", "theo khẩu phần")
  if (qty1.toLowerCase() === qty2.toLowerCase()) {
    return qty1;
  }

  return `${qty1} + ${qty2}`;
}

/**
 * Phân tích 1 dòng văn bản nguyên liệu thành object { name, quantity }
 * Hỗ trợ các định dạng:
 * - "Thịt ba chỉ: 400g"
 * - "Thịt ba chỉ - 400g"
 * - "Thịt ba chỉ (400g)"
 * - "Thịt ba chỉ 400g"
 * - "Thịt ba chỉ"
 */
export function parseIngredientLine(line = '') {
  const clean = line.trim();
  if (!clean) return null;

  // 1. Định dạng "Tên: Số lượng" hoặc "Tên - Số lượng"
  const colonMatch = clean.match(/^([^:\-]+)[:\-]\s*(.+)$/);
  if (colonMatch) {
    return {
      name: colonMatch[1].trim(),
      quantity: colonMatch[2].trim(),
    };
  }

  // 2. Định dạng "Tên (Số lượng)"
  const parenMatch = clean.match(/^([^(]+)\(([^)]+)\)$/);
  if (parenMatch) {
    return {
      name: parenMatch[1].trim(),
      quantity: parenMatch[2].trim(),
    };
  }

  // 3. Định dạng "Tên Số_lượng" (VD: "Thịt heo 400g", "Trứng vịt 4 quả")
  const spaceMatch = clean.match(/^(.*?)\s+([\d]+(?:[.,]\d+)?\s*[a-zA-Zà-ỹÀ-Ỹ/]+)$/);
  if (spaceMatch && spaceMatch[1].length > 1) {
    return {
      name: spaceMatch[1].trim(),
      quantity: spaceMatch[2].trim(),
    };
  }

  // Không có số lượng rõ ràng
  return {
    name: clean,
    quantity: '',
  };
}

/**
 * Gộp 2 danh sách nguyên liệu và tự động cộng dồn số lượng nguyên liệu trùng lặp
 * @param {Array<{name: string, quantity: string, isBought?: boolean}>} baseList
 * @param {Array<{name: string, quantity: string, isBought?: boolean}>} incomingList
 * @returns {Array<{name: string, quantity: string, isBought: boolean}>}
 */
export function mergeIngredients(baseList = [], incomingList = []) {
  const map = new Map();

  const addOrMerge = (item) => {
    if (!item || !item.name) return;
    const rawName = item.name.trim();
    const normKey = normalizeIngredientName(rawName);
    const qty = (item.quantity || '').trim();

    if (map.has(normKey)) {
      const existing = map.get(normKey);
      const combinedQty = combineQuantities(existing.quantity, qty);
      map.set(normKey, {
        name: existing.name, // Giữ tên hiển thị ban đầu
        quantity: combinedQty,
        isBought: Boolean(existing.isBought && item.isBought),
      });
    } else {
      map.set(normKey, {
        name: rawName,
        quantity: qty,
        isBought: Boolean(item.isBought),
      });
    }
  };

  baseList.forEach(addOrMerge);
  incomingList.forEach(addOrMerge);

  return Array.from(map.values());
}

/**
 * Chuyển đổi chuỗi nhiều dòng thành mảng nguyên liệu có gộp trùng
 */
export function textToIngredientsArray(text = '') {
  const lines = text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const rawList = lines
    .map((line) => parseIngredientLine(line))
    .filter(Boolean);

  return mergeIngredients([], rawList);
}

/**
 * Chuyển đổi mảng nguyên liệu thành chuỗi hiển thị nhiều dòng
 */
export function ingredientsArrayToText(ingredients = []) {
  return ingredients
    .map((item) => {
      const name = item.name || '';
      const qty = item.quantity || '';
      if (qty) {
        return `${name}: ${qty}`;
      }
      return name;
    })
    .join('\n');
}

/**
 * Trừ định lượng của 2 giá trị nguyên liệu
 * Trả về chuỗi định lượng còn lại, hoặc null nếu định lượng đã hết (<= 0)
 */
export function subtractQuantities(baseQty = '', deductQty = '') {
  const cleanBase = String(baseQty || '').trim();
  const cleanDeduct = String(deductQty || '').trim();

  if (!cleanBase && !cleanDeduct) return null;
  if (!cleanDeduct) return cleanBase;
  if (!cleanBase) return null;

  const p1 = parseQuantity(cleanBase);
  const p2 = parseQuantity(cleanDeduct);

  // Cả 2 đều có giá trị số
  if (p1.num !== null && p2.num !== null) {
    const u1 = p1.unit.toLowerCase();
    const u2 = p2.unit.toLowerCase();

    // 1. Cùng là đơn vị khối lượng (g, kg, lạng)
    if (WEIGHT_UNITS[u1] && WEIGHT_UNITS[u2]) {
      const baseGrams = p1.num * WEIGHT_UNITS[u1];
      const deductGrams = p2.num * WEIGHT_UNITS[u2];
      const remainingGrams = baseGrams - deductGrams;
      if (remainingGrams <= 0) return null;
      if (remainingGrams >= 1000 && remainingGrams % 100 === 0) {
        return `${Number((remainingGrams / 1000).toFixed(2))}kg`;
      }
      return `${Number(remainingGrams.toFixed(1))}g`;
    }

    // 2. Cùng là đơn vị thể tích (ml, l, lit, lít)
    if (VOLUME_UNITS[u1] && VOLUME_UNITS[u2]) {
      const baseMl = p1.num * VOLUME_UNITS[u1];
      const deductMl = p2.num * VOLUME_UNITS[u2];
      const remainingMl = baseMl - deductMl;
      if (remainingMl <= 0) return null;
      if (remainingMl >= 1000 && remainingMl % 100 === 0) {
        return `${Number((remainingMl / 1000).toFixed(2))}l`;
      }
      return `${Number(remainingMl.toFixed(1))}ml`;
    }

    // 3. Cùng đơn vị đếm (quả, củ, nhánh, tép, bó, thìa, muỗng, gói, hộp, miếng...)
    if (u1 === u2 || !u1 || !u2) {
      const remaining = Number((p1.num - p2.num).toFixed(2));
      if (remaining <= 0) return null;
      const unit = p1.unit || p2.unit;
      return unit ? `${remaining} ${unit}`.trim() : `${remaining}`;
    }

    // Khác hệ quy đổi nhưng có dạng ghép "2 quả + 100g"
    if (cleanBase.includes(cleanDeduct)) {
      const cleaned = cleanBase
        .replace(cleanDeduct, '')
        .replace(/\+\s*\+/, '+')
        .replace(/^\s*\+\s*/, '')
        .replace(/\s*\+\s*$/, '')
        .trim();
      return cleaned || null;
    }
  }

  // Khớp chính xác tên hoặc không có số lượng
  if (cleanBase.toLowerCase() === cleanDeduct.toLowerCase()) {
    return null;
  }

  return cleanBase;
}

/**
 * Trừ một danh sách nguyên liệu (deductList) ra khỏi danh sách nguyên liệu cơ sở (baseList)
 * @param {Array<{name: string, quantity: string, isBought?: boolean}>} baseList
 * @param {Array<{name: string, quantity: string, isBought?: boolean}>} deductList
 * @returns {Array<{name: string, quantity: string, isBought: boolean}>}
 */
export function subtractIngredients(baseList = [], deductList = []) {
  const result = baseList.map((item) => ({ ...item }));

  deductList.forEach((deductItem) => {
    if (!deductItem || !deductItem.name) return;
    const normKey = normalizeIngredientName(deductItem.name);

    const idx = result.findIndex(
      (item) => normalizeIngredientName(item.name) === normKey
    );

    if (idx !== -1) {
      const current = result[idx];
      const remainingQty = subtractQuantities(current.quantity, deductItem.quantity);
      if (remainingQty === null) {
        result.splice(idx, 1);
      } else {
        result[idx] = {
          ...current,
          quantity: remainingQty,
        };
      }
    }
  });

  return result;
}

/**
 * Phân tích chuỗi món ăn thành tên gốc và số lượng (VD: "Cá basa kho tộ x2" -> { name: "Cá basa kho tộ", count: 2 })
 */
export function parseDishItem(str = '') {
  if (!str) return { name: '', count: 1 };
  const trimmed = String(str).trim();
  const match = trimmed.match(/^(.*?)(?:\s+[xX](\d+))?$/);
  if (match && match[2]) {
    const count = parseInt(match[2], 10);
    return { name: match[1].trim(), count: isNaN(count) || count < 1 ? 1 : count };
  }
  return { name: trimmed, count: 1 };
}

/**
 * Định dạng lại món ăn với số lượng (VD: { name: "Cá basa kho tộ", count: 2 } -> "Cá basa kho tộ x2")
 */
export function formatDishItem(item) {
  if (!item || !item.name) return '';
  return item.count > 1 ? `${item.name} x${item.count}` : item.name;
}

/**
 * Trích xuất số calo từ chuỗi (VD: "550 kcal" -> 550)
 */
export function parseCaloriesNumber(calStr = '') {
  if (!calStr) return 0;
  const match = String(calStr).match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(',', '.'));
}
