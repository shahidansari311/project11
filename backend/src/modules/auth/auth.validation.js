const { z } = require("zod");

const phoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number");
const otpSchema = z.string().trim().regex(/^\d{6}$/, "OTP must be exactly 6 digits");
const deviceIdSchema = z.string().min(1, "Device ID is required").default("unknown-device");

const headersSchema = z.object({
  "x-device-id": deviceIdSchema
}).passthrough();

const sendOtpSchema = z.object({
  body: z.object({
    phone: phoneSchema
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const verifyOtpSchema = z.object({
  headers: headersSchema,
  body: z.object({
    phone: phoneSchema,
    otp: otpSchema
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const refreshTokenSchema = z.object({
  headers: headersSchema,
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required")
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const profileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  profileSchema
};
