import { useRef } from "react";
import { useTranslation } from "react-i18next";

/**
 * A fully translated, custom-styled file input button.
 * Hides the native browser "Choose Files / No file chosen" UI entirely.
 *
 * Props:
 *   onChange(FileList)   — called with the FileList when selection changes
 *   accept               — MIME types string, e.g. "image/jpeg,image/png"
 *   multiple             — allow multiple file selection (boolean)
 *   disabled             — disable the button (boolean)
 *   files                — currently selected File[] array (for display)
 *   id                   — optional id for the hidden input (useful for labels)
 *   className            — extra class on the wrapper div
 */
export default function FileInputButton({
  onChange,
  accept,
  multiple = false,
  disabled = false,
  files = [],
  id,
  className = "",
}) {
  const { t } = useTranslation();
  const inputRef = useRef(null);

  const handleChange = (e) => {
    if (onChange) onChange(e.target.files, e);
  };

  const statusText =
    files.length === 0
      ? t("fileInput.noFileChosen", "No file chosen")
      : files.length === 1
      ? files[0].name
      : t("fileInput.filesSelected", "{{count}} files selected", {
          count: files.length,
        });

  return (
    <div className={`file-input-wrapper ${className}`} style={styles.wrapper}>
      {/* Hidden native input — keeps all browser behaviour (validation, accept, etc.) */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        onClick={(e) => { e.target.value = null; }}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {/* Custom button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current && inputRef.current.click()}
        style={styles.button}
      >
        📎 {t("fileInput.chooseFiles", "Choose Files")}
      </button>

      {/* Status label */}
      <span style={styles.status} title={statusText}>
        {statusText}
      </span>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 14px",
    background: "var(--g-50, #f4f9f4)",
    border: "1px solid var(--g-200, #a8d5b5)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--g-700, #1d7a40)",
    transition: "background 0.15s, border-color 0.15s",
  },
  status: {
    fontSize: "12px",
    color: "var(--t-3, #636e72)",
    maxWidth: "220px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};
