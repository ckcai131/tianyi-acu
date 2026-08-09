/**
 * tianyi-acu 经穴详情页
 *
 * 显示穴位定位图 + 穴位信息
 * 数据源优先级: chino-meds > qihuang > tianyi (整合)
 *
 * URL 参数:
 *   - code: 穴位代码 (如 PC7)
 *   - name: 穴位中文名 (备用查找, 可选)
 *   - meridian: 经络 (备用查找, 可选)
 */

(function () {
  'use strict';

  // ─── URL 参数 ───
  const params = new URLSearchParams(window.location.search);
  const code = (params.get('code') || params.get('point') || '').toUpperCase();
  const name = params.get('name') || '';
  const meridian = params.get('meridian') || '';

  // ─── 加载穴位数据 ───
  async function loadAcupoints() {
    const resp = await fetch('acupoints.json');
    const data = await resp.json();
    return data.points;
  }

  // ─── 查找穴位 ───
  function findPoint(points) {
    // 1. 按 code 精确匹配
    if (code) {
      const exact = points.find(p => p.code === code);
      if (exact) return exact;
    }
    // 2. 按 name + meridian 匹配 (URL 只传这两个时)
    //    支持模糊匹配: 去掉 "穴" 后缀, meridian 包含关系
    if (name && meridian) {
      const cleanName = name.replace(/穴$/, '');
      // 多种匹配: name+meridian, name+meridian 包含关系
      const match = points.find(p => {
        const pName = p.name_zh || '';
        const pMeridian = p.meridian_zh || '';
        const nameMatch = pName === cleanName || pName === name || pName.includes(cleanName) || cleanName.includes(pName);
        const meridianMatch = pMeridian === meridian || pMeridian.includes(meridian) || meridian.includes(pMeridian);
        return nameMatch && meridianMatch;
      });
      if (match) return match;
    }
    // 3. 只按 name 匹配
    if (name) {
      const cleanName = name.replace(/穴$/, '');
      const byName = points.find(p => p.name_zh === cleanName || p.name_zh === name);
      if (byName) return byName;
    }
    return null;
  }

  // ─── 渲染图片区域 ───
  function renderImage(point) {
    const area = document.getElementById('image-area');
    if (point.image) {
      const imgFilename = point.image.replace('images/', '');
      // 计算从当前位置到 /TP/tianyi-acu/qihuang-images/ 的相对路径
      // 当前页面: /TP/tianyi-acu/2d/
      // 图片: /TP/tianyi-acu/qihuang-images/
      area.innerHTML = `
        <div class="image-frame">
          <img src="../qihuang-images/${imgFilename}" alt="${point.name_zh}穴定位图">
        </div>
        <div class="image-caption">${point.name_zh}穴 · ${point.meridian_zh || ''}</div>
      `;
    } else {
      area.innerHTML = `
        <div class="no-image">暂无定位图</div>
        <div class="image-caption">${point.name_zh}穴</div>
      `;
    }
  }

  // ─── 渲染信息区域 ───
  function renderInfo(point) {
    const area = document.getElementById('info-area');

    // 兼容 meridian 对象和 meridian_zh 字符串
    const meridianZh = (point.meridian && point.meridian.name_zh) || point.meridian_zh || '';
    const functions = point.functions || [];
    const indications = point.indications || [];
    const cautions = Array.isArray(point.cautions) ? point.cautions : (point.cautions ? [point.cautions] : []);
    const categories = point.categories || [];

    // 针刺法 (处理换行符)
    const needlingHtml = (point.needling || '')
      .split('\n')
      .filter(line => line.trim())
      .map(line => `<li>${line.replace(/^-\s*/, '').trim()}</li>`)
      .join('');

    // 来源徽章
    const sourceMap = {
      'km-agent': 'km-agent',
      'AcuKG': 'AcuKG',
      'chino-meds': 'chino-meds',
      'nihaixia-app': 'nihaixia-app',
      'qihuang': 'qihuang',
    };
    const sourcesHtml = (point.sources || [])
      .map(s => `<span class="source-tag">${sourceMap[s] || s}</span>`)
      .join(' ');

    area.innerHTML = `
      <div class="info-card">
        <div class="title-block">
          <div class="acupoint">${point.name_zh}穴</div>
          <div class="code">${point.code} · ${point.pinyin || ''}</div>
          <div class="meridian">${meridianZh}${point.region ? ' · ' + point.region : ''}</div>
        </div>

        ${categories.length ? `
          <div class="section">
            <div class="label">类 别</div>
            <div class="categories">
              ${categories.map(c => `<span class="category-tag">${c}</span>`).join('')}
            </div>
          </div>
        ` : ''}

        <div class="section">
          <div class="label">体 表 定 位</div>
          <div class="text">${point.location_zh || '—'}</div>
        </div>

        ${point.location_method_zh ? `
          <div class="section">
            <div class="label">取 穴 方 法</div>
            <div class="text">${point.location_method_zh}</div>
          </div>
        ` : ''}

        ${functions.length ? `
          <div class="section">
            <div class="label">主 治 功 效</div>
            <ul class="functions">${functions.map(f => `<li>${f}</li>`).join('')}</ul>
          </div>
        ` : ''}

        ${indications.length ? `
          <div class="section">
            <div class="label">适 用 情 形 <span style="font-weight:normal;color:#888;font-size:0.85em;">(${indications.length} 条)</span></div>
            <div class="text">${indications.map(i => `<span class="ind-tag">${i}</span>`).join('')}</div>
          </div>
        ` : ''}

        ${point.tuina_method ? `
          <div class="section">
            <div class="label">按 摩 手 法</div>
            <div class="text">${point.tuina_method}</div>
          </div>
        ` : ''}

        ${needlingHtml ? `
          <div class="section">
            <div class="label">针 刺 法</div>
            <ul class="functions">${needlingHtml}</ul>
          </div>
        ` : ''}

        ${cautions.length ? `
          <div class="warn-box">⚠ ${cautions.join('；')}</div>
        ` : ''}

        ${point.anatomy ? `
          <div class="section">
            <div class="label">解 剖</div>
            <div class="text" style="font-size:13px;color:#5a4a3a;">${point.anatomy}</div>
          </div>
        ` : ''}

        ${point.combinations ? `
          <div class="section">
            <div class="label">常 用 配 伍</div>
            <div class="text" style="font-size:13px;">${point.combinations.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}

        ${point.clinical_application ? `
          <div class="section">
            <div class="label">临 床 运 用</div>
            <div class="text" style="font-size:13px;">${point.clinical_application.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}

        ${point.classical_texts ? `
          <div class="section">
            <div class="label">古 籍 摘 要</div>
            <div class="classical">${point.classical_texts.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}

        ${point.modern_research ? `
          <div class="section">
            <div class="label">现 代 研 究</div>
            <div class="text" style="font-size:13px;">${point.modern_research.replace(/\n/g, '<br>')}</div>
          </div>
        ` : ''}

        ${sourcesHtml ? `
          <div class="sources">
            数据源: ${sourcesHtml}
            ${point.source_url ? `<br><a class="source-link" href="${point.source_url}" target="_blank">qihuang.vip 原文 →</a>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ─── 渲染错误状态 ───
  function renderError(message) {
    document.getElementById('image-area').innerHTML = '';
    document.getElementById('info-area').innerHTML = `
      <div class="error-state">
        ${message}
      </div>
    `;
  }

  // ─── 初始化 ───
  async function main() {
    try {
      const points = await loadAcupoints();
      const point = findPoint(points);

      if (!point) {
        renderError(`未找到穴位${code ? ` (${code})` : name ? ` (${name})` : ''}<br>请检查 URL 参数`);
        return;
      }

      renderImage(point);
      renderInfo(point);
    } catch (err) {
      console.error(err);
      renderError('加载失败: ' + err.message);
    } finally {
      document.getElementById('loading').classList.add('hidden');
    }
  }

  main();
})();