// src/components/HotFavoriteCharts.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MovieService from "../services/MovieService";
import WishlistService from "../services/WishlistService";
import "../css/HotFavoriteCharts.css";

// Font Awesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClapperboard,
  faHeartCircleCheck,
  faMinus,
  faArrowTrendUp,
  faArrowTrendDown,
} from "@fortawesome/free-solid-svg-icons";

const LIMIT = 5;

const ChartItem = ({ index, trend = "stand", movie }) => {
  const poster =
    movie?.thumbnailUrl ||
    "https://placehold.co/80x120/0b1220/8aa0b6?text=No+Poster";

  const trendIcon =
    trend === "up"
      ? faArrowTrendUp
      : trend === "down"
      ? faArrowTrendDown
      : faMinus;

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
          alt={movie?.title || "movie"}
          src={poster}
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/80x120/0b1220/8aa0b6?text=No+Poster";
          }}
        />
      </div>
      <h4 className="name lim-1">
        <Link
          title={movie?.title}
          to={`/movie/${movie?.movieId}`}
          state={{ from: "charts-mini" }}
        >
          {movie?.title}
        </Link>
      </h4>
    </div>
  );
};

export default function HotFavoriteCharts() {
  const [allMovies, setAllMovies] = useState([]);
  const [favTop, setFavTop] = useState(null); // null = đang fetch; [] = không có

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

  // cố lấy top yêu thích từ service (nếu backend có)
  useEffect(() => {
    (async () => {
      try {
        if (WishlistService?.getTopFavorites) {
          const top = await WishlistService.getTopFavorites(LIMIT);
          // mong đợi mỗi item có movieId / title / thumbnailUrl
          if (Array.isArray(top) && top.length) {
            setFavTop(top.slice(0, LIMIT));
            return;
          }
        }
      } catch {
        // bỏ qua, sẽ fallback
      }
      setFavTop(null);// fallback sẽ xử lý bằng useMemo
    })();
  }, []);

  // Sôi nổi nhất = sort theo viewCount giảm dần
  const hotTop = useMemo(() => {
    return [...allMovies]
      .filter((m) => (m?.viewCount ?? 0) > 0)
      .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
      .slice(0, LIMIT);
  }, [allMovies]);

  // Yêu thích nhất (fallback): sort theo wishlistCount/rating/likeCount nếu có
  const favTopFallback = useMemo(() => {
    if (favTop && favTop.length) return favTop;
    const score = (m) =>
      (m?.wishlistCount ?? m?.likes ?? m?.favorites ?? 0) * 100 +
      (m?.viewCount ?? 0); // tí xíu “đệm” bằng viewCount cho ổn định
    return [...allMovies]
      .sort((a, b) => score(b) - score(a))
      .slice(0, LIMIT);
  }, [favTop, allMovies]);

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
            {hotTop.map((m, idx) => (
              <ChartItem
                key={m.movieId}
                index={idx + 1}
                trend="stand" // nếu bạn có dữ liệu trend, truyền 'up' | 'down' | 'stand'
                movie={m}
              />
            ))}
            <div className="item-more mt-2">
              <Link className="small" to="/bang-xep-hang/hot">
                Xem thêm
              </Link>
            </div>
          </div>
        </section>

        {/* Yêu thích nhất */}
        <section className="it-col">
          <div className="comm-title line-center">
            <FontAwesomeIcon
              className="ct-icon"
              icon={faHeartCircleCheck}
            />
            <span className="flex-grow-1">Yêu thích nhất</span>
          </div>

          <div className="chart-list">
           {((favTop && favTop.length) ? favTop : favTopFallback).map((m, idx) => (
                <ChartItem key={m.movieId} index={idx + 1} trend="up" movie={m} />
            ))}
            <div className="item-more mt-2">
              <Link className="small" to="/bang-xep-hang/yeu-thich">
                Xem thêm
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

