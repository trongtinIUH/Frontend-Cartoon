// utils/antiCapture.js
export function initAntiCapture(player) {
  console.log("🔒 initAntiCapture called with player:", player);
  
  // tạo CSS 1 lần
  if (!document.getElementById("anti-capture-style")) {
    const style = document.createElement("style");
    style.id = "anti-capture-style";
    style.textContent = `
      #anti-capture-overlay {
        display: none; position: fixed; inset: 0; z-index: 99999;
        background: rgba(0,0,0,.9); color: #fff;
        text-align: center; justify-content: center; align-items: center; flex-direction: column;
      }
      #anti-capture-overlay .overlay-content img{ width:100px; border-radius: 20%; margin-bottom: 10px; }
      #anti-capture-overlay .overlay-content h2{ font-size:28px; margin-bottom:5px; }
      #anti-capture-overlay .overlay-content p{ font-size:18px; }
    `;
    document.head.appendChild(style);
  }

  // tạo overlay 1 lần
  let overlay = document.getElementById("anti-capture-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "anti-capture-overlay";
    overlay.innerHTML = `
      <div class="overlay-content">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Vanuatu_stop_sign.svg/600px-Vanuatu_stop_sign.svg.png" alt="warning" />
        <h2>BẢO VỆ NỘI DUNG</h2>
        <p>Nội dung được bảo vệ bởi hệ thống chống sao chép</p>
        <p style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Vui lòng đóng các công cụ phát triển và refresh lại trang</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // chỉ pause khi player còn tồn tại + chưa dispose + có <video>
  const safePause = () => {
    try {
      if (!player) return;
      if (typeof player.isDisposed === "function" && player.isDisposed()) return;
      const videoEl = player.el?.().querySelector?.("video");
      videoEl?.pause?.();
    } catch (_) { /* no-op */ }
  };

  const showOverlay = () => { safePause(); overlay.style.display = "flex"; };
  const hideOverlay = () => { overlay.style.display = "none"; };

  let devtoolsOpen = false;
  const threshold = 160;
  const detect = () => {
    const widthThreshold  = window.outerWidth  - window.innerWidth  > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    if (widthThreshold || heightThreshold) {
      if (!devtoolsOpen) { devtoolsOpen = true; showOverlay(); }
    } else {
      if (devtoolsOpen) { devtoolsOpen = false; hideOverlay(); }
    }
  };

  const intervalId   = window.setInterval(detect, 500);
  const onBlur       = () => showOverlay();
  const onFocus      = () => hideOverlay();
  let windowsKeyPressed = false;
  let shiftKeyPressed = false;
  
  const onKeyDown = (e) => {
    console.log("🔍 Key pressed:", { 
      key: e.key, 
      shiftKey: e.shiftKey, 
      metaKey: e.metaKey, 
      ctrlKey: e.ctrlKey,
      altKey: e.altKey
    });
    
    // Track Windows key state
    if (e.key === "Meta") {
      windowsKeyPressed = true;
    }
    if (e.key === "Shift") {
      shiftKeyPressed = true;
    }
    
    // Check for Windows + Shift combination (regardless of F key)
    if (windowsKeyPressed && shiftKeyPressed) {
      console.log("🚫 Windows + Shift combination detected!");
      e.preventDefault();
      showOverlay();
      return;
    }
    
    // Các tổ hợp khác
    if (
      e.key === "PrintScreen" ||
      (e.shiftKey && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") ||
      (e.shiftKey && e.metaKey && e.key.toLowerCase() === "f") ||
      (e.key === "F12") ||
      (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i")
    ) {
      console.log("🚫 Blocked key combination detected!");
      e.preventDefault();
      showOverlay();
    }
  };
  
  const onKeyUp = (e) => {
    // Reset key states on release
    if (e.key === "Meta") {
      windowsKeyPressed = false;
    }
    if (e.key === "Shift") {
      shiftKeyPressed = false;
    }
  };
  const onVisibility = () => (document.hidden ? showOverlay() : hideOverlay());

  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("visibilitychange", onVisibility);

  // cleanup đầy đủ
  return () => {
    clearInterval(intervalId);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
