import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

  useEffect(() => {
    const fetchPackages = async () => {
      if (!MyUser?.my_user) {
        navigate('/');
        return;
      }
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

        // Sắp xếp theo amount
        const sorted = Object.values(grouped).sort((a, b) => a.amount - b.amount);

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
    <div className="min-vh-100 bg-dark text-white" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
      <div className="container">
        {/* Package Selection */}
        <div className="mb-5">
          <div className="table-responsive mt-5">
            <table className="table table-striped text-center table-dark align-middle">
              <thead className="p-0 m-0">
                <tr>
                  <th className="text-start">
                    <h2 className="mb-0 text-white">Mua gói</h2>
                  </th>
                  {packages.map((pkg) => (
                    <th key={pkg.id} className="text-center align-middle p-0 m-0">
                      <img
                        src={pkg.namePackage}
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
                        {pkg.amount.toLocaleString('vi-VN')}vnđ
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
                      const hasFeature = pkg.features.includes(title);
                      return (
                        <td key={pkg.packageId}>
                          <div
                            style={{
                              display: 'inline-block',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: hasFeature ? '#4bc1fa' : 'gray',
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