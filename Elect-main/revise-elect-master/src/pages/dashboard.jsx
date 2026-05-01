import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/dashboard.css';
import csjLogo from '../csjlogo.png';

const API_BASE = 'http://127.0.0.1:5000/api';

const getPrice = (breed, size, servicesList = []) => {
    const sizeService = servicesList.find(s => s.type === 'Size' && s.name.includes(size));
    const breedService = servicesList.find(s => s.type === 'Breed' && s.name.includes(breed));
    const sizeRate = sizeService ? sizeService.price : 0;
    const breedRate = breedService ? breedService.price : 0;
    return sizeRate + breedRate;
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState('overall');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [overallView, setOverallView] = useState('main');
    const [showOverallSubmenu, setShowOverallSubmenu] = useState(true);

    // Data States
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyGrowth: 0,
        activeClients: 0,
        completedServices: 0,
        dailyTasks: 0
    });
    const [bookings, setBookings] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [fullBarangayData, setFullBarangayData] = useState([]);

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [modalContext, setModalContext] = useState('');
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editingServiceId, setEditingServiceId] = useState(null);
    const [editingServicePrice, setEditingServicePrice] = useState('');
    const [showAllGroomedPets, setShowAllGroomedPets] = useState(false);
    const [showAllActiveBarangays, setShowAllActiveBarangays] = useState(false);
    const [selectedPet, setSelectedPet] = useState(null);
    const [showPetModal, setShowPetModal] = useState(false);
    const [breedFilter, setBreedFilter] = useState('all');

    const DOG_BREEDS_LIST = [
        "Golden Retriever", "Labrador Retriever", "Cavalier King Charles Spaniel", "Shih Tzu", "Maltese",
        "Bichon Frise", "Pomeranian", "Samoyed", "Bernese Mountain Dog", "Newfoundland",
        "Cocker Spaniel", "Havanese", "Collie", "Shetland Sheepdog", "Great Pyrenees",
        "Goldendoodle", "Labradoodle", "Yorkshire Terrier", "Lhasa Apso", "Afghan Hound",
        "Old English Sheepdog", "Portuguese Water Dog", "Schnauzer", "Chow Chow", "Beagle",
        "Boxer", "Basset Hound", "Saint Bernard", "Greyhound", "Whippet", "Pug",
        "French Bulldog", "Boston Terrier", "Irish Setter", "Husky", "Japanese Akita",
        "Belgian Malinois", "German Shepherd", "Rottweiler", "Alaskan Malamute", "St. Bernard",
        "Standard Poodle", "Giant Poodle", "Aspin", "Mixed Breed", "Other"
    ];

    const CAT_BREEDS_LIST = [
        "Persian", "Ragdoll", "Maine Coon", "British Shorthair", "Scottish Fold",
        "Birman", "Siamese", "Burmese", "Russian Blue", "Himalayan", "Sphynx",
        "American Shorthair", "Exotic Shorthair", "Norwegian Forest Cat", "Siberian",
        "Tonkinese", "Ragamuffin", "Abyssinian", "Turkish Angora", "Devon Rex",
        "Cornish Rex", "Oriental Shorthair", "Selkirk Rex", "Manx", "Balinese",
        "Puspin", "Mixed Breed", "Other"
    ];

    const getSpeciesByBreed = (p) => {
        if (!p) return 'Dog';
        // If species is explicitly set and not 'dog' (since it might be default), trust it
        if (p.species && p.species.toLowerCase() === 'cat') return 'Cat';
        
        const breed = (p.breed || '').trim().toLowerCase();
        if (!breed) return 'Dog';

        // Check against known cat breeds first (more specific)
        const isKnownCat = CAT_BREEDS_LIST.some(b => 
            b.toLowerCase() !== 'mixed breed' && 
            b.toLowerCase() !== 'other' && 
            b.toLowerCase() === breed
        );
        if (isKnownCat || breed === 'puspin') return 'Cat';
        
        return 'Dog';
    };

    const fetchData = useCallback(async () => {
        try {
            const [statsRes, bookingsRes, customersRes, servicesRes, barangaysRes] = await Promise.all([
                fetch(`${API_BASE}/stats`),
                fetch(`${API_BASE}/bookings`),
                fetch(`${API_BASE}/customers`),
                fetch(`${API_BASE}/services`),
                fetch(`${API_BASE}/barangays`)
            ]);

            const statsData = await statsRes.json();
            const bookingsData = await bookingsRes.json();
            const customersData = await customersRes.json();
            const servicesData = await servicesRes.json();
            const barangaysData = await barangaysRes.json();

            setStats({
                totalRevenue: statsData.totalRevenue || 0,
                monthlyGrowth: statsData.monthlyGrowth || 0,
                activeClients: statsData.activeClients || 0,
                completedServices: statsData.completedServices || 0,
                dailyTasks: statsData.dailyTasks || 0
            });

            const bookingsArr = Array.isArray(bookingsData) ? bookingsData : [];
            const customersArr = Array.isArray(customersData) ? customersData : [];
            const servicesArr = Array.isArray(servicesData) ? servicesData : [];
            const barangaysArr = Array.isArray(barangaysData) ? barangaysData : [];

            setBookings(bookingsArr);
            setCustomers(customersArr);
            setServices(servicesArr);

            // Calculate Analytics Data
            const calculatedBarangayData = barangaysArr.map((name, i) => {
                const brgyBookings = bookingsArr.filter(b => b.barangay === name);
                const count = brgyBookings.length;
                const revenue = brgyBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

                return { name, count, revenue };
            }).sort((a, b) => b.revenue - a.revenue).map((item, index) => ({
                ...item,
                rank: index + 1,
                isWinner: index === 0
            }));

            setFullBarangayData(calculatedBarangayData);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const generateReport = () => {
        const reportData = {
            date: new Date().toLocaleDateString(),
            stats,
            bookings,
            customers,
            services
        };

        const reportWindow = window.open('', '_blank', 'width=900,height=700');
        if (!reportWindow) return;

        reportWindow.document.write(`
      <html>
        <head>
          <title>CSJ Pet Grooming - Business Report</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; margin: 30px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; color: #2c3e50; }
            .header h1 { color: #FFD700; margin-bottom: 10px; }
            .section { margin-bottom: 30px; }
            .section h2 { color: #1E88E5; border-bottom: 2px solid #1E88E5; padding-bottom: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
            .stat-box { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #FFD700; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #FFD700; color: #34495E; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🐾 CSJ Pet Grooming Service</h1>
            <p>Business Analytics Report</p>
            <p><strong>Generated:</strong> ${reportData.date}</p>
          </div>
          <div class="section">
            <h2>📊 Business Overview</h2>
            <div class="stats-grid">
              <div class="stat-box"><strong>Total Revenue:</strong> ₱${reportData.stats.totalRevenue.toLocaleString()}</div>
              <div class="stat-box"><strong>Monthly Growth:</strong> ${reportData.stats.monthlyGrowth}%</div>
              <div class="stat-box"><strong>Active Clients:</strong> ${reportData.stats.activeClients}</div>
              <div class="stat-box"><strong>Completed Services:</strong> ${reportData.stats.completedServices}</div>
            </div>
          </div>
          <div class="section">
            <h2>📅 Recent Bookings</h2>
            <table>
                <thead><tr><th>Client</th><th>Pet</th><th>Service</th><th>Date</th><th>Status</th><th>Price</th></tr></thead>
                <tbody>
                    ${reportData.bookings.flatMap(b => {
            if (b.pets && b.pets.length > 0) {
                return b.pets.map(p => `
                                <tr>
                                    <td>${b.clientName}</td>
                                    <td>${p.petName}</td>
                                    <td>${p.service}</td>
                                    <td>${b.date}</td>
                                    <td>${b.status}</td>
                                    <td>₱${(p.price || 0).toLocaleString()}</td>
                                </tr>
                            `);
            }
            return `
                            <tr>
                                <td>${b.clientName}</td>
                                <td>${b.petName || 'N/A'}</td>
                                <td>${b.service || 'N/A'}</td>
                                <td>${b.date}</td>
                                <td>${b.status}</td>
                                <td>₱${(b.totalPrice || 0).toLocaleString()}</td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
          </div>
        </body>
      </html>
    `);
        reportWindow.document.close();
    };

    const updateBookingStatus = async (bookingId, newStatus) => {
        try {
            await fetch(`${API_BASE}/bookings/${bookingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            // Update local bookings state immediately
            setBookings(prev => prev.map(b =>
                b.id === bookingId
                    ? {
                        ...b,
                        status: newStatus
                    }
                    : b
            ));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const updateBookingDateTime = async (group, newDate, newTime) => {
        try {
            // Update all pets in the group
            await Promise.all(group.pets.map(pet =>
                fetch(`${API_BASE}/bookings/${pet.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: newDate || pet.date,
                        time: newTime || pet.time,
                        status: pet.status,
                        service: pet.service
                    })
                })
            ));

            // Update local state
            setBookings(prev => prev.map(b => {
                const isMatch = group.pets.some(p => p.id === b.id);
                if (isMatch) {
                    return {
                        ...b,
                        date: newDate || b.date,
                        time: newTime || b.time
                    };
                }
                return b;
            }));
        } catch (error) {
            console.error("Error updating date/time:", error);
        }
    };

    const handleDeleteBooking = async (id) => {
        if (!window.confirm("Delete this booking?")) return;
        try {
            await fetch(`${API_BASE}/bookings/${id}`, { method: 'DELETE' });
            await fetchData();
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm("Delete this customer and their history?")) return;
        try {
            await fetch(`${API_BASE}/customers/${id}`, { method: 'DELETE' });
            await fetchData();
        } catch (error) {
            console.error("Error deleting customer:", error);
        }
    };

    const handleServicePriceEdit = (index, price) => {
        setEditingServiceId(index);
        setEditingServicePrice(price);
    };

    const handleServicePriceCancel = () => {
        setEditingServiceId(null);
        setEditingServicePrice('');
    };

    const handleServicePriceSave = async (index) => {
        const service = services[index];
        const newPrice = parseInt(editingServicePrice, 10);
        if (isNaN(newPrice)) return;
        try {
            const response = await fetch(`${API_BASE}/services/${service.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: newPrice })
            });
            if (response.ok) {
                const newServices = [...services];
                newServices[index].price = newPrice;
                setServices(newServices);
                setEditingServiceId(null);
            }
        } catch (error) {
            console.error("Error saving price:", error);
        }
    };

    const handleServiceDelete = async (index) => {
        const service = services[index];
        if (!window.confirm(`Are you sure you want to delete the "${service.name}" service?`)) return;
        try {
            const response = await fetch(`${API_BASE}/services/${service.id}`, { method: 'DELETE' });
            if (response.ok) {
                const newServices = [...services];
                newServices.splice(index, 1);
                setServices(newServices);
            }
        } catch (error) {
            console.error("Error deleting service:", error);
        }
    };

    const handleEditSave = async () => {
        if (!selectedCustomer) return;
        const endpoint = modalContext === 'customer'
            ? `${API_BASE}/customers/${selectedCustomer.id}`
            : `${API_BASE}/bookings/${selectedCustomer.id}`;

        try {
            await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectedCustomer)
            });
            await fetchData();
            closeCustomerModal();
        } catch (error) {
            console.error("Error saving edit:", error);
        }
    };

    const viewCustomerDetails = (customer, context = 'booking') => {
        setSelectedCustomer({ ...customer });
        setModalContext(context);
        setShowCustomerModal(true);
    };

    const closeCustomerModal = () => {
        setShowCustomerModal(false);
        setSelectedCustomer(null);
        setSelectedPet(null);
        setShowPetModal(false);
    };

    const openPetDetails = (pet) => {
        setSelectedPet(pet);
        setShowPetModal(true);
    };

    const closePetModal = () => {
        setShowPetModal(false);
        setSelectedPet(null);
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (booking.pets && booking.pets.some(p =>
                p.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.service?.toLowerCase().includes(searchTerm.toLowerCase())
            ));

        const matchesDate = !selectedDate || booking.date === selectedDate;

        return matchesSearch && matchesDate;
    });

    const filteredCustomers = customers.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderOverallAnalytics = () => {
        // Recalculate based on current state to ensure perfect sync
        const sortedBarangays = [...fullBarangayData].sort((a, b) => b.revenue - a.revenue);
        const totalRev = sortedBarangays.reduce((sum, b) => sum + (b.revenue || 0), 0) || 1;

        const b1P = Math.round((sortedBarangays[0]?.revenue || 0) / totalRev * 100);
        const b2P = Math.round((sortedBarangays[1]?.revenue || 0) / totalRev * 100);
        const b3P = Math.round((sortedBarangays[2]?.revenue || 0) / totalRev * 100);
        const othersP = Math.max(0, 100 - (b1P + b2P + b3P));

        // SVG Circumference for r=40 is ~251.32
        const C = 251.32;
        const getDash = (pct) => `${(pct * C) / 100} ${C}`;

        return (
            <div className="overall-analytics">
                <div className="analytics-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ background: 'var(--primary-yellow)', padding: '10px 24px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <span>📈</span>
                        {overallView === 'performance' ? 'Revenue & Performance' : overallView === 'distribution' ? 'Revenue Distribution' : 'Overall Analytics'}
                    </h2>
                </div>

                {overallView === 'main' && (
                    <div className="analytics-modern-layout">
                        <div className="top-indicators-row">
                            <div className="indicator-card">
                                <div className="icon-circle icon-pink">💰</div>
                                <p className="indicator-title">TOTAL REVENUE</p>
                                <p className="indicator-value">₱ {(stats?.totalRevenue || 0).toLocaleString()}</p>
                            </div>
                            <div className="indicator-card">
                                <div className="icon-circle icon-green">👥</div>
                                <p className="indicator-title">ACTIVE CLIENTS</p>
                                <p className="indicator-value">{stats.activeClients}</p>
                            </div>
                            <div className="indicator-card">
                                <div className="icon-circle icon-orange">📋</div>
                                <p className="indicator-title">DAILY TASKS</p>
                                <p className="indicator-value">{stats.dailyTasks}</p>
                            </div>
                            <div className="indicator-card species-indicator" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                    <div className="icon-circle" style={{ background: 'rgba(52, 168, 83, 0.1)', color: '#34A853', width: '32px', height: '32px', fontSize: '1.2rem' }}>🐾</div>
                                    <p className="indicator-title" style={{ margin: 0 }}>SPECIES</p>
                                </div>
                                {(() => {
                                    let dogs = 0;
                                    let cats = 0;
                                    bookings.forEach(b => {
                                        const pets = b.pets || [{ species: b.species, breed: b.breed }];
                                        pets.forEach(p => {
                                            if (getSpeciesByBreed(p) === 'Cat') cats++;
                                            else dogs++;
                                        });
                                    });
                                    return (
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{dogs}</span>
                                                <span style={{ fontSize: '0.7rem', marginLeft: '3px', fontWeight: '600', color: '#64748b' }}>DOGS</span>
                                            </div>
                                            <div style={{ width: '1px', height: '15px', background: '#e2e8f0' }}></div>
                                            <div>
                                                <span style={{ fontSize: '1.1rem', fontWeight: '800' }}>{cats}</span>
                                                <span style={{ fontSize: '0.7rem', marginLeft: '3px', fontWeight: '600', color: '#64748b' }}>CATS</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="bottom-split-row">
                            <div className="bottom-wide-card">
                                <div className="bottom-card-header">
                                    <h3 className="bottom-card-title">Barangay Grooming Trends</h3>
                                    <span className="view-all-link" onClick={() => setShowAllGroomedPets(!showAllGroomedPets)}>
                                        {showAllGroomedPets ? 'Show Top 5' : 'View All Areas'}
                                    </span>
                                </div>
                                <div className="barangay-table">
                                    <div className="table-body" style={{ maxHeight: showAllGroomedPets ? '400px' : 'auto', overflowY: showAllGroomedPets ? 'auto' : 'visible', overflowX: 'hidden' }}>
                                        <div className="table-header">
                                            <div className="table-cell">Barangay</div>
                                            <div className="table-cell text-right">Pets Groomed</div>
                                        </div>
                                        {sortedBarangays.slice(0, showAllGroomedPets ? 73 : 5).map(item => (
                                            <div key={item.name} className="table-row">
                                                <div className="table-cell">{item.name}</div>
                                                <div className="table-cell text-right">
                                                    <span className="pet-count-badge">{item.count} Pets</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bottom-wide-card">
                                <div className="bottom-card-header">
                                    <h3 className="bottom-card-title">Top Active Barangays</h3>
                                    <span className="view-all-link" onClick={() => setShowAllActiveBarangays(!showAllActiveBarangays)}>
                                        {showAllActiveBarangays ? 'Show Top 5' : 'View All Rankings'}
                                    </span>
                                </div>
                                <div className="barangay-rankings-container">
                                    <div className="barangay-rankings-list" style={{ maxHeight: showAllActiveBarangays ? '400px' : 'auto', overflowY: showAllActiveBarangays ? 'auto' : 'visible', overflowX: 'hidden' }}>
                                        <div className="active-barangay-header">
                                            <div className="header-rank">Rank</div>
                                            <div className="header-name">Barangay</div>
                                            <div className="header-metric">Bookings</div>
                                            <div className="header-revenue">Revenue</div>
                                        </div>
                                        {sortedBarangays.slice(0, showAllActiveBarangays ? 73 : 5).map((item, idx) => (
                                            <div key={item.name} className={idx === 0 ? 'barangay-winner' : 'barangay-item'}>
                                                <div className="barangay-rank">#{idx + 1}</div>
                                                <div className="barangay-name">{item.name}</div>
                                                <div className="barangay-metric">{item.count}</div>
                                                <div className="barangay-revenue">₱{item.revenue.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="breed-analytics-overall" style={{ marginTop: '1.5rem' }}>
                            <div className="bottom-wide-card" style={{ padding: '1.5rem' }}>
                                <div className="bottom-card-header" style={{ marginBottom: '1.5rem' }}>
                                    <h3 className="bottom-card-title">🐕 Breed Distribution (Top Breeds)</h3>
                                </div>
                                {(() => {
                                    const displayBreeds = [...DOG_BREEDS_LIST, ...CAT_BREEDS_LIST];

                                    const finalCounts = {};
                                    displayBreeds.forEach(breed => { finalCounts[breed] = 0; });

                                    const uniquePets = new Map();
                                    bookings.forEach(b => {
                                        (b.pets || [{ species: b.species, breed: b.breed, petName: b.petName }]).forEach(p => {
                                            if (p.petName && p.breed) {
                                                const petKey = `${b.clientName}-${p.petName}`.toLowerCase();
                                                if (!uniquePets.has(petKey)) uniquePets.set(petKey, p.breed);
                                            }
                                        });
                                    });

                                    uniquePets.forEach((breed) => {
                                        const normalized = breed.trim().toLowerCase();
                                        const matchingKey = displayBreeds.find(k => k.toLowerCase() === normalized);
                                        if (matchingKey) finalCounts[matchingKey] = (finalCounts[matchingKey] || 0) + 1;
                                        else {
                                            const titleCase = breed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                                            finalCounts[titleCase] = (finalCounts[titleCase] || 0) + 1;
                                        }
                                    });

                                    const sortedBreeds = Object.entries(finalCounts)
                                        .map(([name, count]) => ({ name, count }))
                                        .filter(b => b.count > 0 || displayBreeds.includes(b.name))
                                        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
                                        .slice(0, 10);

                                    const maxCountOverall = Math.max(...sortedBreeds.map(b => b.count), 1);

                                    return (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {sortedBreeds.map((breed, index) => {
                                                const percentage = Math.round((breed.count / maxCountOverall) * 100) || 0;
                                                return (
                                                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ width: '160px', fontWeight: '700', fontSize: '0.9rem', color: '#1e293b' }}>{breed.name}</div>
                                                        <div style={{ flex: 1, height: '18px', background: '#f1f5f9', borderRadius: '9px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
                                                            <div style={{ width: `${percentage}%`, height: '100%', background: 'var(--primary-yellow)', borderRadius: '9px' }}></div>
                                                            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', fontWeight: '800', color: '#475569' }}>
                                                                {breed.count} {breed.count === 1 ? 'Pet' : 'Pets'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {overallView === 'performance' && (
                    <div className="performance-view-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                        <div className="premium-analytics-section" style={{ marginTop: 0 }}>
                            <div className="section-header-premium">
                                <h3><span className="animated-emoji">💰</span> Revenue & Performance per Barangay</h3>
                                <p>Detailed breakdown of earnings and customer reach</p>
                            </div>
                            <div className="revenue-premium-grid">
                                {sortedBarangays.slice(0, 5).map((item, index) => (
                                    <div key={index} className="premium-revenue-card">
                                        <div className="card-top">
                                            <span className="barangay-label">{item.name}</span>
                                            <span className="growth-badge">+15%</span>
                                        </div>
                                        <div className="card-main">
                                            <div className="revenue-info">
                                                <span className="info-label">Total:</span>
                                                <span className="info-value">₱ {item.revenue.toLocaleString()}</span>
                                            </div>
                                            <p className="card-subtitle">Total Earned</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="premium-analytics-section" style={{ marginTop: 0 }}>
                            <div className="section-header-premium">
                                <h3>Top Performing Services</h3>
                                <p>Most popular and highest earning packages</p>
                            </div>
                            <div className="top-services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                {[...services]
                                    .sort((a, b) => (b.price * b.bookings) - (a.price * a.bookings))
                                    .slice(0, 4)
                                    .map((service, idx) => (
                                        <div key={idx} className="premium-service-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#17202a', fontSize: '1.1rem' }}>{service.name}</h4>
                                                <p style={{ margin: 0, color: '#95A5A6', fontSize: '0.85rem', fontWeight: 600 }}>{service.bookings} bookings</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span style={{ display: 'block', color: '#34A853', fontWeight: 800, fontSize: '1.2rem' }}>₱ {(service.price * service.bookings).toLocaleString()}</span>
                                                <span style={{ color: '#95A5A6', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {overallView === 'distribution' && (
                    <div className="distribution-dashboard">
                        <div className="dist-metric-cards">
                            <div className="dist-card">
                                <span className="dist-card-label">Avg Revenue / Barangay</span>
                                <span className="dist-card-value">₱ {(totalRev / (sortedBarangays.length || 1)).toFixed(0).toLocaleString()}</span>
                                <span className="dist-card-footer">↑ 8.4% vs last month</span>
                            </div>
                            <div className="dist-card">
                                <span className="dist-card-label">Market Leader</span>
                                <span className="dist-card-value">{sortedBarangays[0]?.name || 'N/A'}</span>
                                <span className="dist-card-footer">Top Performing Area</span>
                            </div>
                            <div className="dist-card">
                                <span className="dist-card-label">Top Service Tier</span>
                                <span className="dist-card-value">Premium</span>
                                <span className="dist-card-footer">{(bookings.filter(b => b.price >= 1000).length / (bookings.length || 1) * 100).toFixed(0)}% of Total Bookings</span>
                            </div>
                        </div>
                        <div className="visual-row">
                            <div className="luxury-chart-container">
                                <div className="chart-header">
                                    <div className="chart-title-group">
                                        <h4>Revenue Capacity by Barangay</h4>
                                        <p>Monthly earnings distribution across active areas</p>
                                    </div>
                                </div>
                                <div className="bar-viz-container">
                                    {sortedBarangays.slice(0, 4).reverse().map((p, i) => {
                                        const rankColors = ['#FFD700', '#1E88E5', '#34A853', '#7F8C8D'];
                                        const barColor = rankColors[3 - i] || '#7F8C8D';
                                        return (
                                            <div key={i} className="luxury-bar-wrapper">
                                                <div
                                                    className="luxury-bar"
                                                    style={{ height: `${(p.revenue / (sortedBarangays[0]?.revenue || 1)) * 100}%`, background: barColor }}
                                                    data-value={`₱${p.revenue.toLocaleString()}`}
                                                ></div>
                                                <span className="bar-label">{p.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="share-viz-container">
                                <div className="chart-title-group" style={{ textAlign: 'center' }}>
                                    <h4>Species Distribution</h4>
                                    <p>Dog vs Cat Share</p>
                                </div>
                                {(() => {
                                    let dogs = 0;
                                    let cats = 0;
                                    bookings.forEach(b => {
                                        (b.pets || [{ species: b.species }]).forEach(p => {
                                            if ((p.species || '').toLowerCase() === 'cat') cats++;
                                            else dogs++;
                                        });
                                    });
                                    const total = dogs + cats || 1;
                                    const dogP = Math.round(dogs / total * 100);
                                    const catP = 100 - dogP;
                                    return (
                                        <>
                                            <div className="donut-box">
                                                <div
                                                    className="donut-conic"
                                                    style={{
                                                        background: `conic-gradient(
                                                            var(--primary-yellow) 0deg ${dogP * 3.6}deg,
                                                            var(--secondary-blue) ${dogP * 3.6}deg 360deg
                                                        )`
                                                    }}
                                                ></div>
                                                <div className="donut-content">
                                                    <span className="donut-val">{total}</span>
                                                    <span className="donut-lbl">Total Pets</span>
                                                </div>
                                            </div>
                                            <div className="share-legend">
                                                <div className="legend-card"><span className="dot" style={{ background: 'var(--primary-yellow)' }}></span> Dogs ({dogP}%)</div>
                                                <div className="legend-card"><span className="dot" style={{ background: 'var(--secondary-blue)' }}></span> Cats ({catP}%)</div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="rank-list-row">
                            <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#17202A' }}>🏆 Performance Leaderboard</h4>
                            <table className="dist-table">
                                <thead>
                                    <tr>
                                        <th>Rank</th>
                                        <th>Barangay</th>
                                        <th>Growth Trend</th>
                                        <th>Top Service</th>
                                        <th>Avg Ticket</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedBarangays.slice(0, 4).map((row, i) => {
                                        const rankColors = ['#FFD700', '#1E88E5', '#34A853', '#7F8C8D'];
                                        const currentColor = rankColors[i] || '#7F8C8D';

                                        return (
                                            <tr key={i}>
                                                <td style={{ color: currentColor, fontSize: '1.2rem', fontWeight: '800' }}>#{i + 1}</td>
                                                <td style={{ color: '#17202A' }}>{row.name}</td>
                                                <td><span className="growth-pill pill-pos">+15.2%</span></td>
                                                <td><span className="service-tag">Premium Package</span></td>
                                                <td style={{ color: 'var(--secondary-blue)' }}>₱ {(row.revenue / (row.count || 1)).toFixed(0)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderBreedsAnalytics = () => {
        const finalCounts = {};

        const DOG_BREEDS = DOG_BREEDS_LIST;
        const CAT_BREEDS = CAT_BREEDS_LIST;

        const displayBreeds = breedFilter === 'dog' ? DOG_BREEDS : breedFilter === 'cat' ? CAT_BREEDS : [...DOG_BREEDS, ...CAT_BREEDS];

        displayBreeds.forEach(breed => {
            finalCounts[breed] = 0;
        });

        // Count unique pets and their breeds
        const uniquePets = new Map();
        bookings.forEach(b => {
            const pets = b.pets || [{ species: b.species, breed: b.breed, petName: b.petName }];
            pets.forEach(p => {
                if (p.petName && p.breed) {
                    const species = getSpeciesByBreed(p);
                    const speciesMatch = breedFilter === 'all' || species.toLowerCase() === breedFilter;
                    if (speciesMatch) {
                        const petKey = `${b.clientName}-${p.petName}`.toLowerCase();
                        if (!uniquePets.has(petKey)) {
                            uniquePets.set(petKey, p.breed);
                        }
                    }
                }
            });
        });

        // Count occurrences of each breed from unique pets
        uniquePets.forEach((breed) => {
            const normalized = breed.trim().toLowerCase();
            const matchingKey = displayBreeds.find(k => k.toLowerCase() === normalized) ||
                breed.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            finalCounts[matchingKey] = (finalCounts[matchingKey] || 0) + 1;
        });

        const sortedBreeds = Object.entries(finalCounts)
            .map(([name, count]) => ({ name, count }))
            .filter(b => b.count > 0 || (breedFilter !== 'all' && displayBreeds.includes(b.name)))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

        const maxCount = Math.max(...sortedBreeds.map(b => b.count), 1);

        return (
            <div className="breeds-analytics">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'center', width: '100%' }}>
                        <h2 style={{ background: 'var(--primary-yellow)', padding: '10px 24px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            {breedFilter === 'dog' ? '🐕' : breedFilter === 'cat' ? '🐈' : '🐾'} {breedFilter === 'dog' ? 'Dog' : breedFilter === 'cat' ? 'Cat' : 'Overall'} Breed Distribution
                        </h2>
                        <p style={{ marginTop: '0.5rem', color: '#64748b' }}>Complete overview of {breedFilter === 'all' ? 'all pet' : breedFilter} breeds population</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <button onClick={() => setBreedFilter('all')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: breedFilter === 'all' ? 'white' : 'transparent', color: breedFilter === 'all' ? 'var(--primary-yellow)' : '#64748b', fontWeight: 'bold', cursor: 'pointer', boxShadow: breedFilter === 'all' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>All</button>
                    <button onClick={() => setBreedFilter('dog')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: breedFilter === 'dog' ? 'white' : 'transparent', color: breedFilter === 'dog' ? 'var(--primary-yellow)' : '#64748b', fontWeight: 'bold', cursor: 'pointer', boxShadow: breedFilter === 'dog' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>Dogs</button>
                    <button onClick={() => setBreedFilter('cat')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: breedFilter === 'cat' ? 'white' : 'transparent', color: breedFilter === 'cat' ? 'var(--primary-yellow)' : '#64748b', fontWeight: 'bold', cursor: 'pointer', boxShadow: breedFilter === 'cat' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}>Cats</button>
                </div>

                <div className="breeds-barchart-container" style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    marginTop: '1rem',
                    maxHeight: '600px',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {sortedBreeds.length > 0 ? sortedBreeds.map((breed, index) => {
                            const percentage = Math.round((breed.count / maxCount) * 100) || 0;
                            return (
                                <div key={index} className="breed-bar-row" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div className="breed-label" style={{ width: '180px', minWidth: '180px' }}>
                                        <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem' }}>{breed.name}</div>
                                    </div>
                                    <div className="bar-container" style={{ flex: 1, position: 'relative', height: '24px', background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                        <div className="bar-fill" style={{
                                            width: `${percentage}%`,
                                            height: '100%',
                                            background: index % 3 === 0 ? 'var(--primary-yellow)' : index % 3 === 1 ? 'var(--secondary-blue)' : 'var(--accent-green)',
                                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                            borderRadius: '12px'
                                        }}></div>
                                        <span style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            fontSize: '0.75rem',
                                            fontWeight: '800',
                                            color: percentage > 90 ? 'white' : '#475569'
                                        }}>
                                            {breed.count} {breed.count === 1 ? 'Pet' : 'Pets'}
                                        </span>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No data found for this filter.</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderOverview = () => {
        const sortedServices = [...services].sort((a, b) => (b.price * b.bookings) - (a.price * a.bookings));
        const totalServiceRevenue = sortedServices.reduce((sum, s) => sum + (s.price * s.bookings), 0) || 1;
        const totalBookings = bookings.length || 1;
        const avgPrice = Math.round(stats.totalRevenue / totalBookings);

        const topService = sortedServices[0];
        const premiumBookings = bookings.filter(b => b.price >= 1000).length;
        const premiumPercent = Math.round((premiumBookings / totalBookings) * 100);

        return (
            <div className="dashboard-grid">
                <div className="services-performance-cards">
                    <div className="section-title" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ background: 'var(--primary-yellow)', padding: '10px 24px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <span className="title-icon">✂️</span> Service Performance
                        </h2>
                    </div>
                    <div className="metric-cards-row">
                        <div className="metric-card">
                            <div className="metric-label">AVG REVENUE / BOOKING</div>
                            <div className="metric-value">₱ {avgPrice.toLocaleString()}</div>
                            <div className="metric-caption up">↑ 8.4% vs last month</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-label">TOP SERVICE</div>
                            <div className="metric-value">{topService?.name || 'N/A'}</div>
                            <div className="metric-caption">{Math.round((topService?.price * topService?.bookings / totalServiceRevenue) * 100)}% of Total Revenue</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-label">PREMIUM TIER</div>
                            <div className="metric-value">{premiumPercent}%</div>
                            <div className="metric-caption yellow">of Total Bookings</div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-label">SPECIES DISTRIBUTION</div>
                            {(() => {
                                let dogs = 0;
                                let cats = 0;
                                bookings.forEach(b => {
                                    const pets = b.pets || [{ species: b.species, breed: b.breed }];
                                    pets.forEach(p => {
                                        if (getSpeciesByBreed(p) === 'Cat') cats++;
                                        else dogs++;
                                    });
                                });
                                return (
                                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem', justifyContent: 'center' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{dogs}</div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#64748b' }}>DOGS</div>
                                        </div>
                                        <div style={{ width: '1px', height: '20px', background: '#e2e8f0', marginTop: '5px' }}></div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{cats}</div>
                                            <div style={{ fontSize: '0.6rem', fontWeight: '700', color: '#64748b' }}>CATS</div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                    <div className="table-section">
                        <div className="table-container">
                            <table className="dashboard-table">
                                <thead>
                                    <tr>
                                        <th>Service Name</th>
                                        <th>Price</th>
                                        <th>Bookings</th>
                                        <th>Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedServices.map((service, index) => (
                                        <tr key={index}>
                                            <td className="service-name">{service.name}</td>
                                            <td>₱{service.price}</td>
                                            <td>{service.bookings}</td>
                                            <td className="revenue">₱{(service.price * service.bookings).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderBookings = () => {
        // Step 1: Group by Customer
        const customerMap = {};

        filteredBookings.forEach(booking => {
            const cid = booking.customerId || (booking.clientName || "").trim().toLowerCase();
            if (!customerMap[cid]) {
                customerMap[cid] = {
                    ...booking,
                    sessions: {} // Will hold bookings grouped by booking_id
                };
            }

            // Step 2: Group that customer's pets by booking_id (session)
            const bid = booking.id; // This is the booking_id from the backend
            if (!customerMap[cid].sessions[bid]) {
                customerMap[cid].sessions[bid] = {
                    id: bid,
                    date: booking.date,
                    time: booking.time,
                    status: booking.status,
                    specialRequests: booking.specialRequests,
                    pets: []
                };
            }

            const sessionPets = booking.pets || [{
                id: booking.id, // pet_id fallback
                petName: booking.petName,
                species: booking.species,
                breed: booking.breed,
                petSize: booking.petSize,
                petAge: booking.petAge,
                petAgeUnit: booking.petAgeUnit,
                service: booking.service,
                price: booking.price,
                status: booking.status
            }];

            sessionPets.forEach(p => {
                if (!customerMap[cid].sessions[bid].pets.find(existing => existing.id === p.id)) {
                    customerMap[cid].sessions[bid].pets.push(p);
                }
            });
        });

        // Convert customer map to array and calculate total prices
        const groupedBookings = Object.values(customerMap).map(customer => {
            const sessionsArray = Object.values(customer.sessions);
            const total = sessionsArray.reduce((sum, s) => sum + s.pets.reduce((pSum, p) => pSum + Number(p.price || 0), 0), 0);
            return {
                ...customer,
                sessions: sessionsArray,
                totalPrice: total
            };
        });

        // Sort customers by their most recent booking session
        groupedBookings.sort((a, b) => {
            const dateA = a.sessions?.length ? new Date(a.sessions[0].date) : new Date();
            const dateB = b.sessions?.length ? new Date(b.sessions[0].date) : new Date();
            return dateB - dateA;
        });

        return (
            <div className="bookings-modern">
                <div className="bookings-top-header" style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h2 style={{ background: 'var(--primary-yellow)', padding: '10px 24px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                        <span className="header-emoji">📅</span> Booking Management
                    </h2>
                    <div className="header-tools" style={{ width: '100%', justifyContent: 'center' }}>
                        <div className="search-box">
                            <input type="text" placeholder="Search bookings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-modern" />
                            <span className="search-icon">🔍</span>
                        </div>
                        <div className="date-box" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="date-modern" />
                            {(selectedDate || searchTerm) && (
                                <button
                                    className="btn-warning"
                                    style={{ padding: '0.75rem 1rem', borderRadius: '12px', height: '100%' }}
                                    onClick={() => {
                                        setSelectedDate('');
                                        setSearchTerm('');
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="booking-stats">
                    <div className="stat-box"><span className="stat-number">{filteredBookings.length}</span><span className="stat-label">Total Bookings</span></div>
                    <div className="stat-box"><span className="stat-number" style={{ color: '#10b981' }}>{filteredBookings.filter(b => b.status === 'completed').length}</span><span className="stat-label">Completed</span></div>
                    <div className="stat-box"><span className="stat-number">{filteredBookings.filter(b => b.status === 'accepted').length}</span><span className="stat-label">Accepted</span></div>
                    <div className="stat-box"><span className="stat-number">{filteredBookings.filter(b => b.status === 'pending').length}</span><span className="stat-label">Pending</span></div>
                    <div className="stat-box"><span className="stat-number">₱{filteredBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0).toLocaleString()}</span><span className="stat-label">Total Revenue</span></div>
                </div>
                <div className="dashboard-table-container">
                    <table className="dashboard-table">
                        <thead><tr><th>Customer</th><th>Total Price</th><th>Actions</th></tr></thead>
                        <tbody>
                            {groupedBookings.map(group => (
                                <tr key={group.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#1e293b' }}>{group.firstName} {group.lastName}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <span>📞 {group.phone}</span>
                                                <span style={{ color: '#e2e8f0' }}>|</span>
                                                <span>📍 {group.barangay}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{group.date} @ {group.time}</div>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>₱{group.totalPrice.toLocaleString()}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-primary" onClick={() => viewCustomerDetails(group, 'booking')}>View</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderCustomers = () => (
        <div className="customers-modern">
            <div className="customers-top-header" style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 style={{ background: 'var(--primary-yellow)', padding: '10px 24px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                    <span className="header-emoji">👥</span> Customer List
                </h2>
                <div className="header-tools" style={{ width: '100%', justifyContent: 'center' }}>
                    <div className="search-box">
                        <input type="text" placeholder="Search customers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-modern" />
                        <span className="search-icon">🔍</span>
                    </div>
                </div>
            </div>
            <div className="customer-stats">
                <div className="stat-box"><span className="stat-number">{filteredCustomers.length}</span><span className="stat-label">Total Customers</span></div>
                <div className="stat-box"><span className="stat-number">{filteredCustomers.filter(c => c.totalVisits >= 5).length}</span><span className="stat-label">VIP Members</span></div>
                <div className="stat-box"><span className="stat-number">{filteredCustomers.length}</span><span className="stat-label">Active</span></div>
                <div className="stat-box"><span className="stat-number">{filteredCustomers.reduce((sum, c) => sum + c.totalVisits, 0)}</span><span className="stat-label">Total Visits</span></div>
            </div>
            <div className="dashboard-table-container">
                <table className="dashboard-table">
                    <thead><tr><th>Client</th><th>Contact Info</th><th>Address</th><th>Visits</th><th>Actions</th></tr></thead>
                    <tbody>
                        {filteredCustomers.map(customer => (
                            <tr key={customer.id}>
                                <td><div style={{ fontWeight: 'bold', color: '#1e293b' }}>{customer.firstName} {customer.lastName}</div></td>
                                <td><div>{customer.email}</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>{customer.phone}</div></td>
                                <td><div>{customer.houseNumber}, {customer.purok}</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>{customer.barangay}</div></td>
                                <td><div style={{ fontWeight: 'bold' }}>{customer.totalVisits} visits</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Last: {customer.lastVisit}</div></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => viewCustomerDetails(customer, 'customer')}>Details</button>
                                        <button className="btn-warning" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => viewCustomerDetails(customer, 'loyalty')}>Loyalty</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );


    const renderServices = () => (
        <div className="services-tbl-wrapper">
            <div className="services-tbl-header" style={{ textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <h2 style={{ background: 'var(--primary-yellow)', padding: '10px 24px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '0.8rem', color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: '1.5rem' }}>
                    <span className="services-tbl-icon">✂️</span> Services Management
                </h2>
                <p style={{ color: '#64748b' }}>Manage all pet grooming rates and packages in one place</p>
            </div>



            <div className="dashboard-table-container">
                <table className="dashboard-table">
                    <thead>
                        <tr>
                            <th>SERVICE NAME & DESCRIPTION</th>
                            <th>TYPE</th>
                            <th>PRICE</th>
                            <th>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((service, index) => (
                            <tr key={index} className={editingServiceId === index ? 'svc-row editing' : 'svc-row'}>
                                <td className="svc-name-cell">
                                    <span className="svc-emoji">
                                        {service.name.toLowerCase().includes('cat') ? '🐱' :
                                            service.name.toLowerCase().includes('poodle') ? '🐩' :
                                                service.name.toLowerCase().includes('husky') ||
                                                    service.name.toLowerCase().includes('shepherd') ||
                                                    service.name.toLowerCase().includes('chow') ||
                                                    service.name.toLowerCase().includes('akita') ||
                                                    service.name.toLowerCase().includes('bernard') ||
                                                    service.name.toLowerCase().includes('malamute') ||
                                                    service.name.toLowerCase().includes('samoyed') ? '🐕' : '🐾'}
                                    </span>
                                    <span className="svc-name">{service.name}</span>
                                </td>
                                <td className="svc-type-cell">
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        background: service.type === 'Size' ? '#E3F2FD' : service.type === 'Breed' ? '#E8F5E9' : '#F5F5F5',
                                        color: service.type === 'Size' ? '#1E88E5' : service.type === 'Breed' ? '#2E7D32' : '#757575'
                                    }}>
                                        {service.type || 'Other'}
                                    </span>
                                </td>

                                <td className="svc-price-cell">
                                    {editingServiceId === index ? (
                                        <div className="price-input-wrapper">
                                            <span>₱</span>
                                            <input
                                                id={`service-price-input-${index}`}
                                                type="number"
                                                value={editingServicePrice}
                                                onChange={e => setEditingServicePrice(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleServicePriceSave(index);
                                                    if (e.key === 'Escape') handleServicePriceCancel();
                                                }}
                                                autoFocus
                                                min="1"
                                            />
                                        </div>
                                    ) : (
                                        <span style={{ fontWeight: 'bold' }}>₱{service.price.toLocaleString()}</span>
                                    )}
                                </td>
                                <td className="svc-actions-cell">
                                    {editingServiceId === index ? (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                id={`save-price-${index}`}
                                                className="save-btn"
                                                onClick={() => handleServicePriceSave(index)}
                                                title="Save"
                                                style={{ background: '#ffc107', color: '#17202A', border: 'none', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', fontSize: '1.1rem' }}
                                            >✓</button>
                                            <button
                                                id={`cancel-price-${index}`}
                                                className="cancel-btn"
                                                onClick={handleServicePriceCancel}
                                                title="Cancel"
                                                style={{ background: '#f8d7da', color: '#721c24', border: 'none', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease', fontSize: '1.1rem' }}
                                            >✕</button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                id={`edit-price-${index}`}
                                                className="edit-btn"
                                                onClick={() => handleServicePriceEdit(index, service.price)}
                                                title="Edit Price"
                                            >✏️</button>
                                            <button
                                                id={`delete-service-${index}`}
                                                className="delete-btn"
                                                onClick={() => handleServiceDelete(index)}
                                                title="Delete Service"
                                            >🗑️</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="app">
            <nav className="sidebar">
                <div className="sidebar-nav-group">
                    <div className="sidebar-logo"><img src={csjLogo} alt="CSJ Logo" className="logo-img" /></div>
                    <div className="nav-item nav-item-group">
                        <button onClick={() => { setShowOverallSubmenu(!showOverallSubmenu); setActiveView('overall'); setOverallView('main'); }} className={`submenu-toggle ${(activeView === 'overall') ? 'active' : ''}`} title="Overall Analytics">
                            <div className="nav-label"><span className="nav-icon">📈</span><span className="nav-text">Overall Analytics</span></div>
                            <span className="nav-caret">{showOverallSubmenu ? '▲' : '▼'}</span>
                        </button>
                        {showOverallSubmenu && (
                            <div className="submenu-items">
                                <button onClick={() => { setActiveView('overall'); setOverallView('performance'); }} className={activeView === 'overall' && overallView === 'performance' ? 'sub-active' : ''}>Revenue & Performance</button>
                                <button onClick={() => { setActiveView('overall'); setOverallView('distribution'); }} className={activeView === 'overall' && overallView === 'distribution' ? 'sub-active' : ''}>Revenue Distribution</button>
                                <button onClick={() => { setActiveView('overall'); setOverallView('breeds'); }} className={activeView === 'overall' && overallView === 'breeds' ? 'sub-active' : ''}>Breeds Distribution</button>
                            </div>
                        )}
                    </div>
                    <div className="nav-item"><button onClick={() => { setActiveView('overview'); setShowOverallSubmenu(false); }} className={activeView === 'overview' ? 'active' : ''} title="Analytics Overview"><span className="nav-icon">📊</span><span className="nav-text">Service Performance</span></button></div>
                    <div className="nav-item"><button onClick={() => { setActiveView('services'); setShowOverallSubmenu(false); }} className={activeView === 'services' ? 'active' : ''} title="Services"><span className="nav-icon">✂️</span><span className="nav-text">Services</span></button></div>
                    <div className="nav-item"><button onClick={() => { setActiveView('bookings'); setShowOverallSubmenu(false); }} className={activeView === 'bookings' ? 'active' : ''} title="Booking Monitoring"><span className="nav-icon">📅</span><span className="nav-text">Booking Monitoring</span></button></div>
                    <div className="nav-item"><button onClick={() => { setActiveView('customers'); setShowOverallSubmenu(false); }} className={activeView === 'customers' ? 'active' : ''} title="Customer List"><span className="nav-icon">👥</span><span className="nav-text">Customer List</span></button></div>
                </div>
                <div className="sidebar-footer"><button onClick={generateReport} className="sidebar-report-btn">🖨️ Generate Report</button></div>
            </nav>
            <div className="main-wrapper">
                <header className="app-header">
                    <div className="header-title"><h1>CSJ Pet Grooming Dashboard</h1></div>
                    <div className="header-actions"><button onClick={() => setShowLogoutModal(true)} className="btn-logout">🚪 Logout</button></div>
                </header>
                <main className="main-content">
                    <div key={activeView === 'overall' ? `overall-${overallView}` : activeView} className="fade-in-view">
                        {activeView === 'overall' && overallView !== 'breeds' && renderOverallAnalytics()}
                        {activeView === 'overall' && overallView === 'breeds' && renderBreedsAnalytics()}
                        {activeView === 'overview' && renderOverview()}
                        {activeView === 'services' && renderServices()}
                        {activeView === 'bookings' && renderBookings()}
                        {activeView === 'customers' && renderCustomers()}
                    </div>
                </main>
            </div>
            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>Confirm Logout</h3><p>Are you sure you want to logout of the CSJ Pet Grooming dashboard?</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowLogoutModal(false)} className="btn-secondary">Cancel</button>
                            <button onClick={() => { setShowLogoutModal(false); navigate('/login'); }} className="btn-warning">Logout</button>
                        </div>
                    </div>
                </div>
            )}
            {showCustomerModal && selectedCustomer && (
                <div className="modal-overlay">
                    <div className="modal customer-modal" style={{
                        maxWidth: modalContext === 'booking' ? '800px' : '900px',
                        width: '95%',
                        margin: '1rem auto'
                    }}>
                        <div className="modal-header"><h3>👥 {modalContext === 'booking' ? 'Booking Details' : 'Customer Details'}</h3><button className="close-btn" onClick={closeCustomerModal}>×</button></div>
                        <div className="modal-content" style={{ maxHeight: '80vh', overflowY: 'auto', padding: '1rem' }}>
                            {modalContext !== 'booking' && (
                                <div className="customer-info-section" style={{ padding: '1rem' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>📋 {modalContext === 'customer' ? 'Customer Information' : 'Loyalty Status'}</h4>
                                    <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                        {modalContext === 'loyalty' ? (
                                            <>
                                                <div className="info-item" style={{ background: 'white', padding: '0.75rem', borderRadius: '8px' }}><span className="label">Customer Name:</span><span className="value">{selectedCustomer.name || selectedCustomer.clientName}</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.75rem', borderRadius: '8px' }}><span className="label">Loyalty Points:</span><span className="value">{selectedCustomer.rewardPoints} points</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.75rem', borderRadius: '8px' }}><span className="label">Loyalty Tier:</span><span className="value">{selectedCustomer.codeUsed >= 2 ? "🥇 Gold Member" : selectedCustomer.codeUsed === 1 ? "🥈 Silver Member" : "🥉 Bronze Member"}</span></div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">First Name:</span><span className="value">{selectedCustomer.firstName}</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">Middle Name:</span><span className="value">{selectedCustomer.middleName || 'N/A'}</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">Last Name:</span><span className="value">{selectedCustomer.lastName}</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">Email:</span><span className="value">{selectedCustomer.email}</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">Phone:</span><span className="value">{selectedCustomer.phone}</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">House Number:</span><span className="value">{selectedCustomer.houseNumber}</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">Purok:</span><span className="value">{selectedCustomer.purok}</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">Barangay:</span><span className="value">{selectedCustomer.barangay}</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">City:</span><span className="value">Lipa City</span></div>
                                                <div className="info-item" style={{ background: 'white', padding: '0.6rem', borderRadius: '8px' }}><span className="label">Landmark:</span><span className="value">{selectedCustomer.landmark || 'N/A'}</span></div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {modalContext === 'customer' && (
                                <div className="customer-info-section" style={{ padding: '0.5rem', borderTop: '1px solid #edf2f7' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>🆔 Identification Documents</h4>
                                    <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                        <div className="info-item" style={{ background: 'white', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="label" style={{ fontWeight: 'bold' }}>ID FRONT</span>
                                            <div className="id-image-container" style={{ width: '100%', height: '180px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {selectedCustomer.idFront ? (
                                                    <img src={selectedCustomer.idFront} alt="ID Front" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No Front Image Uploaded</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="info-item" style={{ background: 'white', padding: '1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className="label" style={{ fontWeight: 'bold' }}>ID BACK</span>
                                            <div className="id-image-container" style={{ width: '100%', height: '180px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                {selectedCustomer.idBack ? (
                                                    <img src={selectedCustomer.idBack} alt="ID Back" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No Back Image Uploaded</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {modalContext === 'booking' && (
                                <>
                                    <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🐾 Booked Appointments</h4>
                                    <div className="booking-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr>
                                                    <th>Booking #</th>
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                    <th>Status</th>
                                                    <th>Price</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(selectedCustomer.sessions || []).map((session, idx) => (
                                                    <tr key={idx}>
                                                        <td>{session.id}</td>
                                                        <td>{session.date}</td>
                                                        <td>{session.time}</td>
                                                        <td>
                                                            <select
                                                                value={session.status}
                                                                onChange={(e) => {
                                                                    updateBookingStatus(session.id, e.target.value);
                                                                    const updatedSessions = [...selectedCustomer.sessions];
                                                                    updatedSessions[idx] = { ...updatedSessions[idx], status: e.target.value };
                                                                    setSelectedCustomer({ ...selectedCustomer, sessions: updatedSessions });
                                                                }}
                                                                className="status-select-sm"
                                                                style={{ padding: '4px', borderRadius: '4px', fontSize: '0.8rem' }}
                                                            >
                                                                <option value="pending">Pending</option>
                                                                <option value="on the way">On the Way</option>
                                                                <option value="accepted">Accepted</option>
                                                                <option value="completed">Completed</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                        </td>
                                                        <td style={{ fontWeight: 'bold', color: '#10b981' }}>
                                                            ₱{session.pets?.reduce((sum, p) => sum + Number(p.price || 0), 0).toLocaleString()}
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn-primary"
                                                                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                                                                onClick={() => openPetDetails(session)}
                                                            >
                                                                View Pets ({session.pets?.length || 0})
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="customer-info-section" style={{ borderTop: '1px solid #eee', marginTop: '1rem', paddingTop: '1rem' }}>
                                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>📝 Special Requests</h4>
                                        <div style={{ background: '#fff9e6', padding: '1rem', borderRadius: '12px', border: '1px solid #ffeeba', color: '#856404', minHeight: '60px' }}>
                                            {selectedCustomer.specialRequests || 'No special requests provided.'}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showPetModal && selectedPet && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal booking-details-modal" style={{ maxWidth: '950px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header" style={{ padding: '1rem 1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>👥 Booking Details</h3>
                            <button className="close-btn" onClick={closePetModal}>×</button>
                        </div>
                        <div className="modal-content" style={{ padding: '1.5rem', background: '#f8fafc' }}>
                            <div className="customer-details-section" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem' }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>📋 Customer Information</h4>
                                    <span style={{ fontSize: '0.8rem', padding: '4px 12px', background: '#fffbeb', borderRadius: '20px', color: '#b45309', fontWeight: '700', border: '1px solid #fde68a' }}>
                                        CUSTOMER ID: {selectedCustomer?.id || 'N/A'}
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }}>
                                    <div className="info-column">
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                            <div className="info-field">
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>First Name</span>
                                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{selectedCustomer?.firstName}</span>
                                            </div>
                                            <div className="info-field">
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Middle Name</span>
                                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{selectedCustomer?.middleName || 'N/A'}</span>
                                            </div>
                                            <div className="info-field">
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Last Name</span>
                                                <span style={{ fontWeight: '600', color: '#1e293b' }}>{selectedCustomer?.lastName}</span>
                                            </div>
                                            <div className="info-field">
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Email</span>
                                                <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.85rem', wordBreak: 'break-all' }}>{selectedCustomer?.email}</span>
                                            </div>
                                            <div className="info-field">
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>Phone</span>
                                                <span style={{ fontWeight: '700', color: '#1e293b' }}>{selectedCustomer?.phone}</span>
                                            </div>
                                            <div className="info-field">
                                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>City</span>
                                                <span style={{ fontWeight: '600', color: '#1e293b' }}>Lipa City</span>
                                            </div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '1.2rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '10px' }}>🏠 Residential Address & Landmark</span>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                                                <div>
                                                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>House #:</span>
                                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedCustomer?.houseNumber}</span>
                                                </div>
                                                <div>
                                                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Purok:</span>
                                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedCustomer?.purok}</span>
                                                </div>
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Barangay:</span>
                                                    <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{selectedCustomer?.barangay}</span>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                                <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8' }}>Landmark:</span>
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>{selectedCustomer?.landmark || 'No landmark specified'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="docs-column" style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '2rem' }}>
                                        <h5 style={{ margin: '0 0 1.2rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>🆔 Identification Documents</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginBottom: '6px', fontWeight: '700' }}>ID FRONT PHOTO</span>
                                                <div style={{ height: '120px', background: '#f1f5f9', borderRadius: '10px', border: '1px dashed #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {selectedCustomer?.idFront ? (
                                                        <img src={selectedCustomer.idFront} alt="ID Front" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '1.2rem' }}>🖼️</span><span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No Front ID</span></div>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ display: 'block', fontSize: '0.65rem', color: '#94a3b8', marginBottom: '6px', fontWeight: '700' }}>ID BACK PHOTO</span>
                                                <div style={{ height: '120px', background: '#f1f5f9', borderRadius: '10px', border: '1px dashed #cbd5e1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {selectedCustomer?.idBack ? (
                                                        <img src={selectedCustomer.idBack} alt="ID Back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ textAlign: 'center' }}><span style={{ display: 'block', fontSize: '1.2rem' }}>🖼️</span><span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No Back ID</span></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#334155' }}>🐾 Pet Information</h4>
                            <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1rem', justifyContent: (selectedPet.pets || []).length <= 2 ? 'center' : 'flex-start' }}>
                                {(selectedPet.pets || []).map((p, i) => (
                                    <div key={i} style={{
                                        minWidth: '350px',
                                        background: 'white',
                                        borderRadius: '16px',
                                        padding: '1.2rem',
                                        boxShadow: '0 2px 4px rgb(0 0 0 / 0.05)',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <h5 style={{
                                            color: i === 0 ? '#f59e0b' : '#10b981',
                                            marginBottom: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '1rem'
                                        }}>
                                            {`🐾 Pet ${i + 1} Details`}
                                        </h5>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem' }}>
                                            <div className="pet-field" style={{ padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Pet Name:</span>
                                                <span style={{ fontWeight: '700', color: '#1e293b' }}>{p.petName}</span>
                                            </div>
                                            <div className="pet-field" style={{ padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Species:</span>
                                                <span style={{ fontWeight: '600' }}>{getSpeciesByBreed(p)}</span>
                                            </div>
                                            <div className="pet-field" style={{ padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Breed:</span>
                                                <span style={{ fontWeight: '600' }}>{p.breed}</span>
                                            </div>
                                            <div className="pet-field" style={{ padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Age:</span>
                                                <span style={{ fontWeight: '600' }}>{p.petAge} {p.petAgeUnit || 'yrs'}</span>
                                            </div>
                                            <div className="pet-field" style={{ padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Size:</span>
                                                <span style={{ fontWeight: '600' }}>{p.petSize || 'N/A'}</span>
                                            </div>
                                            <div className="pet-field" style={{ padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Service:</span>
                                                <span style={{ fontWeight: '700', color: '#0369a1' }}>{p.service}</span>
                                            </div>
                                            <div className="pet-field" style={{ padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Price:</span>
                                                <span style={{ fontWeight: '800', color: '#1d4ed8' }}>₱{p.price?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="special-requests-section" style={{ marginTop: '1.2rem' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', color: '#334155', fontSize: '1rem' }}>📝 Special Requests</h4>
                                <div style={{
                                    background: '#fffbeb',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '1px solid #fef3c7',
                                    color: '#92400e',
                                    fontSize: '0.9rem',
                                    lineHeight: '1.5'
                                }}>
                                    {selectedPet.specialRequests || 'No special requests provided.'}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '1rem 1.5rem', textAlign: 'right', background: 'white' }}>
                            <button className="btn-secondary" onClick={closePetModal} style={{ padding: '0.5rem 1.5rem' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
