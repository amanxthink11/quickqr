export interface LogoPreset {
  id: string;
  name: string;
  category: 'payment' | 'social' | 'general';
  dataUrl: string;
}

// Crisp inline SVGs converted to data URLs for high scan reliability
const UPI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23097939"/><polygon points="40,25 70,50 40,75" fill="%23ffffff"/><polygon points="30,30 55,50 30,70" fill="%23f58220"/></svg>`;

const RUPAY_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%230f3a60"/><polygon points="20,70 45,70 65,30 40,30" fill="%230097d7"/><polygon points="48,70 75,70 90,30 63,30" fill="%23f37021"/></svg>`;

const WHATSAPP_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%2325D366"/><path fill="%23ffffff" d="M50 20c-16.5 0-30 13.5-30 30 0 5.3 1.4 10.3 3.8 14.7L20 80l16-4.2c4.2 2.3 9 3.6 14 3.6 16.5 0 30-13.5 30-30s-13.5-29.4-30-29.4zm14.7 42.4c-.6 1.7-3 3.1-4.9 3.5-1.3.3-3 .5-8.7-1.9-7.3-3.1-12-10.4-12.4-10.9-.4-.5-3-4-3-7.6 0-3.6 1.9-5.4 2.6-6.1.7-.7 1.5-.9 2-.9.5 0 1 0 1.5.1.5.1 1.2-.2 1.8 1.4.7 1.6 2.3 5.5 2.5 5.9.2.4.3.9.1 1.4-.2.5-.4.8-.8 1.2-.4.4-.8.9-1.2 1.2-.4.4-.9.9-.4 1.7.5.9 2.2 3.6 4.7 5.8 3.2 2.9 6 3.8 6.8 4.2.8.4 1.3.4 1.8-.2.5-.6 2.1-2.4 2.6-3.3.6-.8 1.1-.7 1.8-.4.7.3 4.6 2.2 5.4 2.6.8.4 1.3.6 1.5.9.2.5.2 2.8-.4 4.5z"/></svg>`;

const GOOGLE_STAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%234285F4"/><polygon points="50,18 60,38 82,41 66,57 70,78 50,67 30,78 34,57 18,41 40,38" fill="%23FBBC05"/></svg>`;

const WIFI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%230284c7"/><path fill="%23ffffff" d="M50 68a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-18-12a25.4 25.4 0 0 1 36 0l4.2-4.2a31.4 31.4 0 0 0-44.4 0l4.2 4.2zm-9-9a38.1 38.1 0 0 1 54 0l4.2-4.2a44.1 44.1 0 0 0-62.4 0l4.2 4.2z"/></svg>`;

const PHONE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%2316a34a"/><path fill="%23ffffff" d="M68 59.2c-2.4-.6-6.8-3.4-8.8-3.4-1.2 0-2.4.8-3.4 1.8l-3.2 3.2c-6.8-3.4-12.4-9-15.8-15.8l3.2-3.2c1-1 1.8-2.2 1.8-3.4 0-2-2.8-6.4-3.4-8.8-.6-2.4-1.8-3-3.6-3s-5.6 1.4-7.4 3.2c-3.2 3.2-4.4 7.6-4.4 12.2 0 17.6 14.4 32 32 32 4.6 0 9-1.2 12.2-4.4 1.8-1.8 3.2-5.6 3.2-7.4 0-1.8-.6-3-2.4-3.6z"/></svg>`;

export const LOGO_PRESETS: LogoPreset[] = [
  {
    id: 'upi',
    name: 'BHIM UPI',
    category: 'payment',
    dataUrl: UPI_SVG,
  },
  {
    id: 'rupay',
    name: 'RuPay Card',
    category: 'payment',
    dataUrl: RUPAY_SVG,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    category: 'social',
    dataUrl: WHATSAPP_SVG,
  },
  {
    id: 'google-star',
    name: 'Google Rating Star',
    category: 'general',
    dataUrl: GOOGLE_STAR_SVG,
  },
  {
    id: 'wifi',
    name: 'Wi-Fi Signal',
    category: 'general',
    dataUrl: WIFI_SVG,
  },
  {
    id: 'phone',
    name: 'Phone Call',
    category: 'general',
    dataUrl: PHONE_SVG,
  },
];
