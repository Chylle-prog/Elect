import React, { useState, useEffect } from 'react';
import '../css/Reviews.css';
import '../css/PawBackground.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import R1 from '../img/2.jpg?v=1';
import R2 from '../img/3.jpg?v=1';
import R3 from '../img/4.jpg?v=1';
import R4 from '../img/6.jpg?v=1';

const Reviews = () => {
  const navigate = useNavigate();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [filterRating, setFilterRating] = useState(0);
  const [editingReview, setEditingReview] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login status
  const [currentUser, setCurrentUser] = useState(null); // Current logged-in user object
  const [userPets, setUserPets] = useState([]); // User's pets for selection
  const [justPostedReviewId, setJustPostedReviewId] = useState(null); // Track newly posted review
  const [selectedImage, setSelectedImage] = useState(null); // For image viewer modal
  const [newReview, setNewReview] = useState({
    petId: '',
    petName: '',
    petBreed: '',
    rating: 5,
    text: '',
    location: 'Lipa City',
    images: []
  });

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reviews from API
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/reviews');
      const data = await response.json();
      if (Array.isArray(data)) {
        setReviews(data);
      } else {
        console.error('Expected array from /api/reviews but got:', data);
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchUserPets = async (customerId) => {
    if (!customerId) return;
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/customers/${customerId}/pets`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setUserPets(data);
      } else {
        console.error('Expected array for pets but got:', data);
        setUserPets([]);
      }
    } catch (error) {
      console.error('Error fetching user pets:', error);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      fetchUserPets(user.id);
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);


  }, []);

  const renderStars = (count, interactive = false, onChange = null, showNumbers = false) => {
    if (interactive) {
      return (
        <div className="interactive-stars">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= count ? 'active' : ''}`}
              onClick={() => onChange && onChange(star)}
            >
              <span className="star-icon">⭐</span>
              {showNumbers && <span className="star-number">{star}</span>}
            </button>
          ))}
        </div>
      );
    }
    return (
      <div className="static-stars">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={`star ${star <= count ? 'active' : ''}`}>
            {showNumbers ? `${star}⭐` : '⭐'}
          </span>
        ))}
      </div>
    );
  };

  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const filteredReviews = filterRating === 0
    ? safeReviews
    : safeReviews.filter(review => review.rating === filterRating);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setNewReview(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls].slice(0, 5) // Max 5 images
    }));
  };

  const removeImage = (index) => {
    setNewReview(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!newReview.petId || !newReview.text) {
      alert('Please select a pet and enter your review text.');
      return;
    }

    if (!isLoggedIn) {
      alert('You must be logged in to post a review');
      navigate('/login');
      return;
    }

    // Convert image blobs to data URLs for persistence
    const processImages = async () => {
      const processedImages = [];
      for (const image of newReview.images) {
        if (image.startsWith('blob:')) {
          try {
            const response = await fetch(image);
            const blob = await response.blob();
            const dataUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
            processedImages.push(dataUrl);
          } catch (error) {
            console.error('Error processing image:', error);
            processedImages.push(image);
          }
        } else {
          processedImages.push(image);
        }
      }
      return processedImages;
    };

    try {
      const processedImages = await processImages();
      console.log('Sending processed images:', processedImages.map(img => img.substring(0, 50) + '...'));
      
      const response = await fetch('http://127.0.0.1:5000/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: currentUser.id,
          pet_id: newReview.petId,
          rating: newReview.rating,
          text: newReview.text,
          images: processedImages
        })
      });

      if (response.ok) {
        await fetchReviews();
        setShowReviewForm(false);
        setNewReview({
          petId: '',
          petName: '',
          petBreed: '',
          rating: 5,
          text: '',
          location: 'Lipa City',
          images: []
        });
      } else {
        alert('Failed to post review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error connecting to server');
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setNewReview({
      name: review.name,
      pet: review.pet,
      rating: review.rating,
      text: review.text,
      location: review.location,
      images: review.images || []
    });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        const response = await fetch(`http://127.0.0.1:5000/api/reviews/${reviewId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setReviews(prev => prev.filter(review => review.id !== reviewId));
        }
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  const isReviewOwner = (review) => {
    return isLoggedIn && review.customer_id === currentUser?.id;
  };

  const handleWriteReview = async () => {
    if (!isLoggedIn) {
      alert('You must be logged in to share your experience!');
      navigate('/login');
      return;
    }
    if (currentUser?.id) {
      // First, make sure we have the latest pet list
      const response = await fetch(`http://127.0.0.1:5000/api/customers/${currentUser.id}/pets`);
      const pets = await response.json();
      
      const safePets = Array.isArray(pets) ? pets : [];
      setUserPets(safePets);
      
      if (safePets.length === 0) {
        alert('You can only leave a review after your pet has a COMPLETED service. Please wait for your booking to be marked as completed by the admin.');
        return;
      }
    }
    setShowReviewForm(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('currentUser');
    window.location.reload();
  };

  return (
    <div className="reviews-page">


      <header className="reviews-hero">
        <div className="container">
          <div className="reviews-hero-content">
            <span className="badge">Testimonials</span>
            <h1>What Our <span className="text-gradient">Customers Say</span></h1>
            <p>Read honest feedback from pet parents in Lipa City who have experienced CSJ Pet Mobile luxury service.</p>
          </div>
        </div>
      </header>

      <div className="reviews-sections-container">
        <section className="reviews-card-section list-section">
          <div className="container">
            <div className="reviews-meta-header">
              <div className="rating-pill">4.9 / 5.0 Rating</div>
              <div className="user-section">
                <span className="anonymous-welcome">🌟 Anyone can leave a review!</span>
                <button
                  className="write-review-btn"
                  onClick={handleWriteReview}
                >
                  ✍️ Write a Review
                </button>
              </div>
            </div>

            {/* Star Filter Section */}
            <div className="star-filter-section">
              <h3>Filter by Rating</h3>
              <div className="filter-stars">
                <button
                  className={`filter-btn ${filterRating === 0 ? 'active' : ''}`}
                  onClick={() => setFilterRating(0)}
                >
                  All Reviews
                </button>
                {[5, 4, 3, 2, 1].map(rating => (
                  <button
                    key={rating}
                    className={`filter-btn ${filterRating === rating ? 'active' : ''}`}
                    onClick={() => setFilterRating(rating)}
                  >
                    {rating} ⭐
                  </button>
                ))}
              </div>
              {filterRating > 0 && (
                <div className="filter-info">
                  Showing {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''} with {filterRating} star{filterRating !== 1 ? 's' : ''}
                  <button className="clear-filter" onClick={() => setFilterRating(0)}>
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Review Form Modal */}
            {showReviewForm && (
              <div className="review-modal-overlay" onClick={() => setShowReviewForm(false)}>
                <div className="review-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>{editingReview ? '✏️ Edit Review' : '✍️ Share Your Experience'}</h3>
                    <button
                      className="close-modal"
                      onClick={() => {
                        setShowReviewForm(false);
                        setEditingReview(null);
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSubmitReview} className="review-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Your Name</label>
                        <div className="user-name-display" style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#64748b' }}>
                          {currentUser?.fullName || 'Please login first'}
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Select Your Pet *</label>
                        <select
                          name="petId"
                          value={newReview.petId}
                          onChange={(e) => {
                            const safePets = Array.isArray(userPets) ? userPets : [];
                            const pet = safePets.find(p => p.pet_id === parseInt(e.target.value));
                            if (pet) {
                              setNewReview(prev => ({ 
                                ...prev, 
                                petId: pet.pet_id,
                                petName: pet.pet_name,
                                petBreed: pet.breed
                              }));
                            }
                          }}
                          required
                          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        >
                          <option value="">-- Choose a Pet --</option>
                          {Array.isArray(userPets) && userPets.map(pet => (
                            <option key={pet.pet_id} value={pet.pet_id}>
                              {pet.pet_name} ({pet.breed})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Rating *</label>
                      {renderStars(newReview.rating, true, (rating) =>
                        setNewReview(prev => ({ ...prev, rating })), true
                      )}
                      <div className="rating-text">Selected: {newReview.rating} star{newReview.rating !== 1 ? 's' : ''}</div>
                    </div>

                    <div className="form-group">
                      <label>Your Review *</label>
                      <textarea
                        name="text"
                        value={newReview.text}
                        onChange={handleInputChange}
                        placeholder="Tell us about your experience..."
                        rows="4"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Add Photos (Max 5)</label>
                      <div className="image-upload-area">
                        <input
                          type="file"
                          id="review-images"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="review-images" className="upload-btn">
                          📷 Add Photos
                        </label>

                        <div className="image-preview-grid">
                          {newReview.images.map((image, index) => (
                            <div key={index} className="image-preview">
                              <img src={image} alt={`Preview ${index + 1}`} />
                              <button
                                type="button"
                                className="remove-image"
                                onClick={() => removeImage(index)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="button" onClick={() => {
                        setShowReviewForm(false);
                        setEditingReview(null);
                      }}>
                        Cancel
                      </button>
                      <button type="submit" className="submit-review-btn">
                        {editingReview ? '💾 Update Review' : '🐾 Submit Review'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Image Viewer Modal */}
            {selectedImage && (
              <div className="image-viewer-overlay" onClick={() => setSelectedImage(null)}>
                <div className="image-viewer-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="image-viewer-header">
                    <h3>📷 Review Photo</h3>
                    <button
                      className="close-image-viewer"
                      onClick={() => setSelectedImage(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="image-viewer-content">
                    <img
                      src={selectedImage}
                      alt="Review photo"
                      className="full-size-image"
                    />
                  </div>
                  <div className="image-viewer-footer">
                    <button
                      className="close-viewer-btn"
                      onClick={() => setSelectedImage(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="reviews-grid">
              {filteredReviews.length > 0 ? (
                filteredReviews.map(review => (
                  <div key={review.id} className={`modern-review-card ${justPostedReviewId === review.id ? 'just-posted' : ''}`}>
                    {justPostedReviewId === review.id && (
                      <div className="just-posted-badge">
                        ✨ Just Posted! You can edit or delete this review.
                      </div>
                    )}
                    <div className="review-top">
                      <div className="review-user-info">
                        <div className="user-initial">{review.name === 'Anonymous' ? '👤' : review.name.charAt(0)}</div>
                        <div className="user-name">
                          <h4>{review.name}</h4>
                          <span>{review.date}</span>
                        </div>
                      </div>
                      <div className="review-header-right">
                        <div className="review-stars">{renderStars(review.rating)}</div>
                        {(isReviewOwner(review) || justPostedReviewId === review.id) && (
                          <div className="review-actions">
                            <button
                              className="edit-review-btn"
                              onClick={() => handleEditReview(review)}
                              title="Edit review"
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-review-btn"
                              onClick={() => handleDeleteReview(review.id)}
                              title="Delete review"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="review-body">
                      <p className="pet-tag">
                        {review.species === 'Cat' ? '🐈' : '🐕'} {review.pet}
                      </p>
                      <p className="review-text">"{review.text}"</p>
                    </div>

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="review-images">
                        <div className="image-gallery">
                          {review.images.map((image, index) => image && (
                            <div key={index} className="review-image">
                              <img
                                src={image}
                                alt={`Review ${index + 1}`}
                                onClick={() => setSelectedImage(image)}
                                style={{ cursor: 'pointer' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="review-bottom">
                      <span className="location-tag">📍 {review.location}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-reviews-message">
                  <h3>No reviews found</h3>
                  <p>
                    {filterRating > 0
                      ? `No reviews with ${filterRating} star${filterRating !== 1 ? 's' : ''} yet.`
                      : 'Be the first to leave a review!'}
                  </p>
                  {filterRating > 0 && (
                    <button className="clear-filter-btn" onClick={() => setFilterRating(0)}>
                      View All Reviews
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Highlight Section */}
        <section className="reviews-card-section highlight-review">
          <div className="container">
            <div className="highlight-content">
              <h2>Join Our 500+ Happy Clients</h2>
              <p>We take pride in every wagging tail and happy purr we encounter in our mobile spa.</p>
              <div className="stat-pills">
                <div className="pill"><span>⭐</span> Top Rated</div>
                <div className="pill"><span>✂️</span> Expert Care</div>
                <div className="pill"><span>🚛</span> Mobile Convenience</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Reviews;
