import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitialSchema1793702244000 } from './migrations/1793702244000-InitialSchema';

const isProd = (process.env.NODE_ENV ?? 'development') === 'production';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        // Dev-only convenience. Production boots with migrationsRun: true
        // and NEVER synchronizes (see src/database/migrations/).
        synchronize: !isProd,
        migrations: [InitialSchema1793702244000],
        migrationsRun: isProd,
      }),
    }),
  ],
})
export class DatabaseModule {}
