/**
 * tianyi-acu 穴位查表
 *
 * 异步加载 /acupoints-index.min.json (gzip 后 ~4.1 KB, 409 穴位)
 * 数据源: chino-meds (159) + qihuang (388) + tianyi 整合
 *
 * 字段说明 (压缩格式):
 *   n: name_zh (穴位中文名, 不含"穴"字)
 *   t: 繁体名 (仅繁简不同时存在)
 *   m: meridian_zh (经络中文名)
 *   mc: meridian_code (经络代码)
 */

import type { MeridianCode } from './acupoint-map'

export type { MeridianCode }

export interface AcupointIndex {
  code: string                    // 穴位代码, 如 "LI4"
  name: string                    // 中文名, 如 "合谷"
  meridian: MeridianCode          // 经络代码
  meridianZh?: string             // 经络中文
}

/**
 * 异步加载完整 409 穴位索引 (4.1 KB gzip)
 * 浏览器自动 Accept-Encoding: gzip → 一次 fetch 即可
 */
let _cache: Record<string, AcupointIndex> | null = null
let _loadingPromise: Promise<Record<string, AcupointIndex>> | null = null

export async function loadAcupointMap(): Promise<Record<string, AcupointIndex>> {
  if (_cache) return _cache
  if (_loadingPromise) return _loadingPromise

  _loadingPromise = (async () => {
    const resp = await fetch('/TP/tianyi-acu/acupoints-index.min.json')
    const data = await resp.json()
    const map: Record<string, AcupointIndex> = {}

    for (const p of data.points) {
      const entry: AcupointIndex = {
        code: p.code,
        name: p.n + '穴',
        meridian: p.mc as MeridianCode,
        meridianZh: p.m,
      }
      // 简体索引 (主)
      map[p.n] = entry
      map[p.n + '穴'] = entry
      // 繁体索引 (数据中已存 t 字段)
      if (p.t) {
        map[p.t] = entry
        map[p.t + '穴'] = entry
      }
      // 简体索引 (数据中已存 s 字段, 处理繁体穴位)
      if (p.s) {
        map[p.s] = entry
        map[p.s + '穴'] = entry
      }
      // 按代码索引
      map[p.code] = entry
    }

    _cache = map
    return map
  })()

  return _loadingPromise
}

/**
 * 同步版 - 仅用于已加载场景
 */
export function getAcupointFromMap(map: Record<string, AcupointIndex>, name: string): AcupointIndex | null {
  const cleanName = name.replace(/穴$/, '')
  return map[cleanName] || map[name] || map[cleanName + '穴'] || null
}

/**
 * 检查是否在索引中 (需要先调用 loadAcupointMap)
 */
export async function findAcupoint(name: string): Promise<AcupointIndex | null> {
  const map = await loadAcupointMap()
  return getAcupointFromMap(map, name)
}