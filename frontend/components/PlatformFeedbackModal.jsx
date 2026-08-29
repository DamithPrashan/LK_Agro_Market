import { useState } from "react";
import { useTranslation } from "react-i18next";
import "./PlatformFeedbackModal.css";

// Line-art face SVG components matching the user's design
const VeryHappyFace = () => (
  <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="32" r="28" />
    <circle cx="21" cy="23" r="3.5" fill="currentColor" stroke="none" />
    <circle cx="43" cy="23" r="3.5" fill="currentColor" stroke="none" />
    <path d="M 18 36 C 22 48, 42 48, 46 36" />
  </svg>
);

const HappyFace = () => (
  <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="32" r="28" />
    <circle cx="21" cy="24" r="3.5" fill="currentColor" stroke="none" />
    <circle cx="43" cy="24" r="3.5" fill="currentColor" stroke="none" />
    <path d="M 20 38 Q 32 48 44 38" />
  </svg>
);

const NeutralFace = () => (
  <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="32" r="28" />
    <circle cx="21" cy="24" r="3.5" fill="currentColor" stroke="none" />
    <circle cx="43" cy="24" r="3.5" fill="currentColor" stroke="none" />
    <line x1="21" y1="41" x2="43" y2="41" />
  </svg>
);

const SadFace = () => (
  <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="32" r="28" />
    <circle cx="21" cy="24" r="3.5" fill="currentColor" stroke="none" />
    <circle cx="43" cy="24" r="3.5" fill="currentColor" stroke="none" />
    <path d="M 21 44 Q 32 35 43 44" />
  </svg>
);

const VerySadFace = () => (
  <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="32" cy="32" r="28" />
    <circle cx="21" cy="24" r="3.5" fill="currentColor" stroke="none" />
    <circle cx="43" cy="24" r="3.5" fill="currentColor" stroke="none" />
    <path d="M 19 46 C 23 35, 41 35, 45 46" />
  </svg>
);

export default function PlatformFeedbackModal({ orderId, onClose, onSubmitSuccess }) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const emojis = [
    { value: 5, label: t("platformFeedback.veryHappy", "Very Happy"), Icon: VeryHappyFace },
    { value: 4, label: t("platformFeedback.happy", "Happy"), Icon: HappyFace },
    { value: 3, label: t("platformFeedback.neutral", "Neutral"), Icon: NeutralFace },
    { value: 2, label: t("platformFeedback.sad", "Sad"), Icon: SadFace },
    { value: 1, label: t("platformFeedback.verySad", "Very Sad"), Icon: VerySadFace },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg(t("platformFeedback.errorEmptyComment", "Please write a brief comment before submitting."));
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/backend/Apis/buyer/submit_platform_review.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          order_id: orderId,
          rating: rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (onSubmitSuccess) onSubmitSuccess(data.message);
        onClose();
      } else {
        setErrorMsg(data.message || t("platformFeedback.errorSubmit", "Failed to submit review."));
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
      setErrorMsg(t("errors.networkXamppError", "Network error. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="platform-feedback-overlay" onClick={onClose}>
      <div className="platform-feedback-modal" onClick={(e) => e.stopPropagation()}>
        <button className="platform-feedback-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="platform-feedback-header">
          <span className="platform-feedback-badge">🌱 LK Agro Market</span>
          <h2>{t("platformFeedback.title", "How was your experience with LK Agro Market?")}</h2>
          <p>{t("platformFeedback.subtitle", "Congratulations on your order! Please share your feedback about our platform.")}</p>
        </div>

        <form onSubmit={handleSubmit} className="platform-feedback-body">
          {errorMsg && <div className="platform-feedback-error">{errorMsg}</div>}

          {/* EMOJI FACE RATING SELECTOR */}
          <div className="platform-emoji-container">
            {emojis.map(({ value, label, Icon }) => {
              const isSelected = rating === value;
              return (
                <button
                  key={value}
                  type="button"
                  className={`platform-emoji-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    setRating(value);
                    setErrorMsg("");
                  }}
                  title={`${label} (${value} / 5)`}
                >
                  <div className="emoji-icon-wrapper">
                    <Icon />
                  </div>
                  <span className="emoji-label">{label}</span>
                </button>
              );
            })}
          </div>

          {/* COMMENT TEXT AREA */}
          <div className="platform-comment-group">
            <label htmlFor="platform-comment">
              {t("platformFeedback.commentLabel", "Your Feedback / Review")}
            </label>
            <textarea
              id="platform-comment"
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              placeholder={t("platformFeedback.commentPlaceholder", "Tell us what you loved or how we can improve LK Agro Market...")}
              maxLength={500}
            />
            <span className="char-counter">{comment.length}/500</span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="platform-feedback-actions">
            <button type="button" className="platform-skip-btn" onClick={onClose} disabled={submitting}>
              {t("platformFeedback.dismissBtn", "Dismiss")}
            </button>
            <button type="submit" className="platform-submit-btn" disabled={submitting}>
              {submitting ? t("ratings.submitting", "Submitting...") : t("platformFeedback.submitBtn", "Submit Review")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
