import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Tên từ 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().optional(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Nhập mật khẩu hiện tại"),
  newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional().nullable(),
  phone: z.string().optional().nullable(),
  // Cho phép URL tuyệt đối (http/https) hoặc path tương đối bắt đầu bằng "/"
  avatar: z
    .string()
    .trim()
    .refine(
      (value) =>
        !value ||
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("/") ||
        value.startsWith("data:image/"),
      {
        message: "Avatar phải là URL hợp lệ, đường dẫn bắt đầu bằng /, hoặc chuỗi base64 (data:image/)",
      },
    )
    .optional()
    .nullable(),
});

export const listingSearchSchema = z.object({
  keyword: z.string().optional(),
  aiQuery: z.string().optional(),
  loaiHinh: z.enum(["sale", "rent"]).optional(),
  category: z.string().optional(),
  provinceId: z.string().optional(),
  districtId: z.string().optional(),
  wardId: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  areaMin: z.coerce.number().optional(),
  areaMax: z.coerce.number().optional(),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  direction: z.string().optional(),
  legalStatus: z.string().optional(),
  projectId: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "area-asc", "area-desc"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ListingSearchInput = z.infer<typeof listingSearchSchema>;
