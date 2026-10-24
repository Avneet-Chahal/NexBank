/**
 * NexBank – Promise Chaining Demonstration (CA-2 Topic 4)
 * 
 * Demonstrates explicit Promise chaining using:
 * promise.then(...).then(...).catch(...)
 * 
 * Uses genuine banking transaction auditing logic without artificial delays.
 */

/**
 * Step 1: Validates incoming transaction data
 * @param {object} txData
 * @returns {Promise<object>}
 */
export function validateAuditPayload(txData) {
  return new Promise((resolve, reject) => {
    if (!txData || typeof txData !== "object") {
      return reject(new Error("Validation Failure: Transaction payload is required."));
    }
    if (!txData.amount || typeof txData.amount !== "number" || txData.amount <= 0) {
      return reject(new Error("Validation Failure: Valid positive transaction amount is required."));
    }
    if (!txData.type || !["income", "expense"].includes(txData.type.toLowerCase())) {
      return reject(new Error("Validation Failure: Transaction type must be 'income' or 'expense'."));
    }

    resolve({
      ...txData,
      type: txData.type.toLowerCase(),
      amount: Number(txData.amount.toFixed(2))
    });
  });
}

/**
 * Step 2: Enriches transaction with banking fees and compliance surcharge
 * @param {object} validatedTx
 * @returns {Promise<object>}
 */
export function enrichWithRegulatoryFees(validatedTx) {
  return new Promise((resolve) => {
    // Standard regulatory 0.1% audit ledger fee (capped at 50)
    const auditFee = validatedTx.type === "expense"
      ? Math.min(Number((validatedTx.amount * 0.001).toFixed(2)), 50.0)
      : 0.0;

    const netSettlement = validatedTx.type === "expense"
      ? Number((validatedTx.amount + auditFee).toFixed(2))
      : validatedTx.amount;

    resolve({
      ...validatedTx,
      auditFee,
      netSettlement,
      complianceStatus: "VERIFIED_AML_CLEARED"
    });
  });
}

/**
 * Step 3: Formats audit receipt
 * @param {object} enrichedTx
 * @returns {object}
 */
export function generateAuditReceipt(enrichedTx) {
  const auditId = `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  return {
    receiptId: auditId,
    transaction: enrichedTx,
    certifiedTimestamp: new Date().toISOString(),
    isCompliant: true
  };
}

/**
 * Main Pipeline Function demonstrating explicit .then().then().catch() chaining
 * 
 * @param {object} transactionData
 * @returns {Promise<{ success: boolean, receipt?: object, error?: string }>}
 */
export function processTransactionAuditPipeline(transactionData) {
  // Explicit Promise Chaining (Topic 4)
  return validateAuditPayload(transactionData)
    .then((validatedTx) => {
      // First .then(): Asynchronous enrichment
      return enrichWithRegulatoryFees(validatedTx);
    })
    .then((enrichedTx) => {
      // Second .then(): Transform into official audit receipt
      const receipt = generateAuditReceipt(enrichedTx);
      return {
        success: true,
        receipt
      };
    })
    .catch((error) => {
      // .catch(): Centralized promise rejection handler
      return {
        success: false,
        error: error.message || "Audit pipeline failed"
      };
    });
}
