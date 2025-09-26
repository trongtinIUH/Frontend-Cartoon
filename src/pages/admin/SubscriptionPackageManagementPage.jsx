import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import SubscriptionPackageService from "../../services/SubscriptionPackageService";

const SubscriptionPackageManagementPage = () => {
    const [subscriptionPackages, setSubscriptionPackages] = useState([]);
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
    }, []);
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
                                <button type="button" className="btn btn-primary  px-5">
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
                                    <tr key={pkg.id}>
                                        <td>{pkg.namePackage}</td>
                                        <td>{pkg.applicablePackageType}</td>
                                        <td>{pkg.durationInDays} tháng</td>
                                        <td>{pkg.features.join(", ")}</td>
                                        <td>
                                            
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SubscriptionPackageManagementPage;