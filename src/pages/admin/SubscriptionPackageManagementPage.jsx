import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import SubscriptionPackageService from "../../services/SubscriptionPackageService";
import CreateSubscriptionPackageModal from "../../models/CreateSubscriptionPackageModal";

const SubscriptionPackageManagementPage = () => {
    const [subscriptionPackages, setSubscriptionPackages] = useState([]);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    
    const loadSubscriptionPackages = async () => {
        try {
            const data = await SubscriptionPackageService.getAllPackages();
            setSubscriptionPackages(data);
        } catch (err) {
            console.error("Lỗi load gói đăng ký:", err);
        }
    }
    useEffect(() => {
        loadSubscriptionPackages();
    }, [loadSubscriptionPackages]);

    const handleCreateModalOpen = () => {
        setCreateModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa gói đăng ký này?")) {
            try {
                await SubscriptionPackageService.deletePackage(id);
                setSubscriptionPackages(subscriptionPackages.filter(pkg => pkg.id !== id));
            } catch (err) {
                console.error("Lỗi xóa gói đăng ký:", err);
            }
        }
    };

    return (
        <div className="d-flex bg-white min-vh-100">
            <Sidebar />
            <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: '250px' }}>
                <h2 className="mb-4 fw-bold">QUẢN LÝ KHUYẾN MÃI</h2>
                <div className="card">
                    {/* Card header with search and add button */}
                    <div className="card-header">
                        <div
                            className="d-flex justify-content-between align-items-center"
                            style={{ flexWrap: "wrap" }}
                        >
                            <div style={{ maxWidth: "400px", width: "100%" }}>
                                <form role="search">
                                    <div className="input-group">
                                        <input
                                            type="search"
                                            className="form-control rounded-start"
                                            placeholder="Tìm kiếm gói đăng ký"
                                            name="keyword"
                                        />
                                        <span type="submit" className="btn btn-outline-secondary rounded-end">
                                            <i className="fa fa-search"></i>
                                        </span>
                                    </div>
                                </form>
                            </div>
                            <div className="mt-2 mt-md-0">
                                <button type="button" className="btn btn-primary  px-5" onClick={handleCreateModalOpen}>
                                    <i className="fa fa-plus me-2"></i>
                                    Tạo gói đăng ký
                                </button>
                            </div>
                        </div>
                    </div>
                    { /* Card body with movie list table */}
                    <div className="card-body">
                        <table className="table table-striped table-bordered table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Tên gói đăng ký</th>
                                    <th>Loại gói</th>
                                    <th>Thời gian</th>
                                    <th>Đặc điểm</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subscriptionPackages.map((pkg) => (
                                    <tr key={pkg.packageId}>
                                        <td>{pkg.namePackage}</td>
                                        <td>{pkg.applicablePackageType}</td>
                                        <td>{pkg.durationInDays} ngày</td>
                                        <td>{pkg.features.join(", ")}</td>
                                        <td style={{ minWidth: '150px' }}>
                                            <span className="btn btn-sm btn-warning me-2">Sửa</span>
                                            <span className="btn btn-sm btn-danger" onClick={() => handleDelete(pkg.packageId)}>Xóa</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <CreateSubscriptionPackageModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onCreated={loadSubscriptionPackages}
                />
            </div>
        </div>
    );
};
export default SubscriptionPackageManagementPage;