import express from 'express';
import Joi from 'joi';

export const shippingRouter = express.Router();

// Mock de cálculo de frete (tabela simples por CEP e peso)
shippingRouter.post('/quote', (req, res) => {
  const schema = Joi.object({
    destinationZip: Joi.string().required(),
    items: Joi.array().items(Joi.object({ quantity: Joi.number().integer().min(1).required(), weightKg: Joi.number().min(0).default(1) })).required()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const totalWeight = value.items.reduce((acc, it) => acc + (it.weightKg || 1) * it.quantity, 0);
  // regra mock: base 15 + 5 por kg, e +10 se CEP for região norte (prefixo 6-8)
  const base = 15;
  const perKg = 5 * totalWeight;
  const cepFirst = Number((value.destinationZip || '').toString().slice(0, 1));
  const regional = [6,7,8,9].includes(cepFirst) ? 10 : 0;
  const price = base + perKg + regional;
  const days = [6,7,8,9].includes(cepFirst) ? 9 : 5;
  res.json({ price, estimatedDays: days, service: 'Entrega Padrão' });
});

