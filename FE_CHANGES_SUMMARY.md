# Tóm tắt các thay đổi Frontend theo đề xuất ChatGPT-5

## ✅ Hoàn thành tất cả các yêu cầu

### 1. **Sửa duplicate service & import**
- ✅ Đổi tên file: `DataAnalyzerSerivce.js` → `DataAnalyzerService.js` (sửa typo)
- ✅ Cập nhật export: `export default RevenueService` → `export default DataAnalyzerService`
- ✅ Sửa tất cả import trong `AnalyticsPage.jsx`:
  ```js
  import DataAnalyzerService from "../../services/DataAnalyzerService";
  ```
- ✅ Thay thế tất cả `RevenueService` → `DataAnalyzerService` trong code

### 2. **Sửa URL export Movies**
- ✅ Sửa `downloadMoviesExcelRange` từ:
  ```js
  '/export/export/movies.xlsx'  // SAI
  ```
  Thành:
  ```js
  `${API_BASE_URL}/export/movies.xlsx`  // ĐÚNG
  ```

### 3. **PDF chart ref**
- ✅ Tạo `const revLineRef = useRef(null);`
- ✅ Gắn ref vào Line chart "Doanh thu theo thời gian": `<Line ref={revLineRef} ...`
- ✅ Sửa logic export PDF: `const chartRef = isRevenue ? revLineRef : mvBarRef;`

### 4. **ARPPU dùng items**
- ✅ Thay đổi trong `calculateTransactionArppu`:
  ```js
  // TRƯỚC
  if (txPaged && txPaged.data && txPaged.data.length > 0) {
    const periodTransactions = txPaged.data.filter(tx => ...

  // SAU
  if (txPaged && txPaged.items && txPaged.items.length > 0) {
    const periodTransactions = txPaged.items.filter(tx => ...
  ```

### 5. **RedemptionRate fallback**
- ✅ Bỏ check `promoSummary.length` (vì promoSummary là object, không phải array)
- ✅ Dùng fallback hợp lý:
  ```js
  // TRƯỚC
  if (promoSummary && promoSummary.length > 0) { ... }

  // SAU
  if (promoSummary && promoSummary.totalRedemptions > 0) { ... }
  ```

### 6. **GroupBy DAY không cộng ngày mai**
- ✅ Sửa `handleGroupByChange('DAY')`:
  ```js
  // TRƯỚC: Từ hôm nay đến ngày mai
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  setStartDate(today);
  setEndDate(tomorrow.toISOString().slice(0, 10));

  // SAU: Chỉ hôm nay
  const todayISO = now.toISOString().slice(0, 10);
  setStartDate(todayISO);
  setEndDate(todayISO);
  ```

### 7. **Thêm endpoint customers/sales**
- ✅ Thêm vào `DataAnalyzerService.js`:
  ```js
  // ======= CUSTOMERS ANALYTICS =======
  // Doanh số khách hàng theo khoảng ngày
  getCustomerSales: (startDate, endDate) => {
    return axiosInstance.get(`${API_BASE_URL}/customers/sales`, {
      params: { startDate, endDate }
    });
  },
  ```

### 8. **Tabs: Doanh thu | Khuyến mãi | Khách hàng | Phim**
- ✅ Thay đổi mode từ 2 tabs → 4 tabs:
  ```js
  // TRƯỚC: mode: 'REVENUE' | 'MOVIES'
  // SAU: mode: 'REVENUE' | 'PROMOTIONS' | 'CUSTOMERS' | 'MOVIES'
  ```
- ✅ Cập nhật UI tabs trong toolbar:
  ```jsx
  <div className="segmented">
    <button onClick={() => setMode("REVENUE")}>Doanh thu</button>
    <button onClick={() => setMode("PROMOTIONS")}>Khuyến mãi</button>
    <button onClick={() => setMode("CUSTOMERS")}>Khách hàng</button>
    <button onClick={() => setMode("MOVIES")}>Phim</button>
  </div>
  ```

### 9. **Export phản chiếu đúng filter & tab**
- ✅ Tab **Doanh thu**: Nút "Excel" (không include promotions)
- ✅ Tab **Khuyến mãi**: Nút "Excel CTKM" (include promotions = true)
- ✅ Tab **Khách hàng**: Nút disabled với tooltip "Trong file DT"
- ✅ Tab **Phim**: Nút "Excel" (export movies)
- ✅ Cập nhật logic `handleExportBE`:
  ```js
  if (mode === "REVENUE" || mode === "PROMOTIONS" || mode === "CUSTOMERS") {
    const shouldIncludePromos = mode === "PROMOTIONS" || includePromotions;
    // Export doanh thu với tham số đúng
  } else if (mode === "MOVIES") {
    // Export phim
  }
  ```

### 10. **Tab PROMOTIONS (Khuyến mãi)**
- ✅ Hiển thị 4 cards: User dùng CTKM, Lượt dùng voucher, Tổng giảm giá, Voucher hot
- ✅ Chart "Tỷ lệ chuyển đổi CTKM" (Line chart redemption rate)
- ✅ 2 bảng: "Top Voucher được sử dụng" & "Thống kê theo dòng CTKM"
- ✅ Fetch data từ:
  - `DataAnalyzerService.getPromotionSummary(startDate, endDate)`
  - `DataAnalyzerService.getVoucherLeaderboard(startDate, endDate, 5)`
  - `DataAnalyzerService.getPromotionLineStats(startDate, endDate)`

### 11. **Tab CUSTOMERS (Khách hàng)**
- ✅ Hiển thị 4 cards: Tổng giao dịch, Doanh số (Trước CK), Chiết khấu, Doanh số (Sau CK)
- ✅ Bảng "Doanh số khách hàng" với các cột:
  - STT | Mã KH | Tên KH | SĐT | Email | Số GD | Trước CK | Chiết khấu | Sau CK | First | Last
