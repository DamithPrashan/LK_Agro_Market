import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft, FaCamera, FaPaperPlane, FaTimes } from "react-icons/fa";
import "./messageThread.css";

export default function MessageThread({
  reservationId,
  currentUserId,
  otherUserName,
  otherUserRole,
  cropName,
  onClose
}) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sending, setSending] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Predefined templates
  const templates = [
    { key: "order_accepted", label: "✅ " + t("template_order_accepted") },
    { key: "produce_ready", label: "📦 " + t("template_produce_ready") },
    { key: "order_cancelled", label: "🚫 " + t("template_order_cancelled") },
    { key: "slight_delay", label: "⏰ " + t("template_slight_delay") },
    { key: "quality_confirmed", label: "🌿 " + t("template_quality_confirmed") },
    { key: "thank_you", label: "🙏 " + t("template_thank_you") }
  ];

  // Farmer-only template
  const farmerTemplate = {
    key: "uploading_evidence",
    label: "📷 " + t("template_uploading_evidence")
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/backend/Apis/get_messages.php?reservation_id=${reservationId}`, {
        credentials: "include"
      });
      const data = await response.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = (behavior = "smooth") => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Mount and Polling
  useEffect(() => {
    fetchMessages();
    // Initial immediate scroll to bottom
    setTimeout(() => scrollToBottom("auto"), 200);

    const interval = setInterval(fetchMessages, 8000); // Poll every 8 seconds
    return () => clearInterval(interval);
  }, [reservationId]);

  // Scroll to bottom when message list changes
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages]);

  // Image Selection Handler
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Clear Selected Image
  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Send Message Request
  const sendMessage = async (payload) => {
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("reservation_id", reservationId);
      formData.append("message_type", payload.message_type);

      if (payload.message_type === "text") {
        formData.append("message_text", payload.message_text);
      } else if (payload.message_type === "template") {
        formData.append("template_key", payload.template_key);
      } else if (payload.message_type === "image") {
        formData.append("image", payload.file);
      }

      const response = await fetch("/backend/Apis/send_message.php", {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.message || "Failed to send message.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Network error sending message.");
    } finally {
      setSending(false);
      fetchMessages();
    }
  };

  // Form Submit Handler
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (sending) return;

    // Send Image first if selected
    if (selectedFile) {
      const fileToSend = selectedFile;
      handleRemoveImage(); // Clear preview immediately
      await sendMessage({ message_type: "image", file: fileToSend });
    }

    // Send Text next if present
    if (textInput.trim()) {
      const textToSend = textInput.trim();
      setTextInput(""); // Clear field immediately
      const textarea = document.querySelector(".text-input");
      if (textarea) {
        textarea.style.height = "auto";
      }
      await sendMessage({ message_type: "text", message_text: textToSend });
    }
  };

  // Template Quick Send
  const handleSendTemplate = async (templateKey) => {
    if (sending) return;
    await sendMessage({ message_type: "template", template_key: templateKey });
  };

  // Format Time Helper
  const formatMsgTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const parts = timeStr.split(" ");
      if (parts.length >= 2) {
        const timeParts = parts[1].split(":");
        return timeParts[0] + ":" + timeParts[1]; // HH:MM
      }
      return timeStr;
    } catch (e) {
      return timeStr;
    }
  };

  const isFarmer = otherUserRole === "farmer" || otherUserRole === "Farmer";

  return (
    <div className="chat-container">
      {/* CHAT HEADER */}
      <div className="chat-header">
        <button className="chat-header-back-btn" onClick={onClose}>
          <FaArrowLeft />
        </button>
        <div className="chat-header-info">
          <h3 className="chat-header-title">
            {otherUserName}
            <span className="chat-role-badge">
              {t(`role.${otherUserRole.toLowerCase()}`, otherUserRole)}
            </span>
          </h3>
          <p className="chat-header-subtitle">
            {t("chat_crop_label")}: <strong>{cropName}</strong> | {t("orders.orderId", { id: reservationId })}
          </p>
        </div>
      </div>

      {/* MESSAGE THREAD */}
      <div className="message-thread" ref={messagesContainerRef}>
        {messages.map((msg) => {
          const isOwn = Number(msg.sender_id) === Number(currentUserId);
          const showSenderName = !isOwn;

          return (
            <div
              key={msg.message_id}
              className={`message-wrapper ${isOwn ? "sent" : "received"}`}
            >
              {showSenderName && (
                <span className="message-sender-name">{msg.sender_name}</span>
              )}
              <div className={`message-bubble ${isOwn ? "bubble-right" : "bubble-left"}`}>
                {msg.message_type === "text" && <span>{msg.message_text}</span>}

                {msg.message_type === "template" && (
                  <span>{t("template_" + msg.template_key, msg.template_key)}</span>
                )}

                {msg.message_type === "image" && (
                  <div className="message-image-container">
                    <img
                      src={msg.image_url}
                      alt="Uploaded Chat Resource"
                      className="image-bubble"
                      onClick={() => setLightboxImage(msg.image_url)}
                    />
                    <span className="image-evidence-label">
                      {msg.sender_role === "farmer"
                        ? t("label_crop_evidence")
                        : t("label_photo")}
                    </span>
                  </div>
                )}
              </div>
              <div className="message-meta">
                <span className="message-time">{formatMsgTime(msg.sent_at)}</span>
                {isOwn && (
                  <span className={`tick-icon ${msg.is_read ? "tick-read" : "tick-sent"}`}>
                    {msg.is_read ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={threadEndRef} />
      </div>

      {/* IMAGE PREVIEW AREA */}
      {previewUrl && (
        <div className="image-preview-container">
          <div className="preview-thumbnail-wrapper">
            <img src={previewUrl} alt="Selection preview" className="preview-thumbnail" />
            <button className="remove-preview-btn" onClick={handleRemoveImage}>
              <FaTimes />
            </button>
          </div>
          <span className="preview-label-text">
            {otherUserRole === "buyer" ? t("label_crop_evidence") : t("label_photo")}
          </span>
        </div>
      )}

      {/* TEMPLATE BUTTONS ROW */}
      <div className="template-row">
        {otherUserRole === "buyer" && ( // Current user is farmer, other user is buyer
          <button
            className="template-btn"
            onClick={() => handleSendTemplate(farmerTemplate.key)}
          >
            {farmerTemplate.label}
          </button>
        )}
        {templates.map((tpl) => (
          <button
            key={tpl.key}
            className="template-btn"
            onClick={() => handleSendTemplate(tpl.key)}
          >
            {tpl.label}
          </button>
        ))}
      </div>

      {/* TEXT INPUT ROW */}
      <form onSubmit={handleSend} className="input-row">
        <button
          type="button"
          className="camera-btn"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <FaCamera />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleImageSelect}
        />

        <textarea
          className="text-input"
          placeholder={t("chat_placeholder")}
          rows={1}
          value={textInput}
          onChange={(e) => {
            setTextInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <button
          type="submit"
          className="send-btn"
          disabled={!textInput.trim() && !selectedFile}
        >
          <FaPaperPlane />
        </button>
      </form>

      {/* FULLSCREEN LIGHTBOX */}
      {lightboxImage && (
        <div className="image-lightbox" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} alt="Fullscreen Chat Evidence" />
        </div>
      )}
    </div>
  );
}
