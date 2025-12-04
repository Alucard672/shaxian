// 清空所有 localStorage 数据的工具函数
// 注意：此操作不可逆，请谨慎使用

export const clearAllStorage = () => {
  // 需要保留的 key（教程数据等）
  const preserveKeys: string[] = [
    // 可以在这里添加需要保留的 key
  ]

  // 获取所有 localStorage keys
  const keys = Object.keys(localStorage)

  // 删除所有 key（除了需要保留的）
  keys.forEach((key) => {
    if (!preserveKeys.includes(key)) {
      localStorage.removeItem(key)
    }
  })

  console.log('所有数据已清空（教程数据除外）')
}

// 清空特定模块的数据
export const clearModuleStorage = (module: string) => {
  const moduleKeys: Record<string, string[]> = {
    product: ['products', 'colors', 'batches'],
    contact: ['customers', 'suppliers'],
    purchase: ['purchaseOrders'],
    sales: ['salesOrders'],
    dyeing: ['dyeingOrders'],
    account: ['accountReceivables', 'accountPayables', 'receipts', 'payments'],
    inventory: ['adjustmentOrders', 'inventoryCheckOrders'],
    template: ['printTemplates'],
    settings: ['storeInfo', 'employees', 'roles', 'customQueries', 'inventoryAlertSettings', 'systemParams'],
  }

  const keys = moduleKeys[module] || []
  keys.forEach((key) => {
    localStorage.removeItem(key)
  })

  console.log(`${module} 模块数据已清空`)
}

