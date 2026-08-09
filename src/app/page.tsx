'use client'

import { useState, useEffect, useRef } from 'react'
import { calculateNow, calculateAll, JI_XIONG_INDEX } from '@/lib/engine'
import { loadAcupointMap, getAcupointFromMap } from '@/lib/acupoint-finder'

// 12 时辰选项 (中医用户视角)
const SHICHEN_OPTIONS = [
  { value: 23, label: '子时 · 23:00-01:00' },
  { value: 1,  label: '丑时 · 01:00-03:00' },
  { value: 3,  label: '寅时 · 03:00-05:00' },
  { value: 5,  label: '卯时 · 05:00-07:00' },
  { value: 7,  label: '辰时 · 07:00-09:00' },
  { value: 9,  label: '巳时 · 09:00-11:00' },
  { value: 11, label: '午时 · 11:00-13:00' },
  { value: 13, label: '未时 · 13:00-15:00' },
  { value: 15, label: '申时 · 15:00-17:00' },
  { value: 17, label: '酉时 · 17:00-19:00' },
  { value: 19, label: '戌时 · 19:00-21:00' },
  { value: 21, label: '亥时 · 21:00-23:00' },
]

function hourToShichenStart(hour: number): number {
  if (hour >= 23 || hour < 1) return 23
  if (hour < 3) return 1
  if (hour < 5) return 3
  if (hour < 7) return 5
  if (hour < 9) return 7
  if (hour < 11) return 9
  if (hour < 13) return 11
  if (hour < 15) return 13
  if (hour < 17) return 15
  if (hour < 19) return 17
  if (hour < 21) return 19
  return 21
}

