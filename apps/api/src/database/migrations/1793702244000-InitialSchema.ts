import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial production schema (all 11 tables).
 *
 * Hand-written to match the entities EXACTLY — dev uses TypeORM
 * `synchronize`, but production boots with `migrationsRun: true`
 * (see database.module.ts) and NEVER synchronizes.
 *
 * Future changes: generate with
 *   npm run migration:generate -- src/database/migrations/AddThing
 * and hand-review the diff before committing.
 */
export class InitialSchema1793702244000 implements MigrationInterface {
  name = 'InitialSchema1793702244000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // uuid PK defaults need this extension on a fresh database.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "roles" text array NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actor_user_id" uuid,
        "tenant_id" uuid,
        "action" character varying NOT NULL,
        "meta" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "logo_url" text,
        "favicon_url" text,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tenant_members" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "role" character varying NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant_members" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenant_members_tenant_user" UNIQUE ("tenant_id", "user_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "themes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" character varying NOT NULL,
        "name" character varying NOT NULL,
        "visibility" character varying NOT NULL DEFAULT 'private',
        "monetization" character varying NOT NULL DEFAULT 'free',
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_themes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_themes_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "theme_versions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "theme_id" uuid NOT NULL,
        "version" character varying NOT NULL,
        "manifest" jsonb NOT NULL,
        "config_schema" jsonb NOT NULL,
        "package_url" text,
        "changelog" text NOT NULL DEFAULT '',
        "min_platform_version" character varying NOT NULL,
        "status" character varying NOT NULL DEFAULT 'draft',
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_theme_versions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_theme_versions_theme_version" UNIQUE ("theme_id", "version")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "theme_installs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "theme_id" uuid NOT NULL,
        "active_version_id" uuid NOT NULL,
        "auto_update_policy" character varying NOT NULL DEFAULT 'manual',
        "installed_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_theme_installs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_theme_installs_tenant_theme" UNIQUE ("tenant_id", "theme_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "merchant_theme_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "install_id" uuid NOT NULL,
        "settings" jsonb NOT NULL DEFAULT '{}',
        "sections" jsonb NOT NULL DEFAULT '[]',
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchant_theme_settings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_merchant_theme_settings_install" UNIQUE ("install_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "published_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "install_id" uuid NOT NULL,
        "version_id" uuid NOT NULL,
        "settings" jsonb NOT NULL,
        "sections" jsonb NOT NULL,
        "label" text,
        "published_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_published_snapshots" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "update_stagings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "install_id" uuid NOT NULL,
        "target_version_id" uuid NOT NULL,
        "staged_settings" jsonb NOT NULL DEFAULT '{}',
        "staged_sections" jsonb NOT NULL DEFAULT '[]',
        "issues" jsonb NOT NULL DEFAULT '[]',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_update_stagings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_update_stagings_install" UNIQUE ("install_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse order of creation (no FK constraints exist, but stay tidy).
    await queryRunner.query(`DROP TABLE IF EXISTS "update_stagings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "published_snapshots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "merchant_theme_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "theme_installs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "theme_versions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "themes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenant_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_log"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
