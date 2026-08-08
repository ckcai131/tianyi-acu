/**
 * tianyi-acu 2D 经穴定位图
 *
 * 基于 chino-meds 的 SVG 人体图 + acupoints.json (MIT)
 * 替代之前的 3D 方案, 加载速度提升 100x+
 */

(function () {
  'use strict';

  // ─── URL 参数 ───
  const params = new URLSearchParams(window.location.search);
  const targetCode = (params.get('point') || '').toUpperCase();
  const targetName = params.get('name') || '';
  const targetMeridian = params.get('meridian') || '';

  // ─── 状态 ───
  let acupointsData = null;  // 161 个穴位
  let currentView = 'front';
  let targetInfo = null;     // 当前展示的穴位信息
  const viewFiles = {
    front: 'body_front.svg',
    back: 'body_back.svg',
    left: 'body_left.svg',
    right: 'body_right.svg',
  };

  // ─── 加载穴位数据 ───
  async function loadAcupoints() {
    const resp = await fetch('acupoints.json');
    const data = await resp.json();
    acupointsData = data.points;
  }

  // ─── 加载 SVG ───
  async function loadSVG(view) {
    const container = document.getElementById('body-container');
    const resp = await fetch(viewFiles[view]);
    const svgText = await resp.text();
    container.innerHTML = svgText;

    const svg = container.querySelector('svg');
    if (svg) {
      // 让 SVG 占满容器
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.maxHeight = '78vh';
    }
  }

  // ─── 添加穴位标记 ───
  function renderAcupointMarkers(view) {
    const container = document.getElementById('body-container');
    const svg = container.querySelector('svg');
    if (!svg) return;

    // 移除旧的标记
    container.querySelectorAll('.acupoint-marker').forEach(el => el.remove());

    // 找出当前视图的所有穴位
    const points = acupointsData.filter(p => {
      const pos = p.position;
      return pos && pos.view === view;
    });

    points.forEach(p => {
      const pos = p.position;
      const marker = document.createElement('div');
      marker.className = 'acupoint-marker';
      marker.style.left = pos.x + 'px';
      marker.style.top = pos.y + 'px';
      marker.dataset.code = p.code;
      marker.dataset.name = p.name_zh;
      marker.title = `${p.code} · ${p.name_zh} · ${p.meridian.name_zh}`;

      // 高亮目标穴位
      if (targetCode && p.code === targetCode) {
        marker.classList.add('highlight');
      }

      marker.addEventListener('click', () => {
        showInfo(p);
        // 高亮
        container.querySelectorAll('.acupoint-marker.highlight').forEach(m => {
          if (m !== marker) m.classList.remove('highlight');
        });
        marker.classList.add('highlight');
      });

      container.appendChild(marker);
    });
  }

  // ─── 显示穴位详情 ───
  function showInfo(point) {
    targetInfo = point;
    const sidebar = document.getElementById('sidebar');

    const meridianZh = point.meridian.name_zh;
    const functions = (point.functions || []).slice(0, 5);
    const indications = (point.indications || []).slice(0, 8);
    const cautions = point.cautions || [];
    const categories = (point.categories || []).slice(0, 3);

    sidebar.innerHTML = `
      <div class="info-card">
        <div class="acupoint">${point.name_zh}穴</div>
        <div class="code">${point.code} · ${point.pinyin || point.name_en || ''}</div>
        <div class="meridian">${meridianZh}</div>

        ${categories.length ? `
          <div class="label">类 别</div>
          <div class="text">${categories.join(' · ')}</div>
        ` : ''}

        <div class="label">体表定位</div>
        <div class="text">${point.location_zh || '—'}</div>

        ${point.location_method ? `
          <div class="label">取穴方法</div>
          <div class="text">${point.location_method}</div>
        ` : ''}

        ${functions.length ? `
          <div class="label">主 治 功 效</div>
          <ul class="functions" style="padding: 0; margin: 0;">
            ${functions.map(f => `<li>${f}</li>`).join('')}
          </ul>
        ` : ''}

        ${indications.length ? `
          <div class="label">适 用 情 形</div>
          <div class="text">${indications.join('、')}</div>
        ` : ''}

        ${point.tuina_method ? `
          <div class="label">按 摩 手 法</div>
          <div class="text">${point.tuina_method}</div>
        ` : ''}

        ${cautions.length ? `
          <div class="warn-box">⚠ ${cautions.join('；')}</div>
        ` : ''}
      </div>
    `;
  }

  // ─── 切换视图 ───
  async function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-toggle button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });
    await loadSVG(view);
    renderAcupointMarkers(view);
  }

  // ─── 视图切换事件 ───
  document.querySelectorAll('.view-toggle button').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // ─── 初始化 ───
  async function main() {
    await loadAcupoints();

    // 如果 URL 指定穴位, 自动选择正确视图
    let initialView = 'front';
    if (targetCode) {
      const point = acupointsData.find(p => p.code === targetCode);
      if (point && point.position) {
        initialView = point.position.view;
        targetInfo = point;
      }
    }

    await switchView(initialView);
    document.getElementById('loading').classList.add('hidden');

    // 如果有目标穴位, 自动打开详情
    if (targetInfo) {
      showInfo(targetInfo);
    }
  }

  main().catch(err => {
    console.error(err);
    document.getElementById('loading').innerHTML =
      '<div style="color: #b8392e;">加载失败: ' + err.message + '</div>';
  });
})();