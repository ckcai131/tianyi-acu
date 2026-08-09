/**
 * tianyi-acu · 计算引擎
 * 4 大算法:
 * 1. 值符 (值日经 + 五输穴轮值)
 * 2. 值使 (12 时支固定对应值使穴)
 * 3. 值阳/值阴 (阳日气纳三焦 / 阴日血归心包)
 * 4. 吉凶时 (12 神煞 + 黄黑道 + 截空 + 五不遇)
 */

import { JIAZI_TABLE } from './jiazi'
import { ZHI_FU_FULL } from './zhifu'
import { ZHI_SHI } from './zhishi'
import { ZHI_YANG_YIN } from './zhiyy'
import { JI_XIONG } from './jixiong'
import { type TianGan, type DiZhi, TIAN_GAN, DI_ZHI, getDayGan, getDayZhi, hourToDiZhi, getHourGanZhi, diZhiToShichenName } from './data'

// 索引加速查表
const JIAZI_INDEX: Map<string, typeof JIAZI_TABLE[number]> = new Map(
  JIAZI_TABLE.map(r => [r[0], r])
)

const ZHI_FU_INDEX: Map<string, typeof ZHI_FU_FULL[number]> = new Map(
  ZHI_FU_FULL.map(r => [`${r[0]}|${r[2]}`, r])
)

const ZHI_SHI_INDEX: Map<DiZhi, typeof ZHI_SHI[number]> = new Map(
  ZHI_SHI.map(r => [r[0], r])
)

const ZHI_YY_INDEX: Map<string, typeof ZHI_YANG_YIN[number]> = new Map(
  ZHI_YANG_YIN.map(r => [`${r[0]}|${r[2]}`, r])
)

export const JI_XIONG_INDEX: Map<string, typeof JI_XIONG[number]> = new Map(
  JI_XIONG.map(r => [`${r[0]}|${r[1]}`, r])
)

/** 解析 "子、丑、卯" → ['子', '丑', '卯'] */
function parseStrList(s: string): string[] {
  if (!s) return []
  return s.split('、').map(x => x.trim()).filter(x => x)
}

// ── 4 大算法 ──

export interface ZhiFuResult {
  dayGan: TianGan
  dayYinYang: '阳' | '阴'
  hourZhi: DiZhi
  hourYinYang: '阳' | '阴'
  actualGan: TianGan
  actualJingLuo: string
  acupoint: string
  pointNature: string
  rule: string
}

export function calculateZhiFu(dayGan: TianGan, hourZhi: DiZhi): ZhiFuResult | null {
  const rec = ZHI_FU_INDEX.get(`${dayGan}|${hourZhi}`)
  if (!rec) return null
  return {
    dayGan: rec[0],
    dayYinYang: rec[1],
    hourZhi: rec[2],
    hourYinYang: rec[3],
    actualGan: rec[4],
    actualJingLuo: rec[5],
    acupoint: rec[6],
    pointNature: rec[7],
    rule: rec[8],
  }
}

export interface ZhiShiResult {
  hourZhi: DiZhi
  hourYinYang: '阳' | '阴'
  wuXing: string
  jingLuo: string
  acupoint: string
  pointNature: string
}

export function calculateZhiShi(hourZhi: DiZhi): ZhiShiResult | null {
  const rec = ZHI_SHI_INDEX.get(hourZhi)
  if (!rec) return null
  return {
    hourZhi: rec[0],
    hourYinYang: rec[1],
    wuXing: rec[2],
    jingLuo: rec[3],
    acupoint: rec[4],
    pointNature: rec[5],
  }
}

export interface ZhiYangYinResult {
  mode: '值阳' | '值阴'
  dayYinYang: '阳' | '阴'
  hourZhi: DiZhi
  jingLuo: string
  acupoint: string
  pointNature: string
}

export function calculateZhiYangYin(dayYinYang: '阳' | '阴', hourZhi: DiZhi): ZhiYangYinResult | null {
  const mode = dayYinYang === '阳' ? '值阳' : '值阴'
  const rec = ZHI_YY_INDEX.get(`${mode}|${hourZhi}`)
  if (!rec) return null
  return {
    mode: rec[0],
    dayYinYang: rec[1],
    hourZhi: rec[2],
    jingLuo: rec[3],
    acupoint: rec[4],
    pointNature: rec[5],
  }
}

