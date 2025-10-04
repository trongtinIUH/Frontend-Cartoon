import { useEffect, useMemo, useState } from "react";
import PromotionLineService from "../services/PromotionLineService";
import { addDays, diffDays, maxIso } from "../utils/date";

const initialForm = {
  promotionLineId: "",
  promotionLineName: "",
  promotionLineType: "VOUCHER",
  status: "ACTIVE",
  startDate: "",
  endDate: ""
};

export default function PromotionLineCreateModal({
  open,
  onClose,
  onCreated,
  promotion,
  existingIds = [],
  initialData
}) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Hôm nay / ngày mai (YYYY-MM-DD)
  const today = new Date().toLocaleDateString("en-CA");
  const tomorrow = addDays(today, 1);

  // Phạm vi của Promotion cha
  const promoStart = promotion?.startDate || "";
  const promoEnd   = promotion?.endDate || "";

  // Khi EDIT: khoá startDate nếu start đã đến/qua hôm nay
  const startLocked = isEdit && initialData?.startDate && (new Date(initialData.startDate) <= new Date(today));

  // Min/Max cho startDate
  const startMin = isEdit
    ? (startLocked ? undefined : maxIso(tomorrow, promoStart || tomorrow))
    : maxIso(tomorrow, promoStart || tomorrow);
  const startMax = promoEnd || undefined;

  // Min/Max cho endDate
  const endMin = (() => {
    const base = form.startDate && form.startDate.length === 10
      ? addDays(form.startDate, 1)
      : tomorrow;
    // end phải >= max( start+1, hôm nay, promoStart )
    return maxIso(maxIso(base, today), promoStart || base);
  })();
  const endMax = promoEnd || undefined;

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setForm({
        promotionLineId: initialData.promotionLineId || "",
        promotionLineName: initialData.promotionLineName || "",
        promotionLineType: (initialData.promotionLineType || "VOUCHER").toUpperCase(),
        status: (initialData.status || "ACTIVE").toUpperCase(),
        startDate: initialData.startDate || "",
        endDate: initialData.endDate || ""
      });
    } else {
      setForm(initialForm);
    }
    setErrors({});
    setSubmitting(false);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open, isEdit, initialData]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    const promotionId = promotion?.promotionId;
    if (!promotionId?.trim()) e._global = "Không tìm thấy khuyến mãi để tạo/cập nhật line";

    // ID: chỉ check khi CREATE
    if (!isEdit) {
      if (!form.promotionLineId.trim()) e.promotionLineId = "ID không được để trống";
      else if (existingIds.includes(form.promotionLineId.trim()))
        e.promotionLineId = "ID đã tồn tại, vui lòng chọn ID khác";
    }

    if (!form.promotionLineName.trim()) e.promotionLineName = "Tên không được để trống";
    if (!form.promotionLineType?.trim()) e.promotionLineType = "Type không được để trống";
    if (!form.status?.trim()) e.status = "Trạng thái không được để trống";
    if (!form.startDate) e.startDate = "Ngày bắt đầu không được để trống";
    if (!form.endDate) e.endDate = "Ngày kết thúc không được để trống";

    // start phải sau hôm nay — chỉ bắt khi không bị khoá
    if (form.startDate && !startLocked) {
      if (!(new Date(form.startDate) > new Date(today))) {
        e.startDate = "Ngày bắt đầu phải sau ngày hôm nay";
      }
    }

    // start nằm trong phạm vi Promotion cha (nếu cha có ngày)
    if (form.startDate && promoStart && new Date(form.startDate) < new Date(promoStart)) {
      e.startDate = `Ngày bắt đầu phải ≥ ${promoStart} (theo khuyến mãi cha)`;
    }
    if (form.startDate && promoEnd && new Date(form.startDate) > new Date(promoEnd)) {
      e.startDate = `Ngày bắt đầu phải ≤ ${promoEnd} (theo khuyến mãi cha)`;
    }

    // end ≥ start + 1
    if (form.startDate && form.endDate) {
      const dd = diffDays(form.startDate, form.endDate);
      if (!(dd >= 1)) e.endDate = "Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày";
    }

    // end trong phạm vi Promotion cha
    if (form.endDate && promoStart && new Date(form.endDate) < new Date(promoStart)) {
      e.endDate = `Ngày kết thúc phải ≥ ${promoStart} (theo khuyến mãi cha)`;
    }
    if (form.endDate && promoEnd && new Date(form.endDate) > new Date(promoEnd)) {
      e.endDate = `Ngày kết thúc phải ≤ ${promoEnd} (theo khuyến mãi cha)`;
    }

    // endDate ≥ hôm nay (đồng bộ rule BE)
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

      // Tạo payload chung
      const basePayload = {
        promotionLineName: form.promotionLineName.trim(),
        promotionLineType: form.promotionLineType.trim(),
        status: form.status.trim(),
        endDate: form.endDate
      };

      // Với startDate: nếu khoá thì KHÔNG gửi (để BE không sửa),
      // nếu không khoá thì gửi giá trị mới.
      if (!startLocked) {
        basePayload.startDate = form.startDate;
      }

      if (isEdit) {
        // EDIT
        // ⚠️ cần API update trên service. Ví dụ: PUT /promotions/{promotionId}/lines/{promotionLineId}
        await PromotionLineService.updatePromotionLine(
          promotion.promotionId,
          form.promotionLineId,
          basePayload
        );
      } else {
        // CREATE
        const payloadCreate = {
          promotionId: promotion.promotionId,
          promotionLineId: form.promotionLineId.trim(),
          ...basePayload,
          // create chắc chắn cần startDate
          startDate: form.startDate
        };
        await PromotionLineService.createPromotionLine(payloadCreate);
      }

      await onCreated?.();
      onClose();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        _global:
          error?.response?.data ||
          error?.message ||
          (isEdit ? "Cập nhật line thất bại" : "Tạo line thất bại"),
      }));
      console.error(isEdit ? "Failed to update line:" : "Failed to create line:", error);
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
                <h5 className="modal-title">
                  {isEdit ? "Cập nhật line khuyến mãi" : "Tạo line khuyến mãi mới"}
                  {promotion ? ` cho "${promotion.name || promotion.promotionId}"` : ""}
                </h5>
                <button type="button" className="btn-close" onClick={onClose} disabled={submitting} />
              </div>

              <div className="modal-body">
                {errors._global && <div className="alert alert-danger">{errors._global}</div>}

                {/* ID */}
                <div className="mb-3">
                  <label className="form-label">
                    ID <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`text-black form-control ${errors.promotionLineId ? "is-invalid" : ""}`}
                    value={form.promotionLineId}
                    onChange={(e) => setField("promotionLineId", e.target.value)}
                    placeholder="VD: LINE2025"
                    disabled={isEdit} // KHÓA ID khi edit
                  />
                  {errors.promotionLineId && <div className="invalid-feedback">{errors.promotionLineId}</div>}
                </div>

                {/* Tên */}
                <div className="mb-3">
                  <label className="form-label">
                    Tên Line <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`text-black form-control ${errors.promotionLineName ? "is-invalid" : ""}`}
                    value={form.promotionLineName}
                    onChange={(e) => setField("promotionLineName", e.target.value)}
                    placeholder="VD: Halloween 2025"
                  />
                  {errors.promotionLineName && <div className="invalid-feedback">{errors.promotionLineName}</div>}
                </div>

                {/* Type + Status */}
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">
                      Type <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`text-black form-control ${errors.promotionLineType ? "is-invalid" : ""}`}
                      value={form.promotionLineType}
                      onChange={(e) => setField("promotionLineType", e.target.value)}
                    >
                      <option value="VOUCHER">VOUCHER</option>
                      <option value="PACKAGE">PACKAGE</option>
                    </select>
                    {errors.promotionLineType && <div className="invalid-feedback">{errors.promotionLineType}</div>}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">
                      Trạng thái <span className="text-danger">*</span>
                    </label>
                    <select
                      className={`text-black form-control ${errors.status ? "is-invalid" : ""}`}
                      value={form.status}
                      onChange={(e) => setField("status", e.target.value)}
                    >
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="INACTIVE">Không hoạt động</option>
                    </select>
                    {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                  </div>
                </div>

                {/* Dates */}
                <div className="row g-3 mt-1">
                  <div className="col-md-6">
                    <label className="form-label">
                      Ngày bắt đầu <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`text-black form-control ${errors.startDate ? "is-invalid" : ""}`}
                      value={form.startDate}
                      min={startMin}
                      max={startMax}
                      onChange={(e) => setField("startDate", e.target.value)}
                      disabled={startLocked}
                    />
                    {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                    {startLocked && (
                      <div className="form-text text-muted">
                        Ngày bắt đầu đã đến/qua hôm nay nên không thể chỉnh sửa.
                      </div>
                    )}
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
                      max={endMax}
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
                  ) : (
                    isEdit ? "Cập nhật line" : "Tạo line khuyến mãi"
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
