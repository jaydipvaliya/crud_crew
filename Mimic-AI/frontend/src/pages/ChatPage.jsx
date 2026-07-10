import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { LogOut, UploadCloud, MessageSquare } from 'lucide-react';
import { ContactList } from '../components/ContactList';
import { ChatWindow } from '../components/ChatWindow';
import { UploadModal } from '../components/UploadModal';
import { ToastContainer } from '../components/Toast';
import { apiFetch } from '../api';

export default function ChatPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState(false);
  const [aiToggleEnabled, setAiToggleEnabled] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState([]);

  // Refs to hold mutable values without causing re-renders or effect re-runs
  const socketRef = useRef(null);
  const activeChatRef = useRef(null);
  const currentUserRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  // Toast notifications helpers
  const addToast = useCallback((title, desc, icon = '💬') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, title, desc, icon }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.35);
    } catch (e) { /* audio not available */ }
  }, []);

  // Auth initialization — runs once on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await apiFetch('/api/me');
        if (!response.ok) {
          navigate('/login');
          return;
        }
        const data = await response.json();
        setCurrentUser(data.user);
        setAiToggleEnabled(data.user.ai_standin_enabled);
      } catch (err) {
        console.error(err);
        navigate('/login');
      }
    }
    loadUser();
  }, [navigate]);

  // Socket.IO initialization — runs ONCE when currentUser is loaded
  // Uses refs for activeChat so it never re-creates the socket
  useEffect(() => {
    if (!currentUser) return;

    const sock = io(import.meta.env.VITE_API_URL || '', {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        user_id: currentUser.id
      },
    });

    socketRef.current = sock;

    sock.on('connect', () => {
      console.log('Connected to socket server');
      sock.emit('get_contacts');
    });

    sock.on('disconnect', (reason) => {
      // Only show toast for unexpected disconnects, not intentional ones
      if (reason === 'io server disconnect' || reason === 'transport close') {
        addToast('Connection Lost', 'Reconnecting to messaging server...', '⚠️');
      }
    });

    sock.on('reconnect', () => {
      addToast('Reconnected', 'Connection successfully restored!', '✅');
      sock.emit('get_contacts');
    });

    sock.on('contacts_list', (data) => {
      setContacts(data.contacts);
    });

    sock.on('user_status', (data) => {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === data.user_id
            ? { ...c, is_online: data.is_online ? 1 : 0, last_seen: data.last_seen }
            : c
        )
      );

      setActiveChat((prev) => {
        if (prev && prev.id === data.user_id) {
          return { ...prev, is_online: data.is_online ? 1 : 0 };
        }
        return prev;
      });
    });

    sock.on('chat_history', (data) => {
      // Use ref to read current activeChat without being in the dep array
      const current = activeChatRef.current;
      if (current && data.other_user_id === current.id) {
        setMessages(data.messages);
      }
    });

    sock.on('new_message', (msg) => {
      const active = activeChatRef.current;
      const user = currentUserRef.current;

      if (
        active && user &&
        ((msg.sender_id === active.id && msg.receiver_id === user.id) ||
          (msg.sender_id === user.id && msg.receiver_id === active.id))
      ) {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }

      // Notify of incoming messages from non-active chats
      if (user && msg.sender_id !== user.id && (!active || active.id !== msg.sender_id)) {
        addToast(msg.sender_name, msg.content, '💬');
        playNotificationSound();
      }

      sock.emit('get_contacts');
    });

    sock.on('typing_indicator', (data) => {
      const active = activeChatRef.current;
      if (active && data.user_id === active.id) {
        setTypingStatus(data.is_typing);
      }
    });

    sock.on('ai_standin_status', (data) => {
      setContacts((prev) =>
        prev.map((c) =>
          c.id === data.user_id ? { ...c, ai_standin_enabled: data.enabled ? 1 : 0 } : c
        )
      );
    });

    // Cleanup only when component unmounts (or currentUser changes, which shouldn't happen)
    return () => {
      sock.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Actions
  const handleSelectContact = (contact) => {
    const sock = socketRef.current;
    if (!sock) return;

    if (activeChatRef.current) {
      sock.emit('leave_chat', { other_user_id: activeChatRef.current.id });
    }
    setActiveChat(contact);
    setTypingStatus(false);
    setMessages([]);
    sock.emit('join_chat', { other_user_id: contact.id });
  };

  const handleSendMessage = (content) => {
    if (!activeChatRef.current || !socketRef.current) return;
    socketRef.current.emit('send_message', {
      receiver_id: activeChatRef.current.id,
      content,
    });
  };

  const handleTyping = (isTyping) => {
    if (!activeChatRef.current || !socketRef.current) return;
    socketRef.current.emit('typing', {
      receiver_id: activeChatRef.current.id,
      is_typing: isTyping,
    });
  };

  const handleToggleAi = (checked) => {
    setAiToggleEnabled(checked);
    if (socketRef.current) {
      socketRef.current.emit('toggle_ai_standin', { enabled: checked });
    }
  };

  const handleLogout = async () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    try {
      await apiFetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('chatapp_user');
    navigate('/');
  };

  const getInitials = (name) => {
    return name
      ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
      : 'U';
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <aside className={`sidebar ${activeChat ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="user-profile">
            <div className="user-avatar">{getInitials(currentUser?.display_name)}</div>
            <span className="user-name">{currentUser?.display_name || 'User'}</span>
          </div>
          <div className="sidebar-actions">
            <button className="icon-btn" onClick={() => setIsUploadOpen(true)} title="Upload WhatsApp Chat">
              <UploadCloud size={20} />
            </button>
            <button className="icon-btn" onClick={handleLogout} title="Log Out">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <ContactList
          contacts={contacts}
          activeChat={activeChat}
          onSelectContact={handleSelectContact}
          search={search}
          setSearch={setSearch}
        />
      </aside>

      {/* Main chat window */}
      <main className="chat-main" style={{ height: '100%', flex: 1 }}>
        <ChatWindow
          activeChat={activeChat}
          messages={messages}
          typingStatus={typingStatus}
          aiToggleEnabled={aiToggleEnabled}
          onToggleAi={handleToggleAi}
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          onBack={() => setActiveChat(null)}
        />
      </main>

      {/* Modal and notifications */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        addToast={addToast}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
