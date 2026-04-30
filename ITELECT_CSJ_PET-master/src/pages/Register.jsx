import React, { useState } from 'react';
import '../css/Register.css';
import { useNavigate } from 'react-router-dom';
import logo from '../img/logo.png';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
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
        if (!formData.fullName) newErrors.fullName = 'Full Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        if (Object.keys(newErrors).length === 0) {
            try {
                const response = await fetch('http://127.0.0.1:5000/api/customer/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: formData.fullName,
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
                        phone: user.phone || '',
                        houseNumber: user.houseNumber || '',
                        purok: user.purok || '',
                        barangay: user.barangay || '',
                        landmark: user.landmark || ''
                    }));

                    navigate('/profile');
                } else {
                    if (data.message === 'Email already registered') {
                        setErrors({ email: 'Email already registered' });
                    } else {
                        setErrors({ general: data.message || 'Registration failed' });
                    }
                }
            } catch (error) {
                setErrors({ general: 'Network error. Please try again later.' });
            }
        } else {
            setErrors(newErrors);
        }
    };

    return (
        <div className="register-container">
            {/* Back Button */}
            <button className="back-button" onClick={() => navigate('/home')}>
                <span className="back-icon">←</span>
                <span className="back-text">Back</span>
            </button>

            <div className="register-content">
                <div className="register-left">
                    <div className="register-brand">
                        <img src={logo} alt="Logo" className="brand-logo" />
                        <h1>CSJ Pet Grooming Services</h1>
                        <p>Join our family and give your pet the luxury treatment they deserve</p>
                    </div>
                    <div className="register-features">
                        <div className="feature-item">
                            <div className="feature-icon">🎉</div>
                            <span>Exclusive member benefits</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📅</div>
                            <span>Easy online booking</span>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">🎁</div>
                            <span>Special offers & rewards</span>
                        </div>
                    </div>
                </div>

                <div className="register-right">
                    <div className="register-card">
                        <div className="register-header">
                            <h2>Create Account</h2>
                            <p>Join us today and get started</p>
                            {errors.general && <div className="error-message" style={{marginTop: '10px', color: '#ff4d4f'}}>{errors.general}</div>}
                        </div>

                        <form onSubmit={handleSubmit} className="register-form">
                            <div className="form-group">
                                <label htmlFor="fullName">Full Name</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className={errors.fullName ? 'error' : ''}
                                />
                                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    className={errors.email ? 'error' : ''}
                                />
                                {errors.email && <span className="error-message">{errors.email}</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="password">Password</label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Create password"
                                        className={errors.password ? 'error' : ''}
                                    />
                                    {errors.password && <span className="error-message">{errors.password}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">Confirm Password</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm password"
                                        className={errors.confirmPassword ? 'error' : ''}
                                    />
                                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                                </div>
                            </div>

                            <button type="submit" className="register-btn">Create Account</button>
                        </form>

                        <div className="register-footer">
                            <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>Login Here</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
