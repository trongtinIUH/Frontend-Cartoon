// PromotionManagementPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PromotionService from "../../services/PromotionService";
import PromotionDetailModal from "../../models/PromotionDetailModal";
import PromotionCreateModal from "../../models/PromotionCreateModal";

const PromotionManagementPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [createPromotionOpen, setCreatePromotionOpen] = useState(false);

  const fetchPromotions = useCallback(async () => {
    try {
      const data = await PromotionService.getAllPromotions();
      setPromotions(data || []);
    } catch (error) {
      console.error("Failed to fetch promotions:", error);
    }
  }, []);

  useEffect(() => { fetchPromotions(); }, [fetchPromotions]);

  const handleOpenDetail = (promotion) => {
    setSelectedPromotion(promotion);
  };

  return (
    <div className="d-flex bg-white min-vh-100">
      <Sidebar />
      <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: '250px' }}>
        <h2 className="mb-4 fw-bold">QUẢN LÝ KHUYẾN MÃI</h2>

        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center" style={{flexWrap: "wrap"}}>
            <div style={{ maxWidth: 400, width: "100%" }}>
              <div className="input-group">
                <input type="search" className="form-control rounded-start" placeholder="Tìm kiếm khuyến mãi"/>
                <span className="btn btn-outline-secondary rounded-end">
                  <i className="fa fa-search" />
                </span>
              </div>
            </div>
            <div className="mt-2 mt-md-0">
              <button className="btn btn-primary px-5" onClick={() => setCreatePromotionOpen(true)}>
                <i className="fa fa-plus me-2" /> Tạo khuyến mãi
              </button>
            </div>
          </div>

          <div className="card-body">
            <table className="table table-striped table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Tên khuyến mãi</th>
                  <th>Mô tả</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map(p => (
                  <tr key={p.promotionId}>
                    <td>{p.promotionId}</td>
                    <td>{p.promotionName}</td>
                    <td>{p.description}</td>
                    <td>{p.startDate}</td>
                    <td>{p.endDate}</td>
                    <td>
                      <span className={`badge ${p.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                        {p.status === 'ACTIVE' ? 'Hoạt động' : 'Hết hạn'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning"
                        style={{ borderRadius: 10, padding: '5px 10px', fontSize: 14 }}
                        onClick={() => handleOpenDetail(p)}
                      >
                        <i className="fa fa-eye" /> Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
                {promotions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted">Không có khuyến mãi nào.</td>
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
          existingIds={promotions.map(p => p.promotionId)}
        />

        <PromotionDetailModal
          open={!!selectedPromotion}
          onClose={() => setSelectedPromotion(null)}
          promotion={selectedPromotion}
          onChanged={fetchPromotions}
        />
      </div>
    </div>
  );
};

export default PromotionManagementPage;
