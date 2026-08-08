'use client'

import { useState, useEffect } from 'react'
import { calculateNow, calculateAll } from '@/lib/engine'
import { hasAcupoint3D, getAcupoint3D } from '@/lib/acupoint-map'

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

  useEffect(() => {
    setMounted(true)
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDate(`${yyyy}-${mm}-${dd}`)
    setShichenValue(hourToShichenStart(d.getHours()))
    setResult(calculateNow())
    const id = setInterval(() => setResult(calculateNow()), 30000)
    return () => clearInterval(id)
  }, [])

  const handleCalc = () => {
    if (!date) return
    const [yyyy, mm, dd] = date.split('-').map(Number)
    setResult(calculateAll(yyyy, mm, dd, shichenValue, 0))
  }

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
          <button onClick={handleCalc} className="btn-primary whitespace-nowrap">
            推 算 →
          </button>
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

      {/* ── 今日大吉时 ── */}
      <div className="card-base p-4 sm:p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-6 bg-gold-line"></div>
          <span className="text-label" style={{color: 'var(--gold)'}}>今日大吉时</span>
          <div className="h-px flex-1 bg-gold-line"></div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {result.main?.daJiShiChen.map((s: string) => (
            <span key={s}
                  className={`inline-block rounded-full px-3 py-1.5 text-sm font-serif font-semibold transition ${
                    s === result.hourZhi
                      ? 'shadow-md'
                      : ''
                  }`}
                  style={{
                    background: s === result.hourZhi ? 'var(--jade)' : 'var(--gold-soft)',
                    color: s === result.hourZhi ? '#fff' : 'var(--gold-2)',
                    border: `1px solid ${s === result.hourZhi ? 'var(--jade)' : 'var(--gold-line)'}`,
                  }}>
              {s}时
            </span>
          ))}
        </div>
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
  const mapping = cleanName ? getAcupoint3D(cleanName) : null
  const has3D = mapping !== null

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
        has3D ? (
          <a
            href={`2d/?point=${mapping!.code}&name=${encodeURIComponent(acupoint)}穴&meridian=${encodeURIComponent(jingLuo || '')}`}
            className="inline-block mt-2 text-[10px] sm:text-xs px-2 py-0.5 rounded-full transition"
            style={{
              background: 'var(--gold)',
              color: '#fbf6ec',
              textDecoration: 'none',
            }}
          >
            📍 经穴图
          </a>
        ) : (
          <div
            className="inline-block mt-2 text-[10px] sm:text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'transparent',
              color: 'var(--muted)',
              border: '1px dashed var(--line)',
            }}
            title="此穴位不在 3D 模型中"
          >
            · 仅文字 ·
          </div>
        )
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