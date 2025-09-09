import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import RatingModal from "../components/RatingModal";
import AuthorService from "../services/AuthorService";
import EpisodeService from "../services/EpisodeService";
import MovieService from "../services/MovieService";
import WishlistService from "../services/WishlistService";

import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";

import { Funnel } from "lucide-react";
import { faHeart, faPlus, faFlag, faShareNodes, faCirclePlay, faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "../css/WatchPage.css";
import { initAntiCapture } from "../utils/antiCapture";
import { parseWatchUrl, createWatchUrl } from "../utils/urlUtils";

/* import phần bình luận */
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
  const params = useParams();
  const [searchParams] = useSearchParams();
  const { MyUser } = useAuth();

  // -------- URL parsing (ID + Slug support)
  const isSlugFormat = !params.movieId; // If no movieId, then it's slug format
  const urlMovieId = params.movieId || null;
  const urlEpisodeId = params.episodeId || null;
  const movieSlug = params.movieSlug || null;
  const episodeSlug = params.episodeSlug || null;
  const refParam = searchParams.get("ref");

  let urlData = null;
  if (isSlugFormat) {
    urlData = parseWatchUrl(movieSlug, episodeSlug, refParam);
  } else {
    urlData = { movieId: urlMovieId, episodeId: urlEpisodeId };
  }

  // -------- state từ navigate
  const episodeFromState = state?.episode || null;
  const movieFromState = state?.movie || null;

  // -------- global states
  const [isInWishlist, setIsInWishlist] = useState(false);
  const userId = MyUser?.my_user?.userId ?? null;

  const [seasons, setSeasons] = useState(state?.seasons || []);
  const [selectedSeason, setSelectedSeason] = useState(seasons[0] || null);
  const [epsOfSeason, setEpsOfSeason] = useState(state?.episodes || []);
  const [authors, setAuthors] = useState(state?.authors || []);

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState([]);

  // current movie/episode (nguồn sự thật)
  const [currentEpisode, setCurrentEpisode] = useState(episodeFromState);
  const [currentMovie, setCurrentMovie] = useState(movieFromState);
  const [dataLoading, setDataLoading] = useState(!episodeFromState || !movieFromState);
  const [suggestedMovies, setSuggestedMovies] = useState([]);

  // -------- computed
  const totalRatings = ratings.length;
  const avgRating = totalRatings
    ? ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0) / totalRatings
    : 0;

  const movieId =
    currentMovie?.movieId || movieFromState?.movieId || urlData?.movieId || urlMovieId || null;

  // Khi có state từ navigate, đồng bộ vào current*
  useEffect(() => {
    if (state?.episode) setCurrentEpisode(state.episode);
    if (state?.movie) setCurrentMovie(state.movie);
    if (state?.episodes?.length) setEpsOfSeason(state.episodes);
    if (state?.seasons?.length) setSeasons(state.seasons);
  }, [state?.episode?.episodeId, state?.movie?.movieId]);

  // -------- fetch bằng URL khi không có state
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const targetMovieId = params.movieId || urlData?.movieId;
      const targetEpisodeId = params.episodeId || urlData?.episodeId;

      if (targetMovieId && targetEpisodeId) {
        setDataLoading(true);
        try {
          const [epData, mvData] = await Promise.all([
            EpisodeService.getEpisodeById(targetEpisodeId),
            MovieService.getMovieDetail(targetMovieId),
          ]);
          if (cancelled) return;

          setCurrentEpisode(epData);
          setCurrentMovie(mvData?.movie || mvData);

          const arr = Array.isArray(mvData?.seasons) ? mvData.seasons : [];
          setSeasons(arr);
          const curSeason = arr.find((s) => s.episodes?.some((ep) => ep.episodeId === targetEpisodeId));
          if (curSeason) {
            setSelectedSeason(curSeason);
            setEpsOfSeason(curSeason.episodes || []);
          }
        } catch (e) {
          console.error("Error fetching by ID:", e);
        } finally {
          if (!cancelled) setDataLoading(false);
        }
        return;
      }

      // Slug branch: implement later if needed
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.movieId, params.episodeId, isSlugFormat, urlData?.movieId, urlData?.episodeId]);

  // -------- tải tác giả (cast)
  useEffect(() => {
    (async () => {
      if (!movieId) return;
      if (authors?.length) return;
      try {
        const list = await AuthorService.getAuthorsByMovieId(movieId);
        setAuthors(Array.isArray(list) ? list : []);
      } catch {}
    })();
  }, [movieId, authors?.length]);

  // -------- tải phim đề xuất (dùng BE)
  useEffect(() => {
    (async () => {
      if (!movieId) return;
      try {
        const recs = await MovieService.getRecommendations(movieId, 6);
        setSuggestedMovies(Array.isArray(recs) ? recs : []);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setSuggestedMovies([]);
      }
    })();
  }, [movieId]);

  // -------- tải ratings
  useEffect(() => {
    (async () => {
      if (!movieId) return;
      try {
        const list = await MovieService.getAllMovieRatings(movieId);
        setRatings(Array.isArray(list) ? list : []);
      } catch {}
    })();
  }, [movieId]);

  // -------- Seasons + episodes theo season (nếu chưa có từ state)
  useEffect(() => {
    (async () => {
      if (!movieId) return;
      try {
        if (!seasons.length) {
          const detail = await MovieService.getMovieDetail(movieId);
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
  }, [movieId]);

  const handlePickSeason = async (s) => {
    setSelectedSeason(s);
    try {
      const eps = await EpisodeService.getEpisodesBySeasonId(s.seasonId);
      setEpsOfSeason(Array.isArray(eps) ? eps : []);
    } catch {
      setEpsOfSeason([]);
    }
  };

  // -------- Wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!userId || !movieId) return;
      const exists = await WishlistService.existsInWishlist(userId, movieId);
      setIsInWishlist(exists);
    };
    checkWishlist();
  }, [userId, movieId]);

  const handleToggleWishlist = async () => {
    if (!movieId) return;
    try {
      if (isInWishlist) {
        await WishlistService.removeFromWishlist(userId, movieId);
        toast.success("Đã xóa khỏi danh sách yêu thích");
        setIsInWishlist(false);
      } else {
        await WishlistService.addToWishlist(userId, movieId);
        toast.success("Đã thêm vào danh sách yêu thích");
        setIsInWishlist(true);
      }
    } catch (error) {
      console.error("Lỗi thao tác wishlist:", error);
      toast.error("Thao tác thất bại");
    }
  };



  // -------- Bình luận
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

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
  const pageItems = useMemo(() => getPageItems(totalPages, page, 1), [totalPages, page]);

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

  // -------- nextEp
  const nextEp = useMemo(() => {
    const cur = currentEpisode || episodeFromState;
    if (!cur || !epsOfSeason?.length) return null;
    const idx = epsOfSeason.findIndex((e) => e.episodeId === cur.episodeId);
    return idx >= 0 && idx + 1 < epsOfSeason.length ? epsOfSeason[idx + 1] : null;
  }, [currentEpisode, episodeFromState, epsOfSeason]);

  // -------- prevEp
  const prevEp = useMemo(() => {
    const cur = currentEpisode || episodeFromState;
    if (!cur || !epsOfSeason?.length) return null;
    const idx = epsOfSeason.findIndex(e => e.episodeId === cur.episodeId);
    return idx > 0 ? epsOfSeason[idx - 1] : null;
  }, [currentEpisode, episodeFromState, epsOfSeason]);

  // -------- Player refs & UI states
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const antiCapCleanupRef = useRef(null);

  const frameRef = useRef(null);
  const [playerH, setPlayerH] = useState(0);

  // refs cho nút trên control bar
  const prevBtnRef = useRef(null);
  const nextBtnRef = useRef(null);

  // giữ “bản mới nhất” của prev/next để callback trong Video.js luôn đúng
  const prevEpRef = useRef(null);
  const nextEpRef = useRef(null);
  useEffect(() => { prevEpRef.current = prevEp; nextEpRef.current = nextEp; }, [prevEp, nextEp]);

  const endedHandlerRef = useRef(null);

  const goToEp = (ep) => {
    if (!ep) return;
    const cm = currentMovie || movieFromState;
    const url = createWatchUrl(cm, ep);
    navigate(url, { state: { episode: ep, movie: cm, episodes: epsOfSeason, authors, seasons } });
  };

  const goPrev = () => goToEp(prevEpRef.current);
  const goNext = () => goToEp(nextEpRef.current);


  const [isTheater, setIsTheater] = useState(false);
  const [autoNext, setAutoNext] = useState(true);
  const [sticky, setSticky] = useState(false);
  const [inList, setInList] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // đo chiều cao khung player (cho placeholder khi sticky)
  useEffect(() => {
    const measure = () => {
      if (frameRef.current) {
        setPlayerH(frameRef.current.getBoundingClientRect().height || 0);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // -------- Init Video.js đúng 1 lần
  useEffect(() => {
    if (!videoRef.current || playerRef.current) return;

    const p = videojs(videoRef.current, {
      controls: true,
      autoplay: true,
      preload: "auto",
      fluid: true,
      responsive: true,
      html5: { vhs: { overrideNative: false } },
    });

    p.hlsQualitySelector?.({ displayCurrentQuality: true });

    // anti-capture
    antiCapCleanupRef.current?.();
    antiCapCleanupRef.current = initAntiCapture(p);

    playerRef.current = p;

    return () => {
      antiCapCleanupRef.current?.();
      antiCapCleanupRef.current = null;
      try {
        p.dispose();
      } catch {}
      playerRef.current = null;
    };
  }, []);

  // -------- Mỗi khi đổi tập: chỉ đổi source
  useEffect(() => {
    const url = (currentEpisode || episodeFromState)?.videoUrl;
    const p = playerRef.current;
    if (!p || !url) return;

    p.pause();
    p.src({ src: url, type: "application/x-mpegURL" });
    // p.load(); // mở nếu BE hay trả 204 khi đổi nhanh
    p.play().catch(() => {});
  }, [currentEpisode?.episodeId, episodeFromState?.episodeId]);

  // -------- Lắng nghe ended tách riêng, luôn thấy nextEp mới nhất
  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;

    // gỡ handler cũ (nếu có) trước khi gắn handler mới
    if (endedHandlerRef.current) {
      p.off('ended', endedHandlerRef.current);
    }

    const handler = () => {
      if (autoNext && nextEp) {
        const cm = currentMovie || movieFromState;
        const url = createWatchUrl(cm, nextEp);
        navigate(url, {
          state: { episode: nextEp, movie: cm, episodes: epsOfSeason, authors, seasons },
        });
      }
    };

    endedHandlerRef.current = handler;
    p.on('ended', handler);

    return () => {
      if (endedHandlerRef.current) {
        p.off('ended', endedHandlerRef.current);
      }
    };
  }, [autoNext, nextEp?.episodeId, epsOfSeason, seasons, authors, currentMovie?.movieId, movieFromState?.movieId, navigate]);

  //chế độ rạp phim
  useEffect(() => {
  document.body.classList.toggle('theater-mode', isTheater);
  return () => document.body.classList.remove('theater-mode');
}, [isTheater]);

  // ESC để thoát theater mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isTheater) {
        setIsTheater(false);
      }
    };

    if (isTheater) {
      document.addEventListener('keydown', handleKeyDown);
      // Ẩn cursor sau 3s khi không di chuyển trong theater mode
      let cursorTimer;
      const hideCursor = () => {
        document.body.style.cursor = 'none';
      };
      const showCursor = () => {
        document.body.style.cursor = 'default';
        clearTimeout(cursorTimer);
        cursorTimer = setTimeout(hideCursor, 3000);
      };
      
      document.addEventListener('mousemove', showCursor);
      cursorTimer = setTimeout(hideCursor, 3000);
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousemove', showCursor);
        clearTimeout(cursorTimer);
        document.body.style.cursor = 'default';
      };
    }
  }, [isTheater]);
  // Cập nhật fluid khi isTheater thay đổi
  useEffect(() => {
  const p = playerRef.current;
  if (!p) return;
  p.fluid(!isTheater);   // Theater: false, Normal: true
}, [isTheater]);


  // -------- Debug
  useEffect(() => {
    // console.log("Video element in DOM:", !!videoRef.current, videoRef.current?.isConnected);
  }, [currentEpisode]);

  // -------- Drag mini-player (sticky)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, offset]);

  // -------- Rate submit
  const handleRateSubmit = async (value) => {
    try {
      if (!movieId || !userId) return;
      await MovieService.saveMovieRating(movieId, value, userId);
      const list = await MovieService.getAllMovieRatings(movieId);
      setRatings(Array.isArray(list) ? list : []);
      setShowRatingModal(false);
    } catch (e) {
      toast.error("Đánh giá thất bại");
    }
  };

  const currentEp = currentEpisode || episodeFromState;
  const currentMov = currentMovie || movieFromState;

  useEffect(() => {
  const p = playerRef.current;
  if (!p) return;

  const Button = videojs.getComponent('Button');

  class PrevEpButton extends Button {
    constructor(player, options) {
      super(player, options);
      this.addClass('vjs-prev-ep');
      this.controlText('Tập trước');
    }
    handleClick() { goPrev(); }
  }

  class NextEpButton extends Button {
    constructor(player, options) {
      super(player, options);
      this.addClass('vjs-next-ep');
      this.controlText('Tập sau');
    }
    handleClick() { goNext(); }
  }

  // đăng ký component 1 lần
  if (!videojs.getComponent('PrevEpButton')) videojs.registerComponent('PrevEpButton', PrevEpButton);
  if (!videojs.getComponent('NextEpButton')) videojs.registerComponent('NextEpButton', NextEpButton);

  const cb = p.getChild('controlBar');

  // chèn ngay trước nút Fullscreen (nếu không tìm thấy thì chèn cuối)
  const fsIndex = cb.children().findIndex(c => c?.name?.() === 'FullscreenToggle');
  const insertIndex = fsIndex >= 0 ? fsIndex : cb.children().length;

  prevBtnRef.current = cb.addChild('PrevEpButton', {}, insertIndex);
  nextBtnRef.current = cb.addChild('NextEpButton', {}, insertIndex + 1);

  return () => {
    // gỡ khi unmount
    prevBtnRef.current?.dispose?.(); prevBtnRef.current = null;
    nextBtnRef.current?.dispose?.(); nextBtnRef.current = null;
  };
}, [playerRef.current]); // chạy sau khi player đã được tạo

  useEffect(() => {
    if (prevBtnRef.current) {
      prevBtnRef.current.toggleClass('vjs-hidden', !prevEp);
    }
    if (nextBtnRef.current) {
      nextBtnRef.current.toggleClass('vjs-hidden', !nextEp);
    }
  }, [prevEp, nextEp]);
  


  if (dataLoading) return <div className="watch-loading">Đang tải...</div>;
  if (!currentEp) return <div className="watch-empty">Không tìm thấy tập phim.</div>;

  return (
    <div className={`watch layout ${isTheater ? "theater" : ""}`}>
      {/* Bread + back */}
      <div className="watch-bread">
        <button onClick={() => navigate(-1)} className="btn-circle" title="Quay lại">
          ‹
        </button>
        <h1 className="watch-title">
          <span className="sub">Xem phim {currentMov?.title}</span>
        </h1>
      </div>

      {/* PLAYER */}
      <section className="player-wrap">
        <div
          ref={frameRef}
          className={`player-frame`}
        >
          <div data-vjs-player>
            <video
              id="watch-player"
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
            <h2>{currentMov?.title}</h2>
            <div className="tags">
              {currentMov?.year && <span className="chip">{currentMov.year}</span>}
              {currentMov?.genres?.slice(0, 4).map((g) => (
                <span key={g} className="chip ghost">
                  {g}
                </span>
              ))}
            </div>
            {currentMov?.desc && <p className="desc">{currentMov.desc}</p>}
          </div>
        )}

        {/* giữ chỗ khi sticky để trang không “tụt” */}
        {sticky && <div className="player-placeholder" style={{ height: playerH }} aria-hidden />}

        {/* CONTROL BAR */}
        <div className="action-toolbar">
          {/* nhóm 1: các hành động nhanh */}
          <div className="at-group">
            <button className={`at-item ${isInWishlist ? "active" : ""}`} onClick={handleToggleWishlist}>
              <FontAwesomeIcon icon={faHeart} /> <span>Yêu thích</span>
            </button>
            <button className={`at-item ${inList ? "active" : ""}`} onClick={() => setInList(v => !v)}>
              <FontAwesomeIcon icon={faPlus} /> <span>Thêm vào</span>
            </button>
            <button className="at-item">
              <FontAwesomeIcon icon={faShareNodes} /> <span>Chia sẻ</span>
            </button>
            <button className="at-item danger">
              <FontAwesomeIcon icon={faFlag} /> <span>Báo lỗi</span>
            </button>
          </div>

          {/* nhóm 2: các toggle */}
          <div className="at-group">
            <div className="at-toggle">
              <span>Tự chuyển</span>
              <label className="switch">
                <input type="checkbox" checked={autoNext} onChange={e => setAutoNext(e.target.checked)} />
                <span className="slider" />
              </label>
            </div>
            <div className="at-toggle">
              <span>Rạp phim</span>
              <label className="switch">
                <input type="checkbox" checked={isTheater} onChange={e => setIsTheater(e.target.checked)} />
                <span className="slider" />
              </label>
            </div>
          </div>

          {/* Rating – là nơi DUY NHẤT hiển thị điểm */}
          <button className="at-rate" onClick={() => setShowRatingModal(true)} title="Đánh giá bộ phim">
            <span className="star">★</span>
            <span className="score">{avgRating.toFixed(1)}</span>
            <span className="count">({totalRatings})</span>
            <span className="label">Đánh giá</span>
          </button>

          {/* Next ep (nếu có) */}
          {nextEp && (
            <button
              className="at-next"
              onClick={() => {
                const cm = currentMov;
                const watchUrl = createWatchUrl(cm, nextEp);
                navigate(watchUrl, {
                  state: { episode: nextEp, movie: cm, episodes: epsOfSeason, authors, seasons },
                });
              }}
              title={`Xem tập ${nextEp.episodeNumber}`}
            >
              <FontAwesomeIcon icon={faCirclePlay} /> Tập {nextEp.episodeNumber}
            </button>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="watch-grid">
        {/* LEFT */}
        <div className="wg-main">
          <div className="info-card">
            <div className="poster">
              <img src={currentMov?.poster || currentMov?.thumbnailUrl} alt={currentMov?.title} />
              <div className="quality-badge">HD</div>
            </div>
            <div className="meta">
              <h2 className="movie-title">
                <Link to={`/movie/${currentMov?.movieId || currentMov?.id}`}>{currentMov?.title}</Link>
              </h2>

              <div className="tags">
                {currentMov?.releaseYear && <span className="chip year">{currentMov.releaseYear}</span>}
                {currentMov?.genres?.slice(0, 4).map((g) => (
                  <span key={g} className="chip genre">
                    {g}
                  </span>
                ))}
              </div>

              {currentMov?.description && (
                <div className="description-section">
                  <p className={`description ${showFullDescription ? "expanded" : "collapsed"}`}>
                    {currentMov.description}
                  </p>
                  {currentMov.description.length > 150 && (
                    <button
                      className="toggle-description"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                    >
                      {showFullDescription ? "Thu gọn" : "Xem thêm"}
                      <span className={`arrow ${showFullDescription ? "up" : "down"}`}>
                        {showFullDescription ? "▲" : "▼"}
                      </span>
                    </button>
                  )}
                </div>
              )}

              <div className="movie-stats">
                <div className="stat-item">
                  <FontAwesomeIcon icon={faEye} className="stat-icon" />
                  <span className="stat-value">{currentMov?.viewCount || 0}</span>
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

              <div className="right-tools">
                <Funnel size={18} />
                <span>Lọc</span>
              </div>
            </div>

            <div className="eb-grid">
              {epsOfSeason.length > 0 ? (
                epsOfSeason.map((ep) => {
                  const epId = ep.episodeId;
                  const epNo = ep.episodeNumber;
                  const cur = currentEpisode || episodeFromState;
                  return (
                    <button
                      key={epId}
                      className={`ep-card ${epId === cur?.episodeId ? "active" : ""}`}
                      onClick={() => {
                        const cm = currentMov;
                        const watchUrl = createWatchUrl(cm, ep);
                        navigate(watchUrl, {
                          state: { episode: ep, movie: cm, episodes: epsOfSeason, authors, seasons },
                        });
                      }}
                    >
                      <div className="ep-meta">
                        <span className="ep-no">Tập {epNo}</span>
                        <span className="ep-title">{ep.title || ""}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-muted" style={{ padding: "10px" }}>
                  Season này chưa có tập.
                </div>
              )}
            </div>
          </div>

          {/* BÌNH LUẬN */}
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
                    height: "100px",
                    resize: "none",
                    color: "#ffffff !important",
                    backgroundColor: "#343a40 !important",
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
                      width="42"
                      height="42"
                    />
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold text-truncate">
                        {fb.userName || "Ẩn danh"}
                        <small className="text-secondary ms-2">{dayjs(fb.createdAt).fromNow()}</small>
                      </div>
                      <p
                        className="mb-0 text-break"
                        style={{ whiteSpace: "normal", wordBreak: "break-word", overflowWrap: "anywhere" }}
                      >
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
                <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => goTo(page - 1)} aria-label="Previous">
                    &laquo;
                  </button>
                </li>
                {pageItems.map((it, idx) =>
                  typeof it === "number" ? (
                    <li key={idx} className={`page-item ${page === it ? "active" : ""}`}>
                      <button className="page-link" onClick={() => goTo(it)}>
                        {it + 1}
                      </button>
                    </li>
                  ) : (
                    <li key={idx} className="page-item disabled">
                      <span className="page-link">…</span>
                    </li>
                  )
                )}
                <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
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
          <div className="cast-crew-box">
            <div className="box-head">Thông tin tham gia</div>
            
            {/* Đạo diễn */}
            {authors.filter((a) => a.authorRole === "DIRECTOR").length > 0 && (
              <div className="crew-section">
                <h6 className="crew-title">Đạo diễn:</h6>
                <div className="crew-list">
                  {authors
                    .filter((a) => a.authorRole === "DIRECTOR")
                    .map((a, index, arr) => (
                      <span key={a.authorId}>
                        <Link 
                          className="crew-name" 
                          to={`/browse/author-id/${encodeURIComponent(a.authorId)}`}
                        >
                          {a.name}
                        </Link>
                        {index < arr.length - 1 && ", "}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Diễn viên */}
            {authors.filter((a) => a.authorRole === "PERFORMER").length > 0 && (
              <div className="crew-section">
                <h6 className="crew-title">Diễn viên:</h6>
                <div className="crew-list">
                  {authors
                    .filter((a) => a.authorRole === "PERFORMER")
                    .map((a, index, arr) => (
                      <span key={a.authorId}>
                        <Link 
                          className="crew-name" 
                          to={`/browse/author-id/${encodeURIComponent(a.authorId)}`}
                        >
                          {a.name}
                        </Link>
                        {index < arr.length - 1 && ", "}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Trường hợp không có dữ liệu */}
            {authors.length === 0 && (
              <div className="text-muted" style={{ padding: "12px" }}>
                Chưa có thông tin về đạo diễn và diễn viên
              </div>
            )}
          </div>

          <div className="suggest-box">
            <div className="box-head">Đề xuất cho bạn</div>
            <div className="suggest">
              {suggestedMovies.length > 0 ? (
                suggestedMovies.map((movie) => (
                  <Link key={movie.movieId || movie.id} className="s-item" to={`/movie/${movie.movieId || movie.id}`}>
                    <img src={movie.poster || movie.thumbnailUrl} alt={movie.title} />
                    <div className="s-meta">
                      <div className="t">{movie.title}</div>
                      <div className="a">{movie.alias || movie.originalTitle || ""}</div>
                      <div className="line">
                        {movie.releaseYear && <span className="chip">{movie.releaseYear}</span>}
                        {movie.genres?.slice(0, 2).map(genre => (
                          <span key={genre} className="chip ghost">{genre}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-muted" style={{ padding: "12px" }}>
                  Đang tải phim đề xuất...
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <RatingModal
        show={showRatingModal}
        movieTitle={currentMov?.title}
        average={avgRating}
        total={totalRatings}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRateSubmit}
      />
    </div>
  );
}
