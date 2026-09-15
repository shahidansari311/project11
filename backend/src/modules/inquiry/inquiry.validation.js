const { z } = require("zod");

const createInquirySchema = z.object({
  body: z.object({
    firstName: z
      .string({
        required_error: "First name is required.",
        invalid_type_error: "First name must be text.",
      })
      .trim()
      .min(1, "First name cannot be empty")
      .max(100, "First name is too long"),
    lastName: z
      .string({
        required_error: "Last name is required.",
        invalid_type_error: "Last name must be text.",
      })
      .trim()
      .min(1, "Last name cannot be empty")
      .max(100, "Last name is too long"),
    email: z
      .string({
        required_error: "Corporate email is required.",
        invalid_type_error: "Email must be text.",
      })
      .trim()
      .toLowerCase()
      .email("Please enter a valid email address"),
    areaOfInterest: z
      .string({
        required_error: "Area of interest is required.",
        invalid_type_error: "Area of interest must be text.",
      })
      .trim()
      .min(1, "Area of interest cannot be empty")
      .max(200, "Area of interest is too long"),
    message: z
      .string({
        required_error: "Message is required.",
        invalid_type_error: "Message must be text.",
      })
      .trim()
      .min(1, "Message cannot be empty")
      .max(5000, "Message is too long"),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

const updateInquiryStatusSchema = z.object({
  body: z.object({
    status: z.enum(["NEW", "CONTACTED", "RESOLVED"], {
      required_error: "Status is required.",
      invalid_type_error: "Status must be NEW, CONTACTED, or RESOLVED.",
    }),
  }),
  params: z.object({
    id: z.string().min(1, "Inquiry ID is required"),
  }),
  query: z.object({}).passthrough().optional(),
});

module.exports = {
  createInquirySchema,
  updateInquiryStatusSchema,
};
