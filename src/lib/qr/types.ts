export type QRType =
  | 'upi'
  | 'whatsapp'
  | 'url'
  | 'wifi'
  | 'vcard'
  | 'phone'
  | 'email'
  | 'text'
  | 'maps'
  | 'review'
  | 'pdf'
  | 'menu';

export type QRErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type QRDotStyle = 'square' | 'dots' | 'rounded' | 'classy' | 'extra-rounded';

export type QREyeStyle = 'square' | 'rounded' | 'circle';

export type QRFrameStyle =
  | 'none'
  | 'bottom-banner'
  | 'top-banner'
  | 'card'
  | 'badge'
  | 'minimal-border';

export interface UPIPayloadInput {
  vpa: string; // e.g. merchant@okhdfcbank
  payeeName: string; // e.g. Sharma Kirana Store
  amount?: string; // Optional fixed amount, e.g. "150.00"
  currency?: string; // Default "INR"
  transactionRef?: string; // Transaction reference / Bill number
  transactionNote?: string; // e.g. "Order #1024"
  merchantCode?: string; // Optional MCC code
}

export interface WhatsAppPayloadInput {
  countryCode: string; // e.g. "+91" or "91"
  phoneNumber: string; // e.g. "9876543210"
  message?: string; // Optional pre-filled text
}

export interface URLPayloadInput {
  url: string;
  name?: string; // Local label
}

export interface WiFiPayloadInput {
  ssid: string;
  password?: string;
  authType: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export interface VCardPayloadInput {
  firstName: string;
  lastName: string;
  organization?: string;
  title?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface PhonePayloadInput {
  phoneNumber: string;
}

export interface EmailPayloadInput {
  email: string;
  subject?: string;
  body?: string;
}

export interface TextPayloadInput {
  text: string;
}

export interface MapsPayloadInput {
  queryOrUrl: string; // Full google maps URL or search query/address
}

export interface GoogleReviewPayloadInput {
  reviewUrl: string; // Place review URL (e.g. https://g.page/r/.../review)
  placeName?: string;
}

export interface PDFPayloadInput {
  pdfUrl: string;
  documentTitle?: string;
}

export interface MenuPayloadInput {
  menuUrl: string;
  restaurantName?: string;
}

export type QRPayloadInputMap = {
  upi: UPIPayloadInput;
  whatsapp: WhatsAppPayloadInput;
  url: URLPayloadInput;
  wifi: WiFiPayloadInput;
  vcard: VCardPayloadInput;
  phone: PhonePayloadInput;
  email: EmailPayloadInput;
  text: TextPayloadInput;
  maps: MapsPayloadInput;
  review: GoogleReviewPayloadInput;
  pdf: PDFPayloadInput;
  menu: MenuPayloadInput;
};

export interface QRCustomization {
  fgColor: string;
  bgColor: string;
  dotStyle: QRDotStyle;
  eyeStyle: QREyeStyle;
  eyeColor?: string;
  size: number; // In pixels for the QR code matrix, e.g. 300
  margin: number; // Quiet zone modules
  errorCorrectionLevel: QRErrorCorrectionLevel;
  logoUrl?: string; // Data URL or public asset path
  logoSize: number; // Proportion: 0.15 to 0.30
  logoMargin: number; // Padding around logo in modules
  frameStyle: QRFrameStyle;
  frameText: string;
  frameColor: string;
  frameTextColor: string;
}

export interface QRValidationResult {
  isValid: boolean;
  error?: string;
  warnings: string[];
}

export interface QRReadabilityResult {
  isReadable: boolean;
  score: number; // 0 to 100
  decodedText?: string;
  issues: string[];
  suggestions: string[];
}

export interface StylePreset {
  id: string;
  name: string;
  category: 'business' | 'creative' | 'minimal' | 'payments' | 'social';
  customization: Partial<QRCustomization>;
}
