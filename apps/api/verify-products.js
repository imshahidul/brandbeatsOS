/**
 * Products verification — merchant product catalog (tenant-scoped),
 * using in-memory fake repositories (no DB needed).
 */
const assert = require('assert');
const { validate } = require('class-validator');

const { ProductsService } = require('./dist/products/products.service');
const {
  CreateProductDto,
  UpdateProductDto,
} = require('./dist/products/dto/product.dto');

class FakeRepo {
  constructor() { this.rows = []; this.seq = 1; }
  create(d) { return { ...d }; }
  async save(e) {
    const row = { id: e.id ?? `id-${this.seq++}`, createdAt: new Date(), updatedAt: new Date(), ...e };
    const i = this.rows.findIndex((r) => r.id === row.id);
    if (i >= 0) this.rows[i] = { ...this.rows[i], ...row };
    else this.rows.push(row);
    return { ...row };
  }
  async findOne({ where } = {}) {
    const rows = this.rows.filter((r) =>
      Object.entries(where || {}).every(([k, v]) => r[k] === v));
    return rows[0] ? { ...rows[0] } : null;
  }
  async find({ where, order } = {}) {
    let rows = this.rows.filter((r) =>
      Object.entries(where || {}).every(([k, v]) => r[k] === v));
    if (order) {
      const [k, dir] = Object.entries(order)[0];
      rows = [...rows].sort((a, b) => (dir === 'DESC' ? (a[k] < b[k] ? 1 : -1) : (a[k] > b[k] ? 1 : -1)));
    }
    return rows.map((r) => ({ ...r }));
  }
  async remove(e) { this.rows = this.rows.filter((r) => r.id !== e.id); }
}

function dto(Class, data) {
  return Object.assign(new Class(), data);
}

(async () => {
  let pass = 0;
  const ok = (n) => { pass++; console.log(`  PASS ${n}`); };

  const svc = new ProductsService(new FakeRepo());
  const T1 = 'tenant-1';
  const T2 = 'tenant-2';

  // 1. create with defaults
  const p1 = await svc.create(T1, dto(CreateProductDto, { name: 'Silk Panjabi' }));
  assert.strictEqual(p1.tenantId, T1);
  assert.strictEqual(p1.currency, 'BDT');
  assert.strictEqual(p1.collection, 'all');
  assert.strictEqual(p1.isActive, true);
  assert.ok(p1.slug.startsWith('silk-panjabi-'), 'slug generated from name');
  ok('create applies defaults (BDT, collection all, active, slug)');

  // 2. create with full data
  const p2 = await svc.create(T1, dto(CreateProductDto, {
    name: 'Denim Jacket', price: 2499.5, collection: 'Best-Sellers',
    description: 'Classic fit', isActive: false,
  }));
  assert.strictEqual(p2.price, '2499.5');
  assert.strictEqual(p2.collection, 'best-sellers', 'collection normalized');
  assert.strictEqual(p2.isActive, false);
  ok('create stores full product data');

  // 3. listActive hides inactive
  const active = await svc.listActive(T1);
  assert.strictEqual(active.length, 1);
  assert.strictEqual(active[0].id, p1.id);
  ok('listActive returns only active products');

  // 4. collection filter
  await svc.create(T1, dto(CreateProductDto, { name: 'Kurti', collection: 'new-arrivals' }));
  const best = await svc.listActive(T1, 'best-sellers');
  assert.strictEqual(best.length, 0, 'inactive product excluded even in its collection');
  const all = await svc.listActive(T1, 'all');
  assert.strictEqual(all.length, 2);
  ok('collection filter works');

  // 5. tenant isolation
  const other = await svc.create(T2, dto(CreateProductDto, { name: 'Sneakers' }));
  assert.strictEqual((await svc.listActive(T1)).length, 2);
  assert.strictEqual((await svc.listActive(T2)).length, 1);
  assert.strictEqual((await svc.listAll(T1)).length, 3);
  await assert.rejects(() => svc.update(T2, p1.id, dto(UpdateProductDto, { price: 1 })), /Product not found/);
  await assert.rejects(() => svc.remove(T2, p1.id), /Product not found/);
  ok('tenant isolation enforced on read/update/delete');

  // 6. update
  const upd = await svc.update(T1, p1.id, dto(UpdateProductDto, { price: 1899, collection: 'Festive' }));
  assert.strictEqual(upd.price, '1899');
  assert.strictEqual(upd.collection, 'festive');
  assert.strictEqual(upd.name, 'Silk Panjabi', 'untouched fields preserved');
  await assert.rejects(() => svc.update(T1, 'nope', dto(UpdateProductDto, {})), /Product not found/);
  ok('update patches fields, 404 for unknown id');

  // 7. remove
  const del = await svc.remove(T1, p2.id);
  assert.deepStrictEqual(del, { deleted: true });
  assert.strictEqual((await svc.listAll(T1)).length, 2);
  await assert.rejects(() => svc.remove(T1, p2.id), /Product not found/);
  ok('remove deletes, second remove 404s');

  // 8. DTO validation
  const bad1 = await validate(dto(CreateProductDto, {}));
  assert.ok(bad1.some((e) => e.property === 'name'), 'name required');
  const bad2 = await validate(dto(CreateProductDto, { name: 'X', price: -5 }));
  assert.ok(bad2.some((e) => e.property === 'price'), 'price >= 0');
  const good = await validate(dto(CreateProductDto, { name: 'X', price: 10 }));
  assert.strictEqual(good.length, 0);
  ok('DTO validation: name required, price non-negative');

  console.log(`\nALL ${pass} PRODUCTS CHECKS PASSED`);
})().catch((e) => { console.error('FAILED:', e); process.exit(1); });