export interface JiXiongResult {
  dayGanZhi: string
  hourZhi: DiZhi
  hourGanZhi: string
  shenSha: string
  huangHeiDao: string
  jieKong: '是' | '否'
  wuBuYu: '是' | '否'
  daJi: '是' | '否'
}

export function calculateJiXiong(dayGanZhi: string, hourZhi: DiZhi): JiXiongResult | null {
  const rec = JI_XIONG_INDEX.get(`${dayGanZhi}|${hourZhi}`)
  if (!rec) return null
  return {
    dayGanZhi: rec[0],
    hourZhi: rec[1],
    hourGanZhi: rec[2],
    shenSha: rec[3],
    huangHeiDao: rec[4],
    jieKong: rec[5],
    wuBuYu: rec[6],
    daJi: rec[7],
  }
}

export interface MainResult {
  dayGanZhi: string
  order: number
  dayGan: TianGan
  dayZhi: DiZhi
  dayYinYang: '阳' | '阴'
  zhiFuJingLuo: string
  xiShenFang: string
  thirdNeedleMode: '值阳' | '值阴'
  huangDaoShiChen: string[]
  daJiShiChen: string[]
}

export function getMainSummary(dayGanZhi: string): MainResult | null {
  const rec = JIAZI_INDEX.get(dayGanZhi)
  if (!rec) return null
  return {
    dayGanZhi: rec[0],
    order: JIAZI_TABLE.indexOf(rec) + 1,
    dayGan: rec[1],
    dayZhi: rec[2],
    dayYinYang: rec[3],
    zhiFuJingLuo: rec[4],
    xiShenFang: rec[5],
    thirdNeedleMode: rec[6],
    huangDaoShiChen: parseStrList(rec[7]),
    daJiShiChen: parseStrList(rec[8]),
  }
}

// ── 统一入口 ──

export interface AllResult {
  input: { year: number; month: number; day: number; hour: number; minute: number }
  dayGanZhi: string
  dayGan: TianGan
  dayZhi: DiZhi
  dayYinYang: '阳' | '阴'
  hourZhi: DiZhi
  hourGanZhi: string
  shiChenName: string
  main: MainResult | null
  zhiFu: ZhiFuResult | null
  zhiShi: ZhiShiResult | null
  zhiYangYin: ZhiYangYinResult | null
  jiXiong: JiXiongResult | null
}

export function calculateAll(year: number, month: number, day: number, hour: number, minute = 0): AllResult {
  const dayGan = getDayGan(year, month, day)
  const dayZhi = getDayZhi(year, month, day)
  const dayGanZhi = dayGan + dayZhi
  const dayYinYang: '阳' | '阴' = TIAN_GAN.indexOf(dayGan) % 2 === 0 ? '阳' : '阴'

  const hourZhi = hourToDiZhi(hour)
  const hourGanZhi = getHourGanZhi(dayGan, hourZhi)
  const shiChenName = diZhiToShichenName(hourZhi)

  return {
    input: { year, month, day, hour, minute },
    dayGanZhi,
    dayGan,
    dayZhi,
    dayYinYang,
    hourZhi,
    hourGanZhi,
    shiChenName,
    main: getMainSummary(dayGanZhi),
    zhiFu: calculateZhiFu(dayGan, hourZhi),
    zhiShi: calculateZhiShi(hourZhi),
    zhiYangYin: calculateZhiYangYin(dayYinYang, hourZhi),
    jiXiong: calculateJiXiong(dayGanZhi, hourZhi),
  }
}

/** 当前时间求值 */
export function calculateNow(): AllResult {
  const d = new Date()
  // UTC → 北京时间 (+8)
  const bj = new Date(d.getTime() + 8 * 3600 * 1000)
  return calculateAll(
    bj.getUTCFullYear(),
    bj.getUTCMonth() + 1,
    bj.getUTCDate(),
    bj.getUTCHours(),
    bj.getUTCMinutes()
  )
}