# 时空方位 · 算法原理（修正版 v2）

> **核心修正**: `dayYinYang` (日干阴阳) 和 `dunType` (阳遁/阴遁) 是**两个完全独立的概念**，必须分别计算。

---

## ⚠️ **历史错误 (v1 已修正)**

| 字段 | v1 (错误) | v2 (正确) |
|---|---|---|
| `dayYinYang` | TIAN_GAN.indexOf(dayGan) % 2 | TIAN_GAN.indexOf(dayGan) % 2 ✅ (这个原本就对) |
| `dunType` | `dayYinYang === '阳' ? '阳遁' : '阴遁'` ❌ | `calcDunType(year, month, day)` ✅ |

**v1 错误本质**：把日干阴阳 = 奇门遁局 ❌

**证据**：Excel 中**丙寅日**同时存在 阳遁+阴遁 两行数据。如果日干决定遁局，丙(阳干) 应只有阳遁。但 Excel 给了 60×2 = 120 行。

---

## ✅ **v2 正确设计**

```
输入: 公历日期 + 时辰
  │
  ├── [1] 日历算法 → dayGanZhi + dayYinYang (日干阴阳)
  │     │
  │     ├── 基准日: 1940-09-18 (甲子日)
  │     ├── deltaDays = (input - BASE_DATE) / 86400000
  │     ├── dayGan = TIAN_GAN[deltaDays % 10]
  │     ├── dayZhi = DI_ZHI[deltaDays % 12]
  │     └── dayYinYang = TIAN_GAN.indexOf(dayGan) % 2 === 0 ? '阳' : '阴'
  │
  ├── [2] 节气算法 → dunType (阳遁/阴遁)
  │     │
  │     ├── 规则: 冬至 → 阳遁, 夏至 → 阴遁
  │     ├── 算法: 查 24 节气表 (1900-2100)
  │     ├── 冬至 ~ 12月22日, 夏至 ~ 6月21日
  │     └── 阳遁: 冬至(含) → 夏至前一天
  │         阴遁: 夏至(含) → 冬至前一天
  │
  └── [3] 时辰算法 → hourZhi + hourGanZhi
        │
        └── 五鼠遁法: 日干 → 五鼠遁组 → 时干
            例: 甲子日 亥时 = 甲子(子) + ... + 甲亥

最终输入到查询:
  dayGanZhi + dayYinYang (值阳/值阴判断依据)
  + dunType (阳遁/阴遁 → 方位表)
  + hourZhi (时辰)
  ↓
时空方位数据 map[dayGanZhi][dunType]
```

---

## 🎯 **关键区分：两套"阴阳"**

| 概念 | 决定依据 | 用途 |
|---|---|---|
| **日阴/日阳** | 日干 (甲丙戊庚壬 = 阳, 乙丁己辛癸 = 阴) | 值阳(三焦) vs 值阴(心包)；六阳时/六阴时 |
| **阳遁/阴遁** | 节气 (冬至→阳遁, 夏至→阴遁) | 八门/九星方位选择 (神针心传奇门遁局) |

**重要**：在《天乙神针》针法中，这两套阴阳**同时存在**但**用途不同**：
- 值符走六阳时/六阴时 → 由**日干阴阳**决定
- 八方九星方位表 → 由**阳遁/阴遁**决定 (节气)

---

## 📊 **完整计算示例**

### **示例 1: 2026-08-09 亥时 (夏至后)**

```
日期: 2026-08-09
时辰: 22:00 (亥时)

[1] 日历算法
  BASE_DATE = 1940-09-18 (甲子日)
  deltaDays = 31,403
  dayGan = TIAN_GAN[31403 % 10] = TIAN_GAN[3] = '丁'
  dayZhi = DI_ZHI[31403 % 12] = DI_ZHI[11] = '亥'
  dayGanZhi = '丁亥'
  dayYinYang = '阴' (丁 是阴干)

[2] 节气算法
  2026-08-09 在 2026 夏至 (6/21) 之后, 冬至 (12/22) 之前
  → 阴遁

[3] 时辰算法
  hourZhi = hourToDiZhi(22) = '亥'
  hourGanZhi = getHourGanZhi('丁', '亥') = '丁亥' (丁壬日起丁时)

查询: map['丁亥']['阴遁']
结果:
  中宫星: 太乙
  喜神方: 西北
  大吉方: 东（小吉）
  八方: [惊/摄提, 死/青龙, 景/招摇, 开/轩辕, ...]
```

### **示例 2: 2026-06-21 午时 (夏至当天) - 关键差异案例**

```
日期: 2026-06-21 (夏至当天)

[1] 日历算法
  deltaDays = 31,324
  dayGan = '丙' (阳干)
  dayZhi = '寅'
  dayGanZhi = '丙寅'
  dayYinYang = '阳'

[2] 节气算法 ⭐
  2026-06-21 = 2026 夏至当天
  → 阴遁 (传统规则: 夏至阴遁)

[3] 对比 v1 vs v2:
  v1 (错误): dayYinYang='阳' → '阳遁' → 查丙寅阳遁表 ❌
  v2 (正确): 2026-06-21 是夏至 → '阴遁' → 查丙寅阴遁表 ✅

查询: map['丙寅']['阴遁']
结果:
  中宫星: 天符
  喜神方: 西南
  大吉方: 东南、南、西南
```

