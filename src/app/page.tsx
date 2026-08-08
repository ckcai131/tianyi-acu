'use client'

import { useState, useEffect } from 'react'
import { calculateNow, calculateAll, type AllResult } from '@/lib/engine'

// 12 时辰选项 (中医用户视角)
const SHICHEN_OPTIONS = [
  { value: 23, label: '子时 (23:00-01:00)' },
  { value: 1,  label: '丑时 (01:00-03:00)' },
  { value: 3,  label: '寅时 (03:00-05:00)' },
  { value: 5,  label: '卯时 (05:00-07:00)' },
  { value: 7,  label: '辰时 (07:00-09:00)' },
  { value: 9,  label: '巳时 (09:00-11:00)' },
  { value: 11, label: '午时 (11:00-13:00)' },
  { value: 13, label: '未时 (13:00-15:00)' },
  { value: 15, label: '申时 (15:00-17:00)' },
  { value: 17, label: '酉时 (17:00-19:00)' },
  { value: 19, label: '戌时 (19:00-21:00)' },
  { value: 21, label: '亥时 (21:00-23:00)' },
]

function hourToShichenValue(hour: number): number {
  // 返回该时辰的"起始小时"用于 select value
  return hourToShichenStart(hour)
}

function hourToShichenStart(hour: number): number {
  if (hour >= 23 || hour < 1) return 23  // 子时
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
  const [result, setResult] = useState<AllResult | null>(null)
  const [mounted, setMounted] = useState(false)
  const [date, setDate] = useState('')
  const [shichenValue, setShichenValue] = useState(19) // 默认戌时
  const [minute, setMinute] = useState(0)

  useEffect(() => {
    setMounted(true)
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDate(`${yyyy}-${mm}-${dd}`)
    setShichenValue(hourToShichenValue(d.getHours()))
    setMinute(d.getMinutes())
    setResult(calculateNow())
    const id = setInterval(() => setResult(calculateNow()), 30000)
    return () => clearInterval(id)
  }, [])

  const handleCalc = () => {
    if (!date) return
    const [yyyy, mm, dd] = date.split('-').map(Number)
    setResult(calculateAll(yyyy, mm, dd, shichenValue, minute))
  }

  if (!mounted || !result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin-slow">☯</div>
          <p className="text-gold/60 font-serif">推演天时...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen px-3 sm:px-4 py-4 sm:py-8 max-w-4xl mx-auto">
      <a href="../" className="text-sm text-muted hover:text-gold">← 返回八万实验室</a>

      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl mt-3 mb-5 p-6 sm:p-8 text-yellow-50"
              style={{background: 'linear-gradient(135deg, #1a1410 0%, #2d1f15 100%)'}}>
        <span className="hidden sm:inline-block absolute right-5 top-5 text-2xs text-yellow-900 bg-yellow-100/10 px-2 py-1 rounded">
          八万实验室 · tianyi-acu
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 tracking-wide mb-1">奇门通玄针法</h1>
        <p className="text-yellow-200/80 text-sm">奇门遁甲 + 通玄针法 · 择时开穴</p>
      </header>

      {/* 输入区 */}
      <div className="bg-card border border-line rounded-2xl p-4 sm:p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-muted mb-1">公历日期</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                   className="px-3 py-2 border border-line rounded-lg bg-yellow-50/50 w-full" />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-muted mb-1">时辰</label>
            <select value={shichenValue}
                    onChange={(e) => setShichenValue(Number(e.target.value))}
                    className="px-3 py-2 border border-line rounded-lg bg-yellow-50/50 w-full appearance-none cursor-pointer">
              {SHICHEN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button onClick={handleCalc}
                  className="px-4 py-2 bg-gold text-white rounded-lg hover:opacity-90">推算</button>
        </div>
        {/* 分钟微调 */}
        <div className="mt-3 flex items-center gap-3">
          <label className="text-xs text-muted whitespace-nowrap">分钟</label>
          <input type="range" min="0" max="59" step="1" value={minute}
                 onChange={(e) => setMinute(Number(e.target.value))}
                 className="flex-1 accent-amber-600" />
          <span className="text-sm text-gold font-mono w-8 text-right">{String(minute).padStart(2, '0')}</span>
        </div>
      </div>

      {/* 三穴重点展示 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <NeedleCard label="① 值符" acupoint={result.zhiFu?.acupoint} jingLuo={result.zhiFu?.actualJingLuo} />
        <NeedleCard label="② 值使" acupoint={result.zhiShi?.acupoint} jingLuo={result.zhiShi?.jingLuo} />
        <NeedleCard label="③ 第三针" acupoint={result.zhiYangYin?.acupoint} jingLuo={result.zhiYangYin?.jingLuo} />
      </div>

      {/* 干支 Banner */}
      <div className="rounded-2xl p-3 sm:p-5 mb-4 grid grid-cols-3 gap-2 sm:gap-4 text-center"
           style={{background: 'linear-gradient(135deg, var(--gold-soft), #fde68a)', border: '1px solid #fcd34d'}}>
        <div>
          <div className="text-[10px] sm:text-xs text-yellow-900 font-semibold uppercase tracking-wider mb-1">日柱</div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-serif">{result.dayGanZhi}</div>
          <div className="text-[10px] sm:text-xs text-muted mt-1">序 #{result.main?.order} · {result.dayYinYang}日</div>
        </div>
        <div>
          <div className="text-[10px] sm:text-xs text-yellow-900 font-semibold uppercase tracking-wider mb-1">时柱</div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-serif">{result.hourGanZhi}</div>
          <div className="text-[10px] sm:text-xs text-muted mt-1">{result.shiChenName}</div>
        </div>
        <div>
          <div className="text-[10px] sm:text-xs text-yellow-900 font-semibold uppercase tracking-wider mb-1">喜神方</div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-serif">{result.main?.xiShenFang}</div>
          <div className="text-[10px] sm:text-xs text-muted mt-1 hidden sm:block">值日经络: {result.main?.zhiFuJingLuo}</div>
          <div className="text-[10px] sm:text-xs text-muted mt-1 sm:hidden">{result.main?.zhiFuJingLuo}</div>
        </div>
      </div>

      {/* 大吉时 banner */}
      {result.jiXiong && (
        result.jiXiong.daJi === '是' ? (
          <div className="rounded-2xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center"
               style={{background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac'}}>
            <div className="text-3xl">✓</div>
            <div>
              <div className="font-bold text-green-800">大吉时</div>
              <div className="text-sm text-gray-600">{result.jiXiong.huangHeiDao} · 神煞「{result.jiXiong.shenSha}」 · 可施针</div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 mb-4"
               style={{background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #fca5a5'}}>
            <div className="font-bold text-red-800">✗ 非大吉时</div>
            <div className="text-sm text-gray-600">
              原因: {[
                result.jiXiong.huangHeiDao === '黑道' && '黑道',
                result.jiXiong.jieKong === '是' && '截空',
                result.jiXiong.wuBuYu === '是' && '五不遇',
              ].filter(Boolean).join(' · ')}
            </div>
          </div>
        )
      )}

      {/* 4 大算法 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <MethodCard title="① 值符" color="gold">
          <Row k="值日经络" v={result.zhiFu?.actualJingLuo} />
          <Row k="值符穴" v={result.zhiFu?.acupoint ? `${result.zhiFu.acupoint}穴` : undefined} acc />
          <Row k="穴性" v={result.zhiFu?.pointNature} />
          <Row k="规则" v={result.zhiFu?.rule} />
        </MethodCard>

        <MethodCard title="② 值使" color="gold">
          <Row k="经络" v={result.zhiShi?.jingLuo} />
          <Row k="值使穴" v={result.zhiShi?.acupoint ? `${result.zhiShi.acupoint}穴` : undefined} acc />
          <Row k="穴性" v={result.zhiShi?.pointNature} />
          <Row k="五行" v={result.zhiShi?.wuXing} />
        </MethodCard>

        <MethodCard title={`③ 第三针 (${result.zhiYangYin?.mode})`} color="gold">
          <Row k="经络" v={result.zhiYangYin?.jingLuo} />
          <Row k="穴位" v={result.zhiYangYin?.acupoint ? `${result.zhiYangYin.acupoint}穴` : undefined} acc />
          <Row k="穴性" v={result.zhiYangYin?.pointNature} />
          <Row k="日阴阳" v={result.zhiYangYin?.dayYinYang} />
        </MethodCard>

        <MethodCard title="④ 吉凶时" color="gold">
          <Row k="神煞" v={result.jiXiong?.shenSha} />
          <Row k="黄/黑道" v={result.jiXiong?.huangHeiDao} />
          <Row k="截空" v={result.jiXiong?.jieKong} />
          <Row k="五不遇" v={result.jiXiong?.wuBuYu} />
          <Row k="大吉" v={result.jiXiong?.daJi} />
        </MethodCard>
      </div>

      {/* 今日大吉时 */}
      <div className="bg-card border border-line rounded-2xl p-5 mb-4">
        <h3 className="text-lg font-bold mb-3 text-gold">📅 今日大吉时</h3>
        <div>
          {result.main?.daJiShiChen.map(s => (
            <span key={s} className={`inline-block bg-yellow-100 text-yellow-900 rounded-full px-3 py-1 mx-1 my-0.5 text-sm font-serif font-semibold ${
              s === result.hourZhi ? 'bg-green-100 text-green-800' : ''
            }`}>
              {s}时
            </span>
          ))}
        </div>
        <p className="text-xs text-muted mt-3">本日所有黄道时中, 排除截空 + 五不遇 = 大吉时</p>
      </div>

      <footer className="mt-7 pt-5 border-t border-line text-muted text-xs">
        <p><strong>【免责声明】</strong>本站仅供道学爱好者学习参考，<strong>不构成任何针灸临床专业建议</strong>。</p>
        <p style={{marginTop: '6px', color: 'var(--gold)'}}>© Bawan Lab</p>
      </footer>
    </main>
  )
}

function MethodCard({ title, children, color }: { title: string; children: React.ReactNode; color: string }) {
  return (
    <div className="bg-card border border-line rounded-xl p-5">
      <h3 className={`text-lg font-bold mb-3 text-${color}-600`}>{title}</h3>
      <div>{children}</div>
    </div>
  )
}

function Row({ k, v, acc }: { k: string; v?: string; acc?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-dashed border-line text-sm last:border-0">
      <span className="text-muted font-medium">{k}</span>
      <span className={`font-semibold font-serif ${acc ? 'text-vermilion text-lg' : ''}`}>{v || '-'}</span>
    </div>
  )
}

function NeedleCard({ label, acupoint, jingLuo }: { label: string; acupoint?: string; jingLuo?: string }) {
  return (
    <div className="rounded-2xl p-3 sm:p-4 text-center shadow-md overflow-hidden"
         style={{background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fcd34d'}}>
      <div className="text-[10px] sm:text-xs text-yellow-900 font-semibold tracking-wider mb-1.5 sm:mb-2">{label}</div>
      <div className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-gold mb-1 sm:mb-1.5 tracking-wide whitespace-nowrap">{acupoint ? `${acupoint}穴` : '-'}</div>
      <div className="text-[10px] sm:text-xs text-yellow-900/70 font-medium">{jingLuo || '-'}</div>
    </div>
  )
}