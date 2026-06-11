import type { ZodIssue } from 'zod';

// Convierte los issues de Zod en un mapa campo → mensaje de error.
// Solo procesa campos que estén en validFields para evitar errores de tipo.
export function mapZodIssuesToFieldErrors<T extends string>(
  issues: ZodIssue[],
  validFields: ReadonlyArray<T>,
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {};
  for (const issue of issues) {
    const field = issue.path[0] as T;
    if ((validFields as ReadonlyArray<unknown>).includes(field)) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
