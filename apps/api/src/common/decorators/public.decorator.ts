export const IS_PUBLIC_KEY = 'isPublic';

import { SetMetadata } from '@nestjs/common';

/** Marks a route as not requiring a JWT (e.g. login, register, health). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
