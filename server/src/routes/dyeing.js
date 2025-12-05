import express from 'express';
import { query, transaction } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 生成加工单号
function generateOrderNumber() {
  const prefix = 'JG';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${prefix}${year}${month}${day}${sequence}`;
}

// 获取所有染色加工单
router.get('/', async (req, res, next) => {
  try {
    const { status, productId } = req.query;
    let sql = 'SELECT * FROM dyeing_orders WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (productId) {
      sql += ' AND product_id = ?';
      params.push(productId);
    }

    sql += ' ORDER BY created_at DESC';

    const orders = await query(sql, params);
    
    // 获取每个订单的明细
    for (const order of orders) {
      const items = await query('SELECT * FROM dyeing_order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// 获取单个染色加工单
router.get('/:id', async (req, res, next) => {
  try {
    const [order] = await query('SELECT * FROM dyeing_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Dyeing order not found' });
    }

    const items = await query('SELECT * FROM dyeing_order_items WHERE order_id = ?', [req.params.id]);
    order.items = items;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 创建染色加工单
router.post('/', async (req, res, next) => {
  try {
    const {
      productId, productName, greyBatchId, greyBatchCode, items,
      factoryId, factoryName, factoryPhone, shipmentDate, expectedCompletionDate,
      processingPrice, remark, operator, status
    } = req.body;

    const orderId = uuidv4();
    const orderNumber = generateOrderNumber();

    // 计算总金额
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = totalQuantity * processingPrice;

    await transaction(async (connection) => {
      // 创建染色加工单
      await connection.execute(
        `INSERT INTO dyeing_orders (id, order_number, product_id, product_name, grey_batch_id, grey_batch_code, factory_id, factory_name, factory_phone, shipment_date, expected_completion_date, processing_price, total_amount, status, operator, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, orderNumber, productId, productName, greyBatchId, greyBatchCode,
          factoryId || null, factoryName, factoryPhone || null,
          shipmentDate, expectedCompletionDate, processingPrice, totalAmount,
          status || '待发货', operator || null, remark || null
        ]
      );

      // 创建加工单明细
      for (const item of items) {
        const itemId = uuidv4();
        await connection.execute(
          `INSERT INTO dyeing_order_items (id, order_id, target_color_id, target_color_code, target_color_name, target_color_value, quantity)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, orderId, item.targetColorId, item.targetColorCode, item.targetColorName,
            item.targetColorValue || null, item.quantity
          ]
        );
      }
    });

    const [order] = await query('SELECT * FROM dyeing_orders WHERE id = ?', [orderId]);
    const orderItems = await query('SELECT * FROM dyeing_order_items WHERE order_id = ?', [orderId]);
    order.items = orderItems;

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// 更新染色加工单
router.put('/:id', async (req, res, next) => {
  try {
    const {
      productId, productName, greyBatchId, greyBatchCode, items,
      factoryId, factoryName, factoryPhone, shipmentDate, expectedCompletionDate, actualCompletionDate,
      processingPrice, remark, status
    } = req.body;

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = totalQuantity * processingPrice;

    await transaction(async (connection) => {
      // 更新染色加工单
      await connection.execute(
        `UPDATE dyeing_orders SET product_id = ?, product_name = ?, grey_batch_id = ?, grey_batch_code = ?, factory_id = ?, factory_name = ?, factory_phone = ?, shipment_date = ?, expected_completion_date = ?, actual_completion_date = ?, processing_price = ?, total_amount = ?, status = ?, remark = ?
         WHERE id = ?`,
        [
          productId, productName, greyBatchId, greyBatchCode,
          factoryId || null, factoryName, factoryPhone || null,
          shipmentDate, expectedCompletionDate, actualCompletionDate || null,
          processingPrice, totalAmount, status, remark || null, req.params.id
        ]
      );

      // 删除旧明细
      await connection.execute('DELETE FROM dyeing_order_items WHERE order_id = ?', [req.params.id]);

      // 创建新明细
      for (const item of items) {
        const itemId = uuidv4();
        await connection.execute(
          `INSERT INTO dyeing_order_items (id, order_id, target_color_id, target_color_code, target_color_name, target_color_value, quantity)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, req.params.id, item.targetColorId, item.targetColorCode, item.targetColorName,
            item.targetColorValue || null, item.quantity
          ]
        );
      }
    });

    const [order] = await query('SELECT * FROM dyeing_orders WHERE id = ?', [req.params.id]);
    const orderItems = await query('SELECT * FROM dyeing_order_items WHERE order_id = ?', [req.params.id]);
    order.items = orderItems;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 删除染色加工单
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM dyeing_orders WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Dyeing order not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

