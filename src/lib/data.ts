/**
 * 干支 + 五行基础常量
 * 跟 chrono-acu 同一套
 */
export const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const
export const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

export type TianGan = typeof TIAN_GAN[number]
export type DiZhi = typeof DI_ZHI[number]

// 甲子日基准
export const BASE_DATE = new Date(Date.UTC(1940, 8, 18)) // 1940-09-18

// 五鼠遁 (日干→时干起法)
const WU_SHU_DUN_GROUP: Record<TianGan, string> = {
  '甲': '甲己', '己': '甲己', '乙': '乙庚', '庚': '乙庚',
  '丙': '丙辛', '辛': '丙辛', '丁': '丁壬', '壬': '丁壬',
  '戊': '戊癸', '癸': '戊癸',
}
const WU_SHU_SEQ: Record<string, TianGan[]> = {
  '甲己': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
  '乙庚': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
  '丙辛': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
  '丁壬': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
  '戊癸': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
}

/** 24h → 时辰地支 */
export function hourToDiZhi(hour: number): DiZhi {
  if (hour >= 23 || hour < 1) return '子'
  if (hour < 3) return '丑'
  if (hour < 5) return '寅'
  if (hour < 7) return '卯'
  if (hour < 9) return '辰'
  if (hour < 11) return '巳'
  if (hour < 13) return '午'
  if (hour < 15) return '未'
  if (hour < 17) return '申'
  if (hour < 19) return '酉'
  if (hour < 21) return '戌'
  return '亥'
}

/** 干支 → 时辰名 */
export function diZhiToShichenName(zhi: DiZhi): string {
  const map: Record<DiZhi, string> = {
    '子': '子时 (23-01)', '丑': '丑时 (01-03)', '寅': '寅时 (03-05)',
    '卯': '卯时 (05-07)', '辰': '辰时 (07-09)', '巳': '巳时 (09-11)',
    '午': '午时 (11-13)', '未': '未时 (13-15)', '申': '申时 (15-17)',
    '酉': '酉时 (17-19)', '戌': '戌时 (19-21)', '亥': '亥时 (21-23)',
  }
  return map[zhi]
}

/** 公历日期 → 日天干 (基于 1940-09-18 甲子日) */
export function getDayGan(year: number, month: number, day: number): TianGan {
  const d = new Date(Date.UTC(year, month - 1, day))
  const delta = Math.round((d.getTime() - BASE_DATE.getTime()) / 86400000)
  return TIAN_GAN[((delta % 10) + 10) % 10]
}

/** 公历日期 → 日地支 */
export function getDayZhi(year: number, month: number, day: number): DiZhi {
  const d = new Date(Date.UTC(year, month - 1, day))
  const delta = Math.round((d.getTime() - BASE_DATE.getTime()) / 86400000)
  return DI_ZHI[((delta % 12) + 12) % 12]
}

/** 日干 + 时支 → 时干支 */
export function getHourGanZhi(dayGan: TianGan, hourZhi: DiZhi): string {
  const group = WU_SHU_DUN_GROUP[dayGan]
  const seq = WU_SHU_SEQ[group]
  const hourIdx = DI_ZHI.indexOf(hourZhi) % 10
  return seq[hourIdx] + hourZhi
}