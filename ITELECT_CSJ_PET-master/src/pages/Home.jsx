import React, { useEffect, useState, useRef } from 'react';
import '../css/Home.css';
import '../css/PawBackground.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import PawBackground from '../components/PawBackground';
import CutImg from '../img/sc.jpg';
import CutImg2 from '../img/sc2.jpg';
import CutImg4 from '../img/sc4.jpg';
import CutImg5 from '../img/sc5.jpg';
import CutImg7 from '../img/sc7.jpg';
import CutImg8 from '../img/sc8.jpg';
import CutImg9 from '../img/sc9.jpg';
import CatCutImg from '../img/cat.jpg';
import CatCutImg2 from '../img/cat2.jpg';
import CatCutImg3 from '../img/cat3.jpg';
import CatCutImg4 from '../img/cat4.png';
import BeforeAfter1 from '../img/1.jpg';
import BeforeAfter2 from '../img/2.jpg';
import BeforeAfter3 from '../img/3.jpg';
import BeforeAfter4 from '../img/4.jpg';
import BeforeAfter5 from '../img/5.jpg';
import BeforeAfter6 from '../img/6.jpg';
import BeforeAfter7 from '../img/7.jpg';
import BeforeAfter8 from '../img/8.jpg';
import BeforeAfter9 from '../img/9.jpg';
import BeforeAfter10 from '../img/10.jpg';
import s1 from "../img/pa.png";
import s2 from "../img/pa2.jpg";
import s3 from "../img/pa3.jpg";
import s4 from "../img/pa4.jpg";
import s5 from "../img/pa5.png";
import s6 from "../img/pa6.jpg";
import s7 from "../img/pa7.jpg";
import s8 from "../img/pa8.jpg";
import s9 from "../img/pa9.jpg";
import logo from "../img/logo.png";


