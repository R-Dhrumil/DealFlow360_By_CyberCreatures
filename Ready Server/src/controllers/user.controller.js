import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { catchAsync } from '../utils/catchAsync.js';
import { ApiError } from '../utils/ApiError.js';
import { sendEmail } from '../utils/email.js';
import { accountCreatedTemplate } from '../utils/emailTemplates.js';

export const createUser = catchAsync(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!email || !password || !name) {
    throw new ApiError(400, 'Name, email, and password are required');
  }

  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ApiError(400, 'User already exists with this email');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'USER',
    department: department || 'General',
  });

  const safeUser = User.sanitize(user);

  // Send styled HTML account creation notification email asynchronously
  sendEmail({
    to: email,
    subject: 'Welcome! Your Account Has Been Created',
    html: accountCreatedTemplate({ name, email, role: safeUser.role }),
  }).catch((err) => console.error('Failed to dispatch welcome email:', err));

  return ApiResponse.send(res, 201, { user: safeUser }, 'User created successfully by Admin');
});

export const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.findAll();
  return ApiResponse.send(res, 200, { count: users.length, users }, 'All users fetched successfully');
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return ApiResponse.send(res, 200, { user }, 'User details fetched');
});

export const updateUserRole = catchAsync(async (req, res) => {
  const { role } = req.body;
  const user = await User.updateRole(req.params.id, role);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return ApiResponse.send(res, 200, { user }, 'User role updated successfully');
});
