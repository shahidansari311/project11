const authService = require("./auth.service");
const { successResponse, errorResponse } = require("../../utils/apiResponse");

async function userSendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return errorResponse(res, 400, "Phone number is required");
    
    const result = await authService.sendOtpUser(phone);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    next(err);
  }
}

async function userVerifyOtp(req, res, next) {
  try {
    const { phone, otp } = req.body;
    const deviceFingerprint = req.headers["x-device-id"] || "unknown-device";

    if (!phone || !otp) return errorResponse(res, 400, "Phone and OTP are required");
    
    const result = await authService.verifyOtpUser(phone, otp, deviceFingerprint);
    return successResponse(res, 200, result, "Login successful");
  } catch (err) {
    return errorResponse(res, 400, err.message);
  }
}

async function userRegister(req, res, next) {
  try {
    const { registrationToken, fullName, email, profileUrl, createdBy } = req.body;
    const deviceFingerprint = req.headers["x-device-id"] || "unknown-device";

    if (!registrationToken || !fullName) {
      return errorResponse(res, 400, "Registration token and full name are required");
    }

    const result = await authService.registerUser(registrationToken, { fullName, email, profileUrl, createdBy }, deviceFingerprint);
    return successResponse(res, 201, result, "Registration successful");
  } catch (err) {
    return errorResponse(res, 400, err.message);
  }
}

async function refreshUserToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const deviceFingerprint = req.headers["x-device-id"] || "unknown-device";

    const result = await authService.refreshUserToken(refreshToken, deviceFingerprint);
    return successResponse(res, 200, result, "Token refreshed successfully");
  } catch (err) {
    return errorResponse(res, 401, err.message);
  }
}

async function adminSendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return errorResponse(res, 400, "Phone number is required");
    
    const result = await authService.sendOtpAdmin(phone);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    next(err);
  }
}

async function adminVerifyOtp(req, res, next) {
  try {
    const { phone, otp } = req.body;
    const deviceFingerprint = req.headers["x-device-id"] || "unknown-device";

    if (!phone || !otp) return errorResponse(res, 400, "Phone and OTP are required");
    
    const result = await authService.verifyOtpAdmin(phone, otp, deviceFingerprint);
    return successResponse(res, 200, result, "Login successful");
  } catch (err) {
    return errorResponse(res, 400, err.message);
  }
}

async function refreshAdminToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const deviceFingerprint = req.headers["x-device-id"] || "unknown-device";

    const result = await authService.refreshAdminToken(refreshToken, deviceFingerprint);
    return successResponse(res, 200, result, "Token refreshed successfully");
  } catch (err) {
    return errorResponse(res, 401, err.message);
  }
}

async function adminResendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return errorResponse(res, 400, "Phone number is required");
    
    const result = await authService.resendOtpAdmin(phone);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    return errorResponse(res, 400, err.message);
  }
}

async function userLogout(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    const result = await authService.logoutUser(req.user.id, refreshToken);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    next(err);
  }
}

async function getAllUsers(req, res, next) {
  try {
    // Parse query params — default 20 users per page, max 100 users per page
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const search = (req.query.search || "").trim();

    const result = await authService.getAllUsers({ page, limit, search });
    return successResponse(res, 200, result, "Users retrieved successfully");
  } catch (error) {
    next(error);
  }
}

async function createUserByAdmin(req, res, next) {
  try {
    const { fullName, phone, email, profileUrl } = req.body;
    const newUser = await authService.createUserByAdmin({ fullName, phone, email, profileUrl });
    return successResponse(res, 201, newUser, "User created successfully by Admin");
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const user = await authService.getUserById(id);
    return successResponse(res, 200, user, "User details retrieved successfully");
  } catch (error) {
    return errorResponse(res, 404, error.message);
  }
}

async function updateUserByAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const updatedUser = await authService.updateUserByAdmin(id, req.body);
    return successResponse(res, 200, updatedUser, "User updated successfully");
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
}

async function deleteUserByAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const result = await authService.deleteUserByAdmin(id);
    return successResponse(res, 200, null, result.message);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
}

async function userResendOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return errorResponse(res, 400, "Phone number is required");

    const result = await authService.resendOtpUser(phone);
    return successResponse(res, 200, null, result.message);
  } catch (err) {
    return errorResponse(res, 400, err.message);
  }
}

async function userCancelOtp(req, res, next) {
  try {
    const { phone } = req.body;
    if (!phone) return errorResponse(res, 400, "Phone number is required");

    await authService.cancelOtpUser(phone);
    return successResponse(res, 200, null, "OTP session cleared");
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { fullName, email, profileUrl } = req.body;
    // req.user is set by the verifyAuth middleware
    const updatedUser = await authService.updateUserProfile(req.user.id, { fullName, email, profileUrl });

    return successResponse(res, 200, { user: updatedUser }, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = {
  userSendOtp,
  userVerifyOtp,
  userRegister,
  refreshUserToken,
  userLogout,
  userResendOtp,
  userCancelOtp,
  updateProfile,
  adminSendOtp,
  adminResendOtp,
  adminVerifyOtp,
  refreshAdminToken,
  getAllUsers,
  getUserById,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin
};
