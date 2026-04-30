import React, { useState } from 'react';
import '../css/Booking.css';
import '../css/PawBackground.css';
import { useNavigate } from 'react-router-dom';
import { LIPA_BARANGAYS } from '../constants/barangays';

const CAT_BREEDS = [
  "Persian", "Ragdoll", "Maine Coon", "British Shorthair", "Scottish Fold",
  "Birman", "Siamese", "Burmese", "Russian Blue", "Himalayan", "Sphynx",
  "American Shorthair", "Exotic Shorthair", "Norwegian Forest Cat", "Siberian",
  "Tonkinese", "Ragamuffin", "Abyssinian", "Turkish Angora", "Devon Rex",
  "Cornish Rex", "Oriental Shorthair", "Selkirk Rex", "Manx", "Balinese"
];

const DOG_BREEDS = [
  "Golden Retriever", "Labrador Retriever", "Cavalier King Charles Spaniel", "Shih Tzu", "Maltese",
  "Bichon Frise", "Pomeranian", "Samoyed", "Bernese Mountain Dog", "Newfoundland",
  "Cocker Spaniel", "Havanese", "Collie", "Shetland Sheepdog", "Great Pyrenees",
  "Goldendoodle", "Labradoodle", "Yorkshire Terrier", "Lhasa Apso", "Afghan Hound",
  "Old English Sheepdog", "Portuguese Water Dog", "Schnauzer", "Chow Chow", "Beagle",
  "Boxer", "Basset Hound", "Saint Bernard", "Greyhound", "Whippet", "Pug",
  "French Bulldog", "Boston Terrier", "Irish Setter", "Husky", "Japanese Akita",
  "Belgian Malinois", "German Shepherd", "Rottweiler", "Alaskan Malamute", "St. Bernard",
  "Standard Poodle", "Giant Poodle", "Chihuahua"
];

