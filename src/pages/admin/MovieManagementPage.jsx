import React from "react";
import Sidebar from "../../components/Sidebar";

const MovieManagementPage = () => {
  const movies = [
    { id: 1, title: 'Avengers: Endgame', genre: 'Hành động', releaseYear: 2019 },
    { id: 2, title: 'Parasite', genre: 'Kịch tính', releaseYear: 2019 },
    { id: 3, title: 'Joker', genre: 'Tâm lý', releaseYear: 2019 },
  ];

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1 ms-250 p-4" style={{ marginLeft: '250px' }}>
        <h2 className="mb-4 fw-bold">QUẢN LÝ PHIM</h2>
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
                      placeholder="Tìm kiếm phim..."
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
                  Thêm mới
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
                  <th>Tiêu đề</th>
                  <th>Thể loại</th>
                  <th>Năm phát hành</th>
                  <th>Trạng thái</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.id}>
                    <td>{movie.id}</td>
                    <td>{movie.title}</td>
                    <td>{movie.genre}</td>
                    <td>{movie.releaseYear}</td>
                    <td>
                      <span className="badge bg-success">Hoạt động</span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger">
                        <i className="fa fa-trash"></i> Xóa
                      </button>
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

export default MovieManagementPage;
