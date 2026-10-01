import {
  QRCustomization,
  QRType,
  QRPayloadInputMap,
  StylePreset,
} from './types';

export const DEFAULT_CUSTOMIZATION: QRCustomization = {
  fgColor: '#1E293B', // Slate 800
  bgColor: '#FFFFFF',
  dotStyle: 'rounded',
  eyeStyle: 'rounded',
  eyeColor: '#1E293B',
  size: 320,
  margin: 3,
  errorCorrectionLevel: 'M',
  logoUrl: undefined,
  logoSize: 0.22,
  logoMargin: 2,
  frameStyle: 'bottom-banner',
  frameText: 'SCAN ME',
  frameColor: '#1E293B',
  frameTextColor: '#FFFFFF',
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'classic',
    name: 'Classic Black',
    category: 'minimal',
    customization: {
      fgColor: '#000000',
      bgColor: '#FFFFFF',
      dotStyle: 'square',
      eyeStyle: 'square',
      eyeColor: '#000000',
      frameColor: '#000000',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'upi-emerald',
    name: 'Scan & Pay Emerald',
    category: 'payments',
    customization: {
      fgColor: '#065F46', // Deep emerald
      bgColor: '#FFFFFF',
      dotStyle: 'rounded',
      eyeStyle: 'rounded',
      eyeColor: '#047857',
      errorCorrectionLevel: 'H',
      frameStyle: 'bottom-banner',
      frameText: 'SCAN & PAY WITH ANY UPI APP',
      frameColor: '#065F46',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'whatsapp-green',
    name: 'WhatsApp Business',
    category: 'social',
    customization: {
      fgColor: '#0F766E', // Teal/WhatsApp green tone
      bgColor: '#FFFFFF',
      dotStyle: 'dots',
      eyeStyle: 'rounded',
      eyeColor: '#0F766E',
      frameStyle: 'bottom-banner',
      frameText: 'CHAT ON WHATSAPP',
      frameColor: '#0F766E',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'modern-indigo',
    name: 'Modern Indigo',
    category: 'business',
    customization: {
      fgColor: '#3730A3', // Indigo 800
      bgColor: '#FFFFFF',
      dotStyle: 'classy',
      eyeStyle: 'rounded',
      eyeColor: '#3730A3',
      frameStyle: 'bottom-banner',
      frameText: 'SCAN WITH PHONE CAMERA',
      frameColor: '#3730A3',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'review-amber',
    name: 'Google Review Gold',
    category: 'business',
    customization: {
      fgColor: '#B45309', // Amber 700
      bgColor: '#FFFFFF',
      dotStyle: 'rounded',
      eyeStyle: 'rounded',
      eyeColor: '#B45309',
      frameStyle: 'card',
      frameText: '★ REVIEW US ON GOOGLE ★',
      frameColor: '#B45309',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'restaurant-menu',
    name: 'Digital Menu Burgundy',
    category: 'creative',
    customization: {
      fgColor: '#881337', // Rose 900
      bgColor: '#FFFFFF',
      dotStyle: 'extra-rounded',
      eyeStyle: 'rounded',
      eyeColor: '#881337',
      frameStyle: 'card',
      frameText: 'VIEW DIGITAL MENU',
      frameColor: '#881337',
      frameTextColor: '#FFFFFF',
    },
  },
  {
    id: 'minimal-slate',
    name: 'Minimalist Slate',
    category: 'minimal',
    customization: {
      fgColor: '#334155',
      bgColor: '#F8FAFC',
      dotStyle: 'square',
      eyeStyle: 'square',
      eyeColor: '#334155',
      frameStyle: 'none',
    },
  },
  {
    id: 'vibrant-blue',
    name: 'Tech Blue',
    category: 'business',
    customization: {
      fgColor: '#1D4ED8',
      bgColor: '#FFFFFF',
      dotStyle: 'rounded',
      eyeStyle: 'circle',
      eyeColor: '#1D4ED8',
      frameStyle: 'bottom-banner',
      frameText: 'SCAN TO CONNECT',
      frameColor: '#1D4ED8',
      frameTextColor: '#FFFFFF',
    },
  },
];

export const INITIAL_INPUTS: QRPayloadInputMap = {
  upi: {
    vpa: 'sharma.kirana@okhdfcbank',
    payeeName: 'Sharma General Store',
    amount: '',
    currency: 'INR',
    transactionNote: 'Pay at Store',
    transactionRef: '',
  },
  whatsapp: {
    countryCode: '+91',
    phoneNumber: '9876543210',
    message: 'Hi, I would like to enquire about your services.',
  },
  url: {
    url: 'https://example.in',
    name: 'Business Website',
  },
  wifi: {
    ssid: 'SharmaStore_Free_WiFi',
    password: 'WelcomeToStore',
    authType: 'WPA',
    hidden: false,
  },
  vcard: {
    firstName: 'Rajesh',
    lastName: 'Sharma',
    organization: 'Apex Solutions Pvt Ltd',
    title: 'Managing Director',
    phone: '+91 11 2345 6789',
    mobile: '+91 98765 43210',
    email: 'rajesh@apexsolutions.in',
    website: 'https://apexsolutions.in',
    street: 'Plot 42, Sector 18',
    city: 'Gurugram',
    state: 'Haryana',
    zipCode: '122015',
    country: 'India',
  },
  phone: {
    phoneNumber: '+919876543210',
  },
  email: {
    email: 'support@apexsolutions.in',
    subject: 'Customer Enquiry',
    body: 'Hello Support Team,\n\nI have a question regarding...',
  },
  text: {
    text: 'Welcome to Apex Solutions! Scan here for customer service assistance.',
  },
  maps: {
    queryOrUrl: 'Connaught Place, New Delhi, Delhi 110001',
  },
  review: {
    reviewUrl: 'https://g.page/r/your-google-business-review-link/review',
    placeName: 'Sharma General Store',
  },
  pdf: {
    pdfUrl: 'https://example.in/documents/product-catalog.pdf',
    documentTitle: 'Product Catalog 2026',
  },
  menu: {
    menuUrl: 'https://example.in/menu',
    restaurantName: 'The Royal Bistro',
  },
};

export const QR_TYPE_INFO: Record<
  QRType,
  {
    title: string;
    shortTitle: string;
    description: string;
    badge: string;
    path: string;
    icon: string;
  }
> = {
  upi: {
    title: 'Free UPI QR Code Generator',
    shortTitle: 'UPI Payment',
    description: 'Create zero-fee UPI payment QR codes for Google Pay, PhonePe, Paytm, and BHIM.',
    badge: 'Most Popular',
    path: '/upi-qr-code-generator',
    icon: 'IndianRupee',
  },
  whatsapp: {
    title: 'WhatsApp Click-to-Chat QR Generator',
    shortTitle: 'WhatsApp Chat',
    description: 'Connect with customers on WhatsApp instantly with custom pre-filled messages.',
    badge: 'Customer Support',
    path: '/whatsapp-qr-code-generator',
    icon: 'MessageSquare',
  },
  url: {
    title: 'Website URL QR Code Generator',
    shortTitle: 'Website URL',
    description: 'Direct customers straight to your website, landing page, or online store.',
    badge: 'Universal',
    path: '/url-qr-code-generator',
    icon: 'Globe',
  },
  review: {
    title: 'Google Review QR Code Generator',
    shortTitle: 'Google Review',
    description: 'Make it easy for patrons to share feedback by placing scan-to-review QR stands on store counters.',
    badge: 'Grow Trust',
    path: '/google-review-qr-code-generator',
    icon: 'Star',
  },
  menu: {
    title: 'Digital Menu QR Code Generator',
    shortTitle: 'Restaurant Menu',
    description: 'Touchless digital dining menus for restaurants, cafes, and hotels.',
    badge: 'F&B Favorite',
    path: '/menu-qr-code-generator',
    icon: 'Utensils',
  },
  wifi: {
    title: 'Wi-Fi QR Code Generator',
    shortTitle: 'Wi-Fi Network',
    description: 'Allow guests and customers to connect to your Wi-Fi without typing passwords.',
    badge: 'Convenience',
    path: '/wifi-qr-code-generator',
    icon: 'Wifi',
  },
  vcard: {
    title: 'vCard / Digital Business Card QR Generator',
    shortTitle: 'Digital Business Card',
    description: 'Share all your contact details, designation, phone, and address in one scan.',
    badge: 'Networking',
    path: '/vcard-qr-code-generator',
    icon: 'Contact',
  },
  maps: {
    title: 'Google Maps Location QR Code Generator',
    shortTitle: 'Store Location',
    description: 'Help customers navigate directly to your shop, clinic, office, or event venue.',
    badge: 'Navigation',
    path: '/google-maps-qr-code-generator',
    icon: 'MapPin',
  },
  pdf: {
    title: 'PDF Document QR Code Generator',
    shortTitle: 'PDF Document',
    description: 'Share brochures, product specifications, guides, and price lists via QR.',
    badge: 'Documents',
    path: '/pdf-qr-code-generator',
    icon: 'FileText',
  },
  phone: {
    title: 'Phone Call QR Code Generator',
    shortTitle: 'Direct Call',
    description: 'Let customers dial your business hotline or desk with a single tap.',
    badge: 'Speed Dial',
    path: '/phone-qr-code-generator',
    icon: 'PhoneCall',
  },
  email: {
    title: 'Email QR Code Generator',
    shortTitle: 'Draft Email',
    description: 'Generate QR codes that open an email client with pre-filled subject and recipient.',
    badge: 'Inquiries',
    path: '/email-qr-code-generator',
    icon: 'Mail',
  },
  text: {
    title: 'Plain Text QR Code Generator',
    shortTitle: 'Plain Text',
    description: 'Encode plain text, serial numbers, WiFi passphrases, or custom notes.',
    badge: 'Simple',
    path: '/text-qr-code-generator',
    icon: 'AlignLeft',
  },
};
