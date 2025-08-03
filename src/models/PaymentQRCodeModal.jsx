import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

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

        const interval = setInterval(() => {
            axios.get(`http://localhost:8080/payment/${qrData.orderCode}`)
                .then((res) => {
                    const status = res.data.status;
                    console.log("Fetched payment status:", status);
                    setPaymentStatus(status);

                    if (status === "PAID") {
                        clearInterval(interval); // Dừng polling khi thành công

                        // Gọi webhook 1 lần cuối (nếu cần)
                        axios.post("http://localhost:8080/payment/webhook", {
                            orderCode: qrData.orderCode,
                            status: "PAID"
                        })
                            .then((res) => {
                                console.log("Webhook called after payment:", res.data);
                            })
                            .catch((err) => {
                                console.error("Webhook error:", err);
                            })
                            .finally(() => {
                                onClose(); // Đóng modal
                                window.location.href = "/main#/main"; // Chuyển hướng về trang chính
                                toast.success("Thanh toán thành công!");
                            });
                    }
                })
                .catch((err) => {
                    console.error("Error fetching payment status:", err);
                });
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
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            <div className="d-flex rounded overflow-hidden" style={{ width: '800px', maxWidth: '95%', backgroundColor: '#000', borderRadius: '44px' }}>
                {/* Left - QR Code Section */}
                <div
                    className="d-flex flex-column align-items-center justify-content-center text-white"
                    style={{ background: 'linear-gradient(135deg, #FF0033, #B3001B)', width: '40%', padding: '24px' }}
                >
                    <img
                        src={`https://img.vietqr.io/image/${qrData.bin}-${qrData.accountNumber}-compact2.png?amount=${qrData.amount}&addInfo=${encodeURIComponent(qrData.description)}`}
                        alt="QR"
                        style={{ width: '250px', height: '250px', borderRadius: '24px' }}
                    />
                    <p className="mt-4 mb-0" style={{ fontSize: '14px' }}>
                        Thời gian còn: <span className="fw-bold text-warning">{formatTime(timeLeft)}</span>
                    </p>
                </div>

                {/* Right - Instruction Section */}
                <div
                    className="text-white p-4 position-relative"
                    style={{ backgroundColor: '#1C1C1C', width: '70%' }}
                >
                    <i className="fas fa-times" onClick={onClose} style={{ position: 'absolute', top: '12px', right: '12px', cursor: 'pointer' }}></i>
                    <h5 className="fw-bold mb-4 text-center py-4">
                        Quét mã QR bằng ứng dụng VietQR để thanh toán dịch vụ <b>Cartoon Too</b>
                    </h5>
                    <div className="d-flex align-items-start mb-3 ms-4"
                        style={{ backgroundColor: '#1C1C1C' }}>
                        <img src="https://fptplay.vn/images/payments/viet_qr/icon-01.svg" alt="Bước 1" style={{ width: 50, marginRight: 12 }} />
                        <div>
                            <div className="fw-bold">Bước 1</div>
                            <div>Mở ứng dụng ngân hàng trên điện thoại.</div>
                        </div>
                    </div>
                    <div className="d-flex align-items-start mb-3 ms-4" style={{ backgroundColor: '#1C1C1C' }}>
                        <img src="https://fptplay.vn/images/payments/viet_qr/icon-02.svg" alt="Bước 2" style={{ width: 50, marginRight: 12 }} />
                        <div>
                            <div className="fw-bold">Bước 2</div>
                            <div>Chọn tính năng quét mã trong ứng dụng.</div>
                        </div>
                    </div>
                    <div className="d-flex align-items-start mb-3 ms-4" style={{ backgroundColor: '#1C1C1C' }}>
                        <img src="https://fptplay.vn/images/payments/viet_qr/icon-03.svg" alt="Bước 3" style={{ width: 50, marginRight: 12 }} />
                        <div>
                            <div className="fw-bold">Bước 3</div>
                            <div>Sử dụng trình quét mã để quét mã QR.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default PaymentQRCodeModal;
