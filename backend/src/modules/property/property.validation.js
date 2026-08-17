const { z } = require("zod");

const VALID_STATUSES   = ["AVAILABLE", "SOLD", "UNDER_REVIEW", "COMING_SOON"];
const VALID_CATEGORIES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND"];

const createPropertySchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Title is required" })
      .trim()
      .min(3, "Title must be at least 3 characters"),

    description: z
      .string({ required_error: "Description is required" })
      .trim()
      .min(10, "Description must be at least 10 characters"),

    images: z
      .array(z.string().url("Each image must be a valid URL"))
      .min(1, "At least one image URL is required"),

    location: z
      .string({ required_error: "Location is required" })
      .trim()
      .min(2, "Location must be at least 2 characters"),

    status: z
      .enum(VALID_STATUSES, {
        errorMap: () => ({ message: `Status must be one of: ${VALID_STATUSES.join(", ")}` }),
      })
      .optional()
      .default("AVAILABLE"),

    targetReturn: z
      .number({ required_error: "Target return is required" })
      .positive("Target return must be a positive number"),

    minInvestment: z
      .number({ required_error: "Minimum investment is required" })
      .positive("Minimum investment must be a positive number"),

    totalPrice: z
      .number({ required_error: "Total price is required" })
      .positive("Total price must be a positive number"),

    totalSize: z
      .string({ required_error: "Total size is required" })
      .trim()
      .min(1, "Total size is required"),

    category: z.enum(VALID_CATEGORIES, {
      required_error: "Category is required",
      errorMap: () => ({ message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` }),
    }),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

const updatePropertySchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").optional(),
    description: z.string().trim().min(10, "Description must be at least 10 characters").optional(),
    images: z.array(z.string().url("Each image must be a valid URL")).min(1, "At least one image URL is required").optional(),
    location: z.string().trim().min(2, "Location must be at least 2 characters").optional(),
    status: z.enum(VALID_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${VALID_STATUSES.join(", ")}` }),
    }).optional(),
    targetReturn: z.number().positive("Target return must be a positive number").optional(),
    minInvestment: z.number().positive("Minimum investment must be a positive number").optional(),
    totalPrice: z.number().positive("Total price must be a positive number").optional(),
    totalSize: z.string().trim().min(1, "Total size is required").optional(),
    category: z.enum(VALID_CATEGORIES, {
      errorMap: () => ({ message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` }),
    }).optional(),
    investors: z.number().int().min(0).optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: z.string().optional() }).passthrough().optional(),
});

module.exports = {
  createPropertySchema,
  updatePropertySchema,
};
