"""
Authentication routes — register and login with phone number + password.
"""

from flask import Blueprint, request, jsonify, session


def get_current_user_id():
    """Get user ID from X-User-Id header (cross-origin) or session (same-origin)."""
    user_id = request.headers.get('X-User-Id')
    if user_id:
        try:
            return int(user_id)
        except (ValueError, TypeError):
            pass
    return session.get('user_id')
from werkzeug.security import generate_password_hash, check_password_hash
from models import create_user, get_user_by_phone, get_all_users, get_user_by_id

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/register', methods=['POST'])
def register():
    """Register a new user with phone number, display name, and password."""
    data = request.get_json()

    phone = data.get('phone_number', '').strip()
    name = data.get('display_name', '').strip()
    password = data.get('password', '')

    # Validation
    if not phone or not name or not password:
        return jsonify({'error': 'All fields are required'}), 400

    if len(phone) < 10:
        return jsonify({'error': 'Invalid phone number'}), 400

    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400

    if len(name) < 2:
        return jsonify({'error': 'Display name must be at least 2 characters'}), 400

    # Create user
    password_hash = generate_password_hash(password)
    user = create_user(phone, name, password_hash)

    if not user:
        return jsonify({'error': 'Phone number already registered'}), 409

    # Set session
    session['user_id'] = user['id']
    session['display_name'] = user['display_name']

    return jsonify({
        'message': 'Registration successful',
        'user': {
            'id': user['id'],
            'phone_number': user['phone_number'],
            'display_name': user['display_name']
        }
    }), 201


@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Login with phone number and password."""
    data = request.get_json()

    phone = data.get('phone_number', '').strip()
    password = data.get('password', '')

    if not phone or not password:
        return jsonify({'error': 'Phone number and password are required'}), 400

    user = get_user_by_phone(phone)

    if not user or not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid phone number or password'}), 401

    # Set session
    session['user_id'] = user['id']
    session['display_name'] = user['display_name']

    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': user['id'],
            'phone_number': user['phone_number'],
            'display_name': user['display_name']
        }
    })


@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    """Logout the current user."""
    session.clear()
    return jsonify({'message': 'Logged out successfully'})


@auth_bp.route('/api/me', methods=['GET'])
def get_current_user():
    """Get the currently logged-in user."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    user = get_user_by_id(user_id)
    if not user:
        session.clear()
        return jsonify({'error': 'User not found'}), 404

    response = jsonify({
        'user': {
            'id': user['id'],
            'phone_number': user['phone_number'],
            'display_name': user['display_name'],
            'ai_standin_enabled': bool(user['ai_standin_enabled'])
        }
    })
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return response


@auth_bp.route('/api/users', methods=['GET'])
def list_users():
    """List all registered users (for contact list)."""
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({'error': 'Not authenticated'}), 401

    users = get_all_users(exclude_id=user_id)
    return jsonify({'users': users})
