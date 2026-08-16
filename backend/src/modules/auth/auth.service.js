const prisma = require("../../config/db");
const { generateOtp } = require("../../utils/generateOtp");
const { signToken, generateRefreshToken } = require("../../utils/jwt.util");
const { DEMO_ADMIN_PHONE, DEMO_ADMIN_OTP, JWT_SECRET } = require("../../config/env");
const jwt = require("jsonwebtoken");

async function sendOtpUser(phone) {
  const otp = generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now

  await prisma.otpVerification.upsert({
    where: { phone },
    update: { otp, otp_expiry: otpExpiry },
    create: { phone, otp, otp_expiry: otpExpiry }
  });

  // Log the OTP to terminal for development
  console.log(`\n[DEVELOPMENT] OTP for User ${phone}: ${otp}\n`);

  return { success: true, message: `OTP sent successfully` };
}

async function verifyOtpUser(phone, otp, deviceFingerprint) {
  const otpRecord = await prisma.otpVerification.findUnique({ where: { phone } });
  if (!otpRecord) throw new Error("No OTP request found for this number");
  
  if (otpRecord.otp !== otp) {
    throw new Error("Invalid OTP");
  }
  
  if (otpRecord.otp_expiry < new Date()) {
    throw new Error("OTP expired");
  }

  // OTP verified, remove it
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

  return { token, refreshToken, isNewUser: false, user: { id: user.id, phone: user.phone, email: user.email } };
}

async function registerUser(registrationToken, { fullName, email }, deviceFingerprint) {
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

  user = await prisma.user.create({
    data: {
      phone,
      fullName,
      email: emailToSave
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

  return { token, refreshToken, user: { id: user.id, phone: user.phone, fullName: user.fullName, email: user.email } };
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
  let admin = await prisma.admin.findUnique({ where: { phone } });
  
  if (!admin) {
    admin = await prisma.admin.create({ data: { phone } });
  }

  const otp = phone === DEMO_ADMIN_PHONE ? DEMO_ADMIN_OTP : generateOtp();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.admin.update({
    where: { id: admin.id },
    data: { otp, otp_expiry: otpExpiry }
  });

  if (phone !== DEMO_ADMIN_PHONE) {
    console.log(`\n[DEVELOPMENT] OTP for Admin ${phone}: ${otp}\n`);
  }

  return { success: true, message: `OTP sent successfully` };
}

async function verifyOtpAdmin(phone, otp, deviceFingerprint) {
  const admin = await prisma.admin.findUnique({ where: { phone } });
  if (!admin) throw new Error("Admin not found");
  
  const isDemoLogin = phone === DEMO_ADMIN_PHONE && otp === DEMO_ADMIN_OTP;

  if (!isDemoLogin) {
    if (!admin.otp || admin.otp !== otp) {
      throw new Error("Invalid OTP");
    }
    
    if (admin.otp_expiry && admin.otp_expiry < new Date()) {
      throw new Error("OTP expired");
    }
  }

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

  return { token, refreshToken, admin: { id: admin.id, phone: admin.phone } };
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

  return { token, refreshToken: newRefreshToken, admin: { id: session.admin.id, phone: session.admin.phone } };
}

async function updateUserProfile(userId, { fullName, email }) {
  // Save null instead of empty string if optional
  const emailToSave = email ? email : null;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { fullName, email: emailToSave }
  });

  return { id: user.id, phone: user.phone, fullName: user.fullName, email: user.email };
}

module.exports = {
  sendOtpUser,
  verifyOtpUser,
  refreshUserToken,
  updateUserProfile,
  registerUser,
  sendOtpAdmin,
  verifyOtpAdmin,
  refreshAdminToken
};
