import express from 'express';
import Joi from 'joi';

export const paymentsRouter = express.Router();

// Mock de pagamento: aprova valores <= 5000, senão requer PIX
paymentsRouter.post('/checkout', (req, res) => {
  const schema = Joi.object({
    amount: Joi.number().positive().required(),
    method: Joi.string().valid('credit_card', 'pix', 'boleto').required(),
    card: Joi.object({ number: Joi.string(), holder: Joi.string(), expMonth: Joi.number(), expYear: Joi.number(), cvv: Joi.string() }).optional()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  if (value.method === 'credit_card' && value.amount <= 5000) {
    return res.json({ status: 'approved', tid: 'MOCK-TID-' + Date.now() });
  }
  if (value.method === 'pix') {
    return res.json({ status: 'pending', qrCode: '00020126360014BR.GOV.BCB.PIX0114mock@pix.com5204000053039865407' + value.amount.toFixed(2) + '5802BR5910E-BikeStore6009SaoPaulo62070503***6304ABCD' });
  }
  return res.json({ status: 'pending', boletoUrl: 'https://exemplo-boleto.local/boleto/' + Date.now() });
});

