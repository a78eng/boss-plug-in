import type { BossCity, BossCityGroup } from './bossCityData'
import { bossCityGroups } from './bossCityData'

const cityIndex = new Map<number, BossCity>()
const cityGroupIndex = new Map<number, string>()
const cityNameIndex = new Map<string, BossCity>()
const cityPinyinIndex = new Map<string, BossCity>()

/** 归一化城市名, 去掉常见行政区后缀, 便于 '北京市' / '北京' 互相匹配 */
const CITY_NAME_SUFFIXES = ['特别行政区', '自治州', '自治区', '地区', '市', '盟']

export function normalizeCityName(name: unknown): string {
  let result = String(name ?? '')
    .trim()
    .replace(/\s+/g, '')
  if (!result) {
    return ''
  }
  for (const suffix of CITY_NAME_SUFFIXES) {
    if (result.length > suffix.length && result.endsWith(suffix)) {
      result = result.slice(0, -suffix.length)
      break
    }
  }
  return result
}

for (const group of bossCityGroups) {
  for (const city of group.cities) {
    if (!cityIndex.has(city.code)) {
      cityIndex.set(city.code, city)
      cityGroupIndex.set(city.code, group.name)
    }
    if (!cityNameIndex.has(city.name)) {
      cityNameIndex.set(city.name, city)
    }
    const normalized = normalizeCityName(city.name)
    if (normalized && !cityNameIndex.has(normalized)) {
      cityNameIndex.set(normalized, city)
    }
    if (city.pinyin && !cityPinyinIndex.has(city.pinyin)) {
      cityPinyinIndex.set(city.pinyin, city)
    }
  }
}

/** 按 BOSS 城市编号获取城市信息 */
export function getBossCity(code: number | null | undefined): BossCity | undefined {
  if (typeof code !== 'number') {
    return undefined
  }
  return cityIndex.get(code)
}

/** 按 BOSS 城市编号获取城市名, 未知编号直接返回编号本身 */
export function getBossCityName(code: number | null | undefined): string {
  return getBossCity(code)?.name ?? (code == null ? '' : String(code))
}

/** 按 BOSS 城市编号获取所属分组(省份/直辖市/常用) */
export function getBossCityGroupName(code: number | null | undefined): string {
  if (typeof code !== 'number') {
    return ''
  }
  return cityGroupIndex.get(code) ?? ''
}

/** 城市编号列表 -> 城市名列表 */
export function getBossCityNames(codes: number[] | null | undefined): string[] {
  return (codes ?? []).map((code) => getBossCityName(code))
}

/** 城市编号列表 -> '北京、上海' */
export function formatBossCityNames(codes: number[] | null | undefined): string {
  return getBossCityNames(codes).filter(Boolean).join('、')
}

/**
 * 按城市名/拼音查找城市, 兼容 '北京' / '北京市' / 'beijing'
 * 主要用于旧配置(文本关键字)迁移到城市编号
 */
export function findBossCityByName(name: unknown): BossCity | undefined {
  const raw = String(name ?? '').trim()
  if (!raw) {
    return undefined
  }
  const direct = cityNameIndex.get(raw)
  if (direct) {
    return direct
  }
  const normalized = normalizeCityName(raw)
  const byName = normalized ? cityNameIndex.get(normalized) : undefined
  if (byName) {
    return byName
  }
  return cityPinyinIndex.get(raw.toLowerCase())
}

/** 按分组(省份)名查找分组, 例如 '广东' */
export function findBossCityGroupByName(name: unknown): BossCityGroup | undefined {
  const raw = String(name ?? '').trim()
  if (!raw) {
    return undefined
  }
  const normalized = normalizeCityName(raw)
  return bossCityGroups.find(
    (group) => group.name === raw || normalizeCityName(group.name) === normalized,
  )
}

/**
 * 旧配置迁移: 把任意旧的文本关键字解析成城市编号列表
 * 支持 '北京、上海' / '北京,上海' / '深圳市' 这类写法
 */
export function parseBossCityCodes(input: unknown): number[] {
  const result = new Set<number>()
  const pushText = (text: string) => {
    for (const part of text.split(/[、,，;；/|\\\s]+/)) {
      if (!part) {
        continue
      }
      const city = findBossCityByName(part)
      if (city) {
        result.add(city.code)
        continue
      }
      // 支持直接写省份, 则包含该省份下所有城市
      const group = findBossCityGroupByName(part)
      if (group) {
        for (const item of group.cities) {
          result.add(item.code)
        }
      }
    }
  }

  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      if (cityIndex.has(value)) {
        result.add(value)
      }
      return
    }
    if (typeof value === 'string') {
      pushText(value)
    }
  }

  walk(input)
  return [...result]
}
