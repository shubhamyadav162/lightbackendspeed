import { z } from "zod";

// Merchant registration schema
export const merchantRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  confirmPassword: z.string(),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessType: z.string().min(2, "Business type is required"),
  businessAddress: z.string().min(5, "Business address is required"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number format"),
  gstNumber: z.string().optional(),
  websiteUrl: z.string().url("Please enter a valid URL").optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Merchant login schema
export const merchantLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Admin login schema
export const adminLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(1, "Password is required"),
});

// Transaction creation schema
export const transactionSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().default("INR"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits").optional(),
  orderId: z.string().optional(),
  description: z.string().optional(),
  callbackUrl: z.string().url("Please enter a valid callback URL").optional(),
  gatewayPreference: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});

// Gateway credentials schema
export const gatewayCredentialsSchema = z.object({
  gatewayId: z.string().uuid("Invalid gateway ID"),
  apiKey: z.string().min(5, "API key is required"),
  apiSecret: z.string().min(5, "API secret is required"),
  merchantId: z.string().optional(),
  additionalParams: z.record(z.string()).optional(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(1).max(10).default(5),
});

// Settlement account schema
export const settlementAccountSchema = z.object({
  accountNumber: z.string().min(9, "Account number must be at least 9 digits"),
  accountName: z.string().min(2, "Account name is required"),
  bankName: z.string().min(2, "Bank name is required"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  accountType: z.enum(["Savings", "Current"]),
  isDefault: z.boolean().default(false),
});

// Settings update schema
export const settingsUpdateSchema = z.object({
  notificationEmail: z.string().email("Please enter a valid email address").optional(),
  webhookUrl: z.string().url("Please enter a valid webhook URL").optional(),
  settlementFrequency: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
  autoSettlement: z.boolean().optional(),
  minSettlementAmount: z.number().nonnegative().optional(),
}); 