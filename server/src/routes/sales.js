import express from 'express';
import { query, transaction } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 生成销售单号
function generateOrderNumber() {
  const prefix = 'XS';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${prefix}${year}${month}${day}${sequence}`;
}

// 获取所有销售单
router.get('/', async (req, res, next) => {
  try {
    const { status, customerId, startDate, endDate } = req.query;
    let sql = 'SELECT * FROM sales_orders WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (customerId) {
      sql += ' AND customer_id = ?';
      params.push(customerId);
    }
    if (startDate) {
      sql += ' AND sales_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND sales_date <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY created_at DESC';

    const orders = await query(sql, params);
    
    // 获取每个订单的明细
    for (const order of orders) {
      const items = await query('SELECT * FROM sales_order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// 获取单个销售单
router.get('/:id', async (req, res, next) => {
  try {
    const [order] = await query('SELECT * FROM sales_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }

    const items = await query('SELECT * FROM sales_order_items WHERE order_id = ?', [req.params.id]);
    order.items = items;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 创建销售单
router.post('/', async (req, res, next) => {
  try {
    const {
      customerId, customerName, salesDate, expectedDate, items, receivedAmount, remark, operator, status
    } = req.body;

    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();

    // 计算总金额
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const unpaidAmount = totalAmount - (receivedAmount || 0);

    await transaction(async (connection) => {
      // 创建销售单
      await connection.execute(
        `INSERT INTO sales_orders (id, order_number, customer_id, customer_name, sales_date, expected_date, total_amount, received_amount, unpaid_amount, status, operator, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, orderNumber, customerId, customerName, salesDate, expectedDate || null,
          totalAmount, receivedAmount || 0, unpaidAmount, status || '草稿', operator || null, remark || null
        ]
      );

      // 创建销售单明细
      for (const item of items) {
        const itemId = uuidv4();
        const amount = item.quantity * item.price;
        await connection.execute(
          `INSERT INTO sales_order_items (id, order_id, product_id, product_name, product_code, color_id, color_name, color_code, batch_id, batch_code, quantity, unit, price, amount, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, orderId, item.productId, item.productName, item.productCode,
            item.colorId, item.colorName, item.colorCode,
            item.batchId, item.batchCode, item.quantity, item.unit, item.price, amount,
            item.remark || null
          ]
        );

        // 如果状态是已出库，减少库存
        if (status === '已出库') {
          await connection.execute(
            'UPDATE batches SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.batchId]
          );
        }
      }
    });

    const [order] = await query('SELECT * FROM sales_orders WHERE id = ?', [orderId]);
    const orderItems = await query('SELECT * FROM sales_order_items WHERE order_id = ?', [orderId]);
    order.items = orderItems;

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// 更新销售单
router.put('/:id', async (req, res, next) => {
  try {
    const {
      customerId, customerName, salesDate, expectedDate, items, receivedAmount, remark, status
    } = req.body;

    // 检查订单状态
    const [existingOrder] = await query('SELECT status FROM sales_orders WHERE id = ?', [req.params.id]);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    if (existingOrder.status !== '草稿') {
      return res.status(400).json({ error: 'Only draft orders can be updated' });
    }

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const unpaidAmount = totalAmount - (receivedAmount || 0);

    await transaction(async (connection) => {
      // 更新销售单
      await connection.execute(
        `UPDATE sales_orders SET customer_id = ?, customer_name = ?, sales_date = ?, expected_date = ?, total_amount = ?, received_amount = ?, unpaid_amount = ?, status = ?, remark = ?
         WHERE id = ?`,
        [
          customerId, customerName, salesDate, expectedDate || null,
          totalAmount, receivedAmount || 0, unpaidAmount, status || '草稿', remark || null, req.params.id
        ]
      );

      // 删除旧明细
      await connection.execute('DELETE FROM sales_order_items WHERE order_id = ?', [req.params.id]);

      // 创建新明细
      for (const item of items) {
        const itemId = uuidv4();
        const amount = item.quantity * item.price;
        await connection.execute(
          `INSERT INTO sales_order_items (id, order_id, product_id, product_name, product_code, color_id, color_name, color_code, batch_id, batch_code, quantity, unit, price, amount, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, req.params.id, item.productId, item.productName, item.productCode,
            item.colorId, item.colorName, item.colorCode,
            item.batchId, item.batchCode, item.quantity, item.unit, item.price, amount,
            item.remark || null
          ]
        );
      }
    });

    const [order] = await query('SELECT * FROM sales_orders WHERE id = ?', [req.params.id]);
    const orderItems = await query('SELECT * FROM sales_order_items WHERE order_id = ?', [req.params.id]);
    order.items = orderItems;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 删除销售单
router.delete('/:id', async (req, res, next) => {
  try {
    const [order] = await query('SELECT status FROM sales_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    if (order.status !== '草稿') {
      return res.status(400).json({ error: 'Only draft orders can be deleted' });
    }

    const result = await query('DELETE FROM sales_orders WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// 检查库存
router.post('/check-stock', async (req, res, next) => {
  try {
    const { batchId, quantity } = req.body;
    const [batch] = await query('SELECT stock_quantity FROM batches WHERE id = ?', [batchId]);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const available = batch.stock_quantity >= quantity;
    res.json({ available, stockQuantity: batch.stock_quantity });
  } catch (error) {
    next(error);
  }
});

export default router;