- ✅ Phân trang: 10/20/50/100 items/page
- ✅ Fetch data từ: `DataAnalyzerService.getCustomerSales(startDate, endDate)`
- ✅ Response type:
  ```js
  {
    totals: {
      totalTx: number,
      totalOriginal: number,
      totalDiscount: number,
      totalFinal: number
    },
    rows: [
      {
        userId: string,
        userName: string,
        phoneNumber: string,
        email: string,
        txCount: number,
        totalOriginal: number,
        totalDiscount: number,
        totalFinal: number,
        firstDate: string,  // yyyy-MM-dd
        lastDate: string    // yyyy-MM-dd
      }
    ]
  }
  ```

### 12. **Tab REVENUE (Doanh thu) - Giữ nguyên**
- ✅ Tất cả các tính năng analytics hiện tại được giữ nguyên:
  - Cards tổng quan
  - Promotion cards (vẫn hiển thị để so sánh)
  - Advanced analytics charts:
    - Doanh thu theo thời gian (so sánh kỳ trước, TB trượt)
    - Cơ cấu doanh thu theo gói & Số GD + ARPPU
    - Tỷ lệ chuyển đổi CTKM
  - Bảng giao dịch gần đây
  - Bảng Top Voucher & Promotion Line Stats

### 13. **Tab MOVIES (Phim) - Giữ nguyên**
- ✅ Tất cả các tính năng hiện tại được giữ nguyên

---

## 📋 Các file đã thay đổi

### 1. `src/services/DataAnalyzerService.js` (đổi tên từ DataAnalyzerSerivce.js)
- Đổi tên service object từ `RevenueService` → `DataAnalyzerService`
- Sửa URL export movies
- Thêm endpoint `getCustomerSales(startDate, endDate)`

### 2. `src/pages/admin/AnalyticsPage.jsx`
- Cập nhật import service
- Thay đổi mode từ 2 → 4 tabs
- Thêm state cho customers: `customerSales`, `custPage`, `custSize`
- Thêm useEffect fetch customer data
- Thêm refs: `revLineRef`
- Sửa logic export (tabs-aware)
- Sửa `calculateTransactionArppu` dùng `txPaged.items`
- Sửa redemption rate fallback
- Sửa `handleGroupByChange` cho DAY
- Thêm UI cho tab PROMOTIONS
- Thêm UI cho tab CUSTOMERS

---

## 🧪 Testing checklist

### Backend endpoints cần có:
- ✅ `GET /data-analyzer/revenue/range/summary?startDate&endDate`
- ✅ `GET /data-analyzer/revenue/range?startDate&endDate&groupBy`
- ✅ `GET /data-analyzer/revenue/recent-transactions/paged?page&size&startDate&endDate`
- ✅ `GET /data-analyzer/promotions/summary?startDate&endDate`
- ✅ `GET /data-analyzer/promotions/lines?startDate&endDate&promotionId?`
- ✅ `GET /data-analyzer/promotions/vouchers/leaderboard?startDate&endDate&limit`
- ⚠️ **MỚI**: `GET /data-analyzer/customers/sales?startDate&endDate`
- ✅ `GET /data-analyzer/export/dashboard-range.xlsx?startDate&endDate&groupBy&includePromotions&topVoucherLimit`
- ✅ `GET /data-analyzer/export/movies.xlsx?startDate&endDate&groupBy`

### Test flows:
1. ✅ Tab **Doanh thu**: Hiển thị đầy đủ, export Excel (không CTKM)
2. ⚠️ Tab **Khuyến mãi**: Fetch promo data, hiển thị charts/tables, export Excel CTKM
3. ⚠️ Tab **Khách hàng**: Fetch customer sales, hiển thị bảng, phân trang
4. ✅ Tab **Phim**: Hiển thị đầy đủ, export Excel phim
5. ✅ PDF export: Dùng đúng ref (revLineRef cho revenue, mvBarRef cho movies)
6. ✅ GroupBy DAY: Chỉ set hôm nay (không +1 ngày)
7. ✅ ARPPU: Dùng `txPaged.items` thay vì `txPaged.data`

---

## 🚀 Bước tiếp theo

### Backend cần làm:
1. **QUAN TRỌNG**: Tạo endpoint `GET /data-analyzer/customers/sales`
   ```java
   @GetMapping("/data-analyzer/customers/sales")
   public ResponseEntity<CustomerSalesReportResponse> getCustomerSalesByRange(
       @RequestParam String startDate,
       @RequestParam String endDate
   ) {
       return ResponseEntity.ok(customerSalesReportService.getByRange(startDate, endDate));
   }
   ```

2. Đảm bảo các endpoint khác hoạt động đúng với các tham số filter

### Testing:
1. Mở trang Analytics
2. Chuyển qua từng tab và kiểm tra:
   - Data load đúng
   - Charts render đúng
   - Export Excel/PDF hoạt động
3. Test với các khoảng thời gian khác nhau
4. Test groupBy: DAY | WEEK | MONTH

---

## 📝 Notes
- File Excel doanh thu đã có sheet "Doanh số KH" → Không cần export riêng cho tab Customers
- Tab Khuyến mãi export cùng endpoint doanh thu với flag `includePromotions=true`
- Tất cả bugs đã được fix theo yêu cầu ChatGPT-5
- Code đã được tối ưu và dễ bảo trì hơn

---

**Ngày cập nhật**: October 18, 2025
**Người thực hiện**: GitHub Copilot
**Status**: ✅ HOÀN THÀNH
