import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function CustomerManagement() {
  const navigate = useNavigate()

  useEffect(() => {
    // 重定向到统一管理页面
    navigate('/customer', { replace: true })
  }, [navigate])

  return null
}

export default CustomerManagement






