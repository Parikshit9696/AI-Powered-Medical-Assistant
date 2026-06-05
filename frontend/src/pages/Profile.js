import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || '',
    bloodGroup: user?.bloodGroup || '',
  });
  const [allergies, setAllergies] = useState(user?.allergies || []);
  const [conditions, setConditions] = useState(user?.conditions || []);
  const [medications, setMedications] = useState(user?.medications || []);
  const [newItems, setNewItems] = useState({ allergy: '', condition: '', medication: '' });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [changingPw, setChangingPw] = useState(false);

  const handleFormChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const addItem = (type) => {
    const val = newItems[type].trim();
    if (!val) return;
    const map = { allergy: [allergies, setAllergies], condition: [conditions, setConditions], medication: [medications, setMedications] };
    const [list, setList] = map[type];
    if (list.includes(val)) return toast.error('Already added');
    setList(prev => [...prev, val]);
    setNewItems(p => ({ ...p, [type]: '' }));
  };

  const removeItem = (type, val) => {
    const map = { allergy: setAllergies, condition: setConditions, medication: setMedications };
    map[type](prev => prev.filter(i => i !== val));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put('/api/user/profile', {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        allergies,
        conditions,
        medications
      });
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwords.current || !passwords.new) return toast.error('Fill in all fields');
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.new.length < 6) return toast.error('Password must be 6+ characters');
    setChangingPw(true);
    try {
      await axios.put('/api/user/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success('Password changed!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to change password');
    } finally { setChangingPw(false); }
  };

  const TagList = ({ label, type, items }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="tag-list">
        {items.map(item => (
          <span key={item} className="tag">
            {item}
            <button onClick={() => removeItem(type, item)}>✕</button>
          </span>
        ))}
        {items.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>None added</span>}
      </div>
      <div className="add-tag-row">
        <input
          className="form-input"
          placeholder={`Add ${label.toLowerCase()}`}
          value={newItems[type]}
          onChange={e => setNewItems(p => ({ ...p, [type]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && addItem(type)}
          style={{ flex: 1 }}
        />
        <button className="btn btn-ghost btn-sm" onClick={() => addItem(type)}>Add</button>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">👤 Medical Profile</h1>
        <p className="page-subtitle">Your profile helps the AI provide personalized health advice</p>
      </div>

      <div className="page-body">
        <div className="profile-grid">
          {/* Left: Avatar & account */}
          <div>
            <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 700, color: 'white',
                margin: '0 auto 16px'
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</div>
              <div style={{ marginTop: 16, padding: '10px', background: 'var(--bg-secondary)', borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                Blood Group: <strong style={{ color: 'var(--accent-blue)' }}>{user?.bloodGroup || 'Not set'}</strong>
              </div>
            </div>

            {/* Change Password */}
            <div className="card">
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>🔒 Change Password</h4>
              {['current', 'new', 'confirm'].map(k => (
                <div className="form-group" key={k}>
                  <label className="form-label">{k === 'current' ? 'Current' : k === 'new' ? 'New' : 'Confirm New'} Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={passwords[k]}
                    onChange={e => setPasswords(p => ({ ...p, [k]: e.target.value }))}
                  />
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={changePassword} disabled={changingPw}>
                {changingPw ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>

          {/* Right: Medical info */}
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>Medical Information</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input name="name" className="form-input" value={form.name} onChange={handleFormChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Age</label>
                <input name="age" type="number" className="form-input" value={form.age} onChange={handleFormChange} min="0" max="150" />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select name="gender" className="form-input" value={form.gender} onChange={handleFormChange}
                  style={{ background: 'var(--bg-secondary)' }}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <select name="bloodGroup" className="form-input" value={form.bloodGroup} onChange={handleFormChange}
                  style={{ background: 'var(--bg-secondary)' }}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            <TagList label="Allergies" type="allergy" items={allergies} />
            <TagList label="Existing Conditions" type="condition" items={conditions} />
            <TagList label="Current Medications" type="medication" items={medications} />

            <div className="emergency-banner" style={{ marginBottom: 16 }}>
              ℹ️ This information is shared with the AI to provide personalized advice. It is stored securely and never shared with third parties.
            </div>

            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
