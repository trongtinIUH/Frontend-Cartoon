import React, { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-toastify";
import { FaPlus, FaSearch, FaSync, FaTrash, FaEdit } from "react-icons/fa";
import AuthorService from "../../services/AuthorService";
import { useNavigate, Link } from "react-router-dom";

const ModelAddAuthor = React.lazy(() => import("../../models/ModelAddAuthor"));
const ModelUpdateAuthor = React.lazy(() => import("../../models/ModelUpdateAuthor"));

const ROLES = ["DIRECTOR", "PERFORMER"];

export default function AuthorManagementPage() {
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [role, setRole] = useState("");
    const [selected, setSelected] = useState(new Set());
    const [openAdd, setOpenAdd] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const navigate = useNavigate();
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 20;

  // Load authors with pagination
  const load = useCallback(async (page = 0, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Simulate pagination - in real app, you'd call API with page/size params
      const data = await AuthorService.getAllAuthors();
      const allAuthors = Array.isArray(data) ? data : [];
      
      // Apply filters first
      let filteredData = allAuthors;
      if (keyword) {
        filteredData = filteredData.filter(a => 
          (a.name || "").toLowerCase().includes(keyword.toLowerCase())
        );
      }
      if (role) {
        filteredData = filteredData.filter(a => a.authorRole === role);
      }
      
      // Simulate pagination
      const startIndex = page * PAGE_SIZE;
      const endIndex = startIndex + PAGE_SIZE;
      const pageData = filteredData.slice(startIndex, endIndex);
      
      setTotalCount(filteredData.length);
      setHasMore(endIndex < filteredData.length);
      
      if (isLoadMore) {
        // Append to existing data
        setAuthors(prev => [...prev, ...pageData]);
      } else {
        // Replace data (first load or filter change)
        setAuthors(pageData);
        setCurrentPage(0);
      }
      
    } catch {
      toast.error("Không tải được danh sách tác giả");
    } finally { 
      setLoading(false);
      setLoadingMore(false);
    }
  }, [keyword, role, PAGE_SIZE]);

  // Load more data when scrolling
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await load(nextPage, true);
  }, [currentPage, hasMore, loadingMore, load]);

  // Initial load
  useEffect(() => { 
    load(0, false); 
  }, [keyword, role]); // Reload when filters change

  const reset = useCallback((reload=false)=>{ 
    setKeyword(""); 
    setRole(""); 
    setSelected(new Set()); 
    setCurrentPage(0);
    setHasMore(true);
    if (reload) load(0, false); 
  }, [load]);

  // Helper function để đếm số phim mà tác giả tham gia
  const getMovieCount = useCallback((author) => {
    if (!author || !author.movieId) return 0;
    return Array.isArray(author.movieId) ? author.movieId.length : 0;
  }, []);

  // Use authors directly since filtering is done in load function
  const filtered = authors;

  const allChecked = filtered.length>0 && filtered.every(a=>selected.has(a.authorId));
  const toggleAll = ()=> setSelected(allChecked ? new Set() : new Set(filtered.map(a=>a.authorId)));
  const toggleOne = (id)=> setSelected(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });

  const handleDelete = async (idsSet)=>{
    const ids = Array.from(idsSet ?? selected);
    if (!ids.length) return;
    if (!window.confirm(`Xoá ${ids.length} tác giả?`)) return;
    try {
      await AuthorService.deleteAuthors(ids);
      toast.success("Đã xoá");
      setSelected(new Set());
      // Reset and reload from beginning
      setCurrentPage(0);
      setHasMore(true);
      load(0, false);
    } catch { toast.error("Không thể xoá"); }
  };

  // Infinite scroll handler
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200; // 200px buffer
    
    if (isNearBottom && hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

  return (
    <div className="d-flex bg-light min-vh-100">
      <Sidebar />
      <div className="flex-grow-1 p-4" style={{ marginLeft: 250, backgroundColor: '#f8f9fa' }}>
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-2 text-dark">QUẢN LÝ TÁC GIẢ / DIỄN VIÊN</h2>
            <p className="text-muted mb-0">
              Tổng cộng: <strong className="text-primary">{totalCount}</strong> tác giả/diễn viên
              {authors.length !== totalCount && (
                <span> • Đã tải: <strong className="text-success">{authors.length}</strong></span>
              )}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary" onClick={()=>reset(true)}>
              <FaSync className="me-1" /> Làm mới
            </button>
            <button className="btn btn-primary btn-sm shadow-sm" onClick={()=>setOpenAdd(true)}>
              <FaPlus className="me-1"/> Thêm mới
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card border-0 shadow-sm mb-4 bg-white">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-lg-6">
                <label className="form-label fw-semibold">Tìm theo tên</label>
                <div className="input-group">
                  <input 
                    value={keyword} 
                    onChange={e=>setKeyword(e.target.value)} 
                    type="search" 
                    className="form-control" 
                    placeholder="Nhập tên tác giả/diễn viên…" 
                  />
                  <span className="input-group-text bg-primary text-white">
                    <FaSearch/>
                  </span>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <label className="form-label fw-semibold">Vai trò</label>
                <select className="form-select" value={role} onChange={e=>setRole(e.target.value)}>
                  <option value="">Tất cả</option>
                  {ROLES.map(r=> <option key={r} value={r}>{r === 'DIRECTOR' ? 'Đạo diễn' : 'Diễn viên'}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk bar */}
        <div className="card border-0 shadow-sm mb-4 bg-white">
          <div className="card-body py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="a-sel-all" checked={allChecked} onChange={toggleAll}/>
                <label className="form-check-label fw-semibold" htmlFor="a-sel-all">Chọn tất cả</label>
              </div>
              {selected.size>0 && <span className="badge bg-info text-dark">Đã chọn {selected.size}</span>}
            </div>
            <div>
              {selected.size>0
                ? <button className="btn btn-sm btn-danger shadow-sm" onClick={()=>handleDelete()}> 
                    <FaTrash className="me-1"/> Xoá đã chọn
                  </button>
                : <span className="text-muted small">Chọn tác giả để thao tác</span>}
            </div>
          </div>
        </div>

        {/* Table with infinite scroll */}
        <div className="card border-0 shadow-sm bg-white">
          <div 
            className="table-responsive" 
            style={{ maxHeight: '600px', overflowY: 'auto' }}
            onScroll={handleScroll}
          >
            <table className="table table-hover align-middle mb-0">
              <thead className="sticky-top bg-white">
                <tr>
                  <th style={{width:42}}></th>
                  <th>#</th>
                  <th>Tên</th>
                  <th>Vai trò</th>
                  <th style={{ width: 120 }}>Số phim tham gia</th>
                  <th style={{width:220}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, idx)=>(
                  <tr key={a.authorId} className="border-bottom">
                    <td><input type="checkbox" className="form-check-input" checked={selected.has(a.authorId)} onChange={()=>toggleOne(a.authorId)}/></td>
                    <td>{idx+1}</td>
                    <td className="fw-semibold text-dark">{a.name}</td>
                    <td>
                      <span className={`badge ${a.authorRole==="DIRECTOR"?"bg-info text-dark":"bg-secondary"}`}>
                        {a.authorRole === 'DIRECTOR' ? 'ĐẠO DIỄN' : 'DIỄN VIÊN'}
                      </span>
                    </td>
                    <td className="text-center">
                      {getMovieCount(a) > 0 ? (
                        <Link 
                          to={`/browse/author-id/${encodeURIComponent(a.authorId)}`}
                          className="badge bg-primary text-decoration-none shadow-sm"
                          title={`Xem ${getMovieCount(a)} phim của ${a.name}`}
                        >
                          {getMovieCount(a)}
                        </Link>
                      ) : (
                        <span className="badge bg-secondary">0</span>
                      )}
                    </td>
                    <td>
                      <div className="btn-group shadow-sm">
                        <button className="btn btn-sm btn-outline-primary" onClick={()=>setEditTarget(a)}>
                          <FaEdit className="me-1"/> Sửa
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(new Set([a.authorId]))}>
                          <FaTrash/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length===0 && !loading && (
                  <tr><td colSpan={6} className="text-center py-4 text-muted">Không có dữ liệu.</td></tr>
                )}
                {loadingMore && (
                  <tr>
                    <td colSpan={6} className="text-center py-3">
                      <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                      Đang tải thêm...
                    </td>
                  </tr>
                )}
                {!hasMore && authors.length > 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-3 text-muted">
                      <small>Đã hiển thị tất cả dữ liệu</small>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Suspense fallback={<div className="p-4">Đang tải…</div>}>
          {openAdd && <ModelAddAuthor onClose={()=>setOpenAdd(false)} onSuccess={()=>{setOpenAdd(false); setCurrentPage(0); setHasMore(true); load(0, false);}}/>}
          {editTarget && <ModelUpdateAuthor author={editTarget} onClose={()=>setEditTarget(null)} onSuccess={()=>{setEditTarget(null); setCurrentPage(0); setHasMore(true); load(0, false);}}/>}
        </Suspense>
      </div>
    </div>
  );
}
