"""
Main Flask application — ties together auth, chat, AI, and parser modules.
Serves the frontend and handles all WebSocket connections.
"""

import os
import sys
from flask import Flask, send_from_directory, session
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ─── App Configuration ────────────────────────────────────────────────

app = Flask(__name__, static_folder=None)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'chatapp-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

# CORS: read allow-list from FRONTEND_URL env var (comma-separated), fallback to "*"
_frontend_url = os.getenv('FRONTEND_URL', '*')
if _frontend_url != '*':
    _allowed_origins = [o.strip() for o in _frontend_url.split(',')]
else:
    _allowed_origins = '*'

CORS(app, origins=_allowed_origins)

socketio = SocketIO(
    app,
    cors_allowed_origins=_allowed_origins,
    async_mode='eventlet',
    manage_session=True,
    ping_timeout=60,
    ping_interval=25
)

# ─── Frontend Serving ─────────────────────────────────────────────────

# In production, serve the compiled Vite assets from the 'frontend/dist' folder
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')


@app.route('/assets/<path:filename>')
def serve_assets(filename):
    """Serve built static assets from Vite."""
    return send_from_directory(os.path.join(FRONTEND_DIR, 'assets'), filename)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    """Catch-all route to serve index.html for React SPA routing (react-router)."""
    # Prevent intercepting API routes or socket.io
    if path.startswith('api/') or path.startswith('socket.io'):
        return "Not Found", 404
    
    # Fallback to dev explanation if frontend not built yet
    if not os.path.exists(os.path.join(FRONTEND_DIR, 'index.html')):
        return """
        <h3>React Frontend is not compiled yet!</h3>
        <p>Please run the following commands in your workspace to compile it:</p>
        <pre>
        cd frontend
        npm run build
        </pre>
        <p>Or run the React Dev Server:</p>
        <pre>
        cd frontend
        npm run dev
        </pre>
        """, 404
        
    return send_from_directory(FRONTEND_DIR, 'index.html')


# ─── Register Blueprints ──────────────────────────────────────────────

from auth import auth_bp
from whatsapp_parser import parser_bp

app.register_blueprint(auth_bp)
app.register_blueprint(parser_bp)

# ─── Register Socket.IO Events ────────────────────────────────────────

from chat import register_socket_events
register_socket_events(socketio)

# ─── Initialize Database & AI ─────────────────────────────────────────

from models import init_db
from ai_standin import init_groq

init_db()
init_groq()

# ─── Run Server ───────────────────────────────────────────────────────

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    print(f"""\n========================================""")
    print(f"  ChatApp is starting...")
    print(f"")
    print(f"  Local:    http://localhost:{port}")
    print(f"  Network:  http://0.0.0.0:{port}")
    print(f"")
    print(f"  Share the Network URL with your friend!")
    print(f"========================================\n")

    socketio.run(
        app,
        host='0.0.0.0',
        port=port,
        debug=debug,
        use_reloader=False,
        log_output=True
    )
