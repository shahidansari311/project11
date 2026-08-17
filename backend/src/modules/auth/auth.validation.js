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
    profileImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const registerSchema = z.object({
  headers: headersSchema,
  body: z.object({
    registrationToken: z.string().min(1, "Registration token is required"),
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    profileImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
    createdBy: z.string().optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const adminCreateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    phone: phoneSchema,
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    profileImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const adminUpdateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).optional(),
    phone: phoneSchema.optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    profileImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
    hasPurchasedProperty: z.boolean().optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: z.string().optional() }).passthrough().optional()
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  profileSchema,
  registerSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema
};
