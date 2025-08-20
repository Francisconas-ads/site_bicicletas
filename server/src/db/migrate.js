import 'dotenv/config';
import knex from './knex.js';

async function up() {
  const hasProducts = await knex.schema.hasTable('products');
  if (!hasProducts) {
    await knex.schema.createTable('products', (table) => {
      table.increments('id').primary();
      table.string('sku').unique().notNullable();
      table.string('name').notNullable();
      table.text('description');
      table.decimal('price', 12, 2).notNullable();
      table.string('category').index();
      table.string('brand');
      table.string('image_url');
      table.boolean('active').notNullable().defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  }

  const hasCustomers = await knex.schema.hasTable('customers');
  if (!hasCustomers) {
    await knex.schema.createTable('customers', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.string('email');
      table.string('phone');
      table.string('document');
      table.string('address');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasOrders = await knex.schema.hasTable('orders');
  if (!hasOrders) {
    await knex.schema.createTable('orders', (table) => {
      table.increments('id').primary();
      table.string('type').notNullable().comment('order or quote');
      table.string('number').notNullable().unique();
      table.integer('customer_id').unsigned().references('id').inTable('customers');
      table.decimal('subtotal', 12, 2).notNullable();
      table.decimal('discount', 12, 2).notNullable().defaultTo(0);
      table.decimal('total', 12, 2).notNullable();
      table.string('status').notNullable().defaultTo('new');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  }

  const hasOrderItems = await knex.schema.hasTable('order_items');
  if (!hasOrderItems) {
    await knex.schema.createTable('order_items', (table) => {
      table.increments('id').primary();
      table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products');
      table.integer('quantity').unsigned().notNullable();
      table.decimal('unit_price', 12, 2).notNullable();
      table.decimal('total_price', 12, 2).notNullable();
    });
  }

  const hasSequences = await knex.schema.hasTable('sequences');
  if (!hasSequences) {
    await knex.schema.createTable('sequences', (table) => {
      table.string('key').primary();
      table.integer('current').unsigned().notNullable().defaultTo(0);
      table.string('prefix').notNullable();
    });
    await knex('sequences').insert([
      { key: 'order', current: 0, prefix: 'PED' },
      { key: 'quote', current: 0, prefix: 'ORC' }
    ]);
  }
}

async function down() {
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('products');
  await knex.schema.dropTableIfExists('sequences');
}

const direction = process.argv[2] || 'up';
up()
  .then(() => {
    if (direction === 'down') {
      return down();
    }
  })
  .then(() => {
    console.log('Migration completed');
    return knex.destroy();
  })
  .catch(async (err) => {
    console.error(err);
    await knex.destroy();
    process.exit(1);
  });

