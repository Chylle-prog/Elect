import React, { useState, useEffect } from 'react';
import '../css/Contacts.css';
import '../css/PawBackground.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PawBackground from '../components/PawBackground';

const Contacts = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setFormData(prev => ({ 
        ...prev, 
        name: user.fullName, 
        email: user.email 
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert('Please login to send a message');
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: currentUser.id,
          subject: formData.subject,
          message: formData.message
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData(prev => ({ ...prev, subject: '', message: '' }));
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error connecting to server');
    }
  };

  return (
    <div className="contacts-page">
      <PawBackground />


      <header className="contacts-hero">
        <div className="container">
          <div className="contacts-hero-content">
            <span className="badge">Get in Touch</span>
            <h1>We'd Love to <span className="text-gradient">Hear From You</span></h1>
            <p>Our mobile pet grooming van is always on the go in Lipa City. Reach out for any inquiries or special requests.</p>
          </div>
        </div>
      </header>

      <div className="contacts-sections-container">
        {/* Contact Info & Form Grid */}
        <section className="contacts-card-section form-section">
          <div className="container">
            <div className="contacts-main-grid">
              <div className="contacts-info-side">
                <div className="info-card glass">
                  <div className="info-item">
                    <span className="info-icon">📍</span>
                    <div className="info-text">
                      <h3>Local Focus</h3>
                      <p>Lipa City, Batangas</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">📞</span>
                    <div className="info-text">
                      <h3>Phone Numbers</h3>
                      <p>0962 149 4252 (TNT)</p>
                      <p>0967 302 0255 (Globe)</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">✉️</span>
                    <div className="info-text">
                      <h3> Facebook</h3>
                      <p> CSJ Pet Grooming Services Lipa City,Batangas</p>
                    </div>
                  </div>
                </div>

                <div className="service-availability">
                  <h3>🚛 Service Availability</h3>
                  <p>Daily: 8:00 AM - 6:00 PM</p>
                  <p>Operating throughout Lipa City and nearby areas.</p>
                </div>
              </div>

              <div className="contacts-form-side">
                {submitted ? (
                  <div className="success-glass">
                    <div className="success-icon">✅</div>
                    <h2>Message Sent!</h2>
                    <p>We've received your inquiry and will get back to you shortly via phone or email.</p>
                    <button className="btn-small" onClick={() => setSubmitted(false)}>Send Another</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="modern-contact-form">
                    <div className="form-grid">
                      <div className="input-group">
                        <label>Your Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your full name" required readOnly={isLoggedIn} style={isLoggedIn ? {background: '#f8fafc', color: '#64748b'} : {}} />
                      </div>
                      <div className="input-group">
                        <label>Email Address</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="your@email.com" required readOnly={isLoggedIn} style={isLoggedIn ? {background: '#f8fafc', color: '#64748b'} : {}} />
                      </div>
                      <div className="input-group full-width">
                        <label>Subject</label>
                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="How can we help?" required />
                      </div>
                      <div className="input-group full-width">
                        <label>Message</label>
                        <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell us more about your pet's needs..." rows="5" required />
                      </div>
                    </div>
                    <button type="submit" className="submit-main-btn">Send Message</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="contacts-card-section contact-cta">
          <div className="container">
            <div className="cta-overlay-content">
              <h2>Ready to Book?</h2>
              <p>Skip the message and secure your slot directly on our booking calendar.</p>
              <button className="btn-modern-large" onClick={() => navigate('/booking')}>Go to Booking Page</button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Contacts;
