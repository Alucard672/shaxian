import { useState } from 'react'
import { X, Lock, Eye, EyeOff } from 'lucide-react'
import Button from '../ui/Button'
import { authApi } from '@/api/client'

interface ChangePasswordModalProps {
    isOpen: boolean
    onClose: () => void
}

function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // 验证
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('请填写所有字段')
            return
        }

        if (newPassword.length < 6) {
            setError('新密码长度至少为6位')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('两次输入的新密码不一致')
            return
        }

        setLoading(true)
        try {
            // 获取当前用户名
            const username = localStorage.getItem('username') || 'admin'

            // 调用后端API修改密码
            await authApi.changePassword({
                username,
                oldPassword,
                newPassword
            })

            alert('密码修改成功，请重新登录')

            // 清空本地存储并跳转到登录页
            localStorage.clear()
            sessionStorage.clear()
            window.location.href = '/shaxian/login'
        } catch (error: any) {
            setError(error.message || '修改密码失败')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setError('')
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 遮罩层 */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handleClose}
            />

            {/* 模态框 */}
            <div className="relative z-10 bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
                {/* 头部 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Lock className="w-5 h-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">修改密码</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 表单 */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* 旧密码 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            旧密码 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showOldPassword ? 'text' : 'password'}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="请输入旧密码"
                            />
                            <button
                                type="button"
                                onClick={() => setShowOldPassword(!showOldPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* 新密码 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            新密码 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="请输入新密码（至少6位）"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* 确认新密码 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            确认新密码 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="请再次输入新密码"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* 按钮 */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            取消
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                        >
                            {loading ? '修改中...' : '确认修改'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ChangePasswordModal
