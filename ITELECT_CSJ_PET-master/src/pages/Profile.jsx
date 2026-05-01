import React, { useState, useEffect } from 'react';
import '../css/Profile.css';
import '../css/PawBackground.css';
import { useNavigate } from 'react-router-dom';
import { logout } from '../routes/routeGuards';

const Profile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [selectedIdImage, setSelectedIdImage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  // Reschedule state
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  // Fixed base time slots
  const baseTimeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];
  const [availableTimeSlots, setAvailableTimeSlots] = useState(baseTimeSlots);

  // Get current user from localStorage on component mount
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      const user = userStr ? JSON.parse(userStr) : null;
      if (user) {
        setCurrentUser(user);
        setUserStats(prev => ({
          ...prev,
          firstName: user.fullName.split(' ')[0] // Get first name
        }));
      } else {
        // If no user is logged in, redirect to login
        navigate('/login');
      }
    } catch (error) {
      console.warn("Could not parse currentUser from localStorage", error);
      localStorage.removeItem('currentUser');
      navigate('/login');
    }
  }, [navigate]);

  // Logout function
  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  // Dynamic user stats based on actual bookings
  const [userStats, setUserStats] = useState({
    cancelledBookings: 0,
    rewardPoints: 0,
    rewardCode: null,
    codeUsed: 0
  });

  // Comprehensive Bookings State with status: 'Pending', 'Accepted', 'Completed', 'Cancelled'
  // For new users, start with empty bookings array
  const [bookings, setBookings] = useState([]);

  // Calculate stats whenever bookings change
  useEffect(() => {
    const completed = bookings.filter(b => b.status === 'Completed');
    const cancelled = bookings.filter(b => b.status === 'Cancelled');

    setUserStats(prev => ({
      ...prev,
      totalBookings: bookings.length,
      completedBookings: completed.length,
      cancelledBookings: cancelled.length
    }));
  }, [bookings]);

  // Fetch actual customer rewards data
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchRewards = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/customers/${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          // Ensure data is valid before setting state
          if (data && typeof data === 'object' && !data.error) {
            setUserStats(prev => ({
              ...prev,
              rewardPoints: data.rewardPoints || 0,
              rewardCode: data.rewardCode || null,
              codeUsed: data.codeUsed || 0
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
      }
    };
    fetchRewards();
  }, [currentUser]);

  const handleRedeem = async () => {
    if (userStats.rewardCode) {
      alert("You already have an active reward code!");
      return;
    }
    if (userStats.rewardPoints < 10) {
      alert("You need 10 points to redeem a reward!");
      return;
    }

    try {
      const res = await fetch('http://127.0.0.1:5000/api/customers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: currentUser.id })
      });
      const data = await res.json();
      if (data.success) {
        setUserStats(prev => ({
          ...prev,
          rewardPoints: prev.rewardPoints - 10,
          rewardCode: data.code
        }));
        alert(`Success! Your reward code is: ${data.code}. Use it on your next booking!`);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Redemption error:", err);
    }
  };

  // Derived booking lists
  const upcomingAppointmentsRaw = bookings.filter(b => b.status === 'Pending' || b.status === 'Accepted');
  const pastAppointmentsRaw = bookings.filter(b => b.status === 'Completed' || b.status === 'Cancelled');

  const upcomingAppointments = upcomingAppointmentsRaw;
  const pastAppointments = pastAppointmentsRaw;

  // Load bookings from API on mount
  useEffect(() => {
    // We must wait for currentUser to be loaded
    if (!currentUser) return;

    const fetchBookings = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/bookings');
        const allBookings = await response.json();

        // Safety check: Ensure allBookings is an array
        if (!Array.isArray(allBookings)) {
          console.error("Expected array from /api/bookings but got:", allBookings);
          setBookings([]);
          return;
        }

        // Filter bookings by current user's name
        const clientName = currentUser.fullName || currentUser.name;

        // Filter bookings by current user's ID (or fallback to name if ID missing)
        const userBookings = allBookings
          .filter(b => (b.customerId && b.customerId === currentUser.id) || (!b.customerId && b.clientName === (currentUser.fullName || currentUser.name)))
          .map(b => ({
            ...b,
            status: b.status.charAt(0).toUpperCase() + b.status.slice(1)
          }));

        setBookings(userBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, [currentUser]);

  // Actions
  const handleBooking = () => navigate('/booking');
  const handleReviews = () => navigate('/reviews');

  const handleCancelBooking = async (id) => {
    const booking = bookings.find(b => b.id === id);
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await fetch(`http://127.0.0.1:5000/api/bookings/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Cancelled' })
        });
        const updatedBookings = bookings.map(b =>
          b.id === id
            ? { ...b, status: 'Cancelled' }
            : b
        );
        setBookings(updatedBookings);
        setSelectedBookingDetails(null);
      } catch (error) {
        console.error("Failed to cancel booking:", error);
      }
    }
  };

  // Fetch available slots for rescheduling
  useEffect(() => {
    const fetchAvailable = async () => {
      if (!newDate || !rescheduleBookingId) return;

      const booking = bookings.find(b => b.id === rescheduleBookingId);
      if (!booking) return;

      try {
        const res = await fetch(`http://127.0.0.1:5000/api/available-slots?date=${newDate}&service=${encodeURIComponent(booking.service)}`);
        if (res.ok) {
          const data = await res.json();
          // The API returns a direct array, not { available_slots: [...] }
          setAvailableTimeSlots(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching available slots:", error);
      }
    };
    fetchAvailable();
  }, [newDate, rescheduleBookingId, bookings]);

  const handleRescheduleSubmit = async () => {
    if (!newDate || !newTime) {
      alert('Please select a new date and time.');
      return;
    }

    try {
      const bookingToUpdate = bookings.find(b => b.id === rescheduleBookingId);

      const response = await fetch(`http://127.0.0.1:5000/api/bookings/${rescheduleBookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: bookingToUpdate.service,
          date: newDate,
          time: newTime,
          status: bookingToUpdate.status || 'Pending'
        })
      });

      const result = await response.json();
      if (!response.ok) {
        alert(`❌ ${result.message || 'Failed to update booking'}`);
        return;
      }

      const updatedBookings = bookings.map(b => {
        if (b.id === rescheduleBookingId) {
          return { ...b, date: newDate, time: newTime };
        }
        return b;
      });

      setBookings(updatedBookings);

      // Update details view if currently looking at it
      if (selectedBookingDetails && selectedBookingDetails.id === rescheduleBookingId) {
        setSelectedBookingDetails({ ...selectedBookingDetails, date: newDate, time: newTime });
      }

      alert('✅ Appointment rescheduled successfully!');
      setRescheduleBookingId(null);
      setNewDate('');
      setNewTime('');
    } catch (error) {
      console.error("Failed to reschedule:", error);
      alert('❌ Failed to reschedule. Please try again.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Accepted': return 'accepted';
      case 'Pending': return 'pending';
      case 'Completed': return 'completed';
      case 'Cancelled': return 'cancelled';
      default: return '';
    }
  };

  return (
    <div className="profile-container">


      {/* ── Welcome Header ── */}
      <div className="profile-header">
        <div className="welcome-section">
          <h1>👋 Welcome back, {userStats.firstName}!</h1>
          <p>Manage your grooming appointments here</p>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>You are currently</span>
            <span style={{
              backgroundColor: userStats.codeUsed >= 2 ? '#fef3c7' : userStats.codeUsed === 1 ? '#f1f5f9' : '#fff7ed',
              color: userStats.codeUsed >= 2 ? '#92400e' : userStats.codeUsed === 1 ? '#475569' : '#9a3412',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 'bold',
              border: `1px solid ${userStats.codeUsed >= 2 ? '#fde68a' : userStats.codeUsed === 1 ? '#e2e8f0' : '#ffedd5'}`
            }}>
              {userStats.codeUsed >= 2 ? "🥇 Gold" : userStats.codeUsed === 1 ? "🥈 Silver" : "🥉 Bronze"} Tier
            </span>
          </div>
        </div>
        <div className="quick-actions">
          <button className="primary-action-btn" onClick={handleBooking}>
            📅 Book Appointment
          </button>
        </div>
      </div>

      {/* ── Stats Overview ── */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{upcomingAppointments.length}</h3>
            <p>Upcoming Appointments</p>
            <small>{bookings.filter(b => b.status === 'Accepted').length} Confirmed</small>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{userStats.completedBookings}</h3>
            <p>Completed Services</p>
            <small>{userStats.totalBookings - userStats.completedBookings - userStats.cancelledBookings} Pending</small>
          </div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon">{userStats.codeUsed >= 2 ? "🥇" : userStats.codeUsed === 1 ? "🥈" : "🥉"}</div>
          <div className="stat-content">
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>You are currently</p>
            <h3 style={{ margin: '2px 0' }}>{userStats.codeUsed >= 2 ? "Gold" : userStats.codeUsed === 1 ? "Silver" : "Bronze"} Tier</h3>
            <small>{userStats.rewardPoints} Loyalty Points</small>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Dashboard Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          Upcoming Appointments
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Booking History
        </button>
      </div>

      {/* ── Tab Content ── */}
      <div className="profile-content">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="overview-grid">
              {/* Recent Activity */}
              <div className="overview-card">
                <h3>🐾 Recent Activity</h3>
                <div className="activity-list">
                  {[...upcomingAppointments, ...pastAppointments].slice(0, 3).map((act, i) => (
                    <div key={i} className="activity-item">
                      <div className="activity-icon">
                        {act.status === 'Accepted' || act.status === 'Pending' ? '📅' : act.status === 'Completed' ? '✅' : '❌'}
                      </div>
                      <div className="activity-text">
                        <strong>
                          {act.pets?.length > 1
                            ? `${act.pets.length} Pets (${act.pets[0].petName} & others)`
                            : act.pets?.[0]?.petName || act.petName}
                        </strong>
                        <span className="activity-status"> - {act.status}</span>
                        <span className="activity-date">
                          {act.date} at {act.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Loyalty Points Summary */}
              <div className="overview-card">
                <h3>⭐ Loyalty Rewards</h3>
                <div className="loyalty-summary">
                  <div className="points-display">
                    <span className="points-number">{userStats.rewardPoints}</span>
                    <span className="points-label"> Points Earned</span>
                  </div>
                  <div className="points-info">
                    <p>You earn <strong>1 point</strong> for every completed service!</p>
                    <p>Current balance: <strong>{userStats.rewardPoints} / 10</strong> points to next reward.</p>

                    {userStats.rewardCode ? (
                      <div className="active-code-display" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#15803d' }}>
                          Active Reward ({userStats.codeUsed >= 2 ? "Gold" : userStats.codeUsed === 1 ? "Silver" : "Bronze"} Tier):
                        </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#166534', letterSpacing: '2px' }}>{userStats.rewardCode}</span>
                        <p style={{ fontSize: '0.75rem', color: '#15803d', margin: '0.5rem 0 0' }}>
                          Use this code at checkout to get
                          <strong> {userStats.codeUsed >= 2 ? "100% (FREE)" : userStats.codeUsed === 1 ? "30%" : "10%"} OFF </strong>
                          your most expensive pet service!
                        </p>
                      </div>
                    ) : (
                      <div className="redeem-section" style={{ marginTop: '1rem' }}>
                        <button
                          className="redeem-btn"
                          onClick={handleRedeem}
                          disabled={userStats.rewardPoints < 10}
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: userStats.rewardPoints >= 10 ? '#facc15' : '#e2e8f0',
                            color: userStats.rewardPoints >= 10 ? '#000' : '#94a3b8',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: userStats.rewardPoints >= 10 ? 'pointer' : 'not-allowed'
                          }}
                        >
                          🎁 {userStats.rewardPoints >= 10 ? 'Redeem 10 Points' : 'Collect 10 points to redeem'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPCOMING APPOINTMENTS TAB */}
        {activeTab === 'appointments' && (
          <div className="appointments-content">
            {upcomingAppointments.length > 0 ? (
              <div className="appointments-list">
                {upcomingAppointments.map(booking => (
                  <div key={booking.id} className="appointment-card">
                    <div className="appointment-header">
                      <div className="appointment-title-row">
                        <span className="pet-emoji">
                          {booking.pets ?
                            (booking.pets.length > 1 ? '🐕🐈' :
                              booking.pets[0]?.petSpecies === 'Cat' ? '🐈' : '🐕') :
                            '🐾'
                          }
                        </span>
                        <h3>
                          {booking.pets ?
                            (booking.pets.length > 1 ?
                              `${booking.pets.length} Pets` :
                              booking.pets[0]?.petName) :
                            'Pet'
                          }
                        </h3>
                      </div>
                      <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>{booking.status}</span>
                    </div>
                    <div className="appointment-service">
                      {booking.pets && booking.pets.length > 1 && (
                        <div className="multi-pet-summary">
                          <p>🐾 Multiple pets booked:</p>
                          <ul className="pet-list-mini">
                            {booking.pets.slice(0, 3).map((pet, i) => (
                              <li key={i}>
                                {pet.petSpecies === 'Cat' ? '🐈' : '🐕'} <strong>{pet.petName}</strong> - {pet.service}
                              </li>
                            ))}
                            {booking.pets.length > 3 && (
                              <li>+{booking.pets.length - 3} more pets</li>
                            )}
                          </ul>
                        </div>
                      )}
                      {booking.pets && booking.pets.length === 1 && (
                        <>
                          <h4>✨ {booking.pets[0].service}</h4>
                          <p>🐾 Breed: {booking.pets[0].breed || 'N/A'}</p>
                          <p>📅 Age: {booking.pets[0].petAge} {booking.pets[0].petAgeUnit || 'years'}</p>
                        </>
                      )}
                    </div>
                    <div className="appointment-footer">
                      <div className="appointment-info">
                        <p>📅 {booking.date}</p>
                        <p>🕒 {booking.time}</p>
                      </div>
                      <div className="appointment-price">
                        <span>Total Price:</span>
                        <span className="price-value">₱{(booking.totalPrice || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="appointment-actions">
                      <button className="view-btn" onClick={() => setSelectedBookingDetails(booking)}>
                        View Details
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancelBooking(booking.id)}
                        title="Cancel appointment"
                      >
                        Cancel
                      </button>
                      <button
                        className="reschedule-btn"
                        style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => setRescheduleBookingId(booking.id)}
                        title="Reschedule appointment"
                      >
                        Reschedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-appointments">
                <h3>No upcoming appointments</h3>
                <p>Book your next appointment to keep your pet looking great!</p>
                <button className="book-now-btn" onClick={handleBooking}>
                  Book Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* BOOKING HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="history-content">
            {pastAppointments.length > 0 ? (
              <div className="history-list">
                {pastAppointments.map(booking => (
                  <div key={booking.id} className="history-card">
                    <div className="history-header">
                      <div className="appointment-title-row">
                        <span className="pet-emoji">
                          {booking.pets && booking.pets.length > 0 ? 
                            (booking.pets.length > 1 ? '🐕🐈' : (booking.pets[0].petSpecies === 'Dog' ? '🐕' : '🐈')) : 
                            (booking.petSpecies === 'Dog' ? '🐕' : '🐈')}
                        </span>
                        <h3>
                          {booking.pets && booking.pets.length > 0 ? 
                            (booking.pets.length > 1 ? `${booking.pets.length} Pets` : booking.pets[0].petName) : 
                            booking.petName}
                        </h3>
                      </div>
                      <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="history-details">
                      {booking.pets && booking.pets.length > 1 ? (
                        <div className="multi-pet-summary">
                          <p>🐾 Multiple pets booked:</p>
                          <ul className="pet-list-mini">
                            {booking.pets.slice(0, 3).map((pet, i) => (
                              <li key={i}>
                                {pet.petSpecies === 'Cat' ? '🐈' : '🐕'} <strong>{pet.petName}</strong> - {pet.service}
                              </li>
                            ))}
                            {booking.pets.length > 3 && (
                              <li>+{booking.pets.length - 3} more pets</li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        <>
                          <h4>
                            {booking.pets && booking.pets.length === 1 ? 
                              booking.pets[0].service : 
                              booking.service}
                          </h4>
                          <p>🐾 Breed: {booking.pets && booking.pets.length === 1 ? (booking.pets[0].breed || 'N/A') : (booking.breed || 'N/A')}</p>
                        </>
                      )}
                      <p>📅 {booking.date} at {booking.time}</p>
                    </div>
                    <div className="history-price">
                      <h4>Php {booking.totalPrice || booking.price}</h4>
                    </div>
                    <div className="history-actions">
                      {booking.status === 'Completed' && (
                        <button className="review-btn" onClick={handleReviews}>
                          Leave Review
                        </button>
                      )}
                      <button className="redo-btn" onClick={handleBooking}>
                        Book Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-appointments">
                <h3>No booking history</h3>
                <p>You haven't completed any grooming sessions yet.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── BOOKING DETAILS MODAL ── */}
      {selectedBookingDetails && (
        <div className="modal-overlay" onClick={() => setSelectedBookingDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Booking Details</h2>
              <button className="modal-close" onClick={() => setSelectedBookingDetails(null)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Pet Information */}
              <div className="detail-section">
                <h3>🐾 Pet Information</h3>
                {selectedBookingDetails.pets ? (
                  // Multi-pet booking
                  <div className="pets-detail-list">
                    {selectedBookingDetails.pets.map((pet, idx) => (
                      <div key={idx} className="pet-detail-card" style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <strong>{pet.petSpecies === 'Cat' ? '🐈' : '🐕'} {pet.petName}</strong>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{pet.service}</span>
                        </div>
                        <div className="detail-grid">
                          <div className="detail-row">
                            <span className="detail-label">Breed:</span>
                            <span className="detail-value">{pet.breed || 'N/A'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Age:</span>
                            <span className="detail-value">{pet.petAge} {pet.petAgeUnit || 'years'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="detail-label">Price:</span>
                            <span className="detail-value highlight">Php {(pet.price || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Single pet booking (backward compatibility)
                  <div className="detail-grid">
                    <div className="detail-row">
                      <span className="detail-label">Pet Name:</span>
                      <span className="detail-value">{selectedBookingDetails.petName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Pet Type:</span>
                      <span className="detail-value">{selectedBookingDetails.petType}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Breed:</span>
                      <span className="detail-value">{selectedBookingDetails.petBreed}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Age:</span>
                      <span className="detail-value">{selectedBookingDetails.petAge} years</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Service Information */}
              <div className="detail-section">
                <h3>💰 Billing Information</h3>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Total Amount:</span>
                    <span className="detail-value highlight">Php {(selectedBookingDetails.totalPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Booking Status:</span>
                    <span className={`detail-value status ${selectedBookingDetails.status.toLowerCase()}`}>
                      {selectedBookingDetails.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Appointment Schedule */}
              <div className="detail-section">
                <h3>📅 Appointment Schedule</h3>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{selectedBookingDetails.date}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{selectedBookingDetails.time}</span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="detail-section">
                <h3>📍 Location Details</h3>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">House No:</span>
                    <span className="detail-value">{selectedBookingDetails.houseNumber || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Barangay:</span>
                    <span className="detail-value">{selectedBookingDetails.barangay || '—'}</span>
                  </div>
                  {selectedBookingDetails.purok && (
                    <div className="detail-row">
                      <span className="detail-label">Purok:</span>
                      <span className="detail-value">{selectedBookingDetails.purok}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Landmark:</span>
                    <span className="detail-value">{selectedBookingDetails.landmark || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Owner Information with ID Documents */}
              <div className="detail-section">
                <h3>👤 Owner Information & Identification</h3>
                <div className="detail-grid">
                  <div className="detail-row">
                    <span className="detail-label">First Name:</span>
                    <span className="detail-value">{selectedBookingDetails.firstName || 'N/A'}</span>
                  </div>
                  {selectedBookingDetails.middleName && (
                    <div className="detail-row">
                      <span className="detail-label">Middle Name:</span>
                      <span className="detail-value">{selectedBookingDetails.middleName}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Last Name:</span>
                    <span className="detail-value">{selectedBookingDetails.lastName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value">
                      {[selectedBookingDetails.firstName, selectedBookingDetails.middleName, selectedBookingDetails.lastName]
                        .filter(Boolean).join(' ') || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Contact Number:</span>
                    <span className="detail-value">{selectedBookingDetails.phone || 'N/A'}</span>
                  </div>

                  {/* ID Images - Inline */}
                  <div className="detail-row full-width">
                    <span className="detail-label">🪪 Valid Identification (Front & Back)</span>
                    <div className="inline-id-thumbnails">
                      {selectedBookingDetails.idFront ? (
                        <div className="inline-id-thumb">
                          <img
                            src={selectedBookingDetails.idFront}
                            alt="Front ID"
                            onClick={() => setSelectedIdImage({ data: selectedBookingDetails.idFront, side: 'Front' })}
                            title="Click to view Front ID"
                          />
                          <small>Front</small>
                        </div>
                      ) : (
                        <div className="inline-id-thumb placeholder">
                          <div style={{ fontSize: '1.5rem' }}>📷</div>
                          <small>Front ID missing</small>
                        </div>
                      )}

                      {selectedBookingDetails.idBack ? (
                        <div className="inline-id-thumb">
                          <img
                            src={selectedBookingDetails.idBack}
                            alt="Back ID"
                            onClick={() => setSelectedIdImage({ data: selectedBookingDetails.idBack, side: 'Back' })}
                            title="Click to view Back ID"
                          />
                          <small>Back</small>
                        </div>
                      ) : (
                        <div className="inline-id-thumb placeholder">
                          <div style={{ fontSize: '1.5rem' }}>📷</div>
                          <small>Back ID missing</small>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBookingDetails.specialRequests && (
                <div className="detail-section">
                  <h3>📝 Special Requests</h3>
                  <p className="special-requests-text">{selectedBookingDetails.specialRequests}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {(selectedBookingDetails.status === 'Pending' || selectedBookingDetails.status === 'Accepted') && (
                <button
                  className="modal-cancel-btn"
                  onClick={() => {
                    handleCancelBooking(selectedBookingDetails.id);
                  }}
                >
                  Cancel Appointment
                </button>
              )}
              <button className="modal-close-btn" onClick={() => setSelectedBookingDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID IMAGE VIEWER MODAL */}
      {selectedIdImage && (
        <div className="image-viewer-overlay" onClick={() => setSelectedIdImage(null)}>
          <div className="image-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-viewer-header">
              <h3>Lado {selectedIdImage.ladoNum} ({selectedIdImage.side})</h3>
              <button className="close-btn" onClick={() => setSelectedIdImage(null)}>✕</button>
            </div>
            <div className="image-viewer-content">
              <img src={selectedIdImage.data} alt={`Lado ${selectedIdImage.ladoNum}`} className="full-image" />
              <p className="image-name">{selectedIdImage.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleBookingId && (
        <div className="modal-overlay" onClick={() => setRescheduleBookingId(null)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📅 Reschedule Appointment</h2>
              <button className="modal-close" onClick={() => setRescheduleBookingId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select New Date</label>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select New Time</label>
                <select
                  className="form-control"
                  style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }}
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                >
                  <option value="">Select Time</option>
                  {availableTimeSlots?.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="modal-close-btn" onClick={() => setRescheduleBookingId(null)}>Cancel</button>
              <button onClick={handleRescheduleSubmit} style={{ background: '#28a745', color: 'white', padding: '0.8rem 1.5rem', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
