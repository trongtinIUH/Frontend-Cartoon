import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import SidebarUserManagement from "../components/SidebarUserManagement";
import UserService from "../services/UserService";
import { useNavigate } from "react-router-dom";
import "../css/ProfilePage.css";
import { toast } from "react-toastify";
import PaymentService from "../services/PaymentService";

const H48_MS = 48 * 3600 * 1000;

const PurchaseHistoryPage = () => {
    const { MyUser } = useAuth();
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("vi-VN");
    };

    // Helper: trong 48h từ thời điểm thanh toán
    const within48h = (paidAt) => {
        if (!paidAt) return true; // không có dữ liệu -> cho hiện, BE sẽ chặn nếu cần
        const t = new Date(paidAt).getTime();
        if (!Number.isFinite(t)) return true; // format lỗi -> cho hiện
        return (Date.now() - t) <= H48_MS;
    };

    // Ưu tiên trường ngày thanh toán
    const getPaidAt = (pkg) => pkg?.paidAt || pkg?.createdAt || pkg?.createAt;

    useEffect(() => {
        const userId = MyUser?.my_user?.userId;
        if (!userId) {
            navigate("/");
            return;
        }

        UserService.getUserSubscriptionPackages(userId)
            .then((data) => {
                const sorted = data.sort(
                    (a, b) => new Date(a.startDate) - new Date(b.startDate)
                );
                setPackages(sorted);
            })
            .catch((err) => {
                console.error("Error fetching purchase history:", err);
                setPackages([]);
            });
    }, [MyUser, navigate]);

    // Set các orderCode hợp lệ dạng number
    const validOrderCodes = useMemo(() => {
        const s = new Set();
        (packages || []).forEach((p) => {
            const n = Number(p?.orderCode);
            if (Number.isFinite(n)) s.add(n);
        });
        return s;
    }, [packages]);

    const [showRefund, setShowRefund] = useState(false);
    const [refundForm, setRefundForm] = useState({
        orderCode: null, // number | null
        reason: "",
        bankName: "",
        bankAccountNumber: "",
    });
    const [sending, setSending] = useState(false);

    const openRefund = (orderCodePrefill) => {
        setRefundForm({
            orderCode: Number(orderCodePrefill ?? NaN), // ép về number
            reason: "",
            bankName: "",
            bankAccountNumber: "",
        });
        setShowRefund(true);
    };

    const closeRefund = () => setShowRefund(false);

    const submitRefund = async () => {
        const orderCode = Number(refundForm.orderCode); // number
        const reason = String(refundForm.reason ?? "").trim();
        const bankName = String(refundForm.bankName ?? "").trim();
        const bankAccountNumber = String(refundForm.bankAccountNumber ?? "").replace(/\s+/g, "");

        if (!Number.isFinite(orderCode) || !reason || !bankName || !bankAccountNumber) {
            toast.error("Vui lòng nhập đầy đủ: Mã đơn hàng, Lý do, Ngân hàng, Số tài khoản.");
            return;
        }
        if (!validOrderCodes.has(orderCode)) {
            toast.error("Mã đơn hàng không thuộc tài khoản của bạn.");
            return;
        }
        if (!/^\d{8,20}$/.test(bankAccountNumber)) {
            toast.error("Số tài khoản không hợp lệ (chỉ gồm số, 8–20 ký tự).");
            return;
        }

        try {
            setSending(true);
            await PaymentService.requestRefund({
                userId: MyUser?.my_user?.userId,
                userEmail: MyUser?.my_user?.email,
                orderCode, // JSON number -> BE Long
                reason,
                bankName,
                bankAccountNumber,
            });
            toast.success("Yêu cầu hoàn tiền đã được gửi thành công.");
            setShowRefund(false);
        } catch (e) {
            const pickMessage = (err) => {
                if (!err) return "";
                if (typeof err === "string") return err;
                const data = err?.response?.data;
                if (typeof data === "string") return data;
                if (data?.message && typeof data.message === "string") return data.message;
                if (data?.error && typeof data.error === "string") return data.error;
                if (err?.message) return err.message;
                return "";
            };
            const msg = pickMessage(e) || "Gửi yêu cầu thất bại";
            toast.error(msg);
            console.error("Refund request error:", e);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="container-fluid bg-dark text-white min-vh-100 py-5 px-3 profile-page">
            <div className="row">
                {/* Sidebar */}
                <div className="col-12 col-lg-3 mb-4">
                    <SidebarUserManagement />
                </div>

                {/* Content */}
                <div className="col-12 col-lg-9">
                    <h5 className="mb-1 fw-bold">Lịch sử mua gói</h5>
                    <p className="mb-0">Danh sách các gói đã mua</p>

                    <div className="table-responsive">
                        <table className="table table-dark table-striped">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Mã thanh toán</th>
                                    <th>Tên gói</th>
                                    <th>Ngày thanh toán</th>
                                    <th>Ngày bắt đầu</th>
                                    <th>Ngày hết hạn</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packages.length > 0 ? (
                                    packages.map((pkg, index) => {
                                        const displayOrderCode = Number.isFinite(Number(pkg.orderCode))
                                            ? String(pkg.orderCode)
                                            : "-";
                                        const paidAt = getPaidAt(pkg);
                                        const canRefundTime = within48h(paidAt);
                                        const canRefundCode = Number.isFinite(Number(pkg.orderCode));
                                        const canRefundStatus = String(pkg.status).toUpperCase() === "ACTIVE";
                                        const canRefund = canRefundTime && canRefundCode && canRefundStatus;
                                        return (
                                            <tr key={pkg.id}>
                                                <td>{index + 1}</td>
                                                <td>{displayOrderCode}</td>
                                                <td>{pkg.packageType || "-"}</td>
                                                <td>{formatDate(paidAt)}</td>
                                                <td>{formatDate(pkg.startDate)}</td>
                                                <td>{formatDate(pkg.endDate)}</td>
                                                <td>
                                                    <span
                                                        className={`badge ${pkg.status === "ACTIVE" ? "bg-success" : "bg-secondary"
                                                            }`}
                                                    >
                                                        {pkg.status === "ACTIVE" ? "Đang hoạt động" : "Hết hạn"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {canRefund ? (
                                                        <button
                                                            className="btn btn-sm btn-warning"
                                                            onClick={() => openRefund(Number(pkg.orderCode))}
                                                            disabled={!Number.isFinite(Number(pkg.orderCode))}
                                                            title={
                                                                !Number.isFinite(Number(pkg.orderCode))
                                                                    ? "Thiếu mã đơn"
                                                                    : "Yêu cầu hoàn tiền"
                                                            }
                                                        >
                                                            Hoàn tiền
                                                        </button>
                                                    ) : (
                                                        <span className="text-secondary small">
                                                            {!canRefundStatus || !canRefundCode
                                                                ? "..."
                                                                : "..."}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center">
                                            Bạn chưa mua gói đăng ký nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {showRefund && (
                        <>
                            <div className="modal-backdrop fade show" />
                            <div
                                className="modal fade show"
                                style={{ display: "block", marginTop: "50px" }}
                                tabIndex="-1"
                            >
                                <div className="modal-dialog">
                                    <div className="modal-content text-black">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Yêu cầu hoàn tiền</h5>
                                            <button className="btn-close" onClick={closeRefund} />
                                        </div>
                                        <div className="modal-body">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Mã thanh toán <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    className="form-control"
                                                    value={
                                                        Number.isFinite(refundForm.orderCode)
                                                            ? String(refundForm.orderCode)
                                                            : ""
                                                    }
                                                    readOnly
                                                    placeholder="VD: 1750088588999"
                                                />
                                                <div className="form-text">
                                                    Mã này được lấy từ dòng đơn hàng của bạn.
                                                </div>
                                            </div>

                                            <label className="form-label">
                                                Thông tin tài khoản ngân hàng nhận tiền hoàn{" "}
                                                <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                className="form-control mt-2"
                                                placeholder="Tên ngân hàng (VD: Vietcombank)"
                                                value={refundForm.bankName}
                                                onChange={(e) =>
                                                    setRefundForm((f) => ({ ...f, bankName: e.target.value }))
                                                }
                                            />

                                            <label className="form-label mt-2">
                                                Số tài khoản <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                className="form-control mt-2"
                                                placeholder="Số tài khoản"
                                                inputMode="numeric"
                                                value={refundForm.bankAccountNumber}
                                                onChange={(e) =>
                                                    setRefundForm((f) => ({
                                                        ...f,
                                                        bankAccountNumber: e.target.value,
                                                    }))
                                                }
                                            />

                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Lý do hoàn tiền <span className="text-danger">*</span>
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    rows={4}
                                                    value={refundForm.reason}
                                                    onChange={(e) =>
                                                        setRefundForm((f) => ({ ...f, reason: e.target.value }))
                                                    }
                                                    placeholder="Mô tả rõ vấn đề bạn gặp phải..."
                                                />
                                            </div>

                                            <div className="small text-muted">
                                                Yêu cầu sẽ được gửi đến bộ phận hỗ trợ. Chúng tôi sẽ liên hệ qua
                                                email: <b>{MyUser?.my_user?.email || "-"}</b>
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button
                                                className="btn btn-primary"
                                                onClick={submitRefund}
                                                disabled={sending}
                                            >
                                                {sending ? "Đang gửi..." : "Gửi yêu cầu"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PurchaseHistoryPage;
