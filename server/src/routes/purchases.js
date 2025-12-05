import express from 'express';
import { query, transaction } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 生成进货单号
function generateOrderNumber() {
  const prefix = 'CG';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${prefix}${year}${month}${day}${sequence}`;
}

// 获取所有进货单
router.get('/', async (req, res, next) => {
  try {
    const { status, supplierId, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM purchase_orders WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (supplierId) {
      sql += ' AND supplier_id = ?';
      params.push(supplierId);
    }
    if (startDate) {
      sql += ' AND purchase_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND purchase_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY created_at DESC';

    const orders = await query(sql, params);
    
    // 获取每个订单的明细
    for (const order of orders) {
      const items = await query('SELECT * FROM purchase_order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// 获取单个进货单
router.get('/:id', async (req, res, next) => {
  try {
    const [order] = await query('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    const items = await query('SELECT * FROM purchase_order_items WHERE order_id = ?', [req.params.id]);
    order.items = items;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 创建进货单
router.post('/', async (req, res, next) => {
  try {
    const {
      supplierId, supplierName, purchaseDate, expectedDate, items, paidAmount, remark, operator, status
    } = req.body;

    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();

    // 计算总金额
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const unpaidAmount = totalAmount - (paidAmount || 0);

    await transaction(async (connection) => {
      // 创建进货单
      await connection.execute(
        `INSERT INTO purchase_orders (id, order_number, supplier_id, supplier_name, purchase_date, expected_date, total_amount, paid_amount, unpaid_amount, status, operator, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, orderNumber, supplierId, supplierName, purchaseDate, expectedDate || null,
          totalAmount, paidAmount || 0, unpaidAmount, status || '草稿', operator || null, remark || null
        ]
      );

      // 创建进货单明细
      for (const item of items) {
        const itemId = uuidv4();
        const amount = item.quantity * item.price;
        await connection.execute(
          `INSERT INTO purchase_order_items (id, order_id, product_id, product_name, product_code, color_id, color_name, color_code, batch_code, quantity, unit, price, amount, production_date, stock_location, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, orderId, item.productId, item.productName, item.productCode,
            item.colorId || null, item.colorName || null, item.colorCode || null,
            item.batchCode, item.quantity, item.unit, item.price, amount,
            item.productionDate || null, item.stockLocation || null, item.remark || null
          ]
        );
      }
    });

    const [order] = await query('SELECT * FROM purchase_orders WHERE id = ?', [orderId]);
    const orderItems = await query('SELECT * FROM purchase_order_items WHERE order_id = ?', [orderId]);
    order.items = orderItems;

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// 更新进货单
router.put('/:id', async (req, res, next) => {
  try {
    const {
      supplierId, supplierName, purchaseDate, expectedDate, items, paidAmount, remark, status
    } = req.body;

    // 检查订单状态
    const [existingOrder] = await query('SELECT status FROM purchase_orders WHERE id = ?', [req.params.id]);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    if (existingOrder.status !== '草稿') {
      return res.status(400).json({ error: 'Only draft orders can be updated' });
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const unpaidAmount = totalAmount - (paidAmount || 0);

    await transaction(async (connection) => {
      // 更新进货单
      await connection.execute(
        `UPDATE purchase_orders SET supplier_id = ?, supplier_name = ?, purchase_date = ?, expected_date = ?, total_amount = ?, paid_amount = ?, unpaid_amount = ?, status = ?, remark = ?
         WHERE id = ?`,
        [
          supplierId, supplierName, purchaseDate, expectedDate || null,
          totalAmount, paidAmount || 0, unpaidAmount, status || '草稿', remark || null, req.params.id
        ]
      );

      // 删除旧明细
      await connection.execute('DELETE FROM purchase_order_items WHERE order_id = ?', [req.params.id]);

      // 创建新明细
      for (const item of items) {
        const itemId = uuidv4();
        const amount = item.quantity * item.price;
        await connection.execute(
          `INSERT INTO purchase_order_items (id, order_id, product_id, product_name, product_code, color_id, color_name, color_code, batch_code, quantity, unit, price, amount, production_date, stock_location, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, req.params.id, item.productId, item.productName, item.productCode,
            item.colorId || null, item.colorName || null, item.colorCode || null,
            item.batchCode, item.quantity, item.unit, item.price, amount,
            item.productionDate || null, item.stockLocation || null, item.remark || null
          ]
        );
      }
    });

    const [order] = await query('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
    const orderItems = await query('SELECT * FROM purchase_order_items WHERE order_id = ?', [req.params.id]);
    order.items = orderItems;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 删除进货单
router.delete('/:id', async (req, res, next) => {
  try {
    const [order] = await query('SELECT status FROM purchase_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    if (order.status !== '草稿') {
      return res.status(400).json({ error: 'Only draft orders can be deleted' });
    }

    const result = await query('DELETE FROM purchase_orders WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

