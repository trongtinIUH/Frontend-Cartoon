
// Parse "YYYY-MM-DD" -> Date (local midnight). Trả null nếu invalid.
export const toMidnight = (iso) => {
  if (!iso || typeof iso !== "string") return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  // Tạo theo LOCAL TIME (00:00 local)
  const dt = new Date(y, m - 1, d);
  // Kiểm tra ngược phòng trường hợp 2025-02-31 -> Mar 2
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  dt.setHours(0, 0, 0, 0);
  return dt;
};

// Tính số ngày chênh (end - start), theo local midnight
export const diffDays = (startIso, endIso) => {
  const s = toMidnight(startIso);
  const e = toMidnight(endIso);
  if (!s || !e) return NaN;
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
};

// Cộng n ngày vào "YYYY-MM-DD"
export const addDays = (iso, n) => {
  const d = toMidnight(iso);
  if (!d || !Number.isFinite(n)) return "";
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// Lấy max của 2 ISO theo thời gian
export const maxIso = (a, b) => {
  const da = toMidnight(a);
  const db = toMidnight(b);
  if (!da) return b || "";
  if (!db) return a || "";
  return da > db ? a : b;
};

// Hôm nay (local) ở định dạng YYYY-MM-DD
export const todayYMD = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

// Ngày mai (local) YYYY-MM-DD
export const tomorrowYMD = () => addDays(todayYMD(), 1);

// Từ start tạo min cho end (>= start + 1)
export const minEndFromStart = (startIso) => {
  if (!startIso) return tomorrowYMD();
  return addDays(startIso, 1);
};