const Booking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);

  // Pet information - updated to handle multiple pets
  const [petInfo, setPetInfo] = useState({
    petsCount: 1,
    pets: [
      {
        petName: '',
        petType: 'dog',
        petBreed: '',
        petAge: '',
        petAgeUnit: 'years',
        pricingOption: '',   // 'special' | 'regular' | 'cat'
        selectedService: '', // breed name OR size id
      }
    ]
  });

  // Personal information
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    houseNumber: '',
    purokNumber: '',
    barangay: '',
    city: 'Lipa City',
    backToBackIdImages: []
  });

  const [initialProfileComplete, setInitialProfileComplete] = useState(false);

  // Schedule
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customerTier, setCustomerTier] = useState('');
  const [codeError, setCodeError] = useState('');

  // Dynamic mock data for reserved slots to show unavailable times clearly
  const todayDate = new Date();
  const tomorrow = new Date(todayDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [availableSlots, setAvailableSlots] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedIdImage, setSelectedIdImage] = useState(null);
  const [imagePreviews, setImagePreviews] = useState({});

  // Fetch current user and pre-fill personal info
  React.useEffect(() => {
    const fetchAndCheckProfile = async (userId) => {
      try {
        const res = await fetch(`http://localhost:5000/api/customers/${userId}`);
        if (res.ok) {
          const user = await res.json();
          console.log("Checking completion for:", user.email);
          
          // Pre-fill state
          setPersonalInfo(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            middleName: user.middleName || '',
            contactNumber: user.phone || '',
            houseNumber: user.houseNumber || '',
            purokNumber: user.purok || '',
            barangay: user.barangay || '',
            landmark: user.landmark || ''
          }));

          const hasNames = user.firstName && user.lastName;
          const hasPhone = user.phone && user.phone.length >= 10;

          if (hasNames && hasPhone) {
            setInitialProfileComplete(true);
          } else {
            setInitialProfileComplete(false);
          }
          
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      } catch (err) {
        console.error("Profile sync error:", err);
      }
    };

    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id) {
          setCurrentUser(user);
          
          // IMMEDIATE CACHED CHECK
          const hasNames = user.firstName && user.lastName;
          const hasPhone = user.phone && user.phone.length >= 10;
          if (hasNames && hasPhone) {
            setInitialProfileComplete(true);
          }
          
          fetchAndCheckProfile(user.id);
        }
      } catch (e) {
        console.error("Invalid user storage");
      }
    }
  }, []);

  const [dogSizes, setDogSizes] = useState([]);
  const [specialRates, setSpecialRates] = useState([]);
  const [catPrice, setCatPrice] = useState(899);

  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const servRes = await fetch('http://localhost:5000/api/services');
        if (servRes.ok) {
          const servData = await servRes.json();

          const sizes = servData.filter(s => s.type === 'Size').map(s => {
            let id = '';
            if (s.name.includes('Small')) id = 'small';
            else if (s.name.includes('Medium')) id = 'medium';
            else if (s.name.includes('Extra Large')) id = 'xl';
            else if (s.name.includes('Large')) id = 'large';
            else if (s.name.includes('XXL')) id = 'xxl';
            else id = s.name.toLowerCase();
            return { id, name: s.name, price: s.price };
          });
          setDogSizes(sizes);

          const breeds = servData.filter(s => s.type === 'Breed' && s.price > 0).map(s => ({
            breed: s.name.replace(' Rate', ''),
            price: s.price
          }));
          setSpecialRates(breeds);

          const cat = servData.find(s => s.name === 'Cat Grooming');
          if (cat) setCatPrice(cat.price);
        }
      } catch (error) {
        console.error("Error fetching dynamic data:", error);
      }
    };
    fetchServices();
  }, []);

  // Available time slots base list
  const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  // Fetch available slots from backend
  React.useEffect(() => {
    if (selectedDate) {
      const fetchAvailable = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/available-slots?date=${selectedDate}`);
          if (res.ok) {
            const data = await res.json();
            setAvailableSlots(data);
          }
        } catch (err) {
          console.error("Failed to fetch available slots:", err);
        }
      };
      fetchAvailable();
    }
  }, [selectedDate, petInfo.pets]);



  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getPetPrice = (pet) => {
    if (pet.petType === 'cat') return catPrice;
    if (pet.pricingOption === 'special') {
      const rate = specialRates.find(r => r.breed === pet.selectedService);
      return rate ? rate.price : null;
    }
    if (pet.pricingOption === 'regular') {
      const size = dogSizes.find(s => s.id === pet.selectedService);
      return size ? size.price : null;
    }
    return null;
  };

  const getPetServiceLabel = (pet) => {
    if (pet.petType === 'cat') return `Cat Grooming — Php ${catPrice}`;
    if (pet.pricingOption === 'special' && pet.selectedService) {
      const rate = specialRates.find(r => r.breed === pet.selectedService);
      return rate ? `${rate.breed} (Special Rate) — Php ${rate.price}` : '—';
    }
    if (pet.pricingOption === 'regular' && pet.selectedService) {
      const size = dogSizes.find(s => s.id === pet.selectedService);
      return size ? `${size.name} — Php ${size.price}` : '—';
    }
    return '—';
  };

  const getHighestPricePet = () => {
    if (!petInfo.pets.length) return null;
    let maxPrice = -1;
    let maxPet = null;
    petInfo.pets.forEach(pet => {
      const price = getPetPrice(pet) || 0;
      if (price > maxPrice) {
        maxPrice = price;
        maxPet = pet;
      }
    });
    return maxPet;
  };

  const calcTotal = () => {
    const subtotal = petInfo.pets.reduce((sum, pet) => sum + (getPetPrice(pet) || 0), 0);
    if (isCodeVerified) {
      const discount = getAppliedDiscount();
      return Math.max(0, subtotal - discount);
    }
    return subtotal;
  };

  const getAppliedDiscount = () => {
    if (!isCodeVerified) return 0;
    const highestPet = getHighestPricePet();
    const price = getPetPrice(highestPet) || 0;
    return Math.floor((price * discountPercent) / 100);
  };

  const handleVerifyCode = async () => {
    if (!promoCode) return;
    setCodeError('');
    try {
      const res = await fetch('http://localhost:5000/api/customers/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: currentUser?.id,
          code: promoCode
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsCodeVerified(true);
        setDiscountPercent(data.discountPercent || 0);
        setCustomerTier(data.tier || 'Bronze');
        alert("Success: " + data.message);
      } else {
        setIsCodeVerified(false);
        setDiscountPercent(0);
        setCustomerTier('');
        setCodeError(data.message);
        alert("Error: " + data.message);
      }
    } catch (err) {
      console.error("Verification failed:", err);
      alert("Failed to verify code. Please try again.");
    }
  };

  // ─── State Mutations ───────────────────────────────────────────────────────

  const handlePetCountChange = (newCount) => {
    const currentCount = petInfo.pets.length;
    const newPets = [...petInfo.pets];

    if (newCount > currentCount) {
      for (let i = currentCount; i < newCount; i++) {
        newPets.push({ 
          petName: '', 
          petType: 'dog', 
          petBreed: '', 
          petAge: '',
          petAgeUnit: 'years',
          pricingOption: '', 
          selectedService: '' 
        });
      }
    } else {
      newPets.splice(newCount);
    }

    setPetInfo({ petsCount: newCount, pets: newPets });
  };

  const handlePetInfoChange = (index, field, value) => {
    const newPets = [...petInfo.pets];
    newPets[index] = { ...newPets[index], [field]: value };
    // Reset pricing and breed when pet type changes
    if (field === 'petType') {
      newPets[index].pricingOption = value === 'cat' ? 'cat' : '';
      newPets[index].selectedService = '';
      newPets[index].petBreed = '';
    }

    // Auto-select Special Rate if the chosen breed exists in database specialRates
    if (field === 'petBreed') {
      const breedToMatch = value.replace('Saint Bernard', 'St. Bernard').toLowerCase();
      const match = specialRates.find(r => 
        r.breed.toLowerCase() === breedToMatch || 
        r.breed.toLowerCase() === value.toLowerCase()
      );

      if (match) {
        newPets[index].pricingOption = 'special';
        newPets[index].selectedService = match.breed;
      } else if (newPets[index].petType === 'dog' && newPets[index].pricingOption === 'special') {
        // If they changed from a special breed to a regular one, reset pricing selection
        newPets[index].pricingOption = '';
        newPets[index].selectedService = '';
      }
    }

    setPetInfo({ ...petInfo, pets: newPets });
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      petInfo.pets.forEach((pet, i) => {
        if (!pet.petName) newErrors[`petName_${i}`] = `Pet ${i + 1} name is required`;
        if (!pet.petBreed) newErrors[`petBreed_${i}`] = `Pet ${i + 1} breed is required`;
        if (!pet.petAge) newErrors[`petAge_${i}`] = `Pet ${i + 1} age is required`;
        if (pet.petType === 'dog') {
          if (!pet.pricingOption) newErrors[`pricingOption_${i}`] = `Pet ${i + 1}: please choose a pricing option`;
          else if (!pet.selectedService) newErrors[`selectedService_${i}`] = `Pet ${i + 1}: please select a service`;
        }
      });
    }

    if (step === 2) {
      if (!personalInfo.firstName) newErrors.firstName = 'First name is required';
      if (!personalInfo.lastName) newErrors.lastName = 'Last name is required';

      // Philippine Contact Number Validation
      const contactRegex = /^09\d{9}$/;
      if (!personalInfo.contactNumber) {
        newErrors.contactNumber = 'Contact number is required';
      } else if (!contactRegex.test(personalInfo.contactNumber)) {
        newErrors.contactNumber = 'Enter a valid 11-digit number starting with 09';
      }

      if (!personalInfo.houseNumber) newErrors.houseNumber = 'House number is required';
      if (!personalInfo.barangay) newErrors.barangay = 'Barangay is required';

      // ID Upload Validation
      if (personalInfo.backToBackIdImages.length !== 2) {
        newErrors.backToBackIdImages = 'Exactly 2 images (Front and Back ID) are required';
      } else {
        // Ensure both images are actually loaded (previews exist)
        const frontFile = personalInfo.backToBackIdImages[0];
        const backFile = personalInfo.backToBackIdImages[1];
        if (!imagePreviews[frontFile.name] || !imagePreviews[backFile.name]) {
          newErrors.backToBackIdImages = 'Images are still loading, please wait a moment...';
        }
      }
    }

    if (step === 3) {
      if (!selectedDate) newErrors.date = 'Date is required';
      if (!selectedTime) newErrors.time = 'Time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

   const nextStep = () => { 
    if (validateStep()) {
      if (step === 1 && initialProfileComplete) {
        setStep(3); // Skip Personal Info
      } else {
        setStep(step + 1); 
      }
    }
  };
   const prevStep = () => {
    if (step === 3 && initialProfileComplete) {
      setStep(1); // Skip back to Pet Info
    } else {
      setStep(step - 1);
    }
  };
  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmitting) return; // Prevent double submission
    console.log("handleSubmit called. Current step:", step);
    if (validateStep()) {
      setIsSubmitting(true);
      console.log("validateStep passed. Calling saveBooking()");
      saveBooking();
    } else {
      console.log("validateStep failed on handleSubmit!");
      console.log("Current errors:", errors);
      setIsSubmitting(false);
    }
  };

  // Placeholder for freeUpStorage - assuming it's defined elsewhere or a no-op for this snippet
  const freeUpStorage = () => {
    console.warn("freeUpStorage() called. Implement actual storage cleanup if needed.");
    // Example: Clear old, non-critical data from localStorage
    // localStorage.removeItem('someOldCache');
  };

  const saveBooking = async () => {
    console.log("saveBooking called");
    console.log("Payload sample (idFront length):", imagePreviews[personalInfo.backToBackIdImages[0]?.name]?.length || 0);
    setIsSubmitting(true);

    try {
      const petsPayload = petInfo.pets.map(pet => {
        let serviceName = '';
        if (pet.petType === 'cat') serviceName = 'Cat Grooming';
        else if (pet.pricingOption === 'special') serviceName = pet.selectedService + ' Rate';
        else if (pet.pricingOption === 'regular') {
          const matchingSize = dogSizes.find(s => s.id === pet.selectedService);
          serviceName = matchingSize ? matchingSize.name : 'Small Size Package';
        }
        return {
          petName: pet.petName,
          breed: pet.petBreed,
          petAge: pet.petAge,
          petAgeUnit: pet.petAgeUnit,
          petSize: pet.petType === 'dog' && pet.pricingOption === 'regular' ? pet.selectedService : '',
          service: serviceName
        };
      });

      const bookingPayload = {
        customerId: currentUser?.id,
        firstName: personalInfo.firstName,
        middleName: personalInfo.middleName,
        lastName: personalInfo.lastName,
        email: currentUser?.email || '',
        phone: personalInfo.contactNumber,
        houseNumber: personalInfo.houseNumber,
        purok: personalInfo.purokNumber,
        barangay: personalInfo.barangay,
        date: selectedDate,
        time: selectedTime,
        specialRequests: specialRequests,
        status: 'pending',
        promoCode: promoCode,
        pets: petsPayload,
        // Add ID images from imagePreviews state
        idFront: personalInfo.backToBackIdImages[0] ? imagePreviews[personalInfo.backToBackIdImages[0].name] : null,
        idBack: personalInfo.backToBackIdImages[1] ? imagePreviews[personalInfo.backToBackIdImages[1].name] : null
      };

      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });

      if (response.ok) {
        navigate('/profile'); // Redirect to profile on success
      } else {
        const errData = await response.json();
        setErrors({ submit: errData.message || 'Booking failed' });
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrors({ submit: 'Connection error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };



  // Clear form function
  const clearForm = () => {
    setPetInfo({
      petsCount: 1,
      pets: [
        {
          petName: '',
          petType: 'dog',
          petBreed: '',
          pricingOption: '',
          selectedService: ''
        }
      ]
    });

    setPersonalInfo({
      firstName: '',
      middleName: '',
      lastName: '',
      contactNumber: '',
      houseNumber: '',
      purokNumber: '',
      barangay: '',
      city: 'Lipa City',
      backToBackIdImages: []
    });

    setSelectedDate('');
    setSelectedTime('');
    setSpecialRequests('');
    setStep(1);
    setErrors({});
  };

  // ─── Render Step 1 ─────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="booking-step">
      <h2>🐾 Pet Information</h2>

      <div className="form-group">
        <label>How many pets do you have?</label>
        <select
          value={petInfo.petsCount}
          onChange={(e) => handlePetCountChange(parseInt(e.target.value))}
          className="form-control"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <option key={num} value={num}>{num} {num === 1 ? 'Pet' : 'Pets'}</option>
          ))}
        </select>
      </div>

      {petInfo.petsCount >= 3 && (
        <div className="multi-pet-notice">
          <p>🎉 You have {petInfo.petsCount} pets! You qualify for our multi-pet discount!</p>
        </div>
      )}

      <div className="pets-container">
        {petInfo.pets.map((pet, index) => (
          <div key={index} className="pet-form-card">
            <h3>🐾 Pet {index + 1} {pet.petType === 'dog' ? '🐕' : '🐈'}</h3>

            {/* Pet Type */}
            <div className="form-group">
              <label>Pet Type</label>
              <select
                value={pet.petType}
                onChange={(e) => handlePetInfoChange(index, 'petType', e.target.value)}
                className="form-control"
              >
                <option value="dog">🐕 Dog</option>
                <option value="cat">🐈 Cat</option>
              </select>
            </div>

            {/* Common fields */}
            <div className="form-group">
              <label>Pet Name</label>
              <input
                type="text"
                value={pet.petName}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '');
                  handlePetInfoChange(index, 'petName', val);
                }}
                className="form-control"
                placeholder={`Enter ${pet.petType} ${index + 1} name`}
              />
              {errors[`petName_${index}`] && <div className="error">{errors[`petName_${index}`]}</div>}
            </div>

            <div className="form-group">
              <label>{pet.petType === 'dog' ? 'Dog' : 'Cat'} Breed</label>
              <select
                value={pet.petBreed}
                onChange={(e) => {
                  const val = e.target.value;
                  handlePetInfoChange(index, 'petBreed', val);
                }}
                className={`form-control ${errors[`petBreed_${index}`] ? 'error' : ''}`}
              >
                <option value="">Select breed</option>
                {Array.from(new Set(
                  pet.petType === 'cat' 
                    ? CAT_BREEDS 
                    : [...DOG_BREEDS, ...specialRates.map(r => r.breed)]
                )).sort().map(breed => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
                <option value="Mixed Breed">Mixed Breed</option>
                <option value="Other">Other</option>
              </select>
              {errors[`petBreed_${index}`] && <div className="error">{errors[`petBreed_${index}`]}</div>}
            </div>

            <div className="form-group">
              <label>{pet.petType === 'dog' ? 'Dog' : 'Cat'} Age</label>
              <div className="age-input-group" style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={pet.petAge}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); 
                    handlePetInfoChange(index, 'petAge', val);
                  }}
                  className="form-control"
                  placeholder={`Enter age`}
                  maxLength="2"
                  style={{ flex: 1 }}
                />
                <select
                  value={pet.petAgeUnit}
                  onChange={(e) => handlePetInfoChange(index, 'petAgeUnit', e.target.value)}
                  className="form-control"
                  style={{ width: '120px' }}
                >
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
              {errors[`petAge_${index}`] && <div className="error">{errors[`petAge_${index}`]}</div>}
            </div>



            {/* ── Dog Service Selection ── */}
            {pet.petType === 'dog' && (
              <div className="pet-service-section">
                <h4>❣️ Prices ❣️</h4>

                <div className="form-group">
                  <label>Choose Pricing Option:</label>
                  <div className="pricing-toggle">
                    <button
                      type="button"
                      className={`pricing-btn ${pet.pricingOption === 'regular' ? 'active' : ''}`}
                      disabled={specialRates.some(r => 
                        r.breed.toLowerCase() === pet.petBreed.toLowerCase() || 
                        r.breed.toLowerCase() === pet.petBreed.replace('Saint Bernard', 'St. Bernard').toLowerCase()
                      )}
                      onClick={() => {
                        handlePetInfoChange(index, 'pricingOption', 'regular');
                        const newPets = [...petInfo.pets];
                        newPets[index] = { ...newPets[index], pricingOption: 'regular', selectedService: '' };
                        setPetInfo({ ...petInfo, pets: newPets });
                      }}
                      title={specialRates.some(r => 
                        r.breed.toLowerCase() === pet.petBreed.toLowerCase() || 
                        r.breed.toLowerCase() === pet.petBreed.replace('Saint Bernard', 'St. Bernard').toLowerCase()
                      ) ? "This breed has a mandatory special rate" : ""}
                    >
                      📏 Regular Size Pricing
                    </button>
                    <button
                      type="button"
                      className={`pricing-btn ${pet.pricingOption === 'special' ? 'active' : ''}`}
                      disabled={!specialRates.some(r => 
                        r.breed.toLowerCase() === pet.petBreed.toLowerCase() || 
                        r.breed.toLowerCase() === pet.petBreed.replace('Saint Bernard', 'St. Bernard').toLowerCase()
                      )}
                      onClick={() => {
                        const newPets = [...petInfo.pets];
                        newPets[index] = { ...newPets[index], pricingOption: 'special', selectedService: pet.petBreed };
                        setPetInfo({ ...petInfo, pets: newPets });
                      }}
                      title={!specialRates.some(r => 
                        r.breed.toLowerCase() === pet.petBreed.toLowerCase() || 
                        r.breed.toLowerCase() === pet.petBreed.replace('Saint Bernard', 'St. Bernard').toLowerCase()
                      ) ? "Only available for specific breeds with special rates" : ""}
                    >
                      ⭐ Special Breed Rate
                    </button>
                  </div>
                  {errors[`pricingOption_${index}`] && (
                    <div className="error">{errors[`pricingOption_${index}`]}</div>
                  )}
                </div>

                {/* Regular Size Options */}
                {pet.pricingOption === 'regular' && (
                  <div className="form-group">
                    <label>Select Size:</label>
                    <div className="size-card-grid">
                      {dogSizes.map(size => (
                        <div
                          key={size.id}
                          className={`size-card ${pet.selectedService === size.id ? 'selected' : ''}`}
                          onClick={() => {
                            const newPets = [...petInfo.pets];
                            newPets[index] = { ...newPets[index], selectedService: size.id };
                            setPetInfo({ ...petInfo, pets: newPets });
                          }}
                        >
                          <span className="size-card-name">{size.name}</span>
                          <span className="size-card-price">Php {size.price}</span>
                        </div>
                      ))}
                    </div>
                    {errors[`selectedService_${index}`] && (
                      <div className="error">{errors[`selectedService_${index}`]}</div>
                    )}
                  </div>
                )}

                {/* Special Breed Options - Locked Grid */}
                {pet.pricingOption === 'special' && (
                  <div className="form-group">
                    <label>Special Breed Rates:</label>
                    <div className="special-breed-grid">
                      {specialRates.map(rate => {
                        const breedToMatch = pet.petBreed.replace('Saint Bernard', 'St. Bernard').toLowerCase();
                        const isMatch = rate.breed.toLowerCase() === breedToMatch || 
                                      rate.breed.toLowerCase() === pet.petBreed.toLowerCase();
                        
                        return (
                          <div
                            key={rate.breed}
                            className={`breed-card ${isMatch ? 'selected locked' : 'disabled'}`}
                          >
                            <span className="breed-card-name">{rate.breed}</span>
                            <span className="breed-card-price">Php {rate.price}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Cat Service (auto) ── */}
            {pet.petType === 'cat' && (
              <div className="pet-service-section cat-service">
                <h4>🐈 Cat Grooming</h4>
                <div className="cat-price-badge">
                  <span>Cat Grooming</span>
                  <span className="price">Php {catPrice}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary if multiple pets */}
      {petInfo.petsCount > 1 && (
        <div className="booking-summary-preview">
          <h3>📋 Service Summary</h3>
          <table className="summary-table">
            <thead>
              <tr>
                <th>Pet</th>
                <th>Type</th>
                <th>Service</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {petInfo.pets.map((pet, i) => (
                <tr key={i}>
                  <td>{pet.petName || `Pet ${i + 1}`}</td>
                  <td>{pet.petType === 'dog' ? '🐕 Dog' : '🐈 Cat'}</td>
                  <td>{getPetServiceLabel(pet)}</td>
                  <td>{getPetPrice(pet) ? `Php ${getPetPrice(pet)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}><strong>Estimated Total</strong></td>
                <td><strong>Php {calcTotal()}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );

  // ─── Render Step 2 ─────────────────────────────────────────────────────────

  const renderStep2 = () => (
    <div className="booking-step">
      <h2>📍 Personal Information</h2>

      {/* ── Name Section ── */}
      <div className="section-label">👤 Full Name</div>
      <div className="form-row three-col">
        <div className="form-group">
          <label>First Name <span className="required">*</span></label>
          <input
            type="text"
            value={personalInfo.firstName}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '');
              setPersonalInfo({ ...personalInfo, firstName: val });
            }}
            className="form-control"
            placeholder="First name"
          />
          {errors.firstName && <div className="error">{errors.firstName}</div>}
        </div>
        <div className="form-group">
          <label>Middle Name</label>
          <input
            type="text"
            value={personalInfo.middleName}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '');
              setPersonalInfo({ ...personalInfo, middleName: val });
            }}
            className="form-control"
            placeholder="Middle name"
          />
        </div>
        <div className="form-group">
          <label>Last Name <span className="required">*</span></label>
          <input
            type="text"
            value={personalInfo.lastName}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-Z\s.-]/g, '');
              setPersonalInfo({ ...personalInfo, lastName: val });
            }}
            className="form-control"
            placeholder="Last name"
          />
          {errors.lastName && <div className="error">{errors.lastName}</div>}
        </div>
      </div>

      <div className="form-group">
        <label>Contact Number <span className="required">*</span></label>
        <input
          type="tel"
          value={personalInfo.contactNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, ''); // only numbers
            if (val.length <= 11) {
              setPersonalInfo({ ...personalInfo, contactNumber: val });
            }
          }}
          className="form-control"
          placeholder="e.g. 09123456789"
        />
        {errors.contactNumber && <div className="error">{errors.contactNumber}</div>}
      </div>

      {/* ── Location Section ── */}
      <div className="section-label">📍 Location</div>

      <div className="form-row">
        <div className="form-group">
          <label>House No. <span className="required">*</span></label>
          <input
            type="text"
            value={personalInfo.houseNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setPersonalInfo({ ...personalInfo, houseNumber: val });
            }}
            className="form-control"
            placeholder="e.g. 123"
          />
          {errors.houseNumber && <div className="error">{errors.houseNumber}</div>}
        </div>
        <div className="form-group">
          <label>Purok</label>
          <input
            type="text"
            value={personalInfo.purokNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setPersonalInfo({ ...personalInfo, purokNumber: val });
            }}
            className="form-control"
            placeholder="e.g. 3"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Barangay <span className="required">*</span></label>
        <select
          value={personalInfo.barangay}
          onChange={(e) => setPersonalInfo({ ...personalInfo, barangay: e.target.value })}
          className="form-control"
        >
          <option value="">— Select Barangay —</option>
          {LIPA_BARANGAYS.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        {errors.barangay && <div className="error">{errors.barangay}</div>}
      </div>

      <div className="form-group">
        <label>City</label>
        <input
          type="text"
          value={personalInfo.city}
          className="form-control city-locked"
          readOnly
        />
      </div>



      {/* ── ID Section ── */}
      <div className="section-label">🪪 Identification</div>

      <div className="form-group">
        <div className="image-upload-section">
          <label className="form-label">Back-to-Back ID Images (upload 2 images)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const newFiles = Array.from(e.target.files);
              const combinedFiles = [...personalInfo.backToBackIdImages, ...newFiles];
              if (combinedFiles.length <= 2) {
                setPersonalInfo({ ...personalInfo, backToBackIdImages: combinedFiles });
                // Create image previews
                newFiles.forEach((file) => {
                  console.log('Processing file:', file.name);
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    console.log('File loaded:', file.name, 'Data length:', event.target.result.length);
                    setImagePreviews(prev => ({
                      ...prev,
                      [file.name]: event.target.result
                    }));
                  };
                  reader.onerror = (error) => {
                    console.error('Error reading file:', file.name, error);
                  };
                  reader.readAsDataURL(file);
                });
              } else {
                alert('You can only upload a maximum of 2 images total');
              }
              // Reset the input so the same file can be selected if removed
              e.target.value = null;
            }}
            className="form-control"
          />
          <div className="booking-id-preview-list">
            {personalInfo.backToBackIdImages.map((file, index) => (
              <div key={`${file.name}-${index}-${Date.now()}`} className="booking-id-preview-item">
                <div
                  className="preview-thumbnail"
                  onClick={() => {
                    if (imagePreviews[file.name]) {
                      setSelectedIdImage({ data: imagePreviews[file.name], name: file.name, side: index === 0 ? '(Front)' : '(Back)' });
                    } else {
                      alert('Image still loading, please wait...');
                    }
                  }}
                  title="Click to view image"
                >
                  {imagePreviews[file.name] ? (
                    <img src={imagePreviews[file.name]} alt={file.name} className="thumbnail-img" />
                  ) : (
                    <div className="preview-placeholder">Loading...</div>
                  )}
                  <div className="side-badge">{index === 0 ? 'Front' : 'Back'}</div>
                </div>
                <div className="file-meta">
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => {
                      const newImages = [...personalInfo.backToBackIdImages];
                      const removedFileName = newImages[index].name;
                      newImages.splice(index, 1);
                      setPersonalInfo({ ...personalInfo, backToBackIdImages: newImages });
                      // Remove preview
                      setImagePreviews(prev => {
                        const updated = { ...prev };
                        delete updated[removedFileName];
                        return updated;
                      });
                    }}
                    title="Remove image"
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <small
            style={{ color: personalInfo.backToBackIdImages.length === 2 ? '#28a745' : '#6c757d', fontWeight: 'bold' }}
          >
            {personalInfo.backToBackIdImages.length}/2 Images Uploaded
          </small>
        </div>
        {errors.backToBackIdImages && <div className="error">{errors.backToBackIdImages}</div>}
      </div>
    </div>
  );

  // ─── Render Step 3 ─────────────────────────────────────────────────────────

  const renderStep3 = () => (
    <div className="booking-step">
      <h2>📅 Schedule & Review</h2>

      {/* Per-pet service summary */}
      <div className="service-review-section">
        <h3>🐾 Your Pets & Services</h3>
        <div className="pet-review-cards">
          {petInfo.pets.map((pet, i) => (
            <div key={i} className="pet-review-card">
              <div className="pet-review-header">
                <span className="pet-review-icon">{pet.petType === 'dog' ? '🐕' : '🐈'}</span>
                <span className="pet-review-name">{pet.petName || `Pet ${i + 1}`}</span>
                <span className="pet-review-type">{pet.petType === 'dog' ? 'Dog' : 'Cat'}</span>
              </div>
              <div className="pet-review-details">
                <div className="pet-review-row">
                  <span>Breed:</span>
                  <span>{pet.petBreed}</span>
                </div>

                <div className="pet-review-row">
                  <span>Service:</span>
                  <span className="service-label">{getPetServiceLabel(pet)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="total-price-banner">
          <span>💰 Estimated Total:</span>
          <span className="total-amount">Php {calcTotal()}</span>
        </div>
      </div>

      {/* Date & Time */}
      <div className="schedule-selection">
        <h3>🗓 Select Date & Time</h3>
        <div className="schedule-grid">
          <div className="form-group">
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-control"
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.date && <div className="error">{errors.date}</div>}
          </div>

          <div className="form-group">
            <label>Select Time</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="form-control"
              disabled={!selectedDate}
            >
              <option value="">Select Time</option>
              {timeSlots.map(time => {
                const isAvailable = availableSlots.includes(time);
                return (
                  <option
                    key={time}
                    value={time}
                    disabled={!isAvailable}
                    style={{
                      color: isAvailable ? '#28a745' : '#dc3545',
                      fontWeight: isAvailable ? '600' : 'normal'
                    }}
                  >
                    {time} {isAvailable ? '✅ Available' : '❌ Not Available'}
                  </option>
                );
              })}
            </select>
            {errors.time && <div className="error">{errors.time}</div>}
          </div>
        </div>

        {selectedDate && (
          <div className="reserved-times">
            <p className="available-note">✅ Only available times are selectable for {new Date(selectedDate).toLocaleDateString()}</p>
          </div>
        )}

        {/* Promo Code Section moved to Schedule */}
        <div className="promo-code-section" style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: '#f0f9ff', 
          borderRadius: '12px', 
          border: '2px solid #bae6fd' 
        }}>
          <label style={{ display: 'block', fontSize: '0.9rem', color: '#0369a1', marginBottom: '10px', fontWeight: 'bold' }}>
            🎁 Have a Reward Code?
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setIsCodeVerified(false);
                setDiscountPercent(0);
                setCustomerTier('');
                setCodeError('');
              }}
              placeholder="ENTER 6-DIGIT CODE"
              disabled={isCodeVerified}
              style={{
                flex: 1,
                padding: '12px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '1rem',
                letterSpacing: '2px',
                textAlign: 'center',
                textTransform: 'uppercase',
                backgroundColor: isCodeVerified ? '#f1f5f9' : 'white'
              }}
            />
            {!isCodeVerified ? (
              <button 
                type="button"
                onClick={handleVerifyCode}
                className="btn-primary"
                style={{ padding: '10px 20px' }}
              >
                Verify
              </button>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setIsCodeVerified(false);
                  setDiscountPercent(0);
                  setCustomerTier('');
                  setPromoCode('');
                }}
                className="btn-secondary"
                style={{ padding: '10px 20px', backgroundColor: '#94a3b8' }}
              >
                Clear
              </button>
            )}
          </div>
          {codeError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '8px', fontWeight: '600' }}>❌ {codeError}</p>}
          {isCodeVerified && (
          <p style={{ color: '#059669', fontSize: '0.8rem', marginTop: '8px', fontWeight: '600' }}>
            ✅ {customerTier} Tier Applied! -Php {getAppliedDiscount()} discount ({discountPercent}% off most expensive service)
          </p>
        )}
        </div>
      </div>
      {/* Special Requests */}
      <div className="form-group" style={{ marginTop: '20px' }}>
        <label>Special Requests</label>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          className="form-control"
          rows="4"
          placeholder="Any special requests or notes for the groomer?"
        />
      </div>
    </div>
  );

  // ─── Render Step 4 ─────────────────────────────────────────────────────────

  const renderStep4 = () => (
    <div className="booking-step confirm-step">
      <div className="confirm-header">
        <div className="confirm-icon">🎉</div>
        <h2>Booking Confirmation</h2>
        <p>Please review all details below before confirming your appointment.</p>
      </div>

      {/* ── Pet Information ── */}
      <div className="confirm-section">
        <div className="confirm-section-title">
          <span className="confirm-section-icon">🐾</span>
          <h3>Pet Information</h3>
        </div>
        <div className="confirm-pet-cards">
          {petInfo.pets.map((pet, i) => (
            <div key={i} className="confirm-pet-card">
              <div className="confirm-pet-header">
                <span>{pet.petType === 'dog' ? '🐕' : '🐈'}</span>
                <strong>{pet.petName || `Pet ${i + 1}`}</strong>
                <span className="confirm-pet-badge">{pet.petType === 'dog' ? 'Dog' : 'Cat'}</span>
              </div>
              <div className="confirm-rows">
                <div className="confirm-row">
                  <span>Breed</span>
                  <span>{pet.petBreed || '—'}</span>
                </div>
                <div className="confirm-row">
                  <span>Age</span>
                  <span>{pet.petAge ? `${pet.petAge} ${pet.petAgeUnit === 'months' ? 'months' : 'years'}` : '—'}</span>
                </div>
                <div className="confirm-row">
                  <span>Service</span>
                  <span className="confirm-highlight">{getPetServiceLabel(pet)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Applied Discount Display */}
        {isCodeVerified && (
          <div className="confirm-row discount" style={{ color: '#059669', fontWeight: 'bold', marginTop: '10px', padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '8px' }}>
            <span>🎁 {customerTier} Tier Discount ({discountPercent}%)</span>
            <span>-Php {getAppliedDiscount()}</span>
          </div>
        )}

        <div className="confirm-total-row">
          <span>💰 Final Total</span>
          <span className="confirm-total-amount">Php {calcTotal()}</span>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <div className="confirm-section">
        <div className="confirm-section-title">
          <span className="confirm-section-icon">📍</span>
          <h3>Personal Information</h3>
        </div>
        <div className="confirm-info-grid">
          <div className="confirm-row">
            <span>Full Name</span>
            <span>
              {[personalInfo.firstName, personalInfo.middleName, personalInfo.lastName]
                .filter(Boolean).join(' ') || '—'}
            </span>
          </div>
          <div className="confirm-row">
            <span>Contact Number</span>
            <span>{personalInfo.contactNumber || '—'}</span>
          </div>
          <div className="confirm-row">
            <span>House No.</span>
            <span>{personalInfo.houseNumber || '—'}</span>
          </div>
          {personalInfo.purokNumber && (
            <div className="confirm-row">
              <span>Purok</span>
              <span>{personalInfo.purokNumber}</span>
            </div>
          )}
          <div className="confirm-row">
            <span>Barangay</span>
            <span>{personalInfo.barangay || '—'}</span>
          </div>
          <div className="confirm-row">
            <span>City</span>
            <span>{personalInfo.city}</span>
          </div>

        </div>
      </div>


      {/* ── Appointment Schedule ── */}
      <div className="confirm-section">
        <div className="confirm-section-title">
          <span className="confirm-section-icon">📅</span>
          <h3>Appointment Schedule</h3>
        </div>
        <div className="confirm-info-grid">
          <div className="confirm-row">
            <span>Date</span>
            <span className="confirm-highlight">
              {selectedDate || '—'}
            </span>
          </div>
          <div className="confirm-row">
            <span>Time</span>
            <span className="confirm-highlight">{selectedTime || '—'}</span>
          </div>
          {specialRequests && (
            <div className="confirm-row confirm-row-block" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <span>Special Requests</span>
              <span style={{ marginTop: '5px', color: '#666', fontSize: '0.95rem' }}>{specialRequests}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Final Notice ── */}
      <div className="confirm-notice">
        <p>✅ By clicking <strong>Confirm Booking</strong>, you agree to our terms and confirm all details above are correct.</p>
      </div>
    </div>
  );

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <div className="booking-container">


      <div className="booking-header">
        <h1>🐾 Book Your Pet's Grooming Service</h1>
        <p>Complete the form below to schedule your pet's grooming appointment</p>
      </div>

      <div className="step-indicator">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Pet Info</div>
        {!initialProfileComplete && (
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Personal Info</div>
        )}
        <div className={`step ${step >= 3 ? 'active' : ''}`}>{initialProfileComplete ? '2. Schedule' : '3. Schedule'}</div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>{initialProfileComplete ? '3. Confirm' : '4. Confirm'}</div>
      </div>

      <div className="booking-content">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      <div className="booking-actions">
        {step > 1 && (
          <button className="btn-secondary" onClick={prevStep}>← Back</button>
        )}
        {step < 4 ? (
          <button className="btn-primary" onClick={nextStep}>Next →</button>
        ) : (
          <button
            className="btn-primary"
            style={{
              background: isSubmitting ? '#6c757d' : 'linear-gradient(135deg, #28a745, #218838)',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
            disabled={isSubmitting}
            onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
          >
            {isSubmitting ? '🔄 Processing...' : '✅ Confirm Booking'}
          </button>
        )}
      </div>

      {/* ID IMAGE VIEWER MODAL */}
      {selectedIdImage && (
        <div className="image-viewer-overlay" onClick={() => setSelectedIdImage(null)}>
          <div className="image-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-viewer-header">
              <h3>ID Image {selectedIdImage.side}</h3>
              <button className="close-btn" onClick={() => setSelectedIdImage(null)}>✕</button>
            </div>
            <div className="image-viewer-content">
              <img
                src={selectedIdImage.data}
                alt={selectedIdImage.name}
                className="full-image"
                onLoad={(e) => {
                  // Detect image orientation and apply appropriate class
                  const img = e.target;
                  const aspectRatio = img.naturalWidth / img.naturalHeight;

                  if (aspectRatio > 1.5) {
                    // Landscape (wider than tall)
                    img.classList.add('landscape');
                  } else if (aspectRatio < 0.75) {
                    // Portrait (taller than wide)
                    img.classList.add('portrait');
                  }
                  // Otherwise, let it be square/near-square
                }}
              />
              <p className="image-name">{selectedIdImage.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