const Home = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [pricingTab, setPricingTab] = useState('standard');
  const [services, setServices] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/services');
      if (res.ok) {
        const data = await res.json();
        setServices(data);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  const getPricingDog = () => {
    const sizes = ['Small', 'Medium', 'Large', 'Extra Large', 'XXL'];
    return sizes.map(size => {
      // Improved matching: check for size name or abbreviated versions
      const service = services.find(s => {
        const name = s.name.toLowerCase();
        const search = size.toLowerCase();
        if (search === 'extra large') return name.includes('extra large') || name.includes('xl');
        if (search === 'xxl') return name.includes('xxl');
        return name.includes(search);
      });

      // Image fallback for XL and XXL
      let imgName = `${size.toLowerCase().replace(' ', '_')}_dog.png`;
      if (size === 'Extra Large' || size === 'XXL' || !size) {
        imgName = 'large_dog.png';
      }

      return {
        size,
        price: service ? service.price : '899', // Fallback price
        img: `/assets/images/${imgName}`
      };
    });
  };

  const getSpecialRates = () => {
    return services
      .filter(s => s.type === 'Breed')
      .map(s => ({
        breed: s.name.replace(' Rate', ''),
        price: s.price
      }));
  };

  const getCatPrice = () => {
    const catService = services.find(s => s.name.toLowerCase().includes('cat'));
    return catService ? catService.price : '899';
  };

  const packageInclusions = [
    { label: 'Hair Cut', emoji: '✂️', image: s1 },
    { label: 'Nail Trim', emoji: '💅', image: s2 },
    { label: 'Nail File', emoji: '💨', image: s5 },
    { label: 'Anal Drain', emoji: '🛁', image: s4 },
    { label: 'Ear Clean', emoji: '👂', image: s6 },
    { label: 'Bath and Blow Dry', emoji: '🚿', image: s3 },
    { label: 'Hair Brushing', emoji: '🪮', image: s7 },
    { label: 'Toothbrush (provided by customer)', emoji: '🪥', image: s8 },
    { label: 'Cologne Spray', emoji: '🧴', image: s9 }
  ];
  const transformations = [
    { id: 1, title: 'Pomeranian', before: BeforeAfter1, after: BeforeAfter2 },
    { id: 2, title: 'Cat 1', before: BeforeAfter3, after: BeforeAfter4 },
    { id: 3, title: 'Shih Tzu', before: BeforeAfter6, after: BeforeAfter5 },
    { id: 4, title: 'Cat 2', before: BeforeAfter7, after: BeforeAfter8 },
    { id: 5, title: 'Poodle', before: BeforeAfter9, after: BeforeAfter10 },
  ];

  const dogHaircuts = [
    { name: 'Summer Cut', img: CutImg },
    { name: 'Puppy Cut', img: CutImg2 },
    { name: 'Lion Cut', img: CutImg4 },
    { name: 'Teddy Bear Cut', img: CutImg5 },
    { name: 'Kennel Cut', img: CutImg7 },
    { name: 'Lamb Cut', img: CutImg8 },
    { name: 'Lion Cut', img: CutImg9 }
  ];

  const catHaircuts = [
    { name: 'Lion Cut', img: CatCutImg },
    { name: 'Teddy Bear Cut', img: CatCutImg2 },
    { name: 'Comb Cut', img: CatCutImg3 },
    { name: 'Belly Cut', img: CatCutImg4 }
  ];

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (direction === 'left') {
      current.scrollBy({ left: -300, behavior: 'smooth' });
    } else {
      current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="home-container">
      {/* Animated Paw Background */}
      <PawBackground />

      {/* Parallax Pet Elements */}
      <div className="parallax-pets">
        <span className="floating-pet">🐕</span>
        <span className="floating-pet">🐾</span>
        <span className="floating-pet">🐈</span>
        <span className="floating-pet">🦴</span>
      </div>

      {/* Unique Hero Showcase Section */}
      <section className="hero-section" id="hero">
        <div className="hero-bg-shapes">
          <div className="shape blob-1"></div>
          <div className="shape blob-2"></div>
          <div className="shape blob-3"></div>
        </div>

        <div className="container">
          <div className="hero-showcase-grid">
            {/* Left Content Column */}
            <div className="hero-main-card">
              <div className="trust-badge">
                <span className="sparkle">✨</span> Lipa's Premium Choice
              </div>
              <h1 className="hero-title">
                Your Pet's <span className="text-gradient">Personal Spa</span>
                <br />Right at Your Home
              </h1>
              <p className="hero-description">
                Experience the ultimate convenience of professional mobile grooming.
                We bring luxury care, stress-free environments, and loving hands directly to your doorstep.
              </p>
              <div className="hero-actions">
                <button className="cta-main-btn pulse-button" onClick={() => navigate('/booking')}>
                  Book Now <span className="btn-icon">➜</span>
                </button>
                <div className="hero-stats">
                  <div className="stat-item">
                    <strong>500+</strong>
                    <span>Happy Pets</span>
                  </div>
                  <div className="stat-divider"></div>
                  <div className="stat-item">
                    <strong>5.0</strong>
                    <span>Rating</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual Column */}
            <div className="hero-visual-display">
              <div className="main-visual-wrapper">
                <div className="morphing-blob-container">
                  <div className="morphing-blob"></div>
                  <img src={logo} alt="Happy pet" className="hero-master-img" />
                </div>

                {/* Floating Benefit Cards */}
                <div className="floating-card feat-1">
                  <div className="f-icon">🚿</div>
                  <div className="f-info">
                    <strong>Bath & Spa</strong>
                    <span>Premium Care</span>
                  </div>
                </div>
                <div className="floating-card feat-2">
                  <div className="f-icon">🏠</div>
                  <div className="f-info">
                    <strong>Home Service</strong>
                    <span>We Come To You</span>
                  </div>
                </div>
                <div className="floating-card feat-3">
                  <div className="f-icon">✂️</div>
                  <div className="f-info">
                    <strong>Expert Cuts</strong>
                    <span>Professional</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose CSJ Section */}
      <section className="why-csj-section" id="why-csj">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose CSJ Pet Mobile?</h2>
            <p>We provide more than just grooming; we provide a luxury experience for your pets.</p>
          </div>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon-circle">🏠</div>
              <h3>Ultimate Convenience</h3>
              <p>We come directly to your home in Lipa City. No more stressful trips to the salon or waiting in traffic.</p>
            </div>
            <div className="why-card">
              <div className="why-icon-circle">🛁</div>
              <h3>State-of-the-Art Van</h3>
              <p>Our grooming truck is fully equipped with heated water, AC, and premium tools for a safe, comfortable session.</p>
            </div>
            <div className="why-card">
              <div className="why-icon-circle">✨</div>
              <h3>One-on-One Attention</h3>
              <p>Your pet is the only one in our care during their session, ensuring a calm, personalized, and cage-free environment.</p>
            </div>
            <div className="why-card">
              <div className="why-icon-circle">🛡️</div>
              <h3>Safe & Sanitary</h3>
              <p>We maintain the highest hygiene standards, deep-cleaning our equipment after every single furbaby.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Before & After Section */}
      <section className="before-after-section">
        <div className="container">
          <div className="section-header">
            <h2>Grooming Transformations</h2>
            <p>Stunning results from our mobile sessions. Hover over any photo to see the magic!</p>
          </div>

          <div className="transformations-slider-container">
            <div className="transformations-track">
              {transformations.map((item) => (
                <div key={item.id} className="transformation-card">
                  <div className="comparison-container sliding-mode card-mode">
                    <div className="before-layer">
                      <img src={item.before} alt={`${item.title} Before`} className="comparison-img before-img" />
                      <div className="label-overlay before">BEFORE</div>
                    </div>
                    <div className="after-layer">
                      <img src={item.after} alt={`${item.title} After`} className="comparison-img after-img" />
                      <div className="label-overlay after">AFTER</div>
                    </div>
                    <div className="slider-handle">
                      <div className="slider-line"></div>
                      <div className="slider-arrow"><span>↔️</span></div>
                    </div>
                    <div className="hover-guide-badge">
                      <span>🖱️ Hover to See After</span>
                    </div>
                  </div>
                  <div className="transformation-info">
                    <h3>{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Modern Haircut Style Lookbook */}
      <section className="haircut-lookbook-section" id="styles">
        <div className="container">
          <div className="section-header">
            <h2>The <span className="text-gradient">Style Lookbook</span></h2>
            <p>Our expert groomers specialize in professional cuts tailored to your pet's breed and personality.</p>
          </div>

          <div className="lookbook-container">
            {/* Dog Styles Collection */}
            <div className="lookbook-category">
              <div className="category-meta">
                <span className="category-tag">Collection 01</span>
                <h3>Dog Haircut Styles</h3>
                <div className="category-desc">From summer refreshers to breed-standard cuts.</div>
              </div>
              <div className="style-scroll-wrapper">
                <div className="style-track">
                  {dogHaircuts.map((cut, idx) => (
                    <div key={idx} className="style-card modern">
                      <div className="style-image-wrap">
                        <img src={cut.img} alt={cut.name} />
                        <div className="style-overlay">
                          <button className="style-book-btn" onClick={() => navigate('/booking')}>
                            Book This Style
                          </button>
                        </div>
                      </div>
                      <div className="style-details">
                        <h4>{cut.name}</h4>
                        <span className="style-pop-tag">Popular choice</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cat Styles Collection */}
            <div className="lookbook-category cat-collection">
              <div className="category-meta">
                <span className="category-tag">Collection 02</span>
                <h3>Cat Grooming Styles</h3>
                <div className="category-desc">Gentle handling for picky felines.</div>
              </div>
              <div className="style-scroll-wrapper">
                <div className="style-track">
                  {catHaircuts.map((cut, idx) => (
                    <div key={idx} className="style-card modern cat-theme">
                      <div className="style-image-wrap">
                        <img src={cut.img} alt={cut.name} />
                        <div className="style-overlay">
                          <button className="style-book-btn" onClick={() => navigate('/booking')}>
                            Book This Style
                          </button>
                        </div>
                      </div>
                      <div className="style-details">
                        <h4>{cut.name}</h4>
                        <span className="style-pop-tag">Feline Favorite</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offering Section */}
      <section className="package-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Full Grooming Offering</h2>
            <p>What's included in every premium mobile session. Comprehensive care for every furbaby.</p>
          </div>
          <div className="package-grid interactive">
            {packageInclusions.map((item, index) => (
              <div key={index} className="package-item modern hovering-effect">
                <div className="item-icon-wrap">
                  <span className="item-emoji">{item.emoji}</span>
                </div>
                <div className="item-text-wrap">
                  <span className="item-label">{item.label}</span>
                </div>
                <div className="hover-reveal-content">
                  <img src={item.image} alt={item.label} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Tabbed */}
      <section className="pricing-section">
        <div className="container">
          <div className="section-header">
            <h2>Transparent Pricing</h2>
            <p>Our rates are clear, honest, and competitive. No hidden fees for our Lipa City families.</p>
          </div>

          <div className="pricing-tabs">
            <button
              className={`tab-btn ${pricingTab === 'standard' ? 'active' : ''}`}
              onClick={() => setPricingTab('standard')}
            >
              Standard Rates
            </button>
            <button
              className={`tab-btn ${pricingTab === 'special' ? 'active' : ''}`}
              onClick={() => setPricingTab('special')}
            >
              Special Breed Rates
            </button>
          </div>

          <div className="pricing-display-area">
            {pricingTab === 'standard' ? (
              <div className="pricing-grids-container">
                {getPricingDog().map((item, index) => (
                  <div key={index} className="pet-category-card">
                    <div className="card-image-wrap">
                      <img src={item.img} alt={`${item.size} dog`} />
                    </div>
                    <div className="card-info">
                      <h3 className="card-item-title">{item.size} Dog</h3>
                      <div className="price-label">Starts at</div>
                      <span className="price">Php {item.price}</span>
                      <button className="btn-small" onClick={() => navigate('/booking')}>Select</button>
                    </div>
                  </div>
                ))}
                <div className="pet-category-card cat-card">
                  <div className="card-image-wrap">
                    <img src="/assets/images/cat_premium.png" alt="Cat grooming" />
                  </div>
                  <div className="card-info">
                    <h3 className="card-item-title">Cat Grooming</h3>
                    <div className="price-label">Flat Rate</div>
                    <span className="price">Php {getCatPrice()}</span>
                    <button className="btn-small" onClick={() => navigate('/booking')}>Select</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="special-rates-grid">
                {getSpecialRates().map((item, index) => (
                  <div key={index} className="special-rate-card-horizontal">
                    <div className="breed-info">
                      <span className="breed-icon-small">⭐</span>
                      <h4>{item.breed}</h4>
                    </div>
                    <div className="rate-info">
                      <span className="price-tag">Php {item.price}</span>
                      <button className="book-btn-inline" onClick={() => navigate('/booking')}>Book Now</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
