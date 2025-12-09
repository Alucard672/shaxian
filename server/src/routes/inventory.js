import express from 'express';
import { query, transaction } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ========== 库存调整单 ==========

// 生成调整单号
function generateAdjustmentNumber() {
  const prefix = 'TZ';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${prefix}${year}${month}${day}${sequence}`;
}

// 获取所有库存调整单
router.get('/adjustments', async (req, res, next) => {
  try {
    const { status, type } = req.query;
    let sql = 'SELECT * FROM adjustment_orders WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC';

    const orders = await query(sql, params);
    
    // 获取每个订单的明细
    for (const order of orders) {
      const items = await query('SELECT * FROM adjustment_order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// 获取单个库存调整单
router.get('/adjustments/:id', async (req, res, next) => {
  try {
    const [order] = await query('SELECT * FROM adjustment_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Adjustment order not found' });
    }

    const items = await query('SELECT * FROM adjustment_order_items WHERE order_id = ?', [req.params.id]);
    order.items = items;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 创建库存调整单
router.post('/adjustments', async (req, res, next) => {
  try {
    const { type, adjustmentDate, items, remark, operator, status } = req.body;

    const orderId = uuidv4();
    const orderNumber = generateAdjustmentNumber();

    // 计算总数量
    const totalQuantity = items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);

    await transaction(async (connection) => {
      // 创建调整单
      await connection.execute(
        `INSERT INTO adjustment_orders (id, order_number, type, adjustment_date, total_quantity, status, operator, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, orderNumber, type, adjustmentDate, totalQuantity, status || '草稿', operator, remark || null]
      );

      // 创建调整单明细
      for (const item of items) {
        const itemId = uuidv4();
        await connection.execute(
          `INSERT INTO adjustment_order_items (id, order_id, batch_id, batch_code, product_id, product_name, color_id, color_name, color_code, quantity, unit, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, orderId, item.batchId, item.batchCode, item.productId, item.productName,
            item.colorId, item.colorName, item.colorCode, item.quantity, item.unit, item.remark || null
          ]
        );

        // 如果状态是已完成，更新库存
        if (status === '已完成') {
          await connection.execute(
            'UPDATE batches SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [item.quantity, item.batchId]
          );
        }
      }
    });

    const [order] = await query('SELECT * FROM adjustment_orders WHERE id = ?', [orderId]);
    const orderItems = await query('SELECT * FROM adjustment_order_items WHERE order_id = ?', [orderId]);
    order.items = orderItems;

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// 更新库存调整单
router.put('/adjustments/:id', async (req, res, next) => {
  try {
    const { type, adjustmentDate, items, remark, status } = req.body;

    const [existingOrder] = await query('SELECT status FROM adjustment_orders WHERE id = ?', [req.params.id]);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Adjustment order not found' });
    }

    const totalQuantity = items.reduce((sum, item) => sum + Math.abs(item.quantity), 0);

    await transaction(async (connection) => {
      // 如果从已完成改为草稿，需要恢复库存
      if (existingOrder.status === '已完成' && status === '草稿') {
        const oldItems = await connection.execute('SELECT * FROM adjustment_order_items WHERE order_id = ?', [req.params.id]);
        for (const item of oldItems[0]) {
          await connection.execute(
            'UPDATE batches SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.batch_id]
          );
        }
      }

      // 更新调整单
      await connection.execute(
        `UPDATE adjustment_orders SET type = ?, adjustment_date = ?, total_quantity = ?, status = ?, remark = ? WHERE id = ?`,
        [type, adjustmentDate, totalQuantity, status, remark || null, req.params.id]
      );

      // 删除旧明细
      await connection.execute('DELETE FROM adjustment_order_items WHERE order_id = ?', [req.params.id]);

      // 创建新明细
      for (const item of items) {
        const itemId = uuidv4();
        await connection.execute(
          `INSERT INTO adjustment_order_items (id, order_id, batch_id, batch_code, product_id, product_name, color_id, color_name, color_code, quantity, unit, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, req.params.id, item.batchId, item.batchCode, item.productId, item.productName,
            item.colorId, item.colorName, item.colorCode, item.quantity, item.unit, item.remark || null
          ]
        );

        // 如果状态是已完成，更新库存
        if (status === '已完成') {
          await connection.execute(
            'UPDATE batches SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [item.quantity, item.batchId]
          );
        }
      }
    });

    const [order] = await query('SELECT * FROM adjustment_orders WHERE id = ?', [req.params.id]);
    const orderItems = await query('SELECT * FROM adjustment_order_items WHERE order_id = ?', [req.params.id]);
    order.items = orderItems;

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// ========== 盘点单 ==========

// 生成盘点单号
function generateCheckNumber() {
  const prefix = 'PD';
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${prefix}${year}${month}${day}${sequence}`;
}

// 获取所有盘点单
router.get('/checks', async (req, res, next) => {
  try {
    const { status, warehouse } = req.query;
    let sql = 'SELECT * FROM inventory_check_orders WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (warehouse) {
      sql += ' AND warehouse = ?';
      params.push(warehouse);
    }

    sql += ' ORDER BY created_at DESC';

    const orders = await query(sql, params);
    
    // 获取每个订单的明细
    for (const order of orders) {
      const items = await query('SELECT * FROM inventory_check_items WHERE order_id = ?', [order.id]);
      order.items = items;
      order.progress = {
        total: order.progress_total,
        completed: order.progress_completed
      };
    }

    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// 获取单个盘点单
router.get('/checks/:id', async (req, res, next) => {
  try {
    const [order] = await query('SELECT * FROM inventory_check_orders WHERE id = ?', [req.params.id]);
    if (!order) {
      return res.status(404).json({ error: 'Inventory check order not found' });
    }

    const items = await query('SELECT * FROM inventory_check_items WHERE order_id = ?', [req.params.id]);
    order.items = items;
    order.progress = {
      total: order.progress_total,
      completed: order.progress_completed
    };

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 创建盘点单
router.post('/checks', async (req, res, next) => {
  try {
    const { name, warehouse, planDate, items, remark, operator, status } = req.body;

    const orderId = uuidv4();
    const orderNumber = generateCheckNumber();

    const progressTotal = items.length;
    const progressCompleted = items.filter(item => item.actualQuantity !== null && item.actualQuantity !== undefined).length;
    
    let surplus = 0;
    let deficit = 0;
    for (const item of items) {
      if (item.actualQuantity !== null && item.actualQuantity !== undefined) {
        const diff = item.actualQuantity - item.systemQuantity;
        if (diff > 0) surplus += diff;
        if (diff < 0) deficit += Math.abs(diff);
      }
    }

    await transaction(async (connection) => {
      // 创建盘点单
      await connection.execute(
        `INSERT INTO inventory_check_orders (id, order_number, name, warehouse, plan_date, progress_total, progress_completed, surplus, deficit, status, operator, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, orderNumber, name, warehouse, planDate,
          progressTotal, progressCompleted, surplus, deficit,
          status || '计划中', operator, remark || null
        ]
      );

      // 创建盘点明细
      for (const item of items) {
        const itemId = uuidv4();
        const difference = item.actualQuantity !== null && item.actualQuantity !== undefined
          ? item.actualQuantity - item.systemQuantity
          : null;

        await connection.execute(
          `INSERT INTO inventory_check_items (id, order_id, batch_id, batch_code, product_id, product_name, color_id, color_name, color_code, system_quantity, actual_quantity, difference, unit, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, orderId, item.batchId, item.batchCode, item.productId, item.productName,
            item.colorId, item.colorName, item.colorCode, item.systemQuantity,
            item.actualQuantity || null, difference, item.unit, item.remark || null
          ]
        );
      }
    });

    const [order] = await query('SELECT * FROM inventory_check_orders WHERE id = ?', [orderId]);
    const orderItems = await query('SELECT * FROM inventory_check_items WHERE order_id = ?', [orderId]);
    order.items = orderItems;
    order.progress = {
      total: order.progress_total,
      completed: order.progress_completed
    };

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// 更新盘点单
router.put('/checks/:id', async (req, res, next) => {
  try {
    const { name, warehouse, planDate, items, remark, status } = req.body;

    const progressTotal = items.length;
    const progressCompleted = items.filter(item => item.actualQuantity !== null && item.actualQuantity !== undefined).length;
    
    let surplus = 0;
    let deficit = 0;
    for (const item of items) {
      if (item.actualQuantity !== null && item.actualQuantity !== undefined) {
        const diff = item.actualQuantity - item.systemQuantity;
        if (diff > 0) surplus += diff;
        if (diff < 0) deficit += Math.abs(diff);
      }
    }

    await transaction(async (connection) => {
      // 更新盘点单
      await connection.execute(
        `UPDATE inventory_check_orders SET name = ?, warehouse = ?, plan_date = ?, progress_total = ?, progress_completed = ?, surplus = ?, deficit = ?, status = ?, remark = ? WHERE id = ?`,
        [
          name, warehouse, planDate, progressTotal, progressCompleted, surplus, deficit,
          status, remark || null, req.params.id
        ]
      );

      // 删除旧明细
      await connection.execute('DELETE FROM inventory_check_items WHERE order_id = ?', [req.params.id]);

      // 创建新明细
      for (const item of items) {
        const itemId = uuidv4();
        const difference = item.actualQuantity !== null && item.actualQuantity !== undefined
          ? item.actualQuantity - item.systemQuantity
          : null;

        await connection.execute(
          `INSERT INTO inventory_check_items (id, order_id, batch_id, batch_code, product_id, product_name, color_id, color_name, color_code, system_quantity, actual_quantity, difference, unit, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            itemId, req.params.id, item.batchId, item.batchCode, item.productId, item.productName,
            item.colorId, item.colorName, item.colorCode, item.systemQuantity,
            item.actualQuantity || null, difference, item.unit, item.remark || null
          ]
        );
      }
    });

    const [order] = await query('SELECT * FROM inventory_check_orders WHERE id = ?', [req.params.id]);
    const orderItems = await query('SELECT * FROM inventory_check_items WHERE order_id = ?', [req.params.id]);
    order.items = orderItems;
    order.progress = {
      total: order.progress_total,
      completed: order.progress_completed
    };

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// 删除盘点单
router.delete('/checks/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM inventory_check_orders WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Inventory check order not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;


