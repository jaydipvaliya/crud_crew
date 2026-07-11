import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Bot, Shield, Zap, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="logo">
          <MessageSquare className="logo-icon" size={24} />
          <span>ChatApp</span>
        </div>
        <div className="nav-actions">
          <Link to="/login" className="btn-secondary">Log In</Link>
          <Link to="/login?register=true" className="btn-primary">Get Started</Link>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-tagline">
            <Sparkles size={14} /> Next-Gen Messaging App
          </div>
          <h1 className="hero-title">
            Never Miss a Message. <span>AI Has Your Back.</span>
          </h1>
          <p className="hero-desc">
            ChatApp lets you message friends in real-time. When you go offline, our custom AI chatbot auto-replies in your tone, style, and vocabulary — powered by your WhatsApp export files and Groq API.
          </p>
          <div className="hero-buttons">
            <Link to="/login?register=true" className="btn-primary">Register Free</Link>
            <Link to="/login" className="btn-secondary">Launch App</Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="mockup-container">
            <div className="mockup-header">
              <span className="mockup-dot r"></span>
              <span className="mockup-dot y"></span>
              <span className="mockup-dot g"></span>
            </div>
            <div className="mockup-chats">
              <div className="mockup-msg received">Hey, are you free for a call?</div>
              <div className="mockup-msg sent">Ah, working right now. Talk later!</div>
              <div className="mockup-msg received" style={{ opacity: 0.7 }}>[User B goes offline]</div>
              <div className="mockup-msg received">Need the files by tonight though...</div>
              <div className="mockup-msg ai">Sure, I will send them over as soon as I get home! 🤖</div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="features-section">
        <div className="feature-card">
          <Zap className="feature-icon" />
          <h3>Real-Time Chatting</h3>
          <p>Instant, bi-directional message delivery with presence tracking, online status dots, and live typing indicators.</p>
        </div>
        <div className="feature-card">
          <Bot className="feature-icon" />
          <h3>AI Stand-In Clone</h3>
          <p>Trains on your uploaded WhatsApp exports to duplicate your vocabulary, slang, language code-switching, and reply styles.</p>
        </div>
        <div className="feature-card">
          <Shield className="feature-icon" />
          <h3>SQLite Local Database</h3>
          <p>Secure, clean, zero-configuration local database storage ensuring your conversations remain entirely private.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} ChatApp Inc. Designed for premium chat mimicry.</p>
      </footer>
    </div>
  );
}
