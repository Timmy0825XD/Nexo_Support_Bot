import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { API_ERROR_CODES } from '@mw-platform/shared';

interface ValidationSchema<T> {
  safeParse(value: unknown):
    | { success: true; data: T }
    | { success: false; error: { errors: Array<{ message: string }> } };
}

export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ValidationSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const message = result.error.errors.map((issue) => issue.message).join('; ');

      throw new BadRequestException({
        error: {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message,
        },
      });
    }

    return result.data;
  }
}
