import {
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AdminCreateThemeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;
}

export class AdminPublishVersionDto {
  @IsString()
  version!: string;

  @IsObject()
  manifest!: Record<string, unknown>;

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

export class AdminUpdateThemeDto {
  @IsOptional()
  @IsIn(['public', 'private', 'deprecated'])
  visibility?: string;

  @IsOptional()
  @IsIn(['free', 'paid'])
  monetization?: string;
}
