/**
 * tianyi-acu 2D 经穴定位图
 *
 * 基于 chino-meds 的 SVG 人体图 + acupoints.json (MIT)
 * 替代之前的 3D 方案, 加载速度提升 100x+
 *
 * 修复关键点:
 * 1. SVG 用 viewBox 内嵌缩放, 穴位标记根据 SVG 实际渲染尺寸换算坐标
 * 2. 穴位标记放在 SVG <foreignObject> 或跟随 SVG 一起缩放
 */

(function () {
  'use strict';

  // ─── URL 参数 ───
  const params = new URLSearchParams(window.location.search);
  const targetCode = (params.get('point') || '').toUpperCase();
  const targetName = params.get('name') || '';
  const targetMeridian = params.get('meridian') || '';

  // ─── 状态 ───
  let acupointsData = null;
  let currentView = 'front';
  let targetInfo = null;
  let svgScale = 1;          // SVG 实际渲染宽度 / viewBox 宽度
  const viewFiles = {
    front: 'body_front.svg',
    back: 'body_back.svg',
    left: 'body_left.svg',
    right: 'body_right.svg',
  };
  const viewBoxMap = {
    front: { w: 200, h: 580 },
    back:  { w: 200, h: 580 },
    left:  { w: 200, h: 380 },
    right: { w: 200, h: 380 },
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
    if (!svg) return;

    // 删除原始 width/height 属性 (默认是 200x580)
    // 让 CSS 控制: width=100%, height=auto
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.height = 'auto';
    svg.style.display = 'block';
  }

  // ─── 缩放监听: SVG 渲染后重新计算穴位标记位置 ───
  function updateScale() {
    const svg = document.querySelector('#body-container svg');
    if (!svg) return;
    const vb = viewBoxMap[currentView];
    const rect = svg.getBoundingClientRect();
    svgScale = rect.width / vb.w;
    // 重新渲染穴位标记位置
    if (acupointsData) {
      renderAcupointMarkers(currentView);
    }
  }

  // ─── 添加穴位标记 ───
  function renderAcupointMarkers(view) {
    const svg = document.querySelector('#body-container svg');
    if (!svg) return;

    // 移除旧的标记层
    let markerLayer = svg.querySelector('#marker-layer');
    if (markerLayer) markerLayer.remove();

    // 创建标记层 (覆盖在 SVG 上方, 用 viewBox 单位定位)
    markerLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    markerLayer.setAttribute('id', 'marker-layer');
    markerLayer.style.pointerEvents = 'auto';
    svg.appendChild(markerLayer);

    // 找出当前视图的所有穴位
    const points = acupointsData.filter(p => {
      const pos = p.position;
      return pos && pos.view === view;
    });

    points.forEach(p => {
      const pos = p.position;
      const isTarget = targetCode && p.code === targetCode;

      // SVG <circle> 用 viewBox 单位, 跟 SVG 一起缩放
      const cx = pos.x;
      const cy = pos.y;
      const r = isTarget ? 4.0 : 1.8;     // 普通穴位更小
      const ringExtra = isTarget ? 1.5 : 0.6;

      // 外圈 (透明背景)
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', r + ringExtra);
      ring.setAttribute('fill', isTarget ? 'rgba(184, 57, 46, 0.25)' : 'rgba(168, 98, 31, 0.15)');
      ring.setAttribute('stroke', isTarget ? '#b8392e' : '#a8621f');
      ring.setAttribute('stroke-width', isTarget ? 0.6 : 0.3);
      ring.style.cursor = 'pointer';
      ring.style.pointerEvents = 'auto';
      ring.dataset.baseR = r + ringExtra;
      ring.dataset.code = p.code;
      if (isTarget) ring.classList.add('is-target');

      // 添加 hover 效果 (悬停时放大)
      ring.addEventListener('mouseenter', () => {
        if (!ring.classList.contains('is-target')) {
          ring.setAttribute('r', (r + ringExtra) * 2.2);
          ring.setAttribute('fill', 'rgba(168, 98, 31, 0.4)');
        }
      });
      ring.addEventListener('mouseleave', () => {
        if (!ring.classList.contains('is-target')) {
          ring.setAttribute('r', r + ringExtra);
          ring.setAttribute('fill', 'rgba(168, 98, 31, 0.15)');
        }
      });

      // 添加脉冲动画 (如果目标穴位)
      if (isTarget) {
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'r');
        animate.setAttribute('values', `${r + 1.5};${r + 4};${r + 1.5}`);
        animate.setAttribute('dur', '1.6s');
        animate.setAttribute('repeatCount', 'indefinite');
        ring.appendChild(animate);
      }

      ring.addEventListener('click', (e) => {
        e.stopPropagation();
        showInfo(p);
        // 触发局部放大 (针对手部/脚部/面部)
        zoomToRegion(view, cx, cy, p.region);
      });

      // 添加 title tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${p.code} · ${p.name_zh}穴 · ${p.meridian.name_zh}`;
      ring.appendChild(title);

      markerLayer.appendChild(ring);
    });
  }

  // ─── 局部放大 (针对手/脚/面/耳部穴位) ───
  let zoomTimer = null;
  function zoomToRegion(view, cx, cy, region) {
    const svg = document.querySelector('#body-container svg');
    if (!svg) return;

    let zoomBox = null;

    // 根据穴位 y 坐标判断部位
    // 头面部 y < 130, 脚部 y > 520, 手部 y in 280-330 + cx 在边缘
    if (cy < 130) {
      // 头面部
      zoomBox = { x: Math.max(0, cx - 40), y: Math.max(0, cy - 40), w: 80, h: 80 };
    } else if (cy > 520) {
      // 脚部
      zoomBox = { x: Math.max(0, cx - 40), y: Math.max(0, cy - 30), w: 80, h: 60 };
    } else if ((cy > 280 && cy < 330) && (cx < 60 || cx > 140)) {
      // 手部 (左手或右手)
      zoomBox = { x: cx < 100 ? 50 : 130, y: 280, w: 60, h: 60 };
    }

    if (!zoomBox) return;  // 躯干穴位不放大

    // 应用 viewBox 缩放 (强制 reflow)
    if (zoomTimer) clearTimeout(zoomTimer);
    const newVb = `${zoomBox.x} ${zoomBox.y} ${zoomBox.w} ${zoomBox.h}`;
    // SVG viewBox 必须用 setAttributeNS (因为 viewBox 是 XML 命名空间)
    svg.setAttributeNS(null, 'viewBox', newVb);

    // 8 秒后恢复
    zoomTimer = setTimeout(() => {
      svg.setAttributeNS(null, 'viewBox', '0 0 200 580');
    }, 8000);
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
    // 等 SVG 渲染完成
    requestAnimationFrame(() => {
      updateScale();
    });
  }

  // ─── 视图切换事件 ───
  document.querySelectorAll('.view-toggle button').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // ─── 窗口大小变化时重新计算缩放 ───
  window.addEventListener('resize', () => {
    requestAnimationFrame(updateScale);
  });

  // ─── 初始化 ───
  async function main() {
    await loadAcupoints();

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