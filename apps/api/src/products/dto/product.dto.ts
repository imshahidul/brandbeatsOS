import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Allowed showcase section keys (extensible). */
export const SHOWCASE_SECTIONS = ['rail', 'spotlight'] as const;

export class CreateProductDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false })
  imageUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false })
  onBodyImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  collection?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsIn(SHOWCASE_SECTIONS, { each: true })
  showcaseSections?: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false })
  imageUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false })
  onBodyImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  collection?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsIn(SHOWCASE_SECTIONS, { each: true })
  showcaseSections?: string[];
}
