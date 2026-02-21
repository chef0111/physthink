import z from 'zod';
import { CourseSchema } from '@/lib/validations';

export type CourseDTO = z.infer<typeof CourseSchema>;
