const { z } = require("zod");

const VALID_STATUSES   = ["AVAILABLE", "SOLD", "UNDER_REVIEW", "COMING_SOON", "PENDING_APPROVAL", "REJECTED", "DRAFT"];
const VALID_CATEGORIES = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "LAND", "OTHERS"];

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
      .array(z.string().url("One of the image links is invalid. Please make sure they are correct URLs."), {
        required_error: "Please upload at least one image.",
        invalid_type_error: "Images must be a list of valid URLs."
      })
      .min(1, "Please upload at least one image for the property."),

    location: z.union([
      z.string().trim().min(2, "The location name is too short."),
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        placeName: z.string().optional()
      })
    ], {
      required_error: "Please specify the location.",
      invalid_type_error: "The location must be text or a valid location object."
    }),

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

    // minInvestment is NOT accepted from admin — always auto-computed as perUnitPrice (1 unit)
    totalPrice: z.coerce
      .number({ 
        required_error: "Please enter the total price of the property.",
        invalid_type_error: "Total price must be a valid number."
      })
      .positive("The total price must be greater than 0."),

    // totalSize is numeric area in sq.ft (e.g. 2000)
    totalSize: z.coerce
      .number({
        required_error: "Please enter the total area of the property (e.g. 2000 for 2000 sq.ft).",
        invalid_type_error: "The total size must be a number.",
      })
      .positive("The total size must be greater than 0."),

    category: z.enum(VALID_CATEGORIES, {
      required_error: "Please select a category for the property.",
      errorMap: () => ({ message: `Please select a valid category (${VALID_CATEGORIES.join(", ")}).` }),
    }),
    youtubeVideoUrl: z.string({
      invalid_type_error: "YouTube URL must be a string."
    }).url("Must be a valid YouTube URL").optional().or(z.literal('')),
    
    termPeriodYears: z.coerce
      .number({
        required_error: "Please enter the investment term period in years.",
        invalid_type_error: "The term period must be a valid number."
      })
      .positive("Term period must be a positive number"),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

const updatePropertySchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").optional(),
    description: z.string().trim().min(10, "Description must be at least 10 characters").optional(),
    images: z.array(z.string().url("Each image must be a valid URL")).min(1, "At least one image URL is required").optional(),
    location: z.union([
      z.string().trim().min(2, "The location name is too short."),
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        postalCode: z.string().optional(),
        placeName: z.string().optional()
      })
    ]).optional(),
    status: z.enum(VALID_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${VALID_STATUSES.join(", ")}` }),
    }).optional(),
    targetReturn: z.coerce.number().positive("Target return must be a positive number").optional(),
    // minInvestment is auto-computed — strip from update payload
    totalPrice: z.coerce.number().positive("Total price must be a positive number").optional(),
    // totalSize accepts numeric area in sq.ft
    totalSize: z.coerce.number().positive("Total size must be a positive number").optional(),
    category: z.enum(VALID_CATEGORIES, {
      errorMap: () => ({ message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` }),
    }).optional(),
    investors: z.coerce.number().int().min(0).optional(),
    clearImages: z.coerce.boolean().optional(),
    youtubeVideoUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
    termPeriodYears: z.coerce.number().positive("Term period must be a positive number").optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: z.string().optional() }).passthrough().optional(),
});

const safeDraftNumber = () =>
  z.union([
    z.number(),
    z.string().transform((val) => (val.trim() === "" ? undefined : Number(val))),
    z.null()
  ])
  .optional()
  .transform((val) => (val === null || val === undefined || isNaN(val) ? undefined : val));

const draftPropertySchema = z.object({
  body: z.object({
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    images: z.array(z.string()).optional(),
    location: z.any().optional(),
    status: z.literal("DRAFT"),
    targetReturn: safeDraftNumber(),
    totalPrice: safeDraftNumber(),
    totalSize: safeDraftNumber(),
    category: z.enum(VALID_CATEGORIES).optional(),
    youtubeVideoUrl: z.string().optional().or(z.literal('')),
    termPeriodYears: safeDraftNumber(),
  }).passthrough(),
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: z.string().optional() }).passthrough().optional(),
});


const queryPropertySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    status: z.enum(VALID_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${VALID_STATUSES.join(", ")}` }),
    }).optional(),
    category: z.enum(VALID_CATEGORIES, {
      errorMap: () => ({ message: `Category must be one of: ${VALID_CATEGORIES.join(", ")}` }),
    }).optional(),
    search: z.string().optional(),
    location: z.string().optional(),
    area: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
  }).passthrough(),
});

const addPriceHistorySchema = z.object({
  body: z.object({
    price: z.coerce.number().positive("Price must be a positive number"),
  }),
  params: z.object({ id: z.string().optional() }).passthrough().optional(),
});

const updatePriceHistorySchema = z.object({
  body: z.object({
    price: z.coerce.number().positive("Price must be a positive number"),
  }),
  params: z.object({ historyId: z.string().optional() }).passthrough().optional(),
});

const verifyPropertySchema = z.object({
  body: z.object({
    status: z.enum(["AVAILABLE", "REJECTED"]),
    adminRemark: z.string().optional()
  })
});

module.exports = {
  createPropertySchema,
  updatePropertySchema,
  draftPropertySchema,
  queryPropertySchema,
  addPriceHistorySchema,
  updatePriceHistorySchema,
  verifyPropertySchema,
  };
