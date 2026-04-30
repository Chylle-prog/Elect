// Route configuration constants for the pet grooming system

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  ABOUT: '/about',
  CONTACTS: '/contacts',
  REVIEWS: '/reviews',
  
  // Protected routes (require authentication)
  BOOKING: '/booking',
  PROFILE: '/profile',
  
  // Redirect routes
  DEFAULT: '/home',
  NOT_FOUND: '*'
};

// Route categories for organization
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.ABOUT,
  ROUTES.CONTACTS,
  ROUTES.REVIEWS
];

export const PROTECTED_ROUTES = [
  ROUTES.BOOKING,
  ROUTES.PROFILE
];

// Navigation items for the navigation bar
export const NAVIGATION_ITEMS = [
  { path: ROUTES.HOME, label: 'Home', icon: '🏠' },
  { path: ROUTES.BOOKING, label: 'Booking', icon: '📅', protected: true },
  { path: ROUTES.PROFILE, label: 'Profile', icon: '👤', protected: true },
  { path: ROUTES.REVIEWS, label: 'Reviews', icon: '⭐' },
  { path: ROUTES.CONTACTS, label: 'Contacts', icon: '📞' },
  { path: ROUTES.ABOUT, label: 'About', icon: 'ℹ️' }
];

// Route metadata
export const ROUTE_METADATA = {
  [ROUTES.HOME]: {
    title: 'Pet Paradise - Home',
    description: 'Welcome to Pet Paradise Grooming System',
    requiresAuth: false
  },
  [ROUTES.LOGIN]: {
    title: 'Login - Pet Paradise',
    description: 'Login to your Pet Paradise account',
    requiresAuth: false
  },
  [ROUTES.BOOKING]: {
    title: 'Book Appointment - Pet Paradise',
    description: 'Book a grooming appointment for your pet',
    requiresAuth: true
  },
  [ROUTES.PROFILE]: {
    title: 'My Profile - Pet Paradise',
    description: 'Manage your profile and pets',
    requiresAuth: true
  },
  [ROUTES.REVIEWS]: {
    title: 'Customer Reviews - Pet Paradise',
    description: 'Read and write customer reviews',
    requiresAuth: false
  },
  [ROUTES.CONTACTS]: {
    title: 'Contact Us - Pet Paradise',
    description: 'Get in touch with Pet Paradise',
    requiresAuth: false
  },
  [ROUTES.ABOUT]: {
    title: 'About Us - Pet Paradise',
    description: 'Learn more about Pet Paradise',
    requiresAuth: false
  }
};
