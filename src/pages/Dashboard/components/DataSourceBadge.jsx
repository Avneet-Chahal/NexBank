import React from "react";

/**
 * DataSourceBadge Component
 * 
 * Clearly communicates to students, evaluators, and recruiters whether
 * the live backend or the resilient in-memory fallback dataset is currently powering the view.
 * 
 * @param {object} props
 * @param {string} props.source - Data source identifier
 */
export function DataSourceBadge({ source = "Local Demo Fallback" }) {
  const isAtlas = source.toLowerCase().includes("atlas");
  const isBackend = source.toLowerCase().includes("backend") || isAtlas;

  return (
    <div
      className={`data-source-badge ${isBackend ? "data-source-badge--live" : "data-source-badge--demo"}`}
      title={
        isBackend
          ? "Connected to live Node.js Express Banking Server"
          : "Operating in resilient offline demo mode with local seed dataset"
      }
    >
      <span className="data-source-badge__pulse" />
      <span className="data-source-badge__label">
        {isAtlas
          ? "MongoDB Atlas Connected"
          : isBackend
          ? "Express API (In-Memory)"
          : "Academic Demo Dataset"}
      </span>
      <span className="data-source-badge__tag">DEMO</span>
    </div>
  );
}

export default DataSourceBadge;
