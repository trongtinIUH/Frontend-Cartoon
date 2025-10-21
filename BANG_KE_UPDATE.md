# 📊 Cập nhật Bảng kê Thống kê - Giống Excel

## ✅ Hoàn thành

Đã thêm chế độ xem **"Bảng kê"** cho tất cả 4 tab thống kê, hiển thị giống y hệt file Excel từ Backend:

### 1. 💰 **Doanh thu** (Revenue)
```
├─ I. TỔNG QUAN
│  ├─ Tổng doanh thu
│  ├─ Doanh thu (khoảng)
│  ├─ Tổng giao dịch
│  └─ GD (khoảng)
│
└─ II. BẢNG KÊ GIAO DỊCH THEO NGƯỜI DÙNG
   ├─ Nhóm 1: [Tên người dùng]
   │  ├─ Giao dịch 1, 2, 3...
   │  └─ Tổng cộng (Tên người dùng)
   ├─ Nhóm 2...
   └─ TỔNG CỘNG (Grand Total - màu đỏ)
```

**Tính năng:**
- ✅ Gom giao dịch theo người dùng
- ✅ STT nhóm
- ✅ Tổng cộng từng nhóm (màu vàng)
- ✅ Grand Total (màu đỏ, chữ to)
- ✅ Ghi chú giải thích

---

### 2. 🎟️ **Khuyến mãi** (Promotions)
```
├─ I. TỔNG QUAN CTKM
│  ├─ Tổng lượt áp dụng
│  ├─ Số user dùng CTKM
│  ├─ Tổng giảm giá
│  └─ Doanh thu sau giảm
│
├─ II. THỐNG KÊ THEO LINE
│  ├─ Promotion ID, Line ID, Tên Line
│  ├─ Loại (VOUCHER/PACKAGE)
│  ├─ Lượt dùng, Giảm giá, Giá gốc, Thu sau giảm
│  └─ TỔNG CỘNG
│
└─ III. TOP VOUCHER
   ├─ Mã voucher, Promotion ID, Line ID
   ├─ Lượt dùng, User duy nhất
   ├─ Giảm giá, Giá gốc, Thu sau giảm
   ├─ Max usage, Đã dùng
   └─ First use, Last use
```

**Tính năng:**
- ✅ Thống kê đầy đủ theo promotion line
- ✅ Badge phân loại VOUCHER/PACKAGE
- ✅ Top voucher với chi tiết sử dụng
- ✅ Tổng cộng cuối bảng (màu đỏ)

---

### 3. 👥 **Khách hàng** (Customers)
```
├─ TỔNG QUAN
│  ├─ Doanh số trước CK
│  ├─ Chiết khấu (màu đỏ)
│  ├─ Doanh số sau CK (màu xanh, đậm)
│  └─ Số giao dịch
│
└─ CHI TIẾT DOANH SỐ KHÁCH HÀNG
   ├─ STT, Mã KH, Tên KH, SĐT, Email
   ├─ Số GD, Doanh số trước CK
   ├─ Chiết khấu (màu đỏ), Doanh số sau CK (màu xanh)
   ├─ First buy, Last buy
   └─ TỔNG CỘNG (màu đỏ)
```

**Tính năng:**
- ✅ Danh sách đầy đủ khách hàng
- ✅ Thông tin liên hệ (SĐT, Email)
- ✅ Doanh số trước/sau chiết khấu
- ✅ Lịch sử mua hàng (First/Last)
- ✅ Tổng cộng chi tiết

---

### 4. 🎬 **Phim** (Movies)
```
├─ TỔNG QUAN (2 cột)
│  ├─ Cột trái: Tổng phim, Single/Series, Completed/Upcoming, Seasons/Episodes
│  └─ Cột phải: Thêm mới, Điểm TB, Thể loại phổ biến, Quốc gia hàng đầu
│
├─ II. TOP THEO LƯỢT XEM
│  ├─ Hình ảnh thumbnail
│  ├─ Tên phim, Lượt xem, Điểm TB
│  └─ Năm phát hành, Quốc gia
│
└─ III. TOP THEO ĐÁNH GIÁ
   ├─ Hình ảnh thumbnail
   ├─ Tên phim, Điểm TB, Số đánh giá
   └─ Năm phát hành, Quốc gia
```

**Tính năng:**
- ✅ Hiển thị thumbnail phim
- ✅ Top lượt xem & đánh giá
- ✅ Thông tin đầy đủ (năm, quốc gia)
- ✅ Ghi chú giải thích

