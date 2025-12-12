import { ReactNode, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import TabBar from './TabBar'

import { useSettingsStore } from '@/store/settingsStore'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  const { loadSystemParams } = useSettingsStore()

  useEffect(() => {
    loadSystemParams()
  }, [loadSystemParams])

  return (
    <div className="h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TabBar />
          <main className="flex-1 p-4 overflow-auto">
            <div className="max-w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout





