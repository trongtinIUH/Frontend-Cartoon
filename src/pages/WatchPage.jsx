import React, { useEffect, useRef, useState, useMemo,useCallback } from "react";
import { Link, useLocation, useNavigate,useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 

import RatingModal from "../components/RatingModal";
import AuthorService from "../services/AuthorService";
import EpisodeService from "../services/EpisodeService";
import MovieService from "../services/MovieService";

import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";
import { Funnel } from "lucide-react";
import {
  faHeart, faPlus, faFlag, faShareNodes, faCirclePlay
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../css/WatchPage.css";
import { initAntiCapture } from "../utils/antiCapture"; 

/*import phần bình luận */
import { toast } from "react-toastify";
import FeedbackService from "../services/FeedbackService";
import default_avatar from "../image/default_avatar.jpg";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";




dayjs.extend(relativeTime);
dayjs.locale("vi");



export default function WatchPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const episode  = state?.episode;             // { id,title,videoUrl,number,season }
  const movie    = state?.movie;               // { id, title, year, genres[], alias, poster, ... }
  const episodes = state?.episodes || [];  


  const movieId = movie?.movieId; // dùng cho bình luận
  const { MyUser } = useAuth();
  const userId = MyUser?.my_user?.userId ?? null;

  const [seasons, setSeasons] = useState(state?.seasons || []);
  const [selectedSeason, setSelectedSeason] = useState(seasons[0] || null);
  const [epsOfSeason, setEpsOfSeason] = useState(state?.episodes || []);

  const [authors, setAuthors] = useState(state?.authors || []);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState([]);
  const totalRatings = ratings.length;
  const avgRating = totalRatings
    ? ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0) / totalRatings
    : 0;

    // tải cast
  useEffect(() => {
    (async () => {
      if (!movie?.movieId) return;
      if (!authors?.length) {
        try {
          const list = await AuthorService.getAuthorsByMovieId(movie.movieId);
          setAuthors(Array.isArray(list) ? list : []);
        } catch {}
      }
    })();
  }, [movie?.movieId]);

// tải ratings
  useEffect(() => {
    (async () => {
      if (!movie?.movieId) return;
      try {
        const list = await MovieService.getAllMovieRatings(movie.movieId);
        setRatings(Array.isArray(list) ? list : []);
      } catch {}
    })();
  }, [movie?.movieId]);

// tải seasons + episodes theo season (nếu không được truyền qua state)
  useEffect(() => {
    (async () => {
      if (!movie?.movieId) return;
      try {
        if (!seasons.length) {
          const detail = await MovieService.getMovieDetail(movie.movieId);
          const arr = Array.isArray(detail?.seasons) ? detail.seasons : [];
          setSeasons(arr);
          const first = arr[0] || null;
          setSelectedSeason(first);
          if (first?.seasonId) {
            const eps = await EpisodeService.getEpisodesBySeasonId(first.seasonId);
            setEpsOfSeason(Array.isArray(eps) ? eps : []);
          } else {
            setEpsOfSeason([]);
          }
        } else if (!epsOfSeason.length && selectedSeason?.seasonId) {
          const eps = await EpisodeService.getEpisodesBySeasonId(selectedSeason.seasonId);
          setEpsOfSeason(Array.isArray(eps) ? eps : []);
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movie?.movieId]);

  const handlePickSeason = async (s) => {
    setSelectedSeason(s);
    try {
      const eps = await EpisodeService.getEpisodesBySeasonId(s.seasonId);
      setEpsOfSeason(Array.isArray(eps) ? eps : []);
    } catch {
      setEpsOfSeason([]);
    }
  };

  const handleRateSubmit = async (value) => {
  try {
    await MovieService.saveMovieRating(movie.movieId, value, userId);
    const list = await MovieService.getAllMovieRatings(movie.movieId);
    setRatings(Array.isArray(list) ? list : []);
    setShowRatingModal(false);
  } catch (e) {
    toast.error("Đánh giá thất bại");
  }
};




  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(5); // số bình luận mỗi trang
  const [totalPages, setTotalPages] = useState(1);


  const nextEp = useMemo(() => {
    if (!episode) return null;
    const idx = episodes.findIndex(e => e.id === episode.id);
    return idx >= 0 && idx + 1 < episodes.length ? episodes[idx + 1] : null;
  }, [episode, episodes]);

  const playerRef = useRef(null);
  const videoRef  = useRef(null);
  const antiCapCleanupRef = useRef(null);

  // khối player để đo chiều cao làm placeholder
  const frameRef = useRef(null);
  const [playerH, setPlayerH] = useState(0);

  const [isTheater, setIsTheater] = useState(false);
  const [autoNext, setAutoNext]   = useState(true);
  const [sticky, setSticky]       = useState(false);
  const [liked, setLiked]         = useState(false);
  const [inList, setInList]       = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Init video.js
  useEffect(() => {
    if (!episode?.videoUrl || !videoRef.current) return;

    const player = videojs(videoRef.current, {
      controls: true,
      autoplay: true,
      preload: "auto",
      fluid: true,
      responsive: true,
      sources: [{ src: episode.videoUrl, type: "application/x-mpegURL" }],
    },function onReady() {
        // gắn anti-capture & giữ cleanup
        antiCapCleanupRef.current?.();
        antiCapCleanupRef.current = initAntiCapture(player);
      }
    );

    player.hlsQualitySelector?.({ displayCurrentQuality: true });

    player.on("ended", () => {
      if (autoNext && nextEp) {
        navigate(`/watch/${movie?.movieId}/${nextEp.episodeId }`, {
          state: { episode: nextEp, movie, episodes }
        });
      }
    });

    playerRef.current = player;
   return () => {
     // gỡ anti-capture listeners/timers TRƯỚC khi dispose player
      antiCapCleanupRef.current?.();
      antiCapCleanupRef.current = null;
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
  };
}, [episode?.videoUrl]);
  // đo chiều cao khung player (cho placeholder)
  useEffect(() => {
    const measure = () => {
      if (frameRef.current) {
        setPlayerH(frameRef.current.getBoundingClientRect().height || 0);
      }
    };
   
  }, [episode?.videoUrl]);

  // Sticky mini-player (desktop) + hysteresis tránh giật
  useEffect(() => {
    const isDesktop = () => window.innerWidth >= 992;
    const ENTER = 360; // vượt mức này mới bật sticky
    const LEAVE = 240; // tụt xuống dưới mức này mới tắt
    let ticking = false;

    const onScroll = () => {
      if (!isDesktop()) { setSticky(false); return; }
      const y = window.scrollY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          setSticky(prev => (prev ? y > LEAVE : y > ENTER));
          ticking = false;
        });
        ticking = true;
      }
    };

    const onResize = () => { if (!isDesktop()) setSticky(false); };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);



  // tự viết kéo thả không dùng thư viện
  const [pos, setPos] = useState({ x: 0, y: 0 });
const [dragging, setDragging] = useState(false);
const [offset, setOffset] = useState({ x: 0, y: 0 });

const onMouseDown = (e) => {
  setDragging(true);
  setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
};

const onMouseMove = (e) => {
  if (dragging) {
    setPos({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }
};

const onMouseUp = () => setDragging(false);

useEffect(() => {
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  return () => {
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
}, [dragging, offset]);


//phần bình luận
    const fetchFeedback = useCallback(async () => {
      if (!movieId) return;
      try {
        const { items, totalPages: tp } = await FeedbackService.getListFeedbackByIdMovie(movieId, page, size);
        setComments(items);
        setTotalPages(tp || 1);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu phản hồi:", error);
        setComments([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, [movieId, page, size]);

    useEffect(() => {
      fetchFeedback();
    }, [fetchFeedback]);

    const goTo = (p) => {
      if (p < 0 || p >= totalPages || loading) return;
      setPage(p);
    };

    const getPageItems = (total, current, siblings = 1) => {
      if (total <= 1) return [0];
      const first = 0;
      const last = total - 1;
      const start = Math.max(current - siblings, first + 1);
      const end = Math.min(current + siblings, last - 1);
      const items = [first];
      if (start > first + 1) items.push("ellipsis-left");
      for (let i = start; i <= end; i++) items.push(i);
      if (end < last - 1) items.push("ellipsis-right");
      if (last > first) items.push(last);
      return items;
    };
    const pageItems = React.useMemo(() => getPageItems(totalPages, page, 1), [totalPages, page]);

    const handleFeedbackSubmit = async () => {
      if (!comment.trim()) {
        toast.error("Nội dung không được để trống");
        return;
      }
      if (!movieId) {
        toast.error("Không tìm thấy movieId");
        return;
      }
      if (!userId) {
        toast.error("Bạn cần đăng nhập để bình luận");
        return;
      }

      setSubmitting(true);
      try {
        await FeedbackService.submitFeedback({ userId, movieId, content: comment });
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


  if (!episode) return <div className="watch-empty">Không tìm thấy tập phim.</div>;
  return (
    <div className={`watch layout ${isTheater ? "theater" : ""}`}>
      {/* Bread + back */}
      <div className="watch-bread">
        <button onClick={() => navigate(-1)} className="btn-circle" title="Quay lại">
          ‹
        </button>
        <h1 className="watch-title">
           <span className="sub">Xem phim {movie?.title}</span>
        </h1>
      </div>

      {/* PLAYER */}
      <section className="player-wrap">
     <div
        ref={frameRef}
        className={`player-frame ${sticky ? "is-sticky" : ""} ${dragging ? "dragging" : ""}`}
        style={{
          position: sticky ? "fixed" : "static",
          left: sticky ? pos.x : undefined,
          top: sticky ? pos.y : undefined,
          transform: sticky && !dragging ? "scale(0.35) translate(-100%, -100%)" : "none",
          cursor: sticky ? "move" : "default"
        }}
        onMouseDown={sticky ? onMouseDown : undefined}
      >
 <div data-vjs-player>
      <video
        id="my-video"
        ref={videoRef}
        className="video-js vjs-default-skin vjs-big-play-centered"
        playsInline
        controls
      />
    </div>
</div>
      {/* Khi sticky bật, hiển thị thông tin phim phía trên */}
    {sticky && (
      <div className="watch-info-top">
        <h2>{movie?.title}</h2>
        <div className="tags">
          {movie?.year && <span className="chip">{movie.year}</span>}
          {movie?.genres?.slice(0, 4).map(g => (
            <span key={g} className="chip ghost">{g}</span>
          ))}
        </div>
        {movie?.desc && <p className="desc">{movie.desc}</p>}
      </div>
    )}
        {/* giữ chỗ khi sticky để trang không “tụt” */}
        {sticky && <div className="player-placeholder" style={{ height: playerH }} aria-hidden />}

        {/* CONTROL BAR */}
        <div className="player-controls">
          <button className={`pc-item ${liked ? "active" : ""}`} onClick={() => setLiked(v => !v)}>
            <FontAwesomeIcon icon={faHeart} /> <span>Yêu thích</span>
          </button>
          <button className={`pc-item ${inList ? "active" : ""}`} onClick={() => setInList(v => !v)}>
            <FontAwesomeIcon icon={faPlus} /> <span>Thêm vào</span>
          </button>

          <div className="pc-toggle">
            <span>Tự chuyển</span>
            <label className="switch">
              <input type="checkbox" checked={autoNext} onChange={e => setAutoNext(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>

          <div className="pc-toggle">
            <span>Rạp phim</span>
            <label className="switch">
              <input type="checkbox" checked={isTheater} onChange={e => setIsTheater(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>

          <button className="pc-item">
            <FontAwesomeIcon icon={faShareNodes} /> <span>Chia sẻ</span>
          </button>

          <div className="pc-spacer" />
          {nextEp && (
            <button
              className="pc-next"
              onClick={() => navigate(`/watch/${movie?.id}/${nextEp.id}`, {
                state: { episode: nextEp, movie, episodes }
              })}
              title={`Xem tập ${nextEp.number}`}
            >
              <FontAwesomeIcon icon={faCirclePlay} /> Tập {nextEp.number}
            </button>
          )}
          <button className="pc-item danger">
            <FontAwesomeIcon icon={faFlag} /> <span>Báo lỗi</span>
          </button>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="watch-grid">
        {/* LEFT */}
        <div className="wg-main">
          <div className="info-card">
            <div className="poster">
              <img src={movie?.poster||movie?.thumbnailUrl} alt={movie?.title} />
              <div className="quality-badge">HD</div>
            </div>
            <div className="meta">
              <h2 className="movie-title">
                <Link to={`/movie/${movie?.movieId || movie?.id}`}>{movie?.title}</Link>
              </h2>
              {movie?.topic && <div className="topic-badge">{movie.topic}</div>}
              
              <div className="tags">
                {movie?.releaseYear && <span className="chip year">{movie.releaseYear}</span>}
                {movie?.genres?.slice(0, 4).map(g => <span key={g} className="chip genre">{g}</span>)}
              </div>

              {movie?.description && (
                <div className="description-section">
                  <p className={`description ${showFullDescription ? 'expanded' : 'collapsed'}`}>
                    {movie.description}
                  </p>
                  {movie.description.length > 150 && (
                    <button 
                      className="toggle-description"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                    >
                      {showFullDescription ? 'Thu gọn' : 'Xem thêm'}
                      <span className={`arrow ${showFullDescription ? 'up' : 'down'}`}>
                        {showFullDescription ? '▲' : '▼'}
                      </span>
                    </button>
                  )}
                </div>
              )}

              <div className="movie-stats">
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-value">{avgRating.toFixed(1)}</span>
                  <span className="stat-label">({totalRatings} đánh giá)</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">👁</span>
                  <span className="stat-value">{movie?.viewCount || 0}</span>
                  <span className="stat-label">lượt xem</span>
                </div>
              </div>
            </div>
          </div>

          <div className="episodes-box">
            <div className="eb-head">
              <div className="season-bar">
                {seasons.map((s) => (
                  <button
                    key={s.seasonId}
                    className={`btn-season ${selectedSeason?.seasonId === s.seasonId ? "is-active" : ""}`}
                    onClick={() => handlePickSeason(s)}
                  >
                    Season {s.seasonNumber}
                    {Number(s.episodesCount) ? <span className="mini-badge">{s.episodesCount}</span> : null}
                  </button>
                ))}
                {seasons.length === 0 && <span className="text-muted">Chưa có season.</span>}
              </div>

              <div className="right-tools"><Funnel size={18} /><span>Lọc</span></div>
            </div>

            <div className="eb-grid">
              {epsOfSeason.length > 0 ? (
                epsOfSeason.map((ep) => {
                  const epId = ep.episodeId || ep.id;
                  const epNo = ep.episodeNumber || ep.number;
                  return (
                    <button
                      key={epId}
                      className={`ep-card ${epId === (episode.episodeId || episode.id) ? "active" : ""}`}
                      onClick={() =>
                        navigate(`/watch/${movie?.movieId}/${epId}`, {
                          state: { episode: ep, movie, episodes: epsOfSeason, authors, seasons },
                        })
                      }
                    >
                      <div className="ep-meta">
                        <span className="ep-no">Tập {epNo}</span>
                        <span className="ep-title">{ep.title || ""}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-muted" style={{padding:"10px"}}>Season này chưa có tập.</div>
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
                <a href="/" style={{ color: '#4bc1fa', textDecoration: 'none' }} className="fw-bold">
                  đăng nhập
                </a>{" "}
                để tham gia bình luận.
              </small>
            )}

            <div className="card bg-black border-0 mb-3 mt-3">
              <div className="card-body">
                <textarea
                  className="form-control bg-dark text-white border-secondary"
                  rows="3"
                  placeholder="Viết bình luận..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  style={{ 
                    height: '100px', 
                    resize: 'none',
                    color: '#ffffff !important',
                    backgroundColor: '#343a40 !important'
                  }}
                  disabled={submitting || !userId}
                />
                <div className="d-flex justify-content-between align-items-center mt-2 bg-black">
                  <small className="text-white">{comment.length} / 1000</small>
                  <i
                    role="button"
                    aria-disabled={submitting || !comment.trim() || !userId}
                    className={`btn-rate ms-1 ${submitting || !comment.trim() || !userId ? "opacity-50 pe-none" : ""}`}
                    onClick={handleFeedbackSubmit}
                  >
                    {submitting ? "Đang gửi..." : "Gửi"} <i className="fa-solid fa-paper-plane ms-1" />
                  </i>
                </div>
              </div>
            </div>

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
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold text-truncate">
                        {fb.userName || "Ẩn danh"}
                        <small className="text-secondary ms-2">{dayjs(fb.createdAt).fromNow()}</small>
                      </div>
                      <p className="mb-0 text-break" style={{ whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                        {fb.content}
                      </p>
                    </div>
                  </div>
                  <hr />
                </div>
              ))}
              {comments.length === 0 && (
                <div className="text-secondary text-center py-3">Chưa có bình luận nào</div>
              )}
            </div>

            <nav aria-label="Feedback pagination" className="mt-2">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => goTo(page - 1)} aria-label="Previous">
                    &laquo;
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
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          </div>

        </div>

        {/* RIGHT */}
        <aside className="wg-side">
          <div className="rate-box">
            <div className="score">{avgRating.toFixed(1)}</div>
            <div className="act">
              <button onClick={() => setShowRatingModal(true)}>Đánh giá</button>
              <button onClick={() => document.querySelector(".comments-top")?.scrollIntoView({behavior:"smooth"})}>Bình luận</button>
            </div>
          </div>


        <div className="actors-box">
          <div className="box-head">Đạo diễn</div>
          <div className="actors">
            {authors.filter(a => a.authorRole === "DIRECTOR").map(a => (
              <Link key={a.authorId} className="actor" to={`/author/${a.authorId}`}>
                <img src={a.avatarUrl || a.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={a.name} />
                <span>{a.name}</span>
              </Link>
            ))}
            {authors.filter(a => a.authorRole === "DIRECTOR").length === 0 && (
              <div className="text-muted" style={{padding:"0 12px 10px"}}>Chưa có dữ liệu</div>
            )}
          </div>

          <div className="box-head">Diễn viên</div>
          <div className="actors">
            {authors.filter(a => a.authorRole === "PERFORMER").map(a => (
              <Link key={a.authorId} className="actor" to={`/author/${a.authorId}`}>
                <img src={a.avatarUrl || a.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={a.name} />
                <span>{a.name}</span>
              </Link>
            ))}
            {authors.filter(a => a.authorRole === "PERFORMER").length === 0 && (
              <div className="text-muted" style={{padding:"0 12px 10px"}}>Chưa có dữ liệu</div>
            )}
          </div>
        </div>


          <div className="suggest-box">
            <div className="box-head">Đề xuất cho bạn</div>
            <div className="suggest">
              {(movie?.suggest || []).slice(0, 6).map(s => (
                <Link key={s.id} className="s-item" to={`/movie/${s.id}`}>
                  <img src={s.poster} alt={s.title} />
                  <div className="s-meta">
                    <div className="t">{s.title}</div>
                    <div className="a">{s.alias}</div>
                    <div className="line">
                      {s.age && <span className="chip">{s.age}</span>}
                      {s.season && <span className="chip ghost">Phần {s.season}</span>}
                      {s.episode && <span className="chip ghost">Tập {s.episode}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <RatingModal
        show={showRatingModal}
        movieTitle={movie?.title}
        average={avgRating}
        total={totalRatings}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRateSubmit}
      />

    </div>
  );
}
