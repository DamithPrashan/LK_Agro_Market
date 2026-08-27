import { useTranslation } from "react-i18next";
import { FiLogOut, FiX } from "react-icons/fi";
import "./LogoutConfirmModal.css";

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay" onClick={onClose}>
      <div 
        className="logout-modal-container" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
      >
        <button 
          className="logout-modal-close" 
          onClick={onClose}
          aria-label={t("logoutModal.cancel", "Cancel")}
        >
          <FiX />
        </button>

        <div className="logout-modal-icon-wrapper">
          <FiLogOut className="logout-modal-icon" />
        </div>

        <h3 id="logout-modal-title" className="logout-modal-title">
          {t("logoutModal.title", "Confirm Logout")}
        </h3>

        <p className="logout-modal-message">
          {t("logoutModal.message", "Are you sure you want to log out of your account?")}
        </p>

        <div className="logout-modal-actions">
          <button 
            type="button" 
            className="logout-modal-btn cancel" 
            onClick={onClose}
          >
            {t("logoutModal.cancel", "Cancel")}
          </button>

          <button 
            type="button" 
            className="logout-modal-btn confirm" 
            onClick={onConfirm}
          >
            {t("logoutModal.confirm", "Logout")}
          </button>
        </div>
      </div>
    </div>
  );
}
