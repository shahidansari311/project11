const { z } = require("zod");

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "CANCELLED"];

/**
 * POST /user/property/:propertyId/invest
 * User selects how many units they want to buy.
 */
const createInvestmentSchema = z.object({
  body: z.object({
    units: z.coerce
      .number({
        required_error: "Please specify the number of units you want to invest in.",
        invalid_type_error: "Units must be a valid number.",
      })
      .int("Units must be a whole number.")
      .min(1, "You must invest in at least 1 unit."),
  }),
  params: z.object({ propertyId: z.string().min(1, "Property ID is required.") }).passthrough(),
  query: z.object({}).passthrough().optional(),
});

/**
 * PATCH /admin/investments/:id/reject
 * Admin can optionally add a remark explaining the rejection.
 */
const rejectInvestmentSchema = z.object({
  body: z.object({
    remark: z.string().max(500, "Remark must be at most 500 characters.").optional(),
  }),
  params: z.object({ id: z.string().min(1, "Investment ID is required.") }).passthrough(),
  query: z.object({}).passthrough().optional(),
});

/**
 * GET /admin/investments  (supports query filters)
 */
const listInvestmentsSchema = z.object({
  query: z.object({
    page:       z.coerce.number().int().min(1).optional(),
    limit:      z.coerce.number().int().min(1).max(100).optional(),
    status:     z.enum(VALID_STATUSES, {
      errorMap: () => ({ message: `Status must be one of: ${VALID_STATUSES.join(", ")}` }),
    }).optional(),
    propertyId: z.string().optional(),
    userId:     z.string().optional(),
  }).passthrough(),
  body:   z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

module.exports = {
  createInvestmentSchema,
  rejectInvestmentSchema,
  listInvestmentsSchema,
};
