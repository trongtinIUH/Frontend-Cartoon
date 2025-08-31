import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SidebarUserManagement from '../components/SidebarUserManagement';
import UserService from '../services/UserService';
import {useNavigate } from 'react-router-dom';
const PurchaseHistoryPage = () => {
    const { MyUser } = useAuth();
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);

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
        <div className="d-flex bg-dark text-white min-vh-100 py-5 px-5">
            <SidebarUserManagement />

            <div className="flex-grow-1 p-4" style={{ marginLeft: '50px', marginTop: '100px' }}>
                <h5 className="mb-4 fw-bold">Lịch sử mua gói</h5>
                <p className="mb-4">Danh sách các gói đã mua</p>
                <div className="table-responsive">
                    <table className="table table-dark table-striped">
                        <thead>
                            <tr>
                                <th scope="col">STT</th>
                                <th scope="col">Tên gói</th>
                                <th scope="col">Ngày bắt đầu</th>
                                <th scope="col">Ngày hết hạn</th>
                                <th scope="col">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {packages.length > 0 ? (
                                packages.map((pkg, index) => (
                                    <tr key={pkg.id}>
                                        <th scope="row">{index + 1}</th>
                                        <td>{pkg.packageType}</td>
                                        <td>{new Date(pkg.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(pkg.endDate).toLocaleDateString()}</td>
                                        <td>{pkg.status}</td>
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
    );
};

export default PurchaseHistoryPage;
