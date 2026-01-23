#!/usr/bin/env python3

import http.server
import socketserver
from http.server import HTTPServer
import webbrowser
import os
import threading
import json
import time
from datetime import datetime
from urllib.parse import urlparse
try:
    from backend.backend import CTSBackend
except ImportError:
    from backend import CTSBackend

PORT = 8090
DIRECTORY = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ALLOWED_ORIGINS = [
    f'http://localhost:{PORT}',
    f'http://127.0.0.1:{PORT}',
    f'http://[::1]:{PORT}'
]

def is_origin_allowed(origin):
    return origin in ALLOWED_ORIGINS

# Singleton instance de backend para evitar recriação em cada request
_backend_instance = None

def get_backend():
    global _backend_instance
    if _backend_instance is None:
        _backend_instance = CTSBackend()
    return _backend_instance

class CTSHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Usa instância singleton do backend em vez de criar nova a cada request
        self.backend = get_backend()
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        origin = self.headers.get('Origin')
        if origin and is_origin_allowed(origin):
            self.send_header('Access-Control-Allow-Origin', origin)
        else:
            self.send_header('Access-Control-Allow-Origin', 'null')
        
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Credentials', 'false')
        
        # Adicionar headers de cache para assets estáticos
        self._add_cache_headers()
        
        super().end_headers()
    
    def _add_cache_headers(self):
        """Adiciona headers de cache para melhorar performance"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Assets estáticos: cache de 1 hora (3600 segundos)
        static_assets = ['.css', '.js', '.svg', '.ico', '.png', '.jpg', '.woff']
        for asset in static_assets:
            if path.endswith(asset):
                self.send_header('Cache-Control', 'max-age=3600, public')
                return
        
        # HTML: cache curto (recarregar se modificado)
        if path.endswith('.html'):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        else:
            # API: sem cache
            if path.startswith('/api/'):
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')

    def copyfile(self, source, outputfile):
        """Override para tratar BrokenPipeError silenciosamente"""
        try:
            super().copyfile(source, outputfile)
        except BrokenPipeError:
            # Cliente desconectou prematuramente - não é erro crítico
            pass

    def do_GET(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/':
            self.path = '/frontend/index.html'
        if parsed_path.path.startswith('/api/'):
            self.handle_api_request(parsed_path.path)
        else:
            super().do_GET()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        if parsed_path.path == '/api/execute':
            self.handle_execute_tests()
        else:
            self.send_error(404, "Endpoint not found")

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def handle_api_request(self, path):
        print(f"API request: {path}")
        if path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'status': 'online',
                'server': 'Code Test Studio Server v1',
                'version': '1.0.0',
                'timestamp': time.time()
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_error(404, "API endpoint not found")

    def handle_execute_tests(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            config = json.loads(post_data.decode('utf-8'))
            print(f"Executing {len(config.get('test_cases', []))} tests")
            result = self.backend.process_tests(config)
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode())
            print(f"Tests completed: {result.get('passed', 0)}/{result.get('total', 0)} passed")
        except json.JSONDecodeError as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': f'Invalid JSON: {str(e)}'
            }).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': f'Server error: {str(e)}'
            }).encode())

class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    pass

def start_server():
    print("Starting Code Test Studio Server v1")
    print(f"Directory: {DIRECTORY}")

    server = None
    server_thread = None

    try:
        server = ThreadedHTTPServer(("", PORT), CTSHTTPHandler)
        print("=" * 50)
        print("CODE TEST STUDIO v1.0")
        print("=" * 50)
        print(f"Server started on port: {PORT}")
        print(f"Directory: {DIRECTORY}")
        print(f"URL: http://localhost:{PORT}")
        print(f"API: http://localhost:{PORT}/api/")
        print("Opening browser automatically...")

        server_thread = threading.Thread(target=server.serve_forever)
        server_thread.daemon = True
        server_thread.start()
        time.sleep(1)

        try:
            webbrowser.open(f'http://localhost:{PORT}')
            print("Browser opened successfully!")
        except Exception as e:
            print(f"Could not open browser automatically: {e}")
            print(f"Please open manually: http://localhost:{PORT}")

        print("\nPress Ctrl+C to stop server")
        print("=" * 50)

        try:
            while True:
                time.sleep(0.1)
        except KeyboardInterrupt:
            print("\nShutting down server...")
            raise

    except KeyboardInterrupt:
        print("\nStopping server v1...")
        if server:
            try:
                print("Shutting down HTTP server...")
                server.shutdown()
                print("Closing server socket...")
                server.server_close()
                print("Server v1 stopped successfully!")
            except Exception as e:
                print(f"Error during shutdown: {e}")

        if server_thread and server_thread.is_alive():
            print("Waiting for server thread...")
            server_thread.join(timeout=2.0)

        print("Shutdown complete!")

    except OSError as e:
        if e.errno == 98:
            print(f"Error: Port {PORT} is already in use!")
            print("Try using a different port or terminate the current process")
        else:
            print(f"Error starting server: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
    finally:
        if server:
            try:
                server.server_close()
            except:
                pass
        print("Cleanup finished!")

def main():
    print("Code Test Studio - Server Mode v1")
    print("=" * 40)
    try:
        import json
        import subprocess
        print("Dependencies verified")
    except ImportError as e:
        print(f"Missing dependency: {e}")
        return
    start_server()

if __name__ == "__main__":
    main()
