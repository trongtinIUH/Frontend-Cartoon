import React, { useEffect, useMemo, useState, Suspense, useCallback  } from "react";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-toastify";
import { FaPlus, FaSearch, FaSync, FaTrash, FaEdit, FaListUl, FaFilm, FaExclamationTriangle } from "react-icons/fa";
import MovieService from "../../services/MovieService";
import ReportService from "../../services/ReportService";
import IssueReportsModal from "../../models/IssueReportsModal";
import { IssueReportButton } from "../../components/IssueStatusIcon";
// import { testReportFlow } from "../../utils/testReportFlow";
import "../../css/admin/admin-movie.css";

// ✅ modal rời (đặt ở src/models)
const ModelAddMovie = React.lazy(() => import("../../models/ModelAddMovie"));
const ModelUpdateMovie = React.lazy(() => import("../../models/ModelUpdateMovie"));
const ModelAddNewEpisode = React.lazy(() => import("../../models/ModelAddNewEpisode"));


const defaultFilters = { status: "", movieType: "", year: "", genre: "" };


const statusBadge = (status) => {
  const map = { UPCOMING: "warning", COMPLETED: "primary" };
  const label = status || "UPCOMING";
  return <span className={`badge bg-${map[label] || "secondary"}`}>{label}</span>;
};

export default function MovieManagementPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [issueCounts, setIssueCounts] = useState({}); // Track số lượng báo lỗi theo movieId
  const [issueStatistics, setIssueStatistics] = useState({}); // Track trạng thái báo lỗi theo movieId

  // UI states
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState(defaultFilters);
  const [selected, setSelected] = useState(new Set());

  // Modal states
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [openEpisodeFor, setOpenEpisodeFor] = useState(null);
  const [issueReportsFor, setIssueReportsFor] = useState(null);


useEffect(() => {
  const onKey = (e) => {
    if (e.key === "Escape") setKeyword("");               // ESC: clear search
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "r") {
      e.preventDefault();
      resetAll(true);                                      // Ctrl/⌘+Shift+R: reset tất cả + reload
    }
  };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, []);

// 🔧 Debug utilities disabled
// useEffect(() => {
//   window.testReportFlow = testReportFlow;
//   console.log("🛠️ Debug available: window.testReportFlow('movieId')");
// }, []);

const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await MovieService.getAllMovies();
      const movieList = Array.isArray(data) ? data : [];
      setMovies(movieList);
      
      // Load issue counts và statistics cho từng phim
      loadIssueData(movieList);
    } catch {
      toast.error("Không tải được danh sách phim");
    } finally { setLoading(false); }
  }, []);

  const loadIssueData = async (movieList) => {
    const counts = {};
    const statistics = {};
    
    try {
      // Extract movie IDs
      const movieIds = movieList.map(movie => movie.movieId || movie.id);
      
      // Load statistics for all movies at once
      const moviesStats = await ReportService.getMoviesIssueStatistics(movieIds);
      
      // Process results
      movieList.forEach(movie => {
        const movieId = movie.movieId || movie.id;
        const stats = moviesStats[movieId];
        
        if (stats) {
          counts[movieId] = stats.total;
          statistics[movieId] = {
            statuses: stats.statuses,
            statusCounts: stats.statusCounts,
            hasOpenIssues: stats.hasOpenIssues,
            hasInProgressIssues: stats.hasInProgressIssues,
            hasResolvedIssues: stats.hasResolvedIssues,
            hasInvalidIssues: stats.hasInvalidIssues
          };
        } else {
          counts[movieId] = 0;
          statistics[movieId] = {
            statuses: [],
            statusCounts: {},
            hasOpenIssues: false,
            hasInProgressIssues: false,
            hasResolvedIssues: false,
            hasInvalidIssues: false
          };
        }
      });
      
      setIssueCounts(counts);
      setIssueStatistics(statistics);
      
    } catch (error) {
      console.error('Error loading issue data:', error);
      toast.error('Không thể tải thông tin báo lỗi');
    }
  };

  // Legacy method - keeping for backward compatibility
  const loadIssueCounts = async (movieList) => {
    await loadIssueData(movieList);
  };
  
  useEffect(() => { load(); }, []);
  
