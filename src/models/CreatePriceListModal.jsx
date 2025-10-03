import { useEffect, useState } from "react";
import PricingService from "../services/PricingService";

const emptyForm = {
  id: "",
  name: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
};

// ===== Utils ngày (tránh lệch TZ/DST và so sánh an toàn) =====
const toMidnight = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const diffDays = (startIso, endIso) => {
  const s = toMidnight(startIso);
  const e = toMidnight(endIso);
  if (!s || !e) return NaN;
  return Math.round((e - s) / (1000 * 60 * 60 * 24));
};
const addDays = (iso, n) => {
  const d = toMidnight(iso);
  if (!d) return "";
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const maxIso = (a, b) => (new Date(a) > new Date(b) ? a : b);
// =============================================================

const CreatePriceListModal = ({
  isOpen,
  onClose,
  onCreated,
  initialData,
  existingIds = [],
  allPriceLists = [],              // FE overlap check
  getPkgIdsByListId = () => [],   // FE overlap check
}) => {
  const isEdit = !!initialData;
  const isCreate = !isEdit;

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const tomorrow = addDays(today, 1);

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit) {
      setFormData({
        id: initialData?.priceListId || "",
        name: initialData?.name || "",
        startDate: initialData?.startDate || "",
        endDate: initialData?.endDate || "",
        status: initialData?.status || "ACTIVE",
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [isOpen, isEdit, initialData]);

  // ----- Flags theo bản ghi hiện tại -----
  const initialStart = isEdit ? (initialData?.startDate || "") : "";
  const hasStarted = isEdit && initialStart && (new Date(today) >= new Date(initialStart));

  // ----- Business flags -----
  const isInactive = formData.status === "INACTIVE";
  const isFutureStart = formData.startDate && (new Date(formData.startDate) > new Date(today));

  // Chỉ cho đổi startDate khi INACTIVE & chưa bắt đầu
  const canEditStart = isEdit && isInactive && !hasStarted;
  // Min cho startDate = ngày mai (khi tạo mới hoặc khi edit mà được phép đổi)
  const startMin = isCreate ? tomorrow : (canEditStart ? tomorrow : undefined);

  // Min cho endDate = max(today, startDate + 1 ngày)
  const endMin =
    formData.startDate && formData.startDate.length === 10
      ? maxIso(addDays(formData.startDate, 1), today)
      : today;

  const showStartAfterTodayHint = (isCreate || canEditStart);
  const showLockedReasonHint = isEdit && !canEditStart;

  const statusOptions = isEdit
    ? (
        isFutureStart
          ? [{ value: "INACTIVE", label: "Chưa kích hoạt" }]
          : [
              { value: "ACTIVE", label: "Kích hoạt" },
              { value: "INACTIVE", label: "Chưa kích hoạt" },
            ]
      )
    : [{ value: "INACTIVE", label: "Chưa kích hoạt" }];

  // Nếu khi edit mà start > hôm nay nhưng status không phải INACTIVE, ép về INACTIVE
  useEffect(() => {
    if (isEdit && isFutureStart && formData.status !== "INACTIVE") {
      setFormData((prev) => ({ ...prev, status: "INACTIVE" }));
    }
  }, [isEdit, isFutureStart, formData.status]);

  const handleStatusChange = (e) => {
    const next = e.target.value;
    // startDate > hôm nay thì không cho ACTIVE
    if (new Date(formData.startDate) > new Date(today) && next === "ACTIVE") return;
    setFormData((prev) => ({ ...prev, status: next }));
  };

  const setField = (field, value) => {
    const next = { ...formData, [field]: value };

    // TẠO MỚI: luôn để INACTIVE vì start > hôm nay
    if (isCreate && field === "startDate") {
      next.status = "INACTIVE";
    }
    // EDIT: nếu đổi startDate sang tương lai mà đang ACTIVE → hạ về INACTIVE
    if (isEdit && field === "startDate") {
      if (new Date(value) > new Date(today) && next.status === "ACTIVE") {
        next.status = "INACTIVE";
      }
    }

    setFormData(next);
  };

  // ============== FE OVERLAP CHECK ==============
  const intersects = (aStart, aEnd, bStart, bEnd) => {
    return !(new Date(aEnd) < new Date(bStart) || new Date(bEnd) < new Date(aStart));
  };

  /**
   * Kiểm tra overlap ở FE:
   * - Lấy các package của list đang sửa
   * - So khoảng ngày với TẤT CẢ list khác.
   * - Nếu khung ngày trùng và có ÍT NHẤT 1 package trùng → báo lỗi.
   */
  const checkOverlapClient = (currentListId, newStart, newEnd) => {
    const currentPkgs = new Set(getPkgIdsByListId(currentListId) || []);
    if (!currentPkgs.size) return null; // không có item thì bỏ qua

    for (const other of allPriceLists || []) {
      if (!other || other.priceListId === currentListId) continue;

      if (intersects(newStart, newEnd, other.startDate, other.endDate)) {
        const otherPkgs = getPkgIdsByListId(other.priceListId) || [];
        const hit = otherPkgs.find((pid) => currentPkgs.has(pid));
        if (hit) {
          return `Khoảng ngày mới (${newStart} → ${newEnd}) bị trùng gói với bảng giá ${other.priceListId} (${other.startDate} → ${other.endDate}).`;
        }
      }
    }
    return null;
  };
  // =========================================================

  if (!isOpen) return null;

  const validate = () => {
    const e = {};

    // ID (chỉ khi tạo)
    if (!isEdit) {
      if (!formData.id) {
        e.id = "ID bảng giá là bắt buộc";
      } else {
        const idTrim = formData.id.trim();
        const exists = existingIds.some((x) => (x || "").toLowerCase() === idTrim.toLowerCase());
        if (exists) e.id = "ID bảng giá đã tồn tại";
      }
    }

    if (!formData.name) e.name = "Tên bảng giá là bắt buộc";
    if (!formData.startDate) e.startDate = "Ngày bắt đầu là bắt buộc";
    if (!formData.endDate) e.endDate = "Ngày kết thúc là bắt buộc";

    // Rule: startDate phải sau hôm nay
    if (isCreate && formData.startDate && !(new Date(formData.startDate) > new Date(today))) {
      e.startDate = "Ngày bắt đầu phải sau ngày hôm nay";
    } else if (isEdit && canEditStart && formData.startDate && !(new Date(formData.startDate) > new Date(today))) {
      e.startDate = "Ngày bắt đầu phải sau ngày hôm nay";
    }

    // endDate phải sau startDate ít nhất 1 ngày
    if (formData.startDate && formData.endDate) {
      const dd = diffDays(formData.startDate, formData.endDate);
      if (!(dd >= 1)) {
        e.endDate = "Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày";
      }
    }

    // endDate phải ≥ hôm nay (đồng bộ BE)
    if (formData.endDate && new Date(formData.endDate) < new Date(today)) {
      e.endDate = "Ngày kết thúc phải là hôm nay hoặc muộn hơn";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      // FE overlap check trước khi gọi API (chỉ khi EDIT)
      if (isEdit) {
        const overlapMsg = checkOverlapClient(
          initialData.priceListId,
          formData.startDate,
          formData.endDate
        );
        if (overlapMsg) {
          setErrors({ _global: overlapMsg });
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        id: formData.id?.trim?.() ?? formData.id,
        name: formData.name.trim(),
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      if (isEdit) {
        await PricingService.updatePriceList(initialData.priceListId, payload);
      } else {
        await PricingService.createPriceList(payload);
      }
      onCreated?.();
      onClose?.();
    } catch (error) {
      // Bắt message rõ từ BE (ví dụ overlap/validation)
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Lưu bảng giá thất bại. Vui lòng thử lại.";
      setErrors({ _global: msg });
      console.error("Failed to save price list:", error);
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
                <h5 className="modal-title">{isEdit ? "Cập nhật bảng giá" : "Tạo bảng giá mới"}</h5>
                <button type="button" className="btn-close" onClick={onClose} />
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
                      className={`text-black form-control ${errors.id ? "is-invalid" : ""}`}
                      value={formData.id}
                      onChange={(e) => setField("id", e.target.value)}
                      placeholder="Ví dụ: price-list-sep-2025"
                    />
                    {errors.id && <div className="invalid-feedback">{errors.id}</div>}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    Tên bảng giá <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`text-black form-control ${errors.name ? "is-invalid" : ""}`}
                    value={formData.name}
                    onChange={(e) => setField("name", e.target.value)}
                    placeholder="Ví dụ: Bảng giá tháng 9"
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Trạng thái <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`text-black form-select ${errors.status ? "is-invalid" : ""}`}
                    value={formData.status}
                    onChange={handleStatusChange}
                    disabled={isEdit && isFutureStart} // startDate > hôm nay: chỉ đọc
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.status && <div className="invalid-feedback">{errors.status}</div>}
                  {isEdit && isFutureStart && (
                    <small className="text-muted d-block mt-1">
                      Ngày bắt đầu ở tương lai → không thể <b>Kích hoạt</b>. Trạng thái chỉ hiển thị.
                    </small>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Ngày bắt đầu <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`text-black form-control ${errors.startDate ? "is-invalid" : ""}`}
                      value={formData.startDate}
                      min={startMin}
                      onChange={(e) => setField("startDate", e.target.value)}
                      disabled={isEdit && !canEditStart} // khoá khi ACTIVE hoặc đã bắt đầu
                    />
                    {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
                    {showStartAfterTodayHint && (
                      <small className="text-muted">
                        Ngày bắt đầu phải sau hôm nay (≥ {tomorrow}).
                      </small>
                    )}
                    {showLockedReasonHint && (
                      <small className="text-muted">
                        Không thể đổi ngày bắt đầu vì bảng giá đã bắt đầu hoặc đang kích hoạt.
                      </small>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Ngày kết thúc <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`text-black form-control ${errors.endDate ? "is-invalid" : ""}`}
                      value={formData.endDate}
                      min={endMin}
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
                    isEdit ? "Cập nhật bảng giá" : "Tạo bảng giá"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePriceListModal;
