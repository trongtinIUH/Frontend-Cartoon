import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SubscriptionPackageService from '../services/SubscriptionPackageService';

const featureTitles = [
  "Phim bộ châu Á mới nhất, chiếu song song",
  "Phim lẻ, anime, thiếu nhi, show đặc sắc",
  "Xem Full HD",
  "Không quảng cáo",
  "Tải xuống"
];

const BuyPackagePage = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await SubscriptionPackageService.getAllPackages();

        // Nhóm theo loại VIP, chọn gói có thời hạn ngắn nhất cho mỗi loại
        const grouped = {};
        data.forEach(pkg => {
          const level = pkg.applicableVipLevel;
          if (!grouped[level] || pkg.durationInDays < grouped[level].durationInDays) {
            grouped[level] = pkg;
          }
        });

        // Sắp xếp SILVER trước GOLD
        const sorted = Object.values(grouped).sort((a, b) => {
          const order = { 'SILVER': 0, 'GOLD': 1 };
          return order[a.applicableVipLevel] - order[b.applicableVipLevel];
        });

        setPackages(sorted);
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
                              backgroundColor: hasFeature ? 'yellow' : 'gray',
                              color: 'black',
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
      </div>
    </div>
  );
};

export default BuyPackagePage;