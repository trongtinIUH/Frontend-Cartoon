import { useState } from "react";
import SubscriptionPackageService from "../services/SubscriptionPackageService";
import PromotionService from "../services/PromotionService";
import { set } from "lodash";
import { toast } from "react-toastify";

const PromotionDetailModal = ({ open, onClose, promotion, packages, onAdd, loading, error }) => {
  const [picking, setPicking] = useState(false);
  const [allPkgs, setAllPkgs] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [discount, setDiscount] = useState("");
  const [saving, setSaving] = useState(false);

  const startPick = async () => {
    setPicking(true);
    setSelectedId("");
    setDiscount("");
    if (allPkgs.length === 0) {
      try {
        setLoadingAll(true);
        // Đổi tên hàm cho đúng service của bạn (getAll / getAllPackages)
        const data = await SubscriptionPackageService.getAllPackages();
        setAllPkgs(data);
      } catch (e) {
        console.error("Load packages failed:", e);
        setAllPkgs([]);
      } finally {
        setLoadingAll(false);
      }
    }
  };

  const handleSave = async () => {
    if (!selectedId || !discount) return;

    setSaving(true);
    try {
      await PromotionService.createPromotionPackage({
        promotionId: promotion.promotionId,
        packageId: selectedId,
        discountPercent: discount,
      });
      setSelectedId("");
      setDiscount("");
      setPicking(false);
      toast.success("Thêm gói khuyến mãi thành công!");
    } catch (e) {
      console.error("Save promotion failed:", e);
      toast.error("Thêm gói khuyến mãi thất bại!");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal fade show" style={{ display: "block" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Chi tiết khuyến mãi</h5>
            <span className="btn-close" onClick={onClose}></span>
          </div>
          <div className="modal-body">
            {promotion ? (
              <div>
                <h6>Gói khuyến mãi được áp dụng</h6>
                <table className="table table-striped table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Gói</th>
                      <th>Giảm giá (%)</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages && packages.length > 0 ? (
                      packages.map((pkg) => (
                        <tr key={pkg.id}>
                          <td>{pkg.packageId}</td>
                          <td>{pkg.discountPercent?.toLocaleString()} %</td>
                          <td className="d-flex">
                            <span className="btn btn-sm btn-primary me-2">
                              <i className="fa fa-pencil"></i>Sửa
                            </span>
                            <span className="btn btn-sm btn-danger me-2">
                              <i className="fa fa-trash"></i>Xóa
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3}>Không có gói khuyến mãi nào áp dụng.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>Không có dữ liệu khuyến mãi để hiển thị.</p>
            )}
          </div>
          <div className="modal-footer">
            {!picking ? (
              <button className="btn btn-secondary" onClick={startPick}>
                Chọn gói muốn áp dụng khuyến mãi
              </button>
            ) : (
              <span className="text-muted small">Chọn gói và nhập % giảm rồi nhấn “Thêm”.</span>
            )}
          </div>
          {picking && (
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Gói</label>
                <select
                  className="form-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Chọn gói</option>
                  {allPkgs.map((pkg) => (
                    <option key={pkg.packageId} value={pkg.packageId}>
                      {pkg.packageId}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Giảm giá (%)</label>
                <input
                  type="number"
                  className="text-black form-control"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Nhập % giảm"
                />
              </div>
              <div className="d-flex">
                <button className="btn btn-primary" onClick={handleSave}>
                  Thêm
                </button>
                <button className="btn btn-secondary ms-2" onClick={() => setPicking(false)}>
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromotionDetailModal;
