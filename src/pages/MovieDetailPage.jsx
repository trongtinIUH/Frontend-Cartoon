import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import MovieService from "../services/MovieService";
import AuthorService from "../services/AuthorService";
import EpisodeService from "../services/EpisodeService";
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
import { createSecureWatchUrl } from "../utils/urlUtils";
import { buildFeedbackTree, FeedbackItem } from "../components/FeedbackItem";

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
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
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
  const [totals, setTotals] = useState({ seasonsCount: 0, episodesCount: 0 });


  const [descExpanded, setDescExpanded] = useState(false);
  // hiển thị nút khi mô tả đủ dài
  const needClamp = (movie?.description || "").trim().length > 220;

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

  // Lấy top phim tuần (sử dụng recommendations API)
  useEffect(() => {
    const fetchTopMovies = async () => {
      try {
        // Sử dụng API recommendations giống như WatchPage
        const data = await MovieService.getRecommendations(id, 10);
        setTopMovies(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Lỗi khi lấy top phim tuần:", error);
        setTopMovies([]);
      }
    };

    if (id) {
      fetchTopMovies();
    }
  }, [id]); // Thay đổi dependency để re-fetch khi id thay đổi

  // nạp chi tiết (movie + seasons + count)
  useEffect(() => {
    (async () => {
      try {
        const data = await MovieService.getMovieDetail(id); // { movie, seasons, seasonsCount?, episodesCount? }
        setMovie(data.movie);

        const seasonsArr = Array.isArray(data.seasons) ? data.seasons : [];
        setSeasons(seasonsArr);

        // ✅ Ưu tiên dùng số BE trả về; nếu không có thì tự tính
        const seasonsCount = data.seasonsCount ?? seasonsArr.length;
        const episodesCount =
          data.episodesCount ??
          seasonsArr.reduce((sum, s) => sum + (Number(s.episodesCount) || 0), 0);

        setTotals({ seasonsCount, episodesCount });

        // chọn season đầu & nạp tập như cũ
        if (seasonsArr.length > 0) {
          const first = seasonsArr[0];
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



  // ✅ Helper kiểm tra quyền VIP trước khi xem
  const checkAndGoWatch = async (ep) => {
    if (!movie) return;

    // Trailer thì cho xem luôn
    if (movie.status === "UPCOMING") {
      if (movie.trailerUrl) {
        document.getElementById("trailer-section")?.scrollIntoView({ behavior: "smooth" });
      } else {
        toast.error("Phim sắp chiếu chưa có trailer.");
      }
      return;
    }

    // Phim FREE thì ai cũng được xem
    const required = movie.minVipLevel || "FREE";
    
    // ✅ Kiểm tra quyền với BE
    try {
      const res = await MovieService.canWatch(movie.movieId, userId);
      console.log("VIP check result:", res); // Debug log
      if (!res.allowed) {
        if (res.status === 404) {
          toast.error("Phim không tồn tại hoặc đã bị gỡ.");
        } else {
          toast.info(res.message || "Bạn chưa đủ quyền xem phim này.");
        }
        return;
      }
    } catch (error) {
      console.error("VIP check error:", error);
      toast.error("Có lỗi khi kiểm tra quyền xem. Vui lòng thử lại.");
      return;
    }

    // ✅ được phép: điều hướng như cũ
    const secureUrl = createSecureWatchUrl(movie, ep);
    navigate(secureUrl, { state: { episode: ep, movie, authors, episodes, seasons } });
  };

// Thay đổi navigate trong MovieDetailPage
const handleWatch = (episode) => {
  console.log("handleWatch called with:", { movie, episode });
  checkAndGoWatch(episode);
};


  const handleWatchFirst = () => {
    if (!movie) return;
    
    if (!episodes?.length) {
      if (movie.trailerUrl) {
        toast.info("Chưa có tập phim, xem trailer bên dưới nhé.");
        document.getElementById("trailer-section")?.scrollIntoView({ behavior: "smooth" });
      } else {
        toast.warn("Chưa có tập nào.");
      }
      return;
    }
    
    // ✅ Sử dụng checkAndGoWatch thay vì navigate trực tiếp
    checkAndGoWatch(episodes[0]);
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
      setComments(buildFeedbackTree(items));
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

  const handleSendReply = async (parentFb) => {
    try {
      const payload = {
        userId,
        movieId: id,
        content: replyContent,
        parentFeedbackId: parentFb.feedbackId,
      };
      await FeedbackService.submitFeedback(payload);
      toast.success("Trả lời thành công!");
      setReplyContent("");
      setReplyTo(null);
      await fetchFeedback();
    } catch (err) {
      console.error(err);
      toast.error("Gửi trả lời thất bại");
    }
  };

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

    setSubmitting(true);
    try {
      const payload = {
        userId,
        movieId: id,
        content: comment,
        parentFeedbackId: replyTo ? replyTo.feedbackId : null
      };
      await FeedbackService.submitFeedback(payload);
      toast.success("Gửi bình luận thành công!");
      setComment("");
      setReplyTo(null);
      await fetchFeedback();
    } catch (error) {
      console.error(error);
      toast.error("Gửi bình luận thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  // like feedback
  const handleLikeFeedback = async (feedbackId) => {
    if (!userId) {
      toast.error("Bạn cần đăng nhập để thực hiện thao tác này");
      return;
    }
    try {
      await FeedbackService.likeFeedback(feedbackId, userId);
      // Cập nhật lại danh sách feedback
      await fetchFeedback();
    } catch (error) {
      console.error("Lỗi khi thích phản hồi:", error);
      toast.error("Thao tác thất bại");
    }
  };

  // dislike feedback
  const handleDislikeFeedback = async (feedbackId) => {
    if (!userId) {
      toast.error("Bạn cần đăng nhập để thực hiện thao tác này");
      return;
    }
    try {
      await FeedbackService.dislikeFeedback(feedbackId, userId);
      // Cập nhật lại danh sách feedback
      await fetchFeedback();
    } catch (error) {
      console.error("Lỗi khi không thích phản hồi:", error);
      toast.error("Thao tác thất bại");
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
  // Card hiển thị 1 người (đạo diễn/diễn viên)
  function PersonCard({ p }) {
    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-3 mb-3">
        <Link
          to={`/browse/author-id/${encodeURIComponent(p?.authorId || '')}`}
          className="text-decoration-none"
          title={`Xem phim của ${p?.name || 'Chưa rõ tên'}`}
        >
          <div
            className="person-card h-100"
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(75, 193, 250, 0.3)' }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(75, 193, 250, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div className="ratio ratio-3x4 person-avatar-wrap">
            </div>
            <div className="person-name text-truncate" title={p?.name || ""}>
              {p?.name || "Chưa rõ tên"}
            </div>
            <span className={`role-badge ${p?.authorRole === "DIRECTOR" ? "role-director" : "role-performer"}`}>
              {p?.authorRole === "DIRECTOR" ? "Đạo diễn" : "Diễn viên"}
            </span>
          </div>
        </Link>
      </div>
    );
  }
  function SeasonBar({ seasons, selected, onSelect }) {
    const scrollerRef = React.useRef(null);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    const update = () => {
      const el = scrollerRef.current;
      if (!el) return;
      setCanLeft(el.scrollLeft > 0);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
      update();
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }, []);

    const scrollByPx = (dx) => scrollerRef.current?.scrollBy({ left: dx, behavior: "smooth" });

    return (
      <div className="season-bar">
        {canLeft && (
          <button className="season-arrow left" onClick={() => scrollByPx(-280)} aria-label="Trước">
            ‹
          </button>
        )}

        <div className="season-scroll" ref={scrollerRef} onScroll={update}>
          {seasons.map((s) => (
            <button
              key={s.seasonId}
              className={`season-chip ${selected?.seasonId === s.seasonId ? "active" : ""}`}
              onClick={() => onSelect(s)}
              title={`Season ${s.seasonNumber}`}
            >
              <span className="label">Season {s.seasonNumber}</span>
              {typeof s.episodesCount !== "undefined" && (
                <span className="count">{s.episodesCount}</span>
              )}
            </button>
          ))}
          {seasons.length === 0 && <span className="text-muted">Chưa có season nào</span>}
        </div>

        {canRight && (
          <button className="season-arrow right" onClick={() => scrollByPx(280)} aria-label="Sau">
            ›
          </button>
        )}
      </div>
    );
  }

  //hiện ảnh poster
  const banner = movie?.bannerUrl?.trim();
  const fallback = movie?.thumbnailUrl || "";      // khi thiếu banner
  const heroImg = banner || fallback;
  const heroMode = banner ? "landscape" : "portrait";

  return (
    <div className="movie-detail-page text-white">
      {/* HERO ở đầu trang */}
      <section className={`detail-hero ${heroMode}`}>
        {/* lớp nền lấp đầy (cover) */}
        <div className="hero-bg" style={{ backgroundImage: `url("${heroImg}")` }} />

        {/* chỉ hiện khi KHÔNG có banner (ảnh poster dọc) để khỏi méo */}
        {!banner && (
          <div className="hero-center">
            <img src={heroImg} alt={movie.title} />
          </div>
        )}

        <div className="hero-vignette" />
        <div className="hero-grain" />
      </section>

      {/* BODY trồi lên hero */}
      <div className="detail-content content-over-hero">
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
                  {/* Tên tiếng Anh - phụ */}
                  {movie.originalTitle && (
                    <div className="original-title mb-2" style={{
                      color: "#adb5bd",
                      fontSize: "14px",
                      fontStyle: "italic",
                      opacity: 0.85,
                      marginTop: "-8px" // ✅ Thay đổi từ -4px thành -8px
                    }}>
                      <i className="fas" style={{ fontSize: "12px", opacity: 0.7 }}></i>
                      {movie.originalTitle}
                    </div>
                  )}

                  <div className="movie-badges mb-2">
                    {(movie.genres || []).map((g) => (
                      <Link 
                        to={`/browse/the-loai/${encodeURIComponent(g)}`} 
                        className="badge genre-badge me-2 mb-1" 
                        key={g}
                        style={{ textDecoration: 'none', cursor: 'pointer' }}
                      >
                        {g}
                      </Link>
                    ))}
                  </div>

                  <div className="movie-description mb-3">
                    <div className="d-flex align-items-center mb-2">
                      <i className="fas fa-align-left me-2" style={{ color: "#4bc1fa", fontSize: "14px" }}></i>
                      <strong style={{ color: "#fff", fontSize: "15px" }}>Nội dung phim</strong>
                    </div>

                    <div
                      className={`description-content p-3 rounded-3 ${descExpanded ? "is-expanded" : "is-clamped"}`}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)"
                      }}
                    >
                      <p className="desc-text mb-0">
                        {movie.description || "Chưa có mô tả cho bộ phim này."}
                      </p>
                    </div>

                    {needClamp && (
                      <button
                        type="button"
                        className="btn-see-more"
                        onClick={() => setDescExpanded(v => !v)}
                        aria-expanded={descExpanded}
                      >
                        {descExpanded ? "Thu gọn" : "Xem thêm"}
                      </button>
                    )}
                  </div>


                  <div className="d-flex flex-wrap mb-2 small" style={{ background: "transparent" }}>
                    <div className="movie-details mb-3">
                      <div className="detail-item mb-2">
                        <span className="detail-label fw-bold">Năm sản xuất:</span>{" "}
                        <span className="detail-value">{movie.releaseYear || "-"}</span>
                      </div>

                      <div className="detail-item mb-2">
                        <span className="detail-label fw-bold">Lượt xem:</span>{" "}
                        <span className="detail-value">{(movie.viewCount || 0).toLocaleString()}</span>
                      </div>

                      <div className="detail-item mb-2">
                        <span className="detail-label fw-bold">Thời lượng:</span>{" "}
                        <span className="detail-value">{movie.duration ? `${movie.duration}` : "-"}</span>
                      </div>

                      <div className="detail-item mb-2">
                        <span className="detail-label fw-bold">Quốc gia:</span>{" "}
                        {movie.country ? (
                          <Link 
                            to={`/browse/quoc-gia/${encodeURIComponent(movie.country)}`}
                            className="detail-value"
                            style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                          >
                            {movie.country}
                          </Link>
                        ) : (
                          <span className="detail-value">-</span>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <h5 className="mb-3 text-warning">
                  <i className="bi bi-fire me-2" /> Top phim tuần này
                </h5>

                <div className="list-group">
                  {(topMovies || []).slice(0, 10).map((item, idx) => {
                    const movieId = item.movieId || item.id || item._id;
                    const views = Number(item.viewCount || 0).toLocaleString("vi-VN");

                    return (
                      <a
                        key={movieId || `top-${idx}`}
                        href="#"
                        className="list-group-item list-group-item-action bg-dark text-white border rounded-3 px-3 py-2"
                        onClick={(e) => {
                          e.preventDefault();
                          movieId && handleClickTopMovie(movieId);
                        }}
                        tabIndex={-1}                 // tránh hiện focus ring (viền trắng)
                        style={{ boxShadow: "none" }} // phòng trường hợp vẫn còn shadow
                      >
                        <div className="d-flex align-items-center w-100" style={{ background: "rgba(34, 36, 52, 0.7)" }}>
                          <span className="badge bg-warning text-dark me-3">{idx + 1}</span>

                          <img
                            src={item.thumbnailUrl || "https://via.placeholder.com/46x64?text=No+Img"}
                            alt={item.title}
                            className="rounded me-3"
                            style={{ width: 46, height: 64, objectFit: "cover" }}
                          />

                          <div className="flex-grow-1">
                            <div className="fw-semibold text-truncate">
                              {item.title && item.title.length > 20
                                ? `${item.title.substring(0, 20)}...`
                                : item.title
                              }
                            </div>
                            <div className="small text-truncate">{views} lượt xem</div>
                          </div>


                        </div>
                      </a>
                    );
                  })}

                  {(!topMovies || topMovies.length === 0) && (
                    <div className="list-group-item bg-dark text-secondary border rounded-3">
                      Chưa có dữ liệu tuần này
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-8">
              {/* Trailer - hiển thị cho tất cả phim có trailer */}
              {movie.trailerUrl && (
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
                    {/* Main buttons row for mobile */}
                    <div className="main-buttons-row d-flex w-100 gap-3" style={{ background: 'transparent' }}>
                      <button
                        className="btn btn-watch d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow-sm"
                        onClick={handleWatchFirst}
                        style={{ flex: movie.trailerUrl ? '1' : '1' }}
                      >
                        <FontAwesomeIcon icon={faPlay} className="play-icon" />
                        Xem Ngay
                      </button>

                      {/* Button Xem Trailer - hiển thị cho tất cả phim có trailer */}
                      {movie.trailerUrl && (
                        <button
                          className="btn d-flex align-items-center gap-2 px-4 py-2 fw-bold shadow"
                          onClick={() => document.getElementById("trailer-section")?.scrollIntoView({ behavior: "smooth" })}
                          style={{
                            flex: '1',
                            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                          }}
                        >
                          <FontAwesomeIcon icon={faPlay} className="play-icon" />
                          Xem Trailer
                        </button>
                      )}
                    </div>

                    <div
                      className="action-icons d-flex align-items-center"
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
                            <SeasonBar
                              seasons={seasons}
                              selected={selectedSeason}
                              onSelect={async (s) => {
                                setSelectedSeason(s);
                                try {
                                  const eps = await EpisodeService.getEpisodesByMovieId(s.seasonId);
                                  setEpisodes(Array.isArray(eps) ? eps : []);
                                } catch {
                                  setEpisodes([]);
                                }
                              }}
                            />
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
                        {(directors.length + performers.length === 0) && (
                          <div className="text-muted">Chưa có thông tin diễn viên/đạo diễn.</div>
                        )}

                        {directors.length > 0 && (
                          <>
                            <h6 className="section-heading mb-2">Đạo diễn</h6>
                            <div className="row g-3 cast-grid">
                              {directors.map((d) => <PersonCard key={d.authorId} p={d} />)}
                            </div>
                          </>
                        )}

                        {performers.length > 0 && (
                          <>
                            <h6 className="section-heading mt-3 mb-2">Diễn viên</h6>
                            <div className="row g-3 cast-grid">
                              {performers.map((p) => <PersonCard key={p.authorId} p={p} />)}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                  </div>
                </div>
                <div className="container mt-4">
                  <h5 className="text-white">
                    <i className="fa-regular fa-comment-dots me-2" /> Bình luận
                  </h5>
                  {!userId && (
                    <small className="text-white mb-3">
                      Vui lòng{" "}
                      <a href="/" style={{ color: "#4bc1fa", textDecoration: "none" }} className="fw-bold">
                        đăng nhập
                      </a>{" "}
                      để tham gia bình luận.
                    </small>
                  )}

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
                      console.log(fb),
                      <FeedbackItem
                        key={fb.feedbackId}
                        fb={fb}
                        userId={userId}
                        replyTo={replyTo}
                        replyContent={replyContent}
                        setReplyContent={setReplyContent}
                        setReplyTo={setReplyTo}
                        handleLikeFeedback={handleLikeFeedback}
                        handleDislikeFeedback={handleDislikeFeedback}
                        handleSendReply={handleSendReply}
                      />
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
    </div>
  );
};

export default MovieDetailPage;
