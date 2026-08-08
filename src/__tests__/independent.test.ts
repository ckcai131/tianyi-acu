/**
 * tianyi-acu 计算引擎 - 第三方独立对照测试
 *
 * 测试方法论:
 *   1. 干支基准: 用独立 JD 公式 (验证 1940-09-18 = 甲子)
 *   2. 干支跨日: 跨多年独立日期对照 (1940, 2000, 2024, 2026)
 *   3. 五鼠遁: 已知古籍歌诀 ("甲己还加甲, 乙庚丙作初, ...")
 *   4. 算法逻辑: 与第三方独立实现交叉验证
 *
 * 数据来源:
 *   - 干支: 儒略日公式 (天文算法)
 *   - 五鼠遁: 《子平术》《三命通会》等古籍
 *   - Excel 数据: 视为权威源, 但只用于"自洽性"测试
 *   - 不依赖: chrono-acu (项目自己代码)
 */
import { describe, it, expect } from 'vitest'
import { TIAN_GAN, DI_ZHI, getDayGan, getDayZhi, getHourGanZhi, hourToDiZhi } from '@/lib/data'
import { calculateAll } from '@/lib/engine'

describe('一、干支基准日（独立权威）', () => {
  it('1940-09-18 是甲子日（项目基准）', () => {
    expect(getDayGan(1940, 9, 18)).toBe('甲')
    expect(getDayZhi(1940, 9, 18)).toBe('子')
  })

  it('1940-09-19 是乙丑日（+1天）', () => {
    expect(getDayGan(1940, 9, 19)).toBe('乙')
    expect(getDayZhi(1940, 9, 19)).toBe('丑')
  })

  it('跨10天 干支循环（甲→甲）', () => {
    // 甲子 +10天 = 甲戌
    expect(getDayGan(1940, 9, 28)).toBe('甲')
    expect(getDayZhi(1940, 9, 28)).toBe('戌')
  })

  it('跨12天 天干+2, 地支回零（丙子）', () => {
    // 甲子 +12天: 天干+2(甲→丙), 地支+12=回零(子)
    expect(getDayGan(1940, 9, 30)).toBe('丙')
    expect(getDayZhi(1940, 9, 30)).toBe('子')
  })

  it('跨60天 甲子完整循环', () => {
    // 甲子 +60天 = 甲子
    expect(getDayGan(1940, 11, 17)).toBe('甲')
    expect(getDayZhi(1940, 11, 17)).toBe('子')
  })

  it('2024-02-10 (甲辰年春节) = 甲辰日（独立知识）', () => {
    expect(getDayGan(2024, 2, 10)).toBe('甲')
    expect(getDayZhi(2024, 2, 10)).toBe('辰')
  })

  it('2000-01-01 = 戊午日 (chrono-acu 也用此基准)', () => {
    expect(getDayGan(2000, 1, 1)).toBe('戊')
    expect(getDayZhi(2000, 1, 1)).toBe('午')
  })

  it('2026-08-08 (今天) = 甲寅日（用户已知）', () => {
    expect(getDayGan(2026, 8, 8)).toBe('甲')
    expect(getDayZhi(2026, 8, 8)).toBe('寅')
  })
})

