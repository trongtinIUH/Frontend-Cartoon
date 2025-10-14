import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PaymentService from "../../services/PaymentService";
import { fmtDateTime } from "../../utils/date";
import PaymentDetailModal from "../../models/PaymentDetailModal";

const PaymentManagementPage = () => {
    const [payments, setPayments] = useState([]);
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Load dữ liệu
    const loadPayments = async () => {
        try {
            const data = await PaymentService.getAllPayments(page, size, keyword);
            // sap xep giam dan theo createdAt
            data.items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setPayments(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error("Lỗi load payments:", err);
        }
    };

    // Gọi khi page hoặc keyword thay đổi
    useEffect(() => {
        loadPayments();
    }, [page, keyword]);

    // Tổng số trang
    const totalPages = Math.ceil(total / size);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // reset về trang 1 khi search
        loadPayments();
    };

    const handleOpenDetail = (paymentId) => {
        setSelectedPayment(paymentId);
    };

    const fmtVND = (n) => (n != null ? n.toLocaleString("vi-VN", { style: "currency", currency: "VND" }) : "—");

    return (
        <div className="d-flex bg-white min-vh-100">
            <Sidebar />
            <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: "250px" }}>
                <h2 className="mb-4 fw-bold">QUẢN LÝ THANH TOÁN</h2>
                <div className="card">
                    {/* Header có ô search */}
                    <div className="card-header">
                        <div
                            className="d-flex justify-content-between align-items-center"
                            style={{ flexWrap: "wrap" }}
                        >
                            <div style={{ maxWidth: "400px", width: "100%" }}>
                                <form role="search" onSubmit={handleSearch}>
                                    <div className="input-group">
                                        <input
                                            type="search"
                                            className="form-control rounded-start"
                                            placeholder="Tìm kiếm thanh toán"
                                            name="keyword"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                        />
                                        <span type="submit" className="btn btn-outline-secondary rounded-end">
                                            <i className="fa fa-search"></i>
                                        </span>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Body: bảng danh sách */}
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
                                    payments.map((payment) => (
                                        <tr key={payment.paymentId}>
                                            <td>{payment.paymentCode}</td>
                                            <td>{payment.userId}</td>
                                            <td>{payment.packageId}</td>
                                            <td>{payment.provider}</td>
                                            <td>{fmtVND(payment.finalAmount)}</td>
                                            <td title={payment.createdAt}>{fmtDateTime(payment.createdAt)}</td>
                                            <td title={payment.paidAt}>
                                                {payment.paidAt ? fmtDateTime(payment.paidAt) : <span className="badge bg-secondary">Chưa thanh toán</span>}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge ${payment.status === 'SUCCESS'
                                                        ? 'bg-success'
                                                        : payment.status === 'CANCELED'
                                                            ? 'bg-danger'
                                                            : "bg-secondary"
                                                        }`}
                                                >
                                                    {payment.status === 'SUCCESS'
                                                        ? 'Thành công'
                                                        : payment.status === 'CANCELED'
                                                            ? 'Không thành công'
                                                            : 'Đang chờ xử lý'}
                                                </span>
                                            </td>
                                            <td><button
                                                className="btn btn-sm btn-outline-warning"
                                                style={{ borderRadius: 10, padding: '5px 10px', fontSize: 14 }}
                                                onClick={() => handleOpenDetail(payment.paymentId)}
                                            >
                                                <i className="fa fa-eye" /> Xem chi tiết
                                            </button>
                                            </td>
                                        </tr>
                                    ))
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
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(page - 1)}
                                        >
                                            {"<"}
                                        </button>
                                    </li>

                                    {[...Array(totalPages).keys()].map((i) => (
                                        <li
                                            key={i}
                                            className={`page-item ${page === i + 1 ? "active" : ""}`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() => setPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        </li>
                                    ))}

                                    <li
                                        className={`page-item ${page === totalPages ? "disabled" : ""
                                            }`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(page + 1)}
                                        >
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
            </div>
        </div>
    );
};

export default PaymentManagementPage;
