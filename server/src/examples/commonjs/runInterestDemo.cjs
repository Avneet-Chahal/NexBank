/**
 * NexBank – CommonJS Runner & Verification (CA-2 Topic 21)
 * 
 * Uses require() to load CommonJS module and executes banking calculation.
 */

// CommonJS require (Topic 21)
const { calculateCompoundInterest, formatCurrency } = require("./interestCalculator.cjs");

console.log("=================================================");
console.log(" NexBank CommonJS Module Demonstration (Topic 21)");
console.log("=================================================");

try {
  // Demonstration: Fixed Deposit of ₹1,00,000 at 7.5% for 3 years compounded quarterly
  const principal = 100000;
  const rate = 7.5;
  const tenure = 3;

  const result = calculateCompoundInterest(principal, rate, tenure, 4);

  console.log(`Principal Deposit:     ${formatCurrency(result.principal)}`);
  console.log(`Annual Interest Rate:  ${result.annualRate}`);
  console.log(`Tenure:                ${result.tenureYears} years`);
  console.log(`Compounding:           ${result.compoundingFrequency}`);
  console.log(`Interest Earned:       ${formatCurrency(result.totalInterestEarned)}`);
  console.log(`Maturity Amount:       ${formatCurrency(result.maturityAmount)}`);
  console.log("-------------------------------------------------");
  console.log("CommonJS require() and module.exports execution PASSED.");
  console.log("=================================================");
} catch (err) {
  console.error("CommonJS execution failed:", err.message);
  process.exit(1);
}
