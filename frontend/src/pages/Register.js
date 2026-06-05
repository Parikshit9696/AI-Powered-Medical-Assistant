import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to MedAssist AI');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow blue" />
      <div className="auth-bg-glow cyan" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚕️</div>
          <span className="auth-logo-text">MedAssist AI</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start your AI-powered health journey</p>

        <form onSubmit={handleSubmit}>
          {[
            { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
            { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
            { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters' },
            { name: 'confirm', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
          ].map(field => (
            <div className="form-group" key={field.name}>
              <label className="form-label">{field.label}</label>
              <input
                name={field.name}
                type={field.type}
                className="form-input"
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={handleChange}
              />
            </div>
          ))}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-4" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" className="link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
