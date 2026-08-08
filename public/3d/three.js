/**
 * tianyi-acu 3D 穴位图
 * 基于 Antonio-Abrao/acu-master 的 WebGL + Three.js 实现
 * (GPL-3.0, https://github.com/Antonio-Abrao/acu-master)
 *
 * 用法:
 *   /3d/?point=cs7&name=中府穴&meridian=肺经
 */

(function () {
  'use strict';

  // ─── URL 参数解析 ───
  const params = new URLSearchParams(window.location.search);
  const targetPoint = (params.get('point') || '').toLowerCase();
  const targetName = params.get('name') || '';
  const targetMeridian = params.get('meridian') || '';

  // UI 显示
  document.getElementById('acupoint-name').textContent = targetName || '3D 经穴图';
  document.getElementById('acupoint-meridian').textContent = targetMeridian || '可拖动旋转 · 滚轮缩放';

  // ─── acu-master 支持的经络 ───
  const SUPPORTED_PREFIXES = ['p', 'ig', 'e', 'vc', 'cs'];

  // 检查经络是否支持
  const meridianPrefix = targetPoint.match(/^[a-z]+/i)?.[0] || '';
  const isSupported = SUPPORTED_PREFIXES.includes(meridianPrefix.toLowerCase());

  const warnEl = document.getElementById('acupoint-warn');
  if (targetPoint && !isSupported) {
    warnEl.textContent = '⚠ 该穴位不在此 3D 模型中 (当前支持: 肺经/大肠经/胃经/任脉)';
  }

  // ─── Three.js 变量 ───
  let camera, scene, renderer, controls;
  let targetObj = null;       // 高亮穴位
  let obj_aux = null;         // 上次高亮穴位 (用于复位)
  const statusEl = document.getElementById('status');

  // ─── 初始化 ───
  function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2520);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 2000);
    camera.position.set(0, 80, 80);

    controls = new THREE.OrbitControls(camera);
    controls.damping = 0.2;
    controls.target.set(0, 50, 0);
    controls.addEventListener('change', render);

    // 光照
    scene.add(new THREE.AmbientLight(0x888899));
    const directionalLight1 = new THREE.DirectionalLight(0xffeedd, 1.2);
    directionalLight1.position.set(0, 0, 1);
    scene.add(directionalLight1);
    const directionalLight2 = new THREE.DirectionalLight(0xffeedd, 1.2);
    directionalLight2.position.set(0, 0, -1);
    scene.add(directionalLight2);
    const directionalLight3 = new THREE.DirectionalLight(0xffeedd, 0.8);
    directionalLight3.position.set(0, 1, 0);
    scene.add(directionalLight3);
    const directionalLight4 = new THREE.DirectionalLight(0xffeedd, 0.8);
    directionalLight4.position.set(0, -1, 0);
    scene.add(directionalLight4);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    // 加载 OBJ 模型
    const loader = new THREE.OBJLoader();
    loader.load(
      'three/modelo/corpo.obj',
      function (obj) {
        const texture = new THREE.TextureLoader().load('three/textura/UV_Grid_Sm.jpg');
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2);
        obj.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhongMaterial({
              map: texture,
              specular: 0x333333,
              shininess: 30,
              emissive: 0x222222,
              color: 0xcccccc,
            });
          }
        });
        // 居中 + 缩小适配
        obj.position.y = 50;
        scene.add(obj);
        statusEl.textContent = '模型已加载 · 拖动旋转 · 滚轮缩放';

        // 加载完成后, 立即定位目标穴位
        setTimeout(() => focusTarget(), 300);
      },
      function (xhr) {
        const pct = (xhr.loaded / xhr.total * 100).toFixed(0);
        statusEl.textContent = `加载模型... ${pct}%`;
      },
      function (err) {
        statusEl.textContent = '⚠ 模型加载失败';
        console.error('OBJ load error', err);
      }
    );

    // 加载穴位数据 (从 acu-master 的 JS 导出)
    loadAcupoints();
  }

  // ─── 穴位数据 (从 acu.html 提取的 101 个穴位) ───
  // [经络前缀, 编号, x, y, z]
  const ACUPOINTS_DATA = [
    ['vc', 2, 0.05, -6.0, 6.4],
    ['vc', 3, 0.05, -2.9, 7.1],
    ['vc', 4, 0.05, 0.2, 7.17],
    ['vc', 5, 0.05, 3.3, 7.25],
    ['vc', 6, 0.05, 6.4, 7.3],
    ['vc', 7, 0.05, 9.5, 7.2],
    ['vc', 8, 0.05, 12.7, 6.1],
    ['vc', 9, 0.05, 15.9, 6.1],
    ['vc', 10, 0.05, 18.4, 6.38],
    ['vc', 11, 0.05, 20.9, 6.38],
    ['vc', 12, 0.05, 23.4, 6.58],
    ['vc', 13, 0.05, 25.9, 6.6],
    ['vc', 14, 0.05, 28.4, 5.95],
    ['vc', 15, 0.05, 30.9, 5.06],
    ['vc', 16, 0.05, 33.4, 4.9],
    ['vc', 17, 0.05, 36.0, 4.7],
    ['vc', 18, 0.05, 38.6, 3.6],
    ['vc', 19, 0.05, 41.2, 2.4],
    ['vc', 20, 0.05, 43.8, 1.2],
    ['vc', 21, 0.05, 46.4, -0.9],
    ['vc', 22, 0.05, 49.0, -2.1],
    ['vc', 23, 0.02, 56.0, -0.2],
    ['vc', 24, 0.02, 60.0, 5.0],
    ['p', 1, -13.268, 46.0, -1.1],
    ['p', 2, -11.268, 48.6, -3.4],
    ['p', 3, -22.968, 32.4, -4.7],
    ['p', 4, -23.568, 28.7, -5.0],
    ['p', 5, -24.168, 15.7, -4.6],
    ['p', 6, -25.768, 7.5, -2.7],
    ['p', 7, -26.968, -1.5, -1.5],
    ['p', 8, -26.268, -3.5, -0.5],
    ['p', 9, -27.368, -5.5, -0.3],
    ['p', 10, -27.668, -7.7, 2.1],
    ['p', 11, -30.568, -13.2, 6.0],
    ['ig', 17, 5.532, 54.1, -4.0],
    ['ig', 18, 5.132, 56.1, -3.6],
    ['ig', 19, 0.932, 62.4, 4.9],
    ['ig', 20, 1.932, 62.9, 4.3],
    ['e', 1, -2.968, 66.7, 3.0],
    ['e', 2, -2.968, 66.0, 3.2],
    ['e', 3, -2.868, 63.7, 3.8],
    ['e', 4, -2.768, 61.1, 4.1],
    ['e', 9, -2.968, 54.2, -2.3],
    ['e', 10, -2.268, 51.4, -2.2],
    ['e', 11, -2.968, 47.6, -1.2],
    ['e', 12, -6.668, 48.6, -2.2],
    ['e', 13, -7.068, 47.6, -1.0],
    ['e', 14, -7.668, 44.8, 0.9],
    ['e', 15, -8.768, 42.3, 2.4],
    ['e', 16, -9.868, 38.9, 4.2],
    ['e', 17, -12.068, 33.2, 5.0],
    ['e', 18, -12.068, 30.2, 2.2],
    ['e', 19, -3.168, 25.7, 6.6],
    ['e', 20, -3.168, 22.647, 6.7],
    ['e', 21, -3.168, 19.595, 6.7],
    ['e', 22, -3.168, 16.542, 6.5],
    ['e', 23, -3.168, 13.489, 6.7],
    ['e', 24, -3.168, 10.436, 7.1],
    ['e', 25, -3.168, 7.384, 7.0],
    ['e', 26, -3.168, 4.331, 6.9],
    ['e', 27, -3.168, 1.278, 6.6],
    ['e', 28, -3.168, -1.775, 6.3],
    ['e', 29, -3.168, -4.827, 5.7],
    ['e', 30, -3.168, -7.88, 4.6],
    ['e', 31, -12.468, -11.28, 4.1],
    ['e', 32, -12.468, -28.48, 4.3],
    ['e', 33, -12.468, -36.28, 2.9],
    ['e', 34, -12.468, -38.98, 2.3],
    ['e', 35, -12.468, -47.18, 1.5],
    ['e', 36, -12.468, -53.18, -0.1],
    ['e', 37, -12.468, -63.68, -0.7],
    ['e', 38, -11.768, -69.78, -1.6],
    ['e', 39, -11.368, -73.28, -1.9],
    ['e', 41, -8.668, -85.18, -0.8],
    ['e', 42, -9.968, -88.28, 1.0],
    ['e', 43, -8.868, -90.98, 6.1],
    ['e', 44, -9.468, -91.88, 7.8],
    ['e', 45, -9.968, -93.18, 11.3],
  ];

  function loadAcupoints() {
    const sphereGeo = new THREE.SphereGeometry(0.3, 32, 32);

    ACUPOINTS_DATA.forEach(([prefix, num, x, y, z]) => {
      const material = new THREE.MeshLambertMaterial({ color: 0xa742f4 });
      const sphere = new THREE.Mesh(sphereGeo, material);
      sphere.name = `${prefix}${num}`;
      sphere.position.set(x, y, z);
      sphere.userData.acupoint = `${prefix.toUpperCase()}${num}`;
      scene.add(sphere);
    });
  }

  // ─── 定位目标穴位 ───
  function focusTarget() {
    if (!targetPoint) return;

    document.getElementById('loading').classList.add('hidden');

    targetObj = scene.getObjectByName(targetPoint);
    if (!targetObj) {
      statusEl.textContent = `⚠ 未找到穴位 ${targetPoint}`;
      return;
    }

    // 高亮目标穴位
    targetObj.material.color.setHex(0xff4444);
    targetObj.material.emissive.setHex(0x441111);
    targetObj.currentHex = 0xa742f4;

    // 复位上一个穴位
    if (obj_aux && obj_aux !== targetObj) {
      obj_aux.material.color.setHex(0xa742f4);
      obj_aux.material.emissive.setHex(0x000000);
    }
    obj_aux = targetObj;

    // 镜头飞向目标
    const targetPos = new THREE.Vector3();
    targetObj.getWorldPosition(targetPos);

    // 动画过渡
    const startPos = camera.position.clone();
    const endPos = new THREE.Vector3(
      targetPos.x,
      targetPos.y,
      targetPos.z + 30
    );
    const startTarget = controls.target.clone();
    const endTarget = targetPos.clone();

    let progress = 0;
    const duration = 1000;
    const startTime = Date.now();

    function animate_camera() {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      camera.position.lerpVectors(startPos, endPos, ease);
      controls.target.lerpVectors(startTarget, endTarget, ease);

      if (progress < 1) {
        requestAnimationFrame(animate_camera);
      }
      render();
    }
    animate_camera();

    statusEl.textContent = `✓ 已定位: ${targetObj.userData.acupoint}`;
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  // ─── 启动 ───
  init();
  render();

  // 隐藏 loading (3 秒后强制隐藏, 防止加载失败卡死)
  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
  }, 3000);

  // 持续渲染
  function loop() {
    requestAnimationFrame(loop);
    controls.update();
  }
  loop();

})();