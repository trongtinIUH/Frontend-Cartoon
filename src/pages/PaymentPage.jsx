import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import SubscriptionPackageService from "../services/SubscriptionPackageService"; // nhớ chỉnh lại path import
import { useAuth } from "../context/AuthContext";
import PaymentQRCodeModal from "../models/PaymentQRCodeModal";
import PaymentService from "../services/PaymentService";
import { toast } from "react-toastify";

const PaymentPage = () => {
  const location = useLocation();
  const { MyUser } = useAuth();
  const { selectedPackage } = location.state || {};

  const [packagesByVip, setPackagesByVip] = useState([]);
  const [selectedDurationPackage, setSelectedDurationPackage] = useState(null);

  const [qrData, setQrData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchSameVipPackages = async () => {
      try {
        const data = await SubscriptionPackageService.getAllPackages();
        const filtered = data.filter(pkg => pkg.applicableVipLevel === selectedPackage.applicableVipLevel).sort((a, b) => a.durationInDays - b.durationInDays);
        setPackagesByVip(filtered);
        setSelectedDurationPackage(selectedPackage);
      } catch (error) {
        console.error("Lỗi khi lấy gói theo VIP:", error);
      }
    };

    if (selectedPackage) {
      fetchSameVipPackages();
    }
  }, [selectedPackage]);

  if (!selectedPackage) {
    return <div className="text-white text-center mt-5">Không có gói nào được chọn.</div>;
  }

  const handleCreatePayment = async () => {
    try {
      const token = localStorage.getItem("idToken"); // token bạn lưu khi login
      if (!token) {
        alert("Vui lòng đăng nhập trước khi thanh toán!");
        return;
      }

      const res = await PaymentService.createPayment({
        userId: MyUser.my_user.userId,
        packageId: selectedDurationPackage.packageId,
        returnUrl: "/main#/main",
        cancelUrl: "/main#/payment"
      });
      setQrData(res);
      setShowModal(true);
    } catch (err) {
      console.error("Lỗi khi tạo thanh toán:", err.response?.data || err.message);
    }
  };

  const handleCancelPayment = async () => {
    try {
      if (!qrData?.orderCode) {
        alert("Không có mã đơn hàng để hủy.");
        return;
      }
      await PaymentService.cancelPayment(qrData.orderCode);
      setShowModal(false);
      setQrData(null);
    } catch (err) {
      console.error("Lỗi khi hủy thanh toán:", err.response?.data || err.message);
    }
  };

  return (
    <div className="container-fluid bg-dark text-white min-vh-100 py-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <h2 className="mb-4 mt-4">Thanh toán</h2>
          <div className="row">
            {/* Bên trái */}
            <div className="col-md-7">
              {/* Gói đã chọn */}
              <div className="card bg-black p-3 text-white mb-4">
                <h5>Chọn thời hạn gói {selectedPackage.vipLevel}</h5>
                <div className="card-body">
                  {packagesByVip.map((pkg) => (
                    <div
                      key={pkg.packageId}
                      className={`d-flex align-items-center mb-3 rounded p-3 bg-dark ${selectedDurationPackage?.packageId === pkg.packageId ? "border border-dark" : ""
                        }`}
                      onClick={() => setSelectedDurationPackage(pkg)}
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        className="form-check-input me-3"
                        checked={selectedDurationPackage?.packageId === pkg.packageId}
                        readOnly
                      />
                      <div className="d-flex justify-content-between w-100 bg-dark">
                        <span>{pkg.durationInDays / 30} tháng</span>
                        <span>{pkg.amount.toLocaleString()} VND</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hình thức thanh toán */}
              <div className="card bg-black p-3 text-white">
                <h5>Chọn hình thức thanh toán</h5>
                <div className="d-flex align-items-center bg-black p-3 rounded">
                  <input
                    type="radio"
                    className="form-check-input me-3"
                    name="paymentMethod"
                    defaultChecked
                  />
                  <img
                    src="https://images.fptplay53.net/media/photo/OTT/2024/06/24/logovietqr24-06-2024_15g35-58.png"
                    alt="vietqr"
                    width="50"
                    className="me-3"
                  />
                  <div>
                    <strong>VietQR</strong><br />
                    <small>Thanh toán nhanh qua mã QR hỗ trợ hầu hết ngân hàng nội địa.</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Bên phải */}
            <div className="col-md-5">
              <div className="card bg-black p-3 text-white">
                <h5>Thông tin thanh toán</h5>
                <div className="card-body">
                  <div className="d-flex justify-content-between bg-black">
                    <p>Tài khoản</p>
                    <p className="fw-bold">{MyUser?.my_user.userName}</p>
                  </div> <hr />
                  <div className="d-flex justify-content-between bg-black">
                    <p>Tên gói</p>
                    <p className="fw-bold">{selectedDurationPackage?.applicableVipLevel}</p>
                  </div>
                  <div className="d-flex justify-content-between bg-black">
                    <p>Thời hạn</p>
                    <p className="fw-bold">{selectedDurationPackage?.durationInDays / 30} tháng</p>
                  </div>
                  <div className="d-flex justify-content-between bg-black">
                    <p>Gói dịch vụ</p>
                    <p className="fw-bold">Gói dịch vụ Cartoon Too</p>
                  </div> <hr />
                  <div className="d-flex justify-content-between bg-black">
                    <p>Giá gói</p>
                    <p className="fw-bold">{selectedDurationPackage?.amount.toLocaleString()} VND</p>
                  </div>
                  <div className="d-flex justify-content-between bg-black">
                    <p>Giảm giá</p>
                    <p className="fw-bold">0 VND</p>
                  </div> <hr />

                  <div className="d-flex justify-content-between bg-black">
                    <p>Tổng thanh toán</p>
                    <h3 className="fw-bold text-warning">
                      {selectedDurationPackage?.amount.toLocaleString()} VND
                    </h3>
                  </div>
                  <div className="text-center mt-3">
                    <button className="btn btn-warning w-100 mt-3 text-black fw-bold"
                      onClick={handleCreatePayment}>
                      Thanh toán
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <PaymentQRCodeModal show={showModal} onClose={handleCancelPayment} qrData={qrData} />
      </div>
    </div>
  );
};

export default PaymentPage;
