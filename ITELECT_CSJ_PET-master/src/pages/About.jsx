import React, { useEffect } from 'react';
import '../css/About.css';
import '../css/PawBackground.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PawBackground from '../components/PawBackground';

const About = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const values = [
    {
      id: 1,
      title: 'Compassionate Care',
      description: 'We treat every furbaby as our own. Safety and comfort are our top priorities.',
      icon: '❤️'
    },
    {
      id: 2,
      title: 'Mobile Luxury',
      description: 'Premium spa services delivered right to your garage or doorstep in Lipa City.',
      icon: '🚛'
    },
    {
      id: 3,
      title: 'Expert Grooming',
      description: 'Certified professionals specialized in various breeds, from Poodles to Huskies.',
      icon: '✂️'
    },
    {
      id: 4,
      title: 'Lipa Community',
      description: 'Proudly serving Lipa City and surrounding areas with the best local pet care.',
      icon: '📍'
    }
  ];

  return (
    <div className="about-page">
      <PawBackground />


      <header className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <span className="badge">Our Story</span>
            <h1>The Passion Behind <span className="text-gradient">CSJ Pet Mobile</span></h1>
            <p>We are a dedicated mobile pet grooming service based in Lipa City, committed to bringing the professional spa experience directly to your home.</p>
          </div>
        </div>
      </header>

      <div className="about-sections-container">
        {/* Our Mission Section */}
        <section className="about-card-section mission-section">
          <div className="container">
            <div className="about-grid">
              <div className="about-text">
                <h2>Our Mission</h2>
                <p>Founded with a deep love for animals, CSJ Pet Mobile aims to provide high-quality, stress-free grooming for pets while offering maximum convenience for busy owners.</p>
                <p>We believe that every pet deserves to look and feel their best without the stress of traveling to a traditional salon. Our specialized grooming truck is equipped with everything needed for a full pampered session.</p>
              </div>
              <div className="about-visual">
                <div className="floating-blob">🎯</div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="about-card-section values-section">
          <div className="container">
            <div className="section-header">
              <h2>Our Core Values</h2>
              <p>The principles that guide every brush and bath</p>
            </div>
            <div className="values-cards-grid">
              {values.map(value => (
                <div key={value.id} className="modern-value-card">
                  <div className="value-icon-wrap">{value.icon}</div>
                  <h3>{value.title}</h3>
                  <p>{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="about-card-section lipa-section">
          <div className="container">
            <div className="lipa-focus-grid">
              <div className="lipa-content">
                <h2>Proudly Based in <span className="text-gradient">Lipa City</span></h2>
                <p>We are a local business devoted to the pets and pet parents of Lipa. Whether you're in a busy subdivision or a quiet street, our mobile unit is ready to serve you.</p>
                <div className="lipa-details">
                  <div className="l-item"><span>📍</span> Real-time Mobile Tracking</div>
                  <div className="l-item"><span>🚛</span> Fully Equipped Grooming Van</div>
                  <div className="l-item"><span>🚿</span> Heated Water & AC Onboard</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-card-section about-cta">
          <div className="container">
            <div className="cta-box">
              <h2>Ready to Pamper Your Pet?</h2>
              <p>Experience the ultimate convenience of CSJ Pet Mobile today.</p>
              <div className="cta-btns">
                <button className="btn-main" onClick={() => navigate('/booking')}>Book Now</button>
                <button className="btn-outline" onClick={() => navigate('/contacts')}>Contact Us</button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default About;
