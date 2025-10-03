import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Table, Alert, Spinner } from "react-bootstrap";
import { toast } from "react-toastify";
import { FaPlus, FaTrash, FaEdit, FaFilm } from "react-icons/fa";
import SeasonService from "../services/SeasonService";

const ModelManageSeason = ({ isOpen, onClose, movieId, movieTitle, movieType }) => {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    seasonNumber: '',
    title: '',
    description: '',
    releaseYear: new Date().getFullYear()
  });

  useEffect(() => {
    if (isOpen && movieId) {
      loadSeasons();
    }
  }, [isOpen, movieId]);

  const loadSeasons = async () => {
    setLoading(true);
    try {
      const data = await SeasonService.getSeasonsByMovie(movieId);
      // Sắp xếp theo seasonNumber
      const sortedSeasons = (data || []).sort((a, b) => a.seasonNumber - b.seasonNumber);
      setSeasons(sortedSeasons);
    } catch (error) {
      console.error("Error loading seasons:", error);
      toast.error("Không thể tải danh sách phần phim");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      seasonNumber: '',
      title: '',
      description: '',
      releaseYear: new Date().getFullYear()
    });
    setEditingSeason(null);
    setShowAddForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.seasonNumber) {
      toast.error("Vui lòng nhập số phần");
      return;
    }

    // Validation cho SINGLE movie
    if (movieType === 'SINGLE' && parseInt(formData.seasonNumber) !== 1) {
      toast.error("Phim lẻ (SINGLE) chỉ được có Phần 1");
      return;
    }

    try {
      const seasonData = {
        movieId,
        seasonNumber: parseInt(formData.seasonNumber),
        title: formData.title || `Phần ${formData.seasonNumber}`,
        description: formData.description,
        releaseYear: formData.releaseYear ? parseInt(formData.releaseYear) : null
      };

      await SeasonService.createSeason(seasonData);
      toast.success("Tạo phần phim thành công!");
      resetForm();
      loadSeasons();
    } catch (error) {
      console.error("Error creating season:", error);
      toast.error(error.response?.data || "Có lỗi xảy ra khi tạo phần phim");
    }
  };

  const handleDelete = async (seasonNumber) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Phần ${seasonNumber}? Điều này sẽ xóa tất cả tập phim trong phần này.`)) {
      return;
    }

    try {
      await SeasonService.deleteSeason(movieId, seasonNumber);
      toast.success("Xóa phần phim thành công!");
      loadSeasons();
    } catch (error) {
      console.error("Error deleting season:", error);
      toast.error("Có lỗi xảy ra khi xóa phần phim");
    }
  };

  const getNextSeasonNumber = () => {
    if (seasons.length === 0) return 1;
    // Phim SINGLE chỉ được có Season 1
    if (movieType === 'SINGLE') return 1;
    const maxSeason = Math.max(...seasons.map(s => s.seasonNumber));
    return maxSeason + 1;
  };

  const handleAddNew = () => {
    setFormData(prev => ({
      ...prev,
      seasonNumber: getNextSeasonNumber()
    }));
    setShowAddForm(true);
  };

  return (
    <Modal show={isOpen} onHide={onClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaFilm className="me-2" />
          Quản lý Phần phim - {movieTitle}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
            <div className="mt-2">Đang tải...</div>
          </div>
        ) : (
          <>
            {/* Header actions */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0">
                Danh sách phần phim ({seasons.length} phần)
              </h6>
              {/* Ẩn nút thêm nếu là SINGLE movie và đã có Season 1 */}
              {!(movieType === 'SINGLE' && seasons.length > 0) && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleAddNew}
                  disabled={showAddForm}
                >
                  <FaPlus className="me-1" />
                  {movieType === 'SINGLE' ? 'Tạo Phần 1' : 'Thêm phần mới'}
                </Button>
              )}
            </div>

            {/* Cảnh báo cho SINGLE movie */}
            {movieType === 'SINGLE' && (
              <Alert variant="warning" className="mb-3">
                <strong>Phim lẻ (SINGLE):</strong> Chỉ được có 1 phần duy nhất (Phần 1). 
                Bạn có thể xóa và tạo lại Phần 1 nếu cần.
              </Alert>
            )}

            {/* Add/Edit Form */}
            {showAddForm && (
              <Alert variant="light" className="border">
                <h6 className="alert-heading">
                  {editingSeason ? "Chỉnh sửa phần phim" : "Thêm phần phim mới"}
                </h6>
                <Form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-3">
                      <Form.Label>Số phần *</Form.Label>
                      <Form.Control
                        type="number"
                        name="seasonNumber"
                        value={formData.seasonNumber}
                        onChange={handleInputChange}
                        min="1"
                        max={movieType === 'SINGLE' ? "1" : undefined}
                        required
                        disabled={movieType === 'SINGLE'}
                        placeholder={movieType === 'SINGLE' ? "1 (cố định)" : "1, 2, 3..."}
                      />
                      {movieType === 'SINGLE' && (
                        <Form.Text className="text-muted">
                          Phim lẻ chỉ có Phần 1
                        </Form.Text>
                      )}
                    </div>
                    <div className="col-md-5">
                      <Form.Label>Tên phần</Form.Label>
                      <Form.Control
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder={`Phần ${formData.seasonNumber || 1}`}
                      />
                    </div>
                    <div className="col-md-4">
                      <Form.Label>Năm phát hành</Form.Label>
                      <Form.Control
                        type="number"
                        name="releaseYear"
                        value={formData.releaseYear}
                        onChange={handleInputChange}
                        min="1900"
                        max="2030"
                      />
                    </div>
                    <div className="col-12">
                      <Form.Label>Mô tả</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Mô tả cho phần phim này..."
                      />
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    <Button type="submit" variant="success" size="sm">
                      {editingSeason ? "Cập nhật" : "Tạo phần"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm"
                      onClick={resetForm}
                    >
                      Hủy
                    </Button>
                  </div>
                </Form>
              </Alert>
            )}

            {/* Seasons List */}
            {seasons.length > 0 ? (
              <div className="table-responsive">
                <Table hover size="sm">
                  <thead className="table-light">
                    <tr>
                      <th style={{width: '80px'}}>Phần</th>
                      <th>Tên phần</th>
                      <th style={{width: '100px'}}>Năm</th>
                      <th>Mô tả</th>
                      <th style={{width: '100px'}}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasons.map((season) => (
                      <tr key={season.seasonId}>
                        <td>
                          <span className="badge bg-primary">
                            Phần {season.seasonNumber}
                          </span>
                        </td>
                        <td className="fw-semibold">{season.title}</td>
                        <td>{season.releaseYear || '-'}</td>
                        <td>
                          <small className="text-muted">
                            {season.description ? 
                              (season.description.length > 50 ? 
                                season.description.substring(0, 50) + '...' : 
                                season.description
                              ) : 
                              'Chưa có mô tả'
                            }
                          </small>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(season.seasonNumber)}
                              title="Xóa phần"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ) : (
              <Alert variant="info" className="text-center">
                <h6>Chưa có phần phim nào</h6>
                <p className="mb-0">Nhấn "Thêm phần mới" để tạo phần đầu tiên cho bộ phim này.</p>
              </Alert>
            )}
          </>
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModelManageSeason;