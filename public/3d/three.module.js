/**
 * tianyi-acu 3D 穴位图 - ESM 版本
 *
 * 基于 chino-meds 的 human.glb + points3d.json (MIT 协议)
 * 替换之前的 acu-master OBJ 方案, 现在支持 161 个穴位 (含胆/肝/三焦/心包等)
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── URL 参数 ───
const params = new URLSearchParams(window.location.search);
const targetCode = (params.get('point') || '').toUpperCase();
const targetName = params.get('name') || '';
const targetMeridian = params.get('meridian') || '';

// ─── 状态 ───
let camera, scene, renderer, controls;
let humanModel = null;
let acupointMarkers = [];
let targetMarker = null;
let statusEl = null;

function setStatus(msg) {
  if (!statusEl) statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = msg;
}

// ─── UI 显示 ───
document.getElementById('acupoint-name').textContent = targetName || '3D 经穴图';
document.getElementById('acupoint-code').textContent = targetCode ? `(${targetCode})` : '';
document.getElementById('acupoint-meridian').textContent = targetMeridian || '拖动旋转 · 滚轮缩放';

// ─── 初始化 Three.js ───
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a2520);

  // Renderer (先创建, 这样 OrbitControls 才能拿到 domElement)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  // 相机 (针对 ~3.4 单位高模型)
  camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.05, 50);
  camera.position.set(0, 1.5, 5.0);

  // 控制器
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.0, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.5;
  controls.maxDistance = 20;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI - 0.2;

  // 光照 (5 个光源)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir1 = new THREE.DirectionalLight(0xffffff, 1.5);
  dir1.position.set(1, 2, 1);
  scene.add(dir1);
  const dir2 = new THREE.DirectionalLight(0xffeedd, 1.0);
  dir2.position.set(-1, 1, -1);
  scene.add(dir2);
  const dir3 = new THREE.DirectionalLight(0xffeedd, 0.8);
  dir3.position.set(0, -1, 0.5);
  scene.add(dir3);
  const dir4 = new THREE.DirectionalLight(0xffffff, 0.6);
  dir4.position.set(0, 2, -1);
  scene.add(dir4);

  window.addEventListener('resize', onWindowResize, false);
}

// ─── 加载人体模型 ───
async function loadHuman() {
  const pts3dData = await fetch('points3d.json').then(r => r.json());
  const frame = pts3dData.frame || { targetH: 3.4, centerY: 0.07 };
  const targetH = frame.targetH;
  const centerY = frame.centerY;

  const loader = new GLTFLoader();
  return new Promise((resolve, reject) => {
    loader.load(
      'human.glb',
      (gltf) => {
        humanModel = gltf.scene;

        humanModel.traverse((child) => {
          if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(m => {
              if (m.color) {
                m.color.setHex(0xFAE4D2);  // 人体肤色
                m.roughness = 0.72;
                m.metalness = 0;
                m.needsUpdate = true;
              }
            });
          }
        });

        // 缩放到目标高度
        humanModel.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(humanModel);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const scale = targetH / (size.y || 1);
        humanModel.scale.setScalar(scale);
        humanModel.position.set(
          -center.x * scale,
          centerY - center.y * scale,
          -center.z * scale
        );

        scene.add(humanModel);
        setStatus('模型已加载 · 拖动旋转 · 滚轮缩放');
        resolve();
      },
      (xhr) => {
        const pct = (xhr.loaded / xhr.total * 100).toFixed(0);
        setStatus(`加载模型... ${pct}%`);
      },
      (err) => {
        setStatus('⚠ 模型加载失败');
        console.error('GLTF load error', err);
        reject(err);
      }
    );
  });
}

// ─── 加载穴位标记 ───
function loadAcupointMarkers(pts3d) {
  const sphereGeo = new THREE.SphereGeometry(0.012, 16, 16);

  Object.entries(pts3d.points).forEach(([code, positions]) => {
    // 前视图穴位橘色, 后视图穴位蓝色
    const isFront = code.includes('LR') || code.includes('LU') || code.includes('ST') ||
                    code.includes('SP') || code.includes('LI') || code.includes('HT') ||
                    code.includes('SI') || code.includes('PC') || code.includes('TE') ||
                    code.includes('CV') || code.includes('EX');
    const color = isFront ? 0xff8844 : 0x4488ff;

    positions.forEach((pos, idx) => {
      const material = new THREE.MeshLambertMaterial({
        color: color,
        transparent: true,
        opacity: 0.85,
      });
      const sphere = new THREE.Mesh(sphereGeo, material);
      sphere.position.set(pos[0], pos[1], pos[2]);
      sphere.userData.code = code;
      sphere.userData.bilateral = positions.length > 1;
      sphere.userData.side = idx === 0 ? 'left' : 'right';
      scene.add(sphere);
      acupointMarkers.push(sphere);
    });
  });
}

// ─── 聚焦目标穴位 ───
function focusTarget() {
  document.getElementById('loading').classList.add('hidden');

  if (!targetCode) {
    setStatus(`✓ ${acupointMarkers.length} 个穴位已加载`);
    return;
  }

  targetMarker = acupointMarkers.find(m => m.userData.code === targetCode);
  if (!targetMarker) {
    setStatus(`⚠ 未找到穴位 ${targetCode}`);
    return;
  }

  // 高亮目标
  targetMarker.material.color.setHex(0xff2222);
  targetMarker.material.emissive = new THREE.Color(0x882222);
  targetMarker.scale.setScalar(2.5);

  const targetPos = targetMarker.position.clone();
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();

  const distance = 1.5;  // 距离目标的相机距离
  const endPos = new THREE.Vector3(
    targetPos.x * 0.5,
    targetPos.y + 0.2,
    targetPos.z + distance
  );
  const endTarget = targetPos.clone();

  const duration = 1200;
  const startTime = Date.now();
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);

    camera.position.lerpVectors(startPos, endPos, ease);
    controls.target.lerpVectors(startTarget, endTarget, ease);

    if (progress < 1) requestAnimationFrame(animate);
  }
  animate();

  setStatus(`✓ 已定位: ${targetCode}`);
}

// ─── 调整大小 ───
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ─── 主流程 ───
async function main() {
  init();

  // 并行加载数据
  const [pts3d, acupoints] = await Promise.all([
    fetch('points3d.json').then(r => r.json()),
    fetch('acupoints.json').then(r => r.json()),
  ]);

  // 显示穴位定位信息
  if (targetCode && acupoints.points) {
    const point = acupoints.points.find(p => p.code === targetCode);
    if (point) {
      document.getElementById('acupoint-location').textContent = point.location_zh || '';
    }
  }

  await loadHuman();
  loadAcupointMarkers(pts3d);
  focusTarget();

  // 渲染循环
  function loop() {
    requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
  }
  loop();

  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
  }, 8000);
}

main().catch(err => {
  console.error('Init error:', err);
  setStatus(`⚠ 初始化失败: ${err.message}`);
});