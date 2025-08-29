import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SubscriptionPackageService from "../services/SubscriptionPackageService"; // nhớ chỉnh lại path import
import { useAuth } from "../context/AuthContext";
import PaymentQRCodeModal from "../models/PaymentQRCodeModal";
import PaymentService from "../services/PaymentService";
import { toast } from "react-toastify";
import PromotionService from "../services/PromotionService";
import axios from "axios";

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { MyUser } = useAuth();
  const { selectedPackage } = location.state || {};

  const [packagesByVip, setPackagesByVip] = useState([]);
  const [selectedDurationPackage, setSelectedDurationPackage] = useState(null);

  const [qrData, setQrData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [voucherInfo, setVoucherInfo] = useState(null);

  useEffect(() => {
    if (!MyUser?.my_user) {
      navigate('/');
      return;
    }
  }, [MyUser, navigate]);

  useEffect(() => {
    // mỗi lần đổi gói → xoá voucher đang áp
    setVoucherCode("");
    setVoucherInfo(null);
    setQrData(null);
    setShowModal(false);
  }, [selectedDurationPackage?.packageId]);


  useEffect(() => {
    const fetchSameVipPackages = async () => {
      try {
        const data = await SubscriptionPackageService.getAllPackages();
        const normalized = data.map(p => ({
          ...p,
          discountedAmount:
            p?.discountedAmount != null && p.discountedAmount < p.amount
              ? p.discountedAmount
              : null, // nếu = amount thì set null
        }));

        const filtered = normalized
          .filter(pkg => pkg.applicablePackageType === selectedPackage.applicablePackageType)
          .sort((a, b) => (a.durationInDays ?? 0) - (b.durationInDays ?? 0));

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
        voucherCode: voucherInfo?.voucherCode || "", // Mã giảm giá nếu có
        returnUrl: "/main#/main",
        cancelUrl: "/main#/payment"
      });
      setQrData(res);
      setShowModal(true);
    } catch (err) {
      console.error("Lỗi khi tạo thanh toán:", err.response?.data || err.message);
      toast.error("Lỗi khi tạo thanh toán. Vui lòng thử lại.");
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

  // lay thong tin voucher
  const fetchVoucherInfo = async () => {
    if (!voucherCode.trim()) return null;
    try {
      const info = await PromotionService.getVoucherInfo(voucherCode.trim().toUpperCase());
      setVoucherInfo(info);
      return info;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setVoucherInfo(null);
        toast.error("Mã voucher không tồn tại hoặc đã hết hiệu lực.");
        return null;
      }
      console.error("Lỗi khi lấy thông tin voucher:", error);
      toast.error("Lỗi khi lấy thông tin voucher.");
      return null;
    }
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá.");
      return;
    }
    if (!selectedDurationPackage) return;
    const info = await fetchVoucherInfo();
    if (!info) return;

    if (info?.minOrderAmount > selectedDurationPackage.discountedAmount) {
      toast.error(`Mã giảm giá không đủ điều kiện.`);
      return;
    }

    if (info?.usedCount >= info?.maxUsedCount) {
      toast.error(`Mã giảm giá đã hết lượt sử dụng.`);
      return;
    }

    try {
      const result = await PromotionService.applyVoucherCode({
        voucherCode: voucherCode.trim(),
        userId: MyUser.my_user.userId,
        packageId: selectedDurationPackage.packageId,
        orderAmount: selectedDurationPackage.discountedAmount,
      });
      console.log(result);
      setVoucherInfo(result);
      toast.success("Áp dụng mã giảm giá thành công.");
    } catch (error) {
      toast.error("Lỗi khi áp dụng mã giảm giá.");
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
                  {packagesByVip.map((pkg) => {
                    const amount = pkg?.amount ?? 0;
                    const discounted = pkg?.discountedAmount ?? null;
                    const hasDiscount = discounted != null && amount > 0 && discounted < amount;

                    return (
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
                          <span>{Math.round((pkg.durationInDays ?? 30) / 30)} tháng</span>
                          <div className="text-end">
                            {hasDiscount && (
                              <span
                                className="badge rounded-pill bg-danger"
                              >
                                Giảm {pkg.appliedDiscountPercent}%
                              </span>
                            )}
                            <span className="ms-3 fw-semibold">
                              {(hasDiscount ? discounted : amount)?.toLocaleString()} VND
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hình thức thanh toán */}
              <div className="card bg-black p-3 text-white mb-3">
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
                    <p className="fw-bold">{selectedDurationPackage?.applicablePackageType}</p>
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
                    <p className="fw-bold">{selectedDurationPackage?.discountedAmount?.toLocaleString() || selectedDurationPackage?.amount?.toLocaleString()} VND</p>
                  </div>
                  <div className="d-flex justify-content-between bg-black">
                    <p>Giảm giá</p>
                    {voucherInfo ? (voucherInfo.discountAmount ?? 0).toLocaleString() : "0"} VNĐ
                  </div>
                  <div className="d-flex bg-black w-100 text-white">
                    <div className="col-8">
                      <input
                        type="text"
                        className="form-control text-white"
                        value={voucherCode}
                        onChange={(e) => {
                          setVoucherCode(e.target.value.toUpperCase());
                          setVoucherInfo(null);
                        }}
                        placeholder="Nhập mã giảm giá"
                      />
                    </div>
                    <div className="col-4 ms-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleApplyVoucher}
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between bg-black">
                    <p>Tổng thanh toán</p>
                    <h3 className="fw-bold text-warning">
                      {voucherInfo?.finalAmount?.toLocaleString() || selectedDurationPackage?.discountedAmount?.toLocaleString()} VND
                    </h3>
                  </div>
                  <div className="text-center mt-3">
                    <button className="btn btn-watch w-100 mt-3 text-black fw-bold"
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
