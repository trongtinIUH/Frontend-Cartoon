import React, { useEffect, useState, useRef } from "react";
import PaymentService from "../services/PaymentService";
import { fmtDateTime } from "../utils/date";

const Backdrop = ({ onClick }) => (
  <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClick} />
);

const PaymentDetailModal = ({ open, onClose, paymentId }) => {
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);        // từ bảng Payment
  const [detail, setDetail] = useState(null);          // từ bảng PaymentDetail
  const [error, setError] = useState("");
  const modalRef = useRef(null);

  // ESC để đóng
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Click ngoài để đóng
  useEffect(() => {
    if (!open) return;
    const handleClickOut = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose?.();
    };
    document.addEventListener("mousedown", handleClickOut);
    return () => document.removeEventListener("mousedown", handleClickOut);
  }, [open, onClose]);

  // Load song song: Payment + PaymentDetail theo paymentId
  useEffect(() => {
    const fetchBoth = async () => {
      if (!open || !paymentId) return;
      setLoading(true);
      setError("");
      try {
        // Bạn đổi tên method cho khớp service thật của bạn nhé
        const [p, d] = await Promise.all([
          PaymentService.getPaymentById(paymentId),       // trả về bảng Payment
          PaymentService.getPaymentDetailById(paymentId), // trả về bảng PaymentDetail
        ]);
        setPayment(p || null);
        setDetail(d || null);
      } catch (err) {
        console.error("[Payment] load payment + detail error:", err);
        setError(err?.message || "Không tải được chi tiết thanh toán.");
        setPayment(null);
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBoth();
  }, [open, paymentId]);

  const fmtVND = (n) =>
    n != null ? n.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) : "—";

  const statusBadge = (status) => {
    const s = (status || "").toUpperCase();
    const cls = s === "SUCCESS" ? "bg-success" : s === "CANCELED" ? "bg-danger" : "bg-secondary";
    const label = s === "SUCCESS" ? "Thành công" : s === "CANCELED" ? "Không thành công" : "Đang chờ xử lý";
    return <span className={`badge ${cls}`}>{label}</span>;
  };

  if (!open) return null;

  return (
    <>
      <Backdrop onClick={onClose} />
      <div className="modal fade show" style={{ display: "block", zIndex: 1050 }} aria-modal="true" role="dialog">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content" ref={modalRef}>
            <div className="modal-header">
              <h5 className="modal-title">
                Chi tiết thanh toán{" "}
                {payment?.paymentCode
                  ? `#${payment.paymentCode}`
                  : detail?.paymentCode
                  ? `#${detail.paymentCode}`
                  : ""}
              </h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>

            <div className="modal-body">
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status" />
                  <div className="mt-2">Đang tải...</div>
                </div>
              )}

              {!loading && error && <div className="alert alert-danger">{error}</div>}

              {!loading && !error && (payment || detail) && (
                <>
                  {/* Thông tin chung từ bảng Payment */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="p-3 border rounded h-100">
                        <div className="fw-semibold text-muted mb-1">Người dùng</div>
                        <div className="fs-6">{payment?.userId || "—"}</div>

                        <div className="fw-semibold text-muted mt-3 mb-1">Gói</div>
                        <div className="fs-6">{payment?.packageId || "—"}</div>

                        <div className="fw-semibold text-muted mt-3 mb-1">Nhà cung cấp</div>
                        <div className="fs-6">{payment?.provider || "—"}</div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 border rounded h-100">
                        <div className="fw-semibold text-muted mb-1">Trạng thái</div>
                        <div className="fs-6">{statusBadge(payment?.status)}</div>

                        <div className="fw-semibold text-muted mt-3 mb-1">Ngày tạo thanh toán</div>
                        <div className="fs-6" title={payment?.createdAt || ""}>
                          {payment?.createdAt ? fmtDateTime(payment.createdAt) : "—"}
                        </div>

                        <div className="fw-semibold text-muted mt-3 mb-1">Ngày thanh toán</div>
                        <div className="fs-6" title={payment?.paidAt || ""}>
                          {payment?.paidAt ? fmtDateTime(payment.paidAt) : (
                            <span className="badge bg-secondary">Chưa thanh toán</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bảng tính tiền chi tiết từ bảng PaymentDetail */}
                  <div className="table-responsive">
                    <table className="table table-striped table-bordered table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Mã thanh toán</th>
                          <th>Mã khuyến mãi gói</th>
                          <th>Mã Voucher</th>
                          <th>Số tiền gốc</th>
                          <th>Giảm giá</th>
                          <th>Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{detail?.paymentCode || payment?.paymentCode || "—"}</td>
                          <td>{detail?.promotionId || "—"}</td>
                          <td>{detail?.voucherCode || "—"}</td>
                          <td>{fmtVND(detail?.originalAmount)}</td>
                          <td>{fmtVND(detail?.discountAmount)}</td>
                          <td className="fw-bold">{fmtVND(detail?.finalAmount ?? payment?.finalAmount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!loading && !error && !payment && !detail && (
                <div className="text-center text-muted py-4">Không có dữ liệu</div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Đóng</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentDetailModal;
