import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function AccountPayable() {
  const navigate = useNavigate()

  useEffect(() => {
    // 重定向到统一管理页面
    navigate('/account/payable', { replace: true })
  }, [navigate])

  return null
}

export default AccountPayable






