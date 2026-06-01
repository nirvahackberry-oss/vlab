import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

export const userCreateSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.string().min(1).optional(),
  credits: z.number().int().min(0).optional(),
  status: z.string().optional(),
  enabled: z.boolean().optional(),
  courseId: z.string().nullable().optional(),
  semesterIds: z.array(z.string()).optional(),
});

export const bulkUploadOptionsSchema = z.object({
  defaultRole: z.string().optional(),
  defaultCourseId: z.string().nullable().optional(),
  defaultSemesterIds: z.array(z.string()).optional(),
});

export const userUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.string().optional(),
    credits: z.number().int().min(0).optional(),
    status: z.string().optional(),
    enabled: z.boolean().optional(),
    courseId: z.string().nullable().optional(),
    semesterIds: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "No fields to update");

export const roleCreateSchema = z.object({
  name: z.string().min(2).max(60),
  defaultCredits: z.number().int().min(0),
  description: z.string().max(200).optional(),
});

export const roleUpdateSchema = z
  .object({
    name: z.string().min(2).max(60).optional(),
    defaultCredits: z.number().int().min(0).optional(),
    description: z.string().max(200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "No fields to update");

export const creditAdjustSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, "Amount cannot be zero"),
  reason: z.string().min(1, "Reason required").max(200),
});

export const courseCreateSchema = z.object({
  code: z.string().min(2).max(20),
  title: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const semesterCreateSchema = z.object({
  courseId: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().positive().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const semesterUpdateSchema = semesterCreateSchema
  .omit({ courseId: true })
  .partial()
  .extend({ courseId: z.string().optional() });

export const labCreateSchema = z.object({
  id: z.string().optional(),
  semesterId: z.string().min(1),
  title: z.string().min(2),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  durationMinutes: z.number().int().positive().optional(),
  credits: z.number().int().min(0).optional(),
  complexity: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  taskDefinition: z.string().optional(),
});

export const labUpdateSchema = labCreateSchema.partial();
