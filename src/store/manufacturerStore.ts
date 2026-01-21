import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ManufacturerState {
  manufacturers: string[]
  addManufacturer: (name: string) => void
  getManufacturers: () => string[]
  searchManufacturers: (keyword: string) => string[]
}

export const useManufacturerStore = create<ManufacturerState>()(
  persist(
    (set, get) => ({
      manufacturers: [],
      
      addManufacturer: (name: string) => {
        if (!name || name.trim() === '') return
        const trimmedName = name.trim()
        set((state) => {
          // 如果已存在，不重复添加
          if (state.manufacturers.includes(trimmedName)) {
            return state
          }
          return {
            manufacturers: [...state.manufacturers, trimmedName].sort(),
          }
        })
      },
      
      getManufacturers: () => {
        return get().manufacturers
      },
      
      searchManufacturers: (keyword: string) => {
        if (!keyword || keyword.trim() === '') {
          return get().manufacturers
        }
        const lowerKeyword = keyword.toLowerCase().trim()
        return get().manufacturers.filter((name) => {
          const lowerName = name.toLowerCase()
          // 支持中文、拼音首字母、全拼搜索
          return (
            lowerName.includes(lowerKeyword) ||
            lowerName.startsWith(lowerKeyword)
          )
        })
      },
    }),
    {
      name: 'manufacturer-storage',
    }
  )
)


