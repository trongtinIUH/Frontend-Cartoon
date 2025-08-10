// src/components/CustomToastCloseButton.js
import React from "react";

export default function CustomToastCloseButton({ closeToast }) {
  return (
    <button
      onClick={closeToast}
      style={{
        border: "none",
        background: "transparent",
        color: "#fff",
        fontSize: "16px",
        cursor: "pointer",
        marginRight: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.target.style.background = "rgba(255,255,255,0.1)";
      }}
      onMouseLeave={(e) => {
        e.target.style.background = "transparent";
      }}
    >
      ✕
    </button>
  );
}
