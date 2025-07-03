import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MovieService from "../services/MovieService";
import "../css/MovieDetailPage.css";

const MovieDetailPage = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const data = await MovieService.getMovieById(id);
        setMovie({
          ...data.movie,
          episodes: data.episodes,
        });
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu phim:", error);
      }
    };
    fetchMovie();
  }, [id]);

  if (!movie) return <div className="text-center mt-5">Đang tải thông tin phim...</div>;

  return (
    <div className="movie-detail-page">
      
      <div className="container py-5 text-white">
        <div className="row">
          <div className="col-md-4 mb-4 text-center">
            <img
              src={movie.thumbnailUrl || "https://via.placeholder.com/300x450"}
              alt={movie.title}
              className="img-fluid rounded shadow-lg movie-poster"
            />
          </div>
          <div className="col-md-8">
            <h2 className="movie-title mb-3">{movie.title}</h2>
            <p><strong>Mô tả:</strong> {movie.description || "Không có mô tả."}</p>
            <p><strong>Thể loại:</strong> {movie.genres?.join(", ")}</p>
            <p><strong>Ngày tạo:</strong> {new Date(movie.createdAt).toLocaleString()}</p>
            <p><strong>Lượt xem:</strong> {movie.viewCount || 0}</p>
          </div>
        </div>

        {movie.episodes?.length > 0 && (
          <div className="episodes mt-5">
            <h4 className="mb-3">Danh sách tập phim</h4>
            <div className="row">
              {movie.episodes.map((ep) => (
                <div key={ep.episodeId} className="col-md-4 mb-4">
                  <div className="episode-card p-3 shadow-sm rounded">
                    <h6 className="mb-2">Tập {ep.episodeNumber}: {ep.title}</h6>
                    <a href={ep.videoUrl} target="_blank" rel="noreferrer" className="btn btn-watch">
                      Xem
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
     
    </div>
  );
};

export default MovieDetailPage;
