import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds garment spec fields to the merchant product catalog.
 *
 * Hand-written to match apps/api/src/products/product.entity.ts EXACTLY —
 * same convention as AddProducts1793790000000.
 */
export class AddProductSpecs1793800000000 implements MigrationInterface {
  name = 'AddProductSpecs1793800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" ADD "on_body_image_url" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD "material" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD "color" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD "size" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "size"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "color"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "material"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "on_body_image_url"`);
  }
}
