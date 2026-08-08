/**
 * tianyi-acu 计算引擎完整测试
 * 共 1536 个独立测试用例:
 * - 基础函数: 5
 * - 数据完整性: 5
 * - 主表 60 日柱: 60
 * - 值使 12 时辰: 12
 * - 值阳 12 时辰: 12
 * - 值阴 12 时辰: 12
 * - 值符 60 日 × 12 时辰 = 720
 * - 吉凶时 60 日 × 12 时辰 = 720
 * - 统一入口 7 个代表性测试: 7
 */
import { describe, it, expect } from 'vitest'
import {
  calculateAll,
  calculateZhiFu,
  calculateZhiShi,
  calculateZhiYangYin,
  calculateJiXiong,
  getMainSummary,
} from '@/lib/engine'
import { JIAZI_TABLE } from '@/lib/jiazi'
import { ZHI_FU_FULL } from '@/lib/zhifu'
import { ZHI_SHI } from '@/lib/zhishi'
import { ZHI_YANG_YIN } from '@/lib/zhiyy'
import { JI_XIONG } from '@/lib/jixiong'
import { TIAN_GAN, DI_ZHI, getDayGan, getDayZhi, hourToDiZhi, getHourGanZhi } from '@/lib/data'

const JIAZI = (() => {
  const list: Array<[string, string]> = []
  for (const g of TIAN_GAN) {
    for (const z of DI_ZHI) {
      if (TIAN_GAN.indexOf(g) % 2 === DI_ZHI.indexOf(z) % 2) {
        list.push([g, z])
      }
    }
  }
  return list.map(([g, z]) => g + z)
})()

const SHICHEN_HOUR: Record<string, number> = {
  '子': 23, '丑': 1, '寅': 3, '卯': 5, '辰': 7, '巳': 9,
  '午': 11, '未': 13, '申': 15, '酉': 17, '戌': 19, '亥': 21,
}

const SHICHENS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

function findDayGanZhiDate(ganzhi: string): { y: number; m: number; d: number } | null {
  const base = new Date(Date.UTC(1940, 8, 18))
  for (let delta = 0; delta < 60; delta++) {
    const testDate = new Date(base.getTime() + delta * 86400000)
    const g = TIAN_GAN[delta % 10]
    const z = DI_ZHI[delta % 12]
    if (g + z === ganzhi) {
      return {
        y: testDate.getUTCFullYear(),
        m: testDate.getUTCMonth() + 1,
        d: testDate.getUTCDate(),
      }
    }
  }
  return null
}

// ════════════════════════════════════════════════
// 基础函数 5 个测试
// ════════════════════════════════════════════════
describe('基础工具函数', () => {
  it('T01: 60甲子生成正确', () => {
    expect(JIAZI.length).toBe(60)
    expect(JIAZI[0]).toBe('甲子')
    expect(JIAZI[59]).toBe('癸亥')
  })

  it('T02: getDayGan - 甲子基准日 1940-09-18', () => {
    expect(getDayGan(1940, 9, 18)).toBe('甲')
    expect(getDayZhi(1940, 9, 18)).toBe('子')
  })

  it('T03: getDayGan - 隔天是乙丑', () => {
    expect(getDayGan(1940, 9, 19)).toBe('乙')
    expect(getDayZhi(1940, 9, 19)).toBe('丑')
  })

  it('T04: hourToDiZhi - 24h→时辰', () => {
    expect(hourToDiZhi(0)).toBe('子')
    expect(hourToDiZhi(11)).toBe('午')
    expect(hourToDiZhi(12)).toBe('午')
    expect(hourToDiZhi(22)).toBe('亥')
    expect(hourToDiZhi(23)).toBe('子')
  })

  it('T05: getHourGanZhi - 五鼠遁', () => {
    expect(getHourGanZhi('甲', '子')).toBe('甲子')
    expect(getHourGanZhi('己', '子')).toBe('甲子')
    expect(getHourGanZhi('乙', '子')).toBe('丙子')
    expect(getHourGanZhi('庚', '子')).toBe('丙子')
    expect(getHourGanZhi('丙', '子')).toBe('戊子')
    expect(getHourGanZhi('丁', '子')).toBe('庚子')
    expect(getHourGanZhi('戊', '子')).toBe('壬子')
    expect(getHourGanZhi('甲', '午')).toBe('庚午')
    expect(getHourGanZhi('甲', '戌')).toBe('甲戌')
  })
})

// ════════════════════════════════════════════════
// 数据完整性 5 个测试
// ════════════════════════════════════════════════
describe('数据完整性', () => {
  it('T06: JIAZI_TABLE 60 条', () => {
    expect(JIAZI_TABLE.length).toBe(60)
  })

  it('T07: JI_XIONG 720 条', () => {
    expect(JI_XIONG.length).toBe(720)
  })

  it('T08: ZHI_FU_FULL 120 条', () => {
    expect(ZHI_FU_FULL.length).toBe(120)
  })

  it('T09: ZHI_SHI 12 条', () => {
    expect(ZHI_SHI.length).toBe(12)
  })

  it('T10: ZHI_YANG_YIN 24 条', () => {
    expect(ZHI_YANG_YIN.length).toBe(24)
  })
})

