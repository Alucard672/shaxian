/**
 * 格式化数字，去掉.00
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number | string | undefined | null): string {
  if (num === undefined || num === null || num === '') return '0'
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return '0'
  // 如果是整数，不显示小数点
  if (Number.isInteger(n)) return String(n)
  // 否则保留两位小数，但去掉末尾的0
  return n.toFixed(2).replace(/\.?0+$/, '')
}

/**
 * 格式化金额，去掉.00
 * @param num 金额
 * @returns 格式化后的金额字符串（带¥）
 */
export function formatAmount(num: number | string | undefined | null): string {
  return `¥${formatNumber(num)}`
}
