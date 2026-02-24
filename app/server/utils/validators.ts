import 'server-only';

import { z } from 'zod';
import { ORPCError } from '@orpc/server';

export function validateMany<T>(
  items: unknown[],
  schema: z.ZodType<T>,
  entityName: string = 'item'
): T[] {
  return items.map((item) => {
    const result = schema.safeParse(item);
    if (!result.success) {
      console.error(`${entityName} validation failed:`, result.error);
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: `Failed to validate ${entityName} data`,
      });
    }
    return result.data;
  });
}

type ValidatedShape<Input, T> = {
  [K in keyof Input]: Input[K] extends unknown[] ? T[] : Input[K];
};

export function validatePaginated<
  T,
  Input extends Record<string, unknown[] | number>,
>(
  data: Input,
  schema: z.ZodType<T>,
  entityName: string = 'item'
): ValidatedShape<Input, T> {
  const result = {} as ValidatedShape<Input, T>;

  for (const key in data) {
    const value = data[key];
    (result as Record<string, unknown>)[key] = Array.isArray(value)
      ? validateMany(value, schema, entityName)
      : value;
  }

  return result;
}

export function validateOne<T>(
  item: unknown,
  schema: z.ZodType<T>,
  entityName: string = 'item'
): T {
  const result = schema.safeParse(item);
  if (!result.success) {
    console.error(`${entityName} validation failed:`, result.error);
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: `Failed to validate ${entityName} data`,
    });
  }
  return result.data;
}
