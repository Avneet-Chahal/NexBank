import nodemailer from "nodemailer";

/**
 * NexBank – Automated Transactional Email Notification Service
 * 
 * Securely delivers transactional emails for account registration and login events.
 * Relies on environment variables for SMTP credentials.
 * Fails safely without disrupting the authentication lifecycle if SMTP is unavailable.
 */

/**
 * Creates and caches the Nodemailer transporter instance if SMTP is configured.
 * 
 * @returns {import("nodemailer").Transporter | null}
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    // Enforce reasonable socket timeout to prevent blocking worker threads
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000
  });
}

/**
 * Helper to determine sender address
 */
function getSenderAddress() {
  return process.env.EMAIL_FROM || '"NexBank" <no-reply@nexbank.com>';
}

/**
 * Sends Welcome / Account Registration confirmation email
 * 
 * @param {object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - User's full name
 * @returns {Promise<{ sent: boolean, reason?: string, messageId?: string }>}
 */
export async function sendRegistrationEmail({ to, name }) {
  if (!to) {
    console.warn("[EMAIL] Registration email skipped: missing recipient address.");
    return { sent: false, reason: "Missing recipient" };
  }

  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      "[EMAIL] Notice: SMTP credentials not configured in environment. Skipping welcome email dispatch."
    );
    return { sent: false, reason: "SMTP not configured" };
  }

  const userName = name || "Customer";
  const subject = "Welcome to NexBank — Registration Successful";

  const plainText = `Hello ${userName},

Welcome to NexBank! Your account registration was successful.

You can now sign in to your NexBank account and explore your banking dashboard.

If you did not create this account, please contact our support team.

Thank you,
NexBank Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: #3b82f6; letter-spacing: -0.5px; }
    .title { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #9ca3af; margin: 0 0 16px 0; }
    .highlight { color: #f3f4f6; font-weight: 500; }
    .footer { border-top: 1px solid #1f2937; padding-top: 20px; margin-top: 32px; font-size: 13px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NexBank</div>
    </div>
    <div class="title">Registration Successful</div>
    <p>Hello <span class="highlight">${userName}</span>,</p>
    <p>Welcome to <strong>NexBank</strong>! Your account registration was successful.</p>
    <p>You can now sign in to your NexBank account and explore your banking dashboard.</p>
    <p>If you did not create this account, please contact our support team immediately.</p>
    <p>Thank you,<br><strong>NexBank Team</strong></p>
    <div class="footer">
      NexBank Digital Banking &bull; Protected with NexShield&trade; Security
    </div>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject,
      text: plainText,
      html: htmlContent
    });

    console.log(`[EMAIL] Registration welcome email delivered successfully to: ${to} (MessageID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL] Failed to send registration email to ${to}: ${err.message}`);
    return { sent: false, reason: err.message };
  }
}

/**
 * Sends Login Confirmation security email
 * 
 * @param {object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.name - User's full name
 * @param {string} [params.timestamp] - Sign-in timestamp
 * @returns {Promise<{ sent: boolean, reason?: string, messageId?: string }>}
 */
export async function sendLoginEmail({ to, name, timestamp }) {
  if (!to) {
    console.warn("[EMAIL] Login email skipped: missing recipient address.");
    return { sent: false, reason: "Missing recipient" };
  }

  const transporter = getTransporter();

  if (!transporter) {
    console.log(
      "[EMAIL] Notice: SMTP credentials not configured in environment. Skipping login notification dispatch."
    );
    return { sent: false, reason: "SMTP not configured" };
  }

  const userName = name || "Customer";
  const loginTime = timestamp || new Date().toUTCString();
  const subject = "NexBank — Login Successful";

  const plainText = `Hello ${userName},

You have successfully signed in to your NexBank account.

Login time: ${loginTime}

If this wasn't you, please reset your password and contact NexBank support.

Thank you,
NexBank Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { border-bottom: 1px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: #3b82f6; letter-spacing: -0.5px; }
    .title { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 4px 10px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    p { font-size: 15px; line-height: 1.6; color: #9ca3af; margin: 0 0 16px 0; }
    .highlight { color: #f3f4f6; font-weight: 500; }
    .time-card { background: #1f2937; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-family: monospace; font-size: 14px; color: #e5e7eb; }
    .footer { border-top: 1px solid #1f2937; padding-top: 20px; margin-top: 32px; font-size: 13px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NexBank</div>
    </div>
    <div class="badge">&bull; Security Notice</div>
    <div class="title">Login Successful</div>
    <p>Hello <span class="highlight">${userName}</span>,</p>
    <p>You have successfully signed in to your NexBank account.</p>
    <div class="time-card">
      Login time: <strong>${loginTime}</strong>
    </div>
    <p>If this wasn't you, please reset your password and contact NexBank support immediately.</p>
    <p>Thank you,<br><strong>NexBank Team</strong></p>
    <div class="footer">
      NexBank Digital Banking &bull; Protected with NexShield&trade; Security
    </div>
  </div>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject,
      text: plainText,
      html: htmlContent
    });

    console.log(`[EMAIL] Login confirmation email delivered successfully to: ${to} (MessageID: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EMAIL] Failed to send login email to ${to}: ${err.message}`);
    return { sent: false, reason: err.message };
  }
}

export default {
  sendRegistrationEmail,
  sendLoginEmail
};
