import { useState } from "react";

export default function RatingStars({ value = 0, onChange, readOnly = false, size = 24 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display:"flex", gap:3 }} role={readOnly ? undefined : "group"} aria-label="Star rating">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          style={{
            background: "none", border: "none",
            cursor: readOnly ? "default" : "pointer",
            fontSize: size,
            color: n <= (hovered || value) ? "var(--star)" : "var(--s-200)",
            padding: 2, lineHeight: 1, transition: "color .1s",
          }}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}