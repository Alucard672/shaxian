import { BrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import AppRoutes from './routes'

function App() {
  return (
    <BrowserRouter basename="/shaxian">
      <Layout>
        <AppRoutes />
      </Layout>
    </BrowserRouter>
  )
}

export default App






