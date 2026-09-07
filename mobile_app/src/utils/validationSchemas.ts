import { z } from "zod";

// Phone number: Exactly 10 digits
export const phoneSchema = z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits");

// OTP: Exactly 6 digits
export const otpSchema = z.string().regex(/^[0-9]{6}$/, "OTP must be exactly 6 digits");

// Youtube URL: Must match youtube.com or youtu.be
export const youtubeUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .regex(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/, "Must be a valid YouTube link");

// Builder Property Addition
export const addPropertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title is too long"),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000, "Description is too long"),
  address: z.string().min(3, "Address is required"),
  totalPrice: z.coerce.number({ invalid_type_error: "Price must be a number" }).positive("Price must be greater than 0"),
  totalSize: z.coerce.number({ invalid_type_error: "Size must be a number" }).positive("Size must be greater than 0"),
  targetReturn: z.coerce.number({ invalid_type_error: "Return % must be a number" }).positive("Return % must be greater than 0"),
});

// Builder Price Update
export const updatePriceSchema = z
  .number({ invalid_type_error: "Price must be a valid number" })
  .positive("Price must be greater than 0");

// Investment Unit count
export const investUnitsSchema = z
  .number({ invalid_type_error: "Units must be a number" })
  .int("Units must be a whole number")
  .positive("Units must be greater than 0");
