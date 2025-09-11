import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollManager() {
  const location = useLocation();

  // tắt khôi phục scroll mặc định của browser
  useEffect(() => {
    const prev = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => { window.history.scrollRestoration = prev; };
  }, []);

  // mỗi lần đổi route -> lên đầu trang với delay để đảm bảo component đã render
  useEffect(() => {
    // Sử dụng setTimeout để đảm bảo DOM đã được render hoàn toàn
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };
    
    // Scroll ngay lập tức
    scrollToTop();
    
    // Và cũng scroll sau khi render (backup)
    setTimeout(scrollToTop, 100);
  }, [location.pathname, location.search]);

  return null;
}
