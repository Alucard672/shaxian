export function parseColorCodeAndName(rawInput: string): { code: string; name: string } {
  const v = (rawInput ?? '').trim()
  // 后端对 code 往往有校验：优先使用用户输入（去空格）作为 code，避免 COL-xxxx 这种被拒绝
  const sanitized = v.replace(/\s+/g, '')
  const fallbackCode = sanitized ? sanitized.slice(0, 32) : `COL-${Date.now()}`
  if (!v) return { code: fallbackCode, name: '' }

  // 支持输入："#2233 - 红色" / "#2233-红色" / "2233 红色"
  const dashMatch = v.match(/^(.+?)\s*[-—–]\s*(.+)$/)
  if (dashMatch) {
    const code = dashMatch[1].trim().replace(/\s+/g, '')
    const name = dashMatch[2].trim() || code
    return { code: code || fallbackCode, name }
  }

  const parts = v.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const first = parts[0]
    const rest = parts.slice(1).join(' ').trim()
    const looksLikeCode =
      first.length <= 16 && (first.startsWith('#') || /[0-9]/.test(first))
    if (looksLikeCode) {
      const code = first.trim().replace(/\s+/g, '')
      const name = rest || code
      return { code: code || fallbackCode, name }
    }
  }

  // 只输入一个词：如果像 "#2233" 则当作 code；否则自动生成 code，name 用输入
  if (v.startsWith('#')) {
    const code = v.replace(/\s+/g, '')
    return { code: code || fallbackCode, name: code || v }
  }

  // 只输入名称：name 用输入，code 用输入（去空格）做兜底
  return { code: fallbackCode, name: v }
}

