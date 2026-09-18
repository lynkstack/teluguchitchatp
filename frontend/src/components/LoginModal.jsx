import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, Eye, EyeOff, Loader2, AlertCircle, X, Sparkles, UserPlus } from 'lucide-react';

const LoginModal = ({ onClose, onForgotPassword, onRegister, onGuestLogin }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      return 'Unable to connect to the server. Please check your internet connection or try again shortly.';
    }
    return err.message || 'Login failed. Please verify your credentials and try again.';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanId = loginId.trim();
    const cleanPass = password;

    if (!cleanId) {
      setError('Please enter your Email or User ID.');
      return;
    }
    if (!cleanPass) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', { 
        loginId: cleanId, 
        password: cleanPass 
      });
      
      if (res.data?.user && res.data?.token) {
        login(res.data.user, res.data.token);
        if (onClose) onClose();
      } else {
        throw new Error('Invalid response from server.');
      }
    } catch (err) {
      console.error('Login error:', err);
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
          maxWidth: '420px', 
          width: '100%', 
          padding: '32px 28px', 
          borderRadius: '24px',
          background: 'linear-gradient(165deg, #ffffff 0%, #f8faff 100%)',
          boxShadow: '0 25px 50px -12px rgba(80, 70, 229, 0.25), 0 0 0 1px rgba(99, 102, 241, 0.1)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
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
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#f1f3f9'; e.currentTarget.style.color = '#64748b'; }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
            marginBottom: '12px'
          }}>
            <LogIn size={26} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: 0 }}>
            Sign in to continue connecting on Chit Chat Telugu
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '10px', 
            background: '#fff1f2', 
            border: '1px solid #fecdd3', 
            borderRadius: '14px', 
            padding: '12px 14px', 
            marginBottom: '20px',
            color: '#e11d48',
            fontSize: '0.85rem',
            lineHeight: '1.45',
            animation: 'fadeIn 0.2s ease'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Email or User ID Field */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.82rem', 
              fontWeight: 700, 
              color: '#334155', 
              marginBottom: '6px',
              letterSpacing: '0.2px'
            }}>
              EMAIL OR USER ID
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
              }}>
                <User size={18} />
              </div>
              <input 
                type="text" 
                placeholder="e.g. name@example.com or user_123"
                value={loginId} 
                onChange={e => { setLoginId(e.target.value); if (error) setError(''); }} 
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
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ 
                fontSize: '0.82rem', 
                fontWeight: 700, 
                color: '#334155', 
                letterSpacing: '0.2px'
              }}>
                PASSWORD
              </label>
              <button 
                type="button" 
                onClick={onForgotPassword} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#4f46e5', 
                  fontSize: '0.82rem', 
                  fontWeight: 600, 
                  cursor: 'pointer',
                  padding: 0
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', 
                left: '14px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Lock size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password"
                value={password} 
                onChange={e => { setPassword(e.target.value); if (error) setError(''); }} 
                disabled={loading}
                required 
                style={{ 
                  width: '100%', 
                  padding: '12px 42px 12px 42px', 
                  fontSize: '0.94rem', 
                  borderRadius: '12px', 
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  color: '#0f172a',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#6366f1';
                  e.target.style.background = '#ffffff';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.background = '#f8fafc';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
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
              background: loading ? '#818cf8' : 'linear-gradient(135deg, #4f46e5 0%, #7c6ff7 100%)',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.35)',
              marginTop: '22px',
              transition: 'all 0.2s ease',
              transform: loading ? 'none' : 'translateY(0)'
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          margin: '22px 0 18px 0' 
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Guest Login Quick Action */}
        <button 
          type="button" 
          onClick={onGuestLogin}
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontSize: '0.92rem', 
            fontWeight: 700, 
            borderRadius: '14px', 
            border: '1.5px solid #d1fae5', 
            background: '#ecfdf5',
            color: '#059669',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#d1fae5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ecfdf5'; }}
        >
          <Sparkles size={18} />
          <span>Quick Guest Login</span>
        </button>

        {/* Registration Footer Link */}
        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.88rem', color: '#64748b' }}>
          <span>Don't have an account? </span>
          <button 
            type="button" 
            onClick={onRegister} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#4f46e5', 
              cursor: 'pointer', 
              fontWeight: 700,
              padding: 0
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
