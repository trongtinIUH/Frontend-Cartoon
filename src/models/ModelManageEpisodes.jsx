import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Table, Alert, Spinner, Card, Row, Col } from "react-bootstrap";
import { toast } from "react-toastify";
import { FaPlus, FaTrash, FaEdit, FaFilm, FaList, FaVideo, FaClosedCaptioning } from "react-icons/fa";
import SeasonService from "../services/SeasonService";
import EpisodeService from "../services/EpisodeService";
import MovieService from "../services/MovieService";
import SubtitleManager from "../components/SubtitleManager";
import "../css/ModelManageEpisodes.css";

const VIDEO_TYPES = [
  "video/mp4","video/avi","video/mkv","video/webm",
  "video/quicktime","video/x-msvideo","video/x-matroska"
];

const RE_TITLE = /^[\p{L}\p{N}\s\-:,.!?]{1,200}$/u;

const ModelManageEpisodes = ({ isOpen, onClose, movieId, movieTitle, movieType }) => {
  // Season management
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [showAddSeasonForm, setShowAddSeasonForm] = useState(false);
  
  // Episode management  
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showAddEpisodeForm, setShowAddEpisodeForm] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [editingSeason, setEditingSeason] = useState(null);
  
  // Subtitle management
  const [selectedEpisodeForSubtitles, setSelectedEpisodeForSubtitles] = useState(null);

  // Forms
  const [seasonForm, setSeasonForm] = useState({
    seasonNumber: '',
    title: '',
    description: '',
    releaseYear: new Date().getFullYear()
  });

  const [episodeForm, setEpisodeForm] = useState({
    title: "",
    episodeNumber: "",
    video: null
  });

  const [loading, setLoading] = useState(false);

  const isValidVideo = (f) => f && VIDEO_TYPES.includes(f.type);
  
  const maxSeasonNumber = useMemo(
    () => (seasons.length ? Math.max(...seasons.map(s => Number(s.seasonNumber) || 0)) : 0),
    [seasons]
  );

  const nextEpisodeNumber = useMemo(() => {
    if (!episodes?.length) return 1;
    const maxNo = Math.max(...episodes.map(e => Number(e.episodeNumber) || 0));
    return (isFinite(maxNo) ? maxNo : 0) + 1;
  }, [episodes]);

  useEffect(() => {
    if (isOpen && movieId) {
      loadSeasons();
    }
  }, [isOpen, movieId]);

  const loadSeasons = async () => {
    setLoadingSeasons(true);
    try {
      const data = await SeasonService.getSeasonsByMovie(movieId);
      const sortedSeasons = (data || []).sort((a, b) => a.seasonNumber - b.seasonNumber);
      setSeasons(sortedSeasons);
      
      // Auto select latest season hoặc season đầu tiên
      if (sortedSeasons.length > 0 && !selectedSeasonId) {
        const latestSeason = sortedSeasons[sortedSeasons.length - 1];
        setSelectedSeasonId(latestSeason.seasonId);
        loadEpisodes(latestSeason.seasonId);
      }
    } catch (error) {
      console.error("Error loading seasons:", error);
      toast.error("Không thể tải danh sách phần phim");
    } finally {
      setLoadingSeasons(false);
    }
  };

  const loadEpisodes = async (seasonId) => {
    if (!seasonId) {
      setEpisodes([]);
      return;
    }
    
    setLoadingEpisodes(true);
    try {
      const data = await EpisodeService.getEpisodesBySeasonId(seasonId);
      const sortedEpisodes = (data || []).sort((a, b) => a.episodeNumber - b.episodeNumber);
      setEpisodes(sortedEpisodes);
    } catch (error) {
      console.error("Error loading episodes:", error);
      setEpisodes([]);
      toast.error("Không thể tải danh sách tập phim");
    } finally {
      setLoadingEpisodes(false);
    }
  };

  const handleSeasonSelect = (seasonId) => {
    setSelectedSeasonId(seasonId);
    loadEpisodes(seasonId);
    // Reset episode form
    setEditingEpisode(null);
    setShowAddEpisodeForm(false);
    setSelectedEpisodeForSubtitles(null);
  };

  // Season management functions
  const resetSeasonForm = () => {
    setSeasonForm({
      seasonNumber: '',
      title: '',
      description: '',
      releaseYear: new Date().getFullYear()
    });
    setShowAddSeasonForm(false);
    setEditingSeason(null);
  };

  const handleSeasonInputChange = (e) => {
    const { name, value } = e.target;
    setSeasonForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSeason = () => {
    const nextSeasonNumber = maxSeasonNumber + 1;
    setSeasonForm(prev => ({
      ...prev,
      seasonNumber: nextSeasonNumber,
      title: `Phần ${nextSeasonNumber}`
    }));
    setEditingSeason(null);
    setShowAddSeasonForm(true);
  };

  const handleEditSeason = (season) => {
    setSeasonForm({
      seasonNumber: season.seasonNumber,
      title: season.title,
      description: season.description || '',
      releaseYear: season.releaseYear || new Date().getFullYear()
    });
    setEditingSeason(season);
    setShowAddSeasonForm(true);
  };

  const handleSeasonSubmit = async (e) => {
    e.preventDefault();
    
    if (!seasonForm.seasonNumber) {
      toast.error("Vui lòng nhập số phần");
      return;
    }

    // Validation cho SINGLE movie
    if (movieType === 'SINGLE' && parseInt(seasonForm.seasonNumber) !== 1) {
      toast.error("Phim lẻ (SINGLE) chỉ được có Phần 1");
      return;
    }

    setLoading(true);
    try {
      const seasonData = {
        movieId,
        seasonNumber: parseInt(seasonForm.seasonNumber),
        title: seasonForm.title || `Phần ${seasonForm.seasonNumber}`,
        description: seasonForm.description,
        releaseYear: seasonForm.releaseYear ? parseInt(seasonForm.releaseYear) : null
      };

      if (editingSeason) {
        await SeasonService.updateSeason(movieId, editingSeason.seasonNumber, seasonData);
        toast.success("Cập nhật phần phim thành công!");
      } else {
        const newSeason = await SeasonService.createSeason(seasonData);
        toast.success("Tạo phần phim thành công!");
        // Auto select the new season
        setSelectedSeasonId(newSeason.seasonId);
        loadEpisodes(newSeason.seasonId);
      }
      
      resetSeasonForm();
      await loadSeasons();
    } catch (error) {
      console.error("Error saving season:", error);
      toast.error(error.response?.data || `Có lỗi xảy ra khi ${editingSeason ? 'cập nhật' : 'tạo'} phần phim`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSeason = async (seasonNumber) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Phần ${seasonNumber}? Điều này sẽ xóa tất cả tập phim trong phần này.`)) {
      return;
    }

    setLoading(true);
    try {
      await SeasonService.deleteSeason(movieId, seasonNumber);
      toast.success("Xóa phần phim thành công!");
      await loadSeasons();
      
      // Reset selected season if deleted
      const deletedSeason = seasons.find(s => s.seasonNumber === seasonNumber);
      if (deletedSeason && selectedSeasonId === deletedSeason.seasonId) {
        setSelectedSeasonId("");
        setEpisodes([]);
      }
    } catch (error) {
      console.error("Error deleting season:", error);
      toast.error("Có lỗi xảy ra khi xóa phần phim");
    } finally {
      setLoading(false);
    }
  };

  // Episode management functions
  const resetEpisodeForm = () => {
    setEpisodeForm({
      title: "",
      episodeNumber: nextEpisodeNumber.toString(),
      video: null
    });
    setEditingEpisode(null);
    setShowAddEpisodeForm(false);
    setSelectedEpisodeForSubtitles(null);
  };

  const handleEpisodeInputChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === "file") {
      const f = files?.[0];
      if (!f) return;
      if (!isValidVideo(f)) {
        toast.error("Chỉ chấp nhận mp4, avi, mkv, webm, mov…");
        return;
      }
      setEpisodeForm(prev => ({ ...prev, video: f }));
    } else {
      setEpisodeForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddEpisode = () => {
    if (!selectedSeasonId) {
      toast.error("Vui lòng chọn phần phim trước");
      return;
    }
    
    // Kiểm tra: phim lẻ chỉ được có 1 tập
    if (movieType === "SINGLE" && episodes.length > 0) {
      toast.error("Phim lẻ chỉ có 1 tập duy nhất. Không thể thêm tập mới.");
      return;
    }
    
    setEpisodeForm({
      title: "",
      episodeNumber: nextEpisodeNumber.toString(),
      video: null
    });
    setEditingEpisode(null);
    setShowAddEpisodeForm(true);
  };

  const handleEditEpisode = async (episode) => {
    try {
      const data = await EpisodeService.getEpisodeBySeasonAndNumber(episode.seasonId || selectedSeasonId, episode.episodeNumber);
      setEpisodeForm({
        title: data?.title || "",
        episodeNumber: String(data?.episodeNumber || ""),
        video: null
      });
      setEditingEpisode(episode);
      setShowAddEpisodeForm(true);
    } catch (error) {
      console.error("Error loading episode:", error);
      toast.error("Không lấy được thông tin tập");
    }
  };

  const handleEpisodeSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSeasonId) {
      toast.error("Vui lòng chọn phần phim");
      return;
    }
    
    // Kiểm tra: không cho thêm tập mới nếu là phim lẻ và đã có tập
    if (!editingEpisode && movieType === "SINGLE" && episodes.length > 0) {
      toast.error("Phim lẻ chỉ có 1 tập duy nhất. Không thể thêm tập mới.");
      return;
    }
    
    const title = (episodeForm.title || "").trim();
    if (!title) {
      toast.error("Vui lòng nhập tiêu đề tập");
      return;
    }
    
    if (!RE_TITLE.test(title)) {
      toast.error("Tiêu đề tập không hợp lệ");
      return;
    }
    
    if (!editingEpisode && !episodeForm.video) {
      toast.error("Vui lòng chọn file video để upload");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("seasonId", selectedSeasonId);
      fd.append("movieId", movieId);
      fd.append("title", episodeForm.title.trim());
      fd.append("episodeNumber", Number(episodeForm.episodeNumber));
      if (episodeForm.video) {
        fd.append("video", episodeForm.video);
      }

      if (editingEpisode) {
        await EpisodeService.updateEpisode(selectedSeasonId, Number(episodeForm.episodeNumber), fd);
        toast.success("Cập nhật tập thành công");
      } else {
        await EpisodeService.addEpisode(fd);
        toast.success("Thêm tập mới thành công");
      }
      
      resetEpisodeForm();
      await loadEpisodes(selectedSeasonId);
    } catch (error) {
      console.error("Error saving episode:", error);
      toast.error("Lỗi lưu tập: " + (error?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEpisode = async (episode) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Tập ${episode.episodeNumber}?`)) {
      return;
    }

    setLoading(true);
    try {
      await EpisodeService.deleteEpisode(selectedSeasonId, episode.episodeNumber);
      toast.success("Xóa tập thành công");
      await loadEpisodes(selectedSeasonId);
      resetEpisodeForm();
    } catch (error) {
      console.error("Error deleting episode:", error);
      toast.error("Xóa thất bại: " + (error?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} size="xl" backdrop="static" className="episodes-management-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <FaList className="me-2" />
          Quản lý Tập phim - {movieTitle}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Row>
          {/* Left Column - Season Management */}
          <Col lg={5}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">
                  <FaFilm className="me-2" />
                  Quản lý Phần phim
                </h6>
              </Card.Header>
              <Card.Body>
                {loadingSeasons ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" size="sm" />
                    <div className="mt-2 small">Đang tải...</div>
                  </div>
                ) : (
                  <>
                    {/* Season Actions */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="small text-muted">
                        {seasons.length} phần phim
                      </span>
                      {!(movieType === 'SINGLE' && seasons.length > 0) && (
                        <Button 
                          variant="primary" 
                          size="sm" 
                          className="btn-icon-only"
                          onClick={handleAddSeason}
                          disabled={showAddSeasonForm}
                          title={movieType === 'SINGLE' ? 'Tạo Phần 1' : 'Thêm phần mới'}
                        >
                          <FaPlus />
                        </Button>
                      )}
                    </div>

                    {/* Single Movie Warning */}
                    {movieType === 'SINGLE' && (
                      <Alert variant="warning" className="mb-3 small">
                        <strong>Phim lẻ:</strong> Chỉ được có 1 phần duy nhất (Phần 1).
                      </Alert>
                    )}

                    {/* Add/Edit Season Form */}
                    {showAddSeasonForm && (
                      <Alert variant="light" className="border mb-3">
                        <h6 className="alert-heading">
                          {editingSeason ? "Chỉnh sửa phần phim" : "Thêm phần phim mới"}
                        </h6>
                        <Form onSubmit={handleSeasonSubmit}>
                          <Row className="g-2">
                            <Col md={6}>
                              <Form.Label className="small">Số phần *</Form.Label>
                              <Form.Control
                                type="number"
                                name="seasonNumber"
                                value={seasonForm.seasonNumber}
                                onChange={handleSeasonInputChange}
                                min="1"
                                max={movieType === 'SINGLE' ? "1" : undefined}
                                required
                                disabled={movieType === 'SINGLE' || !!editingSeason}
                                size="sm"
                              />
                            </Col>
                            <Col md={6}>
                              <Form.Label className="small">Năm phát hành</Form.Label>
                              <Form.Control
                                type="number"
                                name="releaseYear"
                                value={seasonForm.releaseYear}
                                onChange={handleSeasonInputChange}
                                min="1900"
                                max="2030"
                                size="sm"
                              />
                            </Col>
                            <Col md={12}>
                              <Form.Label className="small">Tên phần</Form.Label>
                              <Form.Control
                                type="text"
                                name="title"
                                value={seasonForm.title}
                                onChange={handleSeasonInputChange}
                                size="sm"
                              />
                            </Col>
                            <Col md={12}>
                              <Form.Label className="small">Mô tả</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={2}
                                name="description"
                                value={seasonForm.description}
                                onChange={handleSeasonInputChange}
                                size="sm"
                              />
                            </Col>
                          </Row>
                          <div className="mt-2 d-flex gap-2">
                            <Button type="submit" variant="success" size="sm" className="btn-compact" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                              {editingSeason ? "Lưu" : "Tạo"}
                            </Button>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                              className="btn-compact"
                              onClick={resetSeasonForm}
                            >
                              Hủy
                            </Button>
                          </div>
                        </Form>
                      </Alert>
                    )}

                    {/* Seasons List */}
                    {seasons.length > 0 ? (
                      <div className="seasons-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {seasons.map((season) => (
                          <div 
                            key={season.seasonId}
                            className={`season-item p-2 mb-2 rounded border ${
                              selectedSeasonId === season.seasonId ? 'border-primary bg-light' : 'border-light'
                            }`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSeasonSelect(season.seasonId)}
                          >
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <span className="badge bg-primary">Phần {season.seasonNumber}</span>
                                  <span className="fw-semibold small">{season.title}</span>
                                </div>
                                {season.releaseYear && (
                                  <div className="small text-muted">Năm: {season.releaseYear}</div>
                                )}
                                {season.description && (
                                  <div className="small text-muted mt-1">
                                    {season.description.length > 60 ? 
                                      season.description.substring(0, 60) + '...' : 
                                      season.description
                                    }
                                  </div>
                                )}
                              </div>
                              <div className="btn-group">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSeason(season);
                                  }}
                                  disabled={loading}
                                  title="Chỉnh sửa phần"
                                >
                                  <FaEdit />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSeason(season.seasonNumber);
                                  }}
                                  disabled={loading}
                                  title="Xóa phần"
                                >
                                  <FaTrash />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert variant="info" className="text-center">
                        <h6>Chưa có phần phim nào</h6>
                        <p className="mb-0 small">Nhấn "Thêm phần" để tạo phần đầu tiên.</p>
                      </Alert>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Right Column - Episode Management */}
          <Col lg={7}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Header className="bg-success text-white">
                <h6 className="mb-0">
                  <FaVideo className="me-2" />
                  Quản lý Tập phim
                  {selectedSeasonId && (
                    <span className="ms-2 small opacity-75">
                      ({seasons.find(s => s.seasonId === selectedSeasonId)?.title || 'Phần chưa xác định'})
                    </span>
                  )}
                </h6>
              </Card.Header>
              <Card.Body>
                {!selectedSeasonId ? (
                  <Alert variant="info" className="text-center">
                    <h6>Chọn phần phim</h6>
                    <p className="mb-0 small">Vui lòng chọn một phần phim bên trái để quản lý tập.</p>
                  </Alert>
                ) : (
                  <>
                    {/* Thông báo đặc biệt cho phim lẻ đã có tập */}
                    {movieType === "SINGLE" && episodes.length > 0 && (
                      <Alert variant="info" className="mb-3">
                        <small>
                          <FaFilm className="me-1" />
                          <strong>Phim lẻ:</strong> Chỉ có 1 tập duy nhất. Không thể thêm tập mới.
                        </small>
                      </Alert>
                    )}

                    {/* Episode Actions */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="small text-muted">
                        {episodes.length} tập phim
                      </span>
                      {/* Phim lẻ: chỉ cho thêm tập khi chưa có tập nào (episodes.length === 0) */}
                      {/* Phim bộ: luôn cho phép thêm tập */}
                      {(movieType === "SERIES" || (movieType === "SINGLE" && episodes.length === 0)) && (
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="btn-icon-only"
                          onClick={handleAddEpisode}
                          disabled={showAddEpisodeForm}
                          title={movieType === "SINGLE" && episodes.length === 0 
                            ? "Thêm tập duy nhất cho phim lẻ" 
                            : "Thêm tập mới"}
                        >
                          <FaPlus />
                        </Button>
                      )}
                    </div>

                    {/* Add/Edit Episode Form */}
                    {showAddEpisodeForm && (
                      <Alert variant="light" className="border mb-3">
                        <h6 className="alert-heading">
                          {editingEpisode ? "Chỉnh sửa tập" : "Thêm tập mới"}
                        </h6>
                        <Form onSubmit={handleEpisodeSubmit}>
                          <Row className="g-2">
                            <Col md={3}>
                              <Form.Label className="small">Số tập *</Form.Label>
                              <Form.Control
                                type="number"
                                name="episodeNumber"
                                value={episodeForm.episodeNumber}
                                onChange={handleEpisodeInputChange}
                                min="1"
                                required
                                disabled={!!editingEpisode}
                                size="sm"
                              />
                            </Col>
                            <Col md={9}>
                              <Form.Label className="small">Tiêu đề tập *</Form.Label>
                              <Form.Control
                                type="text"
                                name="title"
                                value={episodeForm.title}
                                onChange={handleEpisodeInputChange}
                                required
                                size="sm"
                                placeholder="Nhập tiêu đề tập phim..."
                              />
                            </Col>
                            <Col md={12}>
                              <Form.Label className="small">
                                {editingEpisode ? "Thay video (tùy chọn)" : "Video *"}
                              </Form.Label>
                              <Form.Control
                                type="file"
                                accept="video/*"
                                onChange={handleEpisodeInputChange}
                                size="sm"
                              />
                              {editingEpisode && (
                                <Form.Text className="text-muted">
                                  Để trống nếu chỉ muốn đổi tiêu đề tập.
                                </Form.Text>
                              )}
                            </Col>
                          </Row>
                          <div className="mt-2 d-flex gap-2">
                            <Button type="submit" variant="success" size="sm" className="btn-compact" disabled={loading}>
                              {loading ? <Spinner animation="border" size="sm" className="me-1" /> : null}
                              {editingEpisode ? "Lưu" : "Thêm"}
                            </Button>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                              className="btn-compact"
                              onClick={resetEpisodeForm}
                            >
                              Hủy
                            </Button>
                          </div>
                        </Form>
                      </Alert>
                    )}

                    {/* Episodes List */}
                    {loadingEpisodes ? (
                      <div className="text-center py-4">
                        <Spinner animation="border" size="sm" />
                        <div className="mt-2 small">Đang tải tập phim...</div>
                      </div>
                    ) : episodes.length > 0 ? (
                      <div className="episodes-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <Table hover size="sm" className="mb-0">
                          <thead className="table-light sticky-top">
                            <tr>
                              <th style={{width: '60px'}}>Tập</th>
                              <th>Tiêu đề</th>
                              <th style={{width: '120px'}}>Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {episodes.map((episode) => (
                              <tr key={episode.episodeId}>
                                <td>
                                  <span className="badge bg-success">
                                    Tập {episode.episodeNumber}
                                  </span>
                                </td>
                                <td className="fw-semibold small">{episode.title}</td>
                                <td>
                                  <div className="btn-group" role="group">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => handleEditEpisode(episode)}
                                      title="Chỉnh sửa"
                                    >
                                      <FaEdit />
                                    </Button>
                                    <Button
                                      variant="outline-info"
                                      size="sm"
                                      onClick={() => setSelectedEpisodeForSubtitles(episode)}
                                      title="Quản lý phụ đề (CC)"
                                    >
                                      <FaClosedCaptioning />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDeleteEpisode(episode)}
                                      title="Xóa tập"
                                      disabled={loading}
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
                        <h6>Chưa có tập nào</h6>
                        <p className="mb-0 small">Nhấn "Thêm tập" để tạo tập đầu tiên cho phần này.</p>
                      </Alert>
                    )}

                    {/* Subtitle Management */}
                    {selectedEpisodeForSubtitles && (
                      <div className="mt-4 border-top pt-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">
                            Quản lý phụ đề - Tập {selectedEpisodeForSubtitles.episodeNumber}
                          </h6>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => setSelectedEpisodeForSubtitles(null)}
                          >
                            Đóng
                          </Button>
                        </div>
                        <SubtitleManager 
                          seasonId={selectedSeasonId}
                          episodeNumber={selectedEpisodeForSubtitles.episodeNumber}
                          onSubtitlesChange={(subtitles) => {
                            console.log('Subtitles updated:', subtitles);
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModelManageEpisodes;