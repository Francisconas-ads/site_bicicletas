import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createRequire } from 'module';
import { productsRouter } from './routes/products.js';
import { cartRouter } from './routes/cart.js';
import { ordersRouter } from './routes/orders.js';
import { shippingRouter } from './routes/shipping.js';
import { paymentsRouter } from './routes/payments.js';
import { requireAdmin } from './middleware/auth.js';

const app = express();

const allowedOrigin = process.env.APP_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Produtos: criação (POST) sem token; edição/exclusão com token
app.use(
  '/api/products',
  (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'DELETE' || req.method === 'PATCH') {
      return requireAdmin(req, res, next);
    }
    return next();
  },
  productsRouter
);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/payments', paymentsRouter);

const port = Number(process.env.APP_PORT || 3001);
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});

