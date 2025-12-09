import { BrowserRouter, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AppRoutes from './routes'

function AppContent() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  if (isLoginPage) {
    return <AppRoutes />
  }

  return (
    <Layout>
      <AppRoutes />
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter basename="/shaxian">
      <AppContent />
    </BrowserRouter>
  )
}

export default App






