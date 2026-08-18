const { z } = require("zod");

const uploadDocumentSchema = z.object({
  body: z.object({
    documentType: z.string().trim().min(2, "Document type is required").default("KYC"),
    documentUrl: z.string().min(1, "Document file or URL is required"),
    documentNo: z.string().trim().optional(),
  }).default({ documentType: "KYC" }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

const adminUpdateDocumentStatusSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED", "REUPLOAD_REQUIRED"], {
      required_error: "Status is required",
      errorMap: () => ({ message: "Status must be one of: PENDING, APPROVED, REJECTED, REUPLOAD_REQUIRED" }),
    }),
    remark: z.string().trim().optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: z.string().min(1, "Document ID is required") }).passthrough().optional(),
});

module.exports = {
  uploadDocumentSchema,
  adminUpdateDocumentStatusSchema,
};
