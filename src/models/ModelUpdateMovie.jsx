import React, { useEffect, useMemo, useState } from "react";
import MovieService from "../services/MovieService";
import AuthorService from "../services/AuthorService";
import { getCountries } from "../api/countryApi";
import GENRES from "../constants/genres";
import TOPICS from "../constants/topics";
import Select from "react-select";
import { toast } from "react-toastify";
import { FaVideo, FaImage, FaClock, FaGlobe, FaTags } from "react-icons/fa";
import "../css/ModelUpdateMovie.css";

export default function ModelUpdateMovie({ movieId, onClose, onSuccess }) {
  const [initialStatus, setInitialStatus] = useState("UPCOMING");
  const [form, setForm] = useState({
    title: "", originalTitle: "", description: "", genres: [],
    country: "", topic: "", movieType: "SINGLE",
    minVipLevel: "FREE", status: "UPCOMING", releaseYear: "", duration: "",
    thumbnail: null, banner: null, trailerUrl: "",
    trailerVideo: null,     // dùng khi chuyển sang UPCOMING
    contentVideo: null,     // dùng khi chuyển sang COMPLETED
    authorIds: [], slug: ""
  });
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  useEffect(() => { (async () => setCountries(await getCountries()))(); }, []);

  const [allAuthors, setAllAuthors] = useState([]);
  const [isNewAuthor, setIsNewAuthor] = useState(false);
  const [newAuthors, setNewAuthors] = useState([{ name: "", authorRole: "DIRECTOR" }]);

  const authorOptions = useMemo(
    () => (allAuthors || []).map(a => ({ value: a.authorId, label: `${a.name} (${a.authorRole})` })),
    [allAuthors]
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await MovieService.getMovieById(movieId);
        const m = res?.movie || res;
        if (!m) return toast.error("Không tìm thấy phim");
        setForm(f => ({
          ...f,
          title: m.title || "", originalTitle: m.originalTitle || "", description: m.description || "",
          genres: m.genres || [], country: m.country || "", topic: m.topic || "",
          status: m.status || "UPCOMING", minVipLevel: m.minVipLevel || "FREE",
          releaseYear: m.releaseYear || "", duration: m.duration || "",
          movieType: m.movieType || "SINGLE", slug: m.slug || "",
          authorIds: m.authorIds || [], trailerUrl: m.trailerUrl || "",
          thumbnail: null, banner: null, trailerVideo: null, contentVideo: null
        }));
        setThumbnailPreview(m.thumbnailUrl || "");
        setBannerPreview(m.bannerUrl || "");
        setInitialStatus(m.status || "UPCOMING");

        const listAll = await AuthorService.getAllAuthors();
        setAllAuthors(Array.isArray(listAll) ? listAll : []);
        if (!m.authorIds || !m.authorIds.length) {
          const authorOfMovie = await AuthorService.getAuthorsByMovieId(movieId);
          setForm(f => ({ ...f, authorIds: (authorOfMovie || []).map(a => a.authorId) }));
        }
      } catch (e) {
        console.error(e);
        toast.error("Không tải được dữ liệu phim/tác giả");
      }
    })();
  }, [movieId]);

  const THUMB_TYPES = ["image/jpeg","image/png","image/gif","image/webp","image/bmp"];
  const isImg = (f) => f && THUMB_TYPES.includes(f.type);

  const handleChange = (e) => {
    const { name, value, files, type } = e.target;
    if (type === "file") {
      const file = files?.[0];
      if (!file) return;
      if (name === "thumbnail") {
        if (!isImg(file)) return toast("Ảnh thumbnail không hợp lệ");
        setForm(f => ({ ...f, thumbnail: file })); setThumbnailPreview(URL.createObjectURL(file));
      } else if (name === "banner") {
        if (!isImg(file)) return toast("Ảnh banner không hợp lệ");
        setForm(f => ({ ...f, banner: file })); setBannerPreview(URL.createObjectURL(file));
      } else if (name === "trailerVideo") {
        setForm(f => ({ ...f, trailerVideo: file }));
      } else if (name === "contentVideo") {
        setForm(f => ({ ...f, contentVideo: file }));
      }
      return;
    }
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleGenreChange = (e) => {
    const { value, checked } = e.target;
    setForm(prev => ({
      ...prev,
      genres: checked ? [...prev.genres, value] : prev.genres.filter(g => g !== value),
    }));
  };

  const addNewAuthorField = () => setNewAuthors(arr => [...arr, { name: "", authorRole: "DIRECTOR" }]);
  const updateNewAuthor = (idx, field, value) => setNewAuthors(arr => {
    const n = [...arr]; n[idx] = { ...n[idx], [field]: value }; return n;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error("Vui lòng nhập tiêu đề");
    const switchingToCompleted = initialStatus !== "COMPLETED" && form.status === "COMPLETED";
    const switchingToUpcoming  = initialStatus !== "UPCOMING"  && form.status === "UPCOMING";

    // Gợi ý: nếu chuyển sang COMPLETED mà chưa chọn ep1 → cảnh báo (BE sẽ enforce)
    if (switchingToCompleted && !form.contentVideo) {
      return toast.error("Hãy chọn file video Tập 1 khi chuyển sang COMPLETED");
    }
    if (switchingToUpcoming && !form.trailerVideo && !form.trailerUrl) {
      // Nếu DB chưa có trailerUrl và bạn không up file mới
      // BE cũng sẽ báo lỗi — FE nhắc trước cho mượt
      return toast.error("UPCOMING yêu cầu trailer (file)");
    }

    setLoading(true);
    try {
      // 1) Tạo tác giả mới (nếu có)
      let createdIds = [];
      if (isNewAuthor) {
        const payloads = newAuthors.map(a => ({ name: a.name?.trim(), authorRole: a.authorRole }))
                                   .filter(a => a.name);
        if (payloads.length) {
          const created = await Promise.all(payloads.map(p => AuthorService.createAuthor(p)));
          createdIds = created.map(x => x.authorId);
        }
      }
      const allIds = Array.from(new Set([...(form.authorIds || []), ...createdIds]));

      // 2) Cập nhật movie (metadata/media ảnh)
      const fd = new FormData();
      ["title","originalTitle","description","country","topic","status","minVipLevel",
       "releaseYear","duration","movieType","slug"].forEach(k => {
        const v = form[k];
        if (v !== undefined && v !== null && `${v}` !== "") fd.append(k, v);
      });
      (form.genres || []).forEach(g => fd.append("genres", g));
      (allIds || []).forEach(id => fd.append("authorIds", id));
      if (form.thumbnail) fd.append("thumbnail", form.thumbnail);
      if (form.banner) fd.append("banner", form.banner);
      // Không gửi trailerVideo ở bước update — để gửi trong publish khi cần
      await MovieService.updateMovie(movieId, fd);

      // 3) Nếu đổi trạng thái → gọi publish (BE sẽ tạo ep1/validate trailer)
      if (initialStatus !== form.status) {
        await MovieService.publish(movieId, form.status, {
          trailerVideo: form.status === "UPCOMING"   ? form.trailerVideo : null,
          episode1Video: form.status === "COMPLETED" ? form.contentVideo : null,
        });
        setInitialStatus(form.status);
      }

      // 4) Liên kết movie vào tác giả
      if (allIds.length) await AuthorService.addMovieToMultipleAuthors(allIds, movieId);

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
          {/* Title & Original Title */}
          <div className="row g-3 mb-3">
            <div className="col-md-8">
              <label className="form-label">Tiêu đề</label>
              <input className="form-control" name="title" value={form.title} onChange={handleChange}/>
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
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label">Tên gốc (Original Title)</label>
              <input 
                type="text" 
                className="form-control" 
                name="originalTitle" 
                value={form.originalTitle} 
                onChange={handleChange}
                placeholder="Tên phim gốc (nếu có)"
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Slug</label>
              <input 
                type="text" 
                className="form-control" 
                name="slug" 
                value={form.slug} 
                onChange={handleChange}
                placeholder="URL slug (để trống để auto-generate)"
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="form-label">Mô tả</label>
            <textarea className="form-control" rows={3} name="description" value={form.description} onChange={handleChange}/>
          </div>

          {/* Genres */}
          <div className="mb-3">
            <label className="form-label d-block">Thể loại</label>
            <div className="d-flex flex-wrap">
              {GENRES.map(g => (
                <div key={g} className="form-check me-3 mb-2">
                  <input className="form-check-input" type="checkbox" id={`g-${g}`} value={g}
                         checked={form.genres.includes(g)} onChange={handleGenreChange}/>
                  <label className="form-check-label" htmlFor={`g-${g}`}>{g}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Status / VIP / Country / Type */}
          <div className="row g-3 mb-3">
            <div className="col-md-3">
              <label className="form-label">Trạng thái</label>
              <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                <option value="UPCOMING">UPCOMING</option>
                <option value="COMPLETED">COMPLETED</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">VIP tối thiểu</label>
              <select className="form-select" name="minVipLevel" value={form.minVipLevel} onChange={handleChange}>
                <option value="FREE">FREE</option>
                <option value="NO_ADS">NoAds</option>
                <option value="PREMIUM">Premium</option>
                <option value="MEGA_PLUS">MegaPlus</option>
                <option value="COMBO_PREMIUM_MEGA_PLUS">Combo Premium + Mega Plus</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Loại phim</label>
              <select name="movieType" className="form-select" value={form.movieType} onChange={handleChange}>
                <option value="SINGLE">Phim lẻ</option>
                <option value="SERIES">Phim bộ</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label"><FaGlobe /> Quốc gia</label>
              <select name="country" className="form-select" value={form.country} onChange={handleChange}>
                <option value="">-- Chọn quốc gia --</option>
                {countries.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Duration & Topic */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label"><FaClock /> Thời lượng</label>
              <input type="text" className="form-control" name="duration" value={form.duration}
                     onChange={handleChange} placeholder="VD: 120p (phút)"/>
              <div className="form-text">Định dạng đề nghị: <code>120p</code> (phút).</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Chủ đề</label>
              <select name="topic" className="form-select" value={form.topic} onChange={handleChange}>
                <option value="">-- Chọn chủ đề --</option>
                {TOPICS.map((t, i) => <option key={i} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Authors */}
          <div className="mt-3">
            <label className="form-label fw-bold">Tác giả</label>
            <div className="d-flex gap-4 mb-2">
              <div className="form-check">
                <input className="form-check-input" type="radio" name="authorMode" checked={!isNewAuthor} onChange={() => setIsNewAuthor(false)}/>
                <label className="form-check-label">Chọn tác giả có sẵn</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="authorMode" checked={isNewAuthor} onChange={() => setIsNewAuthor(true)}/>
                <label className="form-check-label">Tạo tác giả mới</label>
              </div>
            </div>

            {!isNewAuthor ? (
              <Select
                isMulti
                options={authorOptions}
                value={authorOptions.filter(o => form.authorIds.includes(o.value))}
                onChange={(sel) => setForm(f => ({ ...f, authorIds: (sel || []).map(s => s.value) }))}
                placeholder="Chọn tác giả..."
                classNamePrefix="select"
              />
            ) : (
              <div>
                {newAuthors.map((a, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-2">
                    <input type="text" className="form-control" placeholder="Tên tác giả…" value={a.name}
                           onChange={(e) => updateNewAuthor(idx, "name", e.target.value)}/>
                    <select className="form-select" value={a.authorRole}
                            onChange={(e) => updateNewAuthor(idx, "authorRole", e.target.value)}>
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

          {/* Media Files */}
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label"><FaImage /> Thumbnail</label>
              <input type="file" className="form-control" accept="image/*" name="thumbnail" onChange={handleChange}/>
              {thumbnailPreview && <div className="mt-2"><img src={thumbnailPreview} alt="preview" style={{ maxHeight: 80, borderRadius: 6 }}/></div>}
            </div>
            <div className="col-md-6">
              <label className="form-label"><FaImage /> Banner</label>
              <input type="file" className="form-control" name="banner" accept="image/*" onChange={handleChange}/>
              {bannerPreview && <div className="mt-2"><img src={bannerPreview} alt="preview" style={{ maxHeight: 80, borderRadius: 6 }}/></div>}
            </div>
          </div>

          {/* Video Files */}
          {form.status === "UPCOMING" && (
            <div className="mb-3">
              <label className="form-label"><FaVideo /> Trailer</label>
              <input type="file" className="form-control" name="trailerVideo" accept="video/*" onChange={handleChange}/>
              {form.trailerUrl && (
                <video className="mt-2 w-100" src={form.trailerUrl} controls style={{ maxHeight: 200, borderRadius: 6 }}/>
              )}
            </div>
          )}

          {form.status === "COMPLETED" && (
            <div className="mb-3">
              <label className="form-label"><FaVideo /> Tập 1 (khi chuyển sang COMPLETED)</label>
              <input type="file" className="form-control" name="contentVideo" accept="video/*" onChange={handleChange}/>
              <div className="form-text">Nếu phim đã có season/tập, BE sẽ bỏ qua và giữ nguyên số tập hiện có.</div>
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
