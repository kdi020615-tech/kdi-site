// ============================
// 별/스파클 캔버스
// ============================
const canvas = document.getElementById('sky');
const ctx = canvas.getContext('2d');
let stars = [];

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const count = Math.round((innerWidth * innerHeight) / 12000);
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.6 + 0.4,
    s: Math.random() * 0.0025 + 0.0008,
    p: Math.random() * Math.PI * 2,
    h: Math.random() < 0.15, // 15% 큰 별 (반짝)
  }));
}

addEventListener('resize', resize);
resize();

function drawStars(t) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    const alpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.s + s.p));
    if (s.h) {
      // 큰 별: 십자형 빛
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 240, 255, ${alpha * 0.6})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(s.x - s.r * 5, s.y); ctx.lineTo(s.x + s.r * 5, s.y);
      ctx.moveTo(s.x, s.y - s.r * 5); ctx.lineTo(s.x, s.y + s.r * 5);
      ctx.stroke();
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  requestAnimationFrame(drawStars);
}
drawStars(0);

// ============================
// 떠다니는 오브젝트 orbit 시스템
// ============================
// link: 클릭 시 이동할 URL (없으면 장식)
// label: 호버 시 말풍선에 띄울 라벨
const OBJECTS = [
  { name: 'youtube',    size: 1.0,  link: 'https://www.youtube.com/@PPad-m9d/videos', external: true, label: '👉 유튜브 보러가기' },
  { name: 'instagram',  size: 1.0,  link: 'https://www.instagram.com/kdirecords/',   external: true, label: '👉 인스타 보러가기' },
  { name: 'threads',    size: 0.9 },
  { name: 'vinyl',      size: 1.2 },
  { name: 'mic',        size: 1.0,  link: 'schedule.html', label: '👉 LIVE 보러가기' },
  { name: 'dollar',     size: 0.9,  link: 'shop.html',     label: '👉 SHOP 보러가기' },
  { name: 'sneaker',    size: 1.3,  link: 'about.html',    label: '👉 ABOUT 보러가기' },
  { name: 'hat',        size: 1.0,  link: 'news.html',     label: '👉 NEWS 보러가기' },
];

// ============================
// 클릭 이펙트: 팝 + 파티클 + 잔향 링
// ============================
const POP_DELAY = 260; // 이펙트 보여주고 이동까지 대기 시간 ms
const SPARK_COLORS = ['#ff6bd6', '#a07dff', '#ffd166', '#7ee0ff', '#ffffff'];

function popElement(el) {
  if (!el) return;
  el.classList.remove('click-pop');
  void el.offsetWidth; // 리플로우로 애니메이션 재시작
  el.classList.add('click-pop');
  setTimeout(() => el.classList.remove('click-pop'), 460);
}

function burst(x, y, opts = {}) {
  const count = opts.count || 12;
  const distMin = opts.distMin || 40;
  const distMax = opts.distMax || 110;
  const lifeMs = opts.life || 700;
  const sizeMin = opts.sizeMin || 6;
  const sizeMax = opts.sizeMax || 12;

  // 파티클들
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'spark';
    const size = sizeMin + Math.random() * (sizeMax - sizeMin);
    const color = SPARK_COLORS[(Math.random() * SPARK_COLORS.length) | 0];
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.background = color;
    s.style.left = (x - size / 2) + 'px';
    s.style.top  = (y - size / 2) + 'px';
    s.style.boxShadow = `0 0 12px ${color}`;
    s.style.transition = `transform ${lifeMs}ms cubic-bezier(.16,.84,.44,1), opacity ${lifeMs}ms ease-out`;
    document.body.appendChild(s);

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.7;
    const dist = distMin + Math.random() * (distMax - distMin);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    requestAnimationFrame(() => {
      s.style.transform = `translate(${dx}px, ${dy}px) scale(0.2) rotate(${Math.random() * 360}deg)`;
      s.style.opacity = '0';
    });
    setTimeout(() => s.remove(), lifeMs + 60);
  }

  // 잔향 링
  const ring = document.createElement('div');
  ring.className = 'ripple';
  const startSize = 40;
  ring.style.width = startSize + 'px';
  ring.style.height = startSize + 'px';
  ring.style.left = (x - startSize / 2) + 'px';
  ring.style.top  = (y - startSize / 2) + 'px';
  ring.style.transition = 'transform 600ms cubic-bezier(.16,.84,.44,1), opacity 600ms ease-out';
  document.body.appendChild(ring);
  requestAnimationFrame(() => {
    ring.style.transform = 'scale(3.4)';
    ring.style.opacity = '0';
  });
  setTimeout(() => ring.remove(), 700);
}

