// 检查 localStorage 中的数据
const dataKeys = [
  'products', 'colors', 'batches',
  'customers', 'suppliers',
  'purchaseOrders', 'salesOrders', 'dyeingOrders',
  'accountReceivables', 'accountPayables',
  'receiptRecords', 'paymentRecords',
  'adjustmentOrders', 'inventoryCheckOrders',
  'printTemplates'
];

console.log('=== 检查 localStorage 数据 ===');
let hasData = false;
dataKeys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value) {
    try {
      const data = JSON.parse(value);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`✅ ${key}: ${data.length} 条记录`);
        hasData = true;
      } else if (!Array.isArray(data) && Object.keys(data).length > 0) {
        console.log(`✅ ${key}: 有数据`);
        hasData = true;
      }
    } catch (e) {
      if (value && value !== 'null') {
        console.log(`✅ ${key}: 有数据`);
        hasData = true;
      }
    }
  }
});

if (!hasData) {
  console.log('❌ 没有发现数据');
} else {
  console.log('\n如需清空数据，请执行：localStorage.clear()');
}