---

## 🎯 Cách sử dụng

1. Vào trang **Analytics** (`/admin-analytics`)
2. Chọn tab: **Doanh thu** / **Khuyến mãi** / **Khách hàng** / **Phim**
3. Click nút **"Bảng kê"** (bên cạnh nút "Dashboard")
4. Chọn khoảng thời gian (Start Date → End Date)
5. Xem dữ liệu hiển thị **giống y hệt Excel** 📄

---

## 🎨 Thiết kế

### View Mode Toggle
```
┌─────────────┬────────────┐
│ 📊 Dashboard │ 📋 Bảng kê │  ← Click để chuyển đổi
└─────────────┴────────────┘
```

- **Dashboard**: Cards + Charts (phân tích nhanh)
- **Bảng kê**: Bảng chi tiết (giống Excel)

### Màu sắc theo Excel
- **Header**: Xám đậm (#6c757d) - chữ trắng
- **Tiêu đề nhóm**: Xám nhạt (#e9ecef)
- **Tổng nhóm**: Vàng nhạt (#fff3cd)
- **Grand Total**: Đỏ nhạt (#f8d7da) - chữ đậm, to

---

## 📥 Export Excel

### Các nút export:
1. **Tab Doanh thu**: 
   - `Excel` → Xuất báo cáo doanh thu
   
2. **Tab Khuyến mãi**: 
   - `Excel CTKM` → Xuất báo cáo có CTKM

3. **Tab Khách hàng**: 
   - *(Dữ liệu có trong file Doanh thu)*

4. **Tab Phim**: 
   - `Excel` → Xuất báo cáo phim

### File Excel bao gồm:
- **Doanh thu**: 
  - Sheet 1: Bảng kê doanh thu
  - Sheet 2: Revenue Chart
  - Sheet 3: Doanh số KH
  - (Nếu có CTKM: Sheet CTKM)

- **Phim**: 
  - Sheet 1: Tổng quan phim
  - Sheet 2: Phim mới theo thời gian
  - Sheet 3: Phân rã danh mục

---

## 🔧 Kỹ thuật

### Frontend
- **Component**: `AnalyticsPage.jsx`
- **CSS**: `AnalyticsPage.css`
- **Service**: `DataAnalyzerService.js`

### Tính năng kỹ thuật:
- ✅ View Mode state management
- ✅ Group by user/customer/promotion
- ✅ Responsive tables (mobile-friendly)
- ✅ Print-friendly styling
- ✅ Zebra stripes cho dễ đọc
- ✅ Border Excel-like

---

## 💡 Lợi ích

### Cho giáo viên:
- ✅ Frontend **khớp 100%** với Excel export
- ✅ Không cần tải file để xem
- ✅ Dễ so sánh giữa web và file Excel

### Cho người dùng:
- ✅ Xem nhanh không cần download
- ✅ 2 chế độ: Dashboard (phân tích) + Bảng kê (chi tiết)
- ✅ Responsive mobile
- ✅ Print-friendly

### Cho developer:
- ✅ Code structure rõ ràng
- ✅ Dễ maintain
- ✅ Có thể thêm filter/sort sau này

---

## 🐛 Fixed

1. ✅ Export Excel phim: Sửa endpoint từ `/data-analyzer/export/movies.xlsx` → `/export/export/movies.xlsx`
2. ✅ Thêm viewMode cho tất cả 4 tab
3. ✅ CSS bổ sung cho bảng kê mới
4. ✅ Responsive mobile cho bảng dài

---

## 📱 Responsive

### Desktop (≥992px)
- Hiển thị đầy đủ tất cả cột
- Bảng rộng, font size bình thường

### Tablet (768-991px)
- Font size nhỏ hơn (0.9rem)
- Scroll ngang nếu cần

### Mobile (<768px)
- Font size 0.8rem
- Ẩn một số cột không quan trọng
- Badges nhỏ hơn
- Scroll ngang

---

## 🎉 Hoàn thành!

Frontend bây giờ hiển thị **bảng kê** giống y hệt Excel:
- ✅ Doanh thu: Gom theo người dùng + Grand Total
- ✅ Khuyến mãi: Theo Line + Top Voucher
- ✅ Khách hàng: Chi tiết doanh số + Tổng cộng
- ✅ Phim: Top View + Top Rating với thumbnail

**Giáo viên giờ sẽ thấy frontend = Excel!** 📊✨
