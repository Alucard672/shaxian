import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createConnection } from './db/connection.js';
import productRoutes from './routes/products.js';
import contactRoutes from './routes/contacts.js';
import purchaseRoutes from './routes/purchases.js';
import salesRoutes from './routes/sales.js';
import dyeingRoutes from './routes/dyeing.js';
import accountRoutes from './routes/accounts.js';
import inventoryRoutes from './routes/inventory.js';
import settingsRoutes from './routes/settings.js';
import templateRoutes from './routes/templates.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/products', productRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dyeing', dyeingRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/templates', templateRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 启动服务器
async function startServer() {
  try {
    // 测试数据库连接
    const connection = await createConnection();
    console.log('✅ Database connected');
    await connection.end();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📝 API docs: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

