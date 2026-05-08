(function () {
  var ua = navigator.userAgent || '';
  var isMobileUA = /Android.*Mobile|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  var isNarrow = window.innerWidth < 768;
  if (!isMobileUA && !isNarrow) return;

  function show() {
    if (!document.body) return;
    document.documentElement.style.cssText = 'margin:0;padding:0;overflow:hidden;height:100%;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;height:100vh;';

    var gate = document.createElement('div');
    gate.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999',
      'background:radial-gradient(ellipse at center, #1a0030 0%, #06000d 70%)',
      'color:#f6f1ff',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'padding:40px 24px', 'text-align:center',
      "font-family:'Inter',sans-serif"
    ].join(';') + ';';

    gate.innerHTML =
      '<div style="font-family:\'Anton\',sans-serif;font-size:44px;line-height:1;color:#ff2bd6;text-shadow:3px 3px 0 #00e5ff;margin-bottom:28px;letter-spacing:-1px;">KDI&#9733;</div>' +
      '<div style="font-family:\'Bungee\',sans-serif;font-size:10px;letter-spacing:3px;color:#c7ff00;margin-bottom:18px;">// ACCESS DENIED</div>' +
      '<div style="font-family:\'Anton\',sans-serif;font-size:clamp(48px,16vw,80px);line-height:.9;color:#f6f1ff;text-shadow:2px 2px 0 #ff2bd6,4px 4px 0 #00e5ff;letter-spacing:-2px;margin-bottom:32px;">DESKTOP<br/>ONLY</div>' +
      '<div style="font-family:\'Inter\',sans-serif;font-size:14px;font-weight:600;line-height:1.6;color:#a0a0c0;max-width:340px;word-break:keep-all;margin-bottom:36px;">이 사이트는 <span style="color:#c7ff00;">PC 환경</span>에서만 즐길 수 있어요.<br/>데스크톱·노트북에서 다시 접속해주세요.</div>' +
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:10px;color:#6060a0;letter-spacing:2px;">VOL.01 — Y2K EDITION</div>';

    document.body.appendChild(gate);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();
