import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import "../../css/admin/MovieStatsPage.css";
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
import RevenueService from "../../services/DataAnalyzerSerivce";
import ReportExportService from "../../services/ReportExportService";
import { toast } from "react-toastify";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const MovieStatsPage = () => {
    const [filter, setFilter] = useState("month");
    const [selectedMonth, setSelectedMonth] = useState("2025-09");
    const [selectedYear, setSelectedYear] = useState("2025");
    const [chartData, setChartData] = useState({ labels: [], data: [] });

    const [movieSummary, setMovieSummary] = useState({
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
        topByRating: null
    });

    const [genreStats, setGenreStats] = useState([]);
    const [countryStats, setCountryStats] = useState([]);
    const [statusStats, setStatusStats] = useState([]);
    const [typeStats, setTypeStats] = useState([]);
    const [topMoviesByViews, setTopMoviesByViews] = useState([]);
    const [topMoviesByRating, setTopMoviesByRating] = useState([]);
    const [isExporting, setIsExporting] = useState(false);

    // Hàm xuất báo cáo PDF
    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            const result = await ReportExportService.exportToPDF(
                movieSummary,
                chartData,
                {
                    views: topMoviesByViews,
                    rating: topMoviesByRating
                }
            );
            
            if (result.success) {
                toast.success(`Xuất PDF thành công: ${result.fileName}`);
            } else {
                toast.error(`Lỗi xuất PDF: ${result.error}`);
            }
        } catch (error) {
            toast.error("Lỗi không xác định khi xuất PDF");
        } finally {
            setIsExporting(false);
        }
    };

    // Hàm xuất báo cáo Excel
    const handleExportExcel = async () => {
        setIsExporting(true);
        try {
            const result = ReportExportService.exportToExcel(
                movieSummary,
                genreStats,
                countryStats,
                {
                    views: topMoviesByViews,
                    rating: topMoviesByRating
                }
            );
            
            if (result.success) {
                toast.success(`Xuất Excel thành công: ${result.fileName}`);
            } else {
                toast.error(`Lỗi xuất Excel: ${result.error}`);
            }
        } catch (error) {
            toast.error("Lỗi không xác định khi xuất Excel");
        } finally {
            setIsExporting(false);
        }
    };

    // Hàm xuất CSV
    const handleExportCSV = async () => {
        setIsExporting(true);
        try {
            const result = ReportExportService.exportToCSV({
                views: topMoviesByViews,
                rating: topMoviesByRating
            });
            
            if (result.success) {
                toast.success(`Xuất CSV thành công: ${result.fileName}`);
            } else {
                toast.error(`Lỗi xuất CSV: ${result.error}`);
            }
        } catch (error) {
            toast.error("Lỗi không xác định khi xuất CSV");
        } finally {
            setIsExporting(false);
        }
    };

    // Fetch movie summary
    useEffect(() => {
        const [y, m] = selectedMonth.split("-");
        RevenueService.getMovieSummary(Number(y), Number(m))
            .then((res) => {
                setMovieSummary(res.data);
            })
            .catch((err) => console.error("Error fetching movie summary:", err));
    }, [selectedMonth]);

    // Fetch chart data for new movies
    useEffect(() => {
        if (filter === "day") {
            const [y, m] = selectedMonth.split("-");
            RevenueService.getNewMoviesByDay(Number(y), Number(m))
                .then((res) => setChartData(res.data))
                .catch((err) => console.error(err));
        } else if (filter === "month") {
            RevenueService.getNewMoviesByMonth(Number(selectedYear))
                .then((res) => setChartData(res.data))
                .catch((err) => console.error(err));
        }
    }, [filter, selectedMonth, selectedYear]);

    // Fetch additional stats
    useEffect(() => {
        // Genre stats
        RevenueService.getCountByGenre(10)
            .then((res) => setGenreStats(res.data))
            .catch((err) => console.error(err));

        // Country stats
        RevenueService.getCountByCountry(10)
            .then((res) => setCountryStats(res.data))
            .catch((err) => console.error(err));

        // Status breakdown
        RevenueService.getStatusBreakdown()
            .then((res) => setStatusStats(res.data))
            .catch((err) => console.error(err));

        // Type breakdown
        RevenueService.getTypeBreakdown()
            .then((res) => setTypeStats(res.data))
            .catch((err) => console.error(err));

        // Top movies by views
        RevenueService.getTopByViews(5)
            .then((res) => setTopMoviesByViews(res.data))
            .catch((err) => console.error(err));

        // Top movies by rating
        RevenueService.getTopByRating(5, 5)
            .then((res) => setTopMoviesByRating(res.data))
            .catch((err) => console.error(err));
    }, []);

    // Chart configurations
    const newMoviesChartConfig = {
        labels: chartData.labels || [],
        datasets: [
            {
                label: filter === "day" 
                    ? `Phim mới các ngày - ${selectedMonth}`
                    : `Phim mới các tháng - ${selectedYear}`,
                data: chartData.data || [],
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    };

    const statusChartConfig = {
        labels: statusStats.map(item => item.key === "COMPLETED" ? "Hoàn thành" : "Sắp ra mắt"),
        datasets: [
            {
                data: statusStats.map(item => item.count),
                backgroundColor: ["#28a745", "#ffc107"],
                borderWidth: 2,
            },
        ],
    };

    const typeChartConfig = {
        labels: typeStats.map(item => item.key === "SINGLE" ? "Phim lẻ" : "Phim bộ"),
        datasets: [
            {
                data: typeStats.map(item => item.count),
                backgroundColor: ["#007bff", "#6f42c1"],
                borderWidth: 2,
            },
        ],
    };

    const genreChartConfig = {
        labels: genreStats.slice(0, 8).map(item => item.key),
        datasets: [
            {
                label: "Số lượng phim",
                data: genreStats.slice(0, 8).map(item => item.count),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
                borderRadius: 6,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: "top",
                labels: {
                    font: {
                        size: 12
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    font: {
                        size: 11
                    }
                }
            },
            x: {
                ticks: {
                    font: {
                        size: 11
                    }
                }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                position: "bottom",
                labels: {
                    font: {
                        size: 12
                    },
                    padding: 15
                }
            },
        },
    };

    return (
        <div className="d-flex bg-light min-vh-100">
            <Sidebar />
            <div className="movie-stats-content flex-grow-1">
                <div className="container-fluid">
                    <div className="movie-stats-header d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                        <h2 className="mb-3 mb-md-0 fw-bold text-dark">THỐNG KÊ PHIM</h2>

                        <div className="d-flex flex-column flex-lg-row gap-3 align-items-stretch align-items-lg-center">
                            {/* Export buttons */}
                            <div className="btn-group" role="group">
                                <button 
                                    type="button" 
                                    className="btn btn-outline-success btn-sm"
                                    onClick={handleExportExcel}
                                    disabled={isExporting}
                                >
                                    <i className="fas fa-file-excel me-1"></i>
                                    {isExporting ? 'Đang xuất...' : 'Excel'}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                >
                                    <i className="fas fa-file-pdf me-1"></i>
                                    {isExporting ? 'Đang xuất...' : 'PDF'}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-outline-info btn-sm"
                                    onClick={handleExportCSV}
                                    disabled={isExporting}
                                >
                                    <i className="fas fa-file-csv me-1"></i>
                                    CSV
                                </button>
                            </div>

                            {/* Bộ lọc và date picker */}
                            <div className="d-flex flex-column flex-sm-row gap-2 align-items-stretch align-items-sm-center">
                                <select
                                    className="form-select"
                                    style={{ minWidth: '150px' }}
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="day">Theo ngày</option>
                                    <option value="month">Theo tháng</option>
                                </select>

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
                    </div>

                    {/* Cards thống kê tổng quan */}
                    <div className="row g-3 mb-4">
                        <div className="col-6 col-md-3">
                            <div className="movie-stats-card bg-primary text-white h-100">
                                <div className="card-body p-3 d-flex align-items-center">
                                    <i className="fas fa-film fa-2x"></i>
                                    <div className="ms-3">
                                        <div className="card-title h6 mb-1">Tổng số phim</div>
                                        <div className="card-value h4 mb-0">
                                            {movieSummary.totalMovies.toLocaleString("vi-VN")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-md-3">
                            <div className="movie-stats-card bg-success text-white h-100">
                                <div className="card-body p-3 d-flex align-items-center">
                                    <i className="fas fa-calendar-plus fa-2x"></i>
                                    <div className="ms-3">
                                        <div className="card-title h6 mb-1">Thêm tháng này</div>
                                        <div className="card-value h4 mb-0">
                                            {movieSummary.addedThisMonth.toLocaleString("vi-VN")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-md-3">
                            <div className="movie-stats-card bg-info text-white h-100">
                                <div className="card-body p-3 d-flex align-items-center">
                                    <i className="fas fa-tv fa-2x"></i>
                                    <div className="ms-3">
                                        <div className="card-title h6 mb-1">Tổng số tập</div>
                                        <div className="card-value h4 mb-0">
                                            {movieSummary.totalEpisodes.toLocaleString("vi-VN")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-md-3">
                            <div className="movie-stats-card bg-warning text-white h-100">
                                <div className="card-body p-3 d-flex align-items-center">
                                    <i className="fas fa-star fa-2x"></i>
                                    <div className="ms-3">
                                        <div className="card-title h6 mb-1">Đánh giá TB</div>
                                        <div className="card-value h4 mb-0">
                                            {movieSummary.avgRatingAll.toFixed(1)}/5
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts row 1: New Movies + Quick Stats */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-lg-8">
                            <div className="card h-100">
                                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">
                                        Biểu đồ phim mới
                                        {filter === "day" && (
                                            <small className="text-muted d-block">Tháng {selectedMonth}</small>
                                        )}
                                        {filter === "month" && (
                                            <small className="text-muted d-block">Năm {selectedYear}</small>
                                        )}
                                    </h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '300px' }}>
                                        <Bar data={newMoviesChartConfig} options={chartOptions} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-lg-4">
                            <div className="card h-100">
                                <div className="card-header bg-white">
                                    <h5 className="card-title mb-0">Thống kê nhanh</h5>
                                </div>
                                <div className="card-body">
                                    <div className="quick-stats">
                                        <div className="stat-item d-flex justify-content-between mb-3">
                                            <span>Phim lẻ:</span>
                                            <strong className="text-primary">{movieSummary.totalSingle.toLocaleString("vi-VN")}</strong>
                                        </div>
                                        <div className="stat-item d-flex justify-content-between mb-3">
                                            <span>Phim bộ:</span>
                                            <strong className="text-info">{movieSummary.totalSeries.toLocaleString("vi-VN")}</strong>
                                        </div>
                                        <div className="stat-item d-flex justify-content-between mb-3">
                                            <span>Hoàn thành:</span>
                                            <strong className="text-success">{movieSummary.completedCount.toLocaleString("vi-VN")}</strong>
                                        </div>
                                        <div className="stat-item d-flex justify-content-between mb-3">
                                            <span>Thêm hôm nay:</span>
                                            <strong className="text-warning">{movieSummary.addedToday.toLocaleString("vi-VN")}</strong>
                                        </div>
                                        <hr />
                                        <div className="stat-item d-flex justify-content-between mb-2">
                                            <span>Thể loại phổ biến:</span>
                                            <strong>{movieSummary.topGenre}</strong>
                                        </div>
                                        <div className="stat-item d-flex justify-content-between">
                                            <span>Quốc gia hàng đầu:</span>
                                            <strong>{movieSummary.topCountry}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts row 2: Status + Type + Genre */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="card h-100">
                                <div className="card-header bg-white">
                                    <h5 className="card-title mb-0">Phân bố trạng thái</h5>
                                </div>
                                <div className="card-body d-flex justify-content-center">
                                    <div style={{ height: '200px', width: '200px' }}>
                                        <Pie data={statusChartConfig} options={pieOptions} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-6 col-lg-4">
                            <div className="card h-100">
                                <div className="card-header bg-white">
                                    <h5 className="card-title mb-0">Phân bố loại phim</h5>
                                </div>
                                <div className="card-body d-flex justify-content-center">
                                    <div style={{ height: '200px', width: '200px' }}>
                                        <Doughnut data={typeChartConfig} options={pieOptions} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-lg-4">
                            <div className="card h-100">
                                <div className="card-header bg-white">
                                    <h5 className="card-title mb-0">Top thể loại</h5>
                                </div>
                                <div className="card-body">
                                    <div style={{ height: '200px' }}>
                                        <Bar data={genreChartConfig} options={chartOptions} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Movies Tables */}
                    <div className="row g-3">
                        <div className="col-12 col-xl-6">
                            <div className="card">
                                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Top phim theo lượt xem</h5>
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
                                                {topMoviesByViews.map((movie, index) => (
                                                    <tr key={movie.movieId}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                {movie.thumbnailUrl && (
                                                                    <img 
                                                                        src={movie.thumbnailUrl} 
                                                                        alt={movie.title}
                                                                        className="me-2 rounded"
                                                                        style={{width: '40px', height: '60px', objectFit: 'cover'}}
                                                                    />
                                                                )}
                                                                <div>
                                                                    <div className="fw-semibold">{movie.title}</div>
                                                                    <small className="text-muted">{movie.country} • {movie.releaseYear}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-success fw-bold text-center">{movie.viewCount?.toLocaleString("vi-VN") || 0}</td>
                                                        <td className="text-center">
                                                            <span className="text-warning">
                                                                <i className="fas fa-star"></i> {movie.avgRating?.toFixed(1) || 0}
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
                                <div className="card-header bg-white d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Top phim theo đánh giá</h5>
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
                                                {topMoviesByRating.map((movie, index) => (
                                                    <tr key={movie.movieId}>
                                                        <td className="text-center">{index + 1}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                {movie.thumbnailUrl && (
                                                                    <img 
                                                                        src={movie.thumbnailUrl} 
                                                                        alt={movie.title}
                                                                        className="me-2 rounded"
                                                                        style={{width: '40px', height: '60px', objectFit: 'cover'}}
                                                                    />
                                                                )}
                                                                <div>
                                                                    <div className="fw-semibold">{movie.title}</div>
                                                                    <small className="text-muted">{movie.country} • {movie.releaseYear}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="text-warning fw-bold">
                                                                <i className="fas fa-star"></i> {movie.avgRating?.toFixed(1) || 0}
                                                            </span>
                                                        </td>
                                                        <td className="text-info text-center">{movie.ratingCount?.toLocaleString("vi-VN") || 0}</td>
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
        </div>
    );
};

export default MovieStatsPage;