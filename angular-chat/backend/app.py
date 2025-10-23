"""
ANGULAR CHAT BACKEND - Flask + Server-Sent Events

Backend Framework: Flask (Python)
Communication: Server-Sent Events (SSE) + HTTP POST

KEY DIFFERENCES:
- Python vs JavaScript
- SSE (unidirectional) vs WebSocket (bidirectional)
- HTTP POST for client->server, SSE for server->client
- Decorator-based routing (Flask style)
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import time
import queue
from datetime import datetime
from threading import Lock

app = Flask(__name__)
CORS(app)

# ============================================================================
# MODEL - In-memory data (like Node.js but in Python)
# ============================================================================
users = {}  # user_id -> {username, queue, is_typing}
users_lock = Lock()
message_history = []
message_id_counter = 0

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def broadcast_message(message):
    """Broadcast message to all connected users via their SSE queues"""
    with users_lock:
        for user_id, user_data in users.items():
            try:
                user_data['queue'].put(message)
            except:
                pass

def get_user_list():
    """Get list of online users"""
    with users_lock:
        return [{'user_id': uid, 'username': data['username']} 
                for uid, data in users.items()]

def get_typing_users():
    """Get list of users currently typing"""
    with users_lock:
        return [data['username'] for data in users.values() if data.get('is_typing', False)]

# ============================================================================
# REST API ENDPOINTS - HTTP POST for sending data
# ============================================================================
@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'users': len(users),
        'messages': len(message_history)
    })

@app.route('/api/join', methods=['POST'])
def join():
    """User joins the chat"""
    data = request.json
    username = data.get('username', 'Anonymous')
    user_id = f"user_{int(time.time() * 1000)}"
    
    # Create user with SSE queue
    with users_lock:
        users[user_id] = {
            'username': username,
            'queue': queue.Queue(),
            'is_typing': False
        }
    
    # Broadcast join message
    broadcast_message({
        'type': 'system',
        'message': f'{username} joined the chat',
        'timestamp': datetime.now().isoformat()
    })
    
    # Broadcast updated user list
    broadcast_message({
        'type': 'user_list',
        'users': get_user_list()
    })
    
    print(f'✅ {username} joined ({user_id})')
    
    return jsonify({
        'user_id': user_id,
        'username': username,
        'history': message_history
    })

@app.route('/api/message', methods=['POST'])
def send_message():
    """Send a chat message"""
    global message_id_counter
    data = request.json
    user_id = data.get('user_id')
    text = data.get('text')

    if not user_id or user_id not in users:
        return jsonify({'error': 'Invalid user'}), 400

    username = users[user_id]['username']

    # ========================================================================
    # PRIVATE MESSAGING FEATURE - Python/Flask Implementation
    # Check if message starts with @username for direct message
    # ========================================================================
    import re
    dm_match = re.match(r'^@\s*(\w+)[,:\s]*(.*)', text)
    is_direct_message = dm_match is not None
    recipient_username = dm_match.group(1) if dm_match else None

    message = {
        'id': message_id_counter,
        'type': 'message',
        'text': text,
        'sender': username,
        'user_id': user_id,
        'timestamp': datetime.now().isoformat(),
        'isDirectMessage': is_direct_message,
        'recipient': recipient_username
    }

    message_id_counter += 1

    if is_direct_message and recipient_username:
        # Direct message - send only to sender and recipient
        # Python approach: Find recipient by username using dict comprehension
        recipient = next((u for uid, u in users.items()
                         if u['username'].lower() == recipient_username.lower()), None)

        if recipient:
            print(f'📩 DM from {username} to {recipient_username}: {text}')

            # Send to recipient's queue
            try:
                recipient['queue'].put(message)
            except:
                pass

            # Send to sender's queue (echo back)
            try:
                users[user_id]['queue'].put(message)
            except:
                pass
        else:
            # Recipient not found - send error message to sender
            error_msg = {
                'type': 'system',
                'message': f'User @{recipient_username} not found',
                'timestamp': datetime.now().isoformat()
            }
            try:
                users[user_id]['queue'].put(error_msg)
            except:
                pass
    else:
        # Regular broadcast message
        # Add to history
        message_history.append(message)
        if len(message_history) > 50:
            message_history.pop(0)

        # Broadcast message
        broadcast_message(message)

        print(f'💬 {username}: {text}')

    # Clear typing indicator
    with users_lock:
        if user_id in users:
            users[user_id]['is_typing'] = False
            broadcast_message({
                'type': 'typing_indicator',
                'typing_users': get_typing_users()
            })

    return jsonify({'status': 'ok'})

@app.route('/api/typing', methods=['POST'])
def typing():
    """User is typing"""
    data = request.json
    user_id = data.get('user_id')
    is_typing = data.get('is_typing', True)
    
    if user_id in users:
        with users_lock:
            users[user_id]['is_typing'] = is_typing
            
        broadcast_message({
            'type': 'typing_indicator',
            'typing_users': get_typing_users()
        })
    
    return jsonify({'status': 'ok'})

# ============================================================================
# SERVER-SENT EVENTS ENDPOINT - For real-time updates
# ============================================================================
@app.route('/api/events/<user_id>')
def events(user_id):
    """SSE stream for real-time updates"""
    
    if user_id not in users:
        return jsonify({'error': 'Invalid user'}), 400
    
    def generate():
        """Generator function for SSE"""
        user_queue = users[user_id]['queue']
        
        try:
            while user_id in users:
                try:
                    # Wait for message with timeout
                    message = user_queue.get(timeout=30)
                    yield f"data: {json.dumps(message)}\n\n"
                except queue.Empty:
                    # Send keepalive
                    yield ": keepalive\n\n"
        except GeneratorExit:
            # Client disconnected
            handle_disconnect(user_id)
    
    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )

def handle_disconnect(user_id):
    """Handle user disconnect"""
    if user_id in users:
        username = users[user_id]['username']
        
        with users_lock:
            del users[user_id]
        
        # Broadcast leave message
        broadcast_message({
            'type': 'system',
            'message': f'{username} left the chat',
            'timestamp': datetime.now().isoformat()
        })
        
        # Broadcast updated user list
        broadcast_message({
            'type': 'user_list',
            'users': get_user_list()
        })
        
        print(f'🔴 {username} disconnected')

# ============================================================================
# START SERVER
# ============================================================================
if __name__ == '__main__':
    print('\n🟢 Angular Chat Backend (Flask + SSE)')
    print('📡 HTTP: http://localhost:3003')
    print('📝 Framework: Flask (Python web framework)')
    print('✨ Protocol: Server-Sent Events + REST API\n')
    
    app.run(host='0.0.0.0', port=3003, debug=False, threaded=True)
