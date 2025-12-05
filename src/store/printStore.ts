import { create } from 'zustand'
import { PrintRecord, PrintDocumentType, PrintStatus } from '@/types/print'
import { useSalesStore } from './salesStore'
import { usePurchaseStore } from './purchaseStore'

interface PrintState {
  records: PrintRecord[]
  
  // 打印操作
  printDocument: (documentType: PrintDocumentType, documentId: string, documentNumber: string) => void
  getPrintRecords: () => PrintRecord[]
  getPrintRecordsByType: (type: PrintDocumentType | '全部') => PrintRecord[]
  getTodayPrintCount: () => number
  getPendingPrintCount: () => number
}

// 生成唯一ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// 从localStorage加载数据
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

// 保存到localStorage
const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
  }
}

export const usePrintStore = create<PrintState>((set, get) => ({
  records: loadFromStorage('printRecords', []),

  printDocument: (documentType, documentId, documentNumber) => {
    const existingRecord = get().records.find(
      (r) => r.documentId === documentId && r.documentType === documentType
    )

    if (existingRecord) {
      // 更新打印次数和时间
      set((state) => {
        const records = state.records.map((r) =>
          r.id === existingRecord.id
            ? {
                ...r,
                printCount: r.printCount + 1,
                lastPrintTime: new Date().toISOString(),
                status: '已打印' as PrintStatus,
              }
            : r
        )
        saveToStorage('printRecords', records)
        return { records }
      })
    } else {
      // 创建新记录
      const newRecord: PrintRecord = {
        id: generateId(),
        documentType,
        documentNumber,
        documentId,
        printCount: 1,
        lastPrintTime: new Date().toISOString(),
        status: '已打印',
        createdAt: new Date().toISOString(),
      }

      set((state) => {
        const records = [...state.records, newRecord]
        saveToStorage('printRecords', records)
        return { records }
      })
    }
  },

  getPrintRecords: () => {
    // 合并销售单和进货单，生成打印记录
    const salesOrders = useSalesStore.getState().orders
    const purchaseOrders = usePurchaseStore.getState().orders
    const printRecords = get().records

    // 为所有销售单和进货单创建打印记录（如果不存在）
    const allRecords: PrintRecord[] = []

    salesOrders.forEach((order) => {
      const existing = printRecords.find(
        (r) => r.documentId === order.id && r.documentType === '销售单'
      )
      if (existing) {
        allRecords.push(existing)
      } else {
        allRecords.push({
          id: generateId(),
          documentType: '销售单',
          documentNumber: order.orderNumber,
          documentId: order.id,
          printCount: 0,
          status: '待打印',
          createdAt: order.createdAt,
        })
      }
    })

    purchaseOrders.forEach((order) => {
      const existing = printRecords.find(
        (r) => r.documentId === order.id && r.documentType === '进货单'
      )
      if (existing) {
        allRecords.push(existing)
      } else {
        allRecords.push({
          id: generateId(),
          documentType: '进货单',
          documentNumber: order.orderNumber,
          documentId: order.id,
          printCount: 0,
          status: '待打印',
          createdAt: order.createdAt,
        })
      }
    })

    return allRecords.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  },

  getPrintRecordsByType: (type) => {
    const allRecords = get().getPrintRecords()
    if (type === '全部') return allRecords
    return allRecords.filter((r) => r.documentType === type)
  },

  getTodayPrintCount: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().records.filter(
      (r) => r.lastPrintTime && r.lastPrintTime.startsWith(today)
    ).length
  },

  getPendingPrintCount: () => {
    return get().getPrintRecords().filter((r) => r.status === '待打印').length
  },
}))