// 클릭 → 이펙트 후 액션 실행
function clickEffect(el, e, action) {
  popElement(el);
  burst(e.clientX, e.clientY);
  if (typeof action === 'function') {
    setTimeout(action, POP_DELAY);
  }
}

// 호버 → 가벼운 스파클(클릭보다 약하게)
function attachHoverSparkle(el, opts = {}) {
  if (!el) return;
  const HOVER_THROTTLE = 800; // 이 시간 내에 다시 호버해도 한 번만
  let last = 0;
  el.addEventListener('mouseenter', (e) => {
    const now = performance.now();
    if (now - last < HOVER_THROTTLE) return;
    last = now;
    burst(e.clientX, e.clientY, {
      count: opts.count || 6,
      distMin: opts.distMin || 24,
      distMax: opts.distMax || 60,
      life: opts.life || 550,
      sizeMin: opts.sizeMin || 4,
      sizeMax: opts.sizeMax || 8,
    });
  });
}

const orbitSystem = document.querySelector('.orbit-system');

// Milla 스타일: 캐릭터 좌우로 흩뿌리기 (8개)
// 얼굴 영역(가운데) 피해서 좌4 / 우4 비대칭 배치
const SCATTER_POSITIONS = [
  { x: -0.42, y: -0.10 },  // 좌상
  { x: -0.34, y:  0.22 },  // 좌하
  { x: -0.24, y: -0.18 },  // 좌상 안쪽
  { x: -0.18, y:  0.32 },  // 좌하 안쪽
  { x:  0.18, y:  0.32 },  // 우하 안쪽
  { x:  0.24, y: -0.18 },  // 우상 안쪽
  { x:  0.34, y:  0.22 },  // 우하
  { x:  0.42, y: -0.10 },  // 우상
];

function buildOrbits() {
  orbitSystem.querySelectorAll('.orbit').forEach((o) => o.remove());
  const vmin = Math.min(innerWidth, innerHeight);
  const vw = innerWidth;
  const sizeUnit = Math.max(54, vmin * 0.11);

  OBJECTS.forEach((obj, i) => {
    const pos = SCATTER_POSITIONS[i % SCATTER_POSITIONS.length];
    const px = pos.x * vw;
    const py = pos.y * vmin;
    const size = sizeUnit * obj.size;

    const floater = document.createElement('div');
    floater.className = 'orbit';
    floater.style.transform = `translate(${px}px, ${py}px)`;

    const inner = document.createElement('div');
    inner.className = 'orbit-radius';
    inner.style.animation = `drift ${4 + (i % 5) * 0.7}s ease-in-out infinite`;
    inner.style.animationDelay = `${-(i * 0.5)}s`;
    inner.style.transform = `translate(-50%, -50%)`;

    const vid = document.createElement('video');
    vid.src = `assets/static/objects/${obj.name}.webm`;
    vid.muted = true;
    vid.loop = true;
    vid.autoplay = true;
    vid.playsInline = true;
    vid.preload = 'auto';
    vid.className = 'orbit-item';
    vid.style.setProperty('--size', `${size}px`);
    vid.style.animationDelay = `${(i % 5) * 0.4}s`;

    if (obj.link) {
      floater.classList.add('orbit-link');
      floater.style.pointerEvents = 'auto';
      floater.style.cursor = 'pointer';
      if (obj.label) floater.dataset.label = obj.label;
      floater.addEventListener('click', (e) => {
        clickEffect(vid, e, () => {
          if (obj.external) window.open(obj.link, '_blank', 'noopener');
          else location.href = obj.link;
        });
      });
      attachHoverSparkle(floater);
    } else {
      // 장식 오브젝트(threads/vinyl)도 가벼운 호버 스파클
      floater.style.pointerEvents = 'auto';
      attachHoverSparkle(floater, { count: 4, distMax: 50 });
    }

    inner.appendChild(vid);
    floater.appendChild(inner);
    orbitSystem.appendChild(floater);
  });
}

