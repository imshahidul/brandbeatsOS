import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InitialSchema1793702244000 } from './migrations/1793702244000-InitialSchema';
import { AddProducts1793790000000 } from './migrations/1793790000000-AddProducts';
import { AddProductSpecs1793800000000 } from './migrations/1793800000000-AddProductSpecs';
import { AddShowcaseSections1793810000000 } from './migrations/1793810000000-AddShowcaseSections';

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
        migrations: [InitialSchema1793702244000, AddProducts1793790000000, AddProductSpecs1793800000000, AddShowcaseSections1793810000000],
        migrationsRun: isProd,
      }),
    }),
  ],
})
export class DatabaseModule {}
