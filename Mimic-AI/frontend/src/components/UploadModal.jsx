import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { apiFetch } from '../api';

export function UploadModal({ isOpen, onClose, addToast }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const selectFile = () => {
    fileInputRef.current.click();
  };

  const processFile = async (file) => {
    if (!file.name.endsWith('.txt')) {
      addToast('Invalid File', 'Please upload a .txt WhatsApp chat export.', '❌');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    setResult(null);

    try {
      const response = await apiFetch('/api/upload-chat', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        addToast('Upload Failed', data.error || 'Failed to upload chat.', '❌');
        setIsUploading(false);
        return;
      }

      setResult(data);
      addToast('Success', `Parsed ${data.total_messages} messages successfully!`, '✅');
    } catch (err) {
      console.error(err);
      addToast('Upload Error', 'Failed to upload file to the server.', '❌');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>📤 Upload WhatsApp Chat</h3>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <p>
          Export your WhatsApp chat (without media) and upload the <strong>.txt</strong> file here. 
          This feeds the AI Stand-In with style and tone context to mimic your friend when they are offline.
        </p>

        <div
          className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
          onClick={selectFile}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt"
            style={{ display: 'none' }}
          />
          {isUploading ? (
            <div className="spinner" style={{ marginBottom: '12px' }}></div>
          ) : (
            <Upload size={36} className="drop-icon" style={{ margin: '0 auto 12px' }} />
          )}
          <div className="drop-text">
            {isUploading ? 'Uploading & parsing chat...' : (
              <>
                <strong>Click to browse</strong> or drag and drop<br />
                WhatsApp chat export (.txt)
              </>
            )}
          </div>
        </div>

        {result && (
          <div className="upload-stats">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle size={16} /> Upload Completed
            </h4>
            <div style={{ marginTop: '8px' }}>
              <div>Total messages parsed: <strong>{result.total_messages}</strong></div>
              <div style={{ marginTop: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                {result.contacts.map((c, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                    • {c.contact_name}: {c.message_count} messages
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
