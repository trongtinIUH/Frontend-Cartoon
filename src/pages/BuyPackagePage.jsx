import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BuyPackagePage = () => {
  const navigate = useNavigate();
  const { MyUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [isLoading, setIsLoading] = useState(false);

  const packages = [
    {
      id: 'silver',
      name: 'VIP Silver',
      price: 99000,
      duration: '1 tháng',
      features: [
        'Xem phim không quảng cáo',
        'Chất lượng HD',
        'Tải xuống offline',
        'Hỗ trợ 24/7'
      ],
      color: 'secondary',
      popular: false
    },
    {
      id: 'gold',
      name: 'VIP Gold',
      price: 199000,
      duration: '3 tháng',
      features: [
        'Tất cả tính năng Silver',
        'Chất lượng 4K Ultra HD',
        'Xem trên 4 thiết bị',
        'Phim độc quyền',
        'Ưu tiên hỗ trợ'
      ],
      color: 'warning',
      popular: true
    },
    {
      id: 'platinum',
      name: 'VIP Platinum',
      price: 499000,
      duration: '1 năm',
      features: [
        'Tất cả tính năng Gold',
        'Xem không giới hạn',
        'Phim ra mắt sớm',
        'Tặng kèm merchandise',
        'Hỗ trợ VIP 24/7'
      ],
      color: 'light',
      popular: false
    }
  ];

  const paymentMethods = [
    { id: 'momo', name: 'MoMo', icon: '💳', color: 'danger' },
    { id: 'banking', name: 'Internet Banking', icon: '🏦', color: 'primary' },
    { id: 'visa', name: 'Visa/Mastercard', icon: '💳', color: 'info' },
    { id: 'zalopay', name: 'ZaloPay', icon: '📱', color: 'success' }
  ];

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handlePayment = async () => {
    if (!selectedPackage) {
      alert('Vui lòng chọn gói VIP!');
      return;
    }

    setIsLoading(true);
    
    // Simulate payment process
    setTimeout(() => {
      alert(`Thanh toán thành công gói ${selectedPackage.name}!`);
      setIsLoading(false);
      navigate('/main');
    }, 2000);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
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
          <h2 className="text-center mb-4">Chọn gói VIP</h2>
          <div className="row g-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="col-lg-4 col-md-6">
                <div 
                  className={`card h-100 text-white position-relative cursor-pointer ${
                    selectedPackage?.id === pkg.id ? 'border-warning border-3 shadow-lg' : 'border-secondary'
                  } ${pkg.popular ? 'border-danger border-3' : ''}`}
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    cursor: 'pointer',
                    transform: pkg.popular ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handlePackageSelect(pkg)}
                >
                  {pkg.popular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <span className="badge bg-danger px-3 py-2 rounded-pill">
                        🔥 Phổ biến nhất
                      </span>
                    </div>
                  )}
                  
                  <div className="card-body text-center d-flex flex-column">
                    <div className="mb-3">
                      <div className={`text-${pkg.color}`} style={{ fontSize: '3rem' }}>
                        👑
                      </div>
                      <h3 className="card-title h4 fw-bold">{pkg.name}</h3>
                      <div className="d-flex align-items-baseline justify-content-center mb-3">
                        <span className={`h2 fw-bold text-${pkg.color} me-2`}>
                          {formatPrice(pkg.price)}
                        </span>
                        <span className="text-muted">/{pkg.duration}</span>
                      </div>
                    </div>

                    <ul className="list-unstyled text-start flex-grow-1">
                      {pkg.features.map((feature, index) => (
                        <li key={index} className="mb-2 d-flex align-items-center">
                          <span className="text-success me-2 fw-bold">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button 
                      className={`btn ${selectedPackage?.id === pkg.id ? 'btn-warning' : `btn-outline-${pkg.color}`} btn-lg w-100 mt-3`}
                      onClick={() => handlePackageSelect(pkg)}
                    >
                      {selectedPackage?.id === pkg.id ? '✓ Đã chọn' : 'Chọn gói'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        {selectedPackage && (
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
        )}

        {/* Order Summary */}
        {selectedPackage && (
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
        )}

        {/* Action Buttons */}
        <div className="d-flex flex-column flex-md-row gap-3 justify-content-center">
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
        </div>
      </div>
    </div>
  );
};

export default BuyPackagePage;