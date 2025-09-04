import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PromotionService from "../../services/PromotionService";
import PromotionDetailModal from "../../models/PromotionDetailModal";
import PromotionCreateModal from "../../models/PromotionCreateModal";

const PromotionManagementPage = () => {

  const [promotions, setPromotions] = useState([]);
  const [promotionPackages, setPromotionPackages] = useState({});
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [loadingPkg, setLoadingPkg] = useState({});
  const [errorPkg, setErrorPkg] = useState({});
  const [createPromotionOpen, setCreatePromotionOpen] = useState(false);

  const fetchPromotions = useCallback(async () => {
    try {
      const data = await PromotionService.getAllPromotions();
      setPromotions(data);
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const ensureItemsLoaded = async (promotion, force = false) => {
    if (!promotion) return;
    const promotionId = promotion.promotionId || promotion.id;
    if (!promotionId) return;

    if (!force && promotionPackages[promotionId] !== undefined) return;

    try {
      setLoadingPkg((p) => ({ ...p, [promotionId]: true }));
      setErrorPkg((p) => ({ ...p, [promotionId]: null }));

      let data = [];
      if (promotion.promotionType === "PACKAGE") {
        data = await PromotionService.getPromotionPackages(promotionId);
      } else {
        data = await PromotionService.getPromotionVouchers(promotionId);
      }

      setPromotionPackages((p) => ({ ...p, [promotionId]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      console.error("Failed to fetch promotion items:", e);
      setErrorPkg((p) => ({ ...p, [promotionId]: "Không tải được danh sách" }));
      setPromotionPackages((p) => ({ ...p, [promotionId]: [] }));
    } finally {
      setLoadingPkg((p) => ({ ...p, [promotionId]: false }));
    }
  };

  const handleOpenDetail = async (promotion) => {
    await ensureItemsLoaded(promotion);
    setSelectedPromotion(promotion);
  };


  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: '250px' }}>
        <h2 className="mb-4 fw-bold">QUẢN LÝ KHUYẾN MÃI</h2>
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
                      placeholder="Tìm kiếm khuyến mãi"
                      name="keyword"
                    />
                    <span type="submit" className="btn btn-outline-secondary rounded-end">
                      <i className="fa fa-search"></i>
                    </span>
                  </div>
                </form>
              </div>
              <div className="mt-2 mt-md-0">
                <button type="button" className="btn btn-primary  px-5" onClick={() => setCreatePromotionOpen(true)}>
                  <i className="fa fa-plus me-2"></i>
                  Tạo khuyến mãi
                </button>
              </div>
            </div>
          </div>
          { /* Card body with movie list table */}
          <div className="card-body">
            <table className="table table-striped table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Tên khuyến mãi</th>
                  <th>Mô tả</th>
                  <th>Loại</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promotion) => {
                  const pid = promotion.promotionId;
                  return (
                    <tr key={pid}>
                      <td>{promotion.promotionName}</td>
                      <td>{promotion.description}</td>
                      <td>{promotion.promotionType}</td>
                      <td>{promotion.startDate}</td>
                      <td>{promotion.endDate}</td>
                      <td>
                        <span className={`badge ${promotion.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                          {promotion.status === 'ACTIVE' ? 'Hoạt động' : 'Hết hạn'}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleOpenDetail(promotion)}>
                          <i className="fa fa-eye"></i> Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {promotions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted">
                      Không có khuyến mãi nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <PromotionCreateModal
          open={createPromotionOpen}
          onClose={() => setCreatePromotionOpen(false)}
          onCreated={fetchPromotions}
        />

        <PromotionDetailModal
          open={!!selectedPromotion}
          onClose={() => setSelectedPromotion(null)}
          promotion={selectedPromotion}
          packages={
            selectedPromotion
              ? promotionPackages[selectedPromotion.promotionId]
              : undefined
          }
          onAdd={() => {
            if (selectedPromotion) ensureItemsLoaded(selectedPromotion, true); // reload sau khi thêm
          }}
        />
      </div>
    </div>
  );
};

export default PromotionManagementPage;
