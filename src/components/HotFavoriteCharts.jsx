// src/components/HotFavoriteCharts.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import MovieService from "../services/MovieService";
import WishlistService from "../services/WishlistService";
import "../css/HotFavoriteCharts.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClapperboard,
  faHeartCircleCheck,
  faMinus,
  faArrowTrendUp,
  faArrowTrendDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const LIMIT = 5;
const MODAL_LIMIT = 10;

const ChartItem = ({ index, trend = "stand", movie }) => {
  const poster =
    movie?.thumbnailUrl ||
    movie?.moviePosterUrl ||
    "https://placehold.co/80x120/0b1220/8aa0b6?text=No+Poster";
  const title = movie?.title ?? movie?.movieTitle ?? "";

  const trendIcon =
    trend === "up" ? faArrowTrendUp : trend === "down" ? faArrowTrendDown : faMinus;
  const trendClass =
    trend === "up" ? "dev-up" : trend === "down" ? "dev-down" : "dev-stand";

  return (
    <div className="chart-item">
      <div className="pos">{index}.</div>
      <div className={`dev ${trendClass}`}>
        <FontAwesomeIcon icon={trendIcon} />
      </div>
      <div className="v-thumbnail">
        <img
          loading="lazy"
          alt={title || "movie"}
          src={poster}
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/80x120/0b1220/8aa0b6?text=No+Poster";
          }}
        />
      </div>
      <h4 className="name lim-1">
        <Link title={title} to={`/movie/${movie?.movieId}`} state={{ from: "charts-mini" }}>
          {title}
        </Link>
      </h4>
    </div>
  );
};

// Nhỏ gọn: Modal đơn giản, dùng portal là tốt nhất, nhưng để nhanh thì render inline
function TopModal({ open, onClose, title, items }) {
  // Đóng bằng ESC & click backdrop
  const onKey = useCallback((e) => { if (e.key === "Escape") onClose(); }, [onClose]);
  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onKey]);

  if (!open) return null;
  return (
    <div className="charts-modal-backdrop" onClick={onClose}>
      <div
        className="charts-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="charts-modal-header">
          <h3>{title}</h3>
          <button  type="button"  className="charts-modal-close"    onClick={onClose} aria-label="Đóng">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="charts-modal-list">
          {items.map((m, idx) => (
            <ChartItem
              key={`${m.movieId}-${idx}`}
              index={idx + 1}
              trend={idx <= 2 ? "up" : "stand"}
              movie={m}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HotFavoriteCharts() {
  const [allMovies, setAllMovies] = useState([]);
  const [favTop, setFavTop] = useState(null); // null = “chưa có/đang fetch”

  // Modal state: null | 'hot' | 'fav'
  const [modalType, setModalType] = useState(null);

  // tải toàn bộ (để lọc "sôi nổi nhất" theo viewCount)
  useEffect(() => {
    (async () => {
      try {
        const data = await MovieService.getAllMovies();
        setAllMovies(Array.isArray(data) ? data : []);
      } catch {
        setAllMovies([]);
      }
    })();
  }, []);

  // Lấy top yêu thích từ BE (nếu có)
  useEffect(() => {
    (async () => {
      try {
        if (WishlistService?.getTopFavorites) {
          const top = await WishlistService.getTopFavorites(MODAL_LIMIT);
          if (Array.isArray(top) && top.length) {
            // Chuẩn hóa field
            const normalized = top.map((t) => ({
              movieId: t.movieId,
              title: t.movieTitle,
              thumbnailUrl: t.moviePosterUrl,
            }));
            setFavTop(normalized);
            return;
          }
        }
      } catch {}
      setFavTop(null); // fallback dùng allMovies
    })();
  }, []);

  // Sôi nổi nhất = sort theo viewCount giảm dần
  const hotTop5 = useMemo(() => {
    return [...allMovies]
      .filter((m) => (m?.viewCount ?? 0) > 0)
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, LIMIT);
  }, [allMovies]);

  const hotTop10 = useMemo(() => {
    return [...allMovies]
      .filter((m) => (m?.viewCount ?? 0) > 0)
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, MODAL_LIMIT);
  }, [allMovies]);

  // Yêu thích nhất (fallback): sort theo wishlistCount/likes + viewCount
  const favTopFallback10 = useMemo(() => {
    const score = (m) =>
      (m?.wishlistCount ?? m?.likes ?? m?.favorites ?? 0) * 100 +
      (m?.viewCount ?? 0);
    return [...allMovies]
      .sort((a, b) => score(b) - score(a))
      .slice(0, MODAL_LIMIT);
  }, [allMovies]);

  const favTop5 = useMemo(() => {
    const list = (favTop && favTop.length ? favTop : favTopFallback10);
    return list.slice(0, LIMIT);
  }, [favTop, favTopFallback10]);

  const favTop10 = useMemo(() => {
    return (favTop && favTop.length ? favTop : favTopFallback10).slice(0, MODAL_LIMIT);
  }, [favTop, favTopFallback10]);

  return (
    <div className="charts-mini container-xl">
      <div className="charts-grid">
        {/* Sôi nổi nhất */}
        <section className="it-col">
          <div className="comm-title line-center">
            <FontAwesomeIcon className="ct-icon" icon={faClapperboard} />
            <span className="flex-grow-1">Sôi nổi nhất</span>
          </div>

          <div className="chart-list">
            {hotTop5.map((m, idx) => (
              <ChartItem key={m.movieId} index={idx + 1} trend="stand" movie={m} />
            ))}
            <div className="item-more mt-2">
              <button type="button" className="small linklike" onClick={() => setModalType("hot")}>
                Xem thêm
              </button>
            </div>
          </div>
        </section>

        {/* Yêu thích nhất */}
        <section className="it-col">
          <div className="comm-title line-center">
            <FontAwesomeIcon className="ct-icon" icon={faHeartCircleCheck} />
            <span className="flex-grow-1">Yêu thích nhất</span>
          </div>

          <div className="chart-list">
            {favTop5.map((m, idx) => (
              <ChartItem key={`${m.movieId}-${idx}`} index={idx + 1} trend="up" movie={m} />
            ))}
            <div className="item-more mt-2">
              <button type="button" className="small linklike" onClick={() => setModalType("fav")}>
                Xem thêm
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL */}
      <TopModal
        open={modalType === "hot"}
        onClose={() => setModalType(null)}
        title="Sôi nổi nhất"
        items={hotTop10}
      />
      <TopModal
        open={modalType === "fav"}
        onClose={() => setModalType(null)}
        title="Yêu thích nhất"
        items={favTop10}
      />
    </div>
  );
}
