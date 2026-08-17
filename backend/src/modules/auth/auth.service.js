const prisma = require("../../config/db");
const { generateOtp } = require("../../utils/generateOtp");
const { signToken, generateRefreshToken } = require("../../utils/jwt.util");
const { ADMIN_PHONE, JWT_SECRET } = require("../../config/env");
const jwt = require("jsonwebtoken");

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute

async function sendOtpUser(phone) {
  // Check if there is an existing active OTP requested less than 1 minute ago
  const existingOtp = await prisma.otpVerification.findUnique({ where: { phone } });
  if (existingOtp) {
    const timeSinceLastOtp = Date.now() - new Date(existingOtp.updatedAt).getTime();
    if (timeSinceLastOtp < OTP_RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLastOtp) / 1000);
      throw new Error(`Please wait ${remainingSeconds} second(s) before requesting a new OTP.`);
    }
  }

  // Generate cryptographically secure 6-digit OTP
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS); // 5 minutes

  // Upsert overwrites/deletes previous OTP with the new one
  await prisma.otpVerification.upsert({
    where: { phone },
    update: { otp, otp_expiry: otpExpiry },
    create: { phone, otp, otp_expiry: otpExpiry }
  });

  console.log(`📱 [USER SECURE OTP] Mobile: ${phone} | OTP: ${otp} (Valid for 5 mins)`);


  return { success: true, message: `OTP sent successfully` };
}

async function verifyOtpUser(phone, otp, deviceFingerprint) {
  const otpRecord = await prisma.otpVerification.findUnique({ where: { phone } });
  if (!otpRecord) throw new Error("No OTP request found for this number. Please request OTP first.");
  
  if (otpRecord.otp !== otp) {
    throw new Error("Invalid OTP");
  }
  
  if (otpRecord.otp_expiry < new Date()) {
    // Delete expired OTP
    await prisma.otpVerification.delete({ where: { phone } }).catch(() => {});
    throw new Error("OTP has expired. Please request a new OTP.");
  }

  // OTP verified, remove it so it cannot be used again
  await prisma.otpVerification.delete({ where: { phone } });

  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    // New user, return a registration token instead of fully logging them in
    const registrationToken = jwt.sign({ phone, isRegistration: true }, JWT_SECRET, { expiresIn: '15m' });
    return { isNewUser: true, registrationToken };
  }

  // Existing user, log them in
  const token = signToken({ id: user.id, role: "user" });
  const refreshToken = generateRefreshToken();
  
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      deviceFingerprint,
      expiresAt
    }
  });

  return { token, refreshToken, isNewUser: false, user: { id: user.id, phone: user.phone, fullName: user.fullName, email: user.email, profileUrl: user.profileUrl, createdby_admin: user.createdby_admin } };
}

async function registerUser(registrationToken, { fullName, email, profileUrl, createdBy }, deviceFingerprint) {
  let decoded;
  try {
    decoded = jwt.verify(registrationToken, JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired registration token");
  }

  if (!decoded.isRegistration || !decoded.phone) {
    throw new Error("Invalid registration token format");
  }

  const { phone } = decoded;

  // Check if user already exists
  let user = await prisma.user.findUnique({ where: { phone } });
  if (user) {
    throw new Error("User already registered. Please login.");
  }

  const emailToSave = email ? email : null;
  const imageToSave = profileUrl ? profileUrl : null;
  const createdByToSave = createdBy ? createdBy : "false";

  user = await prisma.user.create({
    data: {
      phone,
      fullName,
      email: emailToSave,
      profileUrl: imageToSave,
      createdby_admin: createdByToSave
    }
  });

  const token = signToken({ id: user.id, role: "user" });
  const refreshToken = generateRefreshToken();
  
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      deviceFingerprint,
      expiresAt
    }
  });

  return { token, refreshToken, user: { id: user.id, phone: user.phone, fullName: user.fullName, email: user.email, profileUrl: user.profileUrl, createdby_admin: user.createdby_admin } };
}

