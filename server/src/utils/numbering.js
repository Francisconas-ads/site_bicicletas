import knex from '../db/knex.js';

export async function generateSequentialNumber(key) {
  return await knex.transaction(async (trx) => {
    const row = await trx('sequences').where({ key }).forUpdate().first();
    if (!row) {
      throw new Error(`Sequence not found: ${key}`);
    }
    const next = Number(row.current) + 1;
    await trx('sequences').where({ key }).update({ current: next });
    const padded = String(next).padStart(6, '0');
    return `${row.prefix}-${padded}`;
  });
}