const resetAll = useCallback((reload = false) => {
    setKeyword("");
    setFilters(defaultFilters);
    setSelected(new Set());
    if (reload) load();
  }, [load]);

  // filter giống giao diện 2 (search + dropdown…)
  const filtered = useMemo(() => {
    return (movies || [])
      .filter((m) => !keyword || (m.title || "").toLowerCase().includes(keyword.toLowerCase()))
      .filter((m) => !filters.status || m.status === filters.status)
      .filter((m) => !filters.movieType || m.movieType === filters.movieType)
      .filter((m) => !filters.year || String(m.releaseYear) === String(filters.year))
      .filter((m) => !filters.genre || (m.genres || []).includes(filters.genre));
  }, [movies, keyword, filters]);

  // select & bulk delete
  const allChecked = filtered.length > 0 && filtered.every(m => selected.has(m.movieId || m.id));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filtered.map(m => m.movieId || m.id)));
  };
  const toggleOne = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const handleDeleteSelected = async (preset) => {
    const ids = preset instanceof Set ? Array.from(preset) : Array.from(selected);
    if (!ids.length) return;
    if (!window.confirm(`Xác nhận xoá ${ids.length} phim?`)) return;
    try {
      await MovieService.deleteMovies(ids);
      toast.success("Đã xoá");
      setSelected(new Set());
      load();
    } catch { toast.error("Không thể xoá"); }
  };

  const handleOpenIssueReports = async (movie) => {
    const movieId = movie.movieId || movie.id;
    setIssueReportsFor({
      movieId: movieId,
      movieTitle: movie.title
    });
    
    // Refresh issue data cho phim này
    try {
      const moviesStats = await ReportService.getMoviesIssueStatistics([movieId]);
      const stats = moviesStats[movieId];
      
      if (stats) {
        setIssueCounts(prev => ({
          ...prev,
          [movieId]: stats.total
        }));
        
        setIssueStatistics(prev => ({
          ...prev,
          [movieId]: {
            statuses: stats.statuses,
            statusCounts: stats.statusCounts,
            hasOpenIssues: stats.hasOpenIssues,
            hasInProgressIssues: stats.hasInProgressIssues,
            hasResolvedIssues: stats.hasResolvedIssues,
            hasInvalidIssues: stats.hasInvalidIssues
          }
        }));
      }
    } catch (error) {
      console.error('Error refreshing issue data:', error);
    }
  };

  const handleIssueModalClose = () => {
    const movieId = issueReportsFor?.movieId;
    setIssueReportsFor(null);
    
    // Reload issue data when modal closes (in case statuses were updated)
    if (movieId) {
      loadIssueData([{ movieId: movieId }]);
    }
  };

  return (
    <div className="d-flex bg-white min-vh-100">
      <Sidebar />
      <div className="flex-grow-1 p-4" style={{ marginLeft: 250 }}>
        {/* ===== HEADER đẹp (quick stat + refresh) ===== */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1">QUẢN LÝ PHIM</h2>
            <div className="text-muted">Quản trị danh mục phim, tập, thông tin…</div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="stat-card">
              <div className="d-flex align-items-center gap-2">
                <FaFilm /> <span className="small text-muted">Tổng số</span>
                <span className="badge bg-dark ms-1">{movies.length}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="d-flex align-items-center gap-2">
                <FaExclamationTriangle className="text-warning" /> 
                <span className="small text-muted">Báo lỗi</span>
                <span className="badge bg-warning ms-1">
                  {Object.values(issueCounts).reduce((sum, count) => sum + count, 0)}
                </span>
              </div>
            </div>
            <button className="btn btn-outline-secondary"  onClick={() => resetAll(true)}>
            <FaSync className={`me-1`} />Làm mới
            </button>
          </div>
        </div>

        {/* ===== TOOLBAR (search + filter + thêm mới) – giống hình 2 ===== */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-4">
                <label className="form-label">Tìm kiếm</label>
                <div className="input-group">
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    type="search"
                    className="form-control"
                    placeholder="Tìm theo tiêu đề…"
                  />
                  <span className="input-group-text"><FaSearch /></span>
                </div>
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label">Trạng thái</label>
                <select className="form-select" value={filters.status}
                        onChange={(e)=>setFilters(s=>({...s,status:e.target.value}))}>
                  <option value="">Tất cả</option>
                  <option value="UPCOMING">UPCOMING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label">Loại</label>
                <select className="form-select" value={filters.movieType}
                        onChange={(e)=>setFilters(s=>({...s,movieType:e.target.value}))}>
                  <option value="">Tất cả</option>
                  <option value="SINGLE">SINGLE</option>
                  <option value="SERIES">SERIES</option>
                </select>
              </div>
              <div className="col-6 col-lg-2">
                <label className="form-label">Năm</label>
                <input className="form-control" type="number" placeholder="VD: 2025"
                       value={filters.year} onChange={(e)=>setFilters(s=>({...s,year:e.target.value}))}/>
              </div>
              <div className="col-6 col-lg-2 d-grid">
                <label className="form-label invisible">.</label>
                <button className="btn btn-gradient" onClick={()=>setOpenAdd(true)}>
                  <FaPlus className="me-2"/> Thêm mới
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== BULK SELECTION BAR ===== */}
        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body py-2">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="selectAll"
                    checked={allChecked} 
                    onChange={toggleAll}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="selectAll">
                    Chọn tất cả
                  </label>
                </div>
                {selected.size > 0 && (
                  <div className="text-muted small">
                    <i className="fas fa-check-circle text-success me-1"></i>
                    Đã chọn {selected.size} phim
                  </div>
                )}
              </div>
              
              <div className="d-flex align-items-center gap-2">
                {selected.size > 0 && (
                  <>
                    <button 
                      className="btn btn-sm btn-outline-secondary text-nowrap" 
                      onClick={() => setSelected(new Set())}
                    >
                      <i className="fas fa-times me-1 "></i>
                      Bỏ chọn
                    </button>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={handleDeleteSelected}
                    >
                      <FaTrash className="me-1"/> 
                      Xoá ({selected.size})
                    </button>
                  </>
                )}
                {selected.size === 0 && (
                  <span className="text-muted small">
                    Chọn phim để thực hiện thao tác hàng loạt
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABLE (sáng sủa giống hình 2) ===== */}
        <div className="card border-0 shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{width:42}}></th>
                  <th>#</th>
                  <th>Tiêu đề</th>
                  <th>Thể loại</th>
                  <th>Năm</th>
                  <th>Loại</th>
                  <th>Trạng thái</th>
                  <th style={{width: 280}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => {
                  const id = m.movieId ;
                  return (
                    <tr key={id}>
                      <td>
                        <input type="checkbox" className="form-check-input"
                               checked={selected.has(id)} onChange={()=>toggleOne(id)}/>
                      </td>
                      <td>{idx + 1}</td>
                      <td className="fw-semibold">
                        <div className="d-flex align-items-center gap-2">
                          {m.thumbnailUrl && (
                            <img src={m.thumbnailUrl} alt="thumb"
                                 style={{width:34,height:48,objectFit:"cover",borderRadius:4}}/>
                          )}
                          <span>{m.title}</span>
                        </div>
                      </td>
                      <td className="text-nowrap small text-muted">{(m.genres||[]).slice(0,3).join(", ")}</td>
                      <td>{m.releaseYear || "-"}</td>
                      <td>
                        <span className={`badge ${m.movieType==="SERIES"?"bg-info":"bg-secondary"}`}>
                          {m.movieType || "SINGLE"}
                        </span>
                      </td>
                      <td>{statusBadge(m.status)}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-sm btn-outline-primary"
                                  onClick={()=>setEditTarget(m)}>
                            <FaEdit className="me-1"/> Sửa
                          </button>
                          <button className="btn btn-sm btn-outline-dark"
                                  onClick={()=>setOpenEpisodeFor(m)}>
                            <FaListUl className="me-1"/> Tập
                          </button>
                          <IssueReportButton
                            movieId={id}
                            issueData={issueStatistics}
                            onClick={() => handleOpenIssueReports(m)}
                            issueCounts={issueCounts}
                          />
                          <button className="btn btn-sm btn-outline-danger"
                                  onClick={()=>handleDeleteSelected(new Set([id]))}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length===0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted">Không có dữ liệu phù hợp.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ====== MODALS rời (render khi cần) ====== */}
        <Suspense fallback={<div className="p-4">Đang tải thành phần…</div>}>
          {openAdd && (
            <ModelAddMovie
              onClose={()=>setOpenAdd(false)}
              onSuccess={()=>{ setOpenAdd(false); load(); }}
            />
          )}
          {editTarget && (
            <ModelUpdateMovie
              movieId={editTarget.movieId || editTarget.id}
              onClose={()=>setEditTarget(null)}
              onSuccess={()=>{ setEditTarget(null); load(); }}
            />
          )}
          {openEpisodeFor && (
            <ModelAddNewEpisode
              movieId={openEpisodeFor.movieId || openEpisodeFor.id}
              onClose={()=>setOpenEpisodeFor(null)}
              onSuccess={()=> setOpenEpisodeFor(null)}
            />
          )}
          {issueReportsFor && (
            <IssueReportsModal
              isOpen={true}
              onClose={handleIssueModalClose}
              movieId={issueReportsFor.movieId}
              movieTitle={issueReportsFor.movieTitle}
            />
          )}
        </Suspense>
      </div>
    </div>
  );
}

