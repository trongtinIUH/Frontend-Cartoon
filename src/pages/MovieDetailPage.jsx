import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MovieService from "../services/MovieService";
import AuthorService from "../services/AuthorService";
import RatingModal from "../components/RatingModal";
import { useAuth } from "../context/AuthContext";
import TrailerPlayer from "../components/TrailerPlayer";
import "../css/MovieDetailPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlus, faShare, faCommentDots, faPlay } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import FeedbackService from "../services/FeedbackService";
import default_avatar from "../image/default_avatar.jpg"
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import WishlistService from "../services/WishlistService";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const MovieDetailPage = () => {
  const { id } = useParams();
  const { MyUser } = useAuth();
  const userId = MyUser?.my_user?.userId ?? null;

  const [movie, setMovie] = useState(null);
  const [authors, setAuthors] = useState([]); // luôn là array
  const [topMovies, setTopMovies] = useState([]);
  const navigate = useNavigate();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState([]); // danh sách rating của phim
  const [tab, setTab] = useState("episodes");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(0);
  const size = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // state thêm:
  const [seasons, setSeasons] = useState([]);       // [{seasonId, seasonNumber, ...}]
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);     // episodes của season đang chọn


  // Lấy tất cả đánh giá của phim
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const data = await MovieService.getAllMovieRatings(id);
        setRatings(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu đánh giá:", error);
        setRatings([]);
      }
    };
    fetchRatings();
  }, [id]);

  //tính tổng rating 
  const totalRatings = ratings.length;
  const avgRating = totalRatings
    ? (ratings.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalRatings)
    : 0;


  // Lấy chi tiết phim
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const data = await MovieService.getMovieById(id);
        setMovie({
          ...data.movie,
          episodes: data.episodes || [],
        });
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu phim:", error);
      }
    };
    fetchMovie();
  }, [id]);

  // Lấy thông tin author trong bộ phim
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const data = await AuthorService.getAuthorsByMovieId(id);
        setAuthors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu tác giả:", error);
        setAuthors([]);
      }
    };
    fetchAuthors();
  }, [id]);

  // Lấy top phim tuần
  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        const data = await MovieService.getPopularMovies();
        setTopMovies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi lấy top phim tuần:", error);
        setTopMovies([]);
      }
    };
    fetchTopMovies();
  }, []);

  // nạp chi tiết (movie + seasons + count)
  useEffect(() => {
    (async () => {
      try {
        const data = await MovieService.getMovieDetail(id); // BE trả: { movie, seasons: [...] }
        setMovie(data.movie);
        setSeasons(Array.isArray(data.seasons) ? data.seasons : []);
        // nếu có season thì chọn season đầu và nạp tập
        if (data.seasons && data.seasons.length > 0) {
          const first = data.seasons[0];
          setSelectedSeason(first);
          const eps = await EpisodeService.getEpisodesByMovieId(first.seasonId);
          setEpisodes(Array.isArray(eps) ? eps : []);
        } else {
          setSelectedSeason(null);
          setEpisodes([]);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  // đổi season -> nạp tập
  const handleSelectSeason = async (s) => {
    setSelectedSeason(s);
    try {
      const eps = await EpisodeService.getEpisodesByMovieId(s.seasonId);
      setEpisodes(Array.isArray(eps) ? eps : []);
    } catch (e) {
      console.error(e);
      setEpisodes([]);
    }
};



  const handleWatch = (episode) => {
    navigate("/watch", { state: { episode, movie, authors, episodes } });
  };


  const handleWatchFirst = () => {
  if (!movie) return;

  if (movie.status === "UPCOMING") {
    if (!movie.trailerUrl) {
      toast.error("Phim sắp chiếu chưa có trailer.");
      return;
    }
    // Có thể phát ngay trên trang, nên không navigate nữa
    document.getElementById("trailer-section")?.scrollIntoView({ behavior: "smooth" });
    return;
  }

  if (!episodes || episodes.length === 0) {
    toast.warn("Chưa có tập nào trong season này.");
    return;
  }
  navigate("/watch", { state: { episode: episodes[0], movie, seasons, episodes } });
};


  const handleClickTopMovie = async (mid) => {
    try {
      await MovieService.incrementViewCount(mid);
    } catch (_) { }
    navigate(`/movie/${mid}`);
  };
  const handleOpenRatingModal = () => {
    setShowRatingModal(true);
  };

  const handleCloseRatingModal = () => {
    setShowRatingModal(false);
  };
  //dánh giá phim

  const handleRateSubmit = async (value) => {
    try {
      await MovieService.saveMovieRating(id, value, userId);
      // gọi lại API lấy chi tiết để cập nhật điểm trung bình + số lượt
      const list = await MovieService.getAllMovieRatings(id);
      setRatings(Array.isArray(list) ? list : []);

      setShowRatingModal(false);
    } catch (error) {
      console.error("Đánh giá thất bại", error);
    }
  };

  const fetchFeedback = useCallback(async () => {
    if (!id) return;
    try {
      const { items, totalPages: tp } = await FeedbackService.getListFeedbackByIdMovie(id, page, size);
      setComments(items);
      setTotalPages(tp || 1);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu phản hồi:", error);
      setComments([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [id, page, size]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  React.useEffect(() => {
    window.scrollTo({ top: 200, behavior: 'smooth' });
  }, [page]);

  const goTo = (p) => {
    if (p < 0 || p >= totalPages || loading) return;
    setPage(p);
  };

  // current: số trang hiện tại (0-based); total: tổng số trang; siblings: số trang mỗi bên
  const getPageItems = (total, current, siblings = 1) => {
    if (total <= 1) return [0];
    const first = 0;
    const last = total - 1;

    const start = Math.max(current - siblings, first + 1);
    const end = Math.min(current + siblings, last - 1);

    const items = [first];

    if (start > first + 1) items.push('ellipsis-left');
    for (let i = start; i <= end; i++) items.push(i);
    if (end < last - 1) items.push('ellipsis-right');

    if (last > first) items.push(last);
    return items;
  };

  const pageItems = React.useMemo(() => getPageItems(totalPages, page, 1), [totalPages, page]);

  // tạo feedback
  const handleFeedbackSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }

    if (!id) {
      toast.error("Không tìm thấy movieId");
      return;
    }

    if (!userId) {
      toast.error("Bạn cần đăng nhập để bình luận");
      return;
    }

    console.log("Submitting feedback:", { userId, movieId: id, content: comment });

    setSubmitting(true);
    try {
      const payload = {
        userId,
        movieId: id,
        content: comment
      };
      await FeedbackService.submitFeedback(payload);
      toast.success("Gửi bình luận thành công!");
      setComment("");
      await fetchFeedback();
    } catch (error) {
      console.error(error);
      toast.error("Gửi bình luận thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // Thêm vào danh sách yêu thích
  useEffect(() => {
    const checkWishlist = async () => {
      if (!userId || !id) return;
      const exists = await WishlistService.existsInWishlist(userId, id);
      setIsInWishlist(exists);
    };

    checkWishlist();
  }, [userId, id]);

  const handleToggleWishlist = async () => {
    if (!id) return;
    try {
      if (isInWishlist) {
        await WishlistService.removeFromWishlist(userId, id);
        toast.success("Đã xóa khỏi danh sách yêu thích");
        setIsInWishlist(false);
      } else {
        await WishlistService.addToWishlist(userId, id);
        toast.success("Đã thêm vào danh sách yêu thích");
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error("Lỗi thao tác wishlist:", error);
      toast.error("Thao tác thất bại");
    }
  };

  if (!movie) return <div className="text-center mt-5">Đang tải thông tin phim...</div>;

  const directors = authors.filter((a) => a.authorRole === "DIRECTOR");
  const performers = authors.filter((a) => a.authorRole === "PERFORMER");

  return (
    <div className="min-vh-100 bg-dark text-white" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
      <div className="container py-5">
        <div className="row gx-5">
          {/* Cột trái: Thông tin phim */}
          <div className="col-lg-4 mb-4">
            <div className="movie-info-card glassmorphism p-4 shadow-lg rounded-4">
              <div className="align-items-center">
                <div className="col-md-4 text-center mb-3 mb-md-0">
                  <img
                    src={movie.thumbnailUrl || "https://via.placeholder.com/300x450"}
                    alt={movie.title}
                    className="img-fluid rounded-4 movie-poster shadow"
                  />
                </div>


                <h2 className="movie-title mb-3 mt-2" style={{ color: "#4bc1fa", fontSize: "20px", textDecoration: "none" }}
                >{movie.title}</h2>

                <div className="movie-badges mb-2">
                  {(movie.genres || []).map((g) => (
                    <span className="badge genre-badge me-2 mb-1" key={g}>
                      {g}
                    </span>
                  ))}
                </div>

                <p className="mb-2 text-white" style={{ fontSize: "14px" }}>
                  <strong>Mô tả:</strong> {movie.description || "Không có mô tả."}
                </p>

                <div className="d-flex flex-wrap mb-2 small" style={{ background: "transparent" }}>
                  <div className="me-4">
                    <strong>Ngày tạo:</strong>{" "}
                    {movie.createdAt ? new Date(movie.createdAt).toLocaleString() : "-"}
                  </div>
                  <div>
                    <strong>Lượt xem:</strong> {movie.viewCount || 0}
                  </div>

                  {/* Cast & Crew */}
                  {(directors.length > 0 || performers.length > 0) && (
                    <div className="cast-crew">
                      <div className="row g-2">
                        {/* Đạo diễn */}
                        {directors.length > 0 && (
                          <div className="col-md-6">
                            <div className="crew-section p-2 rounded" style={{ background: "rgba(245,158,11,0.1)" }}>
                              <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-video text-warning me-2"></i>
                                <span className="text-white fw-bold small">Đạo diễn</span>
                              </div>
                              <div className="crew-list">
                                {directors.map((d) => (
                                  <div key={d.authorId} className="crew-member text-warning small">
                                    • {d.name}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Diễn viên */}
                        {performers.length > 0 && (
                          <div className="col-md-6">
                            <div className="cast-section p-2 rounded" style={{ background: "rgba(139,92,246,0.1)" }}>
                              <div className="d-flex align-items-center mb-2">
                                <i className="fas fa-users text-info me-2"></i>
                                <span className="text-white fw-bold small">Diễn viên</span>
                              </div>
                              <div className="cast-list">
                                {performers.slice(0, 3).map((p) => (
                                  <div key={p.authorId} className="cast-member text-info small">
                                    • {p.name}
                                  </div>
                                ))}
                                {performers.length > 3 && (
                                  <div className="text-muted small">... và {performers.length - 3} người khác</div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
            <div className="mt-4 bg-dark p-4 rounded-4">
              <h5 className="mb-3 text-warning">
                <i className="bi bi-fire"></i> Top phim tuần này
              </h5>

              <ol className="list-unstyled">
                {topMovies.map((item, idx) => {
                  const movieId = item.id || item._id || item.movieId;
                  return (
                    <li
                      className="d-flex align-items-center mb-3"
                      key={movieId || `topmovie-${idx}`}
                      onClick={() => movieId && handleClickTopMovie(movieId)}
                      style={{ cursor: "pointer", borderRadius: "8px", padding: "10px", backgroundColor: "#1a1a1a" }}
                    >
                      <span className="top-rank me-3">{idx + 1}</span>
                      <img
                        src={item.thumbnailUrl || "https://via.placeholder.com/50x70"}
                        alt={item.title}
                        className="rounded-2 me-2 top-movie-thumb"
                        width={40}
                        height={56}
                      />
                      <div>
                        <div className="fw-bold text-truncate">{item.title}</div>
                        <div className="small text-truncate">{item.viewCount} lượt xem</div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="col-lg-8"> 
            {/* Trailer (UPCOMING) */}
            {movie.status === "UPCOMING" && movie.trailerUrl && (
              <div id="trailer-section" className="mb-4">
                <h5 className="mb-3">Trailer</h5>
                <TrailerPlayer src={movie.trailerUrl} poster={movie.bannerUrl || movie.thumbnailUrl} />
              </div>
            )}

            <div className="top-movies-week glassmorphism p-4 rounded-4 shadow">
              {/* Thanh hành động */}
              <div className="movie-action-bar d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 mt-2 px-3 py-2 glassmorphism-action">
                <div
                  className="d-flex align-items-center gap-4"
                  style={{ background: "rgba(38, 38, 48, 0.88)" }}
                >
                  <button
                    className="btn btn-watch w-100 d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm"
                    onClick={handleWatchFirst}
                  >
                    <FontAwesomeIcon icon={faPlay} className="play-icon" />
                    Xem Ngay
                  </button>

                  <div
                    className="action-icons d-flex align-items-center gap-4 ms-2"
                    style={{ background: "rgba(38, 38, 48, 0.88)" }}
                  >
                    <div className="action-item text-center"
                      onClick={handleToggleWishlist}
                      style={{ color: isInWishlist ? "#4bc1fa" : "" }}
                    >
                      <FontAwesomeIcon icon={faHeart} className="mb-1" />
                      <div className="action-label small">Yêu thích</div>
                    </div>
                    <div className="action-item text-center">
                      <FontAwesomeIcon icon={faPlus} className="mb-1" />
                      <div className="action-label small">Thêm vào</div>
                    </div>
                    <div className="action-item text-center">
                      <FontAwesomeIcon icon={faShare} className="mb-1" />
                      <div className="action-label small">Chia sẻ</div>
                    </div>
                  </div>
                </div>

                <div className="movie-score d-flex align-items-center gap-2 px-3 py-1 rounded-4">
                  <span className="score-icon">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/616/616490.png"
                      alt="star"
                      width={20}
                    />
                  </span>
                  <span className="fw-bold" style={{ fontSize: "1.15rem" }}>
                    {avgRating.toFixed(1)}
                  </span>
                  <button
                    type="button"
                    className="btn-rate ms-1"
                    onClick={handleOpenRatingModal}
                  >
                    Đánh giá
                  </button>
                </div>
              </div>

              {/* Tabs: Tập phim / Diễn viên */}
              <div className="container mt-4 mb-3">
                <ul className="nav">
                  <li className="nav-item">
                    <i
                      className={`nav-link text-white ${tab === "episodes" ? "action-item" : ""}`}
                      onClick={() => setTab("episodes")}
                    >
                      Tập phim
                    </i>
                  </li>
                  <li className="nav-item">
                    <i
                      className={`nav-link text-white ${tab === "cast" ? "action-item" : ""}`}
                      onClick={() => setTab("cast")}
                    >
                      Diễn viên
                    </i>
                  </li>
                </ul>
                <hr />

                <div className="tab-content">
                  {/* Tab: Tập phim */}
                  {tab === "episodes" && (
                    <div className="tab-pane fade show active">

                      {/* COMPLETED: Seasons + Episodes */}
                      {movie.status === "COMPLETED" && (
                        <>
                          {/* Season tabs */}
                          <div className="d-flex flex-wrap gap-2 mb-3">
                            {seasons.map(s => (
                              <button
                                key={s.seasonId}
                                className={`btn btn-sm ${selectedSeason?.seasonId === s.seasonId ? "btn-primary" : "btn-outline-primary"}`}
                                onClick={async () => {
                                  setSelectedSeason(s);
                                  try {
                                    const eps = await EpisodeService.getEpisodesByMovieId(s.seasonId); // (nên rename: getEpisodesBySeasonId)
                                    setEpisodes(Array.isArray(eps) ? eps : []);
                                  } catch {
                                    setEpisodes([]);
                                  }
                                }}
                              >
                                Season {s.seasonNumber}{s.episodesCount ? ` (${s.episodesCount})` : ""}
                              </button>
                            ))}
                            {seasons.length === 0 && <span className="text-muted">Chưa có season nào</span>}
                          </div>

                          {/* Episode list */}
                          <div className="row">
                            {episodes.map(ep => (
                              <div
                                key={ep.episodeId || `${ep.seasonId}-${ep.episodeNumber}`}
                                className="col-6 col-md-4 col-lg-3 mb-3"
                                onClick={() => handleWatch(ep)}
                                style={{ cursor: "pointer" }}
                              >
                                <div className="p-2 rounded-3 glassmorphism-ep h-100">
                                  <div className="fw-bold">Tập {ep.episodeNumber}</div>
                                  <div className="small text-truncate">{ep.title || ""}</div>
                                </div>
                              </div>
                            ))}
                            {episodes.length === 0 && (
                              <div className="text-muted">Season này chưa có tập.</div>
                            )}
                          </div>
                        </>
                      )}

                      {/* UPCOMING: không có danh sách tập, chỉ trailer (đã render phía trên) */}
                      {movie.status === "UPCOMING" && (
                        <div className="text-muted">Phim sắp chiếu — xem trailer bên trên.</div>
                      )}
                    </div>
                  )}



                  {/* Tab: Diễn viên */}
                  {tab === "cast" && (
                    <div className="tab-pane fade show active">
                      {/* <div className="row g-3">
                        {cast.map((c) => (
                          <div className="col-6 col-md-4 col-lg-3" key={c.id}>
                            <div className="card h-100 bg-dark-subtle bg-opacity-10 border-0">
                              <div className="card-body text-center ratio ratio-1x1">
                                <img
                                  src={c.avatar}
                                  alt={c.name}
                                  className="rounded-top object-fit-cover"
                                />
                                <div className="fw-semibold text-white text-truncate align-self-center">
                                  {c.name}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div> */}
                    </div>
                  )}
                </div>
              </div>
              <div className="container mt-4">
                <h5 className="text-white">
                  <i className="fa-regular fa-comment-dots me-2" /> Bình luận
                </h5>
                <small className="text-white mb-3">Vui lòng <a href="/" style={{ color: '#4bc1fa', textDecoration: 'none' }} className="fw-bold">đăng nhập</a> để tham gia bình luận.</small>
                {/* Ô nhập bình luận */}
                <div className="card bg-black border-0 mb-3 mt-3">
                  <div className="card-body">
                    <textarea
                      className="form-control bg-dark text-white border-secondary"
                      rows="3"
                      placeholder="Viết bình luận..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={1000}
                      style={{ height: '100px', resize: 'none' }}
                      disabled={submitting}
                    />
                    <div className="d-flex justify-content-between align-items-center mt-2 bg-black">
                      <small className="text-white">{comment.length} / 1000</small>
                      <i
                        role="button"
                        aria-disabled={submitting || !comment.trim()}
                        className={`btn-rate ms-1 ${submitting || !comment.trim() ? "opacity-50 pe-none" : ""}`}
                        onClick={handleFeedbackSubmit}
                      >
                        {submitting ? "Đang gửi..." : "Gửi"} <i className="fa-solid fa-paper-plane ms-1" />
                      </i>
                    </div>
                  </div>
                </div>

                {/* Danh sách bình luận */}
                <div className="container mt-4 comments-top">
                  {comments.map((fb) => (
                    <div key={fb.feedbackId ?? fb.id} className="list-group-item text-white mb-3 mt-4">
                      <div className="d-flex align-items-start mb-2 glassmorphism border-0">
                        <img
                          src={fb.avatarUrl || default_avatar}
                          alt={fb.userId}
                          className="rounded-circle me-3 flex-shrink-0"
                          width="42" height="42"
                        />
                        <div className="flex-grow-1 min-w-0" style={{ minWidth: 0 }}>
                          <div className="fw-bold text-truncate">
                            {fb.userName || "Ẩn danh"}
                            <small className="text-secondary ms-2">{dayjs(fb.createdAt).fromNow()}</small>
                          </div>
                          <p className="mb-0 text-break" style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                            {fb.content}
                          </p>
                        </div>
                      </div> <hr />
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-secondary text-center py-3">Chưa có bình luận nào</div>
                  )}
                </div>

                {/* Pagination */}
                <nav aria-label="Feedback pagination" className="mt-2">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => goTo(page - 1)} aria-label="Previous">
                        <span aria-hidden="true">&laquo;</span>
                        <span className="visually-hidden">Previous</span>
                      </button>
                    </li>

                    {pageItems.map((it, idx) =>
                      typeof it === 'number' ? (
                        <li key={idx} className={`page-item ${page === it ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => goTo(it)}>{it + 1}</button>
                        </li>
                      ) : (
                        <li key={idx} className="page-item disabled">
                          <span className="page-link">…</span>
                        </li>
                      )
                    )}

                    <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => goTo(page + 1)} aria-label="Next">
                        <span aria-hidden="true">&raquo;</span>
                        <span className="visually-hidden">Next</span>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          <RatingModal
            show={showRatingModal}
            movieTitle={movie.title}
            average={avgRating}
            total={totalRatings}
            onClose={handleCloseRatingModal}
            onSubmit={handleRateSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
