import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { mapZodIssuesToFieldErrors } from '../../lib/form-utils';

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
});

describe('mapZodIssuesToFieldErrors', () => {
  it('maps each invalid field to its Zod error message', () => {
    const result = registerSchema.safeParse({ email: 'not-an-email', password: '123', first_name: 'Hernán' });
    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = mapZodIssuesToFieldErrors(result.error.issues, ['email', 'password', 'first_name'] as const);
      expect(errors.email).toBeTruthy();
      expect(errors.password).toBeTruthy();
      expect(errors.first_name).toBeUndefined();
    }
  });

  it('ignores issues for fields not present in validFields', () => {
    const result = registerSchema.safeParse({ email: 'bad', password: '123', first_name: '' });
    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = mapZodIssuesToFieldErrors(result.error.issues, ['email'] as const);
      expect(Object.keys(errors)).toEqual(['email']);
    }
  });

  it('returns an empty object when there are no issues', () => {
    const errors = mapZodIssuesToFieldErrors([], ['email', 'password'] as const);
    expect(errors).toEqual({});
  });
});
