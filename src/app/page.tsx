'use client'

import { useState, useEffect } from 'react'
import { calculateNow, calculateAll, type AllResult } from '@/lib/engine'

export default function HomePage() {
  const [result, setResult] = useState<AllResult | null>(null)
  const [mounted, setMounted] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('19:00')

  useEffect(() => {
    setMounted(true)
    // 默认填当前日期
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    setDate(`${yyyy}-${mm}-${dd}`)
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    setTime(`${hh}:${mi}`)
    setResult(calculateNow())
    const id = setInterval(() => setResult(calculateNow()), 30000)
    return () => clearInterval(id)
  }, [])

  const handleCalc = () => {
    if (!date) return
    const [hh, mi] = time.split(':').map(Number)
    const [yyyy, mm, dd] = date.split('-').map(Number)
    setResult(calculateAll(yyyy, mm, dd, hh, mi || 0))
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
    <main className="min-h-screen px-4 py-8 max-w-4xl mx-auto">
      <a href="../" className="text-sm text-muted hover:text-gold">← 返回八万实验室</a>

      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl mt-3 mb-5 p-8 text-yellow-50"
              style={{background: 'linear-gradient(135deg, #1a1410 0%, #2d1f15 100%)'}}>
        <span className="absolute right-5 top-5 text-2xs text-yellow-900 bg-yellow-100/10 px-2 py-1 rounded">
          八万实验室 · tianyi-acu
        </span>
        <h1 className="text-3xl font-bold text-yellow-400 tracking-wide mb-1">奇门通玄针法</h1>
        <p className="text-yellow-200/80 text-sm">奇门遁甲 + 通玄针法 · 择时开穴</p>
      </header>

      {/* 输入区 */}
      <div className="bg-card border border-line rounded-2xl p-5 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-xs text-muted mb-1">公历日期</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                 className="px-3 py-2 border border-line rounded-lg bg-yellow-50/50" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-muted mb-1">时辰 (24h)</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                 className="px-3 py-2 border border-line rounded-lg bg-yellow-50/50" />
        </div>
        <button onClick={handleCalc}
                className="px-4 py-2 bg-gold text-white rounded-lg hover:opacity-90">推算</button>
      </div>

      {/* 三穴重点展示 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <NeedleCard label="① 值符" acupoint={result.zhiFu?.acupoint} jingLuo={result.zhiFu?.actualJingLuo} />
        <NeedleCard label="② 值使" acupoint={result.zhiShi?.acupoint} jingLuo={result.zhiShi?.jingLuo} />
        <NeedleCard label="③ 第三针" acupoint={result.zhiYangYin?.acupoint} jingLuo={result.zhiYangYin?.jingLuo} />
      </div>

      {/* 干支 Banner */}
      <div className="rounded-2xl p-5 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
           style={{background: 'linear-gradient(135deg, var(--gold-soft), #fde68a)', border: '1px solid #fcd34d'}}>
        <div>
          <div className="text-xs text-yellow-900 font-semibold uppercase tracking-wider mb-1">日柱</div>
          <div className="text-3xl font-bold font-serif">{result.dayGanZhi}</div>
          <div className="text-xs text-muted mt-1">序 #{result.main?.order} · {result.dayYinYang}日</div>
        </div>
        <div>
          <div className="text-xs text-yellow-900 font-semibold uppercase tracking-wider mb-1">时柱</div>
          <div className="text-3xl font-bold font-serif">{result.hourGanZhi}</div>
          <div className="text-xs text-muted mt-1">{result.shiChenName}</div>
        </div>
        <div>
          <div className="text-xs text-yellow-900 font-semibold uppercase tracking-wider mb-1">喜神方</div>
          <div className="text-3xl font-bold font-serif">{result.main?.xiShenFang}</div>
          <div className="text-xs text-muted mt-1">值日经络: {result.main?.zhiFuJingLuo}</div>
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
          <Row k="值符穴" v={result.zhiFu?.acupoint} acc />
          <Row k="穴性" v={result.zhiFu?.pointNature} />
          <Row k="规则" v={result.zhiFu?.rule} />
        </MethodCard>

        <MethodCard title="② 值使" color="gold">
          <Row k="经络" v={result.zhiShi?.jingLuo} />
          <Row k="值使穴" v={result.zhiShi?.acupoint} acc />
          <Row k="穴性" v={result.zhiShi?.pointNature} />
          <Row k="五行" v={result.zhiShi?.wuXing} />
        </MethodCard>

        <MethodCard title={`③ 第三针 (${result.zhiYangYin?.mode})`} color="gold">
          <Row k="经络" v={result.zhiYangYin?.jingLuo} />
          <Row k="穴位" v={result.zhiYangYin?.acupoint} acc />
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
    <div className="rounded-2xl p-4 text-center shadow-md"
         style={{background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '1px solid #fcd34d'}}>
      <div className="text-xs text-yellow-900 font-semibold tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-bold font-serif text-gold mb-1.5 tracking-wide">{acupoint || '-'}</div>
      <div className="text-xs text-yellow-900/70 font-medium">{jingLuo || '-'}</div>
    </div>
  )
}