describe('二、五鼠遁（古籍歌诀）', () => {
  // 甲己还加甲, 乙庚丙作初, 丙辛从戊起, 丁壬庚子居, 戊癸何方发, 壬子是真途
  it('甲己日 + 子时 = 甲子时', () => {
    expect(getHourGanZhi('甲', '子')).toBe('甲子')
    expect(getHourGanZhi('己', '子')).toBe('甲子')
  })

  it('乙庚日 + 子时 = 丙子时', () => {
    expect(getHourGanZhi('乙', '子')).toBe('丙子')
    expect(getHourGanZhi('庚', '子')).toBe('丙子')
  })

  it('丙辛日 + 子时 = 戊子时', () => {
    expect(getHourGanZhi('丙', '子')).toBe('戊子')
    expect(getHourGanZhi('辛', '子')).toBe('戊子')
  })

  it('丁壬日 + 子时 = 庚子时', () => {
    expect(getHourGanZhi('丁', '子')).toBe('庚子')
    expect(getHourGanZhi('壬', '子')).toBe('庚子')
  })

  it('戊癸日 + 子时 = 壬子时', () => {
    expect(getHourGanZhi('戊', '子')).toBe('壬子')
    expect(getHourGanZhi('癸', '子')).toBe('壬子')
  })

  // 验证跨时干延续: 甲日子=甲子, 丑=乙丑, 寅=丙寅, 卯=丁卯...
  it('甲日连续时辰推算（数学公式）', () => {
    // 五鼠遁甲己序列: 甲乙丙丁戊己庚辛壬癸 (10个时辰一轮, 跨过子丑寅卯辰巳午未申酉戌亥的 12 - 但 mod 10)
    // 甲子 (0), 乙丑 (1), 丙寅 (2), 丁卯 (3), 戊辰 (4), 己巳 (5), 庚午 (6), 辛未 (7), 壬申 (8), 癸酉 (9), 甲戌 (10%10=0), 乙亥 (11%10=1)
    const expected: Array<[string, string]> = [
      ['子', '甲子'], ['丑', '乙丑'], ['寅', '丙寅'], ['卯', '丁卯'],
      ['辰', '戊辰'], ['巳', '己巳'], ['午', '庚午'], ['未', '辛未'],
      ['申', '壬申'], ['酉', '癸酉'], ['戌', '甲戌'], ['亥', '乙亥'],
    ]
    expected.forEach(([zhi, expGZ]) => {
      expect(getHourGanZhi('甲', zhi as any)).toBe(expGZ)
    })
  })

  it('戊日连续时辰推算', () => {
    // 戊癸序列: 壬癸甲乙丙丁戊己庚辛 (10个)
    const expected = [
      ['子', '壬子'], ['丑', '癸丑'], ['寅', '甲寅'], ['卯', '乙卯'],
      ['辰', '丙辰'], ['巳', '丁巳'], ['午', '戊午'], ['未', '己未'],
      ['申', '庚申'], ['酉', '辛酉'], ['戌', '壬戌'], ['亥', '癸亥'],
    ]
    expected.forEach(([zhi, expectedGZ]) => {
      expect(getHourGanZhi('戊', zhi as any)).toBe(expectedGZ)
    })
  })
})

describe('三、时辰映射（24h → 12时辰）', () => {
  it('关键时辰边界', () => {
    expect(hourToDiZhi(0)).toBe('子')    // 00:00 = 子时 (跨日)
    expect(hourToDiZhi(23)).toBe('子')   // 23:00 = 子时
    expect(hourToDiZhi(1)).toBe('丑')    // 01:00 = 丑时
    expect(hourToDiZhi(11)).toBe('午')   // 11:00 = 午时
    expect(hourToDiZhi(13)).toBe('未')   // 13:00 = 未时
    expect(hourToDiZhi(22)).toBe('亥')   // 22:00 = 亥时
  })

  it('12时辰全覆盖', () => {
    const seen = new Set<string>()
    // 测试每时辰的代表时间
    const hours = [0, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]
    hours.forEach(h => {
      seen.add(hourToDiZhi(h))
    })
    expect(seen.size).toBe(12)
  })
})

describe('四、Excel 计算器示例（用户已确认）', () => {
  it('甲寅日 + 戌时 = Excel 示例输出（阳陵泉/间使/天井/司命）', () => {
    const result = calculateAll(2026, 8, 8, 19, 0)

    // Excel 计算器 sheet 中的输出:
    // 日干=甲, 日阴阳=阳, 值日经络=胆经, 时柱=甲戌
    // 值符穴=阳陵泉, 值使穴=间使, 第三针=天井
    // 吉凶神煞=司命, 黄黑道=黄道, 大吉=是, 喜神方=东北

    expect(result.dayGanZhi).toBe('甲寅')
    expect(result.dayGan).toBe('甲')
    expect(result.dayYinYang).toBe('阳')
    expect(result.main!.zhiFuJingLuo).toBe('胆经')
    expect(result.hourGanZhi).toBe('甲戌')

    // 4 大算法结果
    expect(result.zhiFu!.acupoint).toBe('阳陵泉')
    expect(result.zhiShi!.acupoint).toBe('间使')
    expect(result.zhiYangYin!.acupoint).toBe('天井')

    // 吉凶时
    expect(result.jiXiong!.shenSha).toBe('司命')
    expect(result.jiXiong!.huangHeiDao).toBe('黄道')
    expect(result.jiXiong!.daJi).toBe('是')
    expect(result.main!.xiShenFang).toBe('东北')
  })
})

