import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds the merchant product catalog (products table).
 *
 * Hand-written to match apps/api/src/products/product.entity.ts EXACTLY —
 * same convention as InitialSchema1793702244000.
 */
export class AddProducts1793790000000 implements MigrationInterface {
  name = 'AddProducts1793790000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "description" text,
        "price" numeric(12,2) NOT NULL DEFAULT '0',
        "currency" character varying NOT NULL DEFAULT 'BDT',
        "image_url" character varying,
        "collection" character varying NOT NULL DEFAULT 'all',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_products" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_products_tenant" ON "products" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_products_tenant_collection" ON "products" ("tenant_id", "collection")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
