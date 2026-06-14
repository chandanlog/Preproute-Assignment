import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { AlertCircle, Loader } from 'lucide-react';
import { PrepRouteLogo } from '../components/PrepRouteLogo';
import './Login.css';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Validation errors
  const [userIdError, setUserIdError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');

  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!userId.trim()) {
      setUserIdError('Username is required');
      isValid = false;
    } else {
      setUserIdError('');
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters long');
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await apiService.login(userId, password);
      if ((response.success || response.status === 'success') && response.data?.token) {
        const rawUser = response.data.user || {};
        const userData = {
          username: rawUser.userId || rawUser.username || userId,
          name: rawUser.name || '',
          role: rawUser.role || 'Admin'
        };
        login(response.data.token, userData);
        navigate('/');
      } else {
        setApiError('Invalid credentials. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials and try again.';
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* Left Panel - Illustration */}
      <div className="login-left-panel">
        <div className="illustration-wrapper">
          <svg viewBox="0 0 500 400" className="desk-illustration" xmlns="http://www.w3.org/2000/svg">
            {/* Robot/Cylinder Character */}
            {/* Base ring resting on floor */}
            <rect x="210" y="295" width="50" height="10" rx="4" fill="#a5cbff" />
            <line x1="210" y1="299" x2="260" y2="299" stroke="#7fa9e8" strokeWidth="1" />
            
            {/* Main Cylinder Body */}
            <rect x="220" y="145" width="30" height="150" rx="3" fill="#ffffff" stroke="#374151" strokeWidth="1.5" />
            
            {/* Collar details */}
            <path d="M 220 205 Q 235 218 250 205" fill="none" stroke="#374151" strokeWidth="1" />
            <circle cx="235" cy="220" r="2" fill="#374151" />

            {/* Eye & Smile Face */}
            <circle cx="229" cy="180" r="1.5" fill="#374151" />
            <circle cx="241" cy="180" r="1.5" fill="#374151" />
            <path d="M 231 187 Q 235 190 239 187" fill="none" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" />

            {/* Top ring on head */}
            <rect x="220" y="137" width="30" height="8" rx="2" fill="#a5cbff" />
            
            {/* Column Capital/Top Board (Cap) */}
            <rect x="214" y="127" width="42" height="10" rx="2" fill="#a5cbff" />

            {/* Desk/Table (drawn over the body) */}
            <line x1="80" y1="240" x2="420" y2="240" stroke="#5d6675" strokeWidth="4" strokeLinecap="round" />
            {/* Table Legs */}
            <line x1="120" y1="240" x2="120" y2="330" stroke="#a0aec0" strokeWidth="1.5" />
            <line x1="185" y1="240" x2="185" y2="330" stroke="#a0aec0" strokeWidth="1.5" />
            <line x1="380" y1="240" x2="380" y2="330" stroke="#a0aec0" strokeWidth="1.5" />

            {/* Laptop */}
            {/* Laptop Screen/Lid */}
            <polygon points="185,195 138,195 152,236 199,236" fill="#e2e8f0" stroke="#374151" strokeWidth="1.5" strokeLinejoin="round" />
            <polygon points="180,199 142,199 154,233 192,233" fill="#ffffff" />
            {/* Laptop Keyboard Base */}
            <polygon points="199,236 152,236 159,240 210,240" fill="#cbd5e1" stroke="#374151" strokeWidth="1.5" strokeLinejoin="round" />

            {/* Arms/Hands typing */}
            <path d="M 222 220 Q 200 220 195 228" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 248 220 Q 265 225 272 232 Q 278 238 288 238" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />

            {/* Background Decorative Shapes */}
            {/* Left Star */}
            <g transform="translate(170, 160)">
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#374151" strokeWidth="1" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#374151" strokeWidth="1" />
            </g>
            {/* Middle Circle */}
            <circle cx="295" cy="188" r="3.5" fill="none" stroke="#374151" strokeWidth="1" />
            {/* Right Star */}
            <g transform="translate(350, 215)">
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#374151" strokeWidth="1" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#374151" strokeWidth="1" />
            </g>
          </svg>
        </div>
      </div>

      {/* Right Panel - Login Card */}
      <div className="login-right-panel">
        <div className="login-card">
          <div className="login-header">
            <PrepRouteLogo height={42} width={180} className="login-logo-img" />
            <h2 className="login-title">Login</h2>
            <p className="login-subtitle">Use your company provided Login credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {apiError && (
              <div className="login-error-banner">
                <AlertCircle size={18} />
                <span>{apiError}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="username">User ID</label>
              <input
                id="username"
                type="text"
                className={`form-input ${userIdError ? 'input-error' : ''}`}
                placeholder="Enter User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                disabled={loading}
              />
              {userIdError && <span className="form-error">{userIdError}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className={`form-input ${passwordError ? 'input-error' : ''}`}
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              {passwordError && <span className="form-error">{passwordError}</span>}
            </div>

            <div className="forgot-password-container">
              <a href="#forgot" className="forgot-password-link" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Logging in...</span>
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
