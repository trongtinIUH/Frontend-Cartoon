import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SidebarUserManagement from '../components/SidebarUserManagement';
import UserService from '../services/UserService';
import { useNavigate } from 'react-router-dom';
import "../css/ProfilePage.css";
const PurchaseHistoryPage = () => {
    const { MyUser } = useAuth();
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN");
    };

    useEffect(() => {
        const userId = MyUser?.my_user?.userId;
        if (!userId) {
            navigate('/');
        }

        UserService.getUserSubscriptionPackages(userId)
            .then(data => {
                const sortedPackages = data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                setPackages(sortedPackages);
            })
            .catch(err => {
                console.error("Error fetching purchase history:", err);
            })
            .finally(() => {
                // Có thể thêm logic nào đó sau khi lấy dữ liệu xong
                console.log("Lấy lịch sử mua gói thành công");
            });
    }, [MyUser]);

    return (
        <div className="container-fluid bg-dark text-white min-vh-100 py-5 px-3 profile-page">
            <div className="row">
                {/* Sidebar */}
                <div className="col-12 col-lg-3 mb-4">
                    <SidebarUserManagement />
                </div>

                {/* Content */}
                <div className="col-12 col-lg-9">
                    <h5 className="mb-4 fw-bold">Lịch sử mua gói</h5>
                    <p className="mb-4">Danh sách các gói đã mua</p>

                    <div className="table-responsive">
                        <table className="table table-dark table-striped">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Tên gói</th>
                                    <th>Ngày bắt đầu</th>
                                    <th>Ngày hết hạn</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packages.length > 0 ? (
                                    packages.map((pkg, index) => (
                                        <tr key={pkg.id}>
                                            <td>{index + 1}</td>
                                            <td>{pkg.packageType}</td>
                                            <td>{formatDate(pkg.startDate)}</td>
                                            <td>{formatDate(pkg.endDate)}</td>
                                            <td>
                                                <span
                                                    className={`badge ${pkg.status === "ACTIVE" ? "bg-success" : "bg-secondary"
                                                        }`}
                                                >
                                                    {pkg.status === "ACTIVE" ? "Đang hoạt động" : "Hết hạn"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            Bạn chưa mua gói đăng ký nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default PurchaseHistoryPage;
