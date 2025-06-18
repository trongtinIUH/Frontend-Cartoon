import React, { useState, useEffect } from "react";
import MovieService from "../services/MovieService";
import "../css/ModelUpdateMovie.css";
import { toast } from "react-toastify";

const ModelUpdateMovie = ({ movieId, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    genres: [],
    thumbnail: null,
  });
  const [loading, setLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState(""); // để hiển thị

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
  //load lại thông tin bộ phim
  useEffect(()=>{
        const fetchMovie = async () =>{
            try{
                const { movie } = await MovieService.getMovieById(movieId);
                if(movie){
                    setForm({
                        title: movie.title || "",
                        description: movie.description || "",
                        genres: movie.genres || [],
                        thumbnail: null, // Không cần tải lại thumbnail
                    });
                    setThumbnailPreview(movie.thumbnailUrl || "");
                }
            }catch(err) {
                toast.error("Không thể tải thông tin phim.");
            }
        };
        fetchMovie();
  },[movieId]);

  // Các loại video và hình ảnh hợp lệ
  const VIDEO_TYPES = [
    "video/mp4", "video/avi", "video/mkv", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"
  ];
  const THUMBNAIL_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"
  ];

  const isValidVideoFile = (file) => file && VIDEO_TYPES.includes(file.type);
  const isValidImageFile = (file) => file && THUMBNAIL_TYPES.includes(file.type);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
   if (type === "file") {
  const file = files[0];
  if (name === "thumbnail") {
    if (!isValidImageFile(file)) {
      toast("Chỉ chấp nhận ảnh jpg, png, gif, webp, bmp...");
      return;
    }
    setForm({ ...form, thumbnail: file });
    setThumbnailPreview(URL.createObjectURL(file)); // hiển thị preview mới
  } else {
    setForm({ ...form, [name]: file });
  }
}
else {
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
    if (!form.title  ) {
      toast.error("Vui lòng nhập tiêu đề !");
      return;
    }
    setLoading(true);
    try {
      const updateData = new FormData();
      updateData.append("title", form.title);
      updateData.append("description", form.description);
      form.genres.forEach((g) => updateData.append("genres", g));
      if (form.thumbnail) updateData.append("thumbnail", form.thumbnail);

      await MovieService.updateMovie(movieId,updateData);

      toast.success("cập nhật thành công!");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error("Lỗi: " + (err.message || "Không thể cập nhật phim."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="model-add-movie">
        <h4>Cập nhật phim</h4>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-3">
            <label className="form-label">Tiêu đề </label>
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
            <label className="form-label">Thumbnail (ảnh đại diện)</label>
            <input
              type="file"
              className="form-control"
              name="thumbnail"
              accept="image/*"
              onChange={handleChange}
            />
          </div>
          {thumbnailPreview && (
            <div className="mt-2">
                <p>Preview:</p>
                <img src={thumbnailPreview} alt="Thumbnail Preview" style={{ maxHeight: "50px" }} />
            </div>
            )}

          <div className="modal-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Đang cập nhậ..." : "Cập nhật"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelUpdateMovie;