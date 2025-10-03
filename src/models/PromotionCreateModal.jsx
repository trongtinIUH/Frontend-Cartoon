import { useEffect, useState } from "react";
import PromotionService from "../services/PromotionService";

const initialForm = {
  promotionId: "",
  promotionName: "",
  description: "",
  startDate: "",
  endDate: "",
  status: ""
};

export default function PromotionCreateModal({ open, onClose, onCreated, existingIds = [] }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (open) {
      setForm(initialForm);
      setErrors({});
      setSubmitting(false);
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    if  (!form.promotionId.trim()) {
      e.promotionId = "ID không được để trống";
    } else if (existingIds.includes(form.promotionId.trim())) {
      e.promotionId = "ID đã tồn tại, vui lòng chọn ID khác";
    }
    if (!form.promotionName.trim()) e.promotionName = "Tên không được để trống";
    if (!form.status.trim()) e.status = "Trạng thái không được để trống";
    if (!form.startDate) e.startDate = "Ngày bắt đầu không được để trống";
    if (!form.endDate) e.endDate = "Ngày kết thúc không được để trống";
    if (form.startDate && form.endDate) {
      const s = new Date(form.startDate);
      const ed = new Date(form.endDate);
      if (s.toString() !== "Invalid Date" && ed.toString() !== "Invalid Date" && ed < s) {
        e.endDate = "Ngày kết thúc phải ≥ ngày bắt đầu";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      setSubmitting(true);
      const payload = {
        promotionName: form.promotionName.trim(),
        description: form.description?.trim() || "",
        startDate: form.startDate,
        endDate: form.endDate,
      };
      await PromotionService.createPromotion(payload);   
      await onCreated?.();
      onClose();
    } catch (error) {
      setErrors((prev) => ({ ...prev, _global: error?.message || "Tạo khuyến mãi thất bại" }));
      console.error("Failed to create promotion:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
      <div className="modal fade show" style={{ display: "block", zIndex: 1050 }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Tạo khuyến mãi mới</h5>
                <button type="button" className="btn-close" onClick={onClose} disabled={submitting} />
              </div>

              <div className="modal-body">
                {errors._global && <div className="alert alert-danger">{errors._global}</div>}

                <div className="mb-3">
                  <label className="form-label">ID<span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`text-black form-control ${errors.promotionId ? "is-invalid" : ""}`}
                    value={form.promotionId}
                    onChange={(e) => setField("promotionId", e.target.value)}
                    placeholder="PROMO2024"
                  />
                  {errors.promotionId && <div className="invalid-feedback">{errors.promotionId}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Tên khuyến mãi <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`text-black form-control ${errors.promotionName ? "is-invalid" : ""}`}
                    value={form.promotionName}
                    onChange={(e) => setField("promotionName", e.target.value)}
                    placeholder="Back to School"
                  />
                  {errors.promotionName && <div className="invalid-feedback">{errors.promotionName}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Mô tả <span className="text-danger">*</span></label>
                  <textarea
                    className={`text-black form-control ${errors.description ? "is-invalid" : ""}`}
                    rows={3}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Khuyến mãi gói học 3 tháng giảm giá"
                  />
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Trạng thái <span className="text-danger">*</span></label>
                  <select
                    className={`text-black form-control ${errors.status ? "is-invalid" : ""}`}
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                  >
                    <option value="">Chọn trạng thái</option>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Ngừng hoạt động</option>
                  </select>
                  {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Ngày bắt đầu <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className={`text-black form-control ${errors.startDate ? "is-invalid" : ""}`}
                      value={form.startDate}
                      min={today}
                      onChange={(e) => setField("startDate", e.target.value)}
                    />
                    {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Ngày kết thúc <span className="text-danger">*</span></label>
                    <input
                      type="date"
                      className={`text-black form-control ${errors.endDate ? "is-invalid" : ""}`}
                      value={form.endDate}
                      min={form.startDate || today}
                      onChange={(e) => setField("endDate", e.target.value)}
                    />
                    {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo khuyến mãi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
