// utils/antiCapture.js
export function initAntiCapture(player) {
  // console.log("🔒 initAntiCapture called with player:", player);
  
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
      
      /* Watermark chống chụp màn hình - Gần như vô hình */
      #anti-capture-watermark {
        position: fixed; inset: 0; z-index: 9998; pointer-events: none;
        background: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 150px,
          rgba(255,255,255,0.01) 150px,
          rgba(255,255,255,0.01) 300px
        );
        font-family: Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.03);
        display: flex; flex-wrap: wrap; align-content: flex-start; gap: 200px; padding: 50px;
        opacity: 0.5;
      }
      #anti-capture-watermark .watermark-text {
        transform: rotate(-25deg); white-space: nowrap; user-select: none;
        text-shadow: 0 0 2px rgba(0,0,0,0.1);
      }
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
        <h2>⚠️ PHÁT HIỆN CHỤP MÀN HÌNH</h2>
        <p>Nội dung được bảo vệ bởi hệ thống chống sao chép</p>
        <p style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Video đã tạm dừng. Vui lòng không chụp/quay màn hình.</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  // Tạo watermark layer (hiển thị user ID để truy vết) - Gần như vô hình
  let watermark = document.getElementById("anti-capture-watermark");
  if (!watermark) {
    watermark = document.createElement("div");
    watermark.id = "anti-capture-watermark";
    
    // Lấy user ID từ localStorage hoặc tạo unique ID
    let userId = "PROTECTED";
    try {
      const myUser = JSON.parse(localStorage.getItem('my_user') || '{}');
      userId = myUser?.my_user?.userId || myUser?.userId || `GUEST_${Date.now()}`;
    } catch {}
    
    // Tạo watermark text lặp lại (giảm số lượng để ít phiền hơn)
    const timestamp = new Date().toLocaleString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    for (let i = 0; i < 30; i++) { // Giảm từ 50 xuống 30
      const span = document.createElement("span");
      span.className = "watermark-text";
      span.textContent = `CartoonToo • ${userId.slice(-8)} • ${timestamp}`;
      watermark.appendChild(span);
    }
    
    document.body.appendChild(watermark);
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

  const showOverlay = () => { 
    safePause(); 
    overlay.style.display = "flex";
    // Blur video khi chụp màn hình
    try {
      const videoEl = player?.el?.()?.querySelector?.("video");
      if (videoEl) {
        videoEl.style.filter = "blur(50px)";
      }
    } catch {}
  };
  
  const hideOverlay = () => { 
    overlay.style.display = "none";
    // Unblur video
    try {
      const videoEl = player?.el?.()?.querySelector?.("video");
      if (videoEl) {
        videoEl.style.filter = "none";
      }
    } catch {}
  };

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
  
  // ✅ IMPROVED: Detect window blur (user switching apps for screen capture)
  let blurTimeout = null;
  const onBlur = () => {
    // Delay để không trigger khi click vào address bar
    blurTimeout = setTimeout(() => {
      if (document.hidden || !document.hasFocus()) {
        showOverlay();
      }
    }, 100);
  };
  
  const onFocus = () => {
    clearTimeout(blurTimeout);
    // Chỉ hide nếu không đang trong fullscreen hoặc không có key press
    if (!document.fullscreenElement) {
      hideOverlay();
    }
  };
  
  let windowsKeyPressed = false;
  let shiftKeyPressed = false;
  let ctrlKeyPressed = false;
  
  const onKeyDown = (e) => {
    // Track modifier keys
    if (e.key === "Meta" || e.key === "OS") {
      windowsKeyPressed = true;
    }
    if (e.key === "Shift") {
      shiftKeyPressed = true;
    }
    if (e.key === "Control") {
      ctrlKeyPressed = true;
    }
    
    // ✅ IMPROVED: Detect all screenshot combinations
    const isScreenshotCombo = (
      // Windows: Win + Shift + S (Snipping Tool)
      (windowsKeyPressed && shiftKeyPressed && e.key.toLowerCase() === "s") ||
      // Windows: Win + Shift (any key) - preemptive block
      (windowsKeyPressed && shiftKeyPressed) ||
      // Windows: Win + PrtSc
      (windowsKeyPressed && e.key === "PrintScreen") ||
      // PrtSc alone
      e.key === "PrintScreen" ||
      // Mac: Cmd + Shift + 3/4/5
      (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) ||
      // Mac/Windows: Ctrl + Shift + S (some screenshot tools)
      (ctrlKeyPressed && shiftKeyPressed && e.key.toLowerCase() === "s") ||
      // F12 (DevTools)
      e.key === "F12" ||
      // Ctrl + Shift + I (DevTools)
      (ctrlKeyPressed && shiftKeyPressed && e.key.toLowerCase() === "i") ||
      // Ctrl + Shift + J (Console)
      (ctrlKeyPressed && shiftKeyPressed && e.key.toLowerCase() === "j") ||
      // Ctrl + U (View Source)
      (ctrlKeyPressed && e.key.toLowerCase() === "u")
    );
    
    if (isScreenshotCombo) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showOverlay();
      
      // Keep overlay visible for longer duration
      setTimeout(() => {
        if (!windowsKeyPressed && !shiftKeyPressed && !ctrlKeyPressed) {
          hideOverlay();
        }
      }, 2000);
    }
  };
  
  const onKeyUp = (e) => {
    // Reset key states on release
    if (e.key === "Meta" || e.key === "OS") {
      windowsKeyPressed = false;
    }
    if (e.key === "Shift") {
      shiftKeyPressed = false;
    }
    if (e.key === "Control") {
      ctrlKeyPressed = false;
    }
  };
  
  // ✅ IMPROVED: Detect visibility change (tab switching, screen recording apps)
  const onVisibility = () => {
    if (document.hidden) {
      showOverlay();
    } else {
      // Only hide if no modifier keys are pressed
      if (!windowsKeyPressed && !shiftKeyPressed && !ctrlKeyPressed) {
        setTimeout(hideOverlay, 500);
      }
    }
  };
  
  // ✅ NEW: Detect clipboard access (screenshot tools often copy to clipboard)
  const onCopy = (e) => {
    // Allow text copy, but trigger warning
    if (window.getSelection().toString()) {
      return; // Allow text selection copy
    }
    // Potential screenshot to clipboard
    e.preventDefault();
    showOverlay();
    setTimeout(() => {
      if (!document.hidden) hideOverlay();
    }, 2000);
  };
  
  // ✅ NEW: Monitor canvas/WebGL contexts (screen recording detection)
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  let screenRecordingDetected = false;
  HTMLCanvasElement.prototype.getContext = function(...args) {
    const context = originalGetContext.apply(this, args);
    if (!screenRecordingDetected && args[0] === 'webgl' && this.width * this.height > 1000000) {
      // Large canvas might be screen recording
      screenRecordingDetected = true;
      console.warn("⚠️ Possible screen recording detected");
    }
    return context;
  };
  
  // ✅ NEW: Detect fullscreen exit (user might be preparing to screenshot)
  const onFullscreenChange = () => {
    if (!document.fullscreenElement && document.hidden) {
      // Exited fullscreen while tab is hidden - suspicious
      showOverlay();
    }
  };

  // Register all event listeners
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);
  document.addEventListener("keydown", onKeyDown, true); // Capture phase
  document.addEventListener("keyup", onKeyUp, true);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("copy", onCopy);
  document.addEventListener("fullscreenchange", onFullscreenChange);
  
  // ✅ NEW: Monitor Media Session API (used by screen recorders)
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => {
        if (document.hidden) showOverlay();
      });
    } catch {}
  }
  
  // ✅ NEW: Detect Page Visibility API abuse
  let visibilityChangeCount = 0;
  let lastVisibilityChange = Date.now();
  const originalAddEventListener = document.addEventListener;
  document.addEventListener = function(type, listener, ...args) {
    if (type === 'visibilitychange') {
      const now = Date.now();
      if (now - lastVisibilityChange < 1000) {
        visibilityChangeCount++;
        if (visibilityChangeCount > 5) {
          console.warn("⚠️ Suspicious visibility changes detected");
          showOverlay();
        }
      } else {
        visibilityChangeCount = 0;
      }
      lastVisibilityChange = now;
    }
    return originalAddEventListener.call(this, type, listener, ...args);
  };

  // ✅ Cleanup function
  return () => {
    clearInterval(intervalId);
    clearTimeout(blurTimeout);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("keyup", onKeyUp, true);
    document.removeEventListener("visibilitychange", onVisibility);
    document.removeEventListener("copy", onCopy);
    document.removeEventListener("fullscreenchange", onFullscreenChange);
    
    // Restore original functions
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    document.addEventListener = originalAddEventListener;
    
    // Remove watermark
    if (watermark && watermark.parentNode) {
      watermark.parentNode.removeChild(watermark);
    }
  };
}
