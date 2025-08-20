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