// ════════════════════════════════════════════════
// 主表 60 条独立测试 (60 个测试)
// ════════════════════════════════════════════════
describe('getMainSummary 六十甲子主表', () => {
  JIAZI.forEach((ganzhi, idx) => {
    it(`主表 #${idx + 1}: ${ganzhi}日`, () => {
      const result = getMainSummary(ganzhi)
      expect(result).not.toBeNull()
      expect(result!.dayGanZhi).toBe(ganzhi)

      const expected = JIAZI_TABLE.find(r => r[0] === ganzhi)!
      expect(result!.dayGan).toBe(expected[1])
      expect(result!.dayZhi).toBe(expected[2])
      expect(result!.dayYinYang).toBe(expected[3])
      expect(result!.zhiFuJingLuo).toBe(expected[4])
      expect(result!.xiShenFang).toBe(expected[5])
      expect(result!.thirdNeedleMode).toBe(expected[6])
      expect(result!.huangDaoShiChen).toEqual(expected[7].split('、'))
      expect(result!.daJiShiChen).toEqual(expected[8].split('、'))
    })
  })
})

// ════════════════════════════════════════════════
// 值使 12 条独立测试
// ════════════════════════════════════════════════
describe('calculateZhiShi 值使规则', () => {
  SHICHENS.forEach((zhi, idx) => {
    it(`值使 #${idx + 1}: ${zhi}时`, () => {
      const result = calculateZhiShi(zhi as any)
      expect(result).not.toBeNull()
      const expected = ZHI_SHI.find(r => r[0] === zhi)!
      expect(result!.wuXing).toBe(expected[2])
      expect(result!.jingLuo).toBe(expected[3])
      expect(result!.acupoint).toBe(expected[4])
      expect(result!.pointNature).toBe(expected[5])
    })
  })
})

// ════════════════════════════════════════════════
// 值阳 12 条
// ════════════════════════════════════════════════
describe('calculateZhiYangYin 值阳模式', () => {
  SHICHENS.forEach((zhi, idx) => {
    it(`值阳 #${idx + 1}: 阳日 +${zhi}时`, () => {
      const result = calculateZhiYangYin('阳', zhi as any)
      expect(result).not.toBeNull()
      expect(result!.mode).toBe('值阳')
      const expected = ZHI_YANG_YIN.find(r => r[0] === '值阳' && r[2] === zhi)!
      expect(result!.jingLuo).toBe(expected[3])
      expect(result!.acupoint).toBe(expected[4])
      expect(result!.pointNature).toBe(expected[5])
    })
  })
})

// ════════════════════════════════════════════════
// 值阴 12 条
// ════════════════════════════════════════════════
describe('calculateZhiYangYin 值阴模式', () => {
  SHICHENS.forEach((zhi, idx) => {
    it(`值阴 #${idx + 1}: 阴日 +${zhi}时`, () => {
      const result = calculateZhiYangYin('阴', zhi as any)
      expect(result).not.toBeNull()
      expect(result!.mode).toBe('值阴')
      const expected = ZHI_YANG_YIN.find(r => r[0] === '值阴' && r[2] === zhi)!
      expect(result!.jingLuo).toBe(expected[3])
      expect(result!.acupoint).toBe(expected[4])
      expect(result!.pointNature).toBe(expected[5])
    })
  })
})

// ════════════════════════════════════════════════
// 值符 60 日 × 12 时辰 = 720 个独立测试
// ════════════════════════════════════════════════
describe('calculateZhiFu 值符全时段', () => {
  let testNo = 0
  JIAZI.forEach((ganzhi) => {
    const dayInfo = findDayGanZhiDate(ganzhi)!
    SHICHENS.forEach((zhi) => {
      const hour = SHICHEN_HOUR[zhi]
      testNo++
      it(`值符 #${testNo}: ${ganzhi}日 + ${zhi}时`, () => {
        const result = calculateAll(dayInfo.y, dayInfo.m, dayInfo.d, hour, 0)
        expect(result.zhiFu).not.toBeNull()

        const expected = ZHI_FU_FULL.find(r => r[0] === result.dayGan && r[2] === zhi)!
        expect(result.zhiFu!.actualJingLuo).toBe(expected[5])
        expect(result.zhiFu!.acupoint).toBe(expected[6])
        expect(result.zhiFu!.pointNature).toBe(expected[7])
        expect(result.zhiFu!.rule).toBe(expected[8])
      })
    })
  })
})

