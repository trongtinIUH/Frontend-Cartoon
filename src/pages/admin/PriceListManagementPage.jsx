import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PricingService from "../../services/PricingService";
import CreatePriceListModal from "../../models/CreatePriceListModal";
import PriceListDetailModal from "../../models/PriceListDetailModal";
import UpdatePriceListEndModal from "../../models/UpdatePriceListEndModal";

const PriceListManagementPage = () => {
  const [priceLists, setPriceLists] = useState([]);
  const [pkgIdsMap, setPkgIdsMap] = useState({}); // <-- NEW
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedPriceList, setSelectedPriceList] = useState(null);
  const [editingPriceList, setEditingPriceList] = useState(null);

  useEffect(() => {
    fetchPriceLists();
  }, []);

  useEffect(() => {
    // Mỗi lần danh sách priceLists thay đổi, refetch map packageId
    if (!priceLists || priceLists.length === 0) {
      setPkgIdsMap({});
      return;
    }
    fetchAllPkgIds(priceLists);
  }, [priceLists]);

  const fetchPriceLists = async () => {
    try {
      const data = await PricingService.getAllPriceList();
      setPriceLists(data || []);
    } catch (error) {
      console.error("Failed to fetch price lists:", error);
    }
  };

  // NEW: Lấy packageId theo từng priceList từ BE
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
            map[pl.priceListId] = []; // fallback
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
          {/* Card header with search and add button */}
          <div className="card-header">
            <div
              className="d-flex justify-content-between align-items-center"
              style={{ flexWrap: "wrap" }}
            >
              <div style={{ maxWidth: "400px", width: "100%" }}>
                <form role="search">
                  <div className="input-group">
                    <input
                      type="search"
                      className="form-control rounded-start"
                      placeholder="Tìm kiếm bảng giá"
                      name="keyword"
                    />
                    <span
                      type="submit"
                      className="btn btn-outline-secondary rounded-end"
                    >
                      <i className="fa fa-search"></i>
                    </span>
                  </div>
                </form>
              </div>
              <div className="mt-2 mt-md-0">
                <button
                  type="button"
                  className="btn btn-primary  px-5"
                  onClick={handleOpenCreateModal}
                >
                  <i className="fa fa-plus me-2"></i>
                  Tạo bảng giá
                </button>
              </div>
            </div>
          </div>

          {/* Card body with list */}
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
                {priceLists.map((priceList) => (
                  <tr key={priceList.priceListId}>
                    <td>{priceList.priceListId}</td>
                    <td>{priceList.name}</td>
                    <td>{priceList.createdAt}</td>
                    <td>{priceList.startDate}</td>
                    <td>{priceList.endDate}</td>
                    <td>
                      <span
                        className={`badge ${
                          priceList.status === "ACTIVE"
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
                          : "Ngưng hoạt động"}
                      </span>
                    </td>
                    <td>
                      <span
                        className="btn btn-sm btn-warning me-2"
                        onClick={() => handleOpenDetailModal(priceList)}
                        style={{
                          borderRadius: "10px",
                          padding: "5px 10px",
                          fontSize: "14px",
                        }}
                      >
                        <i className="fa fa-eye"></i> Xem chi tiết
                      </span>
                      <span
                        className={`btn btn-sm ${
                          priceList.status === "EXPIRED"
                            ? "btn-outline-secondary"
                            : "btn-outline-primary"
                        }`}
                        style={{
                          borderRadius: 10,
                          padding: "5px 10px",
                          fontSize: "14px",
                          cursor:
                            priceList.status === "EXPIRED"
                              ? "not-allowed"
                              : "pointer",
                          pointerEvents:
                            priceList.status === "EXPIRED" ? "none" : "auto",
                          opacity: priceList.status === "EXPIRED" ? 0.6 : 1,
                        }}
                        title={
                          priceList.status === "EXPIRED"
                            ? "Bảng giá đã hết hạn, không thể chỉnh sửa"
                            : ""
                        }
                        onClick={() =>
                          priceList.status !== "EXPIRED" &&
                          handleEditModalOpen(priceList)
                        }
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa
                      </span>
                      {/* <span
                        className="btn btn-sm btn-warning"
                        onClick={() => handleOpenExtendModal(priceList)}
                        style={{
                          borderRadius: 10,
                          padding: "5px 10px",
                          fontSize: "14px",
                        }}
                        disabled={priceList.status !== "ACTIVE"}
                        title={
                          priceList.status !== "ACTIVE"
                            ? "Chỉ gia hạn với bảng giá ACTIVE"
                            : ""
                        }
                      >
                        <i className="fa-solid fa-calendar-plus"></i> Gia hạn thời gian
                      </span> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <CreatePriceListModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={fetchPriceLists}
          initialData={editingPriceList}
          existingIds={priceLists.map((pl) => pl.priceListId)}
          allPriceLists={priceLists}
          getPkgIdsByListId={(listId) => pkgIdsMap[listId] || []} // <-- giờ đã có
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
