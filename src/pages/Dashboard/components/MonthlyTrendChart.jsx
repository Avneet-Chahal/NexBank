import React, { useState } from "react";
import { formatCurrency } from "../../../services/dashboardService";

/**
 * MonthlyTrendChart Component
 * 
 * Responsive SVG chart visualizing monthly income vs monthly expenses
 * with interactive hover inspections and calculated net savings.
 * 
 * @param {object} props
 * @param {Array<object>} props.data - Monthly aggregates from calculateMonthlyTrends
 */
export function MonthlyTrendChart({ data = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <p>Insufficient transaction history to plot monthly trends.</p>
      </div>
    );
  }

  // Calculate maximum value to scale chart height
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    10000
  );

  const chartHeight = 160;
  const barWidth = 22;
  const groupSpacing = 72;
  const totalWidth = Math.max(340, data.length * groupSpacing + 40);

  return (
    <div className="analytics-card">
      <div className="analytics-card__header">
        <div>
          <h3 className="analytics-card__title">Income &amp; Spending Trends</h3>
          <p className="analytics-card__subtitle">Monthly comparative cashflow</p>
        </div>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot legend-dot--income" /> Income
          </span>
          <span className="legend-item">
            <span className="legend-dot legend-dot--expense" /> Expense
          </span>
        </div>
      </div>

      <div className="chart-container" style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${totalWidth} ${chartHeight + 40}`}
          className="trend-chart-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Monthly income and expense comparison chart"
        >
          {/* Subtle grid lines */}
          <line x1="20" y1="20" x2={totalWidth - 20} y2="20" stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
          <line x1="20" y1={chartHeight / 2} x2={totalWidth - 20} y2={chartHeight / 2} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
          <line x1="20" y1={chartHeight} x2={totalWidth - 20} y2={chartHeight} stroke="#334155" opacity="0.6" />

          {/* Render bars for each month */}
          {data.map((item, idx) => {
            const groupX = 30 + idx * groupSpacing;
            const incomeHeight = Math.max(4, Math.round((item.income / maxVal) * (chartHeight - 30)));
            const expenseHeight = Math.max(4, Math.round((item.expense / maxVal) * (chartHeight - 30)));

            const incomeY = chartHeight - incomeHeight;
            const expenseY = chartHeight - expenseHeight;

            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={item.monthKey}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Background hover highlight column */}
                {isHovered && (
                  <rect
                    x={groupX - 6}
                    y="10"
                    width={barWidth * 2 + 16}
                    height={chartHeight + 25}
                    rx="6"
                    fill="rgba(59, 130, 246, 0.08)"
                  />
                )}

                {/* Income Bar (Emerald/Green gradient) */}
                <rect
                  x={groupX}
                  y={incomeY}
                  width={barWidth}
                  height={incomeHeight}
                  rx="4"
                  fill={isHovered ? "#34D399" : "#10B981"}
                  className="chart-bar-anim"
                />

                {/* Expense Bar (Rose/Red) */}
                <rect
                  x={groupX + barWidth + 4}
                  y={expenseY}
                  width={barWidth}
                  height={expenseHeight}
                  rx="4"
                  fill={isHovered ? "#F87171" : "#EF4444"}
                  className="chart-bar-anim"
                />

                {/* Month Label */}
                <text
                  x={groupX + barWidth + 2}
                  y={chartHeight + 22}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="11"
                  fontWeight="600"
                >
                  {item.monthLabel.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover inspection tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="chart-tooltip-floating">
            <div className="chart-tooltip-month">{data[hoveredIndex].monthLabel}</div>
            <div className="chart-tooltip-row text-success">
              <span>Income:</span>
              <strong>{formatCurrency(data[hoveredIndex].income)}</strong>
            </div>
            <div className="chart-tooltip-row text-error">
              <span>Expenses:</span>
              <strong>{formatCurrency(data[hoveredIndex].expense)}</strong>
            </div>
            <div className="chart-tooltip-divider" />
            <div className="chart-tooltip-row text-primary">
              <span>Net Saved:</span>
              <strong>{formatCurrency(data[hoveredIndex].net)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MonthlyTrendChart;
