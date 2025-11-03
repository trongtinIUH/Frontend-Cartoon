import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/BuyPackagePage.css';
import SubscriptionPackageService from '../services/SubscriptionPackageService';

const featureTitles = [
  "Phim bộ châu Á mới nhất, chiếu song song",
  "Phim lẻ, anime, thiếu nhi, show đặc sắc",
  "Xem phim chất lượng 4K",
  "Xem phim trên nhiều thiết bị",
  "Không giới hạn lượt xem",
  "Không quảng cáo trong VOD"
];

const BuyPackagePage = () => {
  const navigate = useNavigate();
  const { MyUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!MyUser?.my_user) {
        navigate('/');
        return;
      }
      
      setLoading(true);
      setError(null);
      const startTime = Date.now();
      
      try {
        const data = await SubscriptionPackageService.getAllPackages();
        const fetchTime = Date.now() - startTime;

        // Nhóm theo loại VIP, chọn gói có thời hạn ngắn nhất cho mỗi loại
        const grouped = {};
        data.forEach(pkg => {
          const level = pkg.applicablePackageType;
          if (!grouped[level] || pkg.durationInDays < grouped[level].durationInDays) {
            grouped[level] = pkg;
          }
        });

        // Sắp xếp theo amount
        const sorted = Object.values(grouped).sort((a, b) => a.amount - b.amount);

        setPackages(sorted);
      } catch (error) {
        console.error('[BuyPackage] ❌ Error fetching packages:', error);
        setError('Không thể tải danh sách gói. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [MyUser, navigate]);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    navigate('/payment', { state: { selectedPackage: pkg } });
  };

  return (
    <div className="buy-package-page">
      <div className="container">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-3 text-white">Đang tải danh sách gói...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="alert alert-danger text-center" role="alert">
            {error}
            <button 
              className="btn btn-primary ms-3" 
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Package Selection */}
        {!loading && !error && (
          <div className="mb-5">
            <div className="table-responsive mt-5">
            <table className="table table-dark buy-package-table">
              <thead className="p-0 m-0">
                <tr className="bg-secondary">
                  <th className="text-start">
                    <h2 className="mb-0 text-white">Mua gói</h2>
                  </th>
                  {packages.map((pkg) => (
                    <th key={pkg.id} className="text-center align-middle p-0 m-0">
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.namePackage}
                        className="img-fluid rounded-top"
                        style={{
                          width: '100%',
                          height: '150px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      <div className="fw-bold text-white">
                        {pkg.amount?.toLocaleString('vi-VN')}vnđ / tháng
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {featureTitles.map((title, index) => (
                  <tr key={index}>
                    <td className="text-start">{title}</td>
                    {packages.map((pkg) => {
                      const hasFeature = pkg.features?.includes(title);
                      return (
                        <td key={pkg.packageId}>
                          <div
                            className={`feature-badge ${hasFeature ? 'active' : 'inactive'}`}
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
                        className="btn btn-outline-secondary btn-choose-package"
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
        )}
      </div>
    </div>
  );
};

export default BuyPackagePage;