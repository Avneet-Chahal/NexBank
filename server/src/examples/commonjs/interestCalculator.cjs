/**
 * NexBank – CommonJS Module Demonstration (CA-2 Topic 21)
 * 
 * Uses CommonJS module.exports standard.
 * File uses .cjs extension because server/package.json has "type": "module".
 */

/**
 * Calculates compound interest for fixed deposit / savings accounts
 * Formula: A = P * (1 + r/n)^(n*t)
 * 
 * @param {number} principal - Initial deposit (P)
 * @param {number} annualRatePercent - Annual interest rate e.g. 7.5% (r)
 * @param {number} years - Tenure in years (t)
 * @param {number} compoundingFrequency - Times compounded per year (n, default 4 = quarterly)
 * @returns {object} Breakdown of principal, interest earned, and final maturity amount
 */
function calculateCompoundInterest(principal, annualRatePercent, years, compoundingFrequency = 4) {
  if (!principal || principal <= 0) {
    throw new Error("Principal must be a positive number.");
  }
  if (!annualRatePercent || annualRatePercent <= 0) {
    throw new Error("Annual rate must be a positive number.");
  }
  if (!years || years <= 0) {
    throw new Error("Tenure must be at least 1 year.");
  }

  const r = annualRatePercent / 100;
  const n = compoundingFrequency;
  const t = years;

  const maturityAmount = principal * Math.pow(1 + r / n, n * t);
  const totalInterestEarned = maturityAmount - principal;

  return {
    principal: Number(principal.toFixed(2)),
    annualRate: `${annualRatePercent}%`,
    tenureYears: years,
    compoundingFrequency: n === 4 ? "Quarterly (4x/yr)" : `${n}x/year`,
    totalInterestEarned: Number(totalInterestEarned.toFixed(2)),
    maturityAmount: Number(maturityAmount.toFixed(2))
  };
}

/**
 * Helper to format currency for terminal output
 */
function formatCurrency(amount) {
  return "₹" + Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// CommonJS Exports (Topic 21)
module.exports = {
  calculateCompoundInterest,
  formatCurrency
};
