import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const QUICK_PROMPTS = [
  "I have a headache and fever",
  "What are symptoms of diabetes?",
  "How to manage high blood pressure?",
  "I'm feeling anxious and stressed",
  "Tips for better sleep",
  "What vitamins should I take daily?"
];

export default function Chat() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    if (sessionId) loadSession(sessionId);
    else { setCurrentSession(null); setMessages([]); }
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
    try {
      const { data } = await axios.get('/api/chat/sessions');
      setSessions(data.sessions);
    } catch (e) { console.error(e); }
    finally { setLoadingSessions(false); }
  };

  const loadSession = async (id) => {
    try {
      const { data } = await axios.get(`/api/chat/session/${id}`);
      setCurrentSession(data.session);
      setMessages(data.session.messages);
    } catch (e) {
      toast.error('Could not load session');
      navigate('/chat');
    }
  };

  const createSession = async () => {
    try {
      const { data } = await axios.post('/api/chat/session', { title: 'New Consultation' });
      setSessions(prev => [{ ...data.session, messageCount: 0 }, ...prev]);
      navigate(`/chat/${data.session._id}`);
    } catch (e) { toast.error('Failed to create session'); }
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || sending) return;
    if (!currentSession) { toast.error('Please start a new consultation'); return; }

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg, timestamp: new Date() }]);
    setSending(true);

    try {
      const userProfile = {
        age: user?.age,
        gender: user?.gender,
        bloodGroup: user?.bloodGroup,
        allergies: user?.allergies,
        conditions: user?.conditions,
        medications: user?.medications
      };

      const { data } = await axios.post('/api/chat/message', {
        sessionId: currentSession._id,
        message: msg,
        userProfile
      });

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, timestamp: new Date() }]);
      loadSessions(); // refresh sidebar
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to get AI response');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`/api/chat/session/${id}`);
      setSessions(prev => prev.filter(s => s._id !== id));
      if (sessionId === id) navigate('/chat');
      toast.success('Consultation removed');
    } catch (e) { toast.error('Failed to delete'); }
  };

  return (
    <div className="chat-layout">
      {/* Chat Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={createSession}>
            + New Consultation
          </button>
        </div>
        <div className="chat-sessions">
          {loadingSessions ? (
            <p style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>
          ) : sessions.length === 0 ? (
            <p style={{ padding: 12, color: 'var(--text-muted)', fontSize: 13 }}>No consultations yet</p>
          ) : sessions.map(s => (
            <div
              key={s._id}
              className={`session-item ${sessionId === s._id ? 'active' : ''}`}
              onClick={() => navigate(`/chat/${s._id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="session-title" style={{ flex: 1 }}>{s.title}</div>
                <button
                  onClick={(e) => deleteSession(e, s._id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, padding: '0 0 0 6px', flexShrink: 0 }}
                  title="Delete"
                >✕</button>
              </div>
              <div className="session-meta">
                <span>{s.messageCount} msgs</span>
                <span>{format(new Date(s.updatedAt), 'MMM d')}</span>
              </div>
              {s.lastMessage && <div className="session-preview">{s.lastMessage}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Main */}
      <div className="chat-main">
        <div className="chat-header">
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentSession ? currentSession.title : '🩺 AI Medical Consultation'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Powered by Claude AI · Not a replacement for professional care
            </div>
          </div>
          {currentSession && (
            <span className="category-badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(59,130,246,0.2)' }}>
              {currentSession.category}
            </span>
          )}
        </div>

        {/* Messages */}
        {!currentSession ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">🩺</div>
            <h3>Start a new consultation</h3>
            <p>Ask our AI about symptoms, medications, health tips, or general medical questions. Your profile context is automatically included for personalized advice.</p>
            <div className="quick-prompts">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  className="quick-prompt-btn"
                  onClick={async () => {
                    const { data } = await axios.post('/api/chat/session', { title: p });
                    setSessions(prev => [{ ...data.session, messageCount: 0 }, ...prev]);
                    navigate(`/chat/${data.session._id}`);
                    setTimeout(() => sendMessage(p), 300);
                  }}
                >{p}</button>
              ))}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-chat-icon">💬</div>
            <h3>How can I help you today?</h3>
            <p>Describe your symptoms, ask about medications, or seek general health guidance.</p>
            <div className="quick-prompts">
              {QUICK_PROMPTS.map(p => (
                <button key={p} className="quick-prompt-btn" onClick={() => sendMessage(p)}>{p}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message-wrapper ${msg.role}`}>
                <div className={`message-avatar ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                  {msg.role === 'assistant' ? '⚕️' : user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={`message-bubble ${msg.role === 'assistant' ? 'ai' : 'user'}`}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    ) : msg.content}
                  </div>
                  <div className="message-time">
                    {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : ''}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="message-wrapper">
                <div className="message-avatar ai">⚕️</div>
                <div className="typing-indicator">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        {currentSession && (
          <div className="chat-input-area">
            <div className="chat-input-disclaimer">
              ⚠️ This AI provides general health information only. Always consult a qualified healthcare professional for medical decisions.
            </div>
            <div className="chat-input-row">
              <textarea
                className="chat-textarea"
                placeholder="Describe your symptoms or ask a health question..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={sending}
              />
              <button className="send-btn" onClick={() => sendMessage()} disabled={sending || !input.trim()} title="Send">
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
