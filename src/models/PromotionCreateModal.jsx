import { useEffect, useMemo, useState } from "react";
import PromotionService from "../services/PromotionService";
import { addDays, diffDays, maxIso } from "../utils/date";

const initialForm = {
  promotionId: "",
  promotionName: "",
  description: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
};

export default function PromotionCreateModal({
  open,
  onClose,
  onCreated,
  existingIds = [],
  initialData, // nếu có -> edit
}) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const isInitialInactive = isEdit && initialData?.status === "ACTIVE";
  // Hôm nay / ngày mai (YYYY-MM-DD)
  // YYYY-MM-DD hôm nay
  const today = new Date().toLocaleDateString("en-CA");
  const tomorrow = addDays(today, 1);

  // Edit: khóa nếu startDate của bản ghi <= hôm nay
  const startLocked = !!initialData && initialData.startDate && (new Date(initialData.startDate) <= new Date(today));
  // Ngày bắt đầu tối thiểu
  const startMin = !isEdit
    ? tomorrow
    : startLocked
      ? undefined
      : maxIso(tomorrow, initialData?.startDate || tomorrow);

  // Ngày kết thúc tối thiểu
  const endMin =
    form.startDate && form.startDate.length === 10
      ? maxIso(addDays(form.startDate, 1), today)
      : today;


  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        promotionId: initialData.promotionId || "",
        promotionName: initialData.promotionName || "",
        description: initialData.description || "",
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || "",
        status: (initialData.status || "ACTIVE").toUpperCase(),
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
  }, [open, isEdit, initialData]);

  if (!open) return null;

  const validate = () => {
    const e = {};

    // ID chỉ validate khi tạo mới
    if (!isEdit) {
      if (!form.promotionId.trim()) {
        e.promotionId = "ID không được để trống";
      } else if (existingIds.includes(form.promotionId.trim())) {
        e.promotionId = "ID đã tồn tại, vui lòng chọn ID khác";
      }
    }

    if (!form.promotionName.trim()) e.promotionName = "Tên không được để trống";
    if (!form.status.trim()) e.status = "Trạng thái không được để trống";
    if (!form.startDate) e.startDate = "Ngày bắt đầu không được để trống";
    if (!form.endDate) e.endDate = "Ngày kết thúc không được để trống";

    if (form.startDate && !startLocked) {
      if (!(new Date(form.startDate) > new Date(today))) {
        e.startDate = "Ngày bắt đầu phải sau ngày hôm nay";
      }
    }

    // endDate phải sau startDate ít nhất 1 ngày (giữ nguyên)
    if (form.startDate && form.endDate) {
      const dd = diffDays(form.startDate, form.endDate);
      if (!(dd >= 1)) e.endDate = "Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày";
    }

    // endDate ≥ hôm nay
    if (form.endDate && new Date(form.endDate) < new Date(today)) {
      e.endDate = "Ngày kết thúc phải là hôm nay hoặc muộn hơn";
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
        promotionId: form.promotionId.trim(),
        promotionName: form.promotionName.trim(),
        description: form.description?.trim() || "",
        startDate: startLocked ? initialData.startDate : form.startDate,
        endDate: form.endDate,
        status: form.status,
      };

      if (isEdit) {
        await PromotionService.updatePromotion(form.promotionId, payload);
      } else {
        await PromotionService.createPromotion(payload);
      }

      await onCreated?.();
      onClose();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        _global:
          error?.response?.data ||
          error?.message ||
          (isEdit ? "Cập nhật khuyến mãi thất bại" : "Tạo khuyến mãi thất bại"),
      }));
      console.error(isEdit ? "Update promotion failed:" : "Create promotion failed:", error);
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
                <h5 className="modal-title">{isEdit ? "Cập nhật khuyến mãi" : "Tạo khuyến mãi mới"}</h5>
                <button type="button" className="btn-close" onClick={onClose} disabled={submitting} />
              </div>

              <div className="modal-body">
                {errors._global && <div className="alert alert-danger">{errors._global}</div>}

                {!isEdit && (
                  <div className="mb-3">
                    <label className="form-label">
                      ID <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`text-black form-control ${errors.promotionId ? "is-invalid" : ""}`}
                      value={form.promotionId}
                      onChange={(e) => setField("promotionId", e.target.value)}
                      placeholder="PROMO2025-BLACKFRIDAY"
                    />
                    {errors.promotionId && <div className="invalid-feedback">{errors.promotionId}</div>}
                  </div>
                )}

                {isEdit && (
                  <div className="mb-3">
                    <label className="form-label">ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.promotionId}
                      disabled
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    Tên khuyến mãi <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`text-black form-control ${errors.promotionName ? "is-invalid" : ""}`}
                    value={form.promotionName}
                    onChange={(e) => setField("promotionName", e.target.value)}
                    disabled={isInitialInactive}
                    placeholder="Black Friday 2025"
                  />
                  {errors.promotionName && <div className="invalid-feedback">{errors.promotionName}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Mô tả <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className={`text-black form-control ${errors.description ? "is-invalid" : ""}`}
                    rows={3}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    disabled={isInitialInactive}
                    placeholder="Giảm giá cực sốc cho các gói thành viên"
                  />
                  {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Trạng thái <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`text-black form-control ${errors.status ? "is-invalid" : ""}`}
                    value={form.status}
                    onChange={(e) => setField("status", e.target.value)}
                  >
                    <option value="">Chọn trạng thái</option>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="INACTIVE">Không hoạt động</option>
                  </select>
                  {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Ngày bắt đầu <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`text-black form-control ${errors.startDate ? "is-invalid" : ""}`}
                      value={form.startDate}
                      min={startMin}
                      onChange={(e) => setField("startDate", e.target.value)}
                      disabled={isEdit && startLocked}
                    />
                    {isEdit && startLocked && (
                      <div className="form-text text-muted">
                        Ngày bắt đầu đã qua (hoặc là hôm nay) nên không thể chỉnh sửa.
                      </div>
                    )}
                    {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">
                      Ngày kết thúc <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`text-black form-control ${errors.endDate ? "is-invalid" : ""}`}
                      value={form.endDate}
                      min={endMin}
                      disabled={isInitialInactive}
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
                      {isEdit ? "Đang cập nhật..." : "Đang tạo..."}
                    </>
                  ) : isEdit ? (
                    "Cập nhật khuyến mãi"
                  ) : (
                    "Tạo khuyến mãi mới"
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
