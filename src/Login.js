import React, { useState } from 'react';
import './Login.css';

const Login = () => {
  const [showSignup, setShowSignup] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupError, setSignupError] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('https://alifabrics-pos-backend-production.up.railway.app/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('pos_token', data.token);
        window.location.href = '/dashboard';
      } else {
        setLoginError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setLoginError('Connection to server failed.');
    }

    setEmail('');
    setPassword('');
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');

    try {
      const response = await fetch('https://alifabrics-pos-backend-production.up.railway.app/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, password: signupPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful! Please log in.");
        setShowSignup(false);
      } else {
        setSignupError(data.message || 'Registration failed');
      }
    } catch (err) {
      setSignupError('Connection to server failed.');
    }

    setSignupEmail('');
    setSignupPassword('');
  };

  return (
    <div className="login-container">
      <div className={`card-wrapper ${showSignup ? 'show-signup' : ''}`}>
        
        {/* === LOGIN CARD === */}
        <div className="form-card login-card">
          <h2 className="login-title">Ali Fabrics</h2>
          <p className="login-subtitle">Please enter your details to sign in</p>
          
          {loginError && <div className="error-message">{loginError}</div>}
          
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <input
                className="login-input"
                placeholder="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                name="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <p style={{fontSize: '12px'}}>
              Maybe register a user{' '}
              <a href='#!' onClick={(e) => { e.preventDefault(); setShowSignup(true); }}>
                here
              </a>
            </p>
            
            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>
        </div>

        <div className="form-card signup-card">
          <h2 className="login-title">Register</h2>
          <p className="login-subtitle">Create a new account</p>
          
          {signupError && <div className="error-message">{signupError}</div>}
          
          <form onSubmit={handleSignupSubmit}>
            <div className="form-group">
              <input
                className="login-input"
                placeholder="new username"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />
            </div>

            <p style={{fontSize: '12px'}}>
              Already have an account?{' '}
              <a href='#!' onClick={(e) => { e.preventDefault(); setShowSignup(false); }}>
                Log in
              </a>
            </p>
            
            <button type="submit" className="login-button">
              Sign Up
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Login;