import express from 'express';
import { query } from '../db/connection.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 获取所有打印模板
router.get('/', async (req, res, next) => {
  try {
    const { documentType } = req.query;
    let sql = 'SELECT * FROM print_templates WHERE 1=1';
    const params = [];

    if (documentType) {
      sql += ' AND document_type = ?';
      params.push(documentType);
    }

    sql += ' ORDER BY created_at DESC';

    const templates = await query(sql, params);
    
    // 解析 JSON 字段
    const parsedTemplates = templates.map(template => ({
      ...template,
      pageSettings: JSON.parse(template.page_settings || '{}'),
      titleSettings: JSON.parse(template.title_settings || '{}'),
      basicInfoFields: JSON.parse(template.basic_info_fields || '{}'),
      productFields: JSON.parse(template.product_fields || '{}'),
      summaryFields: JSON.parse(template.summary_fields || '{}'),
      otherElements: JSON.parse(template.other_elements || '{}')
    }));

    res.json(parsedTemplates);
  } catch (error) {
    next(error);
  }
});

// 获取单个打印模板
router.get('/:id', async (req, res, next) => {
  try {
    const [template] = await query('SELECT * FROM print_templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // 解析 JSON 字段
    const parsedTemplate = {
      ...template,
      pageSettings: JSON.parse(template.page_settings || '{}'),
      titleSettings: JSON.parse(template.title_settings || '{}'),
      basicInfoFields: JSON.parse(template.basic_info_fields || '{}'),
      productFields: JSON.parse(template.product_fields || '{}'),
      summaryFields: JSON.parse(template.summary_fields || '{}'),
      otherElements: JSON.parse(template.other_elements || '{}')
    };

    res.json(parsedTemplate);
  } catch (error) {
    next(error);
  }
});

// 创建打印模板
router.post('/', async (req, res, next) => {
  try {
    const id = uuidv4();
    const {
      name, type, description, isDefault, documentType,
      pageSettings, titleSettings, basicInfoFields, productFields, summaryFields, otherElements
    } = req.body;

    await query(
      `INSERT INTO print_templates (id, name, type, description, is_default, document_type, page_settings, title_settings, basic_info_fields, product_fields, summary_fields, other_elements)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, type, description || null, isDefault || false, documentType,
        JSON.stringify(pageSettings || {}), JSON.stringify(titleSettings || {}),
        JSON.stringify(basicInfoFields || {}), JSON.stringify(productFields || {}),
        JSON.stringify(summaryFields || {}), JSON.stringify(otherElements || {})
      ]
    );

    const [template] = await query('SELECT * FROM print_templates WHERE id = ?', [id]);
    const parsedTemplate = {
      ...template,
      pageSettings: JSON.parse(template.page_settings || '{}'),
      titleSettings: JSON.parse(template.title_settings || '{}'),
      basicInfoFields: JSON.parse(template.basic_info_fields || '{}'),
      productFields: JSON.parse(template.product_fields || '{}'),
      summaryFields: JSON.parse(template.summary_fields || '{}'),
      otherElements: JSON.parse(template.other_elements || '{}')
    };

    res.status(201).json(parsedTemplate);
  } catch (error) {
    next(error);
  }
});

// 更新打印模板
router.put('/:id', async (req, res, next) => {
  try {
    const {
      name, type, description, isDefault, documentType,
      pageSettings, titleSettings, basicInfoFields, productFields, summaryFields, otherElements
    } = req.body;

    await query(
      `UPDATE print_templates SET name = ?, type = ?, description = ?, is_default = ?, document_type = ?, page_settings = ?, title_settings = ?, basic_info_fields = ?, product_fields = ?, summary_fields = ?, other_elements = ?
       WHERE id = ?`,
      [
        name, type, description || null, isDefault || false, documentType,
        JSON.stringify(pageSettings || {}), JSON.stringify(titleSettings || {}),
        JSON.stringify(basicInfoFields || {}), JSON.stringify(productFields || {}),
        JSON.stringify(summaryFields || {}), JSON.stringify(otherElements || {}), req.params.id
      ]
    );

    const [template] = await query('SELECT * FROM print_templates WHERE id = ?', [req.params.id]);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const parsedTemplate = {
      ...template,
      pageSettings: JSON.parse(template.page_settings || '{}'),
      titleSettings: JSON.parse(template.title_settings || '{}'),
      basicInfoFields: JSON.parse(template.basic_info_fields || '{}'),
      productFields: JSON.parse(template.product_fields || '{}'),
      summaryFields: JSON.parse(template.summary_fields || '{}'),
      otherElements: JSON.parse(template.other_elements || '{}')
    };

    res.json(parsedTemplate);
  } catch (error) {
    next(error);
  }
});

// 删除打印模板
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM print_templates WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// 更新使用次数
router.post('/:id/usage', async (req, res, next) => {
  try {
    await query('UPDATE print_templates SET usage_count = usage_count + 1 WHERE id = ?', [req.params.id]);
    const [template] = await query('SELECT * FROM print_templates WHERE id = ?', [req.params.id]);
    res.json({ usageCount: template.usage_count });
  } catch (error) {
    next(error);
  }
});

export default router;

