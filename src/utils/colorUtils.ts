import { Color } from '@/types/product'

/**
 * 格式化色号显示
 * 格式：颜色值 色号名称（如：#ffffff 白色）
 * 如果没有颜色值，则显示：色号编码 - 色号名称
 */
export function formatColorDisplay(color: Color): string {
  if (color.colorValue) {
    return `${color.colorValue} ${color.name}`
  }
  return `${color.code} - ${color.name}`
}

/**
 * 获取色号的显示名称（仅名称部分）
 */
export function getColorDisplayName(color: Color): string {
  return color.name
}

/**
 * 获取色号的完整显示（包含颜色值和名称）
 */
export function getColorFullDisplay(color: Color): string {
  if (color.colorValue) {
    return `${color.colorValue} ${color.name}`
  }
  return `${color.code} - ${color.name}`
}


