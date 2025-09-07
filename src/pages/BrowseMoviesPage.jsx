// src/pages/BrowseMoviesPage.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import MovieService from "../services/MovieService";
import AuthorService from "../services/AuthorService";
import "../css/MainPage.css"; // reuse .main-page-wrapper, .newlist, .movie-grid,...

const MOVIES_PER_PAGE = 20;

const BrowseMoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { kind, value } = useParams();
  const [authorName, setAuthorName] = useState("");
  const rawValue = decodeURIComponent(value || "");
  const prettyValue = useMemo(() => { 
    if ((kind || "").toLowerCase() === "author-id") return rawValue;
    return rawValue.replace(/-/g, " ").trim();
  }, [kind, rawValue]);

  const pageTitle = useMemo(() => {
    const k = (kind || "").toLowerCase();
    switch (k) {
      case "the-loai":   return `Thể loại: ${prettyValue}`;
      case "type": {
        const t = prettyValue.toUpperCase();
        return t === "SERIES" ? "Phim bộ" : t === "SINGLE" ? "Phim lẻ" : `Loại: ${prettyValue}`;
      }
      case "chu-de":     return `Chủ đề: ${prettyValue}`;
      case "quoc-gia":   return `Quốc gia: ${prettyValue}`;
      case "dien-vien":  return `Diễn viên: ${prettyValue}`;
      case "dao-dien":   return `Tác giả/Đạo diễn: ${prettyValue}`;
      case "author-id":  return `Phim của: ${authorName || `ID: ${rawValue}`}`;
      default:           return prettyValue || "Danh sách phim";
    }
  }, [kind, prettyValue, authorName, rawValue]);

  const fetcher = useCallback(async () => {
    try {
      const k = (kind || "").toLowerCase();
      let res = [];

      // Reset author name for non-author-id cases
      if (k !== "author-id") {
        setAuthorName("");
      }

      if (k === "the-loai") {
        res = await MovieService.getMoviesByGenre(prettyValue);
      } else if (k === "type") {
        res = await MovieService.getMoviesByType(prettyValue.toUpperCase());
      } else if (k === "chu-de") {
        res = await MovieService.getMovieByTopic(prettyValue);
      } else if (k === "quoc-gia") {
        // Tìm phim theo quốc gia
        res = await MovieService.getMoviesByCountry(prettyValue);
      } else if (k === "dien-vien") {
        // (chưa có API riêng) — fallback FE: lấy all rồi filter theo actors
        const all = await MovieService.getAllMovies();
        res = (all || []).filter(m =>
          (m.actors || []).some(a => String(a).toLowerCase().includes(prettyValue.toLowerCase()))
        );
      } else if (k === "dao-dien") {
        // (chưa có API riêng) — fallback FE: filter theo author/director
        const all = await MovieService.getAllMovies();
        const v = prettyValue.toLowerCase();
        res = (all || []).filter(m =>
          String(m.author || m.director || "").toLowerCase().includes(v)
        );
      } else if (k === "author-id") {
        // Tìm phim theo author ID (có thể là UUID string hoặc number)
        const authorId = rawValue;
      
        // Lấy thông tin tác giả để hiển thị tên
        try {
          const authors = await AuthorService.getAllAuthors();
          const author = authors.find(a => String(a.authorId) === String(authorId));
          setAuthorName(author ? `${author.name}` : `Không tìm thấy tác giả`);
        } catch (err) {
          console.error("❌ Error fetching authors:", err);
          setAuthorName(`ID: ${authorId}`);
        }
        
        // Lấy danh sách phim của tác giả
        const all = await MovieService.getAllMovies();
        console.log("🎬 All movies:", all);
        res = (all || []).filter(m => {
          const hasAuthor = (m.authorIds || []).some(id => String(id) === String(authorId));
          if (hasAuthor) {
            console.log("✅ Movie matches:", m.title, "authorIds:", m.authorIds);
          }
          return hasAuthor;
        });
        console.log("🎯 Filtered movies:", res);
      } else {
        // fallback: search theo title gần đúng
        res = await MovieService.searchMovies(prettyValue);
      }

      setMovies(Array.isArray(res) ? res : []);
      setCurrentPage(1);
      window.scrollTo({ top: 0 });
    } catch {
      setMovies([]);
      setCurrentPage(1);
    }
  }, [kind, prettyValue, rawValue]);

  useEffect(() => {
    fetcher();
  }, [fetcher]);

  const totalPages = Math.max(1, Math.ceil(movies.length / MOVIES_PER_PAGE));
  const startIdx = (currentPage - 1) * MOVIES_PER_PAGE;
  const currentMovies = movies.slice(startIdx, startIdx + MOVIES_PER_PAGE);

  return (
    <div className="browse-page-wrapper main-page-wrapper">
      <div className="main-page container-xl" style={{paddingTop: '80px'}}>
        <h2 className="section-title">{pageTitle}</h2>

        <div className="newlist">
          {currentMovies.length === 0 ? (
            <div className="empty-state">Không tìm thấy phim phù hợp.</div>
          ) : (
            <div className="movie-grid">
              {currentMovies.map((movie) => {
                const poster =
                  movie.thumbnailUrl ||
                  "https://placehold.co/400x600/0b1220/8aa0b6?text=No+Poster";
                const isPremium = (movie.minVipLevel || "FREE") !== "FREE";

                return (
                  <Link
                    key={movie.movieId}
                    to={`/movie/${movie.movieId}`}
                    className="poster-card"
                  >
                    <div className="poster-wrap">
                      <img
                        className="poster-img"
                        src={poster}
                        alt={movie.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/400x600/0b1220/8aa0b6?text=No+Poster";
                        }}
                      />
                      {isPremium && <span className="vip-badge">P.ĐỀ</span>}
                    </div>

                    <div className="poster-meta">
                      <h3 className="title-vn">{movie.title}</h3>
                      <p className="title-en">
                        {movie.originalTitle || movie.slug || "\u00A0"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        <nav className="pagination-nav mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => {
                  if (currentPage > 1) {
                    setCurrentPage(p => p - 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                &laquo;
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => (
              <li
                key={i}
                className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => {
                    setCurrentPage(i + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => {
                  if (currentPage < totalPages) {
                    setCurrentPage(p => p + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                &raquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default BrowseMoviesPage;
