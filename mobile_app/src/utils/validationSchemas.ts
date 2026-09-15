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

export const addPropertySchema = z.object({
  title: z.string({ 
      required_error: "Please provide a title for the property.",
      invalid_type_error: "The title must be text."
    })
    .trim()
    .min(3, "The title is too short. It must be at least 3 characters."),
    
  description: z.string({ 
      required_error: "Please add a description for this property.",
      invalid_type_error: "The description must be text."
    })
    .trim()
    .min(10, "The description must be at least 10 characters to provide enough detail."),

  address: z.string().trim().min(2, "The location name is too short."),
  
  totalPrice: z.string()
    .min(1, "Please enter the total price of the property.")
    .regex(/^\d+(\.\d+)?$/, "Total price must be a valid number.")
    .transform(Number)
    .refine(val => val > 0, "The total price must be greater than 0."),
    
  totalSize: z.string()
    .min(1, "Please enter the total area of the property.")
    .regex(/^\d+(\.\d+)?$/, "The total size must be a valid number.")
    .transform(Number)
    .refine(val => val > 0, "The total size must be greater than 0."),
    
  targetReturn: z.string()
    .min(1, "Please enter the target return percentage.")
    .regex(/^\d+(\.\d+)?$/, "Target return must be a valid number.")
    .transform(Number)
    .refine(val => val > 0, "The target return must be greater than 0."),
    
  termPeriodYears: z.string()
    .min(1, "Please enter the investment term period in years.")
    .regex(/^\d+(\.\d+)?$/, "The term period must be a valid number.")
    .transform(Number)
    .refine(val => val > 0, "Term period must be a positive number"),
    
  youtubeVideoUrl: z.string({
      invalid_type_error: "YouTube URL must be a string."
    }).url("Must be a valid YouTube URL").optional().or(z.literal('')),
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
