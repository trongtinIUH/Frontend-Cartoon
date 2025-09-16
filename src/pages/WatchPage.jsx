import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import RatingModal from "../components/RatingModal";
import UpgradeModal from "../components/UpgradeModal";
import AuthorService from "../services/AuthorService";
import EpisodeService from "../services/EpisodeService";
import MovieService from "../services/MovieService";
import WishlistService from "../services/WishlistService";

import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "videojs-hls-quality-selector";

import { Funnel } from "lucide-react";
import { faHeart, faPlus, faFlag, faShareNodes, faCirclePlay, faEye, faClockRotateLeft, faBackwardStep, faForwardStep } from "@fortawesome/free-solid-svg-icons";
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
import { buildFeedbackTree, FeedbackItem } from "../components/FeedbackItem";
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

  // Gate kiểm tra quyền VIP
  const [gate, setGate] = useState({ checking: true, allowed: false, message: "" });

  // Trial mode states
  const [isTrialMode, setIsTrialMode] = useState(false);
  const [trialTimeLimit] = useState(15); // thời gian xem thử
  const [currentTime, setCurrentTime] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [trialExpired, setTrialExpired] = useState(false);

  // Package name mapping
  const getPackageDisplayName = (minVipLevel) => {
    const packageMap = {
      'NO_ADS': 'NO ADS',
      'PREMIUM': 'PREMIUM', 
      'MEGA_PLUS': 'MEGA+',
      'COMBO_PREMIUM_MEGA_PLUS': 'COMBO PREMIUM'
    };
    return packageMap[minVipLevel] || minVipLevel;
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []); // Empty dependency array means this runs once on mount

  //  Also scroll to top when episode changes or data loading completes
  useEffect(() => {
    if (currentEpisode?.episodeId && !dataLoading) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentEpisode?.episodeId, dataLoading]);

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

  // ✅ Kiểm tra quyền VIP khi có currentMovie
  useEffect(() => {
    (async () => {
      if (!currentMovie?.movieId) return;
      
      // Reset trial states khi đổi phim
      setIsTrialMode(false);
      setTrialExpired(false);
      setCurrentTime(0);
      setShowUpgradeModal(false);
      
      const required = currentMovie.minVipLevel || "FREE";

      // ✅ ALWAYS CHECK BACKEND FIRST - Luôn kiểm tra quyền thực tế với BE
      try {
        console.log("🔍 Checking VIP permissions...");
        console.log("Movie requires:", required);
        console.log("User ID:", userId);
        console.log("Movie ID:", currentMovie.movieId);
        
        const res = await MovieService.canWatch(currentMovie.movieId, userId);
        console.log("VIP check result:", res);
        
        if (res.allowed) {
          console.log("✅ User has permission - allowing full video");
          setIsTrialMode(false);
          setGate({ status: 'allowed', message: "" });
          return;
        } else {
          console.log("❌ User doesn't have permission:", res.message);
          
          // Nếu phim FREE mà không được phép xem thì chặn hoàn toàn
          if (required === "FREE") {
            setGate({ 
              status: 'not_allowed', 
              message: res.message || "Bạn chưa đủ quyền xem phim này." 
            });
            return;
          }
          
          // Nếu phim VIP mà không có quyền thì cho trial mode
          console.log("🎬 VIP movie - user doesn't have access, starting trial mode");
          const packageName = getPackageDisplayName(required);
          setIsTrialMode(true);
          setGate({ 
            status: 'trial', 
            message: `Đang xem thử phim ${packageName} - ${trialTimeLimit} giây miễn phí`,
            requiredPackage: packageName
          });
        }
      } catch (error) {
        console.error("VIP check error:", error);
        
        // Fallback logic based on movie type
        if (required === "FREE") {
          console.log("🆓 FREE movie with API error - allowing access");
          setGate({ status: 'allowed', message: "" });
        } else {
          console.log("💎 VIP movie with API error - defaulting to trial mode");
          const packageName = getPackageDisplayName(required);
          setIsTrialMode(true);
          setGate({ 
            status: 'trial', 
            message: `Đang xem thử phim ${packageName} - ${trialTimeLimit} giây miễn phí`,
            requiredPackage: packageName
          });
        }
      }
    })();
  }, [currentMovie?.movieId, userId]);

  // -------- fetch bằng URL khi không có state
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const targetMovieId = params.movieId || urlData?.movieId;
      const targetEpisodeId = params.episodeId || urlData?.episodeId;

      console.log("Loading episode data:", { targetMovieId, targetEpisodeId });

      if (targetMovieId && targetEpisodeId) {
        setDataLoading(true);
        try {
          const [epData, mvData] = await Promise.all([
            EpisodeService.getEpisodeById(targetEpisodeId),
            MovieService.getMovieDetail(targetMovieId),
          ]);
          if (cancelled) return;

          console.log("Loaded episode data:", { epData, mvData });
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
      } catch { }
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
      } catch { }
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
            const episodeArray = Array.isArray(eps) ? eps : [];
            setEpsOfSeason(episodeArray);
          } else {
            setEpsOfSeason([]);
          }
        } else if (!epsOfSeason.length && selectedSeason?.seasonId) {
          const eps = await EpisodeService.getEpisodesBySeasonId(selectedSeason.seasonId);
          setEpsOfSeason(Array.isArray(eps) ? eps : []);
        }
      } catch { }
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
  const size = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const fetchFeedback = useCallback(async () => {
    if (!movieId) return;
    try {
      const { items, totalPages: tp } = await FeedbackService.getListFeedbackByIdMovie(movieId, page, size);
      setComments(buildFeedbackTree(items));
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
        movieId: movieId,
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
      const payload = {
        userId,
        movieId: movieId,
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

  // -------- nextEp với preloading
  const nextEp = useMemo(() => {
    const cur = currentEpisode || episodeFromState;
    if (!cur || !epsOfSeason?.length) return null;
    const idx = epsOfSeason.findIndex((e) => e.episodeId === cur.episodeId);
    const next = idx >= 0 && idx + 1 < epsOfSeason.length ? epsOfSeason[idx + 1] : null;
    
    return next;
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
  
  // CloudFront optimized URL state
  const [optimizedUrl, setOptimizedUrl] = useState(null);

  const frameRef = useRef(null);
  const [playerH, setPlayerH] = useState(0);

  // refs cho nút trên control bar
  const prevBtnRef = useRef(null);
  const nextBtnRef = useRef(null);
  const rewind10BtnRef = useRef(null);
  const forward10BtnRef = useRef(null);

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

  // -------- Init Video.js KHI video element đã render (gate allowed hoặc trial)
  useEffect(() => {
    // Chỉ init khi gate allowed/trial và video element tồn tại
    if (!['allowed', 'trial'].includes(gate.status) || !videoRef.current || playerRef.current) return;

    console.log("Initializing video player...");
    console.log("Video element exists:", !!videoRef.current);
    
    const p = videojs(videoRef.current, {
      controls: true,
      autoplay: true,
      preload: "auto",
      fluid: true,
      responsive: true,
      html5: { vhs: { overrideNative: false } },
    });

    p.hlsQualitySelector?.({ displayCurrentQuality: true });

    // Event listeners for debugging
    p.on('loadstart', () => console.log('Video: loadstart'));
    p.on('loadeddata', () => console.log('Video: loadeddata'));
    p.on('canplay', () => console.log('Video: canplay'));
    p.on('play', () => console.log('Video: play'));
    p.on('error', (e) => console.error('Video error:', e));

    // ✅ NEW: Trial mode timer
    if (gate.status === 'trial' && isTrialMode) {
      p.on('timeupdate', () => {
        const time = p.currentTime();
        setCurrentTime(time);
        
        if (time >= trialTimeLimit && !trialExpired) {
          console.log('🚫 Trial time expired, pausing video');
          p.pause();
          setTrialExpired(true);
          setShowUpgradeModal(true);
        }
      });
    }

    // anti-capture
    antiCapCleanupRef.current?.();
    antiCapCleanupRef.current = initAntiCapture(p);

    playerRef.current = p;
    
    console.log("Video player initialized successfully:", p);

    return () => {
      antiCapCleanupRef.current?.();
      antiCapCleanupRef.current = null;
      try {
        p.dispose();
      } catch { }
      playerRef.current = null;
    };
  }, [gate.status, isTrialMode, trialTimeLimit, trialExpired]); // Trigger khi gate status thay đổi

  // -------- Mỗi khi đổi tập: chỉ đổi source (chỉ khi gate allowed hoặc trial)
  useEffect(() => {
    // Chỉ setup video khi gate đã cho phép hoặc trial mode
    if (!['allowed', 'trial'].includes(gate.status)) {
      console.log("Waiting for gate check before video setup...");
      return;
    }

    const originalUrl = (currentEpisode || episodeFromState)?.videoUrl;
    const p = playerRef.current;
    
    console.log("🎬 Video setup check:", {
      gateStatus: gate.status,
      currentEpisode,
      episodeFromState,
      originalUrl,
      playerExists: !!p
    });
    
    if (!originalUrl) {
      console.error("❌ No video URL found!");
      console.log("Episode data:", { currentEpisode, episodeFromState });
      return;
    }
    
    if (!p) {
      console.error("❌ Video player not initialized!");
      return;
    }

    // Use video URL directly 
    setOptimizedUrl(originalUrl); // Update state
    
    console.log("🚀 Setting video source:", originalUrl);
    
    // Test URL trước khi set
    fetch(originalUrl, { method: 'HEAD' })
      .then(response => {
        console.log("🔗 Video URL status:", response.status, response.statusText);
        if (!response.ok) {
          console.error("❌ Video URL not accessible:", response.status);
        }
      })
      .catch(err => console.error("❌ Video URL fetch failed:", err));
    
    p.pause();
    p.src({ src: originalUrl, type: "application/x-mpegURL" });
    p.load(); // Force load the new source
    
    // Thử play sau khi load
    setTimeout(() => {
      p.play().catch((error) => {
        console.error("❌ Video play failed:", error);
      });
    }, 500);
  }, [currentEpisode?.episodeId, episodeFromState?.episodeId, gate.status]); // Thêm gate.status dependency

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

  // ⭐ NEW: Nút tua lùi 10 giây
  class Rewind10Button extends Button {
    constructor(player, options) {
      super(player, options);
      this.addClass('vjs-rewind-10');
      this.controlText('Tua lùi 10 giây');
    }
    handleClick() { 
      const currentTime = this.player().currentTime();
      this.player().currentTime(Math.max(0, currentTime - 10));
    }
  }

  // ⭐ NEW: Nút tua tiến 10 giây  
  class Forward10Button extends Button {
    constructor(player, options) {
      super(player, options);
      this.addClass('vjs-forward-10');
      this.controlText('Tua tiến 10 giây');
    }
    handleClick() { 
      const currentTime = this.player().currentTime();
      const duration = this.player().duration();
      this.player().currentTime(Math.min(duration, currentTime + 10));
    }
  }

  // đăng ký component 1 lần
  if (!videojs.getComponent('PrevEpButton')) videojs.registerComponent('PrevEpButton', PrevEpButton);
  if (!videojs.getComponent('NextEpButton')) videojs.registerComponent('NextEpButton', NextEpButton);
  if (!videojs.getComponent('Rewind10Button')) videojs.registerComponent('Rewind10Button', Rewind10Button);
  if (!videojs.getComponent('Forward10Button')) videojs.registerComponent('Forward10Button', Forward10Button);

  const cb = p.getChild('controlBar');

  // chèn ngay trước nút Fullscreen (nếu không tìm thấy thì chèn cuối)
  const fsIndex = cb.children().findIndex(c => c?.name?.() === 'FullscreenToggle');
  const insertIndex = fsIndex >= 0 ? fsIndex : cb.children().length;

  // Thêm các nút theo thứ tự: rewind10, forward10, prev episode, next episode
  rewind10BtnRef.current = cb.addChild('Rewind10Button', {}, insertIndex);
  forward10BtnRef.current = cb.addChild('Forward10Button', {}, insertIndex + 1);
  prevBtnRef.current = cb.addChild('PrevEpButton', {}, insertIndex + 2);
  nextBtnRef.current = cb.addChild('NextEpButton', {}, insertIndex + 3);

  return () => {
    // gỡ khi unmount
    rewind10BtnRef.current?.dispose?.(); rewind10BtnRef.current = null;
    prevBtnRef.current?.dispose?.(); prevBtnRef.current = null;
    nextBtnRef.current?.dispose?.(); nextBtnRef.current = null;
    forward10BtnRef.current?.dispose?.(); forward10BtnRef.current = null;
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

  // ⭐ NEW: Keyboard shortcuts cho tua 10 giây
  useEffect(() => {
    const handleKeyDown = (e) => {
      const p = playerRef.current;
      if (!p) return;
      
      // Chỉ hoạt động khi không có modal nào mở và không đang focus vào input
      const isModalOpen = showRatingModal || showUpgradeModal;
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || 
                           document.activeElement?.tagName === 'TEXTAREA' ||
                           document.activeElement?.contentEditable === 'true';
      
      if (isModalOpen || isInputFocused) return;

      switch(e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          const currentTimeLeft = p.currentTime();
          p.currentTime(Math.max(0, currentTimeLeft - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          const currentTimeRight = p.currentTime();
          const duration = p.duration();
          p.currentTime(Math.min(duration, currentTimeRight + 10));
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [playerRef.current, showRatingModal, showUpgradeModal]);
  


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

      {/* VIP Gate Check */}
      {gate.status === 'checking' && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div>Đang kiểm tra quyền truy cập...</div>
          <div>⏳</div>
        </div>
      )}

      {gate.status === 'not_allowed' && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '1px solid #ddd',
          borderRadius: '12px',
          margin: '20px',
          padding: '40px',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px' }}>�</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
            Nội dung VIP Premium
          </div>
          <div style={{ fontSize: '16px', lineHeight: '1.6', maxWidth: '500px' }}>
            {gate.message}
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
            <button 
              onClick={() => navigate('/buy-package')}
              style={{
                background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
              🚀 Nâng cấp VIP ngay
            </button>
            {!userId && (
              <button 
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent',
                  color: 'white',
                  border: '2px solid white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#667eea';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'white';
                }}
              >
                🔑 Đăng nhập
              </button>
            )}
          </div>
        </div>
      )}

      {/* PLAYER - show when allowed or trial */}
      {['allowed', 'trial'].includes(gate.status) && (
        <section className="player-wrap">
        <div
          ref={frameRef}
          className={`player-frame`}
        >
          <div data-vjs-player style={{ position: 'relative' }}>
            <video
              id="watch-player"
              ref={videoRef}
              className="video-js vjs-default-skin vjs-big-play-centered"
              playsInline
              controls
            />
            
            {/* ✅ Trial countdown overlay - hiển thị TRONG video player */}
            {isTrialMode && !trialExpired && (
              <div className="trial-overlay-video">
                <div className="trial-countdown-box">
                  <div className="trial-package-name">
                    Xem thử {gate.requiredPackage || 'VIP'}
                  </div>
                  <div className="trial-timer">
                    <span className="timer-icon">⏱️</span>
                    <span className="timer-text">
                      {Math.max(0, Math.ceil(trialTimeLimit - currentTime))}s còn lại
                    </span>
                  </div>
                  <div className="trial-subtitle">
                    Nâng cấp để xem đầy đủ
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* ✅ Trial expired overlay */}
          {isTrialMode && trialExpired && (
            <div className="trial-expired-overlay">
              <div className="trial-expired-content">
                <div className="trial-expired-icon">⏰</div>
                <h3>Hết thời gian xem thử</h3>
                <p>Nâng cấp {getPackageDisplayName(currentMov?.minVipLevel) || 'VIP'} để tiếp tục xem phim</p>
                <button 
                  className="btn-upgrade-now"
                  onClick={() => setShowUpgradeModal(true)}
                >
                  Nâng cấp {getPackageDisplayName(currentMov?.minVipLevel) || 'VIP'} ngay
                </button>
              </div>
            </div>
          )}
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
      )}

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

      {/* ✅ VIP Upgrade Modal - Component riêng */}
      <UpgradeModal 
        show={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentMovie={currentMov}
        userId={userId}
        getPackageDisplayName={getPackageDisplayName}
      />

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
