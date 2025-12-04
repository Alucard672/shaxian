import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        <main className="flex-1 p-4 overflow-auto">
          <div className="max-w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout





