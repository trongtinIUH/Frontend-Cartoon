import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import PaymentService from "../../services/PaymentService";
import { fmtDateTime } from "../../utils/date";
import PaymentDetailModal from "../../models/PaymentDetailModal";
import { toast } from "react-toastify";

const TABS = {
    PAID: { key: "PAID", label: "Đã thanh toán", status: "SUCCESS" },
    REFUND: { key: "REFUND", label: "Hoàn tiền", status: "REFUNDED" },
};

const PaymentManagementPage = () => {
    const [payments, setPayments] = useState([]);
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    // --- Tab state ---
    const [tab, setTab] = useState(TABS.PAID.key);
    const statusFilter = useMemo(
        () => (tab === TABS.REFUND.key ? TABS.REFUND.status : TABS.PAID.status),
        [tab]
    );

    const fmtVND = (n) =>
        n != null
            ? n.toLocaleString("vi-VN", { style: "currency", currency: "VND" })
            : "—";

    const loadPayments = async () => {
        try {
            const data = await PaymentService.getAllPayments(page, size, keyword, statusFilter, {
                startDate: fromDate || undefined,
                endDate: toDate || undefined,
            });
            setPayments(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error("Lỗi load payments:", err);
        }
    };

    // load khi page/keyword/tab đổi
    useEffect(() => {
        loadPayments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, keyword, statusFilter, fromDate, toDate]);

    const totalPages = Math.ceil(total / size);

    const handleSearch = (e) => {

        e.preventDefault();
        if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
            alert("Ngày bắt đầu không được lớn hơn ngày kết thúc");
            return;
        }
        setPage(1); // reset về trang 1 khi search
        // loadPayments();
    };

    const handleOpenDetail = (paymentId) => setSelectedPayment(paymentId);

    const switchTab = (nextTab) => {
        if (tab === nextTab) return;
        setTab(nextTab);
        setPage(1); // đổi tab thì về trang 1
    };

    return (
        <div className="d-flex bg-white min-vh-100">
            <Sidebar />
            <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: "250px" }}>
                <h2 className="mb-4 fw-bold">QUẢN LÝ THANH TOÁN</h2>

                {/* Tabs */}
                <ul className="nav nav-tabs mb-3">
                    <li className="nav-item">
                        <button
                            className={`nav-link text-black ${tab === TABS.PAID.key ? "action-item" : ""}`}
                            onClick={() => switchTab(TABS.PAID.key)}
                        >
                            {TABS.PAID.label}
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            className={`nav-link text-black ${tab === TABS.REFUND.key ? "action-item" : ""}`}
                            onClick={() => switchTab(TABS.REFUND.key)}
                        >
                            {TABS.REFUND.label}
                        </button>
                    </li>
                </ul>

                <div className="card">
                    {/* Header: search */}
                    <div className="card-header">
                        <div
                            className="d-flex justify-content-between align-items-center"
                            style={{ flexWrap: "wrap" }}
                        >
                            <div style={{ maxWidth: "800px", width: "100%" }}>
                                <form role="search" onSubmit={handleSearch}>
                                    <div className="input-group">
                                        <input
                                            type="search"
                                            className="form-control rounded-start"
                                            placeholder={`Tìm kiếm ${tab === TABS.PAID.key ? "đã thanh toán" : "hoàn tiền"}`}
                                            name="keyword"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                        />
                                        <span type="submit" className="btn btn-outline-secondary rounded-end me-2">
                                            <i className="fa fa-search"></i>
                                        </span>

                                        <span className="input-group-text ms-2">Từ</span>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            max={toDate || undefined}
                                        />
                                        <span className="input-group-text">Đến</span>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            min={fromDate || undefined}
                                        />
                                        {(fromDate || toDate || keyword) && (
                                            <span
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => { setKeyword(""); setFromDate(""); setToDate(""); setPage(1); }}
                                                title="Xóa bộ lọc"
                                            >
                                                <i className="fa fa-times" />
                                            </span>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Body: table */}
                    <div className="card-body">
                        <table className="table table-striped table-bordered table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Mã thanh toán</th>
                                    <th>Người dùng</th>
                                    <th>Gói</th>
                                    <th>Nhà cung cấp</th>
                                    <th>Tổng tiền</th>
                                    <th>Ngày tạo thanh toán</th>
                                    <th>Ngày thanh toán</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.length > 0 ? (
                                    payments.map((payment) => {
                                        const st = (payment.status || "").toUpperCase();
                                        const isPaid = st === "SUCCESS";
                                        const isRefunded = st === "REFUNDED";
                                        const badgeClass =
                                            isPaid
                                                ? "bg-success"
                                                : isRefunded
                                                    ? "bg-info"
                                                    : st === "CANCELED"
                                                        ? "bg-danger"
                                                        : "bg-secondary";
                                        const badgeText =
                                            isPaid
                                                ? "Thành công"
                                                : isRefunded
                                                    ? "Đã hoàn tiền"
                                                    : st === "CANCELED"
                                                        ? "Không thành công"
                                                        : "Đang chờ xử lý";

                                        return (
                                            <tr key={payment.paymentId}>
                                                <td>{payment.paymentCode}</td>
                                                <td>{payment.userId}</td>
                                                <td>{payment.packageId}</td>
                                                <td>{payment.provider}</td>
                                                <td>{fmtVND(payment.finalAmount)}</td>
                                                <td title={payment.createdAt}>
                                                    {fmtDateTime(payment.createdAt)}
                                                </td>
                                                <td title={payment.paidAt}>
                                                    {payment.paidAt ? (
                                                        fmtDateTime(payment.paidAt)
                                                    ) : (
                                                        <span className="badge bg-secondary">Chưa thanh toán</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`badge ${badgeClass}`}>{badgeText}</span>
                                                </td>
                                                <td>
                                                    <span
                                                        className="btn btn-sm btn-outline-warning"
                                                        style={{ borderRadius: 10, padding: "5px 10px", fontSize: 14 }}
                                                        onClick={() => handleOpenDetail(payment.paymentId)}
                                                    >
                                                        <i className="fa fa-eye" /> Xem chi tiết
                                                    </span>
                                                    {String(payment.status).toUpperCase() === 'SUCCESS' && (
                                                        <span
                                                            className="btn btn-sm btn-outline-danger mt-2"
                                                            onClick={async () => {
                                                                if (!window.confirm(`Xác nhận đánh dấu đơn #${payment.paymentCode} đã hoàn tiền?`)) return;
                                                                try {
                                                                    await PaymentService.approveRefund(payment.paymentCode);
                                                                    await loadPayments();
                                                                    toast.success('Đã cập nhật đơn sang REFUNDED & vô hiệu gói liên quan');
                                                                } catch (e) {
                                                                    toast.error(e?.response?.data || 'Thao tác thất bại');
                                                                }
                                                            }}
                                                        >
                                                            <i className="fa fa-undo" /> Xác nhận hoàn tiền
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="text-center">
                                            Không có dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <nav>
                                <ul className="pagination justify-content-center">
                                    <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                                        <button className="page-link" onClick={() => setPage(page - 1)}>
                                            {"<"}
                                        </button>
                                    </li>

                                    {[...Array(totalPages).keys()].map((i) => (
                                        <li
                                            key={i}
                                            className={`page-item ${page === i + 1 ? "active" : ""}`}
                                        >
                                            <button className="page-link" onClick={() => setPage(i + 1)}>
                                                {i + 1}
                                            </button>
                                        </li>
                                    ))}

                                    <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                                        <button className="page-link" onClick={() => setPage(page + 1)}>
                                            {">"}
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </div>
                </div>

                <PaymentDetailModal
                    open={selectedPayment !== null}
                    onClose={() => setSelectedPayment(null)}
                    paymentId={selectedPayment}
                />
            </div >
        </div >
    );
};

export default PaymentManagementPage;
