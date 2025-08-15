import React, { useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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


export default function WatchPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const episode  = state?.episode;             // { id,title,videoUrl,number,season }
  const movie    = state?.movie;               // { id, title, year, genres[], alias, poster, ... }
  const episodes = state?.episodes || [];  
  const authors  = state?.authors || [];       // list cùng season

  const nextEp = useMemo(() => {
    if (!episode) return null;
    const idx = episodes.findIndex(e => e.id === episode.id);
    return idx >= 0 && idx + 1 < episodes.length ? episodes[idx + 1] : null;
  }, [episode, episodes]);

  const playerRef = useRef(null);
  const videoRef  = useRef(null);

  // khối player để đo chiều cao làm placeholder
  const frameRef = useRef(null);
  const [playerH, setPlayerH] = useState(0);

  const [isTheater, setIsTheater] = useState(false);
  const [autoNext, setAutoNext]   = useState(true);
  const [sticky, setSticky]       = useState(false);
  const [liked, setLiked]         = useState(false);
  const [inList, setInList]       = useState(false);

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
      
    });

    player.hlsQualitySelector?.({ displayCurrentQuality: true });

    player.on("ended", () => {
      if (autoNext && nextEp) {
        navigate(`/watch/${movie?.id}/${nextEp.id}`, {
          state: { episode: nextEp, movie, episodes }
        });
      }
    });

    playerRef.current = player;
   return () => {
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
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
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


//áp dụng bảo mật video
  useEffect(() => {
    if (videoRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: "auto"
      }, () => {
        initAntiCapture(playerRef.current);
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, []);
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
            </div>
            <div className="meta">
              <h2 className="name">
                <Link to={`/movie/${movie?.id}`}>{movie?.title}</Link>
              </h2>
              {movie?.alias && <div className="alias">{movie.alias}</div>}
              <div className="tags">
                {movie?.year && <span className="chip">{movie.year}</span>}
                {movie?.genres?.slice(0, 4).map(g => <span key={g} className="chip ghost">{g}</span>)}
              </div>
              {movie?.description && <p className="desc">{movie.descriptions}</p>}
            </div>
          </div>

          <div className="episodes-box">
            <div className="eb-head">
              <div className="tabs">
                <button className="tab active">Phần {episode.season || 1}</button>
              </div>
              <div className="right-tools"><Funnel size={18} /><span>Lọc</span></div>
            </div>
            <div className="eb-grid">
              {episodes.map(ep => (
                <button
                  key={ep.id}
                  className={`ep-card ${ep.id === episode.id ? "active" : ""}`}
                  onClick={() => navigate(`/watch/${movie?.id}/${ep.id}`, { state: { episode: ep, movie, episodes } })}
                >
                 
                  <div className="ep-meta">
                    <span className="ep-no">Tập {ep.number}</span>
                    <span className="ep-title">{ep.title || ""}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="comments">
            <div className="c-head">
              <span>Bình luận</span>
              <div className="tabs">
                <button className="tab active">Bình luận</button>
                <button className="tab">Đánh giá</button>
              </div>
            </div>
            <div className="c-input">
              <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="" />
              <textarea rows={3} placeholder="Viết bình luận…" />
              <button className="btn-primary">Gửi</button>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <aside className="wg-side">
          <div className="rate-box">
            <div className="score">9.0</div>
            <div className="act">
              <button>Đánh giá</button>
              <button>Bình luận</button>
            </div>
          </div>

          <div className="actors-box">
            <div className="box-head">Diễn viên</div>
            <div className="actors">
              {authors
              .filter(a => a.authorRole === "PERFORMER")
              .map(a => (
                <Link key={a.authorId} className="actor" to={`/author/${a.authorId}`}>
                  <img src={a.photo || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt={a.name} />
                  <span>{a.name}</span>
                </Link>
              ))}
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
    </div>
  );
}
