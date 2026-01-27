import React from 'react'

export const AlipayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 支付宝图标 - 字母"支"的简化设计 */}
      <path
        d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z"
        fill="#1677FF"
      />
      {/* 支付宝的"支"字简化设计 */}
      <path
        d="M8.5 7.5h7v1.5h-5.5v2h5v1.5h-5v3h-1.5v-8z"
        fill="#1677FF"
      />
      <path
        d="M15.5 9.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"
        fill="#1677FF"
      />
    </svg>
  )
}
