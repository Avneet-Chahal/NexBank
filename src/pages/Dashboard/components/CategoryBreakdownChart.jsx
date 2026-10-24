import React, { useState } from "react";
import { formatCurrency } from "../../../services/dashboardService";

/**
 * CategoryBreakdownChart Component
 * 
 * Interactive SVG donut chart and category table detailing expenses by category.
 * 
 * @param {object} props
 * @param {Array<object>} props.categories - Categorized expenses from calculateCategoryBreakdown
 */
export function CategoryBreakdownChart({ categories = [] }) {
  const [activeCategory, setActiveCategory] = useState(null);

  if (!categories || categories.length === 0) {
    return (
      <div className="analytics-card">
        <h3 className="analytics-card__title">Category Spending</h3>
        <p className="analytics-card__subtitle">Expense breakdown by sector</p>
        <div className="chart-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="32" height="32">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <p>No expense transactions recorded yet.</p>
        </div>
      </div>
    );
  }

  const totalExpense = categories.reduce((sum, c) => sum + c.total, 0);

  // SVG Donut calculation
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  return (
    <div className="analytics-card">
      <div className="analytics-card__header">
        <div>
          <h3 className="analytics-card__title">Category Breakdown</h3>
          <p className="analytics-card__subtitle">Expenses by spending category</p>
        </div>
        <span className="analytics-card__total-tag">
          {formatCurrency(totalExpense)}
        </span>
      </div>

      <div className="category-chart-layout">
        {/* SVG Donut */}
        <div className="donut-wrapper">
          <svg
            viewBox="0 0 140 140"
            className="donut-svg"
            role="img"
            aria-label="Category expense donut chart"
          >
            {/* Background Track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="16"
            />

            {/* Slices */}
            {categories.map((cat) => {
              const sliceLength = (cat.percentage / 100) * circumference;
              const strokeDasharray = `${sliceLength} ${circumference - sliceLength}`;
              const strokeDashoffset = -accumulatedOffset;
              accumulatedOffset += sliceLength;

              const isHighlighted = activeCategory === cat.category;

              return (
                <circle
                  key={cat.category}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="transparent"
                  stroke={cat.color}
                  strokeWidth={isHighlighted ? "20" : "16"}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="donut-slice"
                  onMouseEnter={() => setActiveCategory(cat.category)}
                  onMouseLeave={() => setActiveCategory(null)}
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                    cursor: "pointer",
                    transition: "stroke-width 200ms ease, opacity 200ms ease",
                    opacity: activeCategory && !isHighlighted ? 0.45 : 1
                  }}
                />
              );
            })}
          </svg>

          {/* Center info */}
          <div className="donut-center-info">
            <span className="donut-center-count">{categories.length}</span>
            <span className="donut-center-label">Sectors</span>
          </div>
        </div>

        {/* Categories Legend & Breakdown List */}
        <div className="category-items-list">
          {categories.slice(0, 5).map((cat) => {
            const isHighlighted = activeCategory === cat.category;

            return (
              <div
                key={cat.category}
                className={`category-item-row ${isHighlighted ? "category-item-row--active" : ""}`}
                onMouseEnter={() => setActiveCategory(cat.category)}
                onMouseLeave={() => setActiveCategory(null)}
              >
                <div className="category-item-info">
                  <span
                    className="category-color-pip"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="category-item-name">{cat.category}</span>
                </div>

                <div className="category-item-stats">
                  <span className="category-item-pct">{cat.percentage}%</span>
                  <span className="category-item-amount">{formatCurrency(cat.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CategoryBreakdownChart;
