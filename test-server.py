#!/usr/bin/env python3
"""
Simple HTTP Server for LightSpeedPay Payment Test
Run: python test-server.py
Then open: http://localhost:8000
"""

import http.server
import socketserver
import webbrowser
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def main():
    # Change to the directory containing payment-test.html
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"🚀 LightSpeedPay Test Server starting...")
        print(f"📡 Server running at: http://localhost:{PORT}")
        print(f"🌐 Opening payment test page...")
        print(f"💳 Ready for ₹1 payment testing!")
        print(f"⚡ Press Ctrl+C to stop server")
        
        # Auto-open browser
        webbrowser.open(f'http://localhost:{PORT}/payment-test.html')
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped.")

if __name__ == "__main__":
    main() 