// ════════════════════════════════════════════════
// 吉凶时 60 日 × 12 时辰 = 720 个独立测试
// ════════════════════════════════════════════════
describe('calculateJiXiong 吉凶时', () => {
  let testNo = 0
  JIAZI.forEach((ganzhi) => {
    const dayInfo = findDayGanZhiDate(ganzhi)!
    SHICHENS.forEach((zhi) => {
      const hour = SHICHEN_HOUR[zhi]
      testNo++
      it(`吉凶时 #${testNo}: ${ganzhi}日 + ${zhi}时`, () => {
        const result = calculateAll(dayInfo.y, dayInfo.m, dayInfo.d, hour, 0)
        expect(result.jiXiong).not.toBeNull()

        const expected = JI_XIONG.find(r => r[0] === ganzhi && r[1] === zhi)!
        expect(result.jiXiong!.hourGanZhi).toBe(expected[2])
        expect(result.jiXiong!.shenSha).toBe(expected[3])
        expect(result.jiXiong!.huangHeiDao).toBe(expected[4])
        expect(result.jiXiong!.jieKong).toBe(expected[5])
        expect(result.jiXiong!.wuBuYu).toBe(expected[6])
        expect(result.jiXiong!.daJi).toBe(expected[7])
      })
    })
  })
})

// ════════════════════════════════════════════════
// 统一入口 7 个代表性测试 (跟 Excel 计算器示例一致)
// ════════════════════════════════════════════════
describe('calculateAll 统一入口', () => {
  it('甲寅日+戌时 (跟 Excel 计算器示例一致)', () => {
    const result = calculateAll(2026, 8, 8, 19, 0)
    expect(result.dayGanZhi).toBe('甲寅')
    expect(result.dayGan).toBe('甲')
    expect(result.dayZhi).toBe('寅')
    expect(result.dayYinYang).toBe('阳')
    expect(result.hourZhi).toBe('戌')
    expect(result.hourGanZhi).toBe('甲戌')

    expect(result.zhiFu!.acupoint).toBe('阳陵泉')
    expect(result.zhiShi!.acupoint).toBe('间使')
    expect(result.zhiYangYin!.acupoint).toBe('天井')
    expect(result.jiXiong!.shenSha).toBe('司命')
    expect(result.jiXiong!.huangHeiDao).toBe('黄道')
    expect(result.jiXiong!.daJi).toBe('是')
    expect(result.main!.xiShenFang).toBe('东北')
  })

  it('甲子日+子时 (基准日)', () => {
    const result = calculateAll(1940, 9, 18, 23, 0)
    expect(result.dayGanZhi).toBe('甲子')
    expect(result.hourZhi).toBe('子')
    expect(result.hourGanZhi).toBe('甲子')
    expect(result.jiXiong!.shenSha).toBe('金匮')
    expect(result.jiXiong!.huangHeiDao).toBe('黄道')
    expect(result.jiXiong!.daJi).toBe('是')
  })

  it('阴日+阳时 → 表里经代值', () => {
    // 乙丑日 (阴) + 子时 (阳) → 应取阳干甲代值
    const result = calculateAll(1940, 9, 19, 23, 0)
    expect(result.dayGanZhi).toBe('乙丑')
    expect(result.dayGan).toBe('乙')
    expect(result.dayYinYang).toBe('阴')
    expect(result.hourZhi).toBe('子')
    expect(result.zhiFu!.actualGan).toBe('甲')
    expect(result.zhiFu!.actualJingLuo).toBe('胆经')
    expect(result.zhiFu!.acupoint).toBe('窍阴')
    expect(result.zhiFu!.rule).toBe('表里经代值')
  })

  it('阴日+阴时 → 本经值符', () => {
    // 乙丑日 (阴) + 丑时 (阴) → 应取本经肝经
    const result = calculateAll(1940, 9, 19, 1, 0)
    expect(result.dayGanZhi).toBe('乙丑')
    expect(result.dayGan).toBe('乙')
    expect(result.hourZhi).toBe('丑')
    expect(result.zhiFu!.actualGan).toBe('乙')
    expect(result.zhiFu!.actualJingLuo).toBe('肝经')
    expect(result.zhiFu!.acupoint).toBe('大敦')
    expect(result.zhiFu!.rule).toBe('本经值符')
  })

  it('阳日 → 值阳模式 (三焦经)', () => {
    const result = calculateAll(1940, 9, 18, 7, 0)
    expect(result.dayYinYang).toBe('阳')
    expect(result.zhiYangYin!.mode).toBe('值阳')
    expect(result.zhiYangYin!.jingLuo).toBe('三焦经')
  })

  it('阴日 → 值阴模式 (心包经)', () => {
    const result = calculateAll(1940, 9, 19, 1, 0)
    expect(result.dayYinYang).toBe('阴')
    expect(result.zhiYangYin!.mode).toBe('值阴')
    expect(result.zhiYangYin!.jingLuo).toBe('心包经')
  })

  it('大吉时字段 (甲子日+子时)', () => {
    const result = calculateAll(1940, 9, 18, 23, 0)
    expect(result.jiXiong!.daJi).toBe('是')
    expect(result.main!.daJiShiChen).toContain('子')
  })
})