export default function HomePage() {
  const [result, setResult] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [date, setDate] = useState('')
  const [shichenValue, setShichenValue] = useState(19)
  const [userEdited, setUserEdited] = useState(false)
  // ref 追踪上一次值, 避免首次挂载触发不必要的重算
  const prevDate = useRef<string>('')
  const prevShichen = useRef<number>(-1)

  useEffect(() => {
    setMounted(true)
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const todayDate = `${yyyy}-${mm}-${dd}`
    const todayShichen = hourToShichenStart(d.getHours())
    setDate(todayDate)
    setShichenValue(todayShichen)
    // 关键: 设置 ref 为初始值, 避免下面的 useEffect 误触发"用户编辑"
    prevDate.current = todayDate
    prevShichen.current = todayShichen
    setResult(calculateNow())
    // 只有用户没修改过日期/时辰时, 才每 30 秒自动刷新当前时间结果
    const id = setInterval(() => {
      if (!userEdited) setResult(calculateNow())
    }, 30000)
    return () => clearInterval(id)
  }, [userEdited])

  const handleCalc = () => {
    if (!date) return
    const [yyyy, mm, dd] = date.split('-').map(Number)
    setResult(calculateAll(yyyy, mm, dd, shichenValue, 0))
  }

  // 恢复当前真实时间 (清除用户编辑标记)
  const resetToNow = () => {
    setUserEdited(false)
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDate(`${yyyy}-${mm}-${dd}`)
    setShichenValue(hourToShichenStart(d.getHours()))
    setResult(calculateNow())
    // 滚动到顶部
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 点击"今日大吉时"按钮: 切换到对应时辰并滚动到顶部
  // 吉时是地支名 (子/丑/寅/卯/辰/巳/午/未/申/酉/戌/亥), 转为对应小时起始值
  const jumpToShiChen = (zhi: string) => {
    const zhiToHour: Record<string, number> = {
      '子': 23, '丑': 1, '寅': 3, '卯': 5, '辰': 7, '巳': 9,
      '午': 11, '未': 13, '申': 15, '酉': 17, '戌': 19, '亥': 21,
    }
    const hour = zhiToHour[zhi]
    if (hour !== undefined) {
      setShichenValue(hour)
      // 滚动到顶部
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 日期或时辰变化时自动重算 (debounce 200ms, 避免输入时频繁计算)
  // 用 ref 追踪上一次的 date/shichenValue, 只有真正变化时才重算
  useEffect(() => {
    if (!mounted || !date) return
    // 首次挂载 (或值没真正变化) - 跳过
    if (prevDate.current === date && prevShichen.current === shichenValue) return
    prevDate.current = date
    prevShichen.current = shichenValue

    const id = setTimeout(() => {
      const [yyyy, mm, dd] = date.split('-').map(Number)
      if (yyyy && mm && dd) {
        const r = calculateAll(yyyy, mm, dd, shichenValue, 0)
        console.log('[auto-recalc]', { date, shichenValue, hourZhi: r.hourZhi, hourGanZhi: r.hourGanZhi })
        setResult(r)
        setUserEdited(true)
      }
    }, 200)
    return () => clearTimeout(id)
  }, [date, shichenValue, mounted])

  if (!mounted || !result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-5xl mb-3" style={{color: 'var(--gold)'}}>☯</div>
          <p className="text-muted font-serif text-sm tracking-widest">推 演 天 时</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen px-3 sm:px-4 py-4 sm:py-10 max-w-4xl mx-auto font-serif">

      {/* 顶部返回 */}
      <a href="../" className="text-xs text-muted hover:text-gold transition">← 返回八万实验室</a>

      {/* ── 标题 ── */}
      <header className="text-center mt-3 mb-6 sm:mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-8 bg-gold-line"></div>
          <span className="text-[10px] tracking-[0.4em] uppercase font-semibold" style={{color: 'var(--gold)'}}>
            tianyi-acu
          </span>
          <div className="h-px w-8 bg-gold-line"></div>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-wider mb-1" style={{color: 'var(--ink)'}}>
          奇门通玄针法
        </h1>
        <p className="text-sm tracking-widest" style={{color: 'var(--muted)'}}>
          择 时 开 穴 · 天 人 合 一
        </p>
      </header>

      {/* ── 输入区 ── */}
      <div className="card-base p-4 sm:p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto] gap-3 items-end">
          <div>
            <label className="text-label block mb-1.5">公历日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                   className="input-base w-full" />
          </div>
          <div>
            <label className="text-label block mb-1.5">时辰</label>
            <select value={shichenValue}
                    onChange={(e) => setShichenValue(Number(e.target.value))}
                    className="input-base w-full appearance-none cursor-pointer">
              {SHICHEN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {userEdited && (
            <button
              onClick={resetToNow}
              className="btn-secondary whitespace-nowrap"
              title="恢复为当前真实时间"
            >
              ⏱ 当前
            </button>
          )}
        </div>
      </div>

      {/* ── 三穴核心 ── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <NeedleCard label="值符" index="①" acupoint={result.zhiFu?.acupoint} jingLuo={result.zhiFu?.actualJingLuo} />
        <NeedleCard label="值使" index="②" acupoint={result.zhiShi?.acupoint} jingLuo={result.zhiShi?.jingLuo} />
        <NeedleCard label="第三针" index="③" acupoint={result.zhiYangYin?.acupoint} jingLuo={result.zhiYangYin?.jingLuo} />
      </div>

      {/* ── 干支 Banner ── */}
      <div className="gold-deco p-4 sm:p-5 mb-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <div className="text-label mb-1" style={{color: 'var(--gold-2)'}}>日 柱</div>
            <div className="text-2xl sm:text-3xl font-bold tracking-wider" style={{color: 'var(--ink)'}}>{result.dayGanZhi}</div>
            <div className="text-[10px] sm:text-xs mt-1" style={{color: 'var(--muted)'}}>序 #{result.main?.order} · {result.dayYinYang}日</div>
          </div>
          <div>
            <div className="text-label mb-1" style={{color: 'var(--gold-2)'}}>时 柱</div>
            <div className="text-2xl sm:text-3xl font-bold tracking-wider" style={{color: 'var(--ink)'}}>{result.hourGanZhi}</div>
            <div className="text-[10px] sm:text-xs mt-1" style={{color: 'var(--muted)'}}>{result.shiChenName}</div>
          </div>
          <div>
            <div className="text-label mb-1" style={{color: 'var(--gold-2)'}}>喜 神 方</div>
            <div className="text-2xl sm:text-3xl font-bold tracking-wider" style={{color: 'var(--vermilion)'}}>{result.main?.xiShenFang}</div>
            <div className="text-[10px] sm:text-xs mt-1" style={{color: 'var(--muted)'}}>{result.main?.zhiFuJingLuo}</div>
          </div>
        </div>
      </div>

      {/* ── 大吉时 / 非大吉时 ── */}
      {result.jiXiong && (
        result.jiXiong.daJi === '是' ? (
          <div className="card-base p-4 mb-5 flex items-center gap-3"
               style={{background: 'var(--jade-soft)', borderColor: 'var(--jade)'}}>
            <div className="text-2xl" style={{color: 'var(--jade)'}}>✓</div>
            <div>
              <div className="font-bold tracking-wider" style={{color: 'var(--jade)'}}>大 吉 时</div>
              <div className="text-xs mt-0.5" style={{color: 'var(--ink-2)'}}>
                {result.jiXiong.huangHeiDao} · 神煞「{result.jiXiong.shenSha}」· 可施针
              </div>
            </div>
          </div>
        ) : (
          <div className="card-base p-4 mb-5"
               style={{background: 'var(--vermilion-soft)', borderColor: 'var(--vermilion)'}}>
            <div className="flex items-center gap-3 mb-1">
              <div className="text-xl" style={{color: 'var(--vermilion)'}}>✗</div>
              <div className="font-bold tracking-wider" style={{color: 'var(--vermilion)'}}>非 大 吉 时</div>
            </div>
            <div className="text-xs ml-7" style={{color: 'var(--ink-2)'}}>
              原因: {[
                result.jiXiong.huangHeiDao === '黑道' && '黑道',
                result.jiXiong.jieKong === '是' && '截空',
                result.jiXiong.wuBuYu === '是' && '五不遇',
              ].filter(Boolean).join(' · ')}
            </div>
          </div>
        )
      )}

      {/* ── 今日大吉时 · 一览表 (合并: 每个按钮显示该时辰吉凶) ── */}
      {result.main?.daJiShiChen && result.main.daJiShiChen.length > 0 && (
        <div className="card-base p-4 sm:p-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-6 bg-gold-line"></div>
            <span className="text-label" style={{color: 'var(--gold)'}}>今日大吉时</span>
            <div className="h-px flex-1 bg-gold-line"></div>
            <span className="text-[10px]" style={{color: 'var(--muted)'}}>点击切换时辰</span>
          </div>
          {/* 一览表: 每个时辰一行, 显示该时辰的黄黑道/神煞 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {result.main.daJiShiChen.map((s: string) => {
              // 取该时辰的吉凶判定 (jiXiong 是当前时辰的, 我们需要查每个吉时)
              const shiChenJiXiong = (result.jiXiong?.dayGanZhi === result.dayGanZhi)
                ? JI_XIONG_INDEX.get(`${result.dayGanZhi}|${s}`)
                : null
              const shiChenInfo = shiChenJiXiong ? {
                huangHeiDao: shiChenJiXiong[4],
                shenSha: shiChenJiXiong[3],
                isCurrent: s === result.hourZhi,
              } : { huangHeiDao: '', shenSha: '', isCurrent: s === result.hourZhi }

              const isCurrent = shiChenInfo.isCurrent

              return (
                <button
                  key={s}
                  onClick={() => jumpToShiChen(s)}
                  className={`text-left p-2.5 rounded-lg transition cursor-pointer hover:shadow-md hover:scale-[1.02] ${
                    isCurrent ? 'shadow-md' : ''
                  }`}
                  style={{
                    background: isCurrent ? 'var(--jade)' : 'var(--gold-soft)',
                    color: isCurrent ? '#fff' : 'var(--ink)',
                    border: `1px solid ${isCurrent ? 'var(--jade)' : 'var(--gold-line)'}`,
                  }}
                  title={`切换到 ${s}时`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-base">{s}时</span>
                    {isCurrent && <span className="text-xs">✓</span>}
                  </div>
                  <div className={`text-[11px] leading-relaxed ${
                    isCurrent ? 'opacity-90' : ''
                  }`} style={{
                    color: isCurrent ? '#fff' : 'var(--muted)',
                  }}>
                    {shiChenInfo.huangHeiDao || ''} {shiChenInfo.shenSha ? `· ${shiChenInfo.shenSha}` : ''}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 4 大算法详情 ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <MethodCard title="值符" index="①" subtitle={result.zhiFu?.actualGan + '取' + result.zhiFu?.rule}>
          <DetailRow k="值日经络" v={result.zhiFu?.actualJingLuo} />
          <DetailRow k="值符穴" v={result.zhiFu?.acupoint + '穴'} acc />
          <DetailRow k="穴性" v={result.zhiFu?.pointNature} />
          <DetailRow k="取用规则" v={result.zhiFu?.rule} />
        </MethodCard>

        <MethodCard title="值使" index="②" subtitle={result.hourZhi + '时固定'}>
          <DetailRow k="经络" v={result.zhiShi?.jingLuo} />
          <DetailRow k="值使穴" v={result.zhiShi?.acupoint + '穴'} acc />
          <DetailRow k="穴性" v={result.zhiShi?.pointNature} />
          <DetailRow k="五行" v={result.zhiShi?.wuXing} />
        </MethodCard>

        <MethodCard title={`第三针 · ${result.zhiYangYin?.mode}`} index="③" subtitle={result.dayYinYang + '日 → ' + result.zhiYangYin?.jingLuo}>
          <DetailRow k="经络" v={result.zhiYangYin?.jingLuo} />
          <DetailRow k="穴位" v={result.zhiYangYin?.acupoint + '穴'} acc />
          <DetailRow k="穴性" v={result.zhiYangYin?.pointNature} />
          <DetailRow k="日阴阳" v={result.zhiYangYin?.dayYinYang} />
        </MethodCard>

        <MethodCard title="吉凶时" index="④" subtitle={result.jiXiong?.huangHeiDao + ' · 神煞' + result.jiXiong?.shenSha}>
          <DetailRow k="神煞" v={result.jiXiong?.shenSha} />
          <DetailRow k="黄/黑道" v={result.jiXiong?.huangHeiDao} />
          <DetailRow k="截空" v={result.jiXiong?.jieKong} />
          <DetailRow k="五不遇" v={result.jiXiong?.wuBuYu} />
          <DetailRow k="是否大吉" v={result.jiXiong?.daJi} acc />
        </MethodCard>
      </div>

      {/* ── 免责声明 ── */}
      <footer className="text-center mt-8 pt-5" style={{borderTop: '1px solid var(--line)'}}>
        <p className="text-[11px] tracking-wider mb-1" style={{color: 'var(--muted)'}}>
          【免责声明】仅供道学爱好者学习参考,不构成任何针灸临床专业建议。
        </p>
        <p className="text-[11px]" style={{color: 'var(--gold)'}}>© Bawan Lab</p>
      </footer>
    </main>
  )
}

// ─── 三穴核心卡片 ───
function NeedleCard({ index, label, acupoint, jingLuo }: { index: string; label: string; acupoint?: string; jingLuo?: string }) {
  const cleanName = acupoint?.replace(/穴$/, '') || ''

  // 异步加载穴位索引 (gzip 后 ~3.5 KB)
  const [mapping, setMapping] = useState<{ code: string; meridianZh?: string } | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!cleanName) {
      setChecked(true)
      return
    }
    let cancelled = false
    loadAcupointMap().then(map => {
      if (cancelled) return
      const found = getAcupointFromMap(map, cleanName)
      setMapping(found)
      setChecked(true)
    })
    return () => { cancelled = true }
  }, [cleanName])

  // fallback: 如果索引没找到, 用 name+meridian 跳转 (2D 页支持模糊匹配)
  const linkUrl = mapping
    ? `2d/?point=${mapping.code}&name=${encodeURIComponent(acupoint || '')}穴&meridian=${encodeURIComponent(jingLuo || mapping.meridianZh || '')}`
    : `2d/?name=${encodeURIComponent(acupoint || '')}穴&meridian=${encodeURIComponent(jingLuo || '')}`
  const has3D = checked && mapping !== null

  return (
    <div className="gold-deco p-3 sm:p-4 text-center overflow-hidden">
      <div className="text-[10px] sm:text-xs font-semibold tracking-widest mb-1.5" style={{color: 'var(--gold)'}}>
        {index} {label}
      </div>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wider whitespace-nowrap"
           style={{color: 'var(--vermilion)'}}>
        {acupoint ? `${acupoint}穴` : '—'}
      </div>
      <div className="text-[10px] sm:text-xs mt-1 tracking-wider" style={{color: 'var(--muted)'}}>
        {jingLuo || '—'}
      </div>
      {acupoint && (
        <a
          href={linkUrl}
          className="inline-block mt-2 text-[10px] sm:text-xs px-2 py-0.5 rounded-full transition"
          style={{
            background: has3D ? 'var(--gold)' : 'transparent',
            color: has3D ? '#fbf6ec' : 'var(--muted)',
            border: has3D ? 'none' : '1px dashed var(--line)',
            textDecoration: 'none',
          }}
          title={has3D ? '查看经穴图' : '此穴位未收录经穴图, 仅跳转详情'}
        >
          {has3D ? '📍 经穴图' : '· 仅文字 ·'}
        </a>
      )}
    </div>
  )
}

// ─── 算法卡片 ───
function MethodCard({ index, title, subtitle, children }: { index: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="card-base p-4">
      <div className="flex items-baseline justify-between mb-3 pb-2" style={{borderBottom: '1px dashed var(--line)'}}>
        <div>
          <span className="text-base font-bold tracking-wider" style={{color: 'var(--ink)'}}>
            {index} {title}
          </span>
        </div>
        {subtitle && (
          <span className="text-[10px] tracking-wider" style={{color: 'var(--gold)'}}>
            {subtitle}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

function DetailRow({ k, v, acc }: { k: string; v?: string; acc?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 text-sm">
      <span className="tracking-wider" style={{color: 'var(--muted)'}}>{k}</span>
      <span className={`font-semibold ${acc ? 'text-base' : ''}`}
            style={{color: acc ? 'var(--vermilion)' : 'var(--ink)'}}>
        {v || '—'}
      </span>
    </div>
  )
}