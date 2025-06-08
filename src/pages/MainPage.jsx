import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../css/MainPage.css";

const MOVIES_PER_PAGE = 8;

const MainPage = () => {
  const [movies, setMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const demoMovies = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      title: `Phim hoạt hình Conan tập ${i + 1}`,
      image: `https://imgur-com.cdn.ampproject.org/i/imgur.com/NA2h4BE.jpg/150x220?text=Movie+${i + 1}`,
    }));
    setMovies(demoMovies);
  }, []);

  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
  const startIdx = (currentPage - 1) * MOVIES_PER_PAGE;
  const currentMovies = movies.slice(startIdx, startIdx + MOVIES_PER_PAGE);

  return (
    <div   style={{backgroundImage: `url('https://i.pinimg.com/736x/1d/f1/70/1df170a8bbf0143f26655f2cf268a15d.jpg')`,
                    backgroundSize: 'auto',
                    backgroundPosition: 'center'}}>

    <div className="main-page container"   >
        
      <Header />

      <div className="row mt-4">
        {currentMovies.map((movie) => (
          <div className="col-md-3 mb-4" key={movie.id}>
            <div className="card h-100">
              <img
                src={movie.image}
                className="card-img-top"
                alt={movie.title}
              />
              <div className="card-body">
                <h5 className="card-title">{movie.title}</h5>
              </div>
            </div>
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
