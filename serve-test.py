#!/usr/bin/env python3
"""
Simple HTTP server for LightSpeedPay testing
Usage: python serve-test.py
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Change to project directory
    os.chdir(Path(__file__).parent)
    
    Handler = MyHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 LightSpeedPay Test Server")
        print(f"📡 Server: http://localhost:{PORT}")
        print(f"💳 Payment Test: http://localhost:{PORT}/payment-test.html")
        print(f"🔄 Railway Backend: https://web-production-0b337.up.railway.app")
        print(f"\n✅ CORS issues resolved!")
        print(f"Press Ctrl+C to stop server\n")
        
        # Auto-open browser
        webbrowser.open(f'http://localhost:{PORT}/payment-test.html')
        
        httpd.serve_forever()

if __name__ == "__main__":
    main() 