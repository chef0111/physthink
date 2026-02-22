import z from 'zod';
import { courseLevels, courseStatus } from '@/common/constants';

export const UsernameSchema = z
  .string()
  .min(3, { message: 'Username must be at least 3 characters long.' })
  .max(30, { message: 'Username cannot exceed 30 characters.' })
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores.',
  })
  .regex(/[a-zA-Z]/, {
    message: 'Username must contain at least one letter.',
  })
  .refine((val) => !['me', 'admin', 'user'].includes(val.toLowerCase()), {
    message: "Usernames like 'admin', 'user' or 'me' are restricted.",
  });

export const PasswordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long.' })
  .max(100, { message: 'Password cannot exceed 100 characters.' })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter.',
  })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter.',
  })
  .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
  .regex(/[^a-zA-Z0-9]/, {
    message: 'Password must contain at least one special character.',
  });

export const LoginSchema = z.object({
  email: z
    .email({ message: 'Invalid email address.' })
    .min(1, { message: 'Email is required.' }),
});

export const OTPSchema = z.object({
  otp: z
    .string()
    .min(6, { message: 'Your one-time password must be 6 numbers.' }),
});

export const CourseSchema = z.object({
  title: z
    .string()
    .min(3, { message: 'Course title must be at least 3 characters long.' })
    .max(100, { message: 'Course title cannot exceed 100 characters.' }),
  description: z
    .string()
    .min(3, {
      message: 'Course description must be at least 3 characters long.',
    })
    .max(200, { message: 'Course description cannot exceed 200 characters.' }),
  thumbnail: z.string().min(1, { message: 'Thumbnail is required.' }),
  duration: z.coerce
    .number()
    .min(1, { message: 'Course duration must be at least 1 hour.' })
    .max(500, { message: 'Course duration cannot exceed 500 hours.' }),
  level: z.enum(courseLevels, { message: 'Invalid course level.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  readme: z.string().min(3, {
    message: 'Course README must be at least 3 characters long.',
  }),
  slug: z
    .string()
    .min(3, { message: 'Course slug must be at least 3 characters long.' }),
  status: z.enum(courseStatus, { message: 'Invalid course status.' }),
});

export const QueryParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  query: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
});
