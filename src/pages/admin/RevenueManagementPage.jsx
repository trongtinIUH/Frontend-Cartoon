import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "../../css/admin/RevenueManagementPage.css";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import RevenueService from "../../services/DataAnalyzerSerivce";
import ExportService from "../../services/ExportService";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RevenueManagementPage = () => {
    const [filter, setFilter] = useState("month");
    const [selectedMonth, setSelectedMonth] = useState("2025-09");
    const [selectedYear, setSelectedYear] = useState("2025");
    const [chartData, setChartData] = useState({ labels: [], data: [] });
    const [recentTransactions, setRecentTransactions] = useState([]);

    const [revenueData, setRevenueData] = useState({
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

    // Fetch quick stats
    useEffect(() => {
        RevenueService.getQuickStats()
            .then((res) => {
                setQuickStats(res.data);
            })
            .catch((err) => console.error(err));
    }, []);


    // Fetch chart data
    useEffect(() => {
        if (filter === "day") {
            const [y, m] = selectedMonth.split("-");
            RevenueService.getRevenueByDay(Number(y), Number(m))
                .then((res) => setChartData(res.data))
                .catch((err) => console.error(err));
        } else if (filter === "month") {
            RevenueService.getRevenueByMonth(Number(selectedYear))
                .then((res) => setChartData(res.data))
                .catch((err) => console.error(err));
        } else {
            RevenueService.getRevenueByYear(2021, new Date().getFullYear())
                .then((res) => setChartData(res.data))
                .catch((err) => console.error(err));
        }
    }, [filter, selectedMonth, selectedYear]);

    // Fetch summary data (cho 4 card)
    useEffect(() => {
        RevenueService.getSummary()
            .then((res) => setRevenueData(res.data))
            .catch((err) => console.error(err));
    }, []);

    const chartConfig = {
        labels: chartData.labels || [],
        datasets: [
            {
                label:
                    filter === "day"
                        ? `Doanh thu các ngày - ${selectedMonth}`
                        : filter === "month"
                            ? `Doanh thu các tháng - ${selectedYear}`
                            : "Doanh thu theo năm",
                data: chartData.data || [],
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: "top" },
        },
    };

    useEffect(() => {
        RevenueService.getRecentTransactions()
            .then((res) => setRecentTransactions(res.data))
            .catch((err) => console.error(err));
    }, []);

    const handleExportDashboard = () => {
        ExportService.exportRevenueReport()
            .then((res) => {
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", "dashboard_report.xlsx");
                document.body.appendChild(link);
                link.click();
                link.remove();
            })
            .catch((err) => {
                console.error("Export error:", err);
                alert("Xuất báo cáo thất bại!");
            });
    };

    return (
        <div className="d-flex flex-column flex-lg-row bg-light min-vh-100">
            <Sidebar />
            <div className="revenue-content flex-grow-1">
                <div className="revenue-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                    <h2 className="mb-3 mb-md-0 fw-bold text-dark">QUẢN LÝ DOANH THU</h2>
                    {/* Bộ lọc và date picker */}
                    <div className="d-flex flex-column flex-md-row gap-2 align-items-stretch align-items-md-center">
                        <select
                            className="form-select"
                            style={{ minWidth: '150px' }}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        >
                            <option value="day">Theo ngày</option>
                            <option value="month">Theo tháng</option>
                            <option value="year">Theo năm</option>
                        </select>

                        {/* Date picker tùy theo filter */}
                        {filter === "day" && (
                            <input
                                type="month"
                                className="form-control"
                                style={{ minWidth: '150px' }}
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            />
                        )}

                        {filter === "month" && (
                            <select
                                className="form-select"
                                style={{ minWidth: '100px' }}
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="2025">2025</option>
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                                <option value="2022">2022</option>
                                <option value="2021">2021</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Cards thống kê */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-sm-6 col-lg-3">
                        <div className="revenue-card bg-primary text-white">
                            <div className="card-body p-3 d-flex align-items-center">
                                <i className="fas fa-dollar-sign fa-2x"></i>
                                <div className="ms-3">
                                    <div className="card-title h6 mb-1">Tổng doanh thu</div>
                                    <div className="card-value h4 mb-0">
                                        {revenueData.totalRevenue.toLocaleString("vi-VN")}₫
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                        <div className="revenue-card bg-success text-white">
                            <div className="card-body p-3 d-flex align-items-center">
                                <i className="fas fa-chart-line fa-2x"></i>
                                <div className="ms-3">
                                    <div className="card-title h6 mb-1">Doanh thu tháng</div>
                                    <div className="card-value h4 mb-0">
                                        {revenueData.monthlyRevenue.toLocaleString("vi-VN")}₫
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                        <div className="revenue-card bg-info text-white">
                            <div className="card-body p-3 d-flex align-items-center">
                                <i className="fas fa-receipt fa-2x"></i>
                                <div className="ms-3">
                                    <div className="card-title h6 mb-1">Tổng giao dịch</div>
                                    <div className="card-value h4 mb-0">
                                        {revenueData.totalTransactions.toLocaleString("vi-VN")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-sm-6 col-lg-3">
                        <div className="revenue-card bg-warning text-white">
                            <div className="card-body p-3 d-flex align-items-center">
                                <i className="fas fa-calendar-alt fa-2x"></i>
                                <div className="ms-3">
                                    <div className="card-title h6 mb-1">GD tháng này</div>
                                    <div className="card-value h4 mb-0">
                                        {revenueData.monthlyTransactions.toLocaleString("vi-VN")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Chart + Quick Stats */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-xl-8">
                        <div className="card">
                            <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    Biểu đồ doanh thu
                                    {filter === "day" && (
                                        <small className="text-muted d-block">Tháng {selectedMonth}</small>
                                    )}
                                    {filter === "month" && (
                                        <small className="text-muted d-block">Năm {selectedYear}</small>
                                    )}
                                </h5>
                                <span className="text-muted small">
                                    {filter === "day"
                                        ? `Các ngày trong tháng`
                                        : filter === "month"
                                            ? `12 tháng của năm`
                                            : `5 năm gần đây`}
                                </span>
                            </div>
                            <div className="card-body">
                                <Bar data={chartConfig} options={chartOptions} height={150} />
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-xl-4">
                        <div className="card">
                            <div className="card-header bg-white">
                                <h5 className="card-title mb-0">Thống kê nhanh</h5>
                            </div>
                            <div className="card-body">
                                <div className="quick-stats">
                                    <div className="stat-item d-flex justify-content-between mb-3">
                                        <span>Doanh thu hôm nay:</span>
                                        <strong className="text-success">{quickStats.todayRevenue.toLocaleString("vi-VN")}₫</strong>
                                    </div>
                                    <div className="stat-item d-flex justify-content-between mb-3">
                                        <span>Doanh thu tuần:</span>
                                        <strong className="text-info">{quickStats.weekRevenue.toLocaleString("vi-VN")}₫</strong>
                                    </div>
                                    <div className="stat-item d-flex justify-content-between mb-3">
                                        <span>Tăng trưởng:</span>
                                        <strong className="text-warning">{quickStats.growthPercent}%</strong>
                                    </div>
                                    <hr />
                                    <div className="stat-item d-flex justify-content-between">
                                        <span>Gói phổ biến nhất:</span>
                                        <strong>{quickStats.popularPackage}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="d-grid mt-3" onClick={handleExportDashboard}>
                            <button className="btn btn-outline-primary btn-sm">
                                <i className="fas fa-download me-1"></i> Xuất báo cáo
                            </button>
                        </div>
                    </div>
                </div>
                {/* Recent Transactions */}
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">Giao dịch gần đây</h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>ID</th>
                                                <th>Người dùng</th>
                                                <th>Gói dịch vụ</th>
                                                <th>Số tiền</th>
                                                <th>Ngày</th>
                                                <th>Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentTransactions.map((tx, idx) => (
                                                <tr key={idx}>
                                                    <td>#{tx.orderId}</td>
                                                    <td>{tx.userName}</td>
                                                    <td>{tx.packageId}</td>
                                                    <td className={tx.status === "PAID" ? "text-success fw-bold" : "text-danger fw-bold"}>
                                                        {tx.finalAmount.toLocaleString("vi-VN")}₫
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RevenueManagementPage;
