import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import PricingService from "../../services/PricingService";
import CreatePriceListModal from "../../models/CreatePriceListModal";
import PriceListDetailModal from "../../models/PriceListDetailModal";
import UpdatePriceListEndModal from "../../models/UpdatePriceListEndModal";

const PriceListManagementPage = () => {
    const [priceLists, setPriceLists] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
    const [selectedPriceList, setSelectedPriceList] = useState(null);

    useEffect(() => {
        fetchPriceLists();
    }, []);

    const fetchPriceLists = async () => {
        try {
            const data = await PricingService.getAllPriceList();
            setPriceLists(data);
        } catch (error) {
            console.error("Failed to fetch price lists:", error);
        }
    };
    const handleOpenCreateModal = () => {
        setIsCreateModalOpen(true);
    };

    const handleOpenDetailModal = (priceList) => {
        setSelectedPriceList(priceList);
        setIsDetailModalOpen(true);
    };

    const handleOpenExtendModal = (priceList) => {
        setSelectedPriceList(priceList);
        setIsExtendModalOpen(true);
    };

    return (
        <div className="d-flex bg-white min-vh-100">
            <Sidebar />
            <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: '250px' }}>
                <h2 className="mb-4 fw-bold">QUẢN LÝ BẢNG GIÁ</h2>
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
                                            placeholder="Tìm kiếm bảng giá"
                                            name="keyword"
                                        />
                                        <span type="submit" className="btn btn-outline-secondary rounded-end">
                                            <i className="fa fa-search"></i>
                                        </span>
                                    </div>
                                </form>
                            </div>
                            <div className="mt-2 mt-md-0">
                                <button type="button" className="btn btn-primary  px-5" onClick={handleOpenCreateModal}>
                                    <i className="fa fa-plus me-2"></i>
                                    Tạo bảng giá
                                </button>
                            </div>
                        </div>
                    </div>
                    { /* Card body with movie list table */}
                    <div className="card-body">
                        <table className="table table-striped table-bordered table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Tên bảng giá</th>
                                    <th>Ngày bắt đầu</th>
                                    <th>Ngày kết thúc</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priceLists.map((priceList) => (
                                    <tr key={priceList.id}>
                                        <td>{priceList.name}</td>
                                        <td>{priceList.startDate}</td>
                                        <td>{priceList.endDate}</td>
                                        <td>
                                            <span className={`badge ${priceList.status === 'ACTIVE' ? 'bg-success' : 'bg-danger'}`}>
                                                {priceList.status === 'ACTIVE' ? 'Hoạt động' : 'Hết hạn'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="btn btn-sm btn-warning me-2" onClick={() => handleOpenDetailModal(priceList)}
                                                style={{ borderRadius: '10px', padding: '5px 10px', fontSize: '14px' }}>
                                                <i className="fa fa-eye"></i> Xem chi tiết
                                            </span>
                                            <span
                                                className="btn btn-sm btn-warning"
                                                onClick={() => handleOpenExtendModal(priceList)}
                                                style={{ borderRadius: 10, padding: "5px 10px", fontSize: '14px' }}
                                                disabled={priceList.status !== "ACTIVE"}
                                                title={priceList.status !== "ACTIVE" ? "Chỉ gia hạn với bảng giá ACTIVE" : ""}
                                            >
                                                <i className="fa-solid fa-calendar-plus"></i> Gia hạn thời gian
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <CreatePriceListModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={fetchPriceLists}
                />
                <PriceListDetailModal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    priceList={selectedPriceList}
                />
                <UpdatePriceListEndModal
                    isOpen={isExtendModalOpen}
                    onClose={() => setIsExtendModalOpen(false)}
                    onSaved={fetchPriceLists}
                    priceList={selectedPriceList}
                />
            </div>
        </div>
    );
};
export default PriceListManagementPage;