import React from 'react';
import { Search } from 'lucide-react';

export function ContactList({ contacts, activeChat, onSelectContact, search, setSearch }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getLastSeenText = (lastSeen) => {
    if (!lastSeen) return 'offline';
    const date = new Date(lastSeen + 'Z');
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'seen just now';
    if (diffMin < 60) return `seen ${diffMin}m ago`;
    if (diffMin < 1440) return `seen ${Math.floor(diffMin / 60)}h ago`;
    return `seen ${date.toLocaleDateString()}`;
  };

  const filteredContacts = contacts.filter((c) =>
    c.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Search Bar */}
      <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px'
        }}>
          <Search size={18} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              width: '100%',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: '0.9rem'
            }}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="contacts-scroll">
        {filteredContacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            No contacts found.<br />Ask your friend to register!
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isActive = activeChat && activeChat.id === contact.id;
            const initials = getInitials(contact.display_name);

            return (
              <div
                key={contact.id}
                className={`contact-card ${isActive ? 'active' : ''}`}
                onClick={() => onSelectContact(contact)}
              >
                <div className="avatar-wrapper">
                  <div className="contact-avatar">{initials}</div>
                  <div className={`status-dot ${contact.is_online ? 'online' : ''}`}></div>
                </div>
                <div className="contact-info">
                  <div className="contact-name-row">
                    <span className="contact-name">
                      {contact.display_name}
                      {contact.ai_standin_enabled === 1 && (
                        <span className="ai-badge">🤖 AI</span>
                      )}
                    </span>
                    {contact.unread_count > 0 && (
                      <span className="unread-badge">{contact.unread_count}</span>
                    )}
                  </div>
                  <div className="contact-subtext">
                    {contact.is_online ? '🟢 Online' : `⚫ ${getLastSeenText(contact.last_seen)}`}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
