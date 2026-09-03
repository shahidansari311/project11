const { z } = require("zod");

const phoneSchema = z.string({ 
  required_error: "Please enter a mobile number.",
  invalid_type_error: "Mobile number must be text."
}).trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number");

const otpSchema = z.string({
  required_error: "Please enter the OTP.",
  invalid_type_error: "OTP must be text."
}).trim().regex(/^\d{6}$/, "OTP must be exactly 6 digits");

const deviceIdSchema = z.string({
  required_error: "Device ID is required.",
  invalid_type_error: "Device ID must be text."
}).min(1, "Device ID is required").default("unknown-device");

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
    refreshToken: z.string({
      invalid_type_error: "Refresh token must be text."
    }).min(1, "Refresh token cannot be empty").optional()
  }).optional(),
  cookies: z.object({
    refreshToken: z.string().optional()
  }).passthrough().optional(),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
}).refine(
  (data) => Boolean(data.body?.refreshToken || data.cookies?.refreshToken),
  { message: "Refresh token is missing. Please provide it in request body or cookie.", path: ["refreshToken"] }
);

const profileSchema = z.object({
  body: z.object({
    fullName: z.string({
      required_error: "Please provide a full name.",
      invalid_type_error: "Full name must be text."
    }).min(2, "Full name must be at least 2 characters").max(100).regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
    email: z.string({
      invalid_type_error: "Email must be text."
    }).email("Invalid email address").optional().or(z.literal("")),
    profileImage: z.string({
      invalid_type_error: "Profile image must be text."
    }).url("Invalid image URL").optional().or(z.literal("")),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const profileImageSchema = z.object({
  body: z.object({
    profileImage: z.string({
      invalid_type_error: "Profile image must be text."
    }).url("Invalid image URL").optional().or(z.literal("")),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const registerSchema = z.object({
  headers: headersSchema,
  body: z.object({
    registrationToken: z.string({
      required_error: "Registration token is missing.",
      invalid_type_error: "Registration token must be text."
    }).min(1, "Registration token is required"),
    fullName: z.string({
      required_error: "Please provide a full name.",
      invalid_type_error: "Full name must be text."
    }).min(2, "Full name must be at least 2 characters").max(100).regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
    email: z.string({
      invalid_type_error: "Email must be text."
    }).email("Invalid email address").optional().or(z.literal("")),
    profileImage: z.string({
      invalid_type_error: "Profile image must be text."
    }).url("Invalid image URL").optional().or(z.literal("")),
    createdBy: z.string().optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const adminCreateUserSchema = z.object({
  body: z.object({
    fullName: z.string({
      required_error: "Please provide the user's full name.",
      invalid_type_error: "Full name must be text."
    }).min(2, "Full name must be at least 2 characters").max(100).regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces"),
    phone: phoneSchema,
    email: z.string({
      invalid_type_error: "Email must be text."
    }).email("Invalid email address").optional().or(z.literal("")),
    profileImage: z.string({
      invalid_type_error: "Profile image must be text."
    }).url("Invalid image URL").optional().or(z.literal("")),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional()
});

const adminUpdateUserSchema = z.object({
  body: z.object({
    fullName: z.string({
      invalid_type_error: "Full name must be text."
    }).min(2, "Full name must be at least 2 characters").max(100).regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces").optional(),
    phone: phoneSchema.optional(),
    email: z.string({
      invalid_type_error: "Email must be text."
    }).email("Invalid email address").optional().or(z.literal("")),
    profileImage: z.string({
      invalid_type_error: "Profile image must be text."
    }).url("Invalid image URL").optional().or(z.literal("")),
    hasPurchasedProperty: z.boolean({
      invalid_type_error: "Has purchased property must be true or false."
    }).optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: z.string().optional() }).passthrough().optional()
});

module.exports = {
  sendOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  profileSchema,
  profileImageSchema,
  registerSchema,
  adminCreateUserSchema,
  adminUpdateUserSchema
};
