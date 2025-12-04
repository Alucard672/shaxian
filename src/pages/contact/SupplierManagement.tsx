import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function SupplierManagement() {
  const navigate = useNavigate()

  useEffect(() => {
    // 重定向到统一管理页面
    navigate('/supplier', { replace: true })
  }, [navigate])

  return null
}

export default SupplierManagement






