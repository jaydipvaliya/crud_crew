"""
Database models and helpers for the chat application.
Uses SQLAlchemy Core — supports PostgreSQL (production) and SQLite (local dev).
"""

import os
import json
from sqlalchemy import (
    create_engine, MetaData, Table, Column, Integer, Text, ForeignKey,
    Index, text, inspect
)
from sqlalchemy.exc import IntegrityError

# ─── Engine Setup ─────────────────────────────────────────────────────

def _build_engine():
    """
    Build the SQLAlchemy engine.
    - If DATABASE_URL is set (Render Postgres), use it.
      Render provides 'postgres://' but SQLAlchemy requires 'postgresql://'.
    - Otherwise fall back to local SQLite file.
    """
    url = os.getenv('DATABASE_URL')
    if url:
        # Render gives postgres:// but SQLAlchemy needs postgresql://
        if url.startswith('postgres://'):
            url = url.replace('postgres://', 'postgresql://', 1)
        return create_engine(url, pool_pre_ping=True)
    else:
        db_path = os.path.join(os.path.dirname(__file__), 'chatapp.db')
        return create_engine(
            f'sqlite:///{db_path}',
            connect_args={'check_same_thread': False},
        )


engine = _build_engine()
metadata = MetaData()

# ─── Table Definitions ────────────────────────────────────────────────

users = Table(
    'users', metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('phone_number', Text, unique=True, nullable=False),
    Column('display_name', Text, nullable=False),
    Column('password_hash', Text, nullable=False),
    Column('is_online', Integer, server_default=text("0")),
    Column('last_seen', Text),
    Column('ai_standin_enabled', Integer, server_default=text("0")),
    Column('created_at', Text, server_default=text("CURRENT_TIMESTAMP")),
)

messages = Table(
    'messages', metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('sender_id', Integer, ForeignKey('users.id'), nullable=False),
    Column('receiver_id', Integer, ForeignKey('users.id'), nullable=False),
    Column('content', Text, nullable=False),
    Column('timestamp', Text, server_default=text("CURRENT_TIMESTAMP")),
    Column('is_read', Integer, server_default=text("0")),
    Column('is_ai_generated', Integer, server_default=text("0")),
)

chat_exports = Table(
    'chat_exports', metadata,
    Column('id', Integer, primary_key=True, autoincrement=True),
    Column('user_id', Integer, ForeignKey('users.id'), nullable=False),
    Column('contact_name', Text, nullable=False),
    Column('parsed_messages', Text, nullable=False),
    Column('message_count', Integer, server_default=text("0")),
    Column('uploaded_at', Text, server_default=text("CURRENT_TIMESTAMP")),
)


def init_db():
    """Initialize database tables and indexes."""
    metadata.create_all(engine)

    # Create indexes if they don't already exist
    insp = inspect(engine)
    existing = {idx['name'] for idx in insp.get_indexes('messages')}
    existing |= {idx['name'] for idx in insp.get_indexes('users')}

    with engine.begin() as conn:
        if 'idx_messages_sender' not in existing:
            Index('idx_messages_sender', messages.c.sender_id).create(conn)
        if 'idx_messages_receiver' not in existing:
            Index('idx_messages_receiver', messages.c.receiver_id).create(conn)
        if 'idx_messages_timestamp' not in existing:
            Index('idx_messages_timestamp', messages.c.timestamp).create(conn)
        if 'idx_users_phone' not in existing:
            Index('idx_users_phone', users.c.phone_number).create(conn)

    print("[OK] Database initialized successfully")


# ─── User Operations ─────────────────────────────────────────────────

def create_user(phone_number, display_name, password_hash):
    """Create a new user. Returns user dict or None if phone exists."""
    try:
        with engine.begin() as conn:
            conn.execute(
                users.insert().values(
                    phone_number=phone_number,
                    display_name=display_name,
                    password_hash=password_hash,
                )
            )
            row = conn.execute(
                users.select().where(users.c.phone_number == phone_number)
            ).mappings().fetchone()
            return {
                'id': row['id'],
                'phone_number': row['phone_number'],
                'display_name': row['display_name'],
            }
    except IntegrityError:
        return None


def get_user_by_phone(phone_number):
    """Get user by phone number."""
    with engine.connect() as conn:
        row = conn.execute(
            users.select().where(users.c.phone_number == phone_number)
        ).mappings().fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id):
    """Get user by ID."""
    with engine.connect() as conn:
        row = conn.execute(
            users.select().where(users.c.id == user_id)
        ).mappings().fetchone()
        return dict(row) if row else None


def get_all_users(exclude_id=None):
    """Get all users, optionally excluding one (the current user)."""
    cols = [
        users.c.id, users.c.phone_number, users.c.display_name,
        users.c.is_online, users.c.last_seen, users.c.ai_standin_enabled,
    ]
    stmt = users.select().with_only_columns(*cols)
    if exclude_id:
        stmt = stmt.where(users.c.id != exclude_id)

    with engine.connect() as conn:
        rows = conn.execute(stmt).mappings().fetchall()
        return [dict(r) for r in rows]