async function refreshUserToken(oldRefreshToken, deviceFingerprint) {
  const session = await prisma.session.findUnique({
    where: { refreshToken: oldRefreshToken },
    include: { user: true }
  });

  if (!session || !session.userId) {
    throw new Error("Invalid refresh token");
  }

  if (session.deviceFingerprint !== deviceFingerprint) {
    throw new Error("Device mismatch. Please login again.");
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new Error("Refresh token expired. Please login again.");
  }

  // Delete old session (rotation)
  await prisma.session.delete({ where: { id: session.id } });

  const token = signToken({ id: session.userId, role: "user" });
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: session.userId,
      refreshToken: newRefreshToken,
      deviceFingerprint,
      expiresAt
    }
  });

  return { token, refreshToken: newRefreshToken, user: { id: session.user.id, phone: session.user.phone } };
}

async function sendOtpAdmin(phone) {
  // Check if phone matches the fixed Admin phone number
  const fixedAdminPhone = ADMIN_PHONE || "9876543210";
  if (phone !== fixedAdminPhone) {
    throw new Error("Access denied: Not an authorized Admin mobile number");
  }

  let admin = await prisma.admin.findUnique({ where: { phone } });
  
  if (!admin) {
    admin = await prisma.admin.create({ data: { phone } });
  } else if (admin.otp && admin.updatedAt) {
    // Check 1 minute resend cooldown
    const timeSinceLastOtp = Date.now() - new Date(admin.updatedAt).getTime();
    if (timeSinceLastOtp < OTP_RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLastOtp) / 1000);
      throw new Error(`Please wait ${remainingSeconds} second(s) before requesting a new OTP.`);
    }
  }

  // Generate cryptographically secure OTP
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS); // 5 minutes

  // Overwrites previous OTP with the newly generated OTP
  await prisma.admin.update({
    where: { id: admin.id },
    data: { otp, otp_expiry: otpExpiry }
  });

  console.log(`\n======================================================`);
  console.log(`🔐 [ADMIN SECURE OTP] Mobile: ${phone} | OTP: ${otp} (Valid for 5 mins)`);
  console.log(`======================================================\n`);

  return { success: true, message: `OTP sent successfully to Admin` };
}

async function verifyOtpAdmin(phone, otp, deviceFingerprint) {
  const fixedAdminPhone = ADMIN_PHONE || "9876543210";
  if (phone !== fixedAdminPhone) {
    throw new Error("Access denied: Not an authorized Admin mobile number");
  }

  const admin = await prisma.admin.findUnique({ where: { phone } });
  if (!admin) throw new Error("Admin not found. Please request OTP first.");

  if (!admin.otp || admin.otp !== otp) {
    throw new Error("Invalid OTP");
  }
  
  if (admin.otp_expiry && admin.otp_expiry < new Date()) {
    // Clear expired OTP
    await prisma.admin.update({
      where: { id: admin.id },
      data: { otp: null, otp_expiry: null }
    });
    throw new Error("OTP has expired. Please request a new OTP.");
  }

  // Clear OTP immediately after successful verification
  await prisma.admin.update({
    where: { id: admin.id },
    data: { otp: null, otp_expiry: null }
  });

  const token = signToken({ id: admin.id, role: "admin" });
  const refreshToken = generateRefreshToken();
  
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      adminId: admin.id,
      refreshToken,
      deviceFingerprint,
      expiresAt
    }
  });

  return { token, refreshToken };
}

async function refreshAdminToken(oldRefreshToken, deviceFingerprint) {
  const session = await prisma.session.findUnique({
    where: { refreshToken: oldRefreshToken },
    include: { admin: true }
  });

  if (!session || !session.adminId) {
    throw new Error("Invalid refresh token");
  }

  if (session.deviceFingerprint !== deviceFingerprint) {
    throw new Error("Device mismatch. Please login again.");
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new Error("Refresh token expired. Please login again.");
  }

  await prisma.session.delete({ where: { id: session.id } });

  const token = signToken({ id: session.adminId, role: "admin" });
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      adminId: session.adminId,
      refreshToken: newRefreshToken,
      deviceFingerprint,
      expiresAt
    }
  });

  return { token, refreshToken: newRefreshToken };
}


