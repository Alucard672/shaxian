import express from 'express';
import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ========== 客户管理 ==========

// 获取所有客户
router.get('/customers', async (req, res, next) => {
  try {
    const customers = await query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(customers);
  } catch (error) {
    next(error);
  }
});

// 获取单个客户
router.get('/customers/:id', async (req, res, next) => {
  try {
    const [customer] = await query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// 创建客户
router.post('/customers', async (req, res, next) => {
  try {
    const id = uuidv4();
    const {
      name, code, contactPerson, phone, address, type, creditLimit, status, remark
    } = req.body;

    await query(
      `INSERT INTO customers (id, name, code, contact_person, phone, address, type, credit_limit, status, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, code, contactPerson || null, phone || null, address || null,
        type || '直客', creditLimit || null, status || '正常', remark || null
      ]
    );

    const [customer] = await query('SELECT * FROM customers WHERE id = ?', [id]);
    res.status(201).json(customer);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Customer code already exists' });
    }
    next(error);
  }
});

// 更新客户
router.put('/customers/:id', async (req, res, next) => {
  try {
    const {
      name, code, contactPerson, phone, address, type, creditLimit, status, remark
    } = req.body;

    await query(
      `UPDATE customers SET name = ?, code = ?, contact_person = ?, phone = ?, address = ?, type = ?, credit_limit = ?, status = ?, remark = ?
       WHERE id = ?`,
      [
        name, code, contactPerson || null, phone || null, address || null,
        type, creditLimit || null, status, remark || null, req.params.id
      ]
    );

    const [customer] = await query('SELECT * FROM customers WHERE id = ?', [req.params.id]);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Customer code already exists' });
    }
    next(error);
  }
});

// 删除客户
router.delete('/customers/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM customers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ========== 供应商管理 ==========

// 获取所有供应商
router.get('/suppliers', async (req, res, next) => {
  try {
    const suppliers = await query('SELECT * FROM suppliers ORDER BY created_at DESC');
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
});

// 获取单个供应商
router.get('/suppliers/:id', async (req, res, next) => {
  try {
    const [supplier] = await query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

// 创建供应商
router.post('/suppliers', async (req, res, next) => {
  try {
    const id = uuidv4();
    const {
      name, code, contactPerson, phone, address, type, settlementCycle, status, remark
    } = req.body;

    await query(
      `INSERT INTO suppliers (id, name, code, contact_person, phone, address, type, settlement_cycle, status, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, code, contactPerson || null, phone || null, address || null,
        type || '厂家', settlementCycle || '现结', status || '合作中', remark || null
      ]
    );

    const [supplier] = await query('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.status(201).json(supplier);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Supplier code already exists' });
    }
    next(error);
  }
});

// 更新供应商
router.put('/suppliers/:id', async (req, res, next) => {
  try {
    const {
      name, code, contactPerson, phone, address, type, settlementCycle, status, remark
    } = req.body;

    await query(
      `UPDATE suppliers SET name = ?, code = ?, contact_person = ?, phone = ?, address = ?, type = ?, settlement_cycle = ?, status = ?, remark = ?
       WHERE id = ?`,
      [
        name, code, contactPerson || null, phone || null, address || null,
        type, settlementCycle, status, remark || null, req.params.id
      ]
    );

    const [supplier] = await query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Supplier code already exists' });
    }
    next(error);
  }
});

// 删除供应商
router.delete('/suppliers/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