describe('五、阴阳日逻辑（独立规则）', () => {
  it('阳日（甲丙戊庚壬）→ 值阳模式 → 三焦经', () => {
    for (const gan of ['甲', '丙', '戊', '庚', '壬']) {
      // 找该日干 + 子时对应的日期
      let foundDate: { y: number; m: number; d: number } | null = null
      const base = new Date(Date.UTC(1940, 8, 18))
      for (let delta = 0; delta < 60; delta++) {
        const testDate = new Date(base.getTime() + delta * 86400000)
        if (TIAN_GAN[delta % 10] === gan) {
          foundDate = {
            y: testDate.getUTCFullYear(),
            m: testDate.getUTCMonth() + 1,
            d: testDate.getUTCDate(),
          }
          break
        }
      }
      if (foundDate) {
        const result = calculateAll(foundDate.y, foundDate.m, foundDate.d, 7, 0) // 辰时
        expect(result.dayGan).toBe(gan)
        expect(result.dayYinYang).toBe('阳')
        expect(result.zhiYangYin!.mode).toBe('值阳')
        expect(result.zhiYangYin!.jingLuo).toBe('三焦经')
      }
    }
  })

  it('阴日（乙丁己辛癸）→ 值阴模式 → 心包经', () => {
    for (const gan of ['乙', '丁', '己', '辛', '癸']) {
      let foundDate: { y: number; m: number; d: number } | null = null
      const base = new Date(Date.UTC(1940, 8, 18))
      for (let delta = 0; delta < 60; delta++) {
        const testDate = new Date(base.getTime() + delta * 86400000)
        if (TIAN_GAN[delta % 10] === gan) {
          foundDate = {
            y: testDate.getUTCFullYear(),
            m: testDate.getUTCMonth() + 1,
            d: testDate.getUTCDate(),
          }
          break
        }
      }
      if (foundDate) {
        const result = calculateAll(foundDate.y, foundDate.m, foundDate.d, 1, 0) // 丑时
        expect(result.dayGan).toBe(gan)
        expect(result.dayYinYang).toBe('阴')
        expect(result.zhiYangYin!.mode).toBe('值阴')
        expect(result.zhiYangYin!.jingLuo).toBe('心包经')
      }
    }
  })
})

describe('六、表里经代值逻辑（独立规则）', () => {
  it('阴日+阳时 → 阳干代值 (胆经)', () => {
    // 乙丑日 (阴) + 子时 (阳)
    const result = calculateAll(1940, 9, 19, 23, 0)
    expect(result.dayGanZhi).toBe('乙丑')
    expect(result.dayYinYang).toBe('阴')
    expect(result.hourZhi).toBe('子')
    // 阴日 + 阳时 → 表里经代值（用阳干甲胆经）
    expect(result.zhiFu!.actualGan).toBe('甲')
    expect(result.zhiFu!.actualJingLuo).toBe('胆经')
    expect(result.zhiFu!.rule).toBe('表里经代值')
  })

  it('阴日+阴时 → 本经值符 (肝经)', () => {
    // 乙丑日 (阴) + 丑时 (阴)
    const result = calculateAll(1940, 9, 19, 1, 0)
    expect(result.dayGanZhi).toBe('乙丑')
    expect(result.dayGan).toBe('乙')
    expect(result.hourZhi).toBe('丑')
    // 阴日 + 阴时 → 本经值符（肝经）
    expect(result.zhiFu!.actualGan).toBe('乙')
    expect(result.zhiFu!.actualJingLuo).toBe('肝经')
    expect(result.zhiFu!.rule).toBe('本经值符')
  })

  it('阳日+阴时 → 表里经代值（肝经代胆经）', () => {
    // 甲戌日 (1940-09-28) + 丑时 (阴) - 阳日+阴时 → 表里经代值
    const r2 = calculateAll(1940, 9, 28, 1, 0)
    expect(r2.dayGanZhi).toBe('甲戌')
    expect(r2.dayYinYang).toBe('阳')
    expect(r2.hourZhi).toBe('丑')
    // 阳日 + 阴时 → 表里经代值（肝经）
    expect(r2.zhiFu!.actualJingLuo).toBe('肝经')
    expect(r2.zhiFu!.rule).toBe('表里经代值')
  })

  it('阳日+阳时 → 本经值符', () => {
    // 甲寅日 (阳) + 子时 (阳) - 2026-08-08 23:00 = 甲寅日子时
    const result = calculateAll(2026, 8, 8, 23, 0)
    expect(result.dayGanZhi).toBe('甲寅')
    expect(result.dayYinYang).toBe('阳')
    expect(result.hourZhi).toBe('子')
    expect(result.zhiFu!.actualJingLuo).toBe('胆经')
    expect(result.zhiFu!.rule).toBe('本经值符')
  })
})

describe('七、与 chrono-acu 独立交叉验证', () => {
  // chrono-acu 已知输出: 2024-02-10 甲辰日 + 子时 = 五鼠遁甲子时
  it('2024-02-10 (甲辰日) 子时 = 甲子时 (chrono-acu 也这么算)', () => {
    const result = calculateAll(2024, 2, 10, 23, 0)
    expect(result.dayGanZhi).toBe('甲辰')
    expect(result.hourZhi).toBe('子')
    expect(result.hourGanZhi).toBe('甲子')
  })

  it('2024-03-21 (春分) 甲日 (跨历法验证)', () => {
    expect(getDayGan(2024, 3, 21)).toBe('甲')
  })

  it('2024-06-21 (夏至) 丙日', () => {
    expect(getDayGan(2024, 6, 21)).toBe('丙')
  })
})