/**
 * NexBank – Form Validation Module
 */

/**
 * Validates an email string
 * 
 * @param {string} email - Email input to test
 * @returns {{ isValid: boolean, message: string }} Validation result object
 */
export function validateEmail(email) {
  // Variable declarations and type checking
  if (typeof email !== "string" || email.trim() === "") {
    return {
      isValid: false,
      message: "Email address is required."
    };
  }

  const cleanEmail = email.trim();

  // Basic RFC-compliant standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Logical NOT and regex test
  if (!emailRegex.test(cleanEmail)) {
    return {
      isValid: false,
      message: "Please enter a valid email address (e.g., demo@nexbank.com)."
    };
  }

  return {
    isValid: true,
    message: ""
  };
}

/**
 * Validates a password string using structured rules and a loop
 * 
 * @param {string} password - Password input to test
 * @returns {{ isValid: boolean, message: string }} Validation result object
 */
export function validatePassword(password) {
  if (typeof password !== "string" || password === "") {
    return {
      isValid: false,
      message: "Password is required."
    };
  }

  // Array of validation rule objects iterated with a loop
  const passwordRules = [
    {
      test: (pwd) => pwd.length >= 6,
      errorMsg: "Password must be at least 6 characters long."
    },
    {
      test: (pwd) => /[A-Za-z]/.test(pwd),
      errorMsg: "Password must contain at least one letter."
    },
    {
      test: (pwd) => /[0-9]/.test(pwd),
      errorMsg: "Password must contain at least one number."
    }
  ];

  // Natural loop 
  for (const rule of passwordRules) {
    const passed = rule.test(password);
    if (!passed) {
      return {
        isValid: false,
        message: rule.errorMsg
      };
    }
  }

  return {
    isValid: true,
    message: ""
  };
}

/**
 * Validates the full login form fields
 * 
 * @param {string} email - Email value
 * @param {string} password - Password value
 * @returns {{ isValid: boolean, errors: { email?: string, password?: string } }}
 */
export const validateLoginForm = function (email, password) {
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  const errors = {};

  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
  }

  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
  }

  const isFormValid = emailValidation.isValid && passwordValidation.isValid;

  return {
    isValid: isFormValid,
    errors: errors
  };
};

/**
 * Validates full name string
 * 
 * @param {string} fullName - Full name input
 * @returns {{ isValid: boolean, message: string }}
 */
export function validateFullName(fullName) {
  if (typeof fullName !== "string" || fullName.trim() === "") {
    return {
      isValid: false,
      message: "Full name is required."
    };
  }

  const cleanName = fullName.trim();

  // Must have at least 2 characters
  if (cleanName.length < 2) {
    return {
      isValid: false,
      message: "Full name must be at least 2 characters long."
    };
  }

  // Name should only contain letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(cleanName)) {
    return {
      isValid: false,
      message: "Full name can only contain letters, spaces, and hyphens."
    };
  }

  return {
    isValid: true,
    message: ""
  };
}

/**
 * Validates mobile phone number string
 * 
 * @param {string} mobile - Mobile phone number input
 * @returns {{ isValid: boolean, message: string }}
 */
export function validateMobile(mobile) {
  if (typeof mobile !== "string" || mobile.trim() === "") {
    return {
      isValid: false,
      message: "Mobile number is required."
    };
  }

  const cleanMobile = mobile.trim();

  // Matches 10-15 digit phone numbers with optional leading '+'
  const mobileRegex = /^(\+?\d{1,4}[-.\s]?)?(\d{10,12})$/;

  if (!mobileRegex.test(cleanMobile.replace(/\s+/g, ""))) {
    return {
      isValid: false,
      message: "Please enter a valid 10-digit mobile number."
    };
  }

  return {
    isValid: true,
    message: ""
  };
}

/**
 * Evaluates live password criteria and returns individual status flags
 * 
 * @param {string} password - Password input
 * @returns {{
 *   hasLength: boolean,
 *   hasUpper: boolean,
 *   hasLower: boolean,
 *   hasNumber: boolean,
 *   isValid: boolean,
 *   criteria: Array<{ id: string, label: string, met: boolean }>
 * }}
 */
export const getPasswordRuleStatus = (password = "") => {
  const pwd = typeof password === "string" ? password : "";

  // Criteria rules definitions 
  const rules = [
    {
      id: "length",
      label: "At least 8 characters",
      test: (str) => str.length >= 8
    },
    {
      id: "upper",
      label: "One uppercase letter (A-Z)",
      test: (str) => /[A-Z]/.test(str)
    },
    {
      id: "lower",
      label: "One lowercase letter (a-z)",
      test: (str) => /[a-z]/.test(str)
    },
    {
      id: "number",
      label: "One number (0-9)",
      test: (str) => /[0-9]/.test(str)
    }
  ];

  // Evaluate rules using a meaningful loop
  const criteria = [];
  let allPassed = true;

  for (let i = 0; i < rules.length; i = i + 1) {
    const rule = rules[i];
    const isMet = rule.test(pwd);
    if (!isMet) {
      allPassed = false;
    }
    criteria.push({
      id: rule.id,
      label: rule.label,
      met: isMet
    });
  }

  return {
    hasLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /[0-9]/.test(pwd),
    isValid: allPassed,
    criteria: criteria
  };
};

/**
 * Validates the entire Register form
 * 
 * @param {{
 *   fullName: string,
 *   email: string,
 *   mobile: string,
 *   accountType: string,
 *   password: string,
 *   confirmPassword: string,
 *   agreedToTerms: boolean
 * }} formData
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateRegisterForm(formData) {
  const {
    fullName = "",
    email = "",
    mobile = "",
    accountType = "",
    password = "",
    confirmPassword = "",
    agreedToTerms = false
  } = formData || {};

  const errors = {};

  // 1. Full Name Validation
  const nameResult = validateFullName(fullName);
  if (!nameResult.isValid) {
    errors.fullName = nameResult.message;
  }

  // 2. Email Validation
  const emailResult = validateEmail(email);
  if (!emailResult.isValid) {
    errors.email = emailResult.message;
  }

  // 3. Mobile Number Validation
  const mobileResult = validateMobile(mobile);
  if (!mobileResult.isValid) {
    errors.mobile = mobileResult.message;
  }

  // 4. Account Type Validation
  if (!accountType || accountType.trim() === "") {
    errors.accountType = "Please select an account type.";
  }

  // 5. Password Validation
  const pwdStatus = getPasswordRuleStatus(password);
  if (!pwdStatus.isValid) {
    errors.password = "Password does not meet all security requirements.";
  }

  // 6. Confirm Password Validation
  if (confirmPassword === "") {
    errors.confirmPassword = "Please confirm your password.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  // 7. Terms & Conditions Checkbox
  if (!agreedToTerms) {
    errors.agreedToTerms = "Please accept the Terms & Conditions to continue.";
  }

  // Determine overall form validity
  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors
  };
}
