import React, { useEffect, useMemo, useState, useRef  } from "react";
import Sidebar from "../../components/Sidebar";
import RevenueService from "../../services/DataAnalyzerSerivce";
import DataAnalyzerService from "../../services/DataAnalyzerSerivce";
import { Bar, Doughnut, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import "../../css/admin/AnalyticsPage.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AnalyticsPage = () => {
  // mode: 'REVENUE' | 'MOVIES'
  const [mode, setMode] = useState("REVENUE");

  // range + groupBy
  const todayISO = new Date().toISOString().slice(0, 10);
  const monthAgoISO = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(monthAgoISO);
  const [endDate, setEndDate] = useState(todayISO);
  const [groupBy, setGroupBy] = useState("DAY"); // DAY | WEEK | MONTH

  // Revenue states
  const [revChart, setRevChart] = useState({ labels: [], data: [] });
  const [revSummary, setRevSummary] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalTransactions: 0,
    monthlyTransactions: 0,
  });
  const [quickStats, setQuickStats] = useState({
    todayRevenue: 0,
    weekRevenue: 0,
    growthPercent: 0,
    popularPackage: "",
  });
  const [txPaged, setTxPaged] = useState({ total: 0, items: [] });
  const [txPage, setTxPage] = useState(1);
  const [txSize, setTxSize] = useState(10);

  // Promotion states (integrated with Revenue)
  const [promoSummary, setPromoSummary] = useState({
    totalRedemptions: 0,
    uniqueUsers: 0,
    totalDiscountGranted: 0,
    totalOriginalAmount: 0,
    totalFinalAmount: 0,
    firstRedemptionDate: null,
    lastRedemptionDate: null,
    topVoucher: null
  });
  const [voucherLeaderboard, setVoucherLeaderboard] = useState([]);
  const [promotionLineStats, setPromotionLineStats] = useState([]);

  // Movie states
  const [mvChart, setMvChart] = useState({ labels: [], data: [] });
  const [mvSummary, setMvSummary] = useState({
    totalMovies: 0,
    totalSingle: 0,
    totalSeries: 0,
    completedCount: 0,
    upcomingCount: 0,
    totalSeasons: 0,
    totalEpisodes: 0,
    addedToday: 0,
    addedThisWeek: 0,
    addedThisMonth: 0,
    avgRatingAll: 0,
    totalRatings: 0,
    topGenre: "N/A",
    topCountry: "N/A",
    topByViews: null,
    topByRating: null,
  });
  const [genreStats, setGenreStats] = useState([]);
  const [countryStats, setCountryStats] = useState([]);
  const [statusStats, setStatusStats] = useState([]);
  const [typeStats, setTypeStats] = useState([]);
  const [topMoviesByViews, setTopMoviesByViews] = useState([]);
  const [topMoviesByRating, setTopMoviesByRating] = useState([]);

  // ======= REVENUE fetch =======
  useEffect(() => {
    if (mode !== "REVENUE") return;
    RevenueService.getRevenueByRange(startDate, endDate, groupBy).then((r) => setRevChart(r.data));
    RevenueService.getRevenueSummaryByRange(startDate, endDate).then((r) => setRevSummary(r.data));
    RevenueService.getQuickStats().then((r) => setQuickStats(r.data));
    // Fetch promotion data
    DataAnalyzerService.getPromotionSummary(startDate, endDate).then((r) => {
      console.log("Promotion Summary Response:", r.data);
      setPromoSummary(r.data);
    }).catch(e => console.error("Error fetching promotion summary:", e));
    DataAnalyzerService.getVoucherLeaderboard(startDate, endDate, 5).then((r) => {
      console.log("Voucher Leaderboard Response:", r.data);
      setVoucherLeaderboard(r.data);
    }).catch(e => console.error("Error fetching voucher leaderboard:", e));
    DataAnalyzerService.getPromotionLineStats(startDate, endDate).then((r) => {
      console.log("Promotion Line Stats Response:", r.data);
      setPromotionLineStats(r.data);
    }).catch(e => console.error("Error fetching promotion line stats:", e));
  }, [mode, startDate, endDate, groupBy]);

  useEffect(() => {
    if (mode !== "REVENUE") return;
    RevenueService.getRecentTransactionsPaged(txPage, txSize, startDate, endDate).then((r) =>
      setTxPaged(r.data)
    );
  }, [mode, txPage, txSize, startDate, endDate]);

  // ======= MOVIES fetch =======
  useEffect(() => {
    if (mode !== "MOVIES") return;
    RevenueService.getNewMoviesByRange(startDate, endDate, groupBy).then((r) => setMvChart(r.data));
    RevenueService.getMovieSummaryByRange(startDate, endDate).then((r) => setMvSummary(r.data));
  }, [mode, startDate, endDate, groupBy]);

  useEffect(() => {
    // fetch 1 lần – dùng chung khi chuyển tab MOVIES
    RevenueService.getCountByGenre(10).then((r) => setGenreStats(r.data));
    RevenueService.getCountByCountry(10).then((r) => setCountryStats(r.data));
    RevenueService.getStatusBreakdown().then((r) => setStatusStats(r.data));
    RevenueService.getTypeBreakdown().then((r) => setTypeStats(r.data));
    RevenueService.getTopByViews(5).then((r) => setTopMoviesByViews(r.data));
    RevenueService.getTopByRating(5, 1).then((r) => setTopMoviesByRating(r.data));
  }, []);

  // ======= Charts config =======
  const revBar = useMemo(
    () => ({
      labels: revChart.labels || [],
      datasets: [
        {
          label: `Doanh thu (${groupBy.toLowerCase()})`,
          data: revChart.data || [],
          backgroundColor: "rgba(54,162,235,.65)",
          borderRadius: 6,
          maxBarThickness: 24,
          barPercentage: 0.6,
          categoryPercentage: 0.6,
        },
      ],
    }),
    [revChart, groupBy]
  );

  const mvBar = useMemo(
    () => ({
      labels: mvChart.labels || [],
      datasets: [
        {
          label: `Phim mới (${groupBy.toLowerCase()})`,
          data: mvChart.data || [],
          backgroundColor: "rgba(75,192,192,.65)",
          borderRadius: 6,
        },
      ],
    }),
    [mvChart, groupBy]
  );

  const pieStatus = useMemo(
    () => ({
      labels: statusStats.map((i) => (i.key === "COMPLETED" ? "Hoàn thành" : "Sắp ra mắt")),
      datasets: [{ data: statusStats.map((i) => i.count), backgroundColor: ["#28a745", "#ffc107"] }],
    }),
    [statusStats]
  );

  const doughnutType = useMemo(
    () => ({
      labels: typeStats.map((i) => (i.key === "SINGLE" ? "Phim lẻ" : "Phim bộ")),
      datasets: [{ data: typeStats.map((i) => i.count), backgroundColor: ["#007bff", "#6f42c1"] }],
    }),
    [typeStats]
  );

  const barGenre = useMemo(
    () => ({
      labels: genreStats.slice(0, 8).map((i) => i.key),
      datasets: [
        {
          label: "Số lượng phim",
          data: genreStats.slice(0, 8).map((i) => i.count),
          backgroundColor: "rgba(255,99,132,.65)",
          borderRadius: 6,
        },
      ],
    }),
    [genreStats]
  );

  const baseBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: {
      x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
      y: { beginAtZero: true },
    },
  };
  const basePieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  };

  // quick presets (tùy chọn: giữ “Nhanh” chỉ đổi date range)
  const applyQuickPreset = (preset) => {
    const now = new Date();
    if (preset === "today") {
      const iso = now.toISOString().slice(0, 10);
      setStartDate(iso);
      setEndDate(iso);
      setGroupBy("DAY");
    } else if (preset === "thisWeek") {
      const d = new Date();
      const first = new Date(d.setDate(d.getDate() - ((d.getDay() + 6) % 7))); // Monday
      const last = new Date(first);
      last.setDate(first.getDate() + 6);
      setStartDate(first.toISOString().slice(0, 10));
      setEndDate(last.toISOString().slice(0, 10));
      setGroupBy("DAY");
    } else if (preset === "thisMonth") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(first.toISOString().slice(0, 10));
      setEndDate(last.toISOString().slice(0, 10));
      setGroupBy("DAY");
    }
  };

  //tô màu tăng trưởng danh thu
  const renderGrowth = (value) => {
  const g = Number(value);
  if (!Number.isFinite(g)) return <span className="text-muted">—</span>;
  const cls = g > 0 ? "text-success" : g < 0 ? "text-danger" : "text-muted";
  const arrow = g > 0 ? "▲" : g < 0 ? "▼" : "—";
  return <strong className={cls}>{arrow} {Math.abs(g).toFixed(2)}%</strong>;

};

