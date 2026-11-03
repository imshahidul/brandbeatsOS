import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class ListThemesQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  /** Industry category, e.g. "fashion". */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  /** Visual style, e.g. "minimal". */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  style?: string;

  /** Presentation mode, e.g. "grid". */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  presentationMode?: string;
}

export class InstallThemeDto {
  /** Theme slug, e.g. "starter-fashion". */
  @IsString()
  @MaxLength(80)
  slug!: string;
}

export class SwitchVersionDto {
  @IsUUID()
  versionId!: string;
}

export class UpdateAutoUpdateDto {
  @IsIn(['manual', 'auto'])
  policy!: 'manual' | 'auto';
}
