import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PricingService from "../../services/PricingService";
import CreatePriceListModal from "../../models/CreatePriceListModal";
import PriceListDetailModal from "../../models/PriceListDetailModal";
import UpdatePriceListEndModal from "../../models/UpdatePriceListEndModal";

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

  // fetch theo page + keyword từ BE
  useEffect(() => {
    fetchPriceLists();
  }, [page, keyword]);

  // build map các packageId theo mỗi priceListId
  useEffect(() => {
    if (!priceLists || priceLists.length === 0) {
      setPkgIdsMap({});
      return;
    }
    fetchAllPkgIds(priceLists);
  }, [priceLists]);

  const totalPages = Math.ceil((Number(total) || 0) / size);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.currentTarget.keyword?.value?.trim() ?? "";
    setPage(1);            // reset về trang 1 khi tìm
    setKeyword(q);         // useEffect sẽ tự fetch
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
            map[pl.priceListId] = (items || [])
              .map((it) => it.packageId)
              .filter(Boolean);
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

  const handleOpenCreateModal = () => {
    setEditingPriceList(null);
    setIsCreateModalOpen(true);
  };

  const handleEditModalOpen = (priceList) => {
    setEditingPriceList(priceList);
    setIsCreateModalOpen(true);
  };

  const handleOpenDetailModal = (priceList) => {
    setSelectedPriceList(priceList);
    setIsDetailModalOpen(true);
  };

  const handleOpenExtendModal = (priceList) => {
    setSelectedPriceList(priceList);
    setIsExtendModalOpen(true);
  };

  return (
    <div className="d-flex bg-white min-vh-100">
      <Sidebar />
      <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: "250px" }}>
        <h2 className="mb-4 fw-bold">QUẢN LÝ BẢNG GIÁ</h2>
        <div className="card">
          {/* Header: search + create */}
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center" style={{ flexWrap: "wrap" }}>
              <div style={{ maxWidth: "400px", width: "100%" }}>
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
                    <span type="submit" className="btn btn-outline-secondary rounded-end">
                      <i className="fa fa-search" />
                    </span>
                  </div>
                </form>
              </div>
              <div className="mt-2 mt-md-0">
                <button type="button" className="btn btn-primary px-5" onClick={handleOpenCreateModal}>
                  <i className="fa fa-plus me-2"></i>
                  Tạo bảng giá
                </button>
              </div>
            </div>
          </div>

          {/* Body: list */}
          <div className="card-body">
            <table className="table table-striped table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Tên bảng giá</th>
                  <th>Ngày tạo</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {(priceLists || []).map((priceList) => (
                  <tr key={priceList.priceListId}>
                    <td>{priceList.priceListId}</td>
                    <td>{priceList.name}</td>
                    <td>{priceList.createdAt}</td>
                    <td>{priceList.startDate}</td>
                    <td>{priceList.endDate}</td>
                    <td>
                      <span
                        className={`badge ${priceList.status === "ACTIVE"
                            ? "bg-success"
                            : priceList.status === "EXPIRED"
                              ? "bg-danger"
                              : "bg-secondary"
                          }`}
                      >
                        {priceList.status === "ACTIVE"
                          ? "Hoạt động"
                          : priceList.status === "EXPIRED"
                            ? "Hết hạn"
                            : "Không hoạt động"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="btn btn-sm btn-outline-warning me-2"
                        onClick={() => handleOpenDetailModal(priceList)}
                        style={{ borderRadius: "10px", padding: "5px 10px", fontSize: "14px" }}
                      >
                        <i className="fa fa-eye"></i> Xem chi tiết
                      </span>
                      <span
                        className={`btn btn-sm ${priceList.status === "EXPIRED" ? "btn-outline-secondary" : "btn-outline-primary"
                          }`}
                        style={{
                          borderRadius: 10,
                          padding: "5px 10px",
                          fontSize: "14px",
                          cursor: priceList.status === "EXPIRED" ? "not-allowed" : "pointer",
                          pointerEvents: priceList.status === "EXPIRED" ? "none" : "auto",
                          opacity: priceList.status === "EXPIRED" ? 0.6 : 1,
                        }}
                        title={priceList.status === "EXPIRED" ? "Bảng giá đã hết hạn, không thể chỉnh sửa" : ""}
                        onClick={() => priceList.status !== "EXPIRED" && handleEditModalOpen(priceList)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa
                      </span>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <nav>
            <ul className="pagination justify-content-center">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  {"<"}
                </button>
              </li>

              {[...Array(totalPages).keys()].map((i) => (
                <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                  <button className="page-link" onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </button>
                </li>
              ))}

              <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  {">"}
                </button>
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

        <UpdatePriceListEndModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          onSaved={fetchPriceLists}
          priceList={selectedPriceList}
        />
      </div>
    </div>
  );
};

export default PriceListManagementPage;
