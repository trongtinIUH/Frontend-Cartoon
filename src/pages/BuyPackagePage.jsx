import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      if (!MyUser?.my_user) {
        navigate('/');
        return;
      }
      
      // Check cache first
      const cacheKey = 'packages_buy_page';
      const cachedData = sessionStorage.getItem(cacheKey);
      const cacheTime = sessionStorage.getItem(`${cacheKey}_time`);
      
      // Cache valid for 10 minutes
      if (cachedData && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 10 * 60 * 1000) {
          setPackages(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      }
      
      try {
        setLoading(true);
        const data = await SubscriptionPackageService.getAllPackages();

        // Optimize grouping with Map
        const packageMap = new Map();
        for (const pkg of data) {
          const level = pkg.applicablePackageType;
          const current = packageMap.get(level);
          if (!current || pkg.durationInDays < current.durationInDays) {
            packageMap.set(level, pkg);
          }
        }

        // Sort by amount
        const sorted = Array.from(packageMap.values()).sort((a, b) => (a.amount || 0) - (b.amount || 0));

        setPackages(sorted);
        
        // Save to cache
        sessionStorage.setItem(cacheKey, JSON.stringify(sorted));
        sessionStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      } catch (error) {
        console.error('Lỗi khi lấy gói:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [MyUser, navigate]);

  const handleSelectPackage = useCallback((pkg) => {
    navigate('/payment', { state: { selectedPackage: pkg } });
  }, [navigate]);

  if (loading) {
    return (
      <div className="buy-package-page">
        <div className="container d-flex bg-dark justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-white">Đang tải gói dịch vụ...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="buy-package-page">
      <div className="container">
        {/* Package Selection */}
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
                        {pkg.amount?.toLocaleString('vi-VN')}vnđ
                      </div>
                      <div className="text-secondary small">1 tháng</div>
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
      </div>
    </div>
  );
};

export default BuyPackagePage;