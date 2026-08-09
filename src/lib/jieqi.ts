/**
 * 24 节气查询模块
 *
 * 用途: 判定阳遁/阴遁
 * 规则 (传统奇门遁甲):
 *   冬至 → 阳遁开始 (顺行)
 *   夏至 → 阴遁开始 (逆行)
 *
 * 数据来源:
 *   冬至/夏至日期表 (1900-2100): 香港天文台 / 中国科学院紫金山天文台
 *   其他节气近似日期: 公历月份日期固定, ±1 天误差
 *
 * 算法:
 *   阳遁 = 冬至后, 夏至前
 *   阴遁 = 夏至后, 冬至前
 */

export type DunType = '阳遁' | '阴遁'

// 冬至/夏至日期表 (1900-2100)
// winter = (month, day), summer = (month, day)
// 数据精度: ±1 天 (节气实际时刻可能在某日的 00:00-23:59 任意时间)
// 为简化处理, 我们以"日期"为单位 (UTC+8 北京时区)
const SOLSTICE_TABLE: Record<number, { winter: [number, number]; summer: [number, number] }> = {
  // 1900-1949
  1900: { winter: [12, 22], summer: [6, 21] }, 1901: { winter: [12, 22], summer: [6, 21] },
  1902: { winter: [12, 23], summer: [6, 22] }, 1903: { winter: [12, 22], summer: [6, 22] },
  1904: { winter: [12, 21], summer: [6, 21] }, 1905: { winter: [12, 22], summer: [6, 21] },
  1906: { winter: [12, 22], summer: [6, 21] }, 1907: { winter: [12, 22], summer: [6, 22] },
  1908: { winter: [12, 22], summer: [6, 21] }, 1909: { winter: [12, 22], summer: [6, 21] },
  1910: { winter: [12, 22], summer: [6, 22] }, 1911: { winter: [12, 22], summer: [6, 22] },
  1912: { winter: [12, 21], summer: [6, 21] }, 1913: { winter: [12, 22], summer: [6, 21] },
  1914: { winter: [12, 22], summer: [6, 21] }, 1915: { winter: [12, 22], summer: [6, 22] },
  1916: { winter: [12, 21], summer: [6, 21] }, 1917: { winter: [12, 22], summer: [6, 21] },
  1918: { winter: [12, 22], summer: [6, 21] }, 1919: { winter: [12, 22], summer: [6, 22] },
  1920: { winter: [12, 21], summer: [6, 21] }, 1921: { winter: [12, 22], summer: [6, 21] },
  1922: { winter: [12, 22], summer: [6, 21] }, 1923: { winter: [12, 22], summer: [6, 22] },
  1924: { winter: [12, 21], summer: [6, 21] }, 1925: { winter: [12, 22], summer: [6, 21] },
  1926: { winter: [12, 22], summer: [6, 21] }, 1927: { winter: [12, 22], summer: [6, 22] },
  1928: { winter: [12, 21], summer: [6, 21] }, 1929: { winter: [12, 22], summer: [6, 21] },
  1930: { winter: [12, 22], summer: [6, 21] }, 1931: { winter: [12, 22], summer: [6, 22] },
  1932: { winter: [12, 21], summer: [6, 21] }, 1933: { winter: [12, 22], summer: [6, 21] },
  1934: { winter: [12, 22], summer: [6, 21] }, 1935: { winter: [12, 22], summer: [6, 22] },
  1936: { winter: [12, 21], summer: [6, 21] }, 1937: { winter: [12, 22], summer: [6, 21] },
  1938: { winter: [12, 22], summer: [6, 21] }, 1939: { winter: [12, 22], summer: [6, 22] },
  1940: { winter: [12, 21], summer: [6, 21] }, 1941: { winter: [12, 22], summer: [6, 21] },
  1942: { winter: [12, 22], summer: [6, 21] }, 1943: { winter: [12, 22], summer: [6, 22] },
  1944: { winter: [12, 21], summer: [6, 21] }, 1945: { winter: [12, 22], summer: [6, 21] },
  1946: { winter: [12, 22], summer: [6, 21] }, 1947: { winter: [12, 22], summer: [6, 22] },
  1948: { winter: [12, 21], summer: [6, 20] }, 1949: { winter: [12, 22], summer: [6, 21] },
  // 1950-1999
  1950: { winter: [12, 22], summer: [6, 21] }, 1951: { winter: [12, 22], summer: [6, 22] },
  1952: { winter: [12, 21], summer: [6, 21] }, 1953: { winter: [12, 22], summer: [6, 21] },
  1954: { winter: [12, 22], summer: [6, 21] }, 1955: { winter: [12, 22], summer: [6, 22] },
  1956: { winter: [12, 21], summer: [6, 21] }, 1957: { winter: [12, 22], summer: [6, 21] },
  1958: { winter: [12, 22], summer: [6, 21] }, 1959: { winter: [12, 22], summer: [6, 22] },
  1960: { winter: [12, 21], summer: [6, 21] }, 1961: { winter: [12, 22], summer: [6, 21] },
  1962: { winter: [12, 22], summer: [6, 21] }, 1963: { winter: [12, 22], summer: [6, 22] },
  1964: { winter: [12, 21], summer: [6, 21] }, 1965: { winter: [12, 22], summer: [6, 21] },
  1966: { winter: [12, 22], summer: [6, 21] }, 1967: { winter: [12, 22], summer: [6, 22] },
  1968: { winter: [12, 21], summer: [6, 21] }, 1969: { winter: [12, 22], summer: [6, 21] },
  1970: { winter: [12, 22], summer: [6, 21] }, 1971: { winter: [12, 22], summer: [6, 22] },
  1972: { winter: [12, 21], summer: [6, 21] }, 1973: { winter: [12, 22], summer: [6, 21] },
  1974: { winter: [12, 22], summer: [6, 21] }, 1975: { winter: [12, 22], summer: [6, 22] },
  1976: { winter: [12, 21], summer: [6, 21] }, 1977: { winter: [12, 22], summer: [6, 21] },
  1978: { winter: [12, 22], summer: [6, 21] }, 1979: { winter: [12, 22], summer: [6, 22] },
  1980: { winter: [12, 21], summer: [6, 21] }, 1981: { winter: [12, 22], summer: [6, 21] },
  1982: { winter: [12, 22], summer: [6, 21] }, 1983: { winter: [12, 22], summer: [6, 22] },
  1984: { winter: [12, 21], summer: [6, 21] }, 1985: { winter: [12, 22], summer: [6, 21] },
  1986: { winter: [12, 22], summer: [6, 21] }, 1987: { winter: [12, 22], summer: [6, 22] },
  1988: { winter: [12, 21], summer: [6, 21] }, 1989: { winter: [12, 22], summer: [6, 21] },
  1990: { winter: [12, 22], summer: [6, 21] }, 1991: { winter: [12, 22], summer: [6, 22] },
  1992: { winter: [12, 21], summer: [6, 21] }, 1993: { winter: [12, 22], summer: [6, 21] },
  1994: { winter: [12, 22], summer: [6, 21] }, 1995: { winter: [12, 22], summer: [6, 22] },
  1996: { winter: [12, 21], summer: [6, 21] }, 1997: { winter: [12, 22], summer: [6, 21] },
  1998: { winter: [12, 22], summer: [6, 21] }, 1999: { winter: [12, 22], summer: [6, 22] },
  // 2000-2049
  2000: { winter: [12, 21], summer: [6, 21] }, 2001: { winter: [12, 22], summer: [6, 21] },
  2002: { winter: [12, 22], summer: [6, 21] }, 2003: { winter: [12, 22], summer: [6, 22] },
  2004: { winter: [12, 21], summer: [6, 21] }, 2005: { winter: [12, 22], summer: [6, 21] },
  2006: { winter: [12, 22], summer: [6, 21] }, 2007: { winter: [12, 22], summer: [6, 22] },
  2008: { winter: [12, 21], summer: [6, 21] }, 2009: { winter: [12, 22], summer: [6, 21] },
  2010: { winter: [12, 22], summer: [6, 21] }, 2011: { winter: [12, 22], summer: [6, 22] },
  2012: { winter: [12, 21], summer: [6, 21] }, 2013: { winter: [12, 22], summer: [6, 21] },
  2014: { winter: [12, 22], summer: [6, 21] }, 2015: { winter: [12, 22], summer: [6, 22] },
  2016: { winter: [12, 21], summer: [6, 21] }, 2017: { winter: [12, 22], summer: [6, 21] },
  2018: { winter: [12, 22], summer: [6, 21] }, 2019: { winter: [12, 22], summer: [6, 22] },
  2020: { winter: [12, 21], summer: [6, 21] }, 2021: { winter: [12, 21], summer: [6, 21] },
  2022: { winter: [12, 22], summer: [6, 21] }, 2023: { winter: [12, 22], summer: [6, 21] },
  2024: { winter: [12, 21], summer: [6, 21] }, 2025: { winter: [12, 21], summer: [6, 21] },
  2026: { winter: [12, 22], summer: [6, 21] }, 2027: { winter: [12, 22], summer: [6, 21] },
  2028: { winter: [12, 21], summer: [6, 21] }, 2029: { winter: [12, 21], summer: [6, 21] },
  2030: { winter: [12, 22], summer: [6, 21] }, 2031: { winter: [12, 22], summer: [6, 21] },
  2032: { winter: [12, 21], summer: [6, 20] }, 2033: { winter: [12, 22], summer: [6, 21] },
  2034: { winter: [12, 22], summer: [6, 21] }, 2035: { winter: [12, 22], summer: [6, 22] },
  2036: { winter: [12, 21], summer: [6, 21] }, 2037: { winter: [12, 22], summer: [6, 21] },
  2038: { winter: [12, 22], summer: [6, 21] }, 2039: { winter: [12, 22], summer: [6, 22] },
  2040: { winter: [12, 21], summer: [6, 21] }, 2041: { winter: [12, 22], summer: [6, 21] },
  2042: { winter: [12, 22], summer: [6, 21] }, 2043: { winter: [12, 22], summer: [6, 22] },
  2044: { winter: [12, 21], summer: [6, 21] }, 2045: { winter: [12, 22], summer: [6, 21] },
  2046: { winter: [12, 22], summer: [6, 21] }, 2047: { winter: [12, 22], summer: [6, 22] },
  2048: { winter: [12, 21], summer: [6, 21] }, 2049: { winter: [12, 22], summer: [6, 21] },
  // 2050-2099
  2050: { winter: [12, 22], summer: [6, 21] }, 2051: { winter: [12, 22], summer: [6, 21] },
  2052: { winter: [12, 21], summer: [6, 20] }, 2053: { winter: [12, 22], summer: [6, 21] },
  2054: { winter: [12, 22], summer: [6, 21] }, 2055: { winter: [12, 22], summer: [6, 22] },
  2056: { winter: [12, 21], summer: [6, 21] }, 2057: { winter: [12, 22], summer: [6, 21] },
  2058: { winter: [12, 22], summer: [6, 21] }, 2059: { winter: [12, 22], summer: [6, 22] },
  2060: { winter: [12, 21], summer: [6, 21] }, 2061: { winter: [12, 22], summer: [6, 21] },
  2062: { winter: [12, 22], summer: [6, 21] }, 2063: { winter: [12, 22], summer: [6, 22] },
  2064: { winter: [12, 21], summer: [6, 20] }, 2065: { winter: [12, 22], summer: [6, 21] },
  2066: { winter: [12, 22], summer: [6, 21] }, 2067: { winter: [12, 22], summer: [6, 22] },
  2068: { winter: [12, 21], summer: [6, 21] }, 2069: { winter: [12, 22], summer: [6, 21] },
  2070: { winter: [12, 22], summer: [6, 21] }, 2071: { winter: [12, 22], summer: [6, 22] },
  2072: { winter: [12, 21], summer: [6, 21] }, 2073: { winter: [12, 22], summer: [6, 21] },
  2074: { winter: [12, 22], summer: [6, 21] }, 2075: { winter: [12, 22], summer: [6, 22] },
  2076: { winter: [12, 21], summer: [6, 20] }, 2077: { winter: [12, 22], summer: [6, 21] },
  2078: { winter: [12, 22], summer: [6, 21] }, 2079: { winter: [12, 22], summer: [6, 22] },
  2080: { winter: [12, 21], summer: [6, 21] }, 2081: { winter: [12, 22], summer: [6, 21] },
  2082: { winter: [12, 22], summer: [6, 21] }, 2083: { winter: [12, 22], summer: [6, 22] },
  2084: { winter: [12, 21], summer: [6, 21] }, 2085: { winter: [12, 22], summer: [6, 21] },
  2086: { winter: [12, 22], summer: [6, 21] }, 2087: { winter: [12, 22], summer: [6, 22] },
  2088: { winter: [12, 21], summer: [6, 20] }, 2089: { winter: [12, 22], summer: [6, 21] },
  2090: { winter: [12, 22], summer: [6, 21] }, 2091: { winter: [12, 22], summer: [6, 22] },
  2092: { winter: [12, 21], summer: [6, 21] }, 2093: { winter: [12, 22], summer: [6, 21] },
  2094: { winter: [12, 22], summer: [6, 21] }, 2095: { winter: [12, 22], summer: [6, 22] },
  2096: { winter: [12, 21], summer: [6, 21] }, 2097: { winter: [12, 22], summer: [6, 21] },
  2098: { winter: [12, 22], summer: [6, 21] }, 2099: { winter: [12, 22], summer: [6, 22] },
  // 2100
  2100: { winter: [12, 21], summer: [6, 21] },
}

