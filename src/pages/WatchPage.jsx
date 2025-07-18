import { useLocation } from "react-router-dom";
import React, { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import "videojs-http-source-selector"; // nếu vẫn dùng
import "videojs-hls-quality-selector"; // ✅ dùng để chọn chất lượng m3u8
import "../css/WatchPage.css";

const WatchPage = () => {
  const location = useLocation();
  const episode = location.state?.episode;
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      const devtoolsOpen = widthDiff || heightDiff;

      if (videoRef.current) {
        videoRef.current.style.filter = devtoolsOpen ? "brightness(0)" : "brightness(1)";
      }
    };

    window.addEventListener("resize", detectDevTools);
    return () => window.removeEventListener("resize", detectDevTools);
  }, []);

  useEffect(() => {
    if (episode?.videoUrl && videoRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: true,
        preload: "auto",
        fluid: true,
        responsive: true,
        sources: [
          {
            src: episode.videoUrl,
            type: "application/x-mpegURL", // HLS format
          },
        ],
      });

      // ✅ Add HLS quality selector
      playerRef.current.ready(() => {
        playerRef.current.hlsQualitySelector({
          displayCurrentQuality: true,
        });

        // Nếu vẫn muốn giữ httpSourceSelector (có thể bỏ nếu không cần)
        playerRef.current.httpSourceSelector?.({
          default: "auto",
        });
      });

      return () => {
        if (playerRef.current) {
          playerRef.current.dispose();
        }
      };
    }
  }, [episode]);

  if (!episode) return <div>Không tìm thấy tập phim.</div>;

  return (
    <div className="watch-page">
      <h2 className="text-white">{episode.title}</h2>
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin vjs-big-play-centered"
        ></video>
      </div>
    </div>
  );
};

export default WatchPage;
