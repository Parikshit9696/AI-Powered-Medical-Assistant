import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const HEALTH_TIPS = [
  "💧 Stay hydrated — aim for 8 glasses of water daily.",
  "🚶 A 30-minute walk each day reduces cardiovascular risk by 35%.",
  "😴 Adults need 7–9 hours of sleep for optimal health.",
  "🥦 Eating 5 servings of fruits and vegetables daily boosts immunity.",
  "🧘 Deep breathing for 5 minutes reduces cortisol levels significantly.",
  "🩺 Regular checkups catch 80% of preventable conditions early.",
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tip] = useState(HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, logsRes] = await Promise.all([
          axios.get('/api/chat/sessions'),
          axios.get('/api/symptoms/logs?limit=5')
        ]);
        setSessions(sessRes.data.sessions);
        setLogs(logsRes.data.logs);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const startNewChat = async () => {
    try {
      const { data } = await axios.post('/api/chat/session', { title: 'New Consultation' });
      navigate(`/chat/${data.session._id}`);
    } catch (e) { navigate('/chat'); }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="page-subtitle">Here's your health overview for {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      <div className="page-body">
        {/* Health Tip */}
        <div style={{
          background: 'rgba(6,182,212,0.06)',
          border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          marginBottom: 24,
          fontSize: 14,
          color: 'var(--text-secondary)'
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', display: 'block', marginBottom: 4 }}>Daily Health Tip</span>
          {tip}
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">🩺</div>
            <div>
              <div className="stat-value">{sessions.length}</div>
              <div className="stat-label">Consultations</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">📋</div>
            <div>
              <div className="stat-value">{logs.length}</div>
              <div className="stat-label">Symptom Logs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">🔬</div>
            <div>
              <div className="stat-value">{user?.conditions?.length || 0}</div>
              <div className="stat-label">Conditions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">💊</div>
            <div>
              <div className="stat-value">{user?.medications?.length || 0}</div>
              <div className="stat-label">Medications</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Quick Actions */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" onClick={startNewChat}>
                🩺 Start AI Consultation
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/symptoms')}>
                📋 Log Symptoms
              </button>
              <button className="btn btn-ghost" onClick={() => navigate('/profile')}>
                👤 Update Medical Profile
              </button>
            </div>
          </div>

          {/* Recent Consultations */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Recent Consultations</h3>
            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
            ) : sessions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No consultations yet. Start your first one!</p>
            ) : (
              sessions.slice(0, 4).map(s => (
                <div
                  key={s._id}
                  onClick={() => navigate(`/chat/${s._id}`)}
                  style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {s.messageCount} messages · {format(new Date(s.updatedAt), 'MMM d, h:mm a')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Emergency Info */}
        <div className="emergency-banner" style={{ marginTop: 20 }}>
          🚨 <strong>Emergency?</strong> Call 112 (India) or your local emergency number immediately. Do not rely on AI during emergencies.
        </div>
      </div>
    </>
  );
}
