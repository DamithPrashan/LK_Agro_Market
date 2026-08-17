import React from "react";

import { FiArrowUp } from "react-icons/fi";

export default function StatCard({
  title,
  value,
  icon,
  iconType,
  footer,
  positive = false,
}) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-card-top">
        <span className="admin-stat-label">
          {title}
        </span>

        <div
          className={`admin-stat-icon ${iconType}`}
        >
          {icon}
        </div>
      </div>

      <div className="admin-stat-card-bottom">
        <strong className="admin-stat-value">
          {value}
        </strong>

        <span
          className={`admin-stat-footer ${
            positive ? "positive" : ""
          }`}
        >
          {positive && <FiArrowUp />}

          {footer}
        </span>
      </div>
    </article>
  );
}