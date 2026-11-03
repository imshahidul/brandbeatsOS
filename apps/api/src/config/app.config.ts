import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  refreshExpiresDays: Number(process.env.REFRESH_EXPIRES_DAYS ?? 30),
}));
