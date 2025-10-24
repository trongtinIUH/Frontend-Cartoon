import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SidebarUserManagement from '../components/SidebarUserManagement';
import UserService from '../services/UserService';
import { useNavigate } from 'react-router-dom';
import "../css/ProfilePage.css";
import { toast } from 'react-toastify';
import PaymentService from '../services/PaymentService';
const PurchaseHistoryPage = () => {
    const { MyUser } = useAuth();
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN");
    };

    useEffect(() => {
        const userId = MyUser?.my_user?.userId;
        if (!userId) {
            navigate('/');
        }

        UserService.getUserSubscriptionPackages(userId)
            .then(data => {
                const sortedPackages = data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                setPackages(sortedPackages);
            })
            .catch(err => {
                console.error("Error fetching purchase history:", err);
            });
    }, [MyUser]);

    const [showRefund, setShowRefund] = useState(false);
    const [refundForm, setRefundForm] = useState({
        orderCode: "",
        reason: "",
        bankName: "",
        bankAccountNumber: ""
    });
    const [sending, setSending] = useState(false);

    const openRefund = (orderCodePrefill) => {
        setRefundForm({
            orderCode: orderCodePrefill || "",
            reason: "",
            bankName: "",
            bankAccountNumber: ""
        });
        setShowRefund(true);
    };

    const closeRefund = () => setShowRefund(false);

    const submitRefund = async () => {
        const orderCode = refundForm.orderCode?.trim();
        const reason = refundForm.reason?.trim();
        const bankName = refundForm.bankName?.trim();
        const bankAccountNumber = (refundForm.bankAccountNumber || "").replace(/\s+/g, "");

        if (!orderCode || !reason || !bankName || !bankAccountNumber) {
            toast.error("Vui lòng nhập đầy đủ: Mã đơn hàng, Lý do, Ngân hàng, Số tài khoản.");
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
                orderCode,
                reason,
                bankName,
                bankAccountNumber,
            });
            toast.success("Yêu cầu hoàn tiền đã được gửi thành công.");
            setShowRefund(false);
        } catch (e) {
            // rút gọn message từ nhiều dạng lỗi khác nhau
            const pickMessage = (err) => {
                if (!err) return "";
                // TH1: service ném string thuần
                if (typeof err === "string") return err;
                // TH2: AxiosError có response.data
                const data = err?.response?.data;
                if (typeof data === "string") return data;
                if (data?.message && typeof data.message === "string") return data.message;
                if (data?.error && typeof data.error === "string") return data.error;
                // TH3: AxiosError .message
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
                                    <th>Tên gói</th>
                                    <th>Ngày bắt đầu</th>
                                    <th>Ngày hết hạn</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packages.length > 0 ? (
                                    packages.map((pkg, index) => (
                                        <tr key={pkg.id}>
                                            <td>{index + 1}</td>
                                            <td>{pkg.packageType}</td>
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
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            Bạn chưa mua gói đăng ký nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <span className="btn btn-warning" onClick={() => openRefund()}>
                        Yêu cầu hoàn tiền
                    </span>
                    {showRefund && (
                        <>
                            <div className="modal-backdrop fade show" />
                            <div className="modal fade show" style={{ display: "block", marginTop: "50px" }} tabIndex="-1">
                                <div className="modal-dialog">
                                    <div className="modal-content text-black">
                                        <div className="modal-header">
                                            <h5 className="modal-title">Yêu cầu hoàn tiền</h5>
                                            <button className="btn-close" onClick={closeRefund} />
                                        </div>
                                        <div className="modal-body">
                                            <div className="mb-3">
                                                <label className="form-label">Mã đơn hàng <span className="text-danger">*</span></label>
                                                <input
                                                    className="form-control"
                                                    value={refundForm.orderCode}
                                                    onChange={e => setRefundForm(f => ({ ...f, orderCode: e.target.value }))}
                                                    placeholder="VD: 1750088588999"
                                                />
                                            </div>
                                            <label className="form-label">Thông tin tài khoản ngân hàng nhận tiền hoàn <span className="text-danger">*</span></label>
                                            <input
                                                className="form-control mt-2"
                                                placeholder="Tên ngân hàng (VD: Vietcombank)"
                                                value={refundForm.bankName}
                                                onChange={(e) => setRefundForm(f => ({ ...f, bankName: e.target.value }))}
                                            />
                                            <label className="form-label mt-2">Số tài khoản <span className="text-danger">*</span></label>
                                            <input
                                                className="form-control mt-2"
                                                placeholder="Số tài khoản"
                                                inputMode="numeric"
                                                value={refundForm.bankAccountNumber}
                                                onChange={(e) => setRefundForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
                                            />
                                            <div className="mb-3">
                                                <label className="form-label">Lý do hoàn tiền <span className="text-danger">*</span></label>
                                                <textarea
                                                    className="form-control"
                                                    rows={4}
                                                    value={refundForm.reason}
                                                    onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))}
                                                    placeholder="Mô tả rõ vấn đề bạn gặp phải..."
                                                />
                                            </div>
                                            <div className="small text-muted">
                                                Yêu cầu sẽ được gửi đến bộ phận hỗ trợ. Chúng tôi sẽ liên hệ qua email: <b>{MyUser?.my_user?.email || "-"}</b>
                                            </div>
                                        </div>
                                        <div className="modal-footer">
                                            <button className="btn btn-primary" onClick={submitRefund} disabled={sending}>
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
