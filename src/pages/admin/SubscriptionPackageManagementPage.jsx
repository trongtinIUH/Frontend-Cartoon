import { useCallback, useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import SubscriptionPackageService from "../../services/SubscriptionPackageService";
import CreateSubscriptionPackageModal from "../../models/CreateSubscriptionPackageModal";

const SubscriptionPackageManagementPage = () => {
    const [subscriptionPackages, setSubscriptionPackages] = useState([]);
    const [page, setPage] = useState(1);
    const [size] = useState(4);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState("");
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);

    // Load dữ liệu
    const loadSubscriptionPackages = async () => {
        try {
            const data = await SubscriptionPackageService.getAll(page, size, keyword);
            setSubscriptionPackages(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error("Lỗi load gói đăng ký:", err);
        }
    };

    // Gọi khi page hoặc keyword thay đổi
    useEffect(() => {
        loadSubscriptionPackages();
    }, [page, keyword]);

    // Tổng số trang
    const totalPages = Math.ceil(total / size);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // reset về trang 1 khi search
        loadSubscriptionPackages();
    };

    const handleCreateModalOpen = () => {
        setEditingPkg(null);
        setCreateModalOpen(true);
    };

    const handleEditModalOpen = (pkg) => {
        setEditingPkg(pkg);
        setCreateModalOpen(true);
    };

    const handleDelete = async (packageId) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa gói đăng ký này?")) {
            try {
                await SubscriptionPackageService.deletePackage(packageId);
                setSubscriptionPackages((prev) => prev.filter((p) => p.packageId !== packageId));
            } catch (err) {
                console.error("Lỗi xóa gói đăng ký:", err);
            }
        }
    };

    return (
        <div className="d-flex bg-white min-vh-100">
            <Sidebar />
            <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: '250px' }}>
                <h2 className="mb-4 fw-bold">QUẢN LÝ GÓI</h2>
                <div className="card">
                    {/* Card header with search and add button */}
                    <div className="card-header">
                        <div
                            className="d-flex justify-content-between align-items-center"
                            style={{ flexWrap: "wrap" }}
                        >
                            <div style={{ maxWidth: "400px", width: "100%" }}>
                                <form role="search" onSubmit={handleSearch}>
                                    <div className="input-group">
                                        <input
                                            type="search"
                                            className="form-control rounded-start"
                                            placeholder="Tìm kiếm gói đăng ký"
                                            name="keyword"
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
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
                                    <th>ID</th>
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
                                        <td>{pkg.packageId}</td>
                                        <td>{pkg.packageName}</td>
                                        <td>{pkg.applicablePackageType}</td>
                                        <td>{pkg.durationInDays} ngày</td>
                                        <td>{pkg.features.join(", ")}</td>
                                        <td style={{ minWidth: '200px' }}>
                                            <span className="btn btn-sm btn-outline-primary"
                                                style={{
                                                    borderRadius: 10, padding: "5px 10px", fontSize: "14px"
                                                }}
                                                onClick={() => handleEditModalOpen(pkg)}><i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa</span>
                                            <span className="btn btn-sm btn-outline-danger ms-2"
                                                style={{
                                                    borderRadius: 10, padding: "5px 10px", fontSize: "14px"
                                                }}
                                                onClick={() => handleDelete(pkg.packageId)}><i className="fa-solid fa-trash"></i> Xóa</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <nav>
                                <ul className="pagination justify-content-center">
                                    <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(page - 1)}
                                        >
                                            {"<"}
                                        </button>
                                    </li>

                                    {[...Array(totalPages).keys()].map((i) => (
                                        <li
                                            key={i}
                                            className={`page-item ${page === i + 1 ? "active" : ""}`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() => setPage(i + 1)}
                                            >
                                                {i + 1}
                                            </button>
                                        </li>
                                    ))}

                                    <li
                                        className={`page-item ${page === totalPages ? "disabled" : ""
                                            }`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(page + 1)}
                                        >
                                            {">"}
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}
                    </div>
                </div>
                <CreateSubscriptionPackageModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onCreated={loadSubscriptionPackages}
                    initialData={editingPkg}
                    existingIds={subscriptionPackages.map(p => p.packageId)}
                />
            </div>
        </div>
    );
};
export default SubscriptionPackageManagementPage;