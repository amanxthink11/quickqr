import { z } from 'zod';
import { validateDestinationUrl } from './url-safety';

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address')
    .max(255, 'Email cannot exceed 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
      'Password must contain letters and at least one number or special character'
    ),
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  organizationName: z
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(80, 'Organization name cannot exceed 80 characters')
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password too long'),
});

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(80, 'Organization name cannot exceed 80 characters'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Slug must be at least 3 characters')
    .max(50, 'Slug cannot exceed 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
    .optional(),
});

export const createQRCodeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(120, 'Title cannot exceed 120 characters'),
  type: z.enum([
    'DYNAMIC_URL',
    'STATIC_URL',
    'UPI',
    'WHATSAPP',
    'VCARD',
    'WIFI',
    'EMAIL',
    'TEXT',
  ]).default('DYNAMIC_URL'),
  styling: z.record(z.string(), z.unknown()),
  destinationUrl: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateDestinationUrl(val).isValid,
      { message: 'Invalid destination URL: must be valid http(s) and not a private or loopback address' }
    ),
  scanLimit: z.number().int().positive().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateQRCodeInputZod = z.infer<typeof createQRCodeSchema>;
