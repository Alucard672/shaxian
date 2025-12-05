import express from 'express';
import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// ========== 门店信息 ==========

// 获取门店信息
router.get('/store', async (req, res, next) => {
  try {
    const [store] = await query('SELECT * FROM store_info LIMIT 1');
    if (!store) {
      // 创建默认记录
      await query('INSERT INTO store_info (name) VALUES (?)', ['']);
      const [newStore] = await query('SELECT * FROM store_info LIMIT 1');
      return res.json(newStore);
    }
    res.json(store);
  } catch (error) {
    next(error);
  }
});

// 更新门店信息
router.put('/store', async (req, res, next) => {
  try {
    const { name, code, address, phone, email, fax, postalCode, remark } = req.body;

    // 检查是否存在记录
    const [existing] = await query('SELECT id FROM store_info LIMIT 1');
    
    if (existing) {
      await query(
        `UPDATE store_info SET name = ?, code = ?, address = ?, phone = ?, email = ?, fax = ?, postal_code = ?, remark = ? WHERE id = ?`,
        [name || null, code || null, address || null, phone || null, email || null, fax || null, postalCode || null, remark || null, existing.id]
      );
    } else {
      await query(
        `INSERT INTO store_info (name, code, address, phone, email, fax, postal_code, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name || null, code || null, address || null, phone || null, email || null, fax || null, postalCode || null, remark || null]
      );
    }

    const [store] = await query('SELECT * FROM store_info LIMIT 1');
    res.json(store);
  } catch (error) {
    next(error);
  }
});

// ========== 员工管理 ==========

// 获取所有员工
router.get('/employees', async (req, res, next) => {
  try {
    const employees = await query('SELECT * FROM employees ORDER BY created_at DESC');
    res.json(employees);
  } catch (error) {
    next(error);
  }
});

// 获取单个员工
router.get('/employees/:id', async (req, res, next) => {
  try {
    const [employee] = await query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    next(error);
  }
});

// 创建员工
router.post('/employees', async (req, res, next) => {
  try {
    const id = uuidv4();
    const { name, position, phone, email, role, status } = req.body;

    await query(
      `INSERT INTO employees (id, name, position, phone, email, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, position || null, phone || null, email || null, role || null, status || 'active']
    );

    const [employee] = await query('SELECT * FROM employees WHERE id = ?', [id]);
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
});

// 更新员工
router.put('/employees/:id', async (req, res, next) => {
  try {
    const { name, position, phone, email, role, status } = req.body;

    await query(
      `UPDATE employees SET name = ?, position = ?, phone = ?, email = ?, role = ?, status = ? WHERE id = ?`,
      [name, position || null, phone || null, email || null, role || null, status, req.params.id]
    );

    const [employee] = await query('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    next(error);
  }
});

// 删除员工
router.delete('/employees/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ========== 角色管理 ==========

// 获取所有角色
router.get('/roles', async (req, res, next) => {
  try {
    const roles = await query('SELECT * FROM roles ORDER BY created_at DESC');
    // 解析 permissions JSON
    const parsedRoles = roles.map(role => ({
      ...role,
      permissions: JSON.parse(role.permissions || '[]')
    }));
    res.json(parsedRoles);
  } catch (error) {
    next(error);
  }
});

// 创建角色
router.post('/roles', async (req, res, next) => {
  try {
    const id = uuidv4();
    const { name, description, permissions } = req.body;

    await query(
      `INSERT INTO roles (id, name, description, permissions)
       VALUES (?, ?, ?, ?)`,
      [id, name, description || null, JSON.stringify(permissions || [])]
    );

    const [role] = await query('SELECT * FROM roles WHERE id = ?', [id]);
    role.permissions = JSON.parse(role.permissions || '[]');
    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
});

// 更新角色
router.put('/roles/:id', async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    await query(
      `UPDATE roles SET name = ?, description = ?, permissions = ? WHERE id = ?`,
      [name, description || null, JSON.stringify(permissions || []), req.params.id]
    );

    const [role] = await query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    role.permissions = JSON.parse(role.permissions || '[]');
    res.json(role);
  } catch (error) {
    next(error);
  }
});

// 删除角色
router.delete('/roles/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM roles WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// ========== 自定义查询 ==========

// 获取所有自定义查询
router.get('/queries', async (req, res, next) => {
  try {
    const { module } = req.query;
    let sql = 'SELECT * FROM custom_queries WHERE 1=1';
    const params = [];

    if (module) {
      sql += ' AND module = ?';
      params.push(module);
    }

    sql += ' ORDER BY created_at DESC';

    const queries = await query(sql, params);
    // 解析 conditions JSON
    const parsedQueries = queries.map(query => ({
      ...query,
      conditions: JSON.parse(query.conditions || '{}')
    }));
    res.json(parsedQueries);
  } catch (error) {
    next(error);
  }
});

// 创建自定义查询
router.post('/queries', async (req, res, next) => {
  try {
    const id = uuidv4();
    const { name, module, conditions } = req.body;

    await query(
      `INSERT INTO custom_queries (id, name, module, conditions)
       VALUES (?, ?, ?, ?)`,
      [id, name, module, JSON.stringify(conditions || {})]
    );

    const [query] = await query('SELECT * FROM custom_queries WHERE id = ?', [id]);
    query.conditions = JSON.parse(query.conditions || '{}');
    res.status(201).json(query);
  } catch (error) {
    next(error);
  }
});

// ========== 库存预警设置 ==========

// 获取库存预警设置
router.get('/inventory-alert', async (req, res, next) => {
  try {
    const [settings] = await query('SELECT * FROM inventory_alert_settings LIMIT 1');
    if (!settings) {
      // 创建默认记录
      await query('INSERT INTO inventory_alert_settings (enabled, auto_alert) VALUES (?, ?)', [false, false]);
      const [newSettings] = await query('SELECT * FROM inventory_alert_settings LIMIT 1');
      return res.json(newSettings);
    }
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// 更新库存预警设置
router.put('/inventory-alert', async (req, res, next) => {
  try {
    const { enabled, threshold, autoAlert } = req.body;

    const [existing] = await query('SELECT id FROM inventory_alert_settings LIMIT 1');
    
    if (existing) {
      await query(
        `UPDATE inventory_alert_settings SET enabled = ?, threshold = ?, auto_alert = ? WHERE id = ?`,
        [enabled || false, threshold || null, autoAlert || false, existing.id]
      );
    } else {
      await query(
        `INSERT INTO inventory_alert_settings (enabled, threshold, auto_alert) VALUES (?, ?, ?)`,
        [enabled || false, threshold || null, autoAlert || false]
      );
    }

    const [settings] = await query('SELECT * FROM inventory_alert_settings LIMIT 1');
    res.json(settings);
  } catch (error) {
    next(error);
  }
});

// ========== 系统参数 ==========

// 获取系统参数
router.get('/params', async (req, res, next) => {
  try {
    const [params] = await query('SELECT * FROM system_params LIMIT 1');
    if (!params) {
      // 创建默认记录
      await query('INSERT INTO system_params (enable_dyeing_process) VALUES (?)', [false]);
      const [newParams] = await query('SELECT * FROM system_params LIMIT 1');
      return res.json(newParams);
    }
    res.json(params);
  } catch (error) {
    next(error);
  }
});

// 更新系统参数
router.put('/params', async (req, res, next) => {
  try {
    const { enableDyeingProcess } = req.body;

    const [existing] = await query('SELECT id FROM system_params LIMIT 1');
    
    if (existing) {
      await query(
        `UPDATE system_params SET enable_dyeing_process = ? WHERE id = ?`,
        [enableDyeingProcess || false, existing.id]
      );
    } else {
      await query(
        `INSERT INTO system_params (enable_dyeing_process) VALUES (?)`,
        [enableDyeingProcess || false]
      );
    }

    const [params] = await query('SELECT * FROM system_params LIMIT 1');
    res.json(params);
  } catch (error) {
    next(error);
  }
});

export default router;

