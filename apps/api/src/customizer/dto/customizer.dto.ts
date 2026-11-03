import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** One homepage-builder section instance. */
export class SectionInstanceDto {
  /** Unique within the merchant's layout, e.g. "sec_hero_1". */
  @IsString()
  @MaxLength(80)
  id!: string;

  /** Must match a section `type` in the theme manifest. */
  @IsString()
  @MaxLength(80)
  type!: string;

  /** Validated against that section's JSON Schema. */
  @IsObject()
  settings!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}

export class SaveSettingsDto {
  /** Validated against the theme's config.schema.json (colors, buttons, text…). */
  @IsObject()
  settings!: Record<string, unknown>;
}

export class SaveSectionsDto {
  /** Ordered layout — order here is the render order on the homepage. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionInstanceDto)
  sections!: SectionInstanceDto[];
}
