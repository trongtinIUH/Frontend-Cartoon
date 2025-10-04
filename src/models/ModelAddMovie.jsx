import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MovieService from "../services/MovieService";
import EpisodeService from "../services/EpisodeService";
import SeasonService from "../services/SeasonService";
import SubtitleManager from "../components/SubtitleManager";
import { getCountries } from "../api/countryApi";
import Select from "react-select";
import { toast } from "react-toastify";
import { FaVideo, FaImage, FaClock, FaGlobe, FaTags, FaLink } from "react-icons/fa";
import "../css/ModelAddMovie.css";
import TOPICS from "../constants/topics";
import GENRES from "../constants/genres";
import AuthorService from "../services/AuthorService";

// Helper functions để xử lý trùng lặp tác giả
const normalize = (s) =>
  (s || "")
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().trim().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");

const keyOf = (name, role) => `${normalize(name)}|${role}`;

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
    trailerUrl: "",              // ✅ Thêm trailer URL input
    contentVideo: null,
    authorIds: [],
    slug: ""
  });

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(""); // Để hiển thị bước đang thực hiện
  const [uploadVideo, setUploadVideo] = useState(false);
  const [trailerInputType, setTrailerInputType] = useState("file"); // "file" hoặc "url"
  
  // Subtitle management - track phim vừa tạo
  const [createdMovieInfo, setCreatedMovieInfo] = useState(null);
  const [showSubtitleSection, setShowSubtitleSection] = useState(false);

  // ==== Validators (khớp BE) ====
const RE_TITLE = /^[\p{L}\p{N}\s]{1,200}$/u;          // chữ có dấu, số, khoảng trắng
// Duration formats supported:
const RE_DURATION = /^\d{1,4}(?:\s*(?:p|phút|phut)(?:\s*\/\s*tập)?)?\s*$/i;

const [errors, setErrors] = useState({});

