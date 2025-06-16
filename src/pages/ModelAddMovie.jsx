import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MovieService from "../services/MovieService";
import "../css/ModelAddMovie.css";
import { toast } from "react-toastify";

const ModelAddMovie = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { MyUser } = useAuth();

  const [form, setForm] = useState({
    title: "",
    description: "",
    genres: [],
    video: null,
    thumbnail: null,
  });

  const [loading, setLoading] = useState(false);

   const GENRES = [
  "Âm nhạc", "Anime", "Bí ẩn", "Bi kịch", "CN Animation", "[CNA] Hài hước", "[CNA] Ngôn tình",
  "Đam mỹ", "Demon", "Dị giới", "Đời thường", "Drama", "Ecchi", "Gia Đình", "Giả tưởng",
  "Hài hước", "Hành động", "Harem", "Hệ Thống", "HH2D", "HH3D", "Học đường", "Huyền ảo",
  "Khoa huyễn", "Kiếm hiệp", "Kinh dị", "Lịch sử", "Live Action", "Luyện Cấp", "Ma cà rồng",
  "Mecha", "Ngôn tình", "OVA", "Phiêu lưu", "Psychological", "Quân đội", "Samurai", "Sắp chiếu",
  "Seinen", "Shoujo", "Shoujo AI", "Shounen", "Shounen AI", "Siêu năng lực", "Siêu nhiên",
  "Thám tử", "Thể thao", "Thriller", "Tiên hiệp", "Tình cảm", "Tokusatsu", "Trò chơi",
  "Trùng sinh", "Tu Tiên", "Viễn tưởng", "Võ hiệp", "Võ thuật", "Xuyên không"
];
    // Các loại video và hình ảnh hợp lệ
    const VIDEO_TYPES = [  
        "video/mp4", "video/avi", "video/mkv", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"];

    const THUMBNAIL_TYPES = [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"];

  const isValidVideoFile = (file) => file && VIDEO_TYPES.includes(file.type);
  const isValidImageFile = (file) => file && THUMBNAIL_TYPES.includes(file.type);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (name === "video" && !isValidVideoFile(file)) {
        toast("Chỉ chấp nhận các định dạng video phổ biến như mp4, avi, mkv, webm, mov...");
        return;
      }
      if (name === "thumbnail" && !isValidImageFile(file)) {
        toast("Chỉ chấp nhận các định dạng ảnh phổ biến như jpg, png, gif, webp, bmp...");
        return;
      }
      setForm({ ...form, [name]: file });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleGenreChange = (e) => {
    const { value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      genres: checked ? [...prev.genres, value] : prev.genres.filter((g) => g !== value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.video) {
      alert("Vui lòng nhập tiêu đề và chọn video!");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("userId", MyUser.my_user.userId);
    formData.append("role", "ADMIN");
    form.genres.forEach((g) => formData.append("genres", g));
    formData.append("video", form.video);
    if (form.thumbnail) formData.append("thumbnail", form.thumbnail);

    try {
      await MovieService.addMovie(formData);
      toast.success("Thêm phim thành công!");
      onSuccess?.(); // đóng modal
    } catch (err) {
      toast.error("Lỗi: " + (err.message || "Không thể thêm phim."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="model-add-movie">
        <h4>Thêm Phim Mới</h4>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Các input giữ nguyên */}
          <div className="mb-3">
            <label className="form-label">Tiêu đề</label>
            <input
              type="text"
              className="form-control"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-control"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Thể loại</label>
            <div className="d-flex flex-wrap">
              {GENRES.map((genre) => (
                <div key={genre} className="form-check me-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value={genre}
                    id={genre}
                    checked={form.genres.includes(genre)}
                    onChange={handleGenreChange}
                  />
                  <label className="form-check-label" htmlFor={genre}>
                    {genre}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Video</label>
            <input
              type="file"
              className="form-control"
              name="video"
              accept="video/*"
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Thumbnail (ảnh đại diện)</label>
            <input
              type="file"
              className="form-control"
              name="thumbnail"
              accept="image/*"
              onChange={handleChange}
            />
          </div>
            <div className="modal-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Đang thêm..." : "Thêm phim"}
            </button>
            <button className="btn btn-secondary" onClick={onSuccess}>
                Đóng
            </button>
            </div>

        </form>
      </div>
    </div>
  );
};

export default ModelAddMovie;
