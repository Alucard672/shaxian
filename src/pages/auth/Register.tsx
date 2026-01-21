import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { authApi } from '@/api/client'

function Register() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        phone: '',
        password: '',
        confirmPassword: '',
        tenantCode: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!formData.phone || !formData.password || !formData.confirmPassword) {
            setError('请填写必填项')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致')
            return
        }

        if (formData.password.length < 6) {
            setError('密码长度至少为6位')
            return
        }

        setLoading(true)
        try {
            await authApi.register({
                phone: formData.phone,
                password: formData.password,
                tenantCode: formData.tenantCode || undefined
            })

            // 注册成功，跳转到登录页
            navigate('/login', {
                state: { message: '注册成功，请登录' }
            })
        } catch (error: any) {
            setError(error.message || '注册失败，请稍后重试')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="w-full max-w-md">
                {/* Logo和标题 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">注册账号</h1>
                    <p className="text-gray-600">欢迎加入纱线ERP系统</p>
                </div>

                {/* 注册表单 */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* 手机号输入 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                手机号 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="请输入手机号"
                                disabled={loading}
                            />
                        </div>

                        {/* 密码输入 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                密码 <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="设置登录密码（至少6位）"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* 确认密码输入 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                确认密码 <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="再次输入密码"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* 租户代码输入 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                租户代码 <span className="text-gray-400 font-normal">(选填)</span>
                            </label>
                            <input
                                type="text"
                                name="tenantCode"
                                value={formData.tenantCode}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="如果有企业租户代码请输入"
                                disabled={loading}
                            />
                            <p className="mt-1 text-xs text-gray-500">输入租户代码将自动加入该企业，否则需要创建新企业</p>
                        </div>

                        {/* 注册按钮 */}
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                            disabled={loading}
                        >
                            {loading ? '注册中...' : '注册'}
                        </Button>
                    </form>
                </div>

                {/* 底部链接 */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    已有账号？{' '}
                    <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                        立即登录
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Register