async function logoutUser(userId, refreshToken) {
  if (refreshToken) {
    await prisma.session.deleteMany({
      where: {
        userId,
        refreshToken
      }
    });
  } else {
    await prisma.session.deleteMany({
      where: { userId }
    });
  }
  return { success: true, message: "User logged out successfully" };
}

async function updateUserProfile(userId, { fullName, email, profileUrl }) {
  // Save null instead of empty string if optional
  const emailToSave = email !== undefined ? (email ? email : null) : undefined;
  const imageToSave = profileUrl !== undefined ? (profileUrl ? profileUrl : null) : undefined;

  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (emailToSave !== undefined) updateData.email = emailToSave;
  if (imageToSave !== undefined) updateData.profileUrl = imageToSave;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  return { id: user.id, phone: user.phone, fullName: user.fullName, email: user.email, profileUrl: user.profileUrl, createdby_admin: user.createdby_admin };
}

async function resendOtpAdmin(phone) {
  const fixedAdminPhone = ADMIN_PHONE || "9876543210";
  if (phone !== fixedAdminPhone) {
    throw new Error("Access denied: Not an authorized Admin mobile number");
  }

  const admin = await prisma.admin.findUnique({ where: { phone } });
  if (!admin) {
    throw new Error("No OTP was requested. Please use send-otp first.");
  }

  // Admin must have an active OTP to resend
  if (!admin.otp) {
    throw new Error("No active OTP found. Please use send-otp first.");
  }

  // Strictly enforce 1 minute cooldown
  const timeSinceLastOtp = Date.now() - new Date(admin.updatedAt).getTime();
  if (timeSinceLastOtp < OTP_RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLastOtp) / 1000);
    throw new Error(`Please wait ${remainingSeconds} second(s) before resending OTP.`);
  }

  // Delete old OTP and generate a fresh one
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS); // 5 minutes

  await prisma.admin.update({
    where: { id: admin.id },
    data: { otp, otp_expiry: otpExpiry }
  });

  console.log(`\n======================================================`);
  console.log(`🔄 [ADMIN RESEND OTP] Mobile: ${phone} | New OTP: ${otp} (Valid for 5 mins)`);
  console.log(`======================================================\n`);

  return { success: true, message: "OTP resent successfully to Admin" };
}

async function getAllUsers({ page = 1, limit = 20, search = "" } = {}) {
  const skip = (page - 1) * limit;

  // Build search filter — matches name OR email, case-insensitive
  const where = search.trim()
    ? {
        OR: [
          { fullName: { contains: search.trim(), mode: "insensitive" } },
          { email:    { contains: search.trim(), mode: "insensitive" } },
        ],
      }
    : {};

  // Run count and data fetch in parallel for efficiency
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        phone: true,
        fullName: true,
        email: true,
        profileUrl: true,
        createdby_admin: true,
        hasPurchasedProperty: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

async function createUserByAdmin({ fullName, phone, email, profileUrl }) {
  // Check if user with phone already exists
  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    throw new Error("User with this mobile number already exists");
  }

  // Check if email already exists (if provided)
  const emailToSave = email ? email : null;
  if (emailToSave) {
    const existingEmail = await prisma.user.findUnique({ where: { email: emailToSave } });
    if (existingEmail) {
      throw new Error("User with this email address already exists");
    }
  }

  const imageToSave = profileUrl ? profileUrl : null;

  const newUser = await prisma.user.create({
    data: {
      phone,
      fullName,
      email: emailToSave,
      profileUrl: imageToSave,
      createdby_admin: "true"
    }
  });

  return {
    id: newUser.id,
    phone: newUser.phone,
    fullName: newUser.fullName,
    email: newUser.email,
    profileUrl: newUser.profileUrl,
    createdby_admin: newUser.createdby_admin,
    hasPurchasedProperty: newUser.hasPurchasedProperty,
    createdAt: newUser.createdAt,
    updatedAt: newUser.updatedAt
  };
}

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      phone: true,
      fullName: true,
      email: true,
      profileUrl: true,
      createdby_admin: true,
      hasPurchasedProperty: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!user) {
    throw new Error("User not found with the provided ID");
  }

  return user;
}

