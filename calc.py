#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
tianyi-acu · 奇门通玄针法 计算核心

入参: sys.argv[1] = "YYYY-MM-DD HH:MM"
出参: JSON 对象

4 大算法:
1. 值符 (值日经 + 五输穴轮值)
2. 值使 (12 时支固定对应值使穴)
3. 值阳/值阴 (阳日气纳三焦 / 阴日血归心包)
4. 吉凶时 (12 神煞 + 黄黑道 + 截空 + 五不遇)
"""
import sys
import json
import os
from datetime import datetime, date

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'docs', 'data')

# ── 干支基础 ─────────────────────────────────────────────
LIST_TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
LIST_DI_ZHI   = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
BASE_DATE = date(1940, 9, 18)  # 甲子日基准 (与 ZiWuLiuZhu 一致)

YANG_GAN = {'甲', '丙', '戊', '庚', '壬'}
YANG_ZHI = {'子', '寅', '辰', '午', '申', '戌'}

def is_yang_gan(g): return g in YANG_GAN
def is_yang_zhi(z): return z in YANG_ZHI

def hour_to_di_zhi(hour: int) -> str:
    """24h → 12时辰地支"""
    if hour >= 23 or hour < 1: return '子'
    if hour < 3: return '丑'
    if hour < 5: return '寅'
    if hour < 7: return '卯'
    if hour < 9: return '辰'
    if hour < 11: return '巳'
    if hour < 13: return '午'
    if hour < 15: return '未'
    if hour < 17: return '申'
    if hour < 19: return '酉'
    if hour < 21: return '戌'
    return '亥'

def hour_to_shichen(hour: int) -> str:
    """24h → 时辰名"""
    name_map = {
        '子': '子时 (23-01)', '丑': '丑时 (01-03)', '寅': '寅时 (03-05)',
        '卯': '卯时 (05-07)', '辰': '辰时 (07-09)', '巳': '巳时 (09-11)',
        '午': '午时 (11-13)', '未': '未时 (13-15)', '申': '申时 (15-17)',
        '酉': '酉时 (17-19)', '戌': '戌时 (19-21)', '亥': '亥时 (21-23)',
    }
    return name_map[hour_to_di_zhi(hour)]

def get_day_tian_gan(d: date) -> str:
    delta = (d - BASE_DATE).days
    return LIST_TIAN_GAN[delta % 10]

def get_day_di_zhi(d: date) -> str:
    delta = (d - BASE_DATE).days
    return LIST_DI_ZHI[delta % 12]

def get_day_ganzhi(d: date) -> str:
    return get_day_tian_gan(d) + get_day_di_zhi(d)

# 五鼠遁 (日干→时干起法)
WU_SHU_DUN_GROUP = {
    '甲': '甲己', '己': '甲己', '乙': '乙庚', '庚': '乙庚',
    '丙': '丙辛', '辛': '丙辛', '丁': '丁壬', '壬': '丁壬',
    '戊': '戊癸', '癸': '戊癸',
}
WU_SHU_SEQ = {
    '甲己': ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'],
    '乙庚': ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'],
    '丙辛': ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'],
    '丁壬': ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'],
    '戊癸': ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'],
}

def get_hour_ganzhi(day_gan: str, hour_zhi: str) -> str:
    """日干 + 时支 → 时干支"""
    group = WU_SHU_DUN_GROUP[day_gan]
    seq = WU_SHU_SEQ[group]
    hour_idx = LIST_DI_ZHI.index(hour_zhi) % 10  # mod 10 because 五鼠遁只跨10个时辰
    return seq[hour_idx] + hour_zhi

# ── 加载 Excel 导出的 JSON 数据 ────────────────────────────
def load_data(name: str):
    with open(os.path.join(DATA_DIR, f'{name}.json'), encoding='utf-8') as f:
        d = json.load(f)
    return d['records']

def parse_str_list(s: str):
    """'子、丑、卯' → ['子', '丑', '卯']"""
    if not s: return []
    return [x.strip() for x in str(s).split('、') if x.strip()]

# 加载全部数据 (启动一次)
RECORDS = {
    '六十甲子主表': load_data('六十甲子主表'),  # 60 条
    '吉凶时明细': load_data('吉凶时明细'),      # 720 条
    '值符基础': load_data('值符基础'),          # 60 条
    '值符全时段': load_data('值符全时段'),      # 120 条
    '值使规则': load_data('值使规则'),          # 12 条
    '值阴值阳': load_data('值阴值阳'),          # 24 条
}

# 构建索引 (加速查询)
JI_GONG_MING_XI = {}  # (日柱, 时支) → 吉凶时记录
for r in RECORDS['吉凶时明细']:
    key = (r['日柱'], r['时支'])
    JI_GONG_MING_XI[key] = r

JIAZI_MAIN = {}  # 日柱 → 主表记录
for r in RECORDS['六十甲子主表']:
    JIAZI_MAIN[r['日柱']] = r

ZHI_FU_FULL = {}  # (日干, 时支) → 全时段值符记录
for r in RECORDS['值符全时段']:
    key = (r['日干'], r['时支'])
    ZHI_FU_FULL[key] = r

ZHI_SHI = {}  # 时支 → 值使规则
for r in RECORDS['值使规则']:
    ZHI_SHI[r['时支']] = r

ZHI_YANG_YIN = {}  # (模式, 时支) → 值阴值阳记录
for r in RECORDS['值阴值阳']:
    key = (r['模式'], r['时支'])
    ZHI_YANG_YIN[key] = r


# ── 计算函数 ───────────────────────────────────────────────
def calc_zhi_fu(day_gan: str, hour_zhi: str) -> dict:
    """值符 (1): 天干定值日经; 五输穴轮值; 阴阳不匹配表里经代值"""
    key = (day_gan, hour_zhi)
    rec = ZHI_FU_FULL.get(key)
    if not rec:
        return {'error': f'值符无记录: {day_gan}+{hour_zhi}'}
    return {
        '日干': rec['日干'],
        '日干阴阳': rec['日干阴阳'],
        '时支': rec['时支'],
        '时支阴阳': rec['时支阴阳'],
        '实际取用日干': rec['实际取用日干'],
        '实际经络': rec['实际经络'],
        '穴位': rec['值符穴'],
        '穴性': rec['穴性'],
        '规则': rec['规则'],
        '来源页': rec['来源页'],
    }


def calc_zhi_shi(hour_zhi: str) -> dict:
    """值使 (2): 12 地支固定对应值使穴"""
    rec = ZHI_SHI.get(hour_zhi)
    if not rec:
        return {'error': f'值使无记录: {hour_zhi}'}
    return {
        '时支': rec['时支'],
        '时支阴阳': rec['时支阴阳'],
        '五行类别': rec['五行/类别'],
        '经络': rec['经络'],
        '穴位': rec['值使穴'],
        '穴性': rec['穴性'],
        '来源页': rec['来源页'],
    }


def calc_zhi_yang_yin(day_yin_yang: str, hour_zhi: str) -> dict:
    """值阳/值阴 (3): 阳日气纳三焦 / 阴日血归心包; 每穴 2 时辰"""
    mode = '值阳' if day_yin_yang == '阳' else '值阴'
    rec = ZHI_YANG_YIN.get((mode, hour_zhi))
    if not rec:
        return {'error': f'值阳/值阴无记录: {mode}+{hour_zhi}'}
    return {
        '模式': rec['模式'],
        '日阴阳': rec['日阴阳'],
        '时支': rec['时支'],
        '经络': rec['经络'],
        '穴位': rec['穴位'],
        '穴性': rec['穴性'],
        '来源页': rec['来源页'],
    }


def calc_ji_xiong(day_ganzhi: str, hour_zhi: str) -> dict:
    """吉凶时 (4): 12 神煞 + 黄黑道 + 截空 + 五不遇"""
    rec = JI_GONG_MING_XI.get((day_ganzhi, hour_zhi))
    if not rec:
        return {'error': f'吉凶时无记录: {day_ganzhi}+{hour_zhi}'}
    return {
        '日柱': rec['日柱'],
        '时支': rec['时支'],
        '时柱': rec['时柱'],
        '神煞': rec['神煞'],
        '黄黑道': rec['黄黑道'],
        '截空': rec['截空'],
        '五不遇': rec['五不遇'],
        '大吉': rec['大吉'],
        '来源页': rec['来源页'],
    }


def get_main_summary(day_ganzhi: str) -> dict:
    """六十甲子主表: 日级汇总 (值符经络/喜神方/第三针模式/大吉时)"""
    rec = JIAZI_MAIN.get(day_ganzhi)
    if not rec:
        return {'error': f'主表无记录: {day_ganzhi}'}
    return {
        '日柱': rec['日柱'],
        '序号': rec['序号'],
        '日干': rec['日干'],
        '日支': rec['日支'],
        '日阴阳': rec['日阴阳'],
        '值符经络': rec['值符经络'],
        '喜神方': rec['喜神方'],
        '第三针模式': rec['第三针模式'],
        '黄道时': parse_str_list(rec['黄道时']),
        '大吉时': parse_str_list(rec['大吉时']),
        '来源页': rec['来源页'],
    }


# ── 主入口 ────────────────────────────────────────────────
def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'missing datetime arg'}))
        sys.exit(1)
    try:
        dt = datetime.strptime(sys.argv[1], '%Y-%m-%d %H:%M')
    except ValueError as e:
        print(json.dumps({'error': f'invalid datetime: {e}'}))
        sys.exit(1)

    d = dt.date()
    h = dt.hour

    # 干支
    day_gan = get_day_tian_gan(d)
    day_zhi = get_day_di_zhi(d)
    day_ganzhi = day_gan + day_zhi
    day_yin_yang = '阳' if is_yang_gan(day_gan) else '阴'

    hour_zhi = hour_to_di_zhi(h)
    hour_ganzhi = get_hour_ganzhi(day_gan, hour_zhi)
    shichen_name = hour_to_shichen(h)

    # 4 算法
    main_sum = get_main_summary(day_ganzhi)
    zhi_fu = calc_zhi_fu(day_gan, hour_zhi)
    zhi_shi = calc_zhi_shi(hour_zhi)
    zhi_yang_yin = calc_zhi_yang_yin(day_yin_yang, hour_zhi)
    ji_xiong = calc_ji_xiong(day_ganzhi, hour_zhi)

    result = {
        'input': sys.argv[1],
        'day_ganzhi': day_ganzhi,
        'day_gan': day_gan,
        'day_zhi': day_zhi,
        'day_yin_yang': day_yin_yang,
        'hour_zhi': hour_zhi,
        'hour_ganzhi': hour_ganzhi,
        'shichen_name': shichen_name,
        'main': main_sum,
        'zhi_fu': zhi_fu,
        'zhi_shi': zhi_shi,
        'zhi_yang_yin': zhi_yang_yin,
        'ji_xiong': ji_xiong,
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()