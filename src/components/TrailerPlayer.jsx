import Hls from "hls.js";
import { useEffect, useRef } from "react";

function TrailerPlayer({ src, poster }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;

    // Safari phát HLS native
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }
    // Chrome/Firefox dùng hls.js
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }

    // Fallback
    video.src = src;
  }, [src]);

  return (
    <video
      ref={ref}
      controls
      playsInline
      poster={poster}
      style={{ width: "100%", borderRadius: 12, background: "#000" }}
    />
  );
}
export default TrailerPlayer;