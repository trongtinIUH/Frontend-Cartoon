import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import default_avatar from "../image/default_avatar.jpg";
import { useState } from "react";

dayjs.extend(relativeTime);
dayjs.locale("vi");

/** Build tree + gán replyCount */
export function buildFeedbackTree(feedbacks) {
  const map = {};
  const roots = [];

  // Tạo map trước
  feedbacks.forEach(fb => {
    map[fb.feedbackId] = { ...fb, replies: [] };
  });

  // Gắn con vào parent
  feedbacks.forEach(fb => {
    if (fb.parentFeedbackId && map[fb.parentFeedbackId]) {
      map[fb.parentFeedbackId].replies.push(map[fb.feedbackId]);
    } else {
      roots.push(map[fb.feedbackId]);
    }
  });

  // Tính tổng số reply cho từng root (bao gồm con, cháu)
  roots.forEach(r => addReplyCount(r));

  return roots;
}

/** Đệ quy tính tổng số replies (bao gồm con + cháu) */
function addReplyCount(node) {
  if (!node.replies) node.replies = [];
  let total = 0;
  node.replies.forEach(r => {
    total += 1 + addReplyCount(r);
  });
  node.replyCount = total;
  return total;
}



/** Highlight mention */
function renderContentWithMentions(content) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <strong key={index} className="text-info">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export function FeedbackItem({
  fb,
  userId,
  replyTo,
  replyContent,
  setReplyContent,
  setReplyTo,
  handleLikeFeedback,
  handleDislikeFeedback,
  handleSendReply
}) {
  const hasLiked = fb.likedUserIds?.includes(userId);
  const hasDisliked = fb.dislikedUserIds?.includes(userId);
  const likeCount = fb.likedUserIds?.length || 0;
  const dislikeCount = fb.dislikedUserIds?.length || 0;
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="list-group-item text-white mb-3 mt-3">
      {/* Comment gốc */}
      <div className="d-flex align-items-start mb-2 glassmorphism border-0">
        <img
          src={fb.avatarUrl || default_avatar}
          alt={fb.userId}
          className="rounded-circle me-3 flex-shrink-0"
          width="42"
          height="42"
        />
        <div className="flex-grow-1 min-w-0">
          <div className="fw-bold text-truncate">
            {fb.userName || "Ẩn danh"}
            <small className="text-secondary ms-2">
              {dayjs(fb.createdAt).fromNow()}
            </small>
          </div>
          <p className="mb-0 text-break">{renderContentWithMentions(fb.content)}</p>

          {/* Action buttons */}
          <div className="align-items-center gap-3 mt-2 small d-flex" style={{background: "transparent"}}>
            <span className="me-3 d-inline-flex align-items-center">
              <i
                className="fa-regular fa-thumbs-up me-1"
                role="button"
                title="Thích"
                onClick={() => handleLikeFeedback(fb.feedbackId)}
                style={{ color: hasLiked ? "#4bc1fa" : "" }}
              ></i>
              <small>{likeCount}</small>
            </span>

            <span className="me-3 d-inline-flex align-items-center">
              <i
                className="fa-regular fa-thumbs-down me-1"
                role="button"
                title="Không thích"
                onClick={() => handleDislikeFeedback(fb.feedbackId)}
                style={{ color: hasDisliked ? "#4bc1fa" : "" }}
              ></i>
              <small>{dislikeCount}</small>
            </span>

            <i
              className="fa-solid fa-reply"
              role="button"
              title="Trả lời"
              onClick={() => {
                if (replyTo?.feedbackId === fb.feedbackId) {
                  setReplyTo(null);
                  setReplyContent("");
                } else {
                  setReplyTo(fb);
                  setReplyContent(`@${(fb.userName || "Ẩn danh").split(" ")[0]} `);
                }
              }}
            ></i>
          </div>

          {/* Toggle replies */}
          {fb.replyCount > 0 && (
            <div
              className="text-info small mt-2"
              style={{ cursor: "pointer" }}
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies
                ? "▲ Ẩn bình luận"
                : `▼ ${fb.replyCount} bình luận`}
            </div>
          )}

          {/* Replies (chỉ 1 cấp, ngang hàng nhau) */}
          {showReplies && fb.replies.length > 0 && (
            <div className="mt-2 ms-5">
              {fb.replies.map((r) => (
                <div key={r.feedbackId} className="mb-2">
                  <FeedbackItem
                    fb={r}
                    userId={userId}
                    replyTo={replyTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    setReplyTo={setReplyTo}
                    handleLikeFeedback={handleLikeFeedback}
                    handleDislikeFeedback={handleDislikeFeedback}
                    handleSendReply={handleSendReply}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reply box */}
      {replyTo?.feedbackId === fb.feedbackId && (
        <div className="card bg-black border-0 mb-2 mt-2 ms-5">
          <div className="card-body">
            <textarea
              className="form-control bg-dark text-white border-secondary"
              rows="2"
              placeholder={`Trả lời ${fb.userName || "Ẩn danh"}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              maxLength={1000}
              style={{ height: "80px", resize: "none" }}
            />
            <div className="d-flex justify-content-between align-items-center mt-2 bg-black">
              <small className="text-white">{replyContent.length} / 1000</small>
              <i
                className="btn btn-rate"
                disabled={!replyContent.trim()}
                onClick={() => handleSendReply(fb)}
              >
                Gửi <i className="fa-solid fa-paper-plane ms-1" />
              </i>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
