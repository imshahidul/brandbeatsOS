import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // Dev-only convenience. Production MUST use migrations (see docs/SECURITY.md).
        synchronize: (process.env.NODE_ENV ?? 'development') !== 'production',
      }),
    }),
  ],
})
export class DatabaseModule {}
