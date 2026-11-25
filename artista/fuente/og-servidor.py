"""Guarda las imágenes para redes de las fichas de artista (artista/<slug>/og.jpg).

Uso (desde la raíz del repo, después de  node artista/fuente/build.js):
    python artista/fuente/og-servidor.py
y abre en el navegador  http://localhost:8766/artista/fuente/og.html
La página dibuja cada imagen con las fuentes del sitio y la manda aquí; este servidor solo acepta
slugs que estén en og-datos.json y solo escribe artista/<slug>/og.jpg. Ciérralo con Ctrl+C al terminar.
Una sola imagen: http://localhost:8766/artista/fuente/og.html?solo=toser-one
"""
import http.server
import json
import os
import urllib.parse

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATOS = os.path.join(RAIZ, 'artista', 'fuente', 'og-datos.json')
PUERTO = 8766


class Manejador(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=RAIZ, **k)

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        slug = urllib.parse.parse_qs(u.query).get('slug', [''])[0]
        with open(DATOS, encoding='utf-8') as f:
            validos = {a['slug'] for a in json.load(f)}
        if u.path != '/guardar-og' or slug not in validos:
            self.send_error(400, 'slug no valido')
            return
        n = int(self.headers.get('Content-Length', 0))
        if not 0 < n < 2_000_000:
            self.send_error(400, 'tamano no valido')
            return
        datos = self.rfile.read(n)
        if datos[:3] != b'\xff\xd8\xff':
            self.send_error(400, 'no es JPG')
            return
        destino = os.path.join(RAIZ, 'artista', slug, 'og.jpg')
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with open(destino, 'wb') as f:
            f.write(datos)
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'ok')

    def log_message(self, *a):
        pass


if __name__ == '__main__':
    print(f'Abre http://localhost:{PUERTO}/artista/fuente/og.html  (Ctrl+C para cerrar)')
    http.server.ThreadingHTTPServer(('127.0.0.1', PUERTO), Manejador).serve_forever()
