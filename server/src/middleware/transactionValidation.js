/**
 * Transaction Request Validation Middleware
 * 
 * Enforces strict validation rules:
 * - Validates required fields and data types
 * - Prevents invalid amounts (<= 0, NaN, non-finite, extreme values)
 * - Prevents malformed identifiers
 * - Blocks attempts to tamper with core balances or immutable IDs
 */

/**
 * Validates transaction ID parameter in URL (:id)
 */
export function validateTransactionId(req, res, next) {
  const { id } = req.params;

  if (!id || typeof id !== "string" || id.trim() === "") {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error: Transaction identifier is required.",
        statusCode: 400,
        field: "id"
      },
      timestamp: new Date().toISOString()
    });
  }

  const cleanId = id.trim();

  // Pattern: Must start with TX- (2 to 20 chars) or be a 24-character hexadecimal MongoDB ObjectId
  const idPattern = /^(TX-[A-Za-z0-9_-]{2,20}|[0-9a-fA-F]{24})$/;

  if (!idPattern.test(cleanId)) {
    return res.status(400).json({
      success: false,
      error: {
        message: `Validation Error: Malformed transaction identifier '${id}'. Expected format e.g. 'TX-901' or 24-character hex ObjectId.`,
        statusCode: 400,
        field: "id"
      },
      timestamp: new Date().toISOString()
    });
  }

  req.validatedId = cleanId;
  next();
}

/**
 * Validates request payload for creating a new transaction (POST)
 */
export function validateTransactionCreate(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error: Request body is missing or empty.",
        statusCode: 400
      },
      timestamp: new Date().toISOString()
    });
  }

  const errors = [];
  const { title, category, type, amount, date } = body;

  // 1. Block prohibited fields (users cannot modify arbitrary balances or assign their own user/account IDs)
  const prohibitedFields = ["balance", "accountBalance", "userId", "id", "accountNumber"];
  for (const field of prohibitedFields) {
    if (body[field] !== undefined) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Security Error: Field '${field}' cannot be provided or altered.`,
          statusCode: 400,
          field
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // 2. Validate Title
  if (!title || typeof title !== "string" || title.trim().length < 2 || title.trim().length > 100) {
    errors.push({
      field: "title",
      message: "Title is required and must be between 2 and 100 characters."
    });
  }

  // 3. Validate Category
  if (!category || typeof category !== "string" || category.trim().length < 2 || category.trim().length > 50) {
    errors.push({
      field: "category",
      message: "Category is required and must be between 2 and 50 characters."
    });
  }

  // 4. Validate Type ('income' or 'expense')
  const validTypes = ["income", "expense"];
  if (!type || typeof type !== "string" || !validTypes.includes(type.trim().toLowerCase())) {
    errors.push({
      field: "type",
      message: "Transaction type is required and must be either 'income' or 'expense'."
    });
  }

  // 5. Validate Amount
  const parsedAmount = Number(amount);
  if (
    amount === undefined ||
    amount === null ||
    typeof amount === "boolean" ||
    isNaN(parsedAmount) ||
    !Number.isFinite(parsedAmount) ||
    parsedAmount <= 0
  ) {
    errors.push({
      field: "amount",
      message: "Amount is required and must be a positive number greater than 0."
    });
  } else if (parsedAmount > 10000000) {
    errors.push({
      field: "amount",
      message: "Amount exceeds maximum transaction threshold limit of ₹10,000,000."
    });
  }

  // 6. Optional Date validation if provided
  if (date !== undefined) {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.push({
        field: "date",
        message: "Date must be a valid ISO format string (e.g. YYYY-MM-DD)."
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error: One or more fields failed validation.",
        statusCode: 400,
        details: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  req.validatedBody = {
    title: title.trim(),
    category: category.trim(),
    type: type.trim().toLowerCase(),
    amount: parsedAmount,
    date: date ? new Date(date).toISOString().slice(0, 10) : undefined
  };

  next();
}

/**
 * Validates request payload for updating an existing transaction (PUT / PATCH)
 */
export function validateTransactionUpdate(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error: Update payload cannot be empty.",
        statusCode: 400
      },
      timestamp: new Date().toISOString()
    });
  }

  // Block prohibited fields
  const prohibitedFields = ["balance", "accountBalance", "userId", "id", "accountNumber"];
  for (const field of prohibitedFields) {
    if (body[field] !== undefined) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Security Error: Field '${field}' is immutable and cannot be updated.`,
          statusCode: 400,
          field
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  const errors = [];
  const { title, category, type, amount, status } = body;

  if (title !== undefined && (typeof title !== "string" || title.trim().length < 2 || title.trim().length > 100)) {
    errors.push({
      field: "title",
      message: "Title must be a string between 2 and 100 characters."
    });
  }

  if (category !== undefined && (typeof category !== "string" || category.trim().length < 2 || category.trim().length > 50)) {
    errors.push({
      field: "category",
      message: "Category must be a string between 2 and 50 characters."
    });
  }

  if (type !== undefined) {
    const validTypes = ["income", "expense"];
    if (typeof type !== "string" || !validTypes.includes(type.trim().toLowerCase())) {
      errors.push({
        field: "type",
        message: "Transaction type must be either 'income' or 'expense'."
      });
    }
  }

  if (amount !== undefined) {
    const parsedAmount = Number(amount);
    if (typeof amount === "boolean" || isNaN(parsedAmount) || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      errors.push({
        field: "amount",
        message: "Amount must be a positive number greater than 0."
      });
    } else if (parsedAmount > 10000000) {
      errors.push({
        field: "amount",
        message: "Amount exceeds maximum threshold limit of ₹10,000,000."
      });
    }
  }

  if (status !== undefined) {
    const validStatuses = ["Completed", "Pending", "Cancelled"];
    if (typeof status !== "string" || !validStatuses.includes(status.trim())) {
      errors.push({
        field: "status",
        message: "Status must be one of: 'Completed', 'Pending', 'Cancelled'."
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error: Update payload contains invalid fields.",
        statusCode: 400,
        details: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
}
