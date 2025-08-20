import knex from 'knex';

const knexClient = knex({
  client: 'mysql2',
  connection: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'example',
    database: process.env.MYSQL_DATABASE || 'ebikestore',
    multipleStatements: true
  },
  pool: { min: 0, max: 10 }
});

export default knexClient;

