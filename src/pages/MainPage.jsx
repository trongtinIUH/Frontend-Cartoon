import React, { useEffect, useState,useCallback } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/MainPage.css";
import { Link } from "react-router-dom";
import MovieService from "../services/MovieService";

const MOVIES_PER_PAGE = 8;

const MainPage = () => {
  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

    
  const fetchMovies = useCallback(async () => {
          try {
            const data = await MovieService.getAllMovies();
            if (Array.isArray(data)) {
              setMovies(data);
            } else {
              setMovies([]); // Nếu không phải mảng (null, undefined, object), set rỗng
            }
          } catch (error) {
            setMovies([]);
          }
      }, []);
      //load movies from server
    useEffect(() => {
      fetchMovies();
    },  [fetchMovies]);

  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
  const startIdx = (currentPage - 1) * MOVIES_PER_PAGE;
  const currentMovies = movies.slice(startIdx, startIdx + MOVIES_PER_PAGE);

  return (
    <div   style={{backgroundImage: `url('https://i.pinimg.com/736x/1d/f1/70/1df170a8bbf0143f26655f2cf268a15d.jpg')`,
                    backgroundSize: 'auto',
                    backgroundPosition: 'center'}}>

    <div className="main-page container"   >
        
      <Header  fetchMovies={fetchMovies}/>

      <div className="row mt-4">
        {currentMovies.map((movie) => (
          <div className="col-md-2 mb-4" key={movie.movieId}>
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

      <Footer />
    </div>
    </div>
  );
};

export default MainPage;
