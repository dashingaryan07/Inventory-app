import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password, tenantId } = req.body;

  // Validate input
  if (!email || !password || !tenantId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email, password, and tenant ID'
    });
  }

  // Check if tenant exists and is active
  const tenant = await Tenant.findOne({ tenantId, isActive: true });
  
  if (!tenant) {
    return res.status(401).json({
      success: false,
      message: 'Invalid tenant ID'
    });
  }

  // Find user by email and tenantId (with password field)
  const user = await User.findOne({ email, tenantId }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'User account is inactive'
    });
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Generate token
  const token = generateToken(user._id);

  // Send response
  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    },
    tenant: {
      id: tenant.tenantId,
      name: tenant.name,
      businessType: tenant.businessType
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const tenant = await Tenant.findOne({ tenantId: req.tenantId });

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    },
    tenant: {
      id: tenant.tenantId,
      name: tenant.name,
      businessType: tenant.businessType
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});