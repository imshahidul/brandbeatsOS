import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthPayload } from '../guards/jwt-auth.guard';

/** Extracts the verified JWT payload attached by JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPayload => {
    return ctx.switchToHttp().getRequest().user;
  },
);
