import { useEffect, useState } from "react";
import PricingService from "../services/PricingService";
import { addDays, diffDays, maxIso } from "../utils/date";

// So sánh ngày theo local midnight (tránh lệch timezone)
const toMidnight = (iso) => {
  if (!iso || typeof iso !== "string") return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const emptyForm = {
  id: "",
  name: "",
  startDate: "",
  endDate: "",
  status: "ACTIVE",
};

const CreatePriceListModal = ({
  isOpen,
  onClose,
  onCreated,
  initialData,
  existingIds = [],
  allPriceLists = [],
  getPkgIdsByListId = () => [],
}) => {
  const isEdit = !!initialData;
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const isInitialInactive = isEdit && initialData?.status === "ACTIVE";

  // Hôm nay & ngày mai (YYYY-MM-DD)
  const today = new Date().toLocaleDateString("en-CA");
  const tomorrow = addDays(today, 2); // luôn > hôm nay

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

  // Chỉ cho đổi startDate khi đang EDIT và startDate hiện tại đang ở tương lai
  const isFutureStart =
    !!formData.startDate && toMidnight(formData.startDate) > toMidnight(today);
  const canEditStart = isEdit && isFutureStart;

  // ✅ Luôn chặn hôm nay ở UI (kể cả tạo & sửa)
  const startMin = tomorrow;

  // endDate min = max(start+1, ngày mai)
  const endMin =
    formData.startDate && formData.startDate.length === 10
      ? maxIso(addDays(formData.startDate, 1), tomorrow)
      : tomorrow;

  // Cho phép chọn ACTIVE/INACTIVE (không khoá)
  const statusOptions = [
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Không hoạt động" },
  ];

  const handleStatusChange = (e) =>
    setFormData((prev) => ({ ...prev, status: e.target.value }));

  const setField = (k, v) => setFormData((prev) => ({ ...prev, [k]: v }));

  // Overlap check FE (giữ nguyên)
  const intersects = (aStart, aEnd, bStart, bEnd) =>
    !(toMidnight(aEnd) < toMidnight(bStart) || toMidnight(bEnd) < toMidnight(aStart));

  const checkOverlapClient = (currentListId, newStart, newEnd) => {
    const currentPkgs = new Set(getPkgIdsByListId(currentListId) || []);
    if (!currentPkgs.size) return null;

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

  if (!isOpen) return null;

  const validate = () => {
    const e = {};

    // ID khi tạo mới
    if (!isEdit) {
      if (!formData.id?.trim()) e.id = "ID bảng giá là bắt buộc";
      else if (
        existingIds.some(
          (x) => (x || "").toLowerCase() === formData.id.trim().toLowerCase()
        )
      )
        e.id = "ID bảng giá đã tồn tại";
    }

    if (!formData.name?.trim()) e.name = "Tên bảng giá là bắt buộc";
    if (!formData.startDate) e.startDate = "Ngày bắt đầu là bắt buộc";
    if (!formData.endDate) e.endDate = "Ngày kết thúc là bắt buộc";

    // ⛔ Không bao giờ cho chọn hôm nay: startDate phải ≥ ngày mai
    if (
      formData.startDate &&
      !(toMidnight(formData.startDate) >= toMidnight(tomorrow))
    )
      // ⛔ endDate ≥ startDate + 1 ngày
      if (formData.startDate && formData.endDate) {
        const dd = diffDays(formData.startDate, formData.endDate);
        if (dd < 1) e.endDate = "Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày";
      }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);

      // Edit & không được đổi start -> giữ start cũ (tránh nhảy sai)
      const startForPayload =
        isEdit && !canEditStart
          ? initialData?.startDate || formData.startDate
          : formData.startDate;

      // FE overlap check khi EDIT
      if (isEdit) {
        const overlapMsg = checkOverlapClient(
          initialData.priceListId,
          startForPayload,
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
        status: formData.status, // không tự ép
        startDate: startForPayload,
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
                <h5 className="modal-title">
                  {isEdit ? "Cập nhật bảng giá" : "Tạo bảng giá mới"}
                </h5>
                <button type="button" className="btn-close" onClick={onClose} />
              </div>

              <div className="modal-body">
                {errors._global && (
                  <div className="alert alert-danger">{errors._global}</div>
                )}

                {!isEdit && (
                  <div className="mb-3">
                    <label className="form-label">
                      ID <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className={`text-black form-control ${errors.id ? "is-invalid" : ""
                        }`}
                      value={formData.id}
                      onChange={(e) => setField("id", e.target.value)}
                      placeholder="Ví dụ: price-list-sep-2025"
                    />
                    {errors.id && (
                      <div className="invalid-feedback">{errors.id}</div>
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">
                    Tên bảng giá <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`text-black form-control ${errors.name ? "is-invalid" : ""
                      }`}
                    value={formData.name}
                    onChange={(e) => setField("name", e.target.value)}
                    disabled={isInitialInactive}
                    placeholder="Ví dụ: Bảng giá tháng 9"
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Trạng thái <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`text-black form-select ${errors.status ? "is-invalid" : ""
                      }`}
                    value={formData.status}
                    onChange={handleStatusChange}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <div className="invalid-feedback">{errors.status}</div>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">
                      Ngày bắt đầu <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`text-black form-control ${errors.startDate ? "is-invalid" : ""
                        }`}
                      value={formData.startDate}
                      min={startMin}
                      onChange={(e) => setField("startDate", e.target.value)}
                      disabled={isEdit && !canEditStart }
                    />
                    {errors.startDate && (
                      <div className="invalid-feedback">{errors.startDate}</div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">
                      Ngày kết thúc <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className={`text-black form-control ${errors.endDate ? "is-invalid" : ""
                        }`}
                      value={formData.endDate}
                      min={endMin}
                      disabled={isInitialInactive}
                      onChange={(e) => setField("endDate", e.target.value)}
                    />
                    {errors.endDate && (
                      <div className="invalid-feedback">{errors.endDate}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                      {isEdit ? "Đang cập nhật..." : "Đang tạo..."}
                    </>
                  ) : isEdit ? (
                    "Cập nhật bảng giá"
                  ) : (
                    "Tạo bảng giá"
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
