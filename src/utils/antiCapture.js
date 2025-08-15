// antiCapture.js
import videojs from "video.js";
export function initAntiCapture(player) {
  let devtoolsOpen = false;
  const threshold = 160;
  let overlay = document.getElementById("anti-capture-overlay");

  // Nếu chưa có overlay thì tạo
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "anti-capture-overlay";
    overlay.innerHTML = `
      <div class="overlay-content">
        <img src="https://thuvienmeme.com/wp-content/uploads/2024/06/meme-meo-chi-tay-may-coi-chung-tao.jpg" alt="warning" />
        <h2>CÓ BIẾN RỒI</h2>
        <p>Hãy thử refresh lại</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // CSS cho overlay
  const style = document.createElement("style");
  style.innerHTML = `
    #anti-capture-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      z-index: 99999;
      text-align: center;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }
    #anti-capture-overlay .overlay-content img {
      width: 100px;
      border-radius: 20%;
      margin-bottom: 10px;
    }
    #anti-capture-overlay .overlay-content h2 {
      font-size: 28px;
      margin-bottom: 5px;
    }
    #anti-capture-overlay .overlay-content p {
      font-size: 18px;
    }
  `;
  document.head.appendChild(style);

  // Hàm hiển thị overlay
  const showOverlay = () => {
    player.pause();
    overlay.style.display = "flex";
  };

  // Hàm ẩn overlay
  const hideOverlay = () => {
    overlay.style.display = "none";
  };

  setInterval(() => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        showOverlay();
      }
    } else {
      if (devtoolsOpen) {
        devtoolsOpen = false;
        hideOverlay();
      }
    }
  }, 500);

  // Ẩn video khi tab không active
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      showOverlay();
    } else {
      hideOverlay();
    }
  });
}