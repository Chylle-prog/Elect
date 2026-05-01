import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/login.css';
import logo from '../csjlogo.png';

const API_BASE = 'http://127.0.0.1:5000/api';

// Main App Component
const App = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [rememberMe, setRememberMe] = useState(false);
    const [isForgotPasswordView, setIsForgotPasswordView] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Load saved email on component mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const handleLogout = () => {
        setIsLoggedIn(false);
        setPassword('');
        setErrors({});
        // Don't clear email if remember me is checked
        if (!rememberMe) {
            setEmail('');
            localStorage.removeItem('userEmail');
        }
    };

    const validate = () => {
        let tempErrors = {};
        if (!email) {
            tempErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            tempErrors.email = 'Email is invalid';
        }

        if (isForgotPasswordView) {
            if (!newPassword) {
                tempErrors.newPassword = 'New password is required';
            } else if (newPassword.length < 8) {
                tempErrors.newPassword = 'Password must be at least 8 characters';
            }
            if (!confirmPassword) {
                tempErrors.confirmPassword = 'Confirm password is required';
            } else if (newPassword !== confirmPassword) {
                tempErrors.confirmPassword = 'Passwords do not match';
            }
        } else {
            if (!password) {
                tempErrors.password = 'Password is required';
            } else if (password.length < 8) {
                tempErrors.password = 'Password must be at least 8 characters';
            }
        }

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validate()) {
            if (isForgotPasswordView) {
                try {
                    const res = await fetch(`${API_BASE}/reset-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, newPassword })
                    });
                    const data = await res.json();
                    
                    if (data.success) {
                        alert('Password has been reset successfully! Please login with your new password.');
                        setIsForgotPasswordView(false);
                        setPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                    } else {
                        setErrors({ email: data.message || 'Reset failed' });
                    }
                } catch (err) {
                    console.error('Reset error:', err);
                    setErrors({ login: 'Server error. Please try again.' });
                }
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                
                if (data.success) {
                    console.log('Credentials correct, saving to localStorage...');

                    // Save email to localStorage if remember me is checked
                    if (rememberMe) {
                        localStorage.setItem('userEmail', email);
                    } else {
                        localStorage.removeItem('userEmail');
                    }

                    // Save login session
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', email);

                    alert('Login Successful! Redirecting to dashboard...');
                    navigate('/dashboard');
                } else {
                    console.log('Invalid credentials');
                    setErrors({ login: data.message || 'Invalid email or password. Please try again.' });
                }
            } catch (err) {
                console.error('Login error:', err);
                setErrors({ login: 'Server error. Please try again.' });
            }
        } else {
            console.log('Validation failed');
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="logo-section">
                    <img src={logo} alt="CSJ Logo" className="login-logo" />
                    <h2>CSJ Pet Grooming</h2>
                    <p>{isForgotPasswordView ? 'Reset Password' : 'Admin Dashboard Login'}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className={`input-field ${errors.email || errors.login ? 'error' : ''}`}
                            placeholder="admin1@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    {isForgotPasswordView ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    className={`input-field ${errors.newPassword ? 'error' : ''}`}
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className={`input-field ${errors.password || errors.login ? 'error' : ''}`}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                {errors.password && <span className="error-message">{errors.password}</span>}
                                {errors.login && <span className="error-message">{errors.login}</span>}
                            </div>

                            <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="remember-me" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <input
                                        type="checkbox"
                                        id="rememberMe"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <label htmlFor="rememberMe" style={{ margin: 0 }}>Remember me</label>
                                </div>
                                <a href="#" className="forgot-password" style={{ margin: 0, textDecoration: 'none' }} onClick={(e) => { e.preventDefault(); setIsForgotPasswordView(true); }}>
                                    Forgot password?
                                </a>
                            </div>
                        </>
                    )}

                    <button type="submit" className="login-button">
                        {isForgotPasswordView ? 'Reset Password' : 'Log In'}
                    </button>

                    {isForgotPasswordView && (
                        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                            <a href="#" className="forgot-password" style={{ textDecoration: 'none', display: 'inline-block', margin: 0 }} onClick={(e) => { e.preventDefault(); setIsForgotPasswordView(false); }}>
                                Back to Login
                            </a>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default App;
