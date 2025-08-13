import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SidebarUserManagement from "../components/SidebarUserManagement";
import { toast } from "react-toastify";
import default_avatar from "../image/default_avatar.jpg"
import WishlistService from "../services/WishlistService";

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
        console.log('Wishlist:', wishlist);
        setWishlist(wishlist);
      } catch (error) {
        console.error('Error fetching wishlist:', error);
      }
    };

    fetchWishlist();
  }, [MyUser]);

  return (
    <div className="d-flex bg-dark text-white min-vh-100 py-5 px-5">
      <SidebarUserManagement />

      <div className="flex-grow-1 p-4" style={{ marginLeft: '50px', marginTop: '100px' }}>
        <h5 className="mb-4 fw-bold">Yêu thích</h5>
        <p className="mb-4">Danh sách phim yêu thích của bạn</p>

        <div className="row g-4">
          {wishlist?.length > 0 ? (
            wishlist.map((movie) => (
              <div key={movie.movieId} className="col-6 col-md-4 col-lg-2">
                <div className="card bg-transparent border-0">
                  {/* Poster */}
                  <div className="position-relative rounded-3 overflow-hidden shadow-sm">
                    <img
                      src={movie.moviePosterUrl || default_avatar}
                      alt={movie.movieTitle}
                      className="w-100 d-block"
                      style={{ aspectRatio: '2 / 3', objectFit: 'cover' }}
                    />

                    {/* Nút X xoá */}
                    <button
                      type="button"
                      className="btn btn-sm btn-dark bg-opacity-75 border-0 position-absolute top-0 end-0 m-2 rounded-circle"
                      aria-label="Remove from wishlist"
                      style={{ width: 28, height: 28, lineHeight: '28px', padding: 0 }}
                    >
                      ×
                    </button>
                  </div>

                  {/* Titles */}
                  <div className="mt-2 text-center">
                    <div className="text-white fw-semibold text-truncate">{movie.movieTitle}</div>
                    <div className="text-secondary small text-truncate">
                      {movie.movieSubtitle || movie.enTitle || movie.originalTitle || ''}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-muted">Không có phim nào trong danh sách yêu thích.</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FavoritesPage;
