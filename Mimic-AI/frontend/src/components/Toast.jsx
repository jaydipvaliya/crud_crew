import React, { useEffect } from 'react';

export function Toast({ title, desc, icon = '💬', onClose, duration = 4000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast">
      <span className="toast-icon">{icon}</span>
      <div className="toast-body">
        <div className="toast-title">{title}</div>
        <div className="toast-desc">{desc}</div>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          title={t.title}
          desc={t.desc}
          icon={t.icon}
          onClose={() => removeToast(t.id)}
        />
      ))}
    </div>
  );
}
