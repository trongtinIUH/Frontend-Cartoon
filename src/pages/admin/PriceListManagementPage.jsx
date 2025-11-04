import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PricingService from "../../services/PricingService";
import CreatePriceListModal from "../../models/CreatePriceListModal";
import PriceListDetailModal from "../../models/PriceListDetailModal";
import UpdatePriceListEndModal from "../../models/UpdatePriceListEndModal";
import "../../css/admin/PriceManagementPage.css"; // <— nhớ import file CSS đã tạo

const PriceListManagementPage = () => {
  const [priceLists, setPriceLists] = useState([]);
  const [pkgIdsMap, setPkgIdsMap] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState(null);
  const [editingPriceList, setEditingPriceList] = useState(null);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");

  useEffect(() => { fetchPriceLists(); }, [page, keyword]);
  useEffect(() => {
    if (!priceLists?.length) { setPkgIdsMap({}); return; }
    fetchAllPkgIds(priceLists);
  }, [priceLists]);

  const totalPages = Math.ceil((Number(total) || 0) / size);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.currentTarget.keyword?.value?.trim() ?? "";
    setPage(1);
    setKeyword(q);
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleDateString("vi-VN"); } catch { return d; }
  };

  const fetchPriceLists = async () => {
    try {
      const { items, total } = await PricingService.getAllPriceList(page, size, keyword);
      setPriceLists(Array.isArray(items) ? items : []);
      setTotal(Number(total) || 0);
    } catch (error) {
      console.error("Failed to fetch price lists:", error);
    }
  };

  const fetchAllPkgIds = async (lists) => {
    const map = {};
    try {
      await Promise.all(
        (lists || []).map(async (pl) => {
          try {
            const items = await PricingService.getPriceListItems(pl.priceListId);
            map[pl.priceListId] = (items || []).map((it) => it.packageId).filter(Boolean);
          } catch (e) {
            console.warn("Fetch items failed for list", pl.priceListId, e);
            map[pl.priceListId] = [];
          }
        })
      );
    } catch (e) {
      console.error("Failed building pkgIdsMap:", e);
    } finally {
      setPkgIdsMap(map);
    }
  };

  const handleOpenCreateModal = () => { setEditingPriceList(null); setIsCreateModalOpen(true); };
  const handleEditModalOpen = (priceList) => { setEditingPriceList(priceList); setIsCreateModalOpen(true); };
  const handleOpenDetailModal = (priceList) => { setSelectedPriceList(priceList); setIsDetailModalOpen(true); };
  const handleOpenExtendModal = (priceList) => { setSelectedPriceList(priceList); setIsExtendModalOpen(true); };

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <h2 className="mb-4 fw-bold">QUẢN LÝ BẢNG GIÁ</h2>

        <div className="card">
          {/* Header: search + create */}
          <div className="card-header">
            <div className="admin-tools">
              <div className="search-wrap">
                <form role="search" onSubmit={handleSearch}>
                  <div className="input-group">
                    <input
                      type="search"
                      className="form-control rounded-start"
                      placeholder="Tìm kiếm bảng giá"
                      name="keyword"
                      defaultValue={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                    <button type="submit" className="btn btn-outline-secondary rounded-end">
                      <i className="fa fa-search" />
                    </button>
                  </div>
                </form>
              </div>

              <div className="mt-2 mt-md-0">
                <button type="button" className="btn btn-primary px-5" onClick={handleOpenCreateModal}>
                  <i className="fa fa-plus me-2"></i> Tạo bảng giá
                </button>
              </div>
            </div>
          </div>

          {/* Body: list */}
          <div className="card-body">
            <div className="admin-table-responsive">
              <table className="table table-striped table-bordered table-hover align-middle price-table">
                <thead className="table-light">
                  <tr>
                    <th className="price-id">ID</th>
                    <th className="price-name">Tên bảng giá</th>
                    <th className="price-created">Ngày tạo</th>
                    <th className="price-start">Ngày bắt đầu</th>
                    <th className="price-end">Ngày kết thúc</th>
                    <th className="price-status">Trạng thái</th>
                    <th className="price-actions" style={{ width: 180 }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {(priceLists || []).map((pl) => (
                    <tr key={pl.priceListId}>
                      <td className="price-id">{pl.priceListId}</td>
                      <td className="price-name">{pl.name}</td>
                      <td className="price-created">{fmtDate(pl.createdAt)}</td>
                      <td className="price-start">{fmtDate(pl.startDate)}</td>
                      <td className="price-end">{fmtDate(pl.endDate)}</td>
                      <td className="price-status">
                        <span className={`badge ${
                          pl.status === "ACTIVE" ? "bg-success" :
                          pl.status === "EXPIRED" ? "bg-danger" : "bg-secondary"
                        }`}>
                          {pl.status === "ACTIVE" ? "Hoạt động" :
                           pl.status === "EXPIRED" ? "Hết hạn" : "Không hoạt động"}
                        </span>
                      </td>
                      <td className="price-actions">
                        <span
                          className="btn btn-sm btn-outline-warning me-2"
                          style={{ borderRadius: 10, padding: "5px 10px", fontSize: 14 }}
                          onClick={() => handleOpenDetailModal(pl)}
                        >
                          <i className="fa fa-eye"></i> Xem chi tiết
                        </span>
                        <span
                          className={`btn btn-sm ${
                            pl.status === "EXPIRED" ? "btn-outline-secondary" : "btn-outline-primary"
                          }`}
                          style={{
                            borderRadius: 10, padding: "5px 10px", fontSize: 14,
                            cursor: pl.status === "EXPIRED" ? "not-allowed" : "pointer",
                            pointerEvents: pl.status === "EXPIRED" ? "none" : "auto",
                            opacity: pl.status === "EXPIRED" ? 0.6 : 1,
                          }}
                          title={pl.status === "EXPIRED" ? "Bảng giá đã hết hạn, không thể chỉnh sửa" : ""}
                          onClick={() => pl.status !== "EXPIRED" && handleEditModalOpen(pl)}
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa
                        </span>
                        {/* <span
                          className="btn btn-sm btn-outline-dark ms-2"
                          style={{ borderRadius: 10, padding: "5px 10px", fontSize: 14 }}
                          onClick={() => handleOpenExtendModal(pl)}
                        >
                          <i className="fa fa-clock"></i> Gia hạn/Kết thúc
                        </span> */}
                      </td>
                    </tr>
                  ))}
                  {(!priceLists || priceLists.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav>
            <ul className="pagination justify-content-center">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>{"<"}</button>
              </li>
              {[...Array(totalPages).keys()].map((i) => (
                <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                  <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{">"}</button>
              </li>
            </ul>
          </nav>
        )}

        <CreatePriceListModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={fetchPriceLists}
          initialData={editingPriceList}
          existingIds={(priceLists || []).map((pl) => pl.priceListId)}
          allPriceLists={priceLists}
          getPkgIdsByListId={(listId) => pkgIdsMap[listId] || []}
        />

        <PriceListDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          priceList={selectedPriceList}
        />

        {/* <UpdatePriceListEndModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          onSaved={fetchPriceLists}
          priceList={selectedPriceList}
        /> */}
      </div>
    </div>
  );
};

export default PriceListManagementPage;
