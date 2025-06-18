import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieService from '../services/MovieService';
import EpisodeService from '../services/EpisodeService';
import showToast from '../utils/AppUtils';
import '../css/ManageMoviePage.css';
import Header from "../components/Header";
import Footer from "../components/Footer";
import ModelAddMovie from '../models/ModelAddMovie';
import ModelAddNewEpisode from '../models/ModelAddNewEpisode';
import ModelUpdateMovie from '../models/ModelUpdateMovie';
import { Plus, Pencil, Trash2, Film ,CirclePlus} from "lucide-react";
import { Link } from "react-router-dom";



const ManageMoviePage = () => {
  const [movies, setMovies] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  //mở model thêm tập mới
  const [showEpisodeModal, setShowEpisodeModal] = useState(false);
  const [selectedMovieId,setSelectedMovieId] = useState(null);
  const [showUpdateMovieModal, setShowUpdateMovieModal] = useState(false);

const MOVIES_PER_PAGE = 6;
const [currentPage, setCurrentPage] = useState(1);

const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
const startIdx = (currentPage - 1) * MOVIES_PER_PAGE;
const currentMovies = movies.slice(startIdx, startIdx + MOVIES_PER_PAGE);


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


//xóa nhiều phim
const [selectedMovies, setSelectedMovies] = useState([]);
const handleBulkDelete = async () => {
  if (selectedMovies.length === 0) {
    showToast("Bạn chưa chọn phim nào để xóa", "warning");
    return;
  }

  if (window.confirm("Bạn có chắc chắn muốn xóa các phim đã chọn?")) {
    try {
      await MovieService.deleteMovies(selectedMovies);
      showToast("Đã xóa phim thành công!", "success");
      fetchMovies();
      setSelectedMovies([]);
    } catch (error) {
      showToast("Lỗi khi xóa phim", "error");
    }
  }
};
const toggleMovieSelection = (id) => {
  setSelectedMovies((prev) =>
    prev.includes(id) ? prev.filter((movieId) => movieId !== id) : [...prev, id]
  );
};

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa phim này?")) {
      try {
      await MovieService.deleteMovies([id]);
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
        <h1 className="manage-movie-title" style={{width:"100%",justifyContent:"center"}}>🎬 Quản lý phim</h1>
        <div className="manage-movie-header">
 
          <button className="manage-movie-add-btn" onClick={() => setShowAddMovieModal(true)}>
            <Plus size={20} /> Thêm phim mới
          </button>
          <button
          style={{width:"50%"}}
            className="btn btn-danger mb-2"
            onClick={handleBulkDelete}
            disabled={selectedMovies.length === 0}
          >
            <Trash2 size={18} /> Xóa nhiều phim ({selectedMovies.length})
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
            {currentMovies.map((movie) => (
              <div className="movie-card" key={movie.movieId}>
                <input
                    type="checkbox"
                    checked={selectedMovies.includes(movie.movieId)}
                    onChange={() => toggleMovieSelection(movie.movieId)}
                    className="form-check-input"
                  />

                 <Link to={`/movie/${movie.movieId}`}>
                <img
                  src={movie.thumbnailUrl || "https://via.placeholder.com/300x160?text=No+Image"}
                  alt={movie.title}
                  className="movie-thumbnail"
                />
                 </Link>
                <div className="movie-content">
                  <h2 className="movie-title">{movie.title} </h2>
                  <p className="movie-episode-count">
                    <strong>Số tập:</strong> {movie.episodeCount || 0}
                    <br />
                     <strong>Ngày phát hành:</strong> {new Date(movie.createdAt).toLocaleDateString()}
                  </p>
                
                  <div className="movie-actions">
                    <button
                      className="btn-edit"
                      onClick={() => {                   
                        setSelectedMovieId(movie.movieId);
                        setShowUpdateMovieModal(true);
                        console.log("Selected Movie ID:", movie.movieId);
                      }}
                    >
                      <Pencil size={20} /> Sửa
                    </button>
                    <button
                      className="btn-episode"
                      onClick={() => {
                        setSelectedMovieId(movie.movieId);
                        setShowEpisodeModal(true);
                      }}
                    >
                      <CirclePlus size={20} /> Thêm Tập
                    </button>
 

                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(movie.movieId)}
                    >
                      <Trash2 size={20} /> Xóa
                    </button>
                  </div>
                </div>       
              </div>
            ))}
            <nav className="d-flex justify-content-center mt-4">
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>
                    &laquo;
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>

          </div>
          
        )}
      </div>

    
    {/* Hiển thị modal khi showAddMovie = true */}
    {showAddMovieModal && (
      <div className="modaladd-backdrop-custom"
         onClick={() => setShowAddMovieModal(false)}>
          <div className="modaladd-content-custom"
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
        <div className="episode-modal-backdrop" onClick={() => setShowEpisodeModal(false)}>
          <div className="episode-modal-content" onClick={(e) => e.stopPropagation()}>
            <ModelAddNewEpisode
              movieId={selectedMovieId}
              onClose={() => setShowEpisodeModal(false)}
              onSuccess={fetchMovies}
            />
          </div>
        </div>
      )}

      {/*hiển thị model cập nhật phim*/}
      {showUpdateMovieModal && selectedMovieId && (
      <div className="update-modal-backdrop" onClick={()=>setShowUpdateMovieModal(false) }>
        <div className='update-modal-content' onClick={(e)=> e.stopPropagation()}>
          <ModelUpdateMovie
            movieId={selectedMovieId}
            onClose={() => setShowUpdateMovieModal(false)}
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