import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Calendar, AlertCircle, Loader2, X, ArrowLeft } from 'lucide-react';

const GuestLoginModal = ({ onClose, onBackToLogin }) => {
  const [name, setName] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [gender, setGender] = useState('Other');
  const [isHuman, setIsHuman] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const getErrorMessage = (err) => {
    const data = err.response?.data;
    if (data?.msg) return data.msg;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (typeof data === 'string' && data.length < 150) return data;
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return 'Unable to connect to the server. Please check your connection and try again.';
    }
    return err.message || 'An error occurred during guest login.';
  };

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a guest name.');
      return;
    }
    if (!isHuman) {
      setError('Please confirm you are not a robot and meet the age requirement.');
      return;
    }

    if (!dobDay || !dobMonth || !dobYear) {
      setError('Please select your full Date of Birth.');
      return;
    }

    // Calculate age from dob
    const birthDate = new Date(`${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge < 18) {
      setError('You must be at least 18 years old to proceed as a guest.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/guest-login', { 
        name: name.trim(), 
        age: calculatedAge, 
        gender 
      });
      if (res.data?.user && res.data?.token) {
        login(res.data.user, res.data.token);
        if (onClose) onClose();
      } else {
        throw new Error('Invalid response from server.');
      }
    } catch (err) {
      console.error('Guest login error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ 
        zIndex: 10000, 
        backdropFilter: 'blur(8px)', 
        background: 'rgba(10, 10, 20, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '440px', 
          width: '100%', 
          padding: '32px 28px', 
          borderRadius: '24px',
          background: 'linear-gradient(165deg, #ffffff 0%, #f8faff 100%)',
          boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.2), 0 0 0 1px rgba(16, 185, 129, 0.15)',
          position: 'relative'
        }}
      >
        {/* Back / Close button */}
        {onBackToLogin ? (
          <button 
            type="button"
            onClick={onBackToLogin}
            style={{
              position: 'absolute',
              top: '18px',
              left: '18px',
              background: '#f1f3f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer'
            }}
            aria-label="Back to Login"
          >
            <ArrowLeft size={18} />
          </button>
        ) : null}

        <button 
          type="button"
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: '18px', 
            right: '18px', 
            background: '#f1f3f9', 
            border: 'none', 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#64748b', 
            cursor: 'pointer' 
          }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '52px', 
            height: '52px', 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            borderRadius: '16px',
            color: '#ffffff',
            boxShadow: '0 8px 18px rgba(16, 185, 129, 0.35)',
            marginBottom: '12px'
          }}>
            <Sparkles size={26} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            Guest Login
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
            Join instantly without creating a permanent account
          </p>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '10px', 
            background: '#fff1f2', 
            border: '1px solid #fecdd3', 
            borderRadius: '14px', 
            padding: '12px 14px', 
            marginBottom: '18px',
            color: '#e11d48',
            fontSize: '0.85rem',
            lineHeight: '1.45'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>{error}</div>
          </div>
        )}

        <form onSubmit={handleGuestLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              GUEST NICKNAME
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                <User size={18} />
              </div>
              <input 
                type="text" 
                placeholder="e.g. TeluguRider"
                value={name} 
                onChange={e => { setName(e.target.value); if (error) setError(''); }} 
                autoFocus
                disabled={loading}
                required 
                style={{ 
                  width: '100%', 
                  padding: '12px 14px 12px 42px', 
                  fontSize: '0.94rem', 
                  borderRadius: '12px', 
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                DATE OF BIRTH (18+)
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <select 
                  value={dobDay} 
                  onChange={e => setDobDay(e.target.value)} 
                  disabled={loading}
                  required
                  style={{ flex: 1, padding: '10px 4px', fontSize: '0.85rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                >
                  <option value="">DD</option>
                  {Array.from({length: 31}, (_, i) => <option key={i+1} value={String(i+1)}>{i+1}</option>)}
                </select>
                <select 
                  value={dobMonth} 
                  onChange={e => setDobMonth(e.target.value)} 
                  disabled={loading}
                  required
                  style={{ flex: 1.2, padding: '10px 4px', fontSize: '0.85rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                >
                  <option value="">MM</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => 
                    <option key={i+1} value={String(i+1)}>{m}</option>
                  )}
                </select>
                <select 
                  value={dobYear} 
                  onChange={e => setDobYear(e.target.value)} 
                  disabled={loading}
                  required
                  style={{ flex: 1.4, padding: '10px 4px', fontSize: '0.85rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                >
                  <option value="">YYYY</option>
                  {Array.from({length: 80}, (_, i) => {
                    const year = new Date().getFullYear() - 18 - i;
                    return <option key={year} value={String(year)}>{year}</option>;
                  })}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                GENDER
              </label>
              <select 
                value={gender} 
                onChange={e => setGender(e.target.value)}
                disabled={loading}
                style={{ width: '100%', padding: '10px 8px', fontSize: '0.85rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Verification Box */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            border: '1.5px solid #e2e8f0', 
            background: '#f8fafc', 
            padding: '12px 14px',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
              <input 
                type="checkbox" 
                checked={isHuman}
                onChange={(e) => setIsHuman(e.target.checked)}
                disabled={loading}
                style={{ width: '20px', height: '20px', accentColor: '#10b981', cursor: 'pointer' }}
                required
              />
              <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#334155' }}>
                I'm 18+ and agree to community guidelines
              </span>
            </label>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '14px', 
              fontSize: '1rem', 
              fontWeight: 700, 
              borderRadius: '14px', 
              border: 'none', 
              background: loading ? '#6ee7b7' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Entering as Guest...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Enter as Guest</span>
              </>
            )}
          </button>
        </form>

        {onBackToLogin && (
          <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
            <span>Already have an account? </span>
            <button 
              type="button" 
              onClick={onBackToLogin}
              style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestLoginModal;
