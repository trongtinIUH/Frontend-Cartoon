// src/models/MemberDetailModal.jsx
import React, { useEffect, useState, useRef } from "react";
import UserService from "../services/UserService";

const Backdrop = ({ onClick }) => (
    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} onClick={onClick} />
);

const MemberDetailModal = ({ open, onClose, memberId }) => {
    const [loading, setLoading] = useState(false);
    const [packages, setPackages] = useState([]);
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

    // Tải lịch sử mua gói
    useEffect(() => {
        const fetchPackages = async () => {
            if (!open || !memberId) return;
            setLoading(true);
            setError("");
            try {
                const data = await UserService.getUserSubscriptionPackages(memberId);
                // Đảm bảo là mảng
                setPackages(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("[User] load subscription packages error:", err);
                setError(err?.message || "Không tải được lịch sử mua gói.");
                setPackages([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, [open, memberId]);

    // Helpers
    const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

    if (!open) return null;

    return (
        <>
            <Backdrop onClick={onClose} />
            <div className="modal fade show" style={{ display: "block", zIndex: 1050 }} aria-modal="true" role="dialog">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content" ref={modalRef}>
                        <div className="modal-header">
                            <h5 className="modal-title">Lịch sử mua gói</h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>

                        <div className="modal-body">
                            {loading && (
                                <div className="text-center py-4">
                                    <div className="spinner-border" role="status" />
                                    <div className="mt-2">Đang tải...</div>
                                </div>
                            )}

                            {!loading && error && (
                                <div className="alert alert-danger" role="alert">{error}</div>
                            )}

                            {!loading && !error && (
                                <div className="table-responsive">
                                    <table className="table table-striped table-bordered table-hover">
                                        <thead className="table-light">
                                            <tr>
                                                <th>STT</th>
                                                <th>Loại gói</th>
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

export default MemberDetailModal;
