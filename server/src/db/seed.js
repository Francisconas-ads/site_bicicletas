import 'dotenv/config';
import knex from './knex.js';

async function seed() {
  const has = await knex('products').first();
  if (has) {
    console.log('Products already seeded');
    return;
  }

  await knex('products').insert([
    {
      sku: 'PROX-ARO20-AERO',
      name: 'Bicicleta Pro-X Aro 20 Aero',
      description: 'Bicicleta infantil aro 20 com design aerodinâmico',
      price: 799.90,
      category: 'bicicletas',
      brand: 'Pro-X',
      image_url: 'images/proX1.jpeg'
    },
    {
      sku: 'OGGI-7-0',
      name: 'Bicicleta Oggi 7.0',
      description: 'Bike para trilhas leves, com ótimo custo-benefício',
      price: 3299.00,
      category: 'bicicletas',
      brand: 'Oggi',
      image_url: 'images/bicicleta-Oggi-7.0.jpg'
    },
    {
      sku: 'CAP-GTA-WHITE',
      name: 'Capacete GTA Inmold Branco',
      description: 'Capacete leve e resistente, ideal para uso urbano',
      price: 79.90,
      category: 'acessorios',
      brand: 'GTA',
      image_url: 'images/capacete-ciclismo-pro1.jpg'
    }
  ]);
}

seed()
  .then(async () => {
    console.log('Seed completed');
    await knex.destroy();
  })
  .catch(async (err) => {
    console.error(err);
    await knex.destroy();
    process.exit(1);
  });

