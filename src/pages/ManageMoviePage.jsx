import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieService from '../services/MovieService';
import EpisodeService from '../services/EpisodeService';
import showToast from '../utils/AppUtils';
import '../css/ManageMoviePage.css';
import Header from "../components/Header";
import Footer from "../components/Footer";
import ModelAddMovie from './ModelAddMovie';
import ModelAddNewEpisode from './ModelAddNewEpisode';
import { Plus, Pencil, Trash2, Film } from "lucide-react";
import { Link } from "react-router-dom";



const ManageMoviePage = () => {
  const [movies, setMovies] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  //mở model thêm tập mới
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [selectedMovieId,setSelectedMovieId] = useState(null);

  const navigate = useNavigate();

useEffect(() => {
  fetchMovies();
}, []);

const fetchMovies = async () => {
  try {
    const data = await MovieService.getAllMovies();

    console.log("DATA FROM getAllMovies():", data);

    // Nếu data không phải array => không xử lý
    if (!Array.isArray(data)) {
      showToast("Dữ liệu phim không hợp lệ", "error");
      setMovies([]);
      return;
    }

    const enrichedMovies = await Promise.all(
      data.map(async (movie) => {
        try {
          const episodeCount = await EpisodeService.countEpisodesByMovieId(movie.movieId);
          return { ...movie, episodeCount };
        } catch (error) {
          console.error(`Lỗi lấy số tập cho phim ${movie.movieId}:`, error);
          return { ...movie, episodeCount: 0 }; // fallback
        }
      })
    );

    setMovies(enrichedMovies);
  } catch (error) {
    console.error("Lỗi tải danh sách phim:", error);
    showToast("Lỗi khi tải phim", "error");
    setMovies([]);
  } finally {
    setLoading(false);
  }
};



  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phim này?")) {
      try {
        await MovieService.deleteMovie(id);
        showToast("Đã xóa phim thành công!", "success");
        fetchMovies();
      } catch (error) {
        showToast("Lỗi khi xóa phim", "error");
      }
    }
  };

  return (
    <div
      className="manage-movie-page"
      style={{
        backgroundImage: `url('https://i.pinimg.com/736x/1d/f1/70/1df170a8bbf0143f26655f2cf268a15d.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Header />

      <div className="container mt-4">
        <div className="manage-movie-header">
          <h1 className="manage-movie-title">🎬 Quản lý phim</h1>
          <button className="manage-movie-add-btn" onClick={() => setShowAddMovieModal(true)}>
            <Plus size={18} /> Thêm phim mới
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status" />
            <p className="mt-3 text-gray-700">Đang tải danh sách phim...</p>
          </div>
        ) : movies.length === 0 ? (
          <p className="text-center text-danger fw-semibold">Không có phim nào được tìm thấy.</p>
        ) : (
          <div className="movie-grid">
            {movies.map((movie) => (
              <div className="movie-card" key={movie.movieId}>
                 <Link to={`/movie/${movie.movieId}`}>
                <img
                  src={movie.thumbnailUrl || "https://via.placeholder.com/300x160?text=No+Image"}
                  alt={movie.title}
                  className="movie-thumbnail"
                />
                 </Link>
                <div className="movie-content">
                  <h2 className="movie-title">{movie.title} </h2>
                  <p className="movie-description">{movie.description}</p>
                  <p className="movie-episode-count">
                    <strong>Số tập:</strong> {movie.episodeCount || 0}
                    <br />
                     <strong>Ngày phát hành:</strong> {new Date(movie.createdAt).toLocaleDateString()}
                  </p>
                
                  <div className="movie-actions">
                    <button
                      className="btn-edit"
                      onClick={() => navigate(`/edit-movie/${movie.movieId}`)}
                    >
                      <Pencil size={16} /> Sửa
                    </button>
                    <button
                      className="btn-episode"
                      onClick={() => {
                        setSelectedMovieId(movie.movieId);
                        setShowEpisodeModal(true);
                      }}
                    >
                      <Film size={16} /> Thêm Tập Mới
                    </button>
 

                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(movie.movieId)}
                    >
                      <Trash2 size={16} /> Xóa
                    </button>
                  </div>
                </div>       
              </div>
            ))}
          </div>
        )}
      </div>

       {/* Hiển thị modal khi showAddMovie = true */}
    {showAddMovieModal && (
      <div className="modal-backdrop-custom"
         onClick={() => setShowAddMovieModal(false)}>
          <div className="modal-content-custom"
            onClick={e => e.stopPropagation()}>
     
          <ModelAddMovie
            onSuccess={() => {
              setShowAddMovieModal(false);
              fetchMovies(); // GỌI LẠI API sau khi thêm thành công
            }}
          />
        </div>
      </div>
    )}
      {/*thêm tập phim mới*/}
      {showEpisodeModal && (
    <div className="modal-backdrop-custom" onClick={() => setShowEpisodeModal(false)}>
      <div className="modal-content-custom" onClick={(e) => e.stopPropagation()}>
        <ModelAddNewEpisode
          movieId={selectedMovieId}
          onClose={() => setShowEpisodeModal(false)}
          onSuccess={() => {
            fetchMovies(); // Reload nếu cần
          }}
        />
      </div>
    </div>
  )}
    </div>
  );
};

export default ManageMoviePage;