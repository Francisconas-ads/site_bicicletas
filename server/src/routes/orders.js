import express from 'express';
import Joi from 'joi';
import knex from '../db/knex.js';
import { generateSequentialNumber } from '../utils/numbering.js';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';

export const ordersRouter = express.Router();

const customerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().allow(''),
  phone: Joi.string().allow(''),
  document: Joi.string().allow(''),
  address: Joi.string().allow('')
});

const orderSchema = Joi.object({
  type: Joi.string().valid('order', 'quote').required(),
  customer: customerSchema.required(),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().required(),
        name: Joi.string().required(),
        unitPrice: Joi.number().precision(2).required(),
        quantity: Joi.number().integer().min(1).required()
      })
    )
    .min(1)
    .required(),
  discount: Joi.number().precision(2).min(0).default(0)
});

ordersRouter.post('/', async (req, res) => {
  const { error, value } = orderSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  try {
    const created = await knex.transaction(async (trx) => {
      const [customerId] = await trx('customers').insert(value.customer).then((ids) => ids);

      const key = value.type === 'order' ? 'order' : 'quote';
      const number = await generateSequentialNumber(key);

      const subtotal = value.items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
      const discount = Number(value.discount || 0);
      const total = Math.max(0, subtotal - discount);

      const [orderId] = await trx('orders')
        .insert({
          type: value.type,
          number,
          customer_id: customerId,
          subtotal,
          discount,
          total,
          status: value.type === 'order' ? 'open' : 'draft'
        })
        .then((ids) => ids);

      const itemsRows = value.items.map((it) => ({
        order_id: orderId,
        product_id: it.productId,
        quantity: it.quantity,
        unit_price: it.unitPrice,
        total_price: it.unitPrice * it.quantity
      }));
      await trx('order_items').insert(itemsRows);

      return { orderId, number };
    });

    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar pedido/orçamento' });
  }
});

ordersRouter.get('/:id/pdf', async (req, res) => {
  try {
    const order = await knex('orders as o')
      .join('customers as c', 'c.id', 'o.customer_id')
      .where('o.id', req.params.id)
      .select(
        'o.*',
        'c.name as customer_name',
        'c.email as customer_email',
        'c.phone as customer_phone',
        'c.document as customer_document',
        'c.address as customer_address'
      )
      .first();
    if (!order) return res.status(404).json({ error: 'Registro não encontrado' });

    const items = await knex('order_items as oi')
      .join('products as p', 'p.id', 'oi.product_id')
      .where('oi.order_id', order.id)
      .select('p.sku', 'p.name', 'oi.quantity', 'oi.unit_price', 'oi.total_price');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${order.number}.pdf`);
    doc.pipe(res);

    const isOrder = order.type === 'order';
    const title = isOrder ? 'Pedido de Compra' : 'Orçamento';
    const companyName = process.env.COMPANY_NAME || 'e-Bike Store';
    const companyDoc = process.env.COMPANY_DOC || '';
    const companyAddress = process.env.COMPANY_ADDRESS || '';

    doc.fontSize(18).text(companyName);
    doc.fontSize(10).text(companyDoc);
    doc.text(companyAddress);
    doc.moveDown();
    doc.fontSize(16).text(`${title} ${order.number}`);
    doc.fontSize(10).text(`Data: ${dayjs(order.created_at).format('DD/MM/YYYY HH:mm')}`);
    doc.moveDown();

    doc.fontSize(12).text('Cliente:');
    doc.text(order.customer_name);
    if (order.customer_document) doc.text(`Documento: ${order.customer_document}`);
    if (order.customer_phone) doc.text(`Telefone: ${order.customer_phone}`);
    if (order.customer_email) doc.text(`E-mail: ${order.customer_email}`);
    if (order.customer_address) doc.text(`Endereço: ${order.customer_address}`);
    doc.moveDown();

    doc.fontSize(12).text('Itens:');
    doc.moveDown(0.5);
    items.forEach((it) => {
      doc.text(`${it.sku} - ${it.name}`);
      const unit = Number(it.unit_price);
      const total = Number(it.total_price);
      doc.text(`Qtd: ${it.quantity}  |  Unit: R$ ${unit.toFixed(2)}  |  Total: R$ ${total.toFixed(2)}`);
      doc.moveDown(0.5);
    });
    doc.moveDown();
    doc.text(`Subtotal: R$ ${Number(order.subtotal).toFixed(2)}`);
    doc.text(`Desconto: R$ ${Number(order.discount).toFixed(2)}`);
    doc.fontSize(14).text(`Total: R$ ${Number(order.total).toFixed(2)}`);

    if (!isOrder) {
      doc.moveDown();
      doc.fontSize(9).text('Validade do orçamento: 7 dias. Sujeito à disponibilidade de estoque.');
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar PDF' });
  }
});

