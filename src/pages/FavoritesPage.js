import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SidebarUserManagement from "../components/SidebarUserManagement";
import { toast } from "react-toastify";
import default_avatar from "../image/default_avatar.jpg";
import WishlistService from "../services/WishlistService";
import "../css/FavoritesPage.css";
const FavoritesPage = () => {
  const { MyUser } = useAuth();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (!MyUser) {
      navigate("/login");
    }
  }, [MyUser, navigate]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const wishlist = await WishlistService.getWishlist(MyUser.my_user.userId);
        setWishlist(wishlist);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      }
    };

    if (MyUser?.my_user?.userId) {
      fetchWishlist();
    }
  }, [MyUser]);

  const handleRemoveFromWishlist = async (movieId) => {
    try {
      await WishlistService.removeFromWishlist(MyUser.my_user.userId, movieId);
      setWishlist((prevWishlist) =>
        prevWishlist.filter((movie) => movie.movieId !== movieId)
      );
      toast.success("Xóa khỏi danh sách yêu thích");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Xóa khỏi danh sách yêu thích thất bại");
    }
  };

  return (
    <div className="container-fluid bg-dark text-white min-vh-100 py-5 px-3 profile-page">
      <div className="row">
        {/* Sidebar */}
        <div className="col-12 col-lg-3 mb-4">
          <SidebarUserManagement />
        </div>

        {/* Content */}
        <div className="col-12 col-lg-9">
          <h5 className="mb-4 fw-bold">Yêu thích</h5>
          <p className="mb-4">Danh sách phim yêu thích của bạn</p>

          <div className="wishlist-grid">
            {wishlist?.length > 0 ? (
              wishlist.map((movie) => (
                <div key={movie.movieId} className="wishlist-card">
                  <div className="card bg-transparent border-0">
                    {/* Poster */}
                    <div className="position-relative rounded-3 overflow-hidden shadow-sm">
                      <Link
                        to={`/movie/${movie.movieId}`}
                        className="position-relative rounded-3 overflow-hidden shadow-sm d-block"
                      >
                        <img
                          src={movie.moviePosterUrl || default_avatar}
                          alt={movie.movieTitle}
                          className="w-100 d-block"
                          style={{ aspectRatio: "2 / 3", objectFit: "cover" }}
                        />
                      </Link>

                      {/* Remove button */}
                      <button
                        type="button"
                        className="btn btn-sm btn-dark bg-opacity-75 border-0 position-absolute top-0 end-0 m-2 rounded-circle"
                        aria-label="Remove from wishlist"
                        style={{ width: 28, height: 28, lineHeight: "28px", padding: 0 }}
                        onClick={() => handleRemoveFromWishlist(movie.movieId)}
                      >
                        ×
                      </button>
                    </div>

                    {/* Titles */}
                    <div className="mt-2 text-center">
                      <div className="text-white fw-semibold title">
                        {movie.movieTitle}
                      </div>
                      <div className="text-secondary small text-truncate">
                        {movie.movieSubtitle ||
                          movie.enTitle ||
                          movie.originalTitle ||
                          ""}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-muted text-center">
                Không có phim nào trong danh sách yêu thích.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage;
