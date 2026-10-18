/**
 * Request validation schemas with Zod — AquaLoop Phase 2
 */
import { z } from 'zod'

export const registerSchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
})

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Invalid email address format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
})

/**
 * Middleware factory to validate request body with a Zod schema
 * @param {z.ZodSchema} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || []
      const formattedErrors = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return res.status(400).json({
        error: 'Validation failed',
        details: formattedErrors,
      })
    }
    req.body = result.data
    next()
  }
}
