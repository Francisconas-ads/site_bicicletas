import express from 'express';
import Joi from 'joi';

export const cartRouter = express.Router();

// Stateless cart endpoints: calculate totals on the fly
cartRouter.post('/calculate', (req, res) => {
  const schema = Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.number().integer().required(),
          name: Joi.string().required(),
          unitPrice: Joi.number().precision(2).required(),
          quantity: Joi.number().integer().min(1).required(),
          imageUrl: Joi.string().allow('')
        })
      )
      .required(),
    discount: Joi.number().precision(2).min(0).default(0)
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const subtotal = value.items.reduce(
    (acc, it) => acc + Number(it.unitPrice) * Number(it.quantity),
    0
  );
  const discount = Number(value.discount || 0);
  const total = Math.max(0, subtotal - discount);

  res.json({ subtotal, discount, total });
});

