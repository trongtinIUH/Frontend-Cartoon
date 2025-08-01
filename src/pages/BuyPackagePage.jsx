import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const featureTitles = [
  "Phim bộ châu Á mới nhất, chiếu song song",
  "Phim lẻ, anime, thiếu nhi, show đặc sắc",
  "Xem Full HD",
  "Không quảng cáo",
  "Tải xuống"
];

const BuyPackagePage = () => {
  const navigate = useNavigate();
  const { MyUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch('http://localhost:8080/subscription-packages/all');
        const data = await res.json();
        const filtered = data.filter(pkg => pkg.durationInDays === 30);
        setPackages(filtered);
      } catch (error) {
        console.error('Lỗi khi lấy gói:', error);
      }
    };

    fetchPackages();
  }, []);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    navigate('/payment', { state: { selectedPackage: pkg } });
  };

  return (
    <div className="min-vh-100 bg-dark text-white" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
      <div className="container">
        {/* Page Header */}
        <div className="text-center mb-5">
          <h1 className="display-4 fw-bold mb-3">
            <span className="text-warning">Nâng cấp</span>
            <span className="text-info"> VIP</span>
          </h1>
          <p className="lead text-light">Trải nghiệm xem phim tuyệt vời nhất với các gói VIP của chúng tôi</p>
        </div>

        {/* Package Selection */}
        <div className="mb-5">
          <div className="table-responsive mt-5">
            <table className="table table-striped text-center table-dark align-middle">
              <thead>
                <tr>
                  <th className="text-start"><h2>Mua gói</h2></th>
                  {packages.map((pkg) => (
                    <th key={pkg.id}>
                      <div className="fw-bold fs-5">{pkg.applicableVipLevel}</div>
                      <div>{pkg.amount.toLocaleString()}vnđ / tháng</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureTitles.map((title, index) => (
                  <tr key={index}>
                    <td className="text-start">{title}</td>
                    {packages.map((pkg) => {
                      const hasFeature = pkg.features.includes(title);
                      return (
                        <td key={pkg.packageId}>
                          <div
                            style={{
                              display: 'inline-block',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: hasFeature ? '#ff4b0aff' : 'gray',
                              color: hasFeature ? 'white' : 'black',
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              lineHeight: '18px',
                              textAlign: 'center',
                            }}
                          >
                            {hasFeature ? '✓' : '✕'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td></td>
                  {packages.map((pkg) => (
                    <td key={pkg.packageId}>
                      <span
                        type="button"
                        className="btn btn-outline-secondary px-3 text-white"
                        onClick={() => handleSelectPackage(pkg)}
                      >
                        Chọn gói này
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Method */}
        {/* {selectedPackage && (
          <div className="mb-5">
            <h2 className="mb-4">Phương thức thanh toán</h2>
            <div className="row g-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="col-lg-3 col-md-6">
                  <div 
                    className={`card text-white cursor-pointer ${
                      paymentMethod === method.id ? 'border-warning border-3 bg-warning bg-opacity-25' : 'border-secondary'
                    }`}
                    style={{ 
                      backgroundColor: paymentMethod === method.id ? 'rgba(255,193,7,0.2)' : 'rgba(255,255,255,0.1)', 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <div className="card-body d-flex align-items-center">
                      <span className="me-3" style={{ fontSize: '2rem' }}>{method.icon}</span>
                      <div className="flex-grow-1">
                        <h6 className="card-title mb-0">{method.name}</h6>
                      </div>
                      <div className={`text-${paymentMethod === method.id ? 'warning' : 'muted'}`} style={{ fontSize: '1.5rem' }}>
                        {paymentMethod === method.id ? '●' : '○'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Order Summary */}
        {/* {selectedPackage && (
          <div className="mb-5">
            <h2 className="mb-4">Tóm tắt đơn hàng</h2>
            <div className="row justify-content-center">
              <div className="col-lg-6">
                <div className="card text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <span>Gói VIP:</span>
                      <span className="fw-bold">{selectedPackage.name}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span>Thời hạn:</span>
                      <span className="fw-bold">{selectedPackage.duration}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                      <span>Phương thức:</span>
                      <span className="fw-bold">
                        {paymentMethods.find(m => m.id === paymentMethod)?.name}
                      </span>
                    </div>
                    <hr className="text-secondary" />
                    <div className="d-flex justify-content-between">
                      <span className="h5">Tổng cộng:</span>
                      <span className="h4 fw-bold text-warning">
                        {formatPrice(selectedPackage.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )} */}

        {/* Action Buttons */}
        {/* <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
          <button 
            className="btn btn-outline-light btn-lg px-4"
            onClick={() => navigate('/main')}
          >
            ← Quay lại
          </button>
          
          {selectedPackage && (
            <button 
              className="btn btn-success btn-lg px-4"
              onClick={handlePayment}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang xử lý...
                </>
              ) : (
                `💳 Thanh toán ${formatPrice(selectedPackage.price)}`
              )}
            </button>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default BuyPackagePage;