//phần export file Excel & PDF
const revBarRef = useRef(null);
const mvBarRef  = useRef(null);

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// helper tải blob cho backend export
const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ---------- Export handlers (FE-only) ----------
const handleExportFE = async (format) => {
  const isRevenue = mode === "REVENUE";
  if (format === "xlsx") return clientExportXLSX(isRevenue);
  return clientExportPDF(isRevenue);
};

// ---------- Export Excel thông minh theo tab hiện tại ----------
const handleExportBE = async () => {
  try {
    const isRevenue = mode === "REVENUE";
    console.log("Export mode:", mode, "isRevenue:", isRevenue); // Debug log
    
    if (isRevenue) {
      // Tab DOANH THU: Xuất báo cáo doanh thu từ backend (đẹp)
      const brandInfo = {
        companyName: "CartoonToo — Web xem phim trực tuyến",
        companyAddress: "Nguyễn Văn Bảo/12 P. Hạnh Thông, Phường, Gò Vấp, Hồ Chí Minh"
      };
      
      const res = await RevenueService.downloadDashboardExcelRange(startDate, endDate, groupBy, brandInfo);
      saveBlob(res.data, `BaoCao_DoanhThu_${startDate}_${endDate}_${groupBy}.xlsx`);
    } else {
      // Tab PHIM: Xuất báo cáo thống kê phim từ FE (kế thừa logic cũ)
      console.log("Exporting movies data using FE logic...");
      await clientExportXLSX(false); // false = movies mode
    }
  } catch (err) {
    console.error("Export Excel error:", err);
    alert("Xuất Excel lỗi. Vui lòng kiểm tra và thử lại.");
  }
};

