-- e-Bike Store - MySQL schema
-- Charset/engine defaults
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS ebikestore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ebikestore;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  description TEXT,
  price_cents INT NOT NULL,
  sku VARCHAR(100),
  stock_qty INT DEFAULT 0,
  image_url VARCHAR(255),
  category_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Customers (simplified)
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  cpf_cnpj VARCHAR(20),
  telefone VARCHAR(30),
  cep VARCHAR(10),
  endereco VARCHAR(200),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(120),
  uf CHAR(2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Carts persisted by session
CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  qty INT NOT NULL,
  price_cents INT NOT NULL,
  UNIQUE KEY uq_cart_product (cart_id, product_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Orders and Quotes (type differentiates). Independent numbering via sequence_counters
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  type ENUM('PEDIDO','ORCAMENTO') NOT NULL,
  customer_id INT,
  subtotal_cents INT NOT NULL,
  discount_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL,
  status ENUM('ABERTO','PAGO','CANCELADO') NOT NULL DEFAULT 'ABERTO',
  cart_snapshot_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  name VARCHAR(200) NOT NULL,
  qty INT NOT NULL,
  price_cents INT NOT NULL,
  total_cents INT NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sequences per type and year for independent numbering
CREATE TABLE IF NOT EXISTS sequence_counters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seq_key VARCHAR(40) NOT NULL,
  year INT NOT NULL,
  value INT NOT NULL,
  UNIQUE KEY uq_seq (seq_key, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Base data
INSERT INTO categories (name, slug) VALUES
  ('Bicicletas','bicicletas'),
  ('Peças','pecas'),
  ('Acessórios','acessorios')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO products (name, slug, description, price_cents, sku, stock_qty, image_url, category_id) VALUES
  ('Bicicleta Pro-X Aro 20 Aero','bicicleta-prox-aro-20-aero','Bicicleta Pro-X para lazer e aventura.', 79990, 'PROX-20-AERO', 10, 'images/proX1.jpeg', (SELECT id FROM categories WHERE slug='bicicletas')),
  ('Bicicleta Oggi 7.0','bicicleta-oggi-7-0','Modelo Oggi para trilhas e cidade.', 329900, 'OGGI-7-0', 5, 'images/bicicleta-Oggi-7.0.jpg', (SELECT id FROM categories WHERE slug='bicicletas')),
  ('Capacete GTA Inmold Branco','capacete-gta-inmold-branco','Proteção e conforto para seus pedais.', 7990, 'GTA-INMOLD-BR', 50, 'images/capacete-ciclismo-pro1.jpg', (SELECT id FROM categories WHERE slug='acessorios')),
  ('Capacete GTA Inmold Preto','capacete-gta-inmold-preto','Proteção e conforto para seus pedais.', 7990, 'GTA-INMOLD-PR', 50, 'images/capacete-ciclismo-pro2.jpg', (SELECT id FROM categories WHERE slug='acessorios')),
  ('Farol Absolute 800 lumens','farol-absolute-800','Iluminação potente para noite.', 6990, 'ABS-800L', 40, 'images/kit-luz-led.jpg', (SELECT id FROM categories WHERE slug='acessorios')),
  ('Camisa de Ciclismo Performance','camisa-ciclismo-performance','Conforto e performance.', 5990, 'CAM-PERF', 30, 'images/camisa-ciclismo-performance.jpg', (SELECT id FROM categories WHERE slug='acessorios')),
  ('Bicicleta Ogg Hacker Sport','bicicleta-ogg-hacker-sport','Hacker Sport para sua trilha.', 219900, 'OGG-HACK-SP', 3, 'images/bicicleta-Oggi-HakerSport.jpg', (SELECT id FROM categories WHERE slug='bicicletas')),
  ('Bicicleta Ogg Hacker Hds','bicicleta-ogg-hacker-hds','Hacker HDS robusta.', 269900, 'OGG-HACK-HDS', 2, 'images/bicicleta-Oggi-HakerHds.jpg', (SELECT id FROM categories WHERE slug='bicicletas'))
ON DUPLICATE KEY UPDATE name = VALUES(name), price_cents = VALUES(price_cents), stock_qty = VALUES(stock_qty), image_url = VALUES(image_url);

