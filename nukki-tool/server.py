"""
Local nukki tool — drop a video, get an alpha-channel webm with corner-flood-fill
background removal (preserves whites inside the subject like eye whites, teeth, etc).

Run:  python3 server.py     # http://127.0.0.1:8765
"""
import os, sys, subprocess, shutil, uuid, json, traceback
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

from PIL import Image
import numpy as np
from scipy import ndimage

ROOT = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(ROOT, 'outputs')
os.makedirs(OUTPUT_DIR, exist_ok=True)

WHITE_THRESHOLD = 240  # pixels above this in all channels are candidate background
EDGE_ALPHA = 128       # 1px feather alpha


def process_video(src_path, dst_webm, threshold=WHITE_THRESHOLD, edge_alpha=EDGE_ALPHA):
    job = uuid.uuid4().hex
    tmp_rgb  = f'/tmp/nukki_rgb_{job}'
    tmp_rgba = f'/tmp/nukki_rgba_{job}'
    os.makedirs(tmp_rgb)
    os.makedirs(tmp_rgba)
    try:
        # detect framerate from source
        try:
            fr = subprocess.check_output([
                'ffprobe','-v','error','-select_streams','v:0',
                '-show_entries','stream=r_frame_rate','-of','default=nw=1:nk=1', src_path
            ]).decode().strip()
            num, den = fr.split('/')
            fps = str(round(int(num)/int(den), 3))
        except Exception:
            fps = '30'

        subprocess.run(['ffmpeg','-y','-i',src_path,'-vsync','0',
                        f'{tmp_rgb}/%04d.png','-loglevel','error'], check=True)

        files = sorted(f for f in os.listdir(tmp_rgb) if f.endswith('.png'))
        if not files:
            raise RuntimeError('no frames extracted')

        for fn in files:
            im = Image.open(os.path.join(tmp_rgb, fn)).convert('RGB')
            arr = np.array(im)
            white = (arr[:,:,0] > threshold) & (arr[:,:,1] > threshold) & (arr[:,:,2] > threshold)
            labels, _ = ndimage.label(white)
            h, w = labels.shape
            corners = {labels[0,0], labels[0,w-1], labels[h-1,0], labels[h-1,w-1]}
            corners.discard(0)
            bg = np.isin(labels, list(corners)) if corners else np.zeros_like(white, dtype=bool)
            edge = ndimage.binary_dilation(~bg, iterations=1) & bg
            alpha = np.full_like(bg, 255, dtype=np.uint8)
            alpha[bg] = 0
            alpha[edge] = edge_alpha
            rgba = np.dstack([arr, alpha])
            Image.fromarray(rgba).save(os.path.join(tmp_rgba, fn))

        subprocess.run(['ffmpeg','-y','-framerate',fps,'-i',f'{tmp_rgba}/%04d.png',
                        '-c:v','libvpx-vp9','-pix_fmt','yuva420p','-b:v','0','-crf','30',
                        '-an','-row-mt','1', dst_webm,'-loglevel','error'], check=True)

        return {'frames': len(files), 'fps': fps}
    finally:
        shutil.rmtree(tmp_rgb,  ignore_errors=True)
        shutil.rmtree(tmp_rgba, ignore_errors=True)


class H(BaseHTTPRequestHandler):
    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/':
            self._serve('index.html', 'text/html; charset=utf-8')
        elif path == '/style.css':
            self._serve('style.css', 'text/css; charset=utf-8')
        elif path == '/script.js':
            self._serve('script.js', 'application/javascript; charset=utf-8')
        elif path.startswith('/outputs/'):
            fname = os.path.basename(path[len('/outputs/'):])
            full = os.path.join(OUTPUT_DIR, fname)
            if os.path.isfile(full):
                self.send_response(200)
                self.send_header('Content-Type','video/webm')
                self.send_header('Accept-Ranges','bytes')
                self.send_header('Content-Length', str(os.path.getsize(full)))
                self.send_header('Cache-Control','no-store')
                self.end_headers()
                with open(full,'rb') as f:
                    shutil.copyfileobj(f, self.wfile)
            else:
                self.send_error(404)
        elif path.startswith('/download/'):
            fname = os.path.basename(path[len('/download/'):])
            full = os.path.join(OUTPUT_DIR, fname)
            if os.path.isfile(full):
                from urllib.parse import parse_qs
                qs = parse_qs(urlparse(self.path).query)
                save_name = qs.get('name', [fname])[0]
                if not save_name.lower().endswith('.webm'):
                    save_name = save_name + '.webm'
                self.send_response(200)
                self.send_header('Content-Type','application/octet-stream')
                self.send_header('Content-Disposition',
                                 f'attachment; filename="{save_name}"')
                self.send_header('Content-Length', str(os.path.getsize(full)))
                self.send_header('Cache-Control','no-store')
                self.end_headers()
                with open(full,'rb') as f:
                    shutil.copyfileobj(f, self.wfile)
            else:
                self.send_error(404)
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path == '/upload':
            length = int(self.headers.get('Content-Length','0'))
            if length <= 0:
                return self._json({'ok': False, 'error': 'empty upload'}, 400)

            name = self.headers.get('X-Filename', 'upload.mp4')
            ext = os.path.splitext(name)[1].lower() or '.mp4'
            tmp_src = f'/tmp/nukki_src_{uuid.uuid4().hex}{ext}'

            try:
                with open(tmp_src,'wb') as f:
                    remaining = length
                    while remaining > 0:
                        chunk = self.rfile.read(min(remaining, 65536))
                        if not chunk: break
                        f.write(chunk)
                        remaining -= len(chunk)

                out_id = uuid.uuid4().hex
                out_name = f'{out_id}.webm'
                out_path = os.path.join(OUTPUT_DIR, out_name)

                meta = process_video(tmp_src, out_path)
                size = os.path.getsize(out_path)
                return self._json({
                    'ok': True,
                    'url': f'/outputs/{out_name}',
                    'name': out_name,
                    'size': size,
                    'frames': meta.get('frames'),
                    'fps': meta.get('fps'),
                    'orig_name': name,
                })
            except Exception as e:
                traceback.print_exc()
                return self._json({'ok': False, 'error': f'{type(e).__name__}: {e}'}, 500)
            finally:
                try: os.remove(tmp_src)
                except OSError: pass
        else:
            self.send_error(404)

    def _serve(self, name, mime):
        full = os.path.join(ROOT, name)
        if not os.path.isfile(full):
            self.send_error(404); return
        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(os.path.getsize(full)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        with open(full,'rb') as f:
            shutil.copyfileobj(f, self.wfile)

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write(f'[{self.log_date_time_string()}] {fmt%args}\n')


if __name__ == '__main__':
    port = int(os.environ.get('PORT', '8765'))
    print(f'nukki-tool serving on http://127.0.0.1:{port}')
    HTTPServer(('127.0.0.1', port), H).serve_forever()
