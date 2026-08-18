const { z } = require("zod");

const uploadDocumentSchema = z.object({
  body: z
    .object({
      documentType: z
        .string()
        .trim()
        .transform((val) => val.toUpperCase())
        .optional()
        .default("AADHAAR"),
      frontImageUrl: z.string().optional(),
      backImageUrl: z.string().optional(),
      documentUrl: z.string().optional(),
    })
    .default({ documentType: "AADHAAR" })
    .superRefine((data, ctx) => {
      const docType = (data.documentType || "AADHAAR").toUpperCase();

      if (docType !== "AADHAAR" && docType !== "PAN") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentType"],
          message: "Invalid document type. Only 'AADHAAR' and 'PAN' are allowed.",
        });
        return;
      }

      const hasFront = Boolean(data.frontImageUrl || data.documentUrl);
      const hasBack = Boolean(data.backImageUrl);

      if (docType === "AADHAAR") {
        if (!hasFront && !hasBack) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["frontImage"],
            message: "Please upload both front and back images of your Aadhaar card.",
          });
        } else if (!hasFront) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["frontImage"],
            message: "Please upload the front image of your Aadhaar card.",
          });
        } else if (!hasBack) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["backImage"],
            message: "Please upload the back image of your Aadhaar card.",
          });
        }
      } else if (docType === "PAN") {
        if (!hasFront) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["frontImage"],
            message: "Please upload the front image of your PAN card.",
          });
        }
      }
    }),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

const adminUploadDocumentSchema = z.object({
  body: z
    .object({
      documentType: z
        .string()
        .trim()
        .transform((val) => val.toUpperCase())
        .optional()
        .default("AADHAAR"),
      frontImageUrl: z.string().optional(),
      backImageUrl: z.string().optional(),
      documentUrl: z.string().optional(),
      remark: z.string().trim().optional(),
    })
    .default({ documentType: "AADHAAR" })
    .superRefine((data, ctx) => {
      const docType = (data.documentType || "AADHAAR").toUpperCase();

      if (docType !== "AADHAAR" && docType !== "PAN") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["documentType"],
          message: "Invalid document type. Only 'AADHAAR' and 'PAN' are allowed.",
        });
        return;
      }

      const hasFront = Boolean(data.frontImageUrl || data.documentUrl);
      const hasBack = Boolean(data.backImageUrl);

      if (docType === "AADHAAR") {
        if (!hasFront && !hasBack) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["frontImage"],
            message: "Please upload both front and back images of Aadhaar card.",
          });
        } else if (!hasFront) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["frontImage"],
            message: "Please upload the front image of Aadhaar card.",
          });
        } else if (!hasBack) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["backImage"],
            message: "Please upload the back image of Aadhaar card.",
          });
        }
      } else if (docType === "PAN") {
        if (!hasFront) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["frontImage"],
            message: "Please upload the front image of PAN card.",
          });
        }
      }
    }),
  query: z.object({}).passthrough().optional(),
  params: z.object({ userId: z.string().min(1, "User ID is required") }).passthrough().optional(),
});

const adminVerifyDocumentSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED", "REUPLOAD_REQUIRED"], {
      required_error: "Status is required (APPROVED, REJECTED, or REUPLOAD_REQUIRED)",
      errorMap: () => ({ message: "Status must be one of: APPROVED, REJECTED, REUPLOAD_REQUIRED" }),
    }),
    remark: z.string().trim().optional(),
  }),
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: z.string().min(1, "Document ID is required") }).passthrough().optional(),
});

module.exports = {
  uploadDocumentSchema,
  adminUploadDocumentSchema,
  adminVerifyDocumentSchema,
};
