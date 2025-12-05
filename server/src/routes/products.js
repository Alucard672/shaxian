import express from 'express';
import { query, transaction } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 获取所有商品
router.get('/', async (req, res, next) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// 获取单个商品
router.get('/:id', async (req, res, next) => {
  try {
    const [product] = await query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// 创建商品
router.post('/', async (req, res, next) => {
  try {
    const id = uuidv4();
    const {
      name, code, specification, composition, count, unit, type,
      isWhiteYarn, description
    } = req.body;

    await query(
      `INSERT INTO products (id, name, code, specification, composition, count, unit, type, is_white_yarn, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, code, specification || null, composition || null, count || null, unit, type, isWhiteYarn || false, description || null]
    );

    const [product] = await query('SELECT * FROM products WHERE id = ?', [id]);
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Product code already exists' });
    }
    next(error);
  }
});

// 更新商品
router.put('/:id', async (req, res, next) => {
  try {
    const {
      name, code, specification, composition, count, unit, type,
      isWhiteYarn, description
    } = req.body;

    await query(
      `UPDATE products SET name = ?, code = ?, specification = ?, composition = ?, count = ?, unit = ?, type = ?, is_white_yarn = ?, description = ?
       WHERE id = ?`,
      [name, code, specification || null, composition || null, count || null, unit, type, isWhiteYarn || false, description || null, req.params.id]
    );

    const [product] = await query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Product code already exists' });
    }
    next(error);
  }
});

// 删除商品
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// 获取商品的色号
router.get('/:id/colors', async (req, res, next) => {
  try {
    const colors = await query('SELECT * FROM colors WHERE product_id = ? ORDER BY code', [req.params.id]);
    res.json(colors);
  } catch (error) {
    next(error);
  }
});

// 创建色号
router.post('/:id/colors', async (req, res, next) => {
  try {
    const id = uuidv4();
    const { code, name, colorValue, description, status } = req.body;

    await query(
      `INSERT INTO colors (id, product_id, code, name, color_value, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.params.id, code, name, colorValue || null, description || null, status || '在售']
    );

    const [color] = await query('SELECT * FROM colors WHERE id = ?', [id]);
    res.status(201).json(color);
  } catch (error) {
    next(error);
  }
});

// 获取色号的缸号
router.get('/colors/:colorId/batches', async (req, res, next) => {
  try {
    const batches = await query('SELECT * FROM batches WHERE color_id = ? ORDER BY code', [req.params.colorId]);
    res.json(batches);
  } catch (error) {
    next(error);
  }
});

// 创建缸号
router.post('/colors/:colorId/batches', async (req, res, next) => {
  try {
    const id = uuidv4();
    const {
      code, productionDate, supplierId, supplierName, purchasePrice,
      initialQuantity, stockLocation, remark
    } = req.body;

    await query(
      `INSERT INTO batches (id, color_id, code, production_date, supplier_id, supplier_name, purchase_price, initial_quantity, stock_quantity, stock_location, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, req.params.colorId, code, productionDate || null,
        supplierId || null, supplierName || null, purchasePrice || null,
        initialQuantity, initialQuantity, // stock_quantity 初始等于 initial_quantity
        stockLocation || null, remark || null
      ]
    );

    const [batch] = await query('SELECT * FROM batches WHERE id = ?', [id]);
    res.status(201).json(batch);
  } catch (error) {
    next(error);
  }
});

export default router;

