import React, { useState } from "react";
import EpisodeService from "../services/EpisodeService";
import "../css/ModelAddMovie.css";
import { toast } from "react-toastify";

const ModelAddNewEpisode = ({ movieId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    episodeNumber: "",
    video: null,
 
  });
  const [loading, setLoading] = useState(false);

  // Các loại video và hình ảnh hợp lệ
  const VIDEO_TYPES = [
    "video/mp4", "video/avi", "video/mkv", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"
  ];

  const isValidVideoFile = (file) => file && VIDEO_TYPES.includes(file.type);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (name === "video" && !isValidVideoFile(file)) {
        toast("Chỉ chấp nhận các định dạng video phổ biến như mp4, avi, mkv, webm, mov...");
        return;
      }
      setForm({ ...form, [name]: file });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.episodeNumber || !form.video) {
      toast.error("Vui lòng nhập tiêu đề, số tập và chọn video!");
      return;
    }
    setLoading(true);
    try {
      const episodeData = new FormData();
      episodeData.append("movieId", movieId);
      episodeData.append("title", form.title);
      episodeData.append("description", form.description);
      episodeData.append("episodeNumber", form.episodeNumber);
      episodeData.append("video", form.video);
      await EpisodeService.addEpisode(episodeData);

      toast.success("Thêm tập mới thành công!");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error("Lỗi: " + (err.message || "Không thể thêm tập phim."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="model-add-movie">
        <h4>Thêm Tập Mới</h4>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-3">
            <label className="form-label">Tiêu đề tập</label>
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
            <label className="form-label">Số tập</label>
            <input
              type="number"
              className="form-control"
              name="episodeNumber"
              value={form.episodeNumber}
              onChange={handleChange}
              min={1}
              required
            />
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

          <div className="modal-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Đang thêm..." : "Thêm tập"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelAddNewEpisode;