import express from 'express';
import { query, transaction } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ========== 应收账款 ==========

// 获取所有应收账款
router.get('/receivables', async (req, res, next) => {
  try {
    const { customerId, status } = req.query;
    let sql = 'SELECT * FROM account_receivables WHERE 1=1';
    const params = [];

    if (customerId) {
      sql += ' AND customer_id = ?';
      params.push(customerId);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY account_date DESC';

    const receivables = await query(sql, params);
    res.json(receivables);
  } catch (error) {
    next(error);
  }
});

// 创建应收账款
router.post('/receivables', async (req, res, next) => {
  try {
    const {
      customerId, customerName, salesOrderId, salesOrderNumber,
      receivableAmount, receivedAmount, accountDate
    } = req.body;

    const id = uuidv4();
    const unpaidAmount = receivableAmount - (receivedAmount || 0);
    const status = unpaidAmount > 0 ? '未结清' : '已结清';

    await query(
      `INSERT INTO account_receivables (id, customer_id, customer_name, sales_order_id, sales_order_number, receivable_amount, received_amount, unpaid_amount, account_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, customerId, customerName, salesOrderId, salesOrderNumber,
        receivableAmount, receivedAmount || 0, unpaidAmount, accountDate, status
      ]
    );

    const [receivable] = await query('SELECT * FROM account_receivables WHERE id = ?', [id]);
    res.status(201).json(receivable);
  } catch (error) {
    next(error);
  }
});

// 获取收款记录
router.get('/receivables/:id/receipts', async (req, res, next) => {
  try {
    const receipts = await query(
      'SELECT * FROM receipt_records WHERE account_receivable_id = ? ORDER BY receipt_date DESC',
      [req.params.id]
    );
    res.json(receipts);
  } catch (error) {
    next(error);
  }
});

// 创建收款记录
router.post('/receivables/:id/receipts', async (req, res, next) => {
  try {
    const { amount, paymentMethod, receiptDate, operator, remark } = req.body;

    const receiptId = uuidv4();

    await transaction(async (connection) => {
      // 创建收款记录
      await connection.execute(
        `INSERT INTO receipt_records (id, account_receivable_id, amount, payment_method, receipt_date, operator, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [receiptId, req.params.id, amount, paymentMethod || '转账', receiptDate, operator, remark || null]
      );

      // 更新应收账款
      await connection.execute(
        `UPDATE account_receivables 
         SET received_amount = received_amount + ?, unpaid_amount = receivable_amount - (received_amount + ?), status = CASE WHEN (receivable_amount - (received_amount + ?)) > 0 THEN '未结清' ELSE '已结清' END
         WHERE id = ?`,
        [amount, amount, amount, req.params.id]
      );
    });

    const [receipt] = await query('SELECT * FROM receipt_records WHERE id = ?', [receiptId]);
    res.status(201).json(receipt);
  } catch (error) {
    next(error);
  }
});

// ========== 应付账款 ==========

// 获取所有应付账款
router.get('/payables', async (req, res, next) => {
  try {
    const { supplierId, status } = req.query;
    let sql = 'SELECT * FROM account_payables WHERE 1=1';
    const params = [];

    if (supplierId) {
      sql += ' AND supplier_id = ?';
      params.push(supplierId);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY account_date DESC';

    const payables = await query(sql, params);
    res.json(payables);
  } catch (error) {
    next(error);
  }
});

// 创建应付账款
router.post('/payables', async (req, res, next) => {
  try {
    const {
      supplierId, supplierName, purchaseOrderId, purchaseOrderNumber,
      payableAmount, paidAmount, accountDate
    } = req.body;

    const id = uuidv4();
    const unpaidAmount = payableAmount - (paidAmount || 0);
    const status = unpaidAmount > 0 ? '未结清' : '已结清';

    await query(
      `INSERT INTO account_payables (id, supplier_id, supplier_name, purchase_order_id, purchase_order_number, payable_amount, paid_amount, unpaid_amount, account_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, supplierId, supplierName, purchaseOrderId, purchaseOrderNumber,
        payableAmount, paidAmount || 0, unpaidAmount, accountDate, status
      ]
    );

    const [payable] = await query('SELECT * FROM account_payables WHERE id = ?', [id]);
    res.status(201).json(payable);
  } catch (error) {
    next(error);
  }
});

// 获取付款记录
router.get('/payables/:id/payments', async (req, res, next) => {
  try {
    const payments = await query(
      'SELECT * FROM payment_records WHERE account_payable_id = ? ORDER BY payment_date DESC',
      [req.params.id]
    );
    res.json(payments);
  } catch (error) {
    next(error);
  }
});

// 创建付款记录
router.post('/payables/:id/payments', async (req, res, next) => {
  try {
    const { amount, paymentMethod, paymentDate, operator, remark } = req.body;

    const paymentId = uuidv4();

    await transaction(async (connection) => {
      // 创建付款记录
      await connection.execute(
        `INSERT INTO payment_records (id, account_payable_id, amount, payment_method, payment_date, operator, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [paymentId, req.params.id, amount, paymentMethod || '转账', paymentDate, operator, remark || null]
      );

      // 更新应付账款
      await connection.execute(
        `UPDATE account_payables 
         SET paid_amount = paid_amount + ?, unpaid_amount = payable_amount - (paid_amount + ?), status = CASE WHEN (payable_amount - (paid_amount + ?)) > 0 THEN '未结清' ELSE '已结清' END
         WHERE id = ?`,
        [amount, amount, amount, req.params.id]
      );
    });

    const [payment] = await query('SELECT * FROM payment_records WHERE id = ?', [paymentId]);
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
});

export default router;

