/**
 * Premium, Responsive HTML Email Templates for Hackathon Workflows
 */

const baseWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; color: #333333; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #1f4e78 0%, #0d2b45 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
    .body { padding: 30px; line-height: 1.6; }
    .badge { display: inline-block; background: #eef2ff; color: #1f4e78; font-weight: 600; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin-bottom: 15px; }
    .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1f4e78; background: #f0f4f8; padding: 15px 25px; border-radius: 8px; text-align: center; margin: 20px 0; display: inline-block; }
    .btn { display: inline-block; background: #1f4e78; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .info-box { background: #f8fafc; border-left: 4px solid #1f4e78; padding: 12px 16px; margin: 20px 0; border-radius: 0 6px 6px 0; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Hackathon System</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Automated Notification • Hackathon Backend API System</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Account Created Email Template
 */
export const accountCreatedTemplate = ({ name, email, role, tempPassword, loginUrl = '#' }) => {
  return baseWrapper(`
    <span class="badge">Account Provisioned</span>
    <h2>Welcome aboard, ${name || 'User'}!</h2>
    <p>Your account has been created by the system administrator with the following details:</p>
    <div class="info-box">
      <p style="margin:4px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin:4px 0;"><strong>Role:</strong> <span style="color:#1f4e78; font-weight:bold;">${role || 'USER'}</span></p>
      ${tempPassword ? `<p style="margin:4px 0;"><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>` : ''}
    </div>
    <p>Log in to access your assigned workspace endpoints.</p>
    <div style="text-align: center;">
      <a href="${loginUrl}" class="btn">Login to Account</a>
    </div>
  `);
};

/**
 * OTP Verification Email Template
 */
export const otpTemplate = ({ name, otp, expiresIn = '10 minutes' }) => {
  return baseWrapper(`
    <span class="badge">Security Verification</span>
    <h2>Verify Your Email</h2>
    <p>Hi ${name || 'there'}, use the verification code below to authorize your request:</p>
    <div style="text-align: center;">
      <div class="otp-code">${otp}</div>
    </div>
    <p style="font-size: 13px; color: #64748b; text-align: center;">This code will expire in <strong>${expiresIn}</strong>. Do not share this code with anyone.</p>
  `);
};

/**
 * Password Reset Email Template
 */
export const passwordResetTemplate = ({ name, resetUrl = '#', expiresIn = '15 minutes' }) => {
  return baseWrapper(`
    <span class="badge">Password Reset</span>
    <h2>Reset Your Password</h2>
    <p>Hi ${name || 'User'}, we received a request to reset your password. Click the button below to set a new password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <p style="font-size: 13px; color: #64748b;">Link expires in <strong>${expiresIn}</strong>. If you didn't request this, please ignore this email.</p>
  `);
};

/**
 * General System Notification Alert Template
 */
export const notificationAlertTemplate = ({ name, title, message, actionUrl, actionText }) => {
  return baseWrapper(`
    <span class="badge">System Notification</span>
    <h2>${title || 'Important Update'}</h2>
    <p>Hi ${name || 'User'},</p>
    <p>${message}</p>
    ${
      actionUrl
        ? `<div style="text-align: center;"><a href="${actionUrl}" class="btn">${actionText || 'View Details'}</a></div>`
        : ''
    }
  `);
};
