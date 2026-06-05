import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const COMMON_SYMPTOMS = [
  'Headache', 'Fever', 'Fatigue', 'Nausea', 'Cough',
  'Shortness of breath', 'Chest pain', 'Dizziness',
  'Back pain', 'Joint pain', 'Rash', 'Sore throat'
];

const MOODS = [
  { value: 'great', emoji: '😄', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'bad', emoji: '😔', label: 'Bad' },
  { value: 'terrible', emoji: '😞', label: 'Terrible' },
];

export default function SymptomTracker() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get('/api/symptoms/logs');
      setLogs(data.logs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addSymptom = (name) => {
    const n = name || symptomInput.trim();
    if (!n) return;
    if (symptoms.find(s => s.name.toLowerCase() === n.toLowerCase())) {
      return toast.error('Symptom already added');
    }
    setSymptoms(prev => [...prev, { name: n, severity, duration }]);
    setSymptomInput('');
    setSeverity(5);
    setDuration('');
  };

  const removeSymptom = (name) => {
    setSymptoms(prev => prev.filter(s => s.name !== name));
  };

  const handleSubmit = async () => {
    if (symptoms.length === 0) return toast.error('Add at least one symptom');
    setSubmitting(true);
    try {
      const { data } = await axios.post('/api/symptoms/log', { symptoms, notes, mood });
      setLogs(prev => [data.log, ...prev]);
      setSymptoms([]);
      setNotes('');
      setMood('');
      toast.success('Symptoms logged and analyzed!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to log symptoms');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLog = async (id) => {
    try {
      await axios.delete(`/api/symptoms/log/${id}`);
      setLogs(prev => prev.filter(l => l._id !== id));
      toast.success('Log deleted');
    } catch (e) { toast.error('Failed to delete'); }
  };

  const getSeverityClass = (sev) => {
    if (sev <= 3) return 'low';
    if (sev <= 6) return 'medium';
    return 'high';
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">📋 Symptom Tracker</h1>
        <p className="page-subtitle">Log and monitor your symptoms with AI-powered analysis</p>
      </div>

      <div className="page-body">
        <div className="symptoms-grid">
          {/* Log Form */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 18, color: 'var(--text-primary)' }}>Log Symptoms</h3>

            {/* Quick add */}
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Common Symptoms</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {COMMON_SYMPTOMS.map(s => (
                  <button
                    key={s}
                    className="quick-prompt-btn"
                    onClick={() => addSymptom(s)}
                    style={{ fontSize: 12, padding: '5px 10px' }}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* Custom input */}
            <div className="form-group">
              <label className="form-label">Custom Symptom</label>
              <div className="symptom-input-row">
                <input
                  className="form-input"
                  placeholder="e.g. Sharp pain in left arm"
                  value={symptomInput}
                  onChange={e => setSymptomInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSymptom()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-ghost btn-sm" onClick={() => addSymptom()}>Add</button>
              </div>
            </div>

            {/* Severity */}
            <div className="form-group">
              <label className="form-label">Severity for next symptom: <strong style={{ color: 'var(--accent-blue)' }}>{severity}/10</strong></label>
              <input
                type="range"
                min="1" max="10"
                value={severity}
                onChange={e => setSeverity(Number(e.target.value))}
                className="severity-slider"
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Mild (1)</span><span>Moderate (5)</span><span>Severe (10)</span>
              </div>
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input
                className="form-input"
                placeholder="e.g. 2 hours, 3 days"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>

            {/* Selected symptoms */}
            {symptoms.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Added Symptoms</label>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {symptoms.map(s => (
                    <div key={s.name} className="symptom-tag">
                      {s.name}
                      <span className={`severity-badge ${getSeverityClass(s.severity)}`} style={{ marginLeft: 4 }}>
                        {s.severity}/10
                      </span>
                      <button onClick={() => removeSymptom(s.name)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mood */}
            <div className="form-group">
              <label className="form-label">How are you feeling overall?</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {MOODS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    title={m.label}
                    style={{
                      background: mood === m.value ? 'rgba(59,130,246,0.15)' : 'var(--bg-secondary)',
                      border: `1px solid ${mood === m.value ? 'var(--accent-blue)' : 'var(--border)'}`,
                      borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 20
                    }}
                  >{m.emoji}</button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Any other details (medications taken, triggers, etc.)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || symptoms.length === 0}>
              {submitting ? '🔄 Analyzing...' : '📊 Log & Analyze'}
            </button>
          </div>

          {/* Logs history */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>
              Symptom History ({logs.length})
            </h3>

            {loading ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading...</p>
            ) : logs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <p>No symptoms logged yet.<br/>Log your first entry to start tracking.</p>
              </div>
            ) : logs.map(log => (
              <div key={log._id} className="log-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div className="log-date">{format(new Date(log.date), 'MMM d, yyyy · h:mm a')}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {log.mood && <span title={log.mood} style={{ fontSize: 16 }}>
                      {MOODS.find(m => m.value === log.mood)?.emoji}
                    </span>}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteLog(log._id)}
                      style={{ padding: '3px 8px', fontSize: 11 }}
                    >Delete</button>
                  </div>
                </div>

                <div className="log-symptoms">
                  {log.symptoms.map(s => (
                    <span key={s.name} className={`severity-badge ${getSeverityClass(s.severity)}`}>
                      {s.name} · {s.severity}/10
                    </span>
                  ))}
                </div>

                {log.notes && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>{log.notes}</p>
                )}

                {log.aiAnalysis && (
                  <div className="ai-analysis-box">
                    <div className="ai-analysis-label">⚕️ AI Analysis</div>
                    {log.aiAnalysis}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
