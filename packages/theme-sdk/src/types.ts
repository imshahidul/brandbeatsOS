/**
 * Theme Development Framework — shared contract between Brand Beats OS
 * and every storefront theme. Themes are static, sandboxed artifacts:
 * a manifest + JSON Schemas + assets. No server-side code execution.
 */

export type ThemeVisibility = 'public' | 'private' | 'deprecated';

/** Monetization is a stub in v0.1 — paid enforcement lands in Phase 3+. */
export type Monetization = 'free' | 'paid';

export type PresentationMode =
  | 'rail'
  | 'spotlight'
  | 'hybrid'
  | 'grid'
  | 'editorial'
  | 'showcase';

/** A reusable, configurable storefront section (spec §6). */
export interface SectionDefinition {
  /** Machine name, e.g. "hero-banner". Unique within the theme. */
  type: string;
  /** Human-readable name shown in the customizer. */
  name: string;
  description?: string;
  /** JSON Schema (draft-07) describing this section's settings. */
  schema: Record<string, unknown>;
  /** Defaults; MUST validate against `schema`. */
  defaultSettings: Record<string, unknown>;
  /** Max instances per storefront (e.g. 1 for header/footer). Omit = unlimited. */
  maxInstances?: number;
}

/** The theme.json manifest every theme must ship (spec §12). */
export interface ThemeManifest {
  /** Slug, e.g. "modern-fashion". Must match the theme's registered slug. */
  id: string;
  name: string;
  /** Semver, e.g. "1.2.0". Immutable once published. */
  version: string;
  description?: string;
  /** Industry categories, e.g. ["fashion", "streetwear"]. Expandable. */
  categories: string[];
  /** Visual styles, e.g. ["minimal", "premium"]. */
  styles: string[];
  /** Which Universal Category Presentation Engine modes this theme supports. */
  presentationModes: PresentationMode[];
  sections: SectionDefinition[];
  /** Minimum Brand Beats OS platform version, semver. */
  minPlatformVersion: string;
  /** BCP-47 locales shipped, e.g. ["en", "bn"]. */
  locales: string[];
  author?: string;
}

/** Merchant customization for one theme install (stored separately from the package). */
export interface MerchantThemeSettings {
  /** Top-level settings validated against the theme's config.schema.json. */
  settings: Record<string, unknown>;
  /** Ordered section instances on the storefront. */
  sections: SectionInstance[];
}

export interface SectionInstance {
  /** Unique id within the merchant's layout. */
  id: string;
  /** Must reference a `type` from the theme manifest's sections. */
  type: string;
  /** Validated against that section's `schema`. */
  settings: Record<string, unknown>;
  hidden?: boolean;
}
