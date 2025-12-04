// 清空所有 localStorage 数据的工具函数
// 注意：此操作不可逆，请谨慎使用

export const clearAllStorage = () => {
  // 需要保留的 key（教程数据等）
  const preserveKeys: string[] = [
    // 可以在这里添加需要保留的 key
  ]

  // 需要清空的所有业务数据 key
  const dataKeys = [
    'products',
    'colors',
    'batches',
    'customers',
    'suppliers',
    'purchaseOrders',
    'salesOrders',
    'dyeingOrders',
    'accountReceivables',
    'accountPayables',
    'receiptRecords',
    'paymentRecords',
    'adjustmentOrders',
    'inventoryCheckOrders',
    'printTemplates',
    'storeInfo',
    'employees',
    'roles',
    'customQueries',
    'inventoryAlertSettings',
    'systemParams',
    // 清理初始化标记
    'products_initialized',
    'colors_initialized',
    'batches_initialized',
    'customers_initialized',
    'suppliers_initialized',
    'purchaseOrders_initialized',
    'salesOrders_initialized',
    'dyeingOrders_initialized',
    'accountReceivables_initialized',
    'accountPayables_initialized',
    'adjustmentOrders_initialized',
    'inventoryCheckOrders_initialized',
    'printTemplates_initialized',
  ]

  // 删除所有业务数据 key
  dataKeys.forEach((key) => {
    if (!preserveKeys.includes(key)) {
      localStorage.removeItem(key)
    }
  })

  console.log('所有数据已清空（教程数据除外）')
}

// 清空特定模块的数据
export const clearModuleStorage = (module: string) => {
  const moduleKeys: Record<string, string[]> = {
    product: ['products', 'colors', 'batches', 'products_initialized', 'colors_initialized', 'batches_initialized'],
    contact: ['customers', 'suppliers', 'customers_initialized', 'suppliers_initialized'],
    purchase: ['purchaseOrders', 'purchaseOrders_initialized'],
    sales: ['salesOrders', 'salesOrders_initialized'],
    dyeing: ['dyeingOrders', 'dyeingOrders_initialized'],
    account: ['accountReceivables', 'accountPayables', 'receiptRecords', 'paymentRecords', 'accountReceivables_initialized', 'accountPayables_initialized'],
    inventory: ['adjustmentOrders', 'inventoryCheckOrders', 'adjustmentOrders_initialized', 'inventoryCheckOrders_initialized'],
    template: ['printTemplates', 'printTemplates_initialized'],
    settings: ['storeInfo', 'employees', 'roles', 'customQueries', 'inventoryAlertSettings', 'systemParams'],
  }

  const keys = moduleKeys[module] || []
  keys.forEach((key) => {
    localStorage.removeItem(key)
  })

  console.log(`${module} 模块数据已清空`)
}

