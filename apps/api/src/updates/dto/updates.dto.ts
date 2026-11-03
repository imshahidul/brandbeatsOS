import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class TargetVersionDto {
  @IsUUID()
  targetVersionId!: string;
}

export class StageSettingsDto {
  @IsObject()
  settings!: Record<string, unknown>;
}

export class StageSectionsDto {
  @IsObject({ each: true })
  sections!: Array<Record<string, unknown>>;
}

export class RollbackDto {
  @IsUUID()
  snapshotId!: string;
}

export class UpdateQueryDto {
  @IsOptional()
  @IsString()
  installId?: string;
}
