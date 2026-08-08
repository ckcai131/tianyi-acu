/**
 * tianyi-acu 穴位 → acu-master 3D 穴位代码 映射表
 *
 * acu-master 支持的经络:
 *   - p (肺经, 1-11)
 *   - ig (大肠经, 17-20)
 *   - e (胃经, 部分 1-45)
 *   - vc (任脉, 2-24)
 *
 * 中医穴位 → acu-master 代码 (仅覆盖 acu-master 支持的)
 */

export type MeridianCode = 'p' | 'ig' | 'e' | 'vc' | 'cs'

export interface AcupointMapping {
  code: string                    // acu-master 代码, 如 'p1'
  name: string                    // 中文名, 如 '中府穴'
  meridian: MeridianCode
}

// 完整映射表 (基于中医标准穴位命名)
export const ACUPOINT_MAP: Record<string, AcupointMapping> = {
  // 肺经 (P1-P11)
  '中府': { code: 'p1', name: '中府穴', meridian: 'p' },
  '云门': { code: 'p2', name: '云门穴', meridian: 'p' },
  '天府': { code: 'p3', name: '天府穴', meridian: 'p' },
  '侠白': { code: 'p4', name: '侠白穴', meridian: 'p' },
  '尺泽': { code: 'p5', name: '尺泽穴', meridian: 'p' },
  '孔最': { code: 'p6', name: '孔最穴', meridian: 'p' },
  '列缺': { code: 'p7', name: '列缺穴', meridian: 'p' },
  '经渠': { code: 'p8', name: '经渠穴', meridian: 'p' },
  '太渊': { code: 'p9', name: '太渊穴', meridian: 'p' },
  '鱼际': { code: 'p10', name: '鱼际穴', meridian: 'p' },
  '少商': { code: 'p11', name: '少商穴', meridian: 'p' },

  // 大肠经 (IG17-IG20) - 仅有4 个穴位在 acu-master
  '天鼎': { code: 'ig17', name: '天鼎穴', meridian: 'ig' },
  '扶突': { code: 'ig18', name: '扶突穴', meridian: 'ig' },
  '禾髎': { code: 'ig19', name: '禾髎穴', meridian: 'ig' },
  '迎香': { code: 'ig20', name: '迎香穴', meridian: 'ig' },

  // 胃经 (部分) - acu-master 只支持 E1-E4, E9-E20, E34-E45
  '承泣': { code: 'e1', name: '承泣穴', meridian: 'e' },
  '四白': { code: 'e2', name: '四白穴', meridian: 'e' },
  '巨髎': { code: 'e3', name: '巨髎穴', meridian: 'e' },
  '地仓': { code: 'e4', name: '地仓穴', meridian: 'e' },
  '人迎': { code: 'e9', name: '人迎穴', meridian: 'e' },
  '水突': { code: 'e10', name: '水突穴', meridian: 'e' },
  '气舍': { code: 'e11', name: '气舍穴', meridian: 'e' },
  '缺盆': { code: 'e12', name: '缺盆穴', meridian: 'e' },
  '气户': { code: 'e13', name: '气户穴', meridian: 'e' },
  '库房': { code: 'e14', name: '库房穴', meridian: 'e' },
  '屋翳': { code: 'e15', name: '屋翳穴', meridian: 'e' },
  '膺窗': { code: 'e16', name: '膺窗穴', meridian: 'e' },
  '乳中': { code: 'e17', name: '乳中穴', meridian: 'e' },
  '乳根': { code: 'e18', name: '乳根穴', meridian: 'e' },
  '不容': { code: 'e19', name: '不容穴', meridian: 'e' },
  '承满': { code: 'e20', name: '承满穴', meridian: 'e' },
  '气冲': { code: 'e30', name: '气冲穴', meridian: 'e' },
  '髀关': { code: 'e31', name: '髀关穴', meridian: 'e' },
  '伏兔': { code: 'e32', name: '伏兔穴', meridian: 'e' },
  '阴市': { code: 'e33', name: '阴市穴', meridian: 'e' },
  '梁丘': { code: 'e34', name: '梁丘穴', meridian: 'e' },
  '犊鼻': { code: 'e35', name: '犊鼻穴', meridian: 'e' },
  '足三里': { code: 'e36', name: '足三里穴', meridian: 'e' },
  '上巨虚': { code: 'e37', name: '上巨虚穴', meridian: 'e' },
  '条口': { code: 'e38', name: '条口穴', meridian: 'e' },
  '下巨虚': { code: 'e39', name: '下巨虚穴', meridian: 'e' },
  '丰隆': { code: 'e40', name: '丰隆穴', meridian: 'e' },
  '解溪': { code: 'e41', name: '解溪穴', meridian: 'e' },
  '冲阳': { code: 'e42', name: '冲阳穴', meridian: 'e' },
  '陷谷': { code: 'e43', name: '陷谷穴', meridian: 'e' },
  '内庭': { code: 'e44', name: '内庭穴', meridian: 'e' },
  '厉兑': { code: 'e45', name: '厉兑穴', meridian: 'e' },

  // 任脉 (VC2-VC24)
  '曲骨': { code: 'vc2', name: '曲骨穴', meridian: 'vc' },
  '中极': { code: 'vc3', name: '中极穴', meridian: 'vc' },
  '关元': { code: 'vc4', name: '关元穴', meridian: 'vc' },
  '石门': { code: 'vc5', name: '石门穴', meridian: 'vc' },
  '气海': { code: 'vc6', name: '气海穴', meridian: 'vc' },
  '阴交': { code: 'vc7', name: '阴交穴', meridian: 'vc' },
  '神阙': { code: 'vc8', name: '神阙穴', meridian: 'vc' },
  '水分': { code: 'vc9', name: '水分穴', meridian: 'vc' },
  '下脘': { code: 'vc10', name: '下脘穴', meridian: 'vc' },
  '建里': { code: 'vc11', name: '建里穴', meridian: 'vc' },
  '中脘': { code: 'vc12', name: '中脘穴', meridian: 'vc' },
  '上脘': { code: 'vc13', name: '上脘穴', meridian: 'vc' },
  '巨阙': { code: 'vc14', name: '巨阙穴', meridian: 'vc' },
  '鸠尾': { code: 'vc15', name: '鸠尾穴', meridian: 'vc' },
  '中庭': { code: 'vc16', name: '中庭穴', meridian: 'vc' },
  '膻中': { code: 'vc17', name: '膻中穴', meridian: 'vc' },
  '玉堂': { code: 'vc18', name: '玉堂穴', meridian: 'vc' },
  '紫宫': { code: 'vc19', name: '紫宫穴', meridian: 'vc' },
  '华盖': { code: 'vc20', name: '华盖穴', meridian: 'vc' },
  '璇玑': { code: 'vc21', name: '璇玑穴', meridian: 'vc' },
  '天突': { code: 'vc22', name: '天突穴', meridian: 'vc' },
  '廉泉': { code: 'vc23', name: '廉泉穴', meridian: 'vc' },
  '承浆': { code: 'vc24', name: '承浆穴', meridian: 'vc' },
}

/** 根据穴位名查 3D 穴位代码 */
export function getAcupoint3D(name: string): AcupointMapping | null {
  // 去掉'穴'字
  const cleanName = name.replace(/穴$/, '')
  return ACUPOINT_MAP[cleanName] || null
}

/** 检查是否支持 3D */
export function hasAcupoint3D(name: string): boolean {
  return getAcupoint3D(name) !== null
}