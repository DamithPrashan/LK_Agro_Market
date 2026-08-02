import React from "react";
import MessageThread from "./MessageThread";
import { FaTimes } from "react-icons/fa";
import "./messageThread.css";

export default function MessageModal({
  isOpen,
  onClose,
  reservationId,
  currentUserId,
  otherUserName,
  otherUserRole,
  cropName
}) {
  if (!isOpen) return null;

  // Handle overlay click to close (optional, but good practice)
  const handleOverlayClick = (e) => {
    if (e.target.className === "message-modal-overlay") {
      onClose();
    }
  };

  return (
    <div className="message-modal-overlay" onClick={handleOverlayClick}>
      <div className="message-modal-content">
        {/* Top-right close button (primarily for desktop view) */}
        <button 
          onClick={onClose} 
          style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            background: "none",
            border: "none",
            color: "#ffffff",
            fontSize: "18px",
            cursor: "pointer",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px",
            borderRadius: "50%",
            transition: "background-color 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          title="Close Chat"
        >
          <FaTimes />
        </button>

        <MessageThread
          reservationId={reservationId}
          currentUserId={currentUserId}
          otherUserName={otherUserName}
          otherUserRole={otherUserRole}
          cropName={cropName}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
