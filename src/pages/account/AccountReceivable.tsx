import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function AccountReceivable() {
  const navigate = useNavigate()

  useEffect(() => {
    // 重定向到统一管理页面
    navigate('/account/receivable', { replace: true })
  }, [navigate])

  return null
}

export default AccountReceivable






