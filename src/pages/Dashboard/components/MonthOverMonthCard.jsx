import React from "react";

/**
 * MonthOverMonthCard Component
 * 
 * Provides automated analytical month-over-month comparisons
 * for spending, income, and savings retention.
 * 
 * @param {object} props
 * @param {object} props.comparison - MoM metrics from calculateMonthlyTrends
 */
export function MonthOverMonthCard({ comparison }) {
  const {
    hasComparison = false,
    currentMonth = "",
    previousMonth = "",
    expenseChangePercent = 0,
    incomeChangePercent = 0,
    savingsChangePercent = 0,
    increasedSpending = false
  } = comparison || {};

  return (
    <div className="mom-card">
      <div className="mom-card__header">
        <div>
          <span className="mom-card__eyebrow">MoM PERFORMANCE</span>
          <h4 className="mom-card__title">
            {hasComparison ? `${currentMonth} vs. ${previousMonth}` : "Period Health Snapshot"}
          </h4>
        </div>
        <div className={`mom-card__badge ${increasedSpending ? "mom-card__badge--warning" : "mom-card__badge--positive"}`}>
          {hasComparison ? (increasedSpending ? "Higher Outflow" : "Optimized Outflow") : "Baseline Period"}
        </div>
      </div>

      <div className="mom-metrics-grid">
        {/* Spending change */}
        <div className="mom-metric-item">
          <span className="mom-metric-label">Spending Flow</span>
          <div className="mom-metric-val-wrap">
            <span className={`mom-metric-val ${increasedSpending ? "text-error" : "text-success"}`}>
              {hasComparison ? `${expenseChangePercent > 0 ? "+" : ""}${expenseChangePercent}%` : "In Balance"}
            </span>
            <span className="mom-metric-sub">
              {hasComparison ? (increasedSpending ? "vs last month" : "reduced outflow") : "Current period"}
            </span>
          </div>
        </div>

        {/* Income change */}
        <div className="mom-metric-item">
          <span className="mom-metric-label">Inflow Growth</span>
          <div className="mom-metric-val-wrap">
            <span className={`mom-metric-val ${incomeChangePercent >= 0 ? "text-success" : "text-error"}`}>
              {hasComparison ? `${incomeChangePercent >= 0 ? "+" : ""}${incomeChangePercent}%` : "+100% Active"}
            </span>
            <span className="mom-metric-sub">
              {hasComparison ? "payroll & credits" : "Verified credits"}
            </span>
          </div>
        </div>

        {/* Savings retention */}
        <div className="mom-metric-item">
          <span className="mom-metric-label">Net Retention</span>
          <div className="mom-metric-val-wrap">
            <span className="mom-metric-val text-primary">
              {hasComparison ? `${savingsChangePercent >= 0 ? "+" : ""}${savingsChangePercent}%` : "Stable"}
            </span>
            <span className="mom-metric-sub">
              {hasComparison ? "capital retained" : "Healthy margin"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthOverMonthCard;
