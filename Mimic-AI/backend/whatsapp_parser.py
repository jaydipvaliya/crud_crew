"""
WhatsApp chat export parser.
Handles multiple date/time formats used by WhatsApp across regions.
"""

import re
import os
from flask import Blueprint, request, jsonify, session
from models import save_chat_export, get_all_chat_exports, get_chat_export
from auth import get_current_user_id

parser_bp = Blueprint('parser', __name__)

# Upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Common WhatsApp export patterns
# Format 1: DD/MM/YYYY, HH:MM - Name: Message
# Format 2: MM/DD/YY, HH:MM AM/PM - Name: Message
# Format 3: [DD/MM/YYYY, HH:MM:SS] Name: Message
PATTERNS = [
    # DD/MM/YYYY, HH:MM - Name: Message (most common)
    re.compile(r'^(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*[-–]\s*(.+?):\s(.+)$'),
    # [DD/MM/YYYY, HH:MM:SS] Name: Message (some exports)
    re.compile(r'^\[(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*(.+?):\s(.+)$'),
]

# System messages to skip
SYSTEM_KEYWORDS = [
    'Messages and calls are end-to-end encrypted',
    'created group',
    'added you',
    'changed the subject',
    'changed this group',
    'left',
    'removed',
    'changed the group description',
    'deleted this message',
    'This message was deleted',
    '<Media omitted>',
    'missed voice call',
    'missed video call',
]


def parse_whatsapp_chat(content):
    """
    Parse WhatsApp chat export text content.
    Returns a dict with contact names as keys and lists of messages as values.
    """
    lines = content.split('\n')
    messages_by_contact = {}
    current_message = None

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Try each pattern
        matched = False
        for pattern in PATTERNS:
            match = pattern.match(line)
            if match:
                date, time, sender, message = match.groups()

                # Skip system messages
                if any(kw.lower() in message.lower() for kw in SYSTEM_KEYWORDS):
                    matched = True
                    break

                sender = sender.strip()
                message = message.strip()

                if sender not in messages_by_contact:
                    messages_by_contact[sender] = []

                current_message = {
                    'date': date,
                    'time': time.strip(),
                    'sender': sender,
                    'message': message
                }
                messages_by_contact[sender].append(current_message)
                matched = True
                break

        # If no pattern matched, it might be a continuation of the previous message
        if not matched and current_message:
            current_message['message'] += '\n' + line

    return messages_by_contact


@parser_bp.route('/api/upload-chat', methods=['POST'])
def upload_chat():
    """Upload and parse a WhatsApp chat export file."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename:
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.endswith('.txt'):
        return jsonify({'error': 'Only .txt files are accepted'}), 400

    try:
        # Read and parse the file
        content = file.read().decode('utf-8', errors='ignore')
        messages_by_contact = parse_whatsapp_chat(content)

        if not messages_by_contact:
            return jsonify({'error': 'Could not parse any messages from the file. Make sure it is a WhatsApp chat export.'}), 400

        # Save each contact's messages
        results = []
        for contact_name, messages in messages_by_contact.items():
            save_chat_export(user_id, contact_name, messages)
            results.append({
                'contact_name': contact_name,
                'message_count': len(messages)
            })

        return jsonify({
            'message': 'Chat export parsed successfully',
            'contacts': results,
            'total_messages': sum(r['message_count'] for r in results)
        })

    except Exception as e:
        return jsonify({'error': f'Failed to parse file: {str(e)}'}), 500


@parser_bp.route('/api/chat-exports', methods=['GET'])
def list_exports():
    """List all chat exports for the current user."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    exports = get_all_chat_exports(user_id)
    return jsonify({'exports': exports})


@parser_bp.route('/api/chat-exports/<int:export_id>', methods=['GET'])
def get_export(export_id):
    """Get a specific chat export."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    export = get_chat_export(user_id)
    if not export:
        return jsonify({'error': 'Export not found'}), 404

    return jsonify({'export': export})
