import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MovieService from "../services/MovieService";
import AuthorService from "../services/AuthorService";
import RatingModal from "../components/RatingModal";
import { useAuth } from "../context/AuthContext";
import "../css/MovieDetailPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faPlus, faShare, faCommentDots, faPlay } from "@fortawesome/free-solid-svg-icons";

const MovieDetailPage = () => {
  const { id } = useParams();
  const { MyUser } = useAuth();
  const userId = MyUser?.my_user?.userId || {};

  const [movie, setMovie] = useState(null);
  const [authors, setAuthors] = useState([]); // luôn là array
  const [topMovies, setTopMovies] = useState([]);
  const navigate = useNavigate();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState([]); // danh sách rating của phim

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

  const handleWatch = (episode) => {
    navigate("/watch", { state: { episode } });
  };

  const handleWatchFirst = () => {
    if (!movie || !movie.episodes || movie.episodes.length === 0) {
      alert("Phim này chưa có tập nào để xem!");
      return;
    }
    const firstEpisode = movie.episodes[0];
    handleWatch(firstEpisode);
  };

  const handleClickTopMovie = async (mid) => {
    try {
      await MovieService.incrementViewCount(mid);
    } catch (_) {}
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

  if (!movie) return <div className="text-center mt-5">Đang tải thông tin phim...</div>;

  const directors = authors.filter((a) => a.authorRole === "DIRECTOR");
  const performers = authors.filter((a) => a.authorRole === "PERFORMER");

  return (
    <div className="movie-detail-page">
      <div className="container py-5">
        <div className="row gx-5">
          {/* Cột trái: Thông tin phim */}
          <div className="col-lg-8 mb-4">
            <div className="movie-info-card glassmorphism p-4 shadow-lg rounded-4">
              <div className="row align-items-center">
                <div className="col-md-4 text-center mb-3 mb-md-0">
                  <img
                    src={movie.thumbnailUrl || "https://via.placeholder.com/300x450"}
                    alt={movie.title}
                    className="img-fluid rounded-4 movie-poster shadow"
                  />
                </div>

                <div className="col-md-8">
                  <h2 className="movie-title mb-3" style={{ color: "#ffd78bff" ,fontSize:"20px",textDecoration: "none" }}
                  >{movie.title}</h2>

                  <div className="movie-badges mb-2">
                    {(movie.genres || []).map((g) => (
                      <span className="badge genre-badge me-2 mb-1" key={g}>
                        {g}
                      </span>
                    ))}
                  </div>

                  <p className="mb-2">
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

                  {/* Thanh hành động */}
                  <div className="movie-action-bar d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 mt-2 px-3 py-2 glassmorphism-action">
                    <div
                      className="d-flex align-items-center gap-4"
                      style={{ background: "linear-gradient(120deg, #232526, #414345 80%)" }}
                    >
                      <button
                        className="btn btn-xem-ngay d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm"
                        onClick={handleWatchFirst}
                      >
                        <FontAwesomeIcon icon={faPlay} className="play-icon" />
                        Xem Ngay
                      </button>

                      <div
                        className="action-icons d-flex align-items-center gap-4 ms-2"
                        style={{ background: "linear-gradient(120deg, #232526, #414345 80%)" }}
                      >
                        <div className="action-item text-center">
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
                        <div className="action-item text-center">
                          <FontAwesomeIcon icon={faCommentDots} className="mb-1" />
                          <div className="action-label small">Bình luận</div>
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

              {/* Danh sách tập phim */}
              {movie.episodes && movie.episodes.length > 0 && (
                <div className="episodes mt-4">
                  <h5 className="mb-3">Danh sách tập phim</h5>
                  <div className="row">
                    {movie.episodes.map((ep) => (
                      <div key={ep.episodeId} className="col-6 col-md-4 col-lg-3 mb-3">
                        <div className="episode-card glassmorphism-ep p-2 rounded-3 shadow-sm">
                          <div className="fw-bold">Tập {ep.episodeNumber}</div>
                          <div className="small mb-2 text-truncate">{ep.title}</div>
                          <button onClick={() => handleWatch(ep)} className="btn btn-watch w-100">
                            Xem
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cột phải: Top phim tuần */}
          <div className="col-lg-4">
            <div className="top-movies-week glassmorphism p-4 rounded-4 shadow">
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
                      style={{ cursor: "pointer" }}
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
                        <div className="small text-muted">{item.viewCount} lượt xem</div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
