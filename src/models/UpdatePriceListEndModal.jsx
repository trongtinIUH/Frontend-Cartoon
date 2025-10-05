// models/UpdatePriceListEndModal.jsx
import { useEffect, useMemo, useState } from "react";
import PricingService from "../services/PricingService";

const toDateOnly = (d) => {
  if (!d) return "";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const da = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

const plusDays = (dateStr, days) => {
  const dt = new Date(dateStr);
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const Badge = ({ status }) => {
  const ok = (status || "").toUpperCase() === "ACTIVE";
  return (
    <span className={`badge ${ok ? "bg-success" : "bg-secondary"}`}>
      {ok ? "Hoạt động" : (status || "-")}
    </span>
  );
};

const UpdatePriceListEndModal = ({ isOpen, onClose, onSaved, priceList }) => {
  const [newEnd, setNewEnd] = useState("");
  const [carry, setCarry] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const startDate = useMemo(() => toDateOnly(priceList?.startDate), [priceList]);
  const endDate   = useMemo(() => toDateOnly(priceList?.endDate),   [priceList]);

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    if (endDate) {
      // Gợi ý mặc định: +30 ngày kể từ end hiện tại
      setNewEnd(plusDays(endDate, 30));
    } else {
      setNewEnd("");
    }
  }, [isOpen, endDate]);

  if (!isOpen) return null;

  const canExtend = (priceList?.status || "").toUpperCase() === "ACTIVE";

  const bump = (days) => {
    if (!newEnd && endDate) {
      setNewEnd(plusDays(endDate, days));
    } else if (newEnd) {
      setNewEnd(plusDays(newEnd, days));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newEnd) {
      setError("Vui lòng chọn ngày kết thúc mới.");
      return;
    }
    if (startDate && newEnd < startDate) {
      setError(`Ngày kết thúc mới phải ≥ ${startDate}.`);
      return;
    }
    if (endDate && !(newEnd > endDate)) {
      setError(`Ngày kết thúc mới phải > ${endDate}.`);
      return;
    }
    if (!canExtend) {
      setError("Chỉ có thể gia hạn khi bảng giá đang ở trạng thái ACTIVE.");
      return;
    }

    try {
      setSaving(true);
      await PricingService.updatePriceListEndDate(
        priceList.priceListId || priceList.id,
        newEnd,
        carry
      );
      onSaved?.();
      onClose?.();
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || "Gia hạn thất bại.";
      let uiMsg = msg;
      if (status === 400 && (/must be > current end/i.test(msg) || /within the range/i.test(msg))) {
        uiMsg = "Ngày kết thúc mới không hợp lệ với khung ngày của bảng giá.";
      } else if (status === 409 || /overlap/i.test(msg)) {
        uiMsg = "Khoảng thời gian trùng với bảng giá kế tiếp của một số gói.";
      }
      setError(uiMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
      <div className="modal fade show" style={{ display: "block", zIndex: 1050 }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content border-0 shadow-lg">
            <form onSubmit={handleSubmit}>
              <div className="modal-header border-0">
                <h5 className="modal-title">
                  <i className="fa fa-calendar-plus-o me-2" aria-hidden="true" />
                  Gia hạn bảng giá
                </h5>
                <button type="button" className="btn-close" onClick={onClose} />
              </div>

              <div className="modal-body pt-0">
                {/* Info table */}
                <div className="card mb-3">
                  <div className="card-body p-0">
                    <table className="table table-sm align-middle mb-0">
                      <tbody>
                        <tr>
                          <th style={{ width: 220 }} className="bg-light">Tên bảng giá</th>
                          <td className="fw-medium">{priceList?.name || "-"}</td>
                        </tr>
                        <tr>
                          <th className="bg-light">Trạng thái</th>
                          <td><Badge status={priceList?.status} /></td>
                        </tr>
                        <tr>
                          <th className="bg-light">Ngày bắt đầu</th>
                          <td>{startDate || "-"}</td>
                        </tr>
                        <tr>
                          <th className="bg-light">Kết thúc hiện tại</th>
                          <td>{endDate || "-"}</td>
                        </tr>
                        <tr>
                          <th className="bg-light">
                            Ngày kết thúc mới <span className="text-danger">*</span>
                          </th>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <input
                                type="date"
                                className="form-control"
                                style={{ maxWidth: 220 }}
                                value={newEnd}
                                min={endDate ? plusDays(endDate, 1) : undefined}
                                onChange={(e) => setNewEnd(e.target.value)}
                              />
                              <div className="btn-group" role="group" aria-label="Quick extend">
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => bump(7)}>+7 ngày</button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => bump(30)}>+30 ngày</button>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => bump(90)}>+90 ngày</button>
                              </div>
                            </div>
                            {/* <small className="text-muted d-block mt-1">
                              Hệ thống sẽ tự “snap” nếu trùng ngày bắt đầu của bảng giá kế tiếp cho cùng gói.
                            </small> */}
                          </td>
                        </tr>
                        <tr>
                          <th className="bg-light">Carry-forward giá thiếu</th>
                          <td>
                            <div className="form-check">
                              <input
                                id="carry-forward"
                                className="form-check-input"
                                type="checkbox"
                                checked={carry}
                                onChange={(e) => setCarry(e.target.checked)}
                              />
                              <label htmlFor="carry-forward" className="form-check-label">
                                Tạo tự động PriceItem cho các gói chưa có trong bảng giá (dùng giá gần nhất).
                              </label>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger">
                    <i className="fa fa-exclamation-circle me-2" aria-hidden="true" />
                    {error}
                  </div>
                )}
              </div>

              <div className="modal-footer border-0">
                <button type="submit" className="btn btn-primary" disabled={saving || !canExtend}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Đang cập nhật…
                    </>
                  ) : (
                    "Cập nhật"
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

export default UpdatePriceListEndModal;
