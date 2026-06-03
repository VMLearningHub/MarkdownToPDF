#!/usr/bin/env python3
"""Static server for the Markdown -> PDF app, with markdown upload support.

Run:  python3 server.py [port]   (default port 8000)
Then open http://localhost:8000/

Serves all files in this folder and accepts uploads via
POST /api/upload?name=<file.md>  (raw markdown text as the request body),
saving them into the ./storage directory.
"""
import http.server
import os
import socketserver
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
STORAGE = os.path.join(ROOT, "storage")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
MAX_UPLOAD = 5 * 1024 * 1024  # 5 MB safety cap


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/upload":
            self.send_error(404, "Not found")
            return

        qs = urllib.parse.parse_qs(parsed.query)
        raw_name = (qs.get("name") or [""])[0]
        # Strip any path components to keep the write inside ./storage.
        name = os.path.basename(raw_name)
        if not name or not name.lower().endswith((".md", ".markdown")):
            self.send_error(400, "Invalid filename (must be .md or .markdown)")
            return

        length = int(self.headers.get("Content-Length", 0))
        if length <= 0 or length > MAX_UPLOAD:
            self.send_error(413, "Empty or oversized upload")
            return

        data = self.rfile.read(length)
        os.makedirs(STORAGE, exist_ok=True)
        with open(os.path.join(STORAGE, name), "wb") as f:
            f.write(data)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path != "/api/delete":
            self.send_error(404, "Not found")
            return

        qs = urllib.parse.parse_qs(parsed.query)
        raw_name = (qs.get("name") or [""])[0]
        # Strip any path components to keep the delete inside ./storage.
        name = os.path.basename(raw_name)
        if not name or not name.lower().endswith((".md", ".markdown")):
            self.send_error(400, "Invalid filename (must be .md or .markdown)")
            return

        target = os.path.join(STORAGE, name)
        if not os.path.isfile(target):
            self.send_error(404, "File not found")
            return

        os.remove(target)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')

    def log_message(self, fmt, *args):  # quieter logging
        pass


if __name__ == "__main__":
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), Handler) as httpd:
        print(f"Serving {ROOT}")
        print(f"  -> http://localhost:{PORT}/   (uploads saved to ./storage)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
