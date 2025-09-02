import { z } from 'zod';

export const PollOptionSchema = z.object({
  text: z.string()
    .min(1, 'Option text is required')
    .max(200, 'Option text must be less than 200 characters')
    .transform(text => text.trim())
});

export const CreatePollSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters')
    .transform(title => title.trim()),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .transform(desc => desc?.trim() || ''),
  options: z.array(PollOptionSchema)
    .min(2, 'At least 2 options are required')
    .max(10, 'Maximum 10 options allowed'),
  expiresAt: z.string()
    .datetime('Invalid date format')
    .refine(date => new Date(date) > new Date(), 'Expiration date must be in the future')
    .optional(),
  isActive: z.boolean().default(true)
});

export const VoteSchema = z.object({
  pollId: z.string().uuid('Invalid poll ID'),
  optionId: z.string().uuid('Invalid option ID')
});

export const UserSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
  email: z.string().email('Invalid email format'),
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .transform(name => name.trim())
});

// Type exports for TypeScript
export type CreatePollInput = z.infer<typeof CreatePollSchema>;
export type VoteInput = z.infer<typeof VoteSchema>;
export type UserInput = z.infer<typeof UserSchema>;
export type PollOptionInput = z.infer<typeof PollOptionSchema>;