// ==== Hàm validate tất cả field ====
function validate(values, trailerInputType) {
  const e = {};

  if (!values.title?.trim()) e.title = "Vui lòng nhập tiêu đề.";
  else if (!RE_TITLE.test(values.title.trim()))
    e.title = "Chỉ gồm chữ (có dấu), số và khoảng trắng, tối đa 200 ký tự.";

  if (values.originalTitle?.trim() && !RE_TITLE.test(values.originalTitle.trim()))
    e.originalTitle = "Chỉ gồm chữ/số/khoảng trắng, tối đa 200 ký tự.";

  if (values.releaseYear) {
    const y = Number(values.releaseYear);
    if (Number.isNaN(y) || y < 1900 || y > 2100)
      e.releaseYear = "Năm phát hành phải trong khoảng 1900–2100.";
  }

  if (values.duration?.trim() && !RE_DURATION.test(values.duration.trim()))
    e.duration = "Thời lượng dạng 120p hoặc 120 phút.";


  if (values.status === "COMPLETED" && !values.contentVideo)
    e.contentVideo = "Vui lòng chọn video tập 1.";

  // file type FE check (UX)
  if (values.thumbnail && !isValidImageFile(values.thumbnail))
    e.thumbnail = "Chỉ chấp nhận ảnh jpg, png, gif, webp, bmp.";
  if (values.banner && !isValidImageFile(values.banner))
    e.banner = "Chỉ chấp nhận ảnh jpg, png, gif, webp, bmp.";
  if (values.trailerVideo && !isValidVideoFile(values.trailerVideo))
    e.trailerVideo = "Chỉ chấp nhận video mp4/avi/mkv/webm…";

  return e;
}
  
  // Helper function để reset form
  const resetForm = () => {
    setForm({
      title: "",
      originalTitle: "",
      description: "",
      genres: [],
      country: "",
      topic: "",
      movieType: "SINGLE",
      minVipLevel: "FREE",
      status: "UPCOMING",
      releaseYear: "",
      duration: "",
      thumbnail: null,
      banner: null,
      trailerVideo: null,
      trailerUrl: "",              // ✅ Reset trailer URL
      contentVideo: null,
      authorIds: [],
      slug: ""
    });
    setNewAuthor([{ name: "", authorRole: "DIRECTOR" }]);
    setIsNewAuthor(false);
    setTrailerInputType("file");    // ✅ Reset trailer input type
    
    // Reset subtitle states
    setCreatedMovieInfo(null);
    setShowSubtitleSection(false);
  };  const VIDEO_TYPES = ["video/mp4", "video/avi", "video/mkv", "video/webm", "video/quicktime", "video/x-msvideo", "video/x-matroska"];
  const THUMBNAIL_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"];

  const isValidVideoFile = (file) => file && VIDEO_TYPES.includes(file.type);
  const isValidImageFile = (file) => file && THUMBNAIL_TYPES.includes(file.type);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

      // clear lỗi của field đang nhập
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));

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
    const errs = validate(form, trailerInputType);
    if (Object.keys(errs).length) {
      setErrors(errs);
      // focus field đầu tiên bị lỗi (nếu có)
      const first = Object.keys(errs)[0];
      const el = document.querySelector(`[name="${first}"]`);
      if (el?.focus) el.focus();
      return;
    }
    setErrors({});

    // COMPLETED cần video tập 1 bắt buộc
    if (form.status === "COMPLETED" && !form.contentVideo) {
      return toast.error("COMPLETED cần video tập 1 (file)");
    }

    setLoading(true);
    setLoadingStep("Đang chuẩn bị dữ liệu...");
    let createdMovie = null;
    let createdAuthorIds = [];
    
    try {
      // Chuẩn bị danh sách authorIds từ authors có sẵn
      let existingAuthorIds = Array.isArray(form.authorIds) ? [...form.authorIds] : [];

      // Map hiện có từ danh sách authors đã load
      const existingMap = new Map(
        (authors || []).map(a => [keyOf(a.name, a.authorRole), a.authorId])
      );

      // Chuẩn bị danh sách authors mới cần tạo (nếu có)
      const uniqueNewAuthors = [];
      const seenNew = new Set();
      
      if (isNewAuthor) {
        for (const a of newAuthor) {
          const name = (a?.name || "").trim();
          const role = a?.authorRole || "DIRECTOR";
          if (!name) continue;
          const k = keyOf(name, role);
          if (seenNew.has(k)) {
            toast.info(`Bỏ qua trùng: ${name} (${role})`);
            continue;
          }
          seenNew.add(k);
          
          // Kiểm tra xem author này đã tồn tại chưa
          const foundId = existingMap.get(k);
          if (foundId) {
            existingAuthorIds.push(foundId);
          } else {
            uniqueNewAuthors.push({ name, authorRole: role });
          }
        }
      }

      // Bước 1: Tạo Movie trước (chỉ với authors có sẵn)
      const fd = new FormData();
      ["title","originalTitle","description","country","topic","movieType","minVipLevel","status","releaseYear","slug","duration"]
        .forEach(k => form[k] != null && fd.append(k, form[k]));
      (form.genres || []).forEach(g => fd.append("genres", g));
      
      // ✅ Thêm trailer URL nếu có (không phải file)
      if (form.trailerUrl && !form.trailerVideo) {
        fd.append("trailerUrl", form.trailerUrl);
      }
      
      // Chỉ thêm authors có sẵn vào Movie
      existingAuthorIds.forEach(id => fd.append("authorIds", id));
      
      if (form.thumbnail) fd.append("thumbnail", form.thumbnail);
      if (form.banner) fd.append("banner", form.banner);
      if (form.trailerVideo) fd.append("trailerVideo", form.trailerVideo); // ✅ File trailer
      fd.append("role", "ADMIN");

      // Tạo Movie
      setLoadingStep("Đang tạo phim...");
      createdMovie = await MovieService.createMovie(fd);
      console.log("✅ Movie created successfully:", createdMovie.movieId);

      // Bước 2: Tạo authors mới (nếu có) và liên kết với movie
      if (uniqueNewAuthors.length > 0) {
        setLoadingStep("Đang tạo tác giả mới...");
        for (const authorData of uniqueNewAuthors) {
          try {
            const created = await AuthorService.createAuthor({ 
              name: authorData.name, 
              authorRole: authorData.authorRole, 
              movieId: [] 
            });
            const newId = created?.authorId || created?.id;
            if (newId) {
              createdAuthorIds.push(newId);
              console.log(`✅ Author created: ${authorData.name} (ID: ${newId})`);
            }
          } catch (authorError) {
            console.warn(`⚠️ Failed to create author ${authorData.name}:`, authorError);
            // Tiếp tục với authors khác, không dừng toàn bộ process
          }
        }

        // Liên kết authors mới với movie
        if (createdAuthorIds.length > 0) {
          setLoadingStep("Đang liên kết tác giả với phim...");
          try {
            await AuthorService.addMovieToMultipleAuthors(createdAuthorIds, createdMovie.movieId);
            console.log("✅ Authors linked to movie successfully");
            
            // Đồng bộ lại toàn bộ authors cho movie (sử dụng backend service setAuthorsForMovie)
            const allAuthorIds = [...existingAuthorIds, ...createdAuthorIds];
            const updateFormData = new FormData();
            allAuthorIds.forEach(id => updateFormData.append("authorIds", id));
            await MovieService.updateMovie(createdMovie.movieId, updateFormData);
            console.log("✅ Movie updated with complete author list");
            
          } catch (linkError) {
            console.warn("⚠️ Failed to link some authors to movie:", linkError);
            // Không dừng process vì movie đã tạo thành công
          }
        }
      }

      // Bước 3: Publish movie
      setLoadingStep("Đang publish phim...");
      const publishResponse = await MovieService.publish(createdMovie.movieId, form.status, {
        trailerVideo: (form.status === "UPCOMING" && trailerInputType === "file") ? form.trailerVideo : null,
        episode1Video: form.status === "COMPLETED" ? form.contentVideo : null,
      });

      toast.success("Tạo phim & publish thành công!");
      
      // Nếu COMPLETED và có video tập 1, hiển thị subtitle management
      if (form.status === "COMPLETED" && createdMovie && publishResponse?.seasonId && publishResponse?.episodeId) {
        setCreatedMovieInfo({
          movieId: createdMovie.movieId,
          title: createdMovie.title,
          seasonId: publishResponse.seasonId,
          episodeId: publishResponse.episodeId,
          episodeNumber: 1
        });
        setShowSubtitleSection(true);
        toast.info("🎬 Bạn có thể thêm phụ đề cho tập 1 bên dưới!");
      } else {
        resetForm(); // Reset form sau khi thành công
        onSuccess?.();
      }
      
    } catch (err) {
      console.error("❌ Error in handleSubmit:", err);
      
      // Rollback: Xóa movie nếu đã tạo nhưng quá trình sau đó bị lỗi
      if (createdMovie?.movieId) {
        try {
          setLoadingStep("Đang rollback dữ liệu...");
          console.log("🔄 Attempting to rollback movie:", createdMovie.movieId);
          await MovieService.deleteMovies([createdMovie.movieId]);
          console.log("✅ Movie rollback successful");
        } catch (rollbackError) {
          console.error("❌ Failed to rollback movie:", rollbackError);
          toast.error("Lỗi và không thể xóa dữ liệu đã tạo. Vui lòng liên hệ admin.");
        }
      }

      // Rollback: Xóa authors mới đã tạo (nếu có)
      if (createdAuthorIds.length > 0) {
        try {
          console.log("🔄 Attempting to rollback authors:", createdAuthorIds);
          await AuthorService.deleteAuthors(createdAuthorIds);
          console.log("✅ Authors rollback successful");
        } catch (rollbackError) {
          console.error("❌ Failed to rollback authors:", rollbackError);
        }
      }

      toast.error("❌ Lỗi: " + (err?.message || "Không thể thêm phim."));
    } finally {
      setLoading(false);
      setLoadingStep("");
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
            <label className="form-label">Gói tối thiểu</label>
            <select
              name="minVipLevel"
              className="form-select"
              value={form.minVipLevel}
              onChange={handleChange}
              required
            >
              <option value="FREE">FREE</option>
              <option value="NO_ADS">NoAds</option>
              <option value="PREMIUM">Premium</option>
              <option value="MEGA_PLUS">MegaPlus</option>
              <option value="COMBO_PREMIUM_MEGA_PLUS">Combo Premium + Mega Plus</option>

            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data" className="row g-3">
          {/* Title & Original Title */}
          <div className="col-md-8">
            <label className="form-label req">Tiêu đề</label>
            <input
              type="text"
              className={`form-control ${errors.title ? "is-invalid" : ""}`}
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />{errors.title && <div className="invalid-feedback text-danger">{errors.title}</div>}
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
              required
            />
          </div>
          
          <div className="col-md-4">
            <label className="form-label"><FaClock /> Thời lượng</label>
            <input
              type="text"
              className={`form-control ${errors.duration ? "is-invalid" : ""}`}
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder='VD: 120p (phút)'
              required
            />
            {errors.duration && <div className="invalid-feedback text-danger">{errors.duration}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label req">Tên gốc (Original Title)</label>
            <input
              type="text"
               className={`form-control ${errors.originalTitle ? "is-invalid" : ""}`}
              name="originalTitle"
              value={form.originalTitle}
              onChange={handleChange}
              required
            />{errors.originalTitle && <div className="invalid-feedback text-danger">{errors.originalTitle}</div>}
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
            <select name="country" className="form-select" value={form.country} onChange={handleChange} required>
              <option value="">-- Chọn quốc gia --</option>
              {countries.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Chủ đề</label>
            <select name="topic" className="form-select" value={form.topic} onChange={handleChange} required>
              <option value="">-- Chọn chủ đề --</option>
              {TOPICS.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Loại phim</label>
            <select name="movieType" className="form-select" value={form.movieType} onChange={handleChange} required>
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

          {/* Trailer - Always available for all movie statuses */}
          <div className="col-12">
            <label className="form-label"><FaVideo /> Trailer</label>
            
            {/* Toggle giữa file và URL */}
            <div className="d-flex gap-3 mb-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="trailerInputType"
                  value="file"
                  checked={trailerInputType === "file"}
                  onChange={(e) => setTrailerInputType(e.target.value)}
                />
                <label className="form-check-label">Upload file</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="trailerInputType"
                  value="url"
                  checked={trailerInputType === "url"}
                  onChange={(e) => setTrailerInputType(e.target.value)}
                />
                <label className="form-check-label">Nhập URL</label>
              </div>
            </div>

            {trailerInputType === "file" ? (
              <input
                type="file"
                className="form-control"
                name="trailerVideo"
                accept="video/*"
                onChange={handleChange}
              />
            ) : (
              <div>
                <input
                  type="url"
                  className="form-control"
                  name="trailerUrl"
                  value={form.trailerUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/trailer.m3u8"
                />
                <div className="form-text">
                  Hỗ trợ: .m3u8 (HLS), .mp4, hoặc URL streaming khác
                </div>
              </div>
            )}
          </div>

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
              {loading ? (loadingStep || "Đang xử lý...") : "Thêm phim"}
            </button>
            
            {/* Conditional close button */}
            {!showSubtitleSection && (
              <button type="button" className="btn btn-outline-secondary flex-fill" onClick={onClose} disabled={loading}>
                Đóng
              </button>
            )}
          </div>
        </form>

        {/* Subtitle Management Section - chỉ hiện sau khi tạo COMPLETED movie thành công */}
        {showSubtitleSection && createdMovieInfo && (
          <div className="mt-4 pt-4 border-top">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">
                <i className="fas fa-closed-captioning me-2"></i>
                Quản lý phụ đề - {createdMovieInfo.title}
              </h5>
              <div className="d-flex gap-2">
                <button 
                  type="button" 
                  className="btn btn-success btn-sm"
                  onClick={() => {
                    resetForm();
                    onSuccess?.(createdMovieInfo);
                  }}
                >
                  <i className="fas fa-check me-1"></i>
                  Hoàn thành
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={() => {
                    resetForm();
                    onSuccess?.(createdMovieInfo);
                  }}
                >
                  Bỏ qua phụ đề
                </button>
              </div>
            </div>
            
            <SubtitleManager 
              seasonId={createdMovieInfo.seasonId}
              episodeNumber={createdMovieInfo.episodeNumber}
              onSubtitlesChange={(subtitles) => {
                console.log('Subtitles for new movie:', subtitles);
                if (subtitles.length > 0) {
                  toast.success(`Đã thêm ${subtitles.length} phụ đề cho tập 1!`);
                }
              }}
              className="new-movie-subtitles"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelAddMovie;