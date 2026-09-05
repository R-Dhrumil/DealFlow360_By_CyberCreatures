import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { Otp } from '../models/otp.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';
import { env } from '../config/env.js';
import { sendEmail } from '../utils/email.js';
import { otpTemplate } from '../utils/emailTemplates.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Register a new user
 */
export const register = catchAsync(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await User.findByEmail(cleanEmail);
  if (existingUser) {
    throw new ApiError(409, 'User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: cleanEmail,
    password: hashedPassword,
    role: role || 'USER',
    department: department || 'General',
  });

  const token = generateToken(user.id);
  const safeUser = User.sanitize(user);

  return ApiResponse.send(res, 201, { user: safeUser, token }, 'Registration successful');
});

/**
 * Standard Email & Password Login
 */
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide both email and password');
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await User.findByEmail(cleanEmail);
  if (!user || !(await User.comparePassword(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Contact admin.');
  }

  const token = generateToken(user.id);
  const safeUser = User.sanitize(user);

  return ApiResponse.send(res, 200, { user: safeUser, token }, 'Login successful');
});

/**
 * Send 6-Digit Email OTP (Dev-Friendly with Terminal Fallback)
 */
export const sendOtp = catchAsync(async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required to send OTP');
  }

  const cleanEmail = email.toLowerCase().trim();
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  // Clear previous OTPs and save new one
  await Otp.create({
    email: cleanEmail,
    otp: otpCode,
    expiresAt,
  });

  // Terminal Dev Banner (Zero-config instant testing in hackathons)
  console.log('\n--------------------------------------------------');
  console.log(`🔑 [HACKATHON OTP]: ${otpCode}  (Email: ${cleanEmail})`);
  console.log('--------------------------------------------------\n');

  // Attempt Email Dispatch
  await sendEmail({
    to: cleanEmail,
    subject: `Your Verification Code: ${otpCode}`,
    html: otpTemplate({ name: name || cleanEmail.split('@')[0], otp: otpCode }),
  });

  return ApiResponse.send(
    res,
    200,
    { email: cleanEmail },
    'Verification code sent successfully (Check email or terminal in development mode)'
  );
});

/**
 * Verify OTP & Passwordless Login/Register
 */
export const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp, name } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  const cleanEmail = email.toLowerCase().trim();
  const otpRecord = await Otp.findValid({ email: cleanEmail, otp });

  if (!otpRecord) {
    throw new ApiError(400, 'Invalid or expired OTP verification code');
  }

  // Delete used OTP
  await Otp.deleteByEmail(cleanEmail);

  // Find or auto-provision user
  let user = await User.findByEmail(cleanEmail);
  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-10) + 'A1!', 10);
    user = await User.create({
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: randomPassword,
      role: 'USER',
    });
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated.');
  }

  const token = generateToken(user.id);
  const safeUser = User.sanitize(user);

  return ApiResponse.send(
    res,
    200,
    { user: safeUser, token, isNewUser },
    isNewUser ? 'User verified & account created' : 'OTP verified & login successful'
  );
});

/**
 * Get Current Authenticated User Profile
 */
export const getMe = catchAsync(async (req, res) => {
  return ApiResponse.send(res, 200, { user: req.user }, 'Current user profile retrieved');
});
