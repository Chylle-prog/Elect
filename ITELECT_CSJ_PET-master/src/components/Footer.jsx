import React from 'react';
import './Footer.css';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
    const navigate = useNavigate();
    const year = new Date().getFullYear();

    return (
        <footer className="main-footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="footer-logo" onClick={() => navigate('/home')}>
                            <span className="logo-icon">🐾</span>
                            <span className="logo-text">CSJ Pet Pet Grooming Services</span>
                        </div>
                        <p>Premium Door-to-Door Pet Grooming Home Service in Lipa City. We bring the spa to your doorstep.</p>
                        <div className="social-links">
                            <a href="https://www.facebook.com/profile.php?id=61558944716383" aria-label="Facebook">FB</a>
                            <a href="#" aria-label="Instagram">IG</a>
                            <a href="#" aria-label="TikTok">TT</a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <ul>
                            <li onClick={() => navigate('/home')}>Home</li>
                            <li onClick={() => navigate('/booking')}>Booking</li>
                            <li onClick={() => navigate('/reviews')}>Reviews</li>
                            <li onClick={() => navigate('/contacts')}>Contacts</li>
                            <li onClick={() => navigate('/about')}>About</li>
                        </ul>
                    </div>

                    <div className="footer-contact">
                        <h4>Contact Us</h4>
                        <p>📍 Lipa City, Batangas</p>
                        <p>📞 09621494252 (TNT)</p>
                        <p>📞 09673020255 (Globe)</p>
                        <p>✉️ info@csjpetmobile.com</p>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {year} CSJ Pet Mobile Grooming Services. All rights reserved - ITELECT 3.    ARRIOLA    -    CACAO    -     LANTAFE    -    MAGBUHAT </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