async function updateUserByAdmin(userId, { fullName, phone, email, profileUrl, hasPurchasedProperty }) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new Error("User not found with the provided ID");
  }

  // Check unique phone if updating phone
  if (phone && phone !== existingUser.phone) {
    const phoneExists = await prisma.user.findUnique({ where: { phone } });
    if (phoneExists) {
      throw new Error("Another user already has this mobile number");
    }
  }

  // Check unique email if updating email
  const emailToSave = email !== undefined ? (email ? email : null) : undefined;
  if (emailToSave && emailToSave !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: emailToSave } });
    if (emailExists) {
      throw new Error("Another user already has this email address");
    }
  }

  const imageToSave = profileUrl !== undefined ? (profileUrl ? profileUrl : null) : undefined;

  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (phone !== undefined) updateData.phone = phone;
  if (emailToSave !== undefined) updateData.email = emailToSave;
  if (imageToSave !== undefined) updateData.profileUrl = imageToSave;
  if (hasPurchasedProperty !== undefined) updateData.hasPurchasedProperty = hasPurchasedProperty;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  return {
    id: updatedUser.id,
    phone: updatedUser.phone,
    fullName: updatedUser.fullName,
    email: updatedUser.email,
    profileUrl: updatedUser.profileUrl,
    createdby_admin: updatedUser.createdby_admin,
    hasPurchasedProperty: updatedUser.hasPurchasedProperty,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt
  };
}

async function deleteUserByAdmin(userId) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) {
    throw new Error("User not found with the provided ID");
  }

  await prisma.user.delete({ where: { id: userId } });

  return { success: true, message: "User deleted successfully" };
}

async function resendOtpUser(phone) {
  // Must have an existing OTP session — can't resend what was never sent
  const existingOtp = await prisma.otpVerification.findUnique({ where: { phone } });
  if (!existingOtp) {
    throw new Error("No active OTP session found. Please request an OTP first.");
  }

  // Enforce 60-second resend cooldown
  const timeSinceLastOtp = Date.now() - new Date(existingOtp.updatedAt).getTime();
  if (timeSinceLastOtp < OTP_RESEND_COOLDOWN_MS) {
    const remainingSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLastOtp) / 1000);
    throw new Error(`Please wait ${remainingSeconds} second(s) before resending OTP.`);
  }

  // Generate a fresh OTP and overwrite the old one
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MS);

  await prisma.otpVerification.update({
    where: { phone },
    data: { otp, otp_expiry: otpExpiry }
  });

  console.log(`🔄 [USER RESEND OTP] Mobile: ${phone} | New OTP: ${otp} (Valid for 5 mins)`);

  return { success: true, message: "OTP resent successfully" };
}

async function cancelOtpUser(phone) {
  // Idempotent — delete OTP record if it exists, no error if it doesn't
  // Called when the user taps "Edit" so re-entering the same phone has no cooldown
  await prisma.otpVerification.delete({ where: { phone } }).catch(() => {});
  return { success: true };
}

async function cancelOtpAdmin(phone) {
  const fixedAdminPhone = ADMIN_PHONE || "9876543210";
  if (phone !== fixedAdminPhone) {
    throw new Error("Access denied: Not an authorized Admin mobile number");
  }

  // Idempotent — clear OTP and expiry for Admin if it exists
  await prisma.admin.update({
    where: { phone },
    data: { otp: null, otp_expiry: null }
  }).catch(() => {});

  return { success: true };
}

module.exports = {
  sendOtpUser,
  verifyOtpUser,
  refreshUserToken,
  getAllUsers,
  getUserById,
  createUserByAdmin,
  updateUserByAdmin,
  deleteUserByAdmin,
  updateUserProfile,
  registerUser,
  logoutUser,
  resendOtpUser,
  cancelOtpUser,
  sendOtpAdmin,
  resendOtpAdmin,
  cancelOtpAdmin,
  verifyOtpAdmin,
  refreshAdminToken
};
