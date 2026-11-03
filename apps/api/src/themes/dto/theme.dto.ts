import {
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateThemeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}

export class PublishVersionDto {
  /** Must be semver and must match manifest.version. */
  @IsString()
  version!: string;

  /** theme.json content — validated against the SDK manifest schema. */
  @IsObject()
  manifest!: Record<string, unknown>;

  /** config.schema.json content — drives the merchant customizer UI. */
  @IsObject()
  configSchema!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changelog?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  packageUrl?: string;
}
