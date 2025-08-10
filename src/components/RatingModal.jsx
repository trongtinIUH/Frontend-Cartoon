import React, { useEffect, useState } from "react";
import '../css/componentsCSS/RatingModal.css';
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

const RATINGS = [
  { value: 5, label: "Tuyệt vời", emoji: "😍" },
  { value: 4, label: "Phim hay",  emoji: "😊" },
  { value: 3, label: "Khá ổn",    emoji: "🙂" },
  { value: 2, label: "Phim chán", emoji: "😕" },
  { value: 1, label: "Dở tệ",     emoji: "💀" },
];

export default function RatingModal({
  show,
  movieTitle = "Tên phim",
  average = 5.0,
  total = 0,
  onClose,
  onSubmit, // (value) => Promise|void
}) {
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (show) setSelected(null);
  }, [show]);

  const handleSubmit = async () => {
    if (!selected || !onSubmit) return;
    try {
      setSubmitting(true);
      await onSubmit(selected);
      onClose?.();
     toast("Đánh giá thành công!", "success");
    } catch (error) {
      console.error("Đánh giá thất bại", error);
      toast("Đánh giá thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="rating-backdrop" role="dialog" aria-modal="true">
      <div className="rating-modal glass">
        <button
          className="rating-close"
          aria-label="Đóng"
          onClick={onClose}
        >
          ×
        </button>

        <div className="rating-header">
          <div className="rating-title">
            <div className="subtitle">Đánh giá</div>
            <div className="title">{movieTitle}</div>
          </div>

          <div className="rating-stats">
            <img
              src="https://cdn-icons-png.flaticon.com/512/616/616490.png"
              alt="star"
              width="20"
              height="20"
            />
            <span className="avg">{average.toFixed(1)}</span>
            <span className="muted">/ {total} lượt</span>
          </div>
        </div>

        <div className="rating-grid">
          {RATINGS.map((r) => {
            const active = selected === r.value;
            return (
              <button
                key={r.value}
                className={`rating-pill ${active ? "active" : ""}`}
                onClick={() => setSelected(r.value)}
              >
                <span className="emoji">{r.emoji}</span>
                <span className="text">{r.label}</span>
              </button>
            );
          })}
        </div>

        <div className="rating-actions">
          <button className="btn-secondary" onClick={onClose}>Đóng</button>
          <button
            className="btn-primary"
            disabled={!selected || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