def set_user_online(user_id, online=True):
    """Update user's online status."""
    with engine.begin() as conn:
        if online:
            conn.execute(
                users.update().where(users.c.id == user_id).values(is_online=1)
            )
        else:
            conn.execute(
                users.update().where(users.c.id == user_id).values(
                    is_online=0,
                    last_seen=text("CURRENT_TIMESTAMP"),
                )
            )


def toggle_ai_standin(user_id, enabled):
    """Enable or disable AI stand-in for a user."""
    with engine.begin() as conn:
        conn.execute(
            users.update().where(users.c.id == user_id).values(
                ai_standin_enabled=1 if enabled else 0
            )
        )


# ─── Message Operations ──────────────────────────────────────────────

def save_message(sender_id, receiver_id, content, is_ai_generated=False):
    """Save a message and return it as a dict."""
    with engine.begin() as conn:
        result = conn.execute(
            messages.insert().values(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=content,
                is_ai_generated=1 if is_ai_generated else 0,
            )
        )
        row = conn.execute(
            messages.select().where(messages.c.id == result.inserted_primary_key[0])
        ).mappings().fetchone()
        return dict(row)


def get_chat_history(user1_id, user2_id, limit=50, offset=0):
    """Get chat history between two users."""
    stmt = (
        text("""
            SELECT m.*, s.display_name AS sender_name, r.display_name AS receiver_name
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            JOIN users r ON m.receiver_id = r.id
            WHERE (m.sender_id = :u1 AND m.receiver_id = :u2)
               OR (m.sender_id = :u2 AND m.receiver_id = :u1)
            ORDER BY m.timestamp ASC
            LIMIT :lim OFFSET :off
        """)
    )
    with engine.connect() as conn:
        rows = conn.execute(
            stmt, {'u1': user1_id, 'u2': user2_id, 'lim': limit, 'off': offset}
        ).mappings().fetchall()
        return [dict(r) for r in rows]


def mark_messages_read(sender_id, receiver_id):
    """Mark all messages from sender to receiver as read."""
    with engine.begin() as conn:
        conn.execute(
            messages.update()
            .where(messages.c.sender_id == sender_id)
            .where(messages.c.receiver_id == receiver_id)
            .where(messages.c.is_read == 0)
            .values(is_read=1)
        )


def get_unread_count(sender_id, receiver_id):
    """Get count of unread messages from sender to receiver."""
    stmt = text(
        "SELECT COUNT(*) AS count FROM messages "
        "WHERE sender_id = :sid AND receiver_id = :rid AND is_read = 0"
    )
    with engine.connect() as conn:
        row = conn.execute(
            stmt, {'sid': sender_id, 'rid': receiver_id}
        ).mappings().fetchone()
        return row['count']


# ─── Chat Export Operations ───────────────────────────────────────────

def save_chat_export(user_id, contact_name, parsed_messages):
    """Save parsed WhatsApp chat export."""
    with engine.begin() as conn:
        # Delete existing export for same user-contact pair
        conn.execute(
            chat_exports.delete()
            .where(chat_exports.c.user_id == user_id)
            .where(chat_exports.c.contact_name == contact_name)
        )
        conn.execute(
            chat_exports.insert().values(
                user_id=user_id,
                contact_name=contact_name,
                parsed_messages=json.dumps(parsed_messages),
                message_count=len(parsed_messages),
            )
        )


def get_chat_export(user_id, contact_name=None):
    """Get chat export for a user, optionally filtered by contact."""
    with engine.connect() as conn:
        if contact_name:
            row = conn.execute(
                chat_exports.select()
                .where(chat_exports.c.user_id == user_id)
                .where(chat_exports.c.contact_name == contact_name)
            ).mappings().fetchone()
        else:
            row = conn.execute(
                chat_exports.select()
                .where(chat_exports.c.user_id == user_id)
                .order_by(chat_exports.c.uploaded_at.desc())
                .limit(1)
            ).mappings().fetchone()

        if row:
            result = dict(row)
            result['parsed_messages'] = json.loads(result['parsed_messages'])
            return result
        return None


def get_all_chat_exports(user_id):
    """Get all chat exports for a user."""
    cols = [
        chat_exports.c.id, chat_exports.c.user_id,
        chat_exports.c.contact_name, chat_exports.c.message_count,
        chat_exports.c.uploaded_at,
    ]
    with engine.connect() as conn:
        rows = conn.execute(
            chat_exports.select().with_only_columns(*cols)
            .where(chat_exports.c.user_id == user_id)
        ).mappings().fetchall()
        return [dict(r) for r in rows]