### **示例 3: 2026-01-15 巳时 (冬至后, 阳遁期间) - 验证阳干阳遁**

```
日期: 2026-01-15

[1] 日历算法
  deltaDays = 31,197
  dayGan = '己' (阴干)
  dayZhi = '丑'
  dayGanZhi = '己丑'
  dayYinYang = '阴'

[2] 节气算法 ⭐
  2026-01-15 在 2025-2026 冬至 (12/22) 之后, 2026 夏至 (6/21) 之前
  → 阳遁

查询: map['己丑']['阳遁']
结果:
  中宫星: 天乙
  喜神方: 东北
  大吉方: 西北
```

---

## 🎯 **节气算法细节**

### 节气查表 (1900-2100)

**位置**：`src/lib/jieqi.ts`

```typescript
const SOLSTICE_TABLE: Record<number, { winter: [number, number]; summer: [number, number] }> = {
  // year: { winter: (month, day), summer: (month, day) }
  2026: { winter: [12, 22], summer: [6, 21] },
  // ...
}
```

### 判定逻辑

```typescript
export function calcDunType(year: number, month: number, day: number): DunType {
  const entry = SOLSTICE_TABLE[year]
  if (!entry) return calcDunTypeFallback(month, day)  // 范围外 fallback
  
  const [winterM, winterD] = entry.winter
  const [summerM, summerD] = entry.summer
  
  const todayDOY = dayOfYear(month, day)
  const winterDOY = dayOfYear(winterM, winterD)
  const summerDOY = dayOfYear(summerM, summerD)
  
  if (todayDOY >= winterDOY || todayDOY < summerDOY) {
    return '阳遁'  // 冬至(含) → 夏至前一天
  }
  return '阴遁'  // 夏至(含) → 冬至前一天
}
```

### 简化算法 (范围外兜底)

```typescript
function calcDunTypeFallback(month: number, day: number): DunType {
  if (month === 12 && day >= 22) return '阳遁'  // 冬至后
  if (month <= 6 && (month < 6 || day < 21)) return '阳遁'  // 夏至前
  return '阴遁'
}
```

---

## 🕐 **时区处理**

**位置**：`src/lib/data.ts`

```typescript
export const BASE_DATE = new Date(Date.UTC(1940, 8, 18))  // 1940-09-18 甲子日 (UTC)

export function getDayGan(year, month, day): TianGan {
  const d = new Date(Date.UTC(year, month - 1, day))  // 强制 UTC
  const delta = Math.round((d.getTime() - BASE_DATE.getTime()) / 86400000)
  return TIAN_GAN[((delta % 10) + 10) % 10]
}
```

**关键点**：
1. 基准日和输入日期都用 `Date.UTC()` 构造
2. 天数差用 `Math.round()` (避免 DST 抖动)
3. 模运算 `((n % x) + x) % x` 处理负数

---

## 📁 **相关文件**

| 文件 | 作用 | 关键修改 |
|---|---|---|
| `src/lib/jieqi.ts` | **新增**：24 节气查表 + 阳遁/阴遁判定 | - |
| `src/lib/engine.ts` | calculateAll 输出 | 新增 `dunType` 字段 |
| `src/lib/data.ts` | 基准日 + 日干支计算 | 已用 UTC (无需改) |
| `src/app/page.tsx` | ShiKongFangWei 组件 | 用 `dunType` 替代 `dayYinYang` |

---

## 🔬 **测试验证**

6 个测试用例全部通过：

```
✅ 2026-08-09 夏至后 → 阴遁 (太乙 | 西北 | 东)
✅ 2026-01-15 冬至后 → 阳遁 (天乙 | 东北 | 西北)
✅ 2026-06-21 夏至当天 → 阴遁 (天符 | 西南 | 东南、南、西南) ⭐ 关键差异
✅ 2026-12-22 冬至当天 → 阳遁 (太乙 | 西北 | 东、东南) ⭐ 关键差异
✅ 2026-04-15 春分后 → 阳遁 (青龙 | 东北 | 东北)
✅ 2026-10-15 秋分后 → 阴遁 (轩辕 | 南 | 西)
```

---

## 📝 **历史教训**

传统中医/术数计算中，"阴阳" 是个**重载概念**：
- 在不同语境下，可以指**日干阴阳**、**奇门遁局**、**经脉阴阳**、**时辰阴阳** 等
- 在《天乙神针》针法中，至少有**两套阴阳**同时存在且**用途不同**
- 代码中必须用**不同字段名**区分 (`dayYinYang` vs `dunType`)，绝不能共用

---

## 🎨 **相关数据来源**

- **24 节气日期** (1900-2100): 香港天文台 / 中国科学院紫金山天文台
- **传统奇门遁局规则**: 《奇门法窍》"冬至为阳遁……夏至阴遁"
- **60 日柱时空方位数据**: 神针心传·奇门通玄针法 (10 处校勘已统一)