/**
 * 简化算法 (兜底): 当日期超出查表范围时使用
 * 冬至 ~12月22日, 夏至 ~6月21日
 * 阳遁: 冬至(含) → 夏至前一天
 * 阴遁: 夏至(含) → 冬至前一天
 */
function calcDunTypeFallback(month: number, day: number): DunType {
  // 12月22日 → 次年6月20日 = 阳遁
  // 6月21日 → 12月21日 = 阴遁
  if (month === 12 && day >= 22) return '阳遁'
  if (month <= 6 && (month < 6 || day < 21)) return '阳遁'
  return '阴遁'
}

/**
 * 公历日期 → 阳遁/阴遁
 *
 * 规则 (传统奇门遁甲):
 *   冬至(含) → 夏至前一天 = 阳遁
 *   夏至(含) → 冬至前一天 = 阴遁
 *
 * @param year  公历年
 * @param month 公历月 (1-12)
 * @param day   公历日 (1-31)
 * @returns '阳遁' 或 '阴遁'
 *
 * 注意: 节气精确时刻可能落在某日的任意时间 (00:00-23:59)
 *       这里以"日期"为单位处理, 简化方案 (精度 ±1 天)
 */
export function calcDunType(year: number, month: number, day: number): DunType {
  const entry = SOLSTICE_TABLE[year]
  if (!entry) {
    // 范围外, 用简化算法
    return calcDunTypeFallback(month, day)
  }

  const [winterM, winterD] = entry.winter
  const [summerM, summerD] = entry.summer

  // 计算年内"日期序号"
  const daysInMonth = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const todayDOY = sum(daysInMonth.slice(0, month)) + day
  const winterDOY = sum(daysInMonth.slice(0, winterM)) + winterD
  const summerDOY = sum(daysInMonth.slice(0, summerM)) + summerD

  // 阳遁范围: 冬至(含) → 夏至前一天
  // 阴遁范围: 夏至(含) → 冬至前一天
  if (todayDOY >= winterDOY || todayDOY < summerDOY) {
    return '阳遁'
  }
  return '阴遁'
}

function sum(arr: number[]): number {
  let s = 0
  for (const x of arr) s += x
  return s
}