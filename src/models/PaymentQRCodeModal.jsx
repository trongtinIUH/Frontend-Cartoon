import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import PaymentService from '../services/PaymentService';
import "../css/PaymentPage.css";

const PaymentQRCodeModal = ({ show, onClose, qrData }) => {
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút = 900 giây
    const [paymentStatus, setPaymentStatus] = useState(null);
    useEffect(() => {
        if (show) {
            setTimeLeft(15 * 60); // Reset mỗi lần mở modal
        }
    }, [show]);

    // Đếm ngược mỗi 1 giây
    useEffect(() => {
        if (!show) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [show]);

    useEffect(() => {
        if (!show || !qrData?.orderCode) return;

        const interval = setInterval(async () => {
            try {
                const res = await PaymentService.getPaymentStatus(qrData.orderCode);
                const status = res.status;
                setPaymentStatus(status);

                if (status === "PAID") {
                    clearInterval(interval); // Dừng polling khi thành công

                    // Gọi webhook 1 lần cuối (nếu cần)
                    await PaymentService.handleWebhook({
                        paymentCode: qrData.orderCode,
                        status: "PAID"
                    });
                    window.location.href = "/main#/main"; // Chuyển hướng về trang chính
                    toast.success("Thanh toán thành công!");
                }
            } catch (err) {
                console.error("Error fetching payment status:", err);
            }
        }, 5000); // Polling mỗi 5 giây

        return () => clearInterval(interval); // Dọn dẹp
    }, [show, qrData?.orderCode, onClose]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (!show || !qrData) return null;

    return (
        <div
            className="d-flex align-items-center justify-content-center"
            style={{
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
            }}
        >
            <div
                className="d-flex flex-column flex-md-row rounded overflow-hidden"
                style={{
                    width: "800px",
                    maxWidth: "95%",
                    backgroundColor: "#000",
                    borderRadius: "44px",
                }}
            >
                {/* Left - QR Code Section */}
                <div
                    className="d-flex flex-column align-items-center justify-content-center text-white p-3 p-md-4"
                    style={{
                        background: "linear-gradient(135deg, #FF0033, #B3001B)",
                        width: "100%", // full trên mobile
                        maxWidth: "100%",
                    }}
                >
                    <img
                        src={`https://img.vietqr.io/image/${qrData.bin}-${qrData.accountNumber}-compact2.png?amount=${qrData.amount}&addInfo=${encodeURIComponent(
                            qrData.description
                        )}`}
                        alt="QR"
                        className="img-fluid"
                        style={{
                            width: "250px",
                            height: "250px",
                            borderRadius: "24px",
                        }}
                    />
                    <p className="mt-3 mb-0" style={{ fontSize: "14px" }}>
                        Thời gian còn:{" "}
                        <span className="fw-bold text-warning">{formatTime(timeLeft)}</span>
                    </p>
                </div>

                {/* Right - Instruction Section */}
                <div
                    className="text-white p-3 p-md-4 position-relative"
                    style={{ backgroundColor: "#1C1C1C", width: "100%" }}
                >
                    <i
                        className="fas fa-times"
                        onClick={onClose}
                        style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            cursor: "pointer",
                        }}
                    ></i>
                    <h6 className="fw-bold mb-4 text-center py-2 py-md-4">
                        Quét mã QR bằng ứng dụng VietQR để thanh toán dịch vụ{" "}
                        <b>Cartoon Too</b>
                    </h6>

                    {/* Steps */}
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className="d-flex align-items-start mb-3 ms-2 ms-md-4"
                            style={{ backgroundColor: '#1C1C1C' }}
                        >
                            <img
                                src={`https://fptplay.vn/images/payments/viet_qr/icon-0${step}.svg`}
                                alt={`Bước ${step}`}
                                style={{ width: 40, marginRight: 10 }}
                            />
                            <div>
                                <div className="fw-bold">Bước {step}</div>
                                <div>
                                    {step === 1
                                        ? "Mở ứng dụng ngân hàng trên điện thoại."
                                        : step === 2
                                            ? "Chọn tính năng quét mã trong ứng dụng."
                                            : "Sử dụng trình quét mã để quét mã QR."}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export default PaymentQRCodeModal;
