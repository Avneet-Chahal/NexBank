/**
 * Server-Side Authentication Request Validation Middleware
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates registration input payload (POST /api/auth/register)
 */
export function validateRegisterInput(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error: Registration request body is required.",
        statusCode: 400
      },
      timestamp: new Date().toISOString()
    });
  }

  const errors = [];
  const { fullName, email, password, mobile, accountType } = body;

  // 1. Full Name
  if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 100) {
    errors.push({
      field: "fullName",
      message: "Full Name is required and must be between 2 and 100 characters."
    });
  }

  // 2. Email Address
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.push({
      field: "email",
      message: "A valid email address is required (e.g. customer@nexbank.com)."
    });
  }

  // 3. Password (min 6 characters, >= 1 letter, >= 1 number)
  if (!password || typeof password !== "string") {
    errors.push({
      field: "password",
      message: "Password is required."
    });
  } else {
    if (password.length < 6) {
      errors.push({
        field: "password",
        message: "Password must be at least 6 characters long."
      });
    }
    if (!/[A-Za-z]/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one letter."
      });
    }
    if (!/[0-9]/.test(password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one number."
      });
    }
  }

  // 4. Mobile (optional validation)
  if (mobile !== undefined && mobile !== "") {
    if (typeof mobile !== "string" || !/^[0-9+\s-]{8,15}$/.test(mobile.trim())) {
      errors.push({
        field: "mobile",
        message: "Mobile number must contain valid digits (8-15 characters)."
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error: Registration inputs failed validation.",
        statusCode: 400,
        details: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  req.validatedRegister = {
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    password: password,
    mobile: mobile ? mobile.trim() : "",
    accountType: accountType ? accountType.trim() : "Savings Account"
  };

  next();
}

/**
 * Validates login input payload (POST /api/auth/login)
 */
export function validateLoginInput(req, res, next) {
  const body = req.body;

  if (!body || typeof body !== "object" || Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error: Login request body is required.",
        statusCode: 400
      },
      timestamp: new Date().toISOString()
    });
  }

  const errors = [];
  const { email, password } = body;

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    errors.push({
      field: "email",
      message: "Please enter a valid email address."
    });
  }

  if (!password || typeof password !== "string" || password.trim() === "") {
    errors.push({
      field: "password",
      message: "Password is required."
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: "Validation Error: Login credentials failed validation.",
        statusCode: 400,
        details: errors
      },
      timestamp: new Date().toISOString()
    });
  }

  req.validatedLogin = {
    email: email.trim().toLowerCase(),
    password: password
  };

  next();
}
