import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import UserService from "../../services/UserService";
import avatar_default from "../../image/default_avatar.jpg";

const MemberManagementPage = () => {
    const [members, setMembers] = useState([]);
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [total, setTotal] = useState(0);
    const [keyword, setKeyword] = useState("");

    // Load dữ liệu
    const loadUsers = async () => {
        try {
            const data = await UserService.getAllUsers(page, size, keyword);
            setMembers(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error("Lỗi load users:", err);
        }
    };

    // Gọi khi page hoặc keyword thay đổi
    useEffect(() => {
        loadUsers();
    }, [page, keyword]);

    // Tổng số trang
    const totalPages = Math.ceil(total / size);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // reset về trang 1 khi search
        loadUsers();
    };

    return (
        <div className="d-flex bg-white min-vh-100">
            <Sidebar />
            <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: "250px" }}>
                <h2 className="mb-4 fw-bold">QUẢN LÝ THÀNH VIÊN</h2>
                <div className="card">
                    {/* Header có ô search */}
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
                                            placeholder="Tìm kiếm khuyến mãi"
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
                        </div>
                    </div>

                    {/* Body: bảng danh sách */}
                    <div className="card-body">
                        <table className="table table-striped table-bordered table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Ảnh đại diện</th>
                                    <th>Tên thành viên</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Vai trò</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.length > 0 ? (
                                    members.map((member) => (
                                        <tr key={member.id}>
                                            <td>
                                                <img
                                                    src={member.avatarUrl || avatar_default}
                                                    alt={member.userName}
                                                    className="img-fluid rounded-circle"
                                                    style={{ width: "50px", height: "50px" }}
                                                />
                                            </td>
                                            <td>{member.userName}</td>
                                            <td>{member.email}</td>
                                            <td>{member.phoneNumber}</td>
                                            <td>{member.role}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center">
                                            Không có dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
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
            </div>
        </div>
    );
};

export default MemberManagementPage;