const clientExportXLSX = async (isRevenue) => {
  const XLSXModule = await import("xlsx");
  const XLSX = XLSXModule.default || XLSXModule;
  const wb = XLSX.utils.book_new();

  // Meta
  const meta = [
    ["Loại báo cáo", isRevenue ? "Doanh thu" : "Phim"],
    ["Từ ngày", startDate],
    ["Đến ngày", endDate],
    ["Nhóm theo", groupBy],
    [""],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(meta), "Thông tin");

  if (isRevenue) {
    const chartRows = [["Nhóm", "Doanh thu"]].concat((revChart.labels||[]).map((l,i)=>[l, revChart.data?.[i]||0]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(chartRows), "Doanh thu");

    const sum = [
      ["Tổng doanh thu", revSummary.totalRevenue||0],
      ["Doanh thu (khoảng)", revSummary.monthlyRevenue||0],
      ["Tổng giao dịch", revSummary.totalTransactions||0],
      ["GD (khoảng)", revSummary.monthlyTransactions||0],
      ["Hôm nay", quickStats.todayRevenue||0],
      ["Tuần này", quickStats.weekRevenue||0],
      ["Tăng trưởng (%)", quickStats.growthPercent||0],
      ["Gói phổ biến", quickStats.popularPackage||""],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sum), "Tóm tắt");

    const txRows = [["ID","Người dùng","Gói","Số tiền","Ngày","Trạng thái"]]
      .concat((txPaged.items||[]).map(tx=>[
        tx.orderId, tx.userName, tx.packageId, tx.finalAmount,
        new Date(tx.createdAt).toLocaleString("vi-VN"), tx.status
      ]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txRows), "Giao dịch");
  } else {
    const newRows = [["Nhóm","Phim mới"]].concat((mvChart.labels||[]).map((l,i)=>[l, mvChart.data?.[i]||0]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(newRows), "Phim mới");

    const sum = [
      ["Tổng số phim", mvSummary.totalMovies||0],
      ["Phim lẻ", mvSummary.totalSingle||0],
      ["Phim bộ", mvSummary.totalSeries||0],
      ["Hoàn thành", mvSummary.completedCount||0],
      ["Số tập", mvSummary.totalEpisodes||0],
      ["Thêm (tháng)", mvSummary.addedThisMonth||0],
      ["Đánh giá TB", mvSummary.avgRatingAll||0],
      ["Thể loại phổ biến", mvSummary.topGenre||""],
      ["Quốc gia hàng đầu", mvSummary.topCountry||""],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sum), "Tóm tắt");

    const genre = [["Thể loại","Số lượng"], ...genreStats.map(g=>[g.key,g.count])];
    const country = [["Quốc gia","Số lượng"], ...countryStats.map(c=>[c.key,c.count])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(genre), "Thể loại");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(country), "Quốc gia");

    const topViews = [["#","Tên","Lượt xem","Rating","Năm","QG"],
      ...topMoviesByViews.map((m,i)=>[i+1,m.title,m.viewCount||0,(m.avgRating||0).toFixed(1),m.releaseYear,m.country])];
    const topRating = [["#","Tên","Rating","Lượt đánh giá","Năm","QG"],
      ...topMoviesByRating.map((m,i)=>[i+1,m.title,(m.avgRating||0).toFixed(1),m.ratingCount||0,m.releaseYear,m.country])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topViews), "Top xem");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topRating), "Top rating");
  }

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${isRevenue?"BaoCao_DoanhThu":"BaoCao_ThongKePhim"}_${startDate}_${endDate}_${groupBy}.xlsx`
  );
};

const clientExportPDF = async (isRevenue) => {
  const jsPDFModule = await import("jspdf");
  const jsPDF = jsPDFModule.default || jsPDFModule;
  const autoTableModule = await import("jspdf-autotable");
  const autoTable = autoTableModule.default || autoTableModule;

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Try to load a TTF font that supports Vietnamese (place NotoSans-Regular.ttf in public/fonts/)
  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
    }
    return window.btoa(binary);
  };

  const loadAndRegisterFont = async () => {
    if (window.__pdfFontRegistered) return true;
    try {
      const resp = await fetch("/fonts/NotoSans-Regular.ttf");
      if (!resp.ok) throw new Error("Font not found");
      const ab = await resp.arrayBuffer();
      const b64 = arrayBufferToBase64(ab);
      // register with jsPDF VFS
      doc.addFileToVFS("NotoSans-Regular.ttf", b64);
      doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
      window.__pdfFontRegistered = true;
      return true;
    } catch (err) {
      // fallback: leave default font (may not support Vietnamese)
      console.warn("Could not load PDF font for Vietnamese; falling back to default.", err);
      return false;
    }
  };

  const fontLoaded = await loadAndRegisterFont();
  if (fontLoaded) doc.setFont("NotoSans");
  const title = isRevenue ? "BÁO CÁO DOANH THU" : "BÁO CÁO THỐNG KÊ PHIM";

  // Header
  doc.setFontSize(14); doc.text(title, 40, 40);
  doc.setFontSize(10);
  doc.text(`Khoảng: ${startDate} → ${endDate}  •  Nhóm theo: ${groupBy}`, 40, 60);

  // Tóm tắt
  const summaryRows = isRevenue
    ? [
        ["Tổng doanh thu", (revSummary.totalRevenue||0).toLocaleString("vi-VN")],
        ["Doanh thu (khoảng)", (revSummary.monthlyRevenue||0).toLocaleString("vi-VN")],
        ["Tổng giao dịch", (revSummary.totalTransactions||0).toLocaleString("vi-VN")],
        ["GD (khoảng)", (revSummary.monthlyTransactions||0).toLocaleString("vi-VN")],
        ["Hôm nay", (quickStats.todayRevenue||0).toLocaleString("vi-VN")],
        ["Tuần này", (quickStats.weekRevenue||0).toLocaleString("vi-VN")],
        ["Tăng trưởng (%)", `${Number(quickStats.growthPercent||0).toFixed(2)}%`],
        ["Gói phổ biến", quickStats.popularPackage||"—"],
      ]
    : [
        ["Tổng số phim", mvSummary.totalMovies||0],
        ["Phim lẻ", mvSummary.totalSingle||0],
        ["Phim bộ", mvSummary.totalSeries||0],
        ["Hoàn thành", mvSummary.completedCount||0],
        ["Số tập", mvSummary.totalEpisodes||0],
        ["Thêm (tháng)", mvSummary.addedThisMonth||0],
        ["Đánh giá TB", (mvSummary.avgRatingAll||0).toFixed(1)],
        ["Thể loại phổ biến", mvSummary.topGenre||"—"],
        ["Quốc gia hàng đầu", mvSummary.topCountry||"—"],
      ];
  autoTable(doc, { startY: 80, body: summaryRows, theme: "grid", styles: { fontSize: 9 } });

  // Ảnh chart (nếu cần)
  const chartRef = isRevenue ? revBarRef : mvBarRef;
  const chartY = (doc.lastAutoTable?.finalY || 100) + 15;
  try {
    const base64 = chartRef?.current?.toBase64Image?.();
    if (base64) {
      const maxW = 515; // ~ page width 595pt - margin
      const h = 180;
      doc.addImage(base64, "PNG", 40, chartY, maxW, h);
    }
  } catch {}

  // Bảng dữ liệu
  let startY = (doc.lastAutoTable?.finalY || 100) + 200;
  if (isRevenue) {
    autoTable(doc, {
      startY,
      head: [["Nhóm", "Doanh thu"]],
      body: (revChart.labels||[]).map((l,i)=>[l, (revChart.data?.[i]||0).toLocaleString("vi-VN")]),
      styles: { fontSize: 9 }, theme: "striped"
    });
    startY = (doc.lastAutoTable?.finalY || startY) + 15;

    autoTable(doc, {
      startY,
      head: [["ID","Người dùng","Gói","Số tiền","Ngày","Trạng thái"]],
      body: (txPaged.items||[]).map(tx=>[
        `#${tx.orderId}`, tx.userName, tx.packageId,
        (tx.finalAmount||0).toLocaleString("vi-VN")+"₫",
        new Date(tx.createdAt).toLocaleDateString("vi-VN"),
        tx.status
      ]),
      styles: { fontSize: 8 }, theme: "grid"
    });
  } else {
    autoTable(doc, {
      startY,
      head: [["Nhóm","Phim mới"]],
      body: (mvChart.labels||[]).map((l,i)=>[l, mvChart.data?.[i]||0]),
      styles: { fontSize: 9 }, theme: "striped"
    });
    startY = (doc.lastAutoTable?.finalY || startY) + 15;

    autoTable(doc, {
      startY,
      head: [["#","Tên","Lượt xem","Rating","Năm","QG"]],
      body: topMoviesByViews.map((m,i)=>[i+1, m.title, m.viewCount||0, (m.avgRating||0).toFixed(1), m.releaseYear, m.country]),
      styles: { fontSize: 8 }, theme: "grid"
    });
    startY = (doc.lastAutoTable?.finalY || startY) + 15;

    autoTable(doc, {
      startY,
      head: [["#","Tên","Rating","Lượt đánh giá","Năm","QG"]],
      body: topMoviesByRating.map((m,i)=>[i+1, m.title, (m.avgRating||0).toFixed(1), m.ratingCount||0, m.releaseYear, m.country]),
      styles: { fontSize: 8 }, theme: "grid"
    });
  }

  doc.save(`${isRevenue?"revenue":"movies"}_${startDate}_${endDate}_${groupBy}.pdf`);
};

  return (
    <div className="d-flex bg-light min-vh-100">
      <Sidebar />

      <div className="movie-stats-content p-3 p-lg-4">
        {/* ===== FILTER TOOLBAR ===== */}
        <div className="ap-toolbar">
          {/* Mode tabs */}
          <div className="segmented">
            <button
              type="button"
              className={mode === "REVENUE" ? "is-active" : ""}
              onClick={() => setMode("REVENUE")}
              aria-pressed={mode === "REVENUE"}
            >
              Doanh thu
            </button>
            <button
              type="button"
              className={mode === "MOVIES" ? "is-active" : ""}
              onClick={() => setMode("MOVIES")}
              aria-pressed={mode === "MOVIES"}
            >
              Phim
            </button>
          </div>

          <div className="ap-spacer" />

          {/* Right controls */}
          <div className="ap-controls">
            {/* Quick presets dropdown (tùy chọn) */}
            <select
              className="ap-quick form-select"
              defaultValue="none"
              onChange={(e) => {
                const v = e.target.value;
                if (v === "today") applyQuickPreset("today");
                if (v === "week") applyQuickPreset("thisWeek");
                if (v === "month") applyQuickPreset("thisMonth");
                e.target.value = "none";
              }}
            >
              <option value="none">Nhanh</option>
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
            </select>

            {/* Date range */}
            <div className="ap-date-range">
              <input
                type="date"
                className="ap-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="ap-sep">–</span>
              <input
                type="date"
                className="ap-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Export actions (right after date range) */}
            <div className="ap-actions d-flex gap-2">
              <button 
                className="btn btn-success btn-sm" 
                onClick={handleExportBE}
                title={mode === "REVENUE" ? "Xuất báo cáo doanh thu" : "Xuất báo cáo thống kê phim"}
              >
                <i className="fas fa-file-excel me-1" /> 
                Excel ({mode === "REVENUE" ? "Doanh thu" : "Phim"})
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={() => handleExportFE?.("pdf") }>
                <i className="fas fa-file-pdf me-1" /> PDF
              </button>
            </div>

            {/* Group by */}
            <div className="segmented small">
              <button
                type="button"
                className={groupBy === "DAY" ? "is-active" : ""}
                onClick={() => setGroupBy("DAY")}
              >
                Ngày
              </button>
              <button
                type="button"
                className={groupBy === "WEEK" ? "is-active" : ""}
                onClick={() => setGroupBy("WEEK")}
              >
                Tuần
              </button>
              <button
                type="button"
                className={groupBy === "MONTH" ? "is-active" : ""}
                onClick={() => setGroupBy("MONTH")}
              >
                Tháng
              </button>
            </div>
            
          </div>
        </div>

        {/* ===== MODE: REVENUE ===== */}
        {mode === "REVENUE" && (
          <>
            {/* Cards */}
            <div className="row g-3 mb-3">
              <div className="col-6 col-lg-3">
                <div className="revenue-card bg-primary text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-dollar-sign fa-2x"></i>
                    <div className="ms-3">
                      <div className="card-title h6">Tổng doanh thu</div>
                      <div className="h4 mb-0">
                        {revSummary.totalRevenue?.toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="revenue-card bg-success text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-chart-line fa-2x"></i>
                    <div className="ms-3">
                      <div className="card-title h6">Doanh thu (khoảng)</div>
                      <div className="h4 mb-0">
                        {revSummary.monthlyRevenue?.toLocaleString("vi-VN")}₫
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="revenue-card bg-info text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-receipt fa-2x"></i>
                    <div className="ms-3">
                      <div className="card-title h6">Tổng giao dịch</div>
                      <div className="h4 mb-0">
                        {revSummary.totalTransactions?.toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="revenue-card bg-warning text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-calendar-alt fa-2x"></i>
                    <div className="ms-3">
                      <div className="card-title h6">GD (khoảng)</div>
                      <div className="h4 mb-0">
                        {revSummary.monthlyTransactions?.toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Promotion Cards */}
            <div className="row g-3 mb-3">
              <div className="col-6 col-lg-3">
                <div className="revenue-card bg-secondary text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-users fa-2x"></i>
                    <div className="ms-3">
                      <div className="card-title h6">User dùng CTKM</div>
                      <div className="h4 mb-0">
                        {promoSummary.uniqueUsers?.toLocaleString("vi-VN") || "0"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="revenue-card bg-danger text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-ticket-alt fa-2x"></i>
                    <div className="ms-3">
                      <div className="card-title h6">Lượt dùng voucher</div>
                      <div className="h4 mb-0">
                        {promoSummary.totalRedemptions?.toLocaleString("vi-VN") || "0"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="revenue-card bg-dark text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-percentage fa-2x"></i>
                    <div className="ms-3">
                      <div className="card-title h6">Tổng giảm giá</div>
                      <div className="h4 mb-0">
                        {promoSummary.totalDiscountGranted?.toLocaleString("vi-VN") || "0"}₫
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="revenue-card bg-info text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-crown fa-2x"></i>
                    <div className="ms-3">
                      <div className="card-title h6">Voucher hot</div>
                      <div className="h4 mb-0">
                        {promoSummary.topVoucher?.voucherCode || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart + Quick stats */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-xl-8">
                <div className="card">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Biểu đồ doanh thu</h5>
                  </div>
                  <div className="card-body">
                    <Bar ref={revBarRef} data={revBar} options={baseBarOptions} height={150} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-4">
                <div className="card">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Thống kê nhanh</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Hôm nay:</span>
                      <strong>{quickStats.todayRevenue?.toLocaleString("vi-VN")}₫</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tuần này:</span>
                      <strong>{quickStats.weekRevenue?.toLocaleString("vi-VN")}₫</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Tăng trưởng:</span>
                      {renderGrowth(quickStats.growthPercent)}
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Voucher sử dụng:</span>
                      <strong>{promoSummary.totalRedemptions?.toLocaleString("vi-VN") || "0"}</strong>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between">
                      <span>Gói phổ biến:</span>
                      <strong>{quickStats.popularPackage}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions (paged) */}
            <div className="card">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Giao dịch gần đây</h5>
                <div className="d-flex align-items-center gap-2">
                  <select
                    className="form-select form-select-sm"
                    value={txSize}
                    onChange={(e) => {
                      setTxSize(+e.target.value);
                      setTxPage(1);
                    }}
                  >
                    {[5, 10, 20, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}/trang
                      </option>
                    ))}
                  </select>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={txPage <= 1}
                      onClick={() => setTxPage((p) => p - 1)}
                    >
                      «
                    </button>
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      disabled={txPage * txSize >= (txPaged.total || 0)}
                      onClick={() => setTxPage((p) => p + 1)}
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Người dùng</th>
                        <th>Gói</th>
                        <th>Số tiền</th>
                        <th>Ngày</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txPaged.items?.map((tx, idx) => (
                        <tr key={idx}>
                          <td>#{tx.orderId}</td>
                          <td>{tx.userName}</td>
                          <td>{tx.packageId}</td>
                          <td
                            className={
                              tx.status === "PAID" ? "text-success fw-bold" : "text-danger fw-bold"
                            }
                          >
                            {tx.finalAmount?.toLocaleString("vi-VN")}₫
                          </td>
                          <td>{new Date(tx.createdAt).toLocaleDateString("vi-VN")}</td>
                          <td>
                            {tx.status === "PAID" ? (
                              <span className="badge bg-success">Thành công</span>
                            ) : tx.status === "PENDING" ? (
                              <span className="badge bg-warning">Đang xử lý</span>
                            ) : (
                              <span className="badge bg-danger">Thất bại</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Promotion Summary Table */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-white">
                    <h6 className="mb-0">Top Voucher được sử dụng</h6>
                  </div>
                  <div className="card-body">
                    {voucherLeaderboard && voucherLeaderboard.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Mã Voucher</th>
                              <th>Loại</th>
                              <th>Lượt dùng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {voucherLeaderboard.map((voucher, idx) => (
                              <tr key={idx}>
                                <td><code>{voucher.voucherCode}</code></td>
                                <td>
                                  <span className="badge bg-warning">
                                    Voucher
                                  </span>
                                </td>
                                <td>{voucher.uses?.toLocaleString("vi-VN")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">Chưa có dữ liệu voucher</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-white">
                    <h6 className="mb-0">Thống kê theo dòng CTKM</h6>
                  </div>
                  <div className="card-body">
                    {promotionLineStats && promotionLineStats.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Dòng CTKM</th>
                              <th>Loại</th>
                              <th>Lượt dùng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {promotionLineStats.map((line, idx) => (
                              <tr key={idx}>
                                <td>{line.promotionLineName || "N/A"}</td>
                                <td>
                                  <span className={`badge ${line.type === 'VOUCHER' ? 'bg-warning' : 'bg-primary'}`}>
                                    {line.type === 'VOUCHER' ? 'Voucher' : 'Gói'}
                                  </span>
                                </td>
                                <td>{line.redemptions?.toLocaleString("vi-VN")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">Chưa có dữ liệu dòng khuyến mãi</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== MODE: MOVIES ===== */}
        {mode === "MOVIES" && (
          <>
            {/* Cards */}
            <div className="row g-3 mb-3">
              <div className="col-6 col-lg-3">
                <div className="movie-stats-card bg-primary text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-film fa-2x" />
                    <div className="ms-3">
                      <div className="card-title h6">Tổng số phim</div>
                      <div className="h4 mb-0">{mvSummary.totalMovies?.toLocaleString("vi-VN")}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="movie-stats-card bg-success text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-calendar-plus fa-2x" />
                    <div className="ms-3">
                      <div className="card-title h6">Thêm (khoảng)</div>
                      <div className="h4 mb-0">
                        {mvSummary.addedThisMonth?.toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="movie-stats-card bg-info text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-tv fa-2x" />
                    <div className="ms-3">
                      <div className="card-title h6">Tổng số tập</div>
                      <div className="h4 mb-0">{mvSummary.totalEpisodes?.toLocaleString("vi-VN")}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-6 col-lg-3">
                <div className="movie-stats-card bg-warning text-white">
                  <div className="card-body d-flex align-items-center">
                    <i className="fas fa-star fa-2x" />
                    <div className="ms-3">
                      <div className="card-title h6">Đánh giá TB</div>
                      <div className="h4 mb-0">{(mvSummary.avgRatingAll || 0).toFixed(1)}/5</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* New movies chart + quick stats */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-lg-8">
                <div className="card">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Phim mới</h5>
                  </div>
                  <div className="card-body">
                    <Bar ref={mvBarRef} data={mvBar} options={baseBarOptions} />
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <div className="card">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Thống kê nhanh</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Phim lẻ:</span>
                      <strong className="text-primary">
                        {mvSummary.totalSingle?.toLocaleString("vi-VN")}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Phim bộ:</span>
                      <strong className="text-info">
                        {mvSummary.totalSeries?.toLocaleString("vi-VN")}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Hoàn thành:</span>
                      <strong className="text-success">
                        {mvSummary.completedCount?.toLocaleString("vi-VN")}
                      </strong>
                    </div>
                    <hr />
                    <div className="d-flex justify-content-between mb-2">
                      <span>Thể loại phổ biến:</span>
                      <strong>{mvSummary.topGenre}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Quốc gia hàng đầu:</span>
                      <strong>{mvSummary.topCountry}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* status/type/genre */}
            <div className="row g-3">
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Trạng thái</h5>
                  </div>
                  <div className="card-body d-flex justify-content-center">
                    <div style={{ height: 200, width: 200 }}>
                      <Pie data={pieStatus} options={basePieOptions} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6 col-lg-4">
                <div className="card">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Loại phim</h5>
                  </div>
                  <div className="card-body d-flex justify-content-center">
                    <div style={{ height: 200, width: 200 }}>
                      <Doughnut data={doughnutType} options={basePieOptions} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <div className="card">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Top thể loại</h5>
                  </div>
                  <div className="card-body">
                    <Bar data={barGenre} options={baseBarOptions} />
                  </div>
                </div>
              </div>
            </div>

            {/* Top tables */}
            <div className="row g-3 mt-1">
              <div className="col-12 col-xl-6">
                <div className="card">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Top theo lượt xem</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Tên phim</th>
                            <th className="text-center">Lượt xem</th>
                            <th className="text-center">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topMoviesByViews.map((m, i) => (
                            <tr key={m.movieId}>
                              <td className="text-center">{i + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {m.thumbnailUrl && (
                                    <img
                                      src={m.thumbnailUrl}
                                      alt={m.title}
                                      className="me-2 rounded"
                                      style={{ width: 40, height: 60, objectFit: "cover" }}
                                    />
                                  )}
                                  <div>
                                    <div className="fw-semibold">{m.title}</div>
                                    <small className="text-muted">
                                      {m.country} • {m.releaseYear}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="text-success fw-bold text-center">
                                {m.viewCount?.toLocaleString("vi-VN") || 0}
                              </td>
                              <td className="text-center">
                                <span className="text-warning">
                                  <i className="fas fa-star"></i> {m.avgRating?.toFixed(1) || 0}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-xl-6">
                <div className="card">
                  <div className="card-header bg-white">
                    <h5 className="mb-0">Top theo đánh giá</h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>#</th>
                            <th>Tên phim</th>
                            <th className="text-center">Rating</th>
                            <th className="text-center">Lượt đánh giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topMoviesByRating.map((m, i) => (
                            <tr key={m.movieId}>
                              <td className="text-center">{i + 1}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {m.thumbnailUrl && (
                                    <img
                                      src={m.thumbnailUrl}
                                      alt={m.title}
                                      className="me-2 rounded"
                                      style={{ width: 40, height: 60, objectFit: "cover" }}
                                    />
                                  )}
                                  <div>
                                    <div className="fw-semibold">{m.title}</div>
                                    <small className="text-muted">
                                      {m.country} • {m.releaseYear}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td className="text-center">
                                <span className="text-warning fw-bold">
                                  <i className="fas fa-star"></i> {m.avgRating?.toFixed(1) || 0}
                                </span>
                              </td>
                              <td className="text-info text-center">
                                {m.ratingCount?.toLocaleString("vi-VN") || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
