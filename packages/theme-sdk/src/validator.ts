import Ajv from 'ajv';
import manifestSchema from './schemas/theme-manifest.schema.json';
import type { SectionDefinition, ThemeManifest } from './types';

const ajv = new Ajv({ allErrors: true, strict: false });

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

function formatErrors(validate: { errors?: Array<{ instancePath: string; message?: string }> | null }): string[] {
  return (validate.errors ?? []).map(
    (e) => `${e.instancePath || '/'} ${e.message ?? 'invalid'}`,
  );
}

/**
 * Validates a theme.json manifest structurally (spec §12).
 * Also enforces cross-field rules the JSON Schema can't express:
 * unique section types, and each section's defaultSettings validating
 * against its own schema.
 */
export function validateManifest(input: unknown): ValidationResult {
  const validate = ajv.compile(manifestSchema);
  const errors: string[] = [];

  if (!validate(input)) {
    errors.push(...formatErrors(validate));
    return { ok: false, errors };
  }

  const manifest = input as unknown as ThemeManifest;

  const seen = new Set<string>();
  for (const section of manifest.sections) {
    if (seen.has(section.type)) {
      errors.push(`/sections duplicate type "${section.type}"`);
    }
    seen.add(section.type);

    const sectionResult = validateSettings(section.schema, section.defaultSettings);
    if (!sectionResult.ok) {
      errors.push(
        `/sections/${section.type} defaultSettings invalid: ${sectionResult.errors.join('; ')}`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Validates arbitrary settings against a JSON Schema (used for merchant
 * theme settings vs config.schema.json, and section instances vs their
 * section schema).
 */
export function validateSettings(
  schema: Record<string, unknown>,
  settings: unknown,
): ValidationResult {
  try {
    const validate = ajv.compile(schema);
    if (!validate(settings)) return { ok: false, errors: formatErrors(validate) };
    return { ok: true, errors: [] };
  } catch (e) {
    return { ok: false, errors: [`schema compile failed: ${(e as Error).message}`] };
  }
}

/** Lists section types declared by a manifest (helper for the customizer). */
export function sectionTypes(manifest: ThemeManifest): string[] {
  return manifest.sections.map((s: SectionDefinition) => s.type);
}

/** Finds a section definition by type. */
export function findSection(
  manifest: ThemeManifest,
  type: string,
): SectionDefinition | undefined {
  return manifest.sections.find((s: SectionDefinition) => s.type === type);
}

export interface SectionInstanceInput {
  id: string;
  type: string;
  settings: unknown;
  hidden?: boolean;
}

/**
 * Validates a full homepage-builder layout against a manifest:
 * unique ids, known section types, per-section settings, maxInstances.
 * Shared by the customizer (active version) and the update staging
 * (target version) so both enforce identical rules.
 */
export function validateSectionLayout(
  manifest: ThemeManifest,
  sections: SectionInstanceInput[],
): ValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const typeCounts = new Map<string, number>();

  for (const inst of sections) {
    if (seenIds.has(inst.id)) {
      errors.push(`Duplicate section id "${inst.id}"`);
      continue;
    }
    seenIds.add(inst.id);

    const def = findSection(manifest, inst.type);
    if (!def) {
      errors.push(`Unknown section type "${inst.type}" for this theme`);
      continue;
    }

    const checked = validateSettings(
      def.schema as Record<string, unknown>,
      inst.settings,
    );
    if (!checked.ok) {
      errors.push(
        `Section "${inst.id}" invalid: ${checked.errors.join('; ')}`,
      );
    }

    const count = (typeCounts.get(inst.type) ?? 0) + 1;
    typeCounts.set(inst.type, count);
    if (def.maxInstances && count > def.maxInstances) {
      errors.push(
        `Too many "${inst.type}" sections (max ${def.maxInstances})`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

export interface SchemaDiff {
  /** Dot-paths present in old schema but missing in new (breaking). */
  removed: string[];
  /** Dot-paths added in new schema. */
  added: string[];
}

/**
 * Shallow-recursive diff of two JSON Schemas' `properties`.
 * Used to explain to merchants what a theme update changes
 * before they approve it (spec §9).
 */
export function diffJsonSchema(
  oldSchema: Record<string, unknown>,
  newSchema: Record<string, unknown>,
  prefix = '',
): SchemaDiff {
  const removed: string[] = [];
  const added: string[] = [];
  const oldProps = ((oldSchema.properties ?? {}) as Record<string, unknown>);
  const newProps = ((newSchema.properties ?? {}) as Record<string, unknown>);

  for (const key of Object.keys(oldProps)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!(key in newProps)) {
      removed.push(path);
    } else {
      const sub = diffJsonSchema(
        oldProps[key] as Record<string, unknown>,
        newProps[key] as Record<string, unknown>,
        path,
      );
      removed.push(...sub.removed);
      added.push(...sub.added);
    }
  }
  for (const key of Object.keys(newProps)) {
    if (!(key in oldProps)) added.push(prefix ? `${prefix}.${key}` : key);
  }
  return { removed, added };
}