buildOrbits();
let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(buildOrbits, 150);
});

// ============================
// 얼굴: 호버시 영상재생 + 클릭시 각 아티스트 페이지로
// ============================
const FACE_LINK = { KDI: 'kdi.html', JYS: 'jys.html', MYR: 'myr.html' };
const EMAIL = 'kimdoil2002@gmail.com';
const toast = document.querySelector('.toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

const stacks = document.querySelectorAll('.face-stack');
const stackData = stacks.length ? Array.from(stacks).map((stack) => {
  const video = stack.querySelector('.face-video');

  // 기본: 첫 프레임 정지 (호버 시에만 재생)
  const freeze = () => {
    video.pause();
    try { video.currentTime = 0; } catch {}
  };
  video.addEventListener('loadedmetadata', freeze);
  video.addEventListener('loadeddata', freeze);
  freeze();

  stack.addEventListener('mouseenter', () => {
    video.play().catch(() => {});
  });
  stack.addEventListener('mouseleave', freeze);
  attachHoverSparkle(stack, { count: 8, distMax: 90 });

  stack.addEventListener('click', (e) => {
    const target = FACE_LINK[stack.dataset.name];
    if (!target) return;
    clickEffect(stack, e, () => { location.href = target; });
  });

  return { stack, video };
}) : [];

// ============================
// 타이틀 클릭 → 홈
// ============================
const title = document.querySelector('.title');
const hintTitle = document.querySelector('.hint-title');
const hintFace  = document.querySelector('.hint-face');

if (title) {
  title.style.cursor = 'pointer';
  title.style.pointerEvents = 'auto';
  title.addEventListener('click', (e) => {
    clickEffect(title, e, () => { location.href = 'home.html'; });
  });
  attachHoverSparkle(title, { count: 10, distMax: 100 });
  if (hintTitle) {
    title.addEventListener('mouseenter', () => hintTitle.classList.add('show'));
    title.addEventListener('mouseleave', () => hintTitle.classList.remove('show'));
  }
}

// 얼굴 어느 하나라도 호버 → 얼굴 안내 말풍선 표시
if (hintFace) {
  let hoverCount = 0;
  document.querySelectorAll('.face-stack').forEach((s) => {
    s.addEventListener('mouseenter', () => {
      hoverCount++;
      hintFace.classList.add('show');
    });
    s.addEventListener('mouseleave', () => {
      hoverCount = Math.max(0, hoverCount - 1);
      if (hoverCount === 0) hintFace.classList.remove('show');
    });
  });
}


// ============================
// 캐릭터 모션: idle 부유 + 마우스 Y 끄덕임 (영상 본체는 항상 재생)
// ============================
let mx = 0, my = 0; // -1 ~ 1
let tx = 0, ty = 0; // 보간

addEventListener('mousemove', (e) => {
  mx = (e.clientX / innerWidth - 0.5) * 2;
  my = (e.clientY / innerHeight - 0.5) * 2;
});
addEventListener('mouseleave', () => { mx = 0; my = 0; });

function animateStacks(t) {
  tx += (mx - tx) * 0.08;
  ty += (my - ty) * 0.08;

  stackData.forEach((d, i) => {
    const bob = Math.sin(t * 0.0011 + i * 1.7) * 5;
    const idleTilt = Math.cos(t * 0.0009 + i * 2.1) * 1.5;
    const noddingX = -ty * 8;
    const sideX = tx * 6;
    const baseY = d.stack.classList.contains('face-side') ? 32 : 0;

    d.stack.style.transform =
      `translate(${sideX}px, ${baseY + bob}px) ` +
      `rotateX(${idleTilt + noddingX}deg)`;
  });
  requestAnimationFrame(animateStacks);
}
requestAnimationFrame(animateStacks);

