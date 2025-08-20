import express from 'express';
import knex from '../db/knex.js';
import Joi from 'joi';

export const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
  try {
    const { q, category, sort } = req.query;
    let query = knex('products').where({ active: 1 });
    if (q) {
      query = query.andWhere((qb) => {
        qb.where('name', 'like', `%${q}%`).orWhere('description', 'like', `%${q}%`).orWhere('sku', 'like', `%${q}%`);
      });
    }
    if (category) {
      query = query.andWhere('category', category);
    }
    if (sort === 'price-asc') {
      query = query.orderBy('price', 'asc');
    } else if (sort === 'price-desc') {
      query = query.orderBy('price', 'desc');
    } else {
      query = query.orderBy('created_at', 'desc');
    }
    const rows = await query.select('id', 'sku', 'name', 'price', 'image_url', 'category', 'brand');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar produtos' });
  }
});

productsRouter.get('/:id', async (req, res) => {
  try {
    const product = await knex('products').where({ id: req.params.id }).first();
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

const productSchema = Joi.object({
  sku: Joi.string().trim().min(2).required(),
  name: Joi.string().trim().min(2).required(),
  description: Joi.string().allow(''),
  price: Joi.number().precision(2).positive().required(),
  category: Joi.string().allow(''),
  brand: Joi.string().allow(''),
  image_url: Joi.string().allow(''),
  active: Joi.boolean().optional()
});

productsRouter.post('/', async (req, res) => {
  const { error, value } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  try {
    const existing = await knex('products').where({ sku: value.sku }).first();
    if (existing) return res.status(409).json({ error: 'SKU já cadastrado' });
    const now = knex.fn.now();
    const [id] = await knex('products').insert({ ...value, created_at: now, updated_at: now });
    const inserted = await knex('products').where({ id }).first();
    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
});

productsRouter.put('/:id', async (req, res) => {
  const { error, value } = productSchema.fork(['sku', 'name', 'price'], (s) => s.optional()).validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  try {
    const product = await knex('products').where({ id: req.params.id }).first();
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    if (value.sku && value.sku !== product.sku) {
      const skuExists = await knex('products').where({ sku: value.sku }).andWhereNot({ id: req.params.id }).first();
      if (skuExists) return res.status(409).json({ error: 'SKU já cadastrado' });
    }
    await knex('products').where({ id: req.params.id }).update({ ...value, updated_at: knex.fn.now() });
    const updated = await knex('products').where({ id: req.params.id }).first();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

