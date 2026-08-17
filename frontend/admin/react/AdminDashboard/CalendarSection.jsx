import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import Calendar from "react-calendar";

import {
  FiCheckCircle,
  FiAlertTriangle,
  FiUserCheck,
  FiUserX,
  FiTrash2,
  FiInfo,
  FiEdit3,
  FiPlus,
  FiX,
  FiSave,
} from "react-icons/fi";

import "../../csss/AdminDashboard/admin.css";

export default function CalendarSection({
  activities = [],
  onRefresh,
}) {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [today, setToday] = useState(() => new Date());

  /* =========================================
     NOTE MODAL
  ========================================= */

  const [showNoteModal, setShowNoteModal] = useState(false);

  const [editingNote, setEditingNote] = useState(null);

  const [noteTitle, setNoteTitle] = useState("");

  const [noteDescription, setNoteDescription] = useState("");

  const [noteTime, setNoteTime] = useState("09:00");

  const [noteSaving, setNoteSaving] = useState(false);

  const [noteError, setNoteError] = useState("");

  /* =========================================
     FORMAT DATE TO YYYY-MM-DD
  ========================================= */

  const formatDateKey = (date) => {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const selectedDateKey = formatDateKey(selectedDate);

  const todayKey = formatDateKey(today);

  /* =========================================
     KEEP TODAY CURRENT WHILE PAGE IS OPEN
  ========================================= */

  useEffect(() => {
    let midnightTimer;

    const refreshToday = () => {
      const now = new Date();
      const nextMidnight = new Date(now);

      setToday(now);

      nextMidnight.setHours(24, 0, 0, 0);

      midnightTimer = window.setTimeout(
        refreshToday,
        nextMidnight.getTime() - now.getTime() + 100,
      );
    };

    refreshToday();

    return () => window.clearTimeout(midnightTimer);
  }, []);

  /* =========================================
     ACTIVITIES FOR SELECTED DATE
  ========================================= */

  const selectedActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (!activity.date) {
        return false;
      }

      return activity.date.substring(0, 10) === selectedDateKey;
    });
  }, [activities, selectedDateKey]);

  /* =========================================
     ACTIVITY ICON
  ========================================= */

  const getActivityIcon = (type) => {
    switch (type) {
      case "farmer_verified":
        return <FiUserCheck />;

      case "farmer_rejected":
        return <FiUserX />;

      case "complaint_resolved":
        return <FiCheckCircle />;

      case "complaint_dismissed":
        return <FiAlertTriangle />;

      case "user_removed":
        return <FiTrash2 />;

      case "warning_issued":
        return <FiAlertTriangle />;

      case "manual_note":
        return <FiEdit3 />;

      default:
        return <FiInfo />;
    }
  };

  /* =========================================
     ACTIVITY STYLE
  ========================================= */

  const getActivityClass = (type) => {
    switch (type) {
      case "farmer_verified":
      case "complaint_resolved":
        return "approved";

      case "farmer_rejected":
      case "complaint_dismissed":
      case "user_removed":
        return "danger";

      case "warning_issued":
        return "warning";

      case "manual_note":
        return "note";

      default:
        return "info";
    }
  };

  /* =========================================
     FORMAT TIME
  ========================================= */

  const formatTime = (dateString) => {
    if (!dateString) {
      return "";
    }

    const parts = dateString.split(" ");

    if (parts.length < 2) {
      return "";
    }

    const [hour, minute] = parts[1].split(":");

    const timeDate = new Date();

    timeDate.setHours(Number(hour), Number(minute), 0);

    return timeDate.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* =========================================
     SELECTED DATE TITLE
  ========================================= */

  const dateLocale = i18n.language === "si" ? "si-LK" : i18n.language === "ta" ? "ta-LK" : "en-US";
  const formattedSelectedDate = selectedDate.toLocaleDateString(dateLocale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  /* =========================================
     OPEN ADD NOTE
  ========================================= */

  const handleOpenAddNote = () => {
    setEditingNote(null);

    setNoteTitle("");

    setNoteDescription("");

    setNoteTime("09:00");

    setNoteError("");

    setShowNoteModal(true);
  };

  /* =========================================
     OPEN EDIT NOTE
  ========================================= */

  const handleOpenEditNote = (activity) => {
    setEditingNote(activity);

    setNoteTitle(activity.title ?? "");

    setNoteDescription(activity.description ?? "");

    if (activity.date) {
      const timePart = activity.date.split(" ")[1]?.substring(0, 5);

      setNoteTime(timePart || "09:00");
    } else {
      setNoteTime("09:00");
    }

    setNoteError("");

    setShowNoteModal(true);
  };

  /* =========================================
     CLOSE NOTE MODAL
  ========================================= */

  const handleCloseNoteModal = () => {
    if (noteSaving) {
      return;
    }

    setShowNoteModal(false);

    setEditingNote(null);

    setNoteError("");
  };

  /* =========================================
     REFRESH PARENT DATA
  ========================================= */

  const refreshActivities = async () => {
    if (typeof onRefresh === "function") {
      await onRefresh();
    }
  };

  /* =========================================
     ADD / UPDATE NOTE
  ========================================= */

  const handleSaveNote = async (event) => {
    event.preventDefault();

    if (!noteTitle.trim()) {
      setNoteError(t("admin.calendar.noteTitleRequired"));

      return;
    }

    try {
      setNoteSaving(true);

      setNoteError("");

      const formData = new FormData();

      formData.append("title", noteTitle.trim());

      formData.append("description", noteDescription.trim());

      formData.append("date", selectedDateKey);

      formData.append("time", noteTime || "09:00");

      let endpoint = "/backend/Apis/admin/calendar/addAdminNote.php";

      if (editingNote) {
        endpoint = "/backend/Apis/admin/calendar/updateAdminNote.php";

        formData.append("activity_id", editingNote.id);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(t("admin.calendar.saveFailed", { defaultValue: data.message }));
      }

      setShowNoteModal(false);

      setEditingNote(null);

      setNoteTitle("");

      setNoteDescription("");

      setNoteTime("09:00");

      await refreshActivities();
    } catch (error) {
      console.error("Save admin note error:", error);

      setNoteError(error.message || t("admin.calendar.saveFailed"));
    } finally {
      setNoteSaving(false);
    }
  };

  /* =========================================
     DELETE NOTE
  ========================================= */

  const handleDeleteNote = async (activity) => {
    const confirmed = window.confirm(t("admin.calendar.deleteConfirm", { title: activity.title }));

    if (!confirmed) {
      return;
    }

    try {
      const formData = new FormData();

      formData.append("activity_id", activity.id);

      const response = await fetch(
        "/backend/Apis/admin/calendar/deleteAdminNote.php",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(t("admin.calendar.deleteFailed", { defaultValue: data.message }));
      }

      await refreshActivities();
    } catch (error) {
      console.error("Delete admin note error:", error);

      alert(error.message || t("admin.calendar.deleteFailed"));
    }
  };

  return (
    <section className="admin-panel admin-schedule-panel">
      {/* =====================================
          CALENDAR
      ===================================== */}

      <div className="admin-calendar-side">
        <h2>{t("admin.calendar.schedule")}</h2>

        <div className="admin-calendar-wrapper">
          <Calendar
            value={selectedDate}
            onChange={(date) => {
              setSelectedDate(date);
            }}
            prev2Label={null}
            next2Label={null}
            tileContent={({ date, view }) => {
              if (view !== "month") {
                return null;
              }

              const dateKey = formatDateKey(date);

              const isToday = dateKey === todayKey;

              const isSelected = dateKey === selectedDateKey;

              /*
               * Selected date:
               * no dot
               */
              if (isSelected) {
                return null;
              }

              /*
               * The dot represents only today's real date.
               */
              if (isToday) {
                return <span className="admin-calendar-activity-dot" />;
              }

              return null;
            }}
          />
        </div>
      </div>

      {/* =====================================
          ACTIVITY SIDE
      ===================================== */}

      <div className="admin-activity-side">
        {/* HEADER */}

        <div className="admin-activity-header">
          <div>
            <h2>{t("admin.calendar.adminActivity")}</h2>

            <p>{formattedSelectedDate}</p>
          </div>

          <div className="admin-activity-header-actions">
            <span className="admin-activity-count">
              {selectedActivities.length}{" "}
              {t("admin.calendar.activityCount", { count: selectedActivities.length })}
            </span>

            <button
              type="button"
              className="admin-add-note-btn"
              onClick={handleOpenAddNote}
            >
              <FiPlus />
              {t("admin.calendar.addNote")}
            </button>
          </div>
        </div>

        {/* =================================
            ACTIVITY LIST
        ================================= */}

        <div className="admin-activity-list">
          {selectedActivities.length > 0 ? (
            selectedActivities.map((activity) => (
              <article className="admin-activity-item" key={activity.id}>
                {/* ICON */}

                <div
                  className={`admin-activity-icon ${getActivityClass(
                    activity.type,
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                </div>

                {/* CONTENT */}

                <div className="admin-activity-content">
                  <h3>{activity.type === "manual_note" ? activity.title : t(`admin.calendar.activities.${activity.type}`, { defaultValue: activity.title })}</h3>

                  <p>{activity.description}</p>
                </div>

                {/* RIGHT */}

                <div className="admin-activity-right">
                  <time className="admin-activity-time">
                    {formatTime(activity.date)}
                  </time>

                  {activity.type === "manual_note" && (
                    <div className="admin-note-actions">
                      {/* EDIT */}

                      <button
                        type="button"
                        title={t("admin.calendar.editNote")}
                        className="admin-note-edit-btn"
                        onClick={() => handleOpenEditNote(activity)}
                      >
                        <FiEdit3 />
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        title={t("admin.calendar.deleteNote")}
                        className="admin-note-delete-btn"
                        onClick={() => handleDeleteNote(activity)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))
          ) : (
            <div className="admin-activity-empty">
              <FiInfo />

              <h3>{t("admin.calendar.noActivity")}</h3>

              <p>{t("admin.calendar.noActivityDescription")}</p>
            </div>
          )}
        </div>
      </div>

      {/* =====================================
          ADD / EDIT NOTE MODAL
      ===================================== */}

      {showNoteModal && (
        <div className="admin-note-modal-backdrop">
          <div className="admin-note-modal">
            {/* MODAL HEADER */}

            <div className="admin-note-modal-header">
              <div>
                <h2>{editingNote ? t("admin.calendar.editNote") : t("admin.calendar.addNote")}</h2>

                <p>{formattedSelectedDate}</p>
              </div>

              <button
                type="button"
                className="admin-note-close-btn"
                onClick={handleCloseNoteModal}
              >
                <FiX />
              </button>
            </div>

            {/* FORM */}

            <form onSubmit={handleSaveNote}>
              {/* TITLE */}

              <div className="admin-note-field">
                <label>{t("admin.calendar.title")}</label>

                <input
                  type="text"
                  value={noteTitle}
                  maxLength={150}
                  placeholder={t("admin.calendar.titlePlaceholder")}
                  onChange={(event) => setNoteTitle(event.target.value)}
                />
              </div>

              {/* DESCRIPTION */}

              <div className="admin-note-field">
                <label>{t("admin.calendar.description")}</label>

                <textarea
                  value={noteDescription}
                  maxLength={255}
                  rows={4}
                  placeholder={t("admin.calendar.descriptionPlaceholder")}
                  onChange={(event) => setNoteDescription(event.target.value)}
                />
              </div>

              {/* DATE + TIME */}

              <div className="admin-note-date-row">
                {/* DATE */}

                <div className="admin-note-field">
                  <label>{t("admin.calendar.date")}</label>

                  <input type="date" value={selectedDateKey} readOnly />
                </div>

                {/* TIME */}

                <div className="admin-note-field">
                  <label>{t("admin.calendar.time")}</label>

                  <input
                    type="time"
                    value={noteTime}
                    onChange={(event) => setNoteTime(event.target.value)}
                  />
                </div>
              </div>

              {/* ERROR */}

              {noteError && <p className="admin-note-error">{noteError}</p>}

              {/* MODAL FOOTER */}

              <div className="admin-note-modal-footer">
                {/* CANCEL */}

                <button
                  type="button"
                  className="admin-note-cancel-btn"
                  onClick={handleCloseNoteModal}
                  disabled={noteSaving}
                >
                  {t("admin.common.cancel")}
                </button>

                {/* SAVE / UPDATE */}

                <button
                  type="submit"
                  className="admin-note-save-btn"
                  disabled={noteSaving}
                >
                  <FiSave />

                  {noteSaving
                    ? t("admin.calendar.saving")
                    : editingNote
                      ? t("admin.calendar.updateNote")
                      : t("admin.calendar.saveNote")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
