import React, { useEffect, useState,useCallback } from "react";
import "../css/MainPage.css";
import { Link } from "react-router-dom";
import MovieService from "../services/MovieService";
import { useParams } from "react-router-dom";

const MOVIES_PER_PAGE = 20;

const GenreMoviesPage = () => {
    
    const [movies, setMovies] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const { genre } = useParams(); // lấy từ URL

    
  const fetchMoviesByGenre  = useCallback(async () => {
          try {
            const data = await MovieService.getMoviesByGenre(genre);
            console.log("Movies by genre:", data);
           setMovies(data || []);
          } catch (error) {
            setMovies([]);
          }
      }, [genre]);

      //load movies from server
    useEffect(() => {
      fetchMoviesByGenre();
    },  [fetchMoviesByGenre]);

  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
  const startIdx = (currentPage - 1) * MOVIES_PER_PAGE;
  const currentMovies = movies.slice(startIdx, startIdx + MOVIES_PER_PAGE);

  return (
    <div   style={{backgroundImage: `url('https://i.pinimg.com/736x/1d/f1/70/1df170a8bbf0143f26655f2cf268a15d.jpg')`,
                    backgroundSize: 'auto',
                    backgroundPosition: 'center'}}>

    <div className="main-page container"   >
        
   
    <h3 className="text-black pt-3">Thể loại: {genre}</h3>
      <div className="row mt-4">
        {currentMovies.map((movie) => (
          <div className="col-md-2  mb-4" key={movie.movieId}>
            <Link to={`/movie/${movie.movieId}`}>
            <div className="card h-100 bg-light">
              <img
                src={movie.thumbnailUrl || "https://th.bing.com/th/id/OIP.044hbqIQlG5Al-y5ADrlHQHaEK?rs=1&pid=ImgDetMain"}
                className="card-img-top thumbnail-img"
                alt={movie.title}
              />
              <div className="card-body text-center">
                <h5 className="card-title" style={{fontSize:"18px"}}>{movie.title}</h5>
              </div>
            </div>
            </Link>
          </div>
        ))}
      </div>

      {/* phân trang*/}
      <nav className="d-flex justify-content-center mt-4">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage - 1)}
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
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            </li>
          ))}
          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage + 1)}
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

export default GenreMoviesPage;
