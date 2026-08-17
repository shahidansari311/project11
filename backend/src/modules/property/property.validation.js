const { z } = require("zod");

const VALID_STATUSES   = ["AVAILABLE", "SOLD", "UNDER_REVIEW", "COMING_SOON"];
const VALID_CATEGORIES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND"];

const createPropertySchema = z.object({
  body: z.object({
    title: z
      .string({ 
        required_error: "Please provide a title for the property.",
        invalid_type_error: "The title must be text."
      })
      .trim()
      .min(3, "The title is too short. It must be at least 3 characters."),

    description: z
      .string({ 
        required_error: "Please add a description for this property.",
        invalid_type_error: "The description must be text."
      })
      .trim()
      .min(10, "The description must be at least 10 characters to provide enough detail."),

    images: z
      .array(z.string().url("One of the image links is invalid. Please make sure they are correct URLs."))
      .min(1, "Please upload at least one image for the property."),

    location: z
      .string({ 
        required_error: "Please specify the location.",
        invalid_type_error: "The location must be text."
      })
      .trim()
      .min(2, "The location name is too short."),

    status: z
      .enum(VALID_STATUSES, {
        errorMap: () => ({ message: `Please select a valid status (${VALID_STATUSES.join(", ")}).` }),
      })
      .optional()
      .default("AVAILABLE"),

    targetReturn: z.coerce
      .number({ 
        required_error: "Please enter the target return percentage.",
        invalid_type_error: "Target return must be a valid number."
      })
      .positive("The target return must be greater than 0."),

    minInvestment: z.coerce
      .number({ 
        required_error: "Please enter the minimum investment amount.",
        invalid_type_error: "Minimum investment must be a valid number."
      })
      .positive("The minimum investment must be greater than 0."),

    totalPrice: z.coerce
      .number({ 
        required_error: "Please enter the total price of the property.",
        invalid_type_error: "Total price must be a valid number."
      })
      .positive("The total price must be greater than 0."),

    totalSize: z
      .string({ 
        required_error: "Please enter the total size (e.g., '2400 sq ft').",
        invalid_type_error: "The total size must be text."
      })
      .trim()
      .min(1, "Please enter the total size."),

    category: z.enum(VALID_CATEGORIES, {
      required_error: "Please select a category for the property.",
      errorMap: () => ({ message: `Please select a valid category (${VALID_CATEGORIES.join(", ")}).` }),
    }),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

module.exports = { createPropertySchema };
