/**
 * 多单位换算工具
 * 支持格式：1打 12支 每支 25斤
 * 解析规则：数字+单位 数字+单位 每+单位 数字+单位
 */

export interface UnitConversion {
  // 换算规则，例如：{ "打": { "支": 12 }, "支": { "斤": 25 } }
  rules: Record<string, Record<string, number>>
  // 基础单位（最小单位）
  baseUnit: string
}

/**
 * 解析单位换算字符串
 * 例如："1打 12支 每支 25斤" 解析为：
 * - 1打 = 12支
 * - 1支 = 25斤
 * 
 * 格式说明：
 * - "数字+单位 数字+单位" 表示：第一个数字单位 = 第二个数字单位
 * - "每+单位 数字+单位" 表示：1第一个单位 = 第二个数字单位
 */
export function parseUnitConversion(text: string): UnitConversion | null {
  if (!text || !text.trim()) {
    return null
  }

  const rules: Record<string, Record<string, number>> = {}
  const units = new Set<string>()

  // 匹配 "每+单位 数字+单位" 格式，例如："每支 25斤"
  const perPattern = /每\s*([^\d\s]+)\s+(\d+(?:\.\d+)?)\s*([^\d\s]+)/g
  let perMatch
  while ((perMatch = perPattern.exec(text)) !== null) {
    const fromUnit = perMatch[1].trim()
    const value = parseFloat(perMatch[2])
    const toUnit = perMatch[3].trim()
    
    if (fromUnit && toUnit && !isNaN(value) && value > 0) {
      if (!rules[fromUnit]) {
        rules[fromUnit] = {}
      }
      rules[fromUnit][toUnit] = value
      units.add(fromUnit)
      units.add(toUnit)
    }
  }

  // 匹配 "数字+单位 数字+单位" 格式，例如："1打 12支"
  const pairPattern = /(\d+(?:\.\d+)?)\s*([^\d\s]+)\s+(\d+(?:\.\d+)?)\s*([^\d\s]+)/g
  let pairMatch
  while ((pairMatch = pairPattern.exec(text)) !== null) {
    const value1 = parseFloat(pairMatch[1])
    const unit1 = pairMatch[2].trim()
    const value2 = parseFloat(pairMatch[3])
    const unit2 = pairMatch[4].trim()

    if (unit1 && unit2 && !isNaN(value1) && !isNaN(value2) && value1 > 0 && value2 > 0) {
      // value1 单位1 = value2 单位2，所以 1 单位1 = value2/value1 单位2
      const ratio = value2 / value1
      
      if (!rules[unit1]) {
        rules[unit1] = {}
      }
      rules[unit1][unit2] = ratio
      units.add(unit1)
      units.add(unit2)
    }
  }

  // 如果没有解析到规则，返回null
  if (Object.keys(rules).length === 0) {
    return null
  }

  // 找到基础单位（通常是最后一个单位，或者作为目标单位最多的）
  const unitCounts: Record<string, number> = {}
  units.forEach((unit) => {
    unitCounts[unit] = 0
  })

  // 统计每个单位作为目标单位的次数
  Object.values(rules).forEach((conversions) => {
    Object.keys(conversions).forEach((toUnit) => {
      unitCounts[toUnit] = (unitCounts[toUnit] || 0) + 1
    })
  })

  // 基础单位是作为目标单位最多的，或者如果没有，选择最后一个单位
  let baseUnit = Array.from(units).pop() || ''
  let maxCount = 0
  Object.entries(unitCounts).forEach(([unit, count]) => {
    if (count > maxCount) {
      maxCount = count
      baseUnit = unit
    }
  })

  return {
    rules,
    baseUnit: baseUnit || Array.from(units)[0] || '',
  }
}

/**
 * 单位换算：将值从一种单位转换为另一种单位
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  conversion: UnitConversion
): number | null {
  if (fromUnit === toUnit) {
    return value
  }

  if (!conversion || !conversion.rules) {
    return null
  }

  // 如果直接有换算规则
  if (conversion.rules[fromUnit] && conversion.rules[fromUnit][toUnit]) {
    return value * conversion.rules[fromUnit][toUnit]
  }

  // 尝试通过基础单位转换
  if (conversion.baseUnit) {
    // 先转换到基础单位
    const baseValue = convertToBaseUnit(value, fromUnit, conversion)
    if (baseValue === null) {
      return null
    }
    // 再从基础单位转换到目标单位
    return convertFromBaseUnit(baseValue, toUnit, conversion)
  }

  return null
}

/**
 * 转换到基础单位（递归）
 */
function convertToBaseUnit(
  value: number,
  fromUnit: string,
  conversion: UnitConversion,
  visited: Set<string> = new Set()
): number | null {
  if (fromUnit === conversion.baseUnit) {
    return value
  }

  // 防止循环引用
  if (visited.has(fromUnit)) {
    return null
  }
  visited.add(fromUnit)

  // 如果直接有到基础单位的规则
  if (conversion.rules[fromUnit] && conversion.rules[fromUnit][conversion.baseUnit]) {
    return value * conversion.rules[fromUnit][conversion.baseUnit]
  }

  // 尝试通过中间单位转换
  for (const [intermediateUnit, ratio] of Object.entries(conversion.rules[fromUnit] || {})) {
    const intermediateValue = value * ratio
    const baseValue = convertToBaseUnit(intermediateValue, intermediateUnit, conversion, new Set(visited))
    if (baseValue !== null) {
      return baseValue
    }
  }

  return null
}

/**
 * 从基础单位转换（递归）
 */
function convertFromBaseUnit(
  value: number,
  toUnit: string,
  conversion: UnitConversion,
  visited: Set<string> = new Set()
): number | null {
  if (toUnit === conversion.baseUnit) {
    return value
  }

  // 防止循环引用
  if (visited.has(toUnit)) {
    return null
  }
  visited.add(toUnit)

  // 查找可以直接转换的规则：如果某个单位可以直接转换到toUnit
  for (const [fromUnit, conversions] of Object.entries(conversion.rules)) {
    if (conversions[toUnit]) {
      // 先转换到 fromUnit
      const intermediateValue = convertFromBaseUnit(value, fromUnit, conversion, new Set(visited))
      if (intermediateValue !== null) {
        return intermediateValue * conversions[toUnit]
      }
    }
  }

  // 尝试反向查找：如果 toUnit 是某个 fromUnit，那么可以反向转换
  for (const [fromUnit, conversions] of Object.entries(conversion.rules)) {
    if (fromUnit === toUnit) {
      // 找到 toUnit 作为源单位的规则，需要反向转换
      for (const [targetUnit, ratio] of Object.entries(conversions)) {
        const targetValue = convertFromBaseUnit(value, targetUnit, conversion, new Set(visited))
        if (targetValue !== null) {
          return targetValue / ratio
        }
      }
    }
  }

  return null
}

/**
 * 格式化单位换算显示
 */
export function formatUnitConversion(text: string): string {
  const conversion = parseUnitConversion(text)
  if (!conversion) {
    return text
  }

  const parts: string[] = []
  Object.entries(conversion.rules).forEach(([fromUnit, conversions]) => {
    Object.entries(conversions).forEach(([toUnit, ratio]) => {
      if (ratio === 1) {
        parts.push(`1${fromUnit} = 1${toUnit}`)
      } else if (ratio > 1) {
        parts.push(`1${fromUnit} = ${ratio}${toUnit}`)
      } else {
        parts.push(`1${toUnit} = ${1 / ratio}${fromUnit}`)
      }
    })
  })

  return parts.length > 0 ? parts.join('，') : text
}

