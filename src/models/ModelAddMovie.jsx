import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MovieService from "../services/MovieService";
import EpisodeService from "../services/EpisodeService";
import SeasonService from "../services/SeasonService";
import { getCountries } from "../api/countryApi";
import Select from "react-select";
import { toast } from "react-toastify";
import { FaVideo, FaImage, FaClock, FaGlobe, FaTags, FaLink } from "react-icons/fa";
import "../css/ModelAddMovie.css";
import TOPICS from "../constants/topics";
import GENRES from "../constants/genres";
import AuthorService from "../services/AuthorService";

const ModelAddMovie = ({ onSuccess,onClose  }) => {
  const navigate = useNavigate();
  const { MyUser } = useAuth();

  const [countries, setCountries] = useState([]);
  const [newAuthor, setNewAuthor] = useState([
   { name: "", authorRole: "DIRECTOR" }
]);
const [isNewAuthor, setIsNewAuthor] = useState(false);
// State để lưu danh sách tác giả đã có
  const [authors, setAuthors] = useState([]);
  useEffect(() => {
    const fetchCountries = async () => {
      const countryList = await getCountries();
      setCountries(countryList);
    };
    fetchCountries();
  }, []);
  //load danh sách tác giả 
    useEffect(() => {
    const fetchAuthors = async () => {
      const authors = await AuthorService.getAllAuthors();
      setAuthors(authors);
    };
    fetchAuthors();
  }, []);
// thêm dòng nhập tác giả mới
const addNewAuthorField = () => {
  setNewAuthor([...newAuthor, { name: "", authorRole: "DIRECTOR" }]);
};
// Chuyển authors thành format { value, label }
const authorOptions = authors.map(a => ({
  value: a.authorId,
  label: `${a.name} (${a.authorRole})`
}));

  // update field của tác giả mới
  const updateNewAuthor = (index, field, value) => {
    const updated = [...newAuthor];
    updated[index][field] = value;
    setNewAuthor(updated);
  };


  const [form, setForm] = useState({
    title: "",
    originalTitle: "",
    description: "",
    genres: [],
    country: "",
    topic: "",
    movieType: "SINGLE",
    minVipLevel: "FREE",
    status: "UPCOMING",         // mặc định
    releaseYear: "",
    duration: "",
    // media
    thumbnail: null,
    banner: null,
    trailerVideo: null,
    contentVideo: null,
    authorIds: [],
    slug: ""
  });

  const [loading, setLoading] = useState(false);
  const [uploadVideo, setUploadVideo] = useState(false);

  const VIDEO_TYPES = ["video/mp4", "video/avi", "video/mkv", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"];
  const THUMBNAIL_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"];

  const isValidVideoFile = (file) => file && VIDEO_TYPES.includes(file.type);
  const isValidImageFile = (file) => file && THUMBNAIL_TYPES.includes(file.type);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === "file") {
      const file = files[0];
      if (name === "video" && !isValidVideoFile(file)) {
        toast("❌ Chỉ chấp nhận file video hợp lệ (mp4, avi, mkv...)");
        return;
      }
      if (name === "thumbnail" && !isValidImageFile(file)) {
        toast("❌ Chỉ chấp nhận ảnh jpg, png, gif, webp...");
        return;
      }
      if (name === "banner" && !isValidImageFile(file)) {
        toast("❌ Chỉ chấp nhận ảnh jpg, png, gif, webp...");
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
    if (!form.title) return toast.error("Vui lòng nhập tiêu đề!");

    // Yêu cầu file tương ứng theo status
    if (form.status === "UPCOMING" && !form.trailerVideo) {
      return toast.error("UPCOMING cần trailer (file)");
    }
    if (form.status === "COMPLETED" && !form.contentVideo) {
      return toast.error("COMPLETED cần video tập 1 (file)");
    }

    setLoading(true);
    try {
      // gom authorIds
      let allAuthorIds = Array.isArray(form.authorIds) ? [...form.authorIds] : [];
      for (const a of (isNewAuthor ? newAuthor : [])) {
        const name = (a?.name || "").trim();
        if (!name) continue;
        const created = await AuthorService.createAuthor({ name, authorRole: a.authorRole || "DIRECTOR", movieId: [] });
        const newId = created?.authorId || created?.id;
        if (newId) allAuthorIds.push(newId);
      }

      // 1) Tạo Movie (chỉ metadata + ảnh). KHÔNG gửi trailer/content để tránh upload 2 lần
      const fd = new FormData();
      ["title","originalTitle","description","country","topic","movieType","minVipLevel","status","releaseYear","slug","duration"]
        .forEach(k => form[k] != null && fd.append(k, form[k]));
      (form.genres || []).forEach(g => fd.append("genres", g));
      (allAuthorIds || []).forEach(id => fd.append("authorIds", id));
      if (form.thumbnail) fd.append("thumbnail", form.thumbnail);
      if (form.banner) fd.append("banner", form.banner);
      fd.append("role", "ADMIN");

      const movie = await MovieService.createMovie(fd);

      // 2) gán movie vào tác giả
      if (allAuthorIds.length) {
        await AuthorService.addMovieToMultipleAuthors(allAuthorIds, movie.movieId);
      }

      // 3) Publish theo status (gửi file bắt buộc)
      await MovieService.publish(movie.movieId, form.status, {
        trailerVideo: form.status === "UPCOMING"   ? form.trailerVideo : null,
        episode1Video: form.status === "COMPLETED" ? form.contentVideo : null,
      });

      toast.success("Tạo phim & publish thành công!");
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("❌ Lỗi: " + (err?.message || "Không thể thêm phim."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="model-add-movie card shadow-lg p-4">
        <h4 className="mb-3 text-center fw-bold text-primary">Thêm Phim Mới</h4>

        {/* Trạng thái & loại phim */}
        <div className="row g-3 mb-1">
          <div className="col-md-6">
            <label className="form-label">Trạng thái</label>
            <div className="d-flex gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="st-upcoming"
                  name="status"
                  value="UPCOMING"
                  checked={form.status === "UPCOMING"}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                />
                <label className="form-check-label" htmlFor="st-upcoming">UPCOMING</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="st-completed"
                  name="status"
                  value="COMPLETED"
                  checked={form.status === "COMPLETED"}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                />
                <label className="form-check-label" htmlFor="st-completed">COMPLETED</label>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label">VIP tối thiểu</label>
            <select
              name="minVipLevel"
              className="form-select"
              value={form.minVipLevel}
              onChange={handleChange}
            >
              <option value="FREE">FREE</option>
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="row g-3">
          {/* Title & Original Title */}
          <div className="col-md-8">
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
          <div className="col-md-4">
            <label className="form-label">Năm phát hành</label>
            <input
              type="number"
              min="1900"
              max="2100"
              className="form-control"
              name="releaseYear"
              value={form.releaseYear}
              onChange={handleChange}
              placeholder="VD: 2025"
            />
          </div>
          
          <div className="col-md-4">
            <label className="form-label"><FaClock /> Thời lượng</label>
            <input
              type="text"
              className="form-control"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder='VD: 120p (phút)'
            />
            <div className="form-text">Định dạng đề nghị: <code>120p</code> (phút).</div>
          </div>

          <div className="col-md-6">
            <label className="form-label">Tên gốc (Original Title)</label>
            <input
              type="text"
              className="form-control"
              name="originalTitle"
              value={form.originalTitle}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Slug (tuỳ chọn)</label>
            <input
              type="text"
              className="form-control"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="auto nếu để trống"
            />
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label">Mô tả</label>
            <textarea
              className="form-control"
              rows="2"
              name="description"
              value={form.description}
              onChange={handleChange}
            />
          </div>

          {/* Genres */}
          <div className="col-12">
            <label className="form-label"><FaTags /> Thể loại</label>
            <div className="d-flex flex-wrap genre-box p-2">
              {GENRES.map(genre => (
                <div key={genre} className="form-check me-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value={genre}
                    id={genre}
                    checked={form.genres.includes(genre)}
                    onChange={handleGenreChange}
                  />
                  <label className="form-check-label" htmlFor={genre}>{genre}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Country / Topic / Type */}
          <div className="col-md-4">
            <label className="form-label"><FaGlobe /> Quốc gia</label>
            <select name="country" className="form-select" value={form.country} onChange={handleChange}>
              <option value="">-- Chọn quốc gia --</option>
              {countries.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Chủ đề</label>
            <select name="topic" className="form-select" value={form.topic} onChange={handleChange}>
              <option value="">-- Chọn chủ đề --</option>
              {TOPICS.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Loại phim</label>
            <select name="movieType" className="form-select" value={form.movieType} onChange={handleChange}>
              <option value="SINGLE">Phim lẻ</option>
              <option value="SERIES">Phim bộ</option>
            </select>
          </div>

          {/* Authors block */}
          <div className="col-12">
            <label className="form-label fw-bold">Tác giả</label>
            <div className="d-flex gap-4 mb-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="authorMode"
                  checked={!isNewAuthor}
                  onChange={() => setIsNewAuthor(false)}
                />
                <label className="form-check-label">Chọn tác giả có sẵn</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="authorMode"
                  checked={isNewAuthor}
                  onChange={() => setIsNewAuthor(true)}
                />
                <label className="form-check-label">Tạo tác giả mới</label>
              </div>
            </div>

            {!isNewAuthor ? (
              <Select
                isMulti
                options={authorOptions}
                value={authorOptions.filter(o => form.authorIds?.includes(o.value))}
                onChange={selected => setForm({ ...form, authorIds: selected.map(s => s.value) })}
                placeholder="Chọn tác giả..."
                classNamePrefix="select"
              />
            ) : (
              <div>
                {newAuthor.map((a, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập tên..."
                      value={a.name}
                      onChange={e => updateNewAuthor(idx, "name", e.target.value)}
                    />
                    <select
                      className="form-select"
                      value={a.authorRole}
                      onChange={e => updateNewAuthor(idx, "authorRole", e.target.value)}
                    >
                      <option value="DIRECTOR">Đạo diễn</option>
                      <option value="PERFORMER">Diễn viên</option>
                    </select>
                  </div>
                ))}
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={addNewAuthorField}>
                  + Thêm tác giả
                </button>
              </div>
            )}
          </div>

          {/* Media: thumbnail & banner */}
          <div className="col-md-6">
            <label className="form-label"><FaImage /> Thumbnail</label>
            <input type="file" className="form-control" name="thumbnail" accept="image/*" onChange={handleChange} />
          </div>
          <div className="col-md-6">
            <label className="form-label"><FaImage /> Banner</label>
            <input type="file" className="form-control" name="banner" accept="image/*" onChange={handleChange} />
          </div>

          {/* Trailer (UPCOMING only) */}
          {form.status === "UPCOMING" && (
           <div className="col-12">
            <label className="form-label"><FaVideo /> Trailer</label>
            <input
              type="file"
              className="form-control"
              name="trailerVideo"
              accept="video/*"
              onChange={handleChange}
              required
            />
          </div>
        )}

          {/* Content ep1 (COMPLETED only) */}
          {form.status === "COMPLETED" && (
            <div className="col-12">
              <label className="form-label"><FaVideo /> Video tập 1</label>
                  <input
                    type="file"
                    className="form-control"
                    name="contentVideo"
                    accept="video/*"
                    onChange={handleChange}
                    required
                  />
            </div>
          )}

          {/* Actions */}
          <div className="col-12 d-flex gap-2 mt-2">
            <button className="btn btn-primary flex-fill" type="submit" disabled={loading}>
              {loading ? "Đang thêm..." : "Thêm phim"}
            </button>
            <button type="button" className="btn btn-outline-secondary flex-fill" onClick={onClose}>
              Đóng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModelAddMovie;