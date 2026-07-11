"""
Real-time chat Socket.IO event handlers.
Handles messaging, online status, typing indicators, and AI stand-in triggers.
"""

from flask import session, request
from flask_socketio import emit, join_room, leave_room
from models import (
    save_message, get_chat_history, get_user_by_id,
    set_user_online, mark_messages_read, get_unread_count,
    toggle_ai_standin, get_all_users
)
from ai_standin import generate_ai_reply
import time

# Track connected users: { user_id: sid }
connected_users = {}
sid_to_user = {}


def get_room_name(user1_id, user2_id):
    """Generate a consistent room name for two users."""
    ids = sorted([int(user1_id), int(user2_id)])
    return f"chat_{ids[0]}_{ids[1]}"


def register_socket_events(socketio):
    """Register all Socket.IO event handlers."""

    @socketio.on('connect')
    def handle_connect(auth=None):
        """Handle user connection."""
        user_id = None
        if auth:
            user_id = auth.get('user_id')
        if not user_id:
            user_id = session.get('user_id')

        if not user_id:
            return False  # Reject connection

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return False

        sid_to_user[request.sid] = user_id
        connected_users[user_id] = request.sid
        set_user_online(user_id, True)

        # Broadcast online status to all
        user = get_user_by_id(user_id)
        emit('user_status', {
            'user_id': user_id,
            'display_name': user['display_name'],
            'is_online': True
        }, broadcast=True)

        print(f"[ONLINE] {user['display_name']} connected")

    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle user disconnection."""
        user_id = sid_to_user.pop(request.sid, None)
        if not user_id:
            return

        connected_users.pop(user_id, None)
        set_user_online(user_id, False)

        user = get_user_by_id(user_id)
        if user:
            emit('user_status', {
                'user_id': user_id,
                'display_name': user['display_name'],
                'is_online': False,
                'last_seen': time.strftime('%Y-%m-%d %H:%M:%S')
            }, broadcast=True)

            print(f"[OFFLINE] {user['display_name']} disconnected")

    @socketio.on('join_chat')
    def handle_join_chat(data):
        """Join a private chat room between two users."""
        user_id = sid_to_user.get(request.sid)
        if not user_id:
            return

        other_user_id = data.get('other_user_id')
        if not other_user_id:
            return

        room = get_room_name(user_id, other_user_id)
        join_room(room)

        # Mark messages from the other user as read
        mark_messages_read(other_user_id, user_id)

        # Load chat history
        history = get_chat_history(user_id, other_user_id, limit=100)
        emit('chat_history', {'messages': history, 'other_user_id': other_user_id})

        print(f"[CHAT] User {user_id} joined room {room}")

    @socketio.on('leave_chat')
    def handle_leave_chat(data):
        """Leave a private chat room."""
        user_id = sid_to_user.get(request.sid)
        if not user_id:
            return

        other_user_id = data.get('other_user_id')
        if not other_user_id:
            return

        room = get_room_name(user_id, other_user_id)
        leave_room(room)

    @socketio.on('send_message')
    def handle_send_message(data):
        """Handle sending a message."""
        user_id = sid_to_user.get(request.sid)
        if not user_id:
            return

        receiver_id = data.get('receiver_id')
        content = data.get('content', '').strip()

        if not receiver_id or not content:
            return

        # Save the message
        message = save_message(user_id, receiver_id, content)

        # Get sender info
        sender = get_user_by_id(user_id)
        message['sender_name'] = sender['display_name']

        receiver = get_user_by_id(receiver_id)
        message['receiver_name'] = receiver['display_name']

        # Send to the chat room
        room = get_room_name(user_id, receiver_id)
        emit('new_message', message, room=room)

        # Also send a notification to the receiver (even if not in the room)
        receiver_sid = connected_users.get(receiver_id)
        if receiver_sid:
            emit('message_notification', {
                'sender_id': user_id,
                'sender_name': sender['display_name'],
                'content': content[:50] + ('...' if len(content) > 50 else ''),
                'unread_count': get_unread_count(user_id, receiver_id)
            }, room=receiver_sid)

        # ── AI Stand-In Check ─────────────────────────────────────
        # If receiver is offline and has AI stand-in enabled, generate AI reply
        if receiver_id not in connected_users and receiver.get('ai_standin_enabled'):
            ai_reply = generate_ai_reply(
                offline_user_id=receiver_id,
                incoming_message=content,
                sender_name=sender['display_name']
            )

            if ai_reply:
                # Save AI-generated reply
                ai_message = save_message(
                    receiver_id, user_id, ai_reply, is_ai_generated=True
                )
                ai_message['sender_name'] = receiver['display_name']
                ai_message['receiver_name'] = sender['display_name']

                # Small delay to feel natural
                socketio.sleep(1.5)

                # Send the AI reply to the room
                emit('new_message', ai_message, room=room)

                try:
                    print(f"[AI] AI replied as {receiver['display_name']}: {ai_reply[:50]}...")
                except UnicodeEncodeError:
                    safe_reply = ai_reply[:50].encode('ascii', errors='replace').decode('ascii')
                    print(f"[AI] AI replied as {receiver['display_name']}: {safe_reply}...")

    @socketio.on('typing')
    def handle_typing(data):
        """Broadcast typing indicator."""
        user_id = sid_to_user.get(request.sid)
        if not user_id:
            return

        receiver_id = data.get('receiver_id')
        is_typing = data.get('is_typing', False)

        if not receiver_id:
            return

        room = get_room_name(user_id, receiver_id)
        user = get_user_by_id(user_id)

        emit('typing_indicator', {
            'user_id': user_id,
            'display_name': user['display_name'],
            'is_typing': is_typing
        }, room=room, include_self=False)

    @socketio.on('toggle_ai_standin')
    def handle_toggle_ai(data):
        """Toggle AI stand-in for the current user."""
        user_id = sid_to_user.get(request.sid)
        if not user_id:
            return

        enabled = data.get('enabled', False)
        toggle_ai_standin(user_id, enabled)

        emit('ai_standin_status', {
            'user_id': user_id,
            'enabled': enabled
        }, broadcast=True)

        user = get_user_by_id(user_id)
        status = "enabled" if enabled else "disabled"
        print(f"[AI] AI Stand-In {status} for {user['display_name']}")

    @socketio.on('get_contacts')
    def handle_get_contacts():
        """Get all users as contacts with their online status."""
        user_id = sid_to_user.get(request.sid)
        if not user_id:
            return

        users = get_all_users(exclude_id=user_id)

        # Add unread counts
        for u in users:
            u['unread_count'] = get_unread_count(u['id'], user_id)

        emit('contacts_list', {'contacts': users})
