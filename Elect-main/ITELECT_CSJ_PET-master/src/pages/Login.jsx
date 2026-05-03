import React, { useState } from 'react';
import '../css/Login.css';
import { useNavigate } from 'react-router-dom';
import { login } from '../routes/routeGuards';
import logo from '../img/logo.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/customer/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          const user = data.user;
          // Store current user session with all profile fields
          localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            houseNumber: user.houseNumber,
            purok: user.purok,
            barangay: user.barangay,
            landmark: user.landmark,
            gender: user.gender
          }));

          // Use the login guard
          login({
            email: user.email,
            name: user.fullName,
            role: 'user'
          });
          navigate('/profile');
        } else {
          setErrors({ login: data.message || 'Invalid email or password' });
        }
      } catch (error) {
        setErrors({ login: 'Network error. Please try again later.' });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="login-container">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/home')}>
        <span className="back-icon">←</span>
        <span className="back-text">Back</span>
      </button>

      <div className="login-content">
        <div className="login-left">
          <div className="login-brand">
            <img src={logo} alt="Logo" className="brand-logo" />
            <h1>CSJ Pet Grooming Services</h1>
            <p>Your premium pet grooming destination where pampering meets perfection</p>
          </div>
          <div className="login-features">
            <div className="feature-item">
              <div className="feature-icon">✨</div>
              <span>Premium grooming services</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏆</div>
              <span>Expert pet stylists</span>
            </div>
            <div className="feature-item">
              <div className="feature-icon">❤️</div>
              <span>Loving care guaranteed</span>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-glass-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to access your account</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {errors.login && <div className="error-message login-error">{errors.login}</div>}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrap">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={errors.email ? 'error' : ''}
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={errors.password ? 'error' : ''}
                  />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <button type="submit" className="login-btn-premium">Sign In</button>
            </form>

            <div className="login-footer">
              <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>Create one</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
