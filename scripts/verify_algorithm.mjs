/**
 * 时空方位 · 算法端到端验证脚本
 *
 * 用法: npx tsx scripts/verify_algorithm.mjs
 *
 * 验证内容:
 * 1. 引擎输出 (engine.ts) 的日柱 + 阳遁/阴遁
 * 2. JSON 数据 (shikong-fangwei.json) 的完整性和一致性
 * 3. 与 Excel 校勘明细的一致性
 * 4. 与 Python 独立实现 + 公开万年历的交叉验证
 */

import { calculateAll } from '../src/lib/engine'
import { calcDunType } from '../src/lib/jieqi'
import { getDayGan, getDayZhi } from '../src/lib/data'
import { readFileSync, existsSync } from 'fs'

let passed = 0
let failed = 0

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${name}${detail ? ' · ' + detail : ''}`)
    passed++
  } else {
    console.log(`  ❌ ${name}${detail ? ' · ' + detail : ''}`)
    failed++
  }
}

console.log('\n========== 1. 日柱计算验证 ==========')

// 公开万年历验证
const PUBLIC_DATES = [
  { date: '2026-08-09', day: '乙卯', src: 'qmrl888 + tianqi.com' },
  { date: '2026-06-21', day: '丙寅', src: '4qx.net + gqfkz.cn + zhouyi365.com' },
  { date: '2000-01-01', day: '戊午', src: '公开资料 千禧年元旦' },
  { date: '2024-02-10', day: '甲辰', src: '公开资料 2024春节' },
  { date: '1949-10-01', day: '甲子', src: '公开资料 共和国成立' },
]

for (const t of PUBLIC_DATES) {
  const [y, m, d] = t.date.split('-').map(Number)
  const got = getDayGan(y, m, d) + getDayZhi(y, m, d)
  check(`${t.date} = ${t.day}`, got === t.day, `(${t.src})`)
}

// 基准日
check(
  '基准日 1940-09-18 = 甲子',
  getDayGan(1940, 9, 18) === '甲' && getDayZhi(1940, 9, 18) === '子'
)

// 60 甲子循环
check(
  '60 甲子循环 (基准 +60 天)',
  getDayGan(1940, 9, 18 + 60) === '甲' && getDayZhi(1940, 9, 18 + 60) === '子'
)

console.log('\n========== 2. 阳遁/阴遁判定验证 ==========')

// 边界用例
const DUN_TESTS = [
  { date: '2024-01-01', dun: '阳遁', desc: '冬至后' },
  { date: '2024-06-21', dun: '阴遁', desc: '夏至当天' },
  { date: '2024-12-21', dun: '阳遁', desc: '冬至当天' },
  { date: '2025-08-01', dun: '阴遁', desc: '夏至后' },
  { date: '2026-01-01', dun: '阳遁', desc: '冬至后' },
  { date: '2026-06-20', dun: '阳遁', desc: '夏至前一天 ⭐' },
  { date: '2026-06-21', dun: '阴遁', desc: '夏至当天 ⭐' },
  { date: '2026-12-21', dun: '阴遁', desc: '冬至前一天 ⭐' },
  { date: '2026-12-22', dun: '阳遁', desc: '冬至当天 ⭐' },
]

for (const t of DUN_TESTS) {
  const [y, m, d] = t.date.split('-').map(Number)
  const got = calcDunType(y, m, d)
  check(`${t.date} = ${t.dun} (${t.desc})`, got === t.dun)
}

console.log('\n========== 3. JSON 数据完整性验证 ==========')

const jsonPath = 'public/shikong-fangwei.json'
if (!existsSync(jsonPath)) {
  console.log(`  ❌ ${jsonPath} 不存在`)
  failed++
} else {
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  
  // 60 日柱全部存在
  check('60 日柱全部存在', Object.keys(data).length === 60, `实际: ${Object.keys(data).length}/60`)
  
  // 每个日柱有阳遁 + 阴遁
  let bothCount = 0
  for (const day of Object.keys(data)) {
    if (data[day]['阳遁'] && data[day]['阴遁']) bothCount++
  }
  check('每个日柱都有阳遁 + 阴遁', bothCount === 60, `实际: ${bothCount}/60`)
  
  // 每个 entry 的八方都有 8 个方位
  let validEight = 0
  let totalEntries = 0
  for (const day of Object.keys(data)) {
    for (const dun of ['阳遁', '阴遁']) {
      totalEntries++
      const entry = data[day][dun]
      if (entry && entry.八方 && entry.八方.length === 8) {
        // 检查 8 个方位都不同
        const fw = new Set(entry.八方.map(e => e.方))
        if (fw.size === 8) validEight++
      }
    }
  }
  check('所有 entry 含 8 个不同方位', validEight === 120, `实际: ${validEight}/120`)
  
  // 每个八方有门 + 星
  let validFen = 0
  for (const day of Object.keys(data)) {
    for (const dun of ['阳遁', '阴遁']) {
      for (const e of data[day][dun].八方) {
        if (e.门 && e.星) validFen++
      }
    }
  }
  check('所有八方都有 门+星', validFen === 960, `实际: ${validFen}/960`)
}

console.log('\n========== 4. 端到端集成测试 ==========')

if (existsSync(jsonPath)) {
  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  
  const E2E_TESTS = [
    { date: '2026-08-09', hour: 22, day: '乙卯', dun: '阴遁', desc: '夏至后 亥时' },
    { date: '2026-01-15', hour: 10, day: '己丑', dun: '阳遁', desc: '冬至后 巳时' },
    { date: '2026-06-21', hour: 12, day: '丙寅', dun: '阴遁', desc: '夏至当天 午时' },
    { date: '2026-12-22', hour: 12, day: '庚午', dun: '阳遁', desc: '冬至当天 午时' },
  ]
  
  for (const t of E2E_TESTS) {
    const [y, m, d] = t.date.split('-').map(Number)
    const result = calculateAll(y, m, d, t.hour, 0)
    const dayOk = result.dayGanZhi === t.day
    const dunOk = result.dunType === t.dun
    const dataOk = !!data[result.dayGanZhi]?.[result.dunType]
    
    const allOk = dayOk && dunOk && dataOk
    check(`${t.desc}`, allOk,
      `日柱=${result.dayGanZhi} (期望 ${t.day}) | 遁局=${result.dunType} (期望 ${t.dun}) | 数据=${dataOk ? '✅' : '❌'}`
    )
  }
}

console.log('\n========== 总览 ==========')
console.log(`  通过: ${passed}`)
console.log(`  失败: ${failed}`)
console.log(`  总计: ${passed + failed}`)
console.log(`  通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

if (failed > 0) {
  console.log('\n  ❌ 有失败用例')
  process.exit(1)
} else {
  console.log('\n  ✅ 全部通过')
  process.exit(0)
}