import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, X, ArrowLeft } from 'lucide-react';

const RegisterModal = ({ onClose, onBackToLogin }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [gender, setGender] = useState('Other');
  const [country, setCountry] = useState('India');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const { login } = useAuth();

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    if (newName.trim() !== '') {
      const baseName = newName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      setUsername(`${baseName || 'user'}_${randomNum}`);
    } else {
      setUsername('');
    }
  };

  const getErrorMessage = (err) => {
    const data = err.response?.data;
    if (data?.msg) return data.msg;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (typeof data === 'string' && data.length < 150) return data;
    if (err.code === 'ERR_NETWORK' || !err.response) {
      return 'Unable to connect to the server. Please check your connection and try again.';
    }
    return err.message || 'Registration failed. Please try again.';
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError('You must agree to the terms and verify that you are 18+.');
      return;
    }

    if (!dobDay || !dobMonth || !dobYear) {
      setError('Please select your full Date of Birth.');
      return;
    }

    const birthDateStr = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    if (calculatedAge < 18) {
      setError('You must be at least 18 years old to register.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', { 
        username, 
        email: email.trim(), 
        password, 
        age: calculatedAge, 
        gender, 
        birthday: birthDateStr, 
        country 
      });

      setSuccessMsg(res.data?.msg || 'Registration successful!');
      
      // If server returned instant login token & user
      if (res.data?.user && res.data?.token) {
        setTimeout(() => {
          login(res.data.user, res.data.token);
          if (onClose) onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(getErrorMessage(err));
      setSuccessMsg('');
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
          maxWidth: '460px', 
          width: '100%', 
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '30px 26px', 
          borderRadius: '24px',
          background: 'linear-gradient(165deg, #ffffff 0%, #f8faff 100%)',
          boxShadow: '0 25px 50px -12px rgba(80, 70, 229, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.1)',
          position: 'relative'
        }}
      >
        {onBackToLogin && (
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
        )}

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
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '52px', 
            height: '52px', 
            background: 'linear-gradient(135deg, #5046e5 0%, #7c6ff7 100%)', 
            borderRadius: '16px',
            color: '#ffffff',
            boxShadow: '0 8px 18px rgba(80, 70, 229, 0.35)',
            marginBottom: '10px'
          }}>
            <UserPlus size={26} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
            Create Account
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
            Join Chit Chat Telugu and connect with friends
          </p>
        </div>

        {successMsg ? (
          <div style={{ textAlign: 'center', padding: '24px 12px' }}>
            <div style={{ color: '#10b981', display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <CheckCircle2 size={48} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
              Welcome to Chit Chat Telugu!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
              {successMsg}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#6366f1', fontSize: '0.88rem', fontWeight: 600 }}>
              <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Logging you in automatically...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister}>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '10px', 
                background: '#fff1f2', 
                border: '1px solid #fecdd3', 
                borderRadius: '12px', 
                padding: '10px 12px', 
                marginBottom: '14px',
                color: '#e11d48',
                fontSize: '0.84rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>{error}</div>
              </div>
            )}

            {/* Full Name */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                FULL NAME
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <User size={16} />
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. Vinay Goud"
                  value={name} 
                  onChange={handleNameChange} 
                  disabled={loading}
                  required 
                  style={{ width: '100%', padding: '10px 12px 10px 38px', fontSize: '0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Generated User ID */}
            {username && (
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  YOUR USER ID
                </label>
                <input 
                  type="text" 
                  value={username} 
                  readOnly
                  style={{ width: '100%', padding: '10px 12px', fontSize: '0.9rem', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#e2e8f0', color: '#475569', fontWeight: 600, boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                EMAIL ADDRESS
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Mail size={16} />
                </div>
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  value={email} 
                  onChange={e => { setEmail(e.target.value); if (error) setError(''); }} 
                  disabled={loading}
                  required 
                  style={{ width: '100%', padding: '10px 12px 10px 38px', fontSize: '0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* DOB & Gender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  DATE OF BIRTH (18+)
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <select 
                    value={dobDay} 
                    onChange={e => setDobDay(e.target.value)} 
                    disabled={loading}
                    required
                    style={{ flex: 1, padding: '8px 2px', fontSize: '0.82rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                  >
                    <option value="">DD</option>
                    {Array.from({length: 31}, (_, i) => <option key={i+1} value={String(i+1)}>{i+1}</option>)}
                  </select>
                  <select 
                    value={dobMonth} 
                    onChange={e => setDobMonth(e.target.value)} 
                    disabled={loading}
                    required
                    style={{ flex: 1.1, padding: '8px 2px', fontSize: '0.82rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
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
                    style={{ flex: 1.3, padding: '8px 2px', fontSize: '0.82rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  GENDER
                </label>
                <select 
                  value={gender} 
                  onChange={e => setGender(e.target.value)}
                  disabled={loading}
                  style={{ width: '100%', padding: '8px 6px', fontSize: '0.85rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Country */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                COUNTRY
              </label>
              <select 
                value={country} 
                onChange={e => setCountry(e.target.value)}
                disabled={loading}
                required
                style={{ width: '100%', padding: '9px 10px', fontSize: '0.88rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc' }}
              >
                <option value="India">India</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="United Arab Emirates">United Arab Emirates</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                CREATE PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Lock size={16} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="At least 6 characters"
                  value={password} 
                  onChange={e => { setPassword(e.target.value); if (error) setError(''); }} 
                  disabled={loading}
                  required 
                  style={{ width: '100%', padding: '10px 38px 10px 38px', fontSize: '0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Terms checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '18px' }}>
              <input 
                type="checkbox" 
                id="termsCheck"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={loading}
                style={{ marginTop: '2px', width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }}
                required
              />
              <label htmlFor="termsCheck" style={{ fontSize: '0.82rem', color: '#475569', lineHeight: '1.4', cursor: 'pointer' }}>
                I am 18+ and agree to the Terms of Service & Privacy Policy.
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                padding: '13px', 
                fontSize: '1rem', 
                fontWeight: 700, 
                borderRadius: '12px', 
                border: 'none', 
                background: loading ? '#818cf8' : 'linear-gradient(135deg, #4f46e5 0%, #7c6ff7 100%)',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {onBackToLogin && !successMsg && (
          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.86rem', color: '#64748b' }}>
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

export default RegisterModal;
