const dropEl    = document.getElementById('drop');
const fileEl    = document.getElementById('file');
const pickBtn   = document.getElementById('pick');
const statusEl  = document.getElementById('status');
const resultEl  = document.getElementById('result');
const metaEl    = resultEl.querySelector('.meta');
const videoEls  = resultEl.querySelectorAll('video.out');
const downloadEl= document.getElementById('download');
const resetBtn  = document.getElementById('reset');

pickBtn.addEventListener('click', () => fileEl.click());
fileEl.addEventListener('change', () => {
  if (fileEl.files[0]) submit(fileEl.files[0]);
});

['dragenter','dragover'].forEach(ev =>
  dropEl.addEventListener(ev, (e) => { e.preventDefault(); dropEl.classList.add('dragging'); })
);
['dragleave','drop'].forEach(ev =>
  dropEl.addEventListener(ev, (e) => { e.preventDefault(); dropEl.classList.remove('dragging'); })
);
dropEl.addEventListener('drop', (e) => {
  const f = e.dataTransfer.files[0];
  if (f) submit(f);
});

resetBtn.addEventListener('click', () => {
  resultEl.classList.add('hidden');
  statusEl.classList.add('hidden');
  fileEl.value = '';
});

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.remove('hidden', 'error');
  if (isError) statusEl.classList.add('error');
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

async function submit(file) {
  resultEl.classList.add('hidden');
  setStatus(`업로드 중… ${file.name} (${fmtBytes(file.size)})`);

  let buf;
  try {
    buf = await file.arrayBuffer();
  } catch (e) {
    setStatus(`파일 읽기 실패: ${e.message}`, true);
    return;
  }

  setStatus(`처리 중… (8초 영상 기준 약 30~60초 소요)`);

  let res;
  try {
    res = await fetch('/upload', {
      method: 'POST',
      headers: { 'X-Filename': encodeURIComponent(file.name) },
      body: buf,
    });
  } catch (e) {
    setStatus(`업로드 실패: ${e.message}`, true);
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    setStatus(`서버 응답 오류 (HTTP ${res.status})`, true);
    return;
  }

  if (!data.ok) {
    setStatus(`처리 실패: ${data.error || 'unknown'}`, true);
    return;
  }

  statusEl.classList.add('hidden');
  metaEl.textContent =
    `${data.orig_name || file.name} → ${data.name} · ` +
    `${data.frames} frames @ ${data.fps}fps · ${fmtBytes(data.size)}`;
  videoEls.forEach((v) => { v.src = data.url; v.load(); v.play().catch(() => {}); });
  const saveName = (file.name.replace(/\.[^.]+$/, '') || 'nukki') + '_alpha.webm';
  downloadEl.href = `/download/${data.name}?name=${encodeURIComponent(saveName)}`;
  downloadEl.download = saveName;
  resultEl.classList.remove('hidden');
}
