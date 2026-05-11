/* 공유 BGM — 모든 페이지에서 끊김 없이 (localStorage 로 muted/위치 기억)
   기본 정책: 첫 진입은 소리 ON 으로 시도 → 브라우저가 막으면 muted 로 재생 +
   사용자가 화면 어디든 한 번 누르면 자동으로 소리 켜짐. 이후엔 사용자가 명시적으로
   끈 상태(localStorage 'true')만 기억한다. */
(function () {
  if (window.__bgmInit) return;
  window.__bgmInit = true;

  // 스타일 주입
  const css = `
    .sound-btn {
      position: fixed;
      bottom: 22px;
      left: 22px;
      width: 44px;
      height: 44px;
      background: #fff;
      border: 2px solid #2a2150;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #2a2150;
      z-index: 9999;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      font-family: inherit;
    }
    .sound-btn:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 6px 18px rgba(255, 100, 200, 0.4);
    }
    .sound-btn:active { transform: scale(0.94); }
    .sound-btn .ic-sound { display: none; }
    .sound-btn .ic-mute  { display: block; }
    .sound-btn[data-muted="false"] .ic-sound { display: block; }
    .sound-btn[data-muted="false"] .ic-mute  { display: none; }
  `;
  const style = document.createElement('style');
  style.id = 'bgm-style';
  style.textContent = css;
  document.head.appendChild(style);

  // 오디오 (이미 인라인으로 박혀있으면 그걸 사용, 없으면 생성)
  let audio = document.querySelector('audio.bgm');
  if (!audio) {
    audio = document.createElement('audio');
    audio.className = 'bgm';
    audio.src = 'assets/static/bgm.mp3';
    audio.loop = true;
    audio.preload = 'auto';
    document.body.appendChild(audio);
  }
  audio.volume = 0.45;

  // 사용자가 명시적으로 mute 한 적이 있으면 그대로 따른다.
  // 그 외(첫 방문 / 명시적 unmute)는 ON 시도.
  const savedMuted = localStorage.getItem('bgmMuted');
  const userExplicitlyMuted = (savedMuted === 'true');
  const savedTime = parseFloat(localStorage.getItem('bgmTime') || '0');

  audio.addEventListener('loadedmetadata', () => {
    if (!isNaN(savedTime) && savedTime > 0) {
      try { audio.currentTime = savedTime % (audio.duration || 1); } catch {}
    }
  }, { once: true });

  function tryUnmuted() {
    audio.muted = false;
    return audio.play();
  }
  function fallbackMuted() {
    audio.muted = true;
    audio.play().catch(() => {});
    // 사용자가 한 번이라도 화면 건드리면 자동 unmute
    const unmuteOnce = () => {
      if (!localStorage.getItem('bgmMuted')) {
        audio.muted = false;
        audio.play().catch(() => {});
        btn.dataset.muted = 'false';
      }
      window.removeEventListener('pointerdown', unmuteOnce, true);
      window.removeEventListener('keydown', unmuteOnce, true);
      window.removeEventListener('touchstart', unmuteOnce, true);
    };
    window.addEventListener('pointerdown', unmuteOnce, true);
    window.addEventListener('keydown', unmuteOnce, true);
    window.addEventListener('touchstart', unmuteOnce, true);
  }

  if (userExplicitlyMuted) {
    audio.muted = true;
    audio.play().catch(() => {});
  } else {
    tryUnmuted().catch(() => fallbackMuted());
  }

  // 사운드 버튼 (없으면 생성)
  let btn = document.querySelector('.sound-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.className = 'sound-btn';
    btn.setAttribute('aria-label', '소리 켜기/끄기');
    btn.innerHTML = `
      <svg class="ic-mute"  viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      </svg>
      <svg class="ic-sound" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>`;
    document.body.appendChild(btn);
  }
  btn.dataset.muted = String(audio.muted);
  // 오디오 muted 상태 변화에 버튼 동기화
  audio.addEventListener('volumechange', () => {
    btn.dataset.muted = String(audio.muted);
  });

  btn.addEventListener('click', () => {
    audio.muted = !audio.muted;
    btn.dataset.muted = String(audio.muted);
    localStorage.setItem('bgmMuted', String(audio.muted));
    if (!audio.muted) audio.play().catch(() => {});
  });

  // 현재 위치 저장 (페이지 이동 후 이어듣기)
  let lastSave = 0;
  audio.addEventListener('timeupdate', () => {
    const now = audio.currentTime;
    if (Math.abs(now - lastSave) > 0.5) {
      localStorage.setItem('bgmTime', String(now));
      lastSave = now;
    }
  });
})();
