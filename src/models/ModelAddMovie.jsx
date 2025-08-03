import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MovieService from "../services/MovieService";
import EpisodeService from "../services/EpisodeService";
import { getCountries } from "../api/countryApi";
import Select from "react-select";
import { toast } from "react-toastify";
import { FaVideo, FaImage, FaClock, FaGlobe, FaTags, FaLink } from "react-icons/fa";
import "../css/ModelAddMovie.css";
import TOPICS from "../constants/topics";
import AuthorService from "../services/AuthorService";

const ModelAddMovie = ({ onSuccess }) => {
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
//thêm tác giả mới vào form
const addNewAuthorField = () => {
  setAuthors([...authors, { name: "", authorRole: "DIRECTOR" }]);
};
// Chuyển authors thành format { value, label }
const authorOptions = authors.map(a => ({
  value: a.authorId,
  label: `${a.name} (${a.authorRole})`
}));

const updateNewAuthor = (index, field, value) => {
  const updated = [...authors];
  updated[index][field] = value;
  setAuthors(updated);
};


  const [form, setForm] = useState({
    title: "",
    description: "",
    genres: [],
    video: null,
    thumbnail: null,
    videoLink: "",
    accessVipLevel: "FREE",
    duration: "",
    country: "",
    topic: "",
    movieType: "SINGLE",
  });

  const [loading, setLoading] = useState(false);
  const [uploadVideo, setUploadVideo] = useState(false);

  const GENRES = [
    "Âm nhạc", "Anime", "Bí ẩn", "Bi kịch", "CN Animation", "[CNA] Hài hước",
    "[CNA] Ngôn tình", "Đam mỹ", "Demon", "Dị giới", "Đời thường", "Drama",
    "Ecchi", "Gia Đình", "Giả tưởng", "Hài hước", "Hành động", "Harem",
    "Hệ Thống", "HH2D", "HH3D", "Học đường", "Huyền ảo", "Khoa huyễn",
    "Kiếm hiệp", "Kinh dị", "Lịch sử", "Live Action", "Luyện Cấp",
    "Ma cà rồng", "Mecha", "Ngôn tình", "OVA", "Phiêu lưu", "Psychological",
    "Quân đội", "Samurai", "Sắp chiếu", "Seinen", "Shoujo", "Shoujo AI",
    "Shounen", "Shounen AI", "Siêu năng lực", "Siêu nhiên", "Thám tử",
    "Thể thao", "Thriller", "Tiên hiệp", "Tình cảm", "Tokusatsu", "Trò chơi",
    "Trùng sinh", "Tu Tiên", "Viễn tưởng", "Võ hiệp", "Võ thuật", "Xuyên không"
  ];

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
    if (!form.title || (!form.video && !form.videoLink)) {
      toast.error("Vui lòng nhập tiêu đề và chọn video!");
      return;
    }
    setLoading(true);
    try {
      // 1. Tạo phim mới
      const movieData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => movieData.append(key, v));
      } else if (value !== null && value !== undefined) {
        movieData.append(key, value);
      } else {
        movieData.append(key, ""); // Nếu null/undefined thì gửi chuỗi rỗng
      }
    });

      movieData.append("userId", MyUser.my_user.userId);
      movieData.append("role", "ADMIN");

      const newMovie = await MovieService.createMovie(movieData);

     // 2. Tạo tác giả mới nếu có
      let allAuthorIds = form.authorIds ? [...form.authorIds] : [];

      for (const author of newAuthor) {
        if (author.name.trim()) {
          const createdAuthor = await AuthorService.createAuthor({
            name: author.name,
            authorRole: author.authorRole,
            movieId: []
          });
         // Backend có thể return object với authorId field
        if (createdAuthor.authorId) {
          allAuthorIds.push(createdAuthor.authorId);
        } else if (createdAuthor.id) {
          allAuthorIds.push(createdAuthor.id);
        }
      }
    }

      // 3. Gán movieId cho tất cả tác giả
      if (allAuthorIds.length > 0) {
        await AuthorService.addMovieToMultipleAuthors(allAuthorIds, newMovie.movieId);
      }

      const episodeData = new FormData();
      episodeData.append("movieId", newMovie.movieId);
      episodeData.append("title", `${form.title} - Tập 1`);
      episodeData.append("episodeNumber", 1);
      if (uploadVideo) episodeData.append("videoLink", form.videoLink);
      else episodeData.append("video", form.video);

      await EpisodeService.addEpisode(episodeData);

      toast.success("✅ Tạo phim và tập đầu tiên thành công!");
      onSuccess?.();
    } catch (err) {
      toast.error("❌ Lỗi: " + (err.message || "Không thể thêm phim."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="model-add-movie card shadow-lg p-4">
        <h4 className="mb-4 text-center fw-bold text-primary">Thêm Phim Mới</h4>
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="row g-3">

          {/* Tiêu đề + Mô tả */}
          <div className="col-12">
            <label className="form-label">Tiêu đề</label>
            <input type="text" className="form-control" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="col-12">
            <label className="form-label">Mô tả</label>
            <textarea className="form-control" rows="2" name="description" value={form.description} onChange={handleChange} />
          </div>

          {/* Thể loại */}
          <div className="col-12">
            <label className="form-label"><FaTags /> Thể loại</label>
            <div className="d-flex flex-wrap genre-box p-2">
              {GENRES.map((genre) => (
                <div key={genre} className="form-check me-3">
                  <input className="form-check-input" type="checkbox" value={genre} id={genre} checked={form.genres.includes(genre)} onChange={handleGenreChange} />
                  <label className="form-check-label" htmlFor={genre}>{genre}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Các thông tin phụ */}
          <div className="col-md-6">
            <label>VIP Level</label>
            <select name="accessVipLevel" className="form-select" value={form.accessVipLevel} onChange={handleChange}>
              <option value="FREE">FREE</option>
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
            </select>
          </div>
          <div className="col-md-6">
            <label><FaClock /> Thời lượng</label>
            <input type="text" className="form-control" name="duration" value={form.duration} onChange={handleChange} placeholder="VD: 120 phút" />
          </div>
          <div className="col-md-6">
            <label><FaGlobe /> Quốc gia</label>
            <select name="country" className="form-select" value={form.country} onChange={handleChange}>
              <option value="">-- Chọn quốc gia --</option>
              {countries.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label>Chủ đề</label>
            <select name="topic" className="form-select" value={form.topic} onChange={handleChange}>
              <option value="">-- Chọn chủ đề --</option>
              {TOPICS.map((topic, i) => (
                <option key={i} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label>Loại phim</label>
            <select name="movieType" className="form-select" value={form.movieType} onChange={handleChange}>
              <option value="SINGLE">Phim lẻ</option>
              <option value="SERIES">Phim bộ</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-bold">Tác giả</label>

            {/* Radio chọn chế độ */}
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="authorOption"
                checked={!isNewAuthor}
                onChange={() => setIsNewAuthor(false)}
              />
              <label className="form-check-label">Chọn tác giả có sẵn</label>
            </div>
            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="radio"
                name="authorOption"
                checked={isNewAuthor}
                onChange={() => setIsNewAuthor(true)}
              />
              <label className="form-check-label">Tạo tác giả mới</label>
            </div>

            {/* Chế độ: Chọn tác giả có sẵn */}
           {!isNewAuthor ? (
            <Select
              isMulti
              options={authorOptions}
              value={authorOptions.filter(opt => form.authorIds?.includes(opt.value))}
              onChange={(selected) =>
                setForm({
                  ...form,
                  authorIds: selected.map(opt => opt.value)
                })
              }
              placeholder="Chọn tác giả..."
              className="basic-multi-select"
              classNamePrefix="select"
            />
          ) : (
            /* Form thêm tác giả mới giữ nguyên như trước */
            <div>
              {newAuthor.map((author, idx) => (
                <div key={idx} className="d-flex gap-2 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tên tác giả"
                    value={author.name}
                    onChange={(e) => updateNewAuthor(idx, "name", e.target.value)}
                  />
                  <select
                    className="form-select"
                    value={author.authorRole}
                    onChange={(e) => updateNewAuthor(idx, "authorRole", e.target.value)}
                  >
                    <option value="DIRECTOR">Đạo diễn</option>
                    <option value="PERFORMER">Diễn viên</option>
                  </select>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={addNewAuthorField}
              >
                + Thêm tác giả
              </button>
            </div>
          )}

          
        </div>
          {/* Video */}
          <div className="col-12">
            <label className="form-label"><FaVideo /> Video</label>
            <div className="d-flex align-items-center gap-2 mb-2">
              <input type="checkbox" checked={uploadVideo} onChange={() => setUploadVideo(!uploadVideo)} /> Upload Link
            </div>
            {uploadVideo ? (
              <input type="text" className="form-control" name="videoLink" value={form.videoLink} onChange={handleChange} placeholder="Nhập link video..." required />
            ) : (
              <input type="file" className="form-control" name="video" accept="video/*" onChange={handleChange} required />
            )}
          </div>

          {/* Thumbnail */}
          <div className="col-12">
            <label className="form-label"><FaImage /> Thumbnail</label>
            <input type="file" className="form-control" name="thumbnail" accept="image/*" onChange={handleChange} />
          </div>

          {/* Buttons */}
          <div className="col-12 d-flex gap-2 mt-3">
            <button className="btn btn-primary flex-fill" type="submit" disabled={loading}>
              {loading ? "Đang thêm..." : "Thêm phim"}
            </button>
            <button className="btn btn-outline-secondary flex-fill" onClick={onSuccess}>Đóng</button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ModelAddMovie;
