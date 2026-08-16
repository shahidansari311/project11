const prisma = require("../../config/db");
const { generateOtp } = require("../../utils/generateOtp");
const { signToken, generateRefreshToken } = require("../../utils/jwt.util");
const { DEMO_USER_PHONE, DEMO_USER_OTP, DEMO_ADMIN_PHONE, DEMO_ADMIN_OTP } = require("../../config/env");

async function sendOtpUser(phone) {
  let user = await prisma.user.findUnique({ where: { phone } });
  
  if (!user) {
    user = await prisma.user.create({ data: { phone } });
  }

  // If this is the demo user, use specific OTP, otherwise fallback to 123456 since no SMS provider is active
  const otp = phone === DEMO_USER_PHONE ? DEMO_USER_OTP : "123456";
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now

  await prisma.user.update({
    where: { id: user.id },
    data: { otp, otp_expiry: otpExpiry }
  });

  return { success: true, message: `OTP sent successfully` };
}

async function verifyOtpUser(phone, otp, deviceFingerprint) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new Error("User not found");
  
  // Specific demo user check or database check
  const isDemoLogin = phone === DEMO_USER_PHONE && otp === DEMO_USER_OTP;
  
  if (!isDemoLogin) {
    if (!user.otp || user.otp !== otp) {
      throw new Error("Invalid OTP");
    }
    
    if (user.otp_expiry && user.otp_expiry < new Date()) {
      throw new Error("OTP expired");
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { otp: null, otp_expiry: null }
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

  return { token, refreshToken, user: { id: user.id, phone: user.phone, email: user.email } };
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

module.exports = {
  sendOtpUser,
  verifyOtpUser,
  refreshUserToken,
  sendOtpAdmin,
  verifyOtpAdmin,
  refreshAdminToken
};
