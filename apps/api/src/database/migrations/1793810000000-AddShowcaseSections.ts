import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds showcase_sections to the merchant product catalog.
 *
 * Multi-select: which theme showcase sections this product appears in
 * (e.g. 'rail', 'spotlight'). Stored as comma-separated text via
 * TypeORM simple-array. Nullable — null/empty = default listings only.
 *
 * Hand-written to match apps/api/src/products/product.entity.ts EXACTLY.
 */
export class AddShowcaseSections1793810000000 implements MigrationInterface {
  name = 'AddShowcaseSections1793810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "showcase_sections" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "showcase_sections"`);
  }
}
