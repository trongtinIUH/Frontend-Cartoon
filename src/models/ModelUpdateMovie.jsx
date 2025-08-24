import React, { useEffect, useMemo, useState } from "react";
import MovieService from "../services/MovieService";
import AuthorService from "../services/AuthorService";
import { getCountries } from "../api/countryApi";
import GENRES from "../constants/genres";
import TOPICS from "../constants/topics";
import Select from "react-select";
import { toast } from "react-toastify";
import { FaVideo, FaImage, FaClock, FaGlobe, FaTags, FaLink } from "react-icons/fa";
import "../css/ModelUpdateMovie.css";

export default function ModelUpdateMovie({ movieId, onClose, onSuccess }) {
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
    trailerUrl: "",
   
    //trailer phim nếu sắp ra
    trailerVideo: null,
   
    // completed-only (nội dung phim)
    contentVideo: null,
  

    authorIds: [],
    slug: ""       
  });
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");

  const [loading, setLoading] = useState(false);

  // Countries
  const [countries, setCountries] = useState([]);
  useEffect(() => {
    (async () => setCountries(await getCountries()))();
  }, []);

  // Authors
  const [allAuthors, setAllAuthors] = useState([]);      // toàn bộ tác giả (để chọn)
  const [isNewAuthor, setIsNewAuthor] = useState(false); // toggle tạo mới
  const [newAuthors, setNewAuthors] = useState([{ name: "", authorRole: "DIRECTOR" }]);

  // Options cho react-select
  const authorOptions = useMemo(
    () =>
      (allAuthors || []).map((a) => ({
        value: a.authorId,
        label: `${a.name} (${a.authorRole})`,
      })),
    [allAuthors]
  );

  // Load movie + authors
  useEffect(() => {
    (async () => {
      try {
        // Movie core
        const res = await MovieService.getMovieById(movieId);
        const m = res?.movie || res;
        if (!m) return toast.error("Không tìm thấy phim");
        setForm((f) => ({
          ...f,
          title: m.title || "",
          originalTitle: m.originalTitle || "",
          description: m.description || "",
          genres: m.genres || [],
          country: m.country || "",
          topic: m.topic || "",
          status: m.status || "UPCOMING",
          minVipLevel: m.minVipLevel || "FREE",
          releaseYear: m.releaseYear || "",
          duration: m.duration || "",
          movieType: m.movieType || "SINGLE",
          slug: m.slug || "",
          authorIds: m.authorIds || [],
          thumbnail: null,
          banner: null,
          trailerVideo: m.trailerUrl || "",
        }));
        setThumbnailPreview(m.thumbnailUrl || "");
        setBannerPreview(m.bannerUrl || "");

        // Tất cả tác giả (để chọn)
        const listAll = await AuthorService.getAllAuthors();
        setAllAuthors(Array.isArray(listAll) ? listAll : []);

        // Nếu BE chưa lưu m.authorIds, vẫn có thể lấy từ endpoint riêng
        if (!m.authorIds || !m.authorIds.length) {
          const authorsOfMovie = await AuthorService.getAuthorsByMovieId(movieId);
          const ids = (authorsOfMovie || []).map((a) => a.authorId);
          setForm((f) => ({ ...f, authorIds: ids }));
        }
      } catch (e) {
        console.error(e);
        toast.error("Không tải được dữ liệu phim/tác giả");
      }
    })();
  }, [movieId]);

  // ===== Handlers
  const THUMB_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp"];
  const isImg = (f) => f && THUMB_TYPES.includes(f.type);
  const isValidImage = (f) => f && THUMB_TYPES.includes(f.type);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    if (type === "file") {
      const file = files?.[0];
      if (!file) return;

      if (name === "thumbnail") {
        if (!isImg(file)) return toast("Ảnh thumbnail không hợp lệ");
        setForm((f) => ({ ...f, thumbnail: file }));
        setThumbnailPreview(URL.createObjectURL(file));
      } else if (name === "banner") {
        if (!isImg(file)) return toast("Ảnh banner không hợp lệ");
        setForm((f) => ({ ...f, banner: file }));
        setBannerPreview(URL.createObjectURL(file));
      } else if (name === "trailerVideo") {
        setForm((f) => ({ ...f, trailerVideo: file }));
      }
      return; 
    }

    
    setForm((f) => ({ ...f, [name]: value }));
  };


  const handleGenreChange = (e) => {
    const { value, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      genres: checked ? [...prev.genres, value] : prev.genres.filter((g) => g !== value),
    }));
  };

  const addNewAuthorField = () =>
    setNewAuthors((arr) => [...arr, { name: "", authorRole: "DIRECTOR" }]);

  const updateNewAuthor = (idx, field, value) =>
    setNewAuthors((arr) => {
      const n = [...arr];
      n[idx] = { ...n[idx], [field]: value };
      return n;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error("Vui lòng nhập tiêu đề");

    setLoading(true);
    try {
      // 1) tạo tác giả mới (giữ nguyên như bạn đang làm)
      let createdIds = [];
      if (isNewAuthor) {
        const payloads = newAuthors
          .map((a) => ({ name: a.name?.trim(), authorRole: a.authorRole }))
          .filter((a) => a.name);
        if (payloads.length) {
          const created = await Promise.all(payloads.map((p) => AuthorService.createAuthor(p)));
          createdIds = created.map((x) => x.authorId);
        }
      }
      const allIds = Array.from(new Set([...(form.authorIds || []), ...createdIds]));

      // 2) FormData: ✅ append đủ field
      const fd = new FormData();
      [
        "title",
        "originalTitle",
        "description",
        "country",
        "topic",
        "status",
        "minVipLevel",
        "releaseYear",
        "duration",
        "movieType",
        "slug",
      ].forEach((k) => {
        const v = form[k];
        if (v !== undefined && v !== null && `${v}` !== "") fd.append(k, v);
      });

      (form.genres || []).forEach((g) => fd.append("genres", g));
      (allIds || []).forEach((id) => fd.append("authorIds", id));

      if (form.thumbnail) fd.append("thumbnail", form.thumbnail);
      if (form.banner) fd.append("banner", form.banner);
      if (form.trailerVideo && form.status === "UPCOMING") {
        fd.append("trailerVideo", form.trailerVideo);
      }

      await MovieService.updateMovie(movieId, fd);

      // 3) Link movie vào tác giả (nếu BE cần)
      if (allIds.length) {
        await AuthorService.addMovieToMultipleAuthors(allIds, movieId);
      }

      toast.success("Cập nhật thành công");
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi cập nhật: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="modal-overlay">
      <div className="model-add-movie">
        <h4>Cập nhật phim</h4>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Title & Description */}
          <div className="mb-3">
            <label className="form-label">Tiêu đề</label>
            <input className="form-control" name="title" value={form.title} onChange={handleChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Mô tả</label>
            <textarea className="form-control" rows={3} name="description" value={form.description} onChange={handleChange}/>
          </div>

          {/* Genres */}
          <div className="mb-3">
            <label className="form-label d-block">Thể loại</label>
            <div className="d-flex flex-wrap">
              {GENRES.map((g) => (
                <div key={g} className="form-check me-3 mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`g-${g}`}
                    value={g}
                    checked={form.genres.includes(g)}
                    onChange={handleGenreChange}
                  />
                  <label className="form-check-label" htmlFor={`g-${g}`}>{g}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Status / VIP / Country */}
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="UPCOMING">UPCOMING</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">VIP tối thiểu</label>
              <select className="form-select" name="minVipLevel" value={form.minVipLevel} onChange={handleChange}>
                <option value="FREE">FREE</option>
                <option value="VIP1">VIP1</option>
                <option value="VIP2">VIP2</option>
                <option value="VIP3">VIP3</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Quốc gia</label>
              <select name="country" className="form-select" value={form.country} onChange={handleChange}>
                <option value="">-- Chọn quốc gia --</option>
                {countries.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Authors */}
          <div className="mt-3">
            <label className="form-label fw-bold">Tác giả</label>
            <div className="d-flex gap-4 mb-2">
              <div className="form-check">
                <input className="form-check-input" type="radio" name="authorMode" checked={!isNewAuthor} onChange={() => setIsNewAuthor(false)} />
                <label className="form-check-label">Chọn tác giả có sẵn</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="authorMode" checked={isNewAuthor} onChange={() => setIsNewAuthor(true)} />
                <label className="form-check-label">Tạo tác giả mới</label>
              </div>
            </div>

            {!isNewAuthor ? (
              <Select
                isMulti
                options={authorOptions}
                value={authorOptions.filter((o) => form.authorIds.includes(o.value))}
                onChange={(selected) => setForm((f) => ({ ...f, authorIds: (selected || []).map((s) => s.value) }))}
                placeholder="Chọn tác giả..."
                classNamePrefix="select"
              />
            ) : (
              <div>
                {newAuthors.map((a, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tên tác giả…"
                      value={a.name}
                      onChange={(e) => updateNewAuthor(idx, "name", e.target.value)}
                    />
                    <select
                      className="form-select"
                      value={a.authorRole}
                      onChange={(e) => updateNewAuthor(idx, "authorRole", e.target.value)}
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

          {/* Topic */}
          <div className="mb-3 mt-3">
            <label className="form-label">Chủ đề</label>
            <select name="topic" className="form-select" value={form.topic} onChange={handleChange}>
              <option value="">-- Chọn chủ đề --</option>
              {TOPICS.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Thumbnail */}
          <div className="mb-3">
            <label className="form-label">Thumbnail</label>
            <input type="file" className="form-control" accept="image/*" onChange={handleChange} />
            {thumbnailPreview && (
              <div className="mt-2">
                <img src={thumbnailPreview} alt="preview" style={{ maxHeight: 80, borderRadius: 6 }} />
              </div>
            )}
          </div>

          <div className="col-md-6">
                  <label className="form-label"><FaImage /> Banner</label>
                  <input type="file" className="form-control" name="banner" accept="image/*" onChange={handleChange} />
              {bannerPreview && (
              <div className="mt-2">
                <img src={bannerPreview} alt="preview" style={{ maxHeight: 80, borderRadius: 6 }} />
              </div>
            )}
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
                      {form.trailerUrl && (
                        <video
                          className="mt-2 w-100"
                          src={form.trailerUrl}
                          controls
                          style={{ maxHeight: 200, borderRadius: 6 }}
                        />
                      )}
                    </div>
                  )}

          {/* Actions */}
          <div className="modal-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Đang cập nhật..." : "Cập nhật"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}
