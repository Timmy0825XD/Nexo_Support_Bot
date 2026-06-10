import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { API_ERROR_CODES } from '@mw-platform/shared';
import { IS_PUBLIC_KEY } from './public.decorator.js';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const expectedKey = this.configService.get<string>('INTERNAL_API_KEY');

    if (!expectedKey) {
      throw new UnauthorizedException({
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: 'API is not configured for authenticated access.',
        },
      });
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();

    const authHeader = request.headers.authorization;
    const bearerKey =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : undefined;
    const headerKey = request.headers['x-internal-api-key'];
    const providedKey = bearerKey ?? (typeof headerKey === 'string' ? headerKey : undefined);

    if (!providedKey || providedKey !== expectedKey) {
      throw new UnauthorizedException({
        error: {
          code: API_ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid or missing API key.',
        },
      });
    }

    return true;
  }
}
