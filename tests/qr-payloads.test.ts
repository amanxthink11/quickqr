import { describe, it, expect } from 'vitest';
import {
  buildUPIPayload,
  buildWhatsAppPayload,
  buildURLPayload,
  buildWiFiPayload,
  buildVCardPayload,
  buildPhonePayload,
  buildEmailPayload,
  buildTextPayload,
  buildMapsPayload,
  buildGoogleReviewPayload,
  buildPDFPayload,
  buildMenuPayload,
  buildQRPayload,
} from '../src/lib/qr/payloads';

describe('QR Payloads Builder', () => {
  it('builds standard UPI payload with open amount and percent-encoded spaces', () => {
    const payload = buildUPIPayload({
      vpa: 'merchant@okhdfcbank',
      payeeName: 'Sharma General Store',
      currency: 'INR',
      transactionNote: 'Kirana Order',
    });
    expect(payload).toContain('upi://pay?');
    expect(payload).toContain('pa=merchant%40okhdfcbank');
    expect(payload).toContain('pn=Sharma%20General%20Store');
    expect(payload).toContain('cu=INR');
    expect(payload).toContain('tn=Kirana%20Order');
    expect(payload).not.toContain('am=');
    expect(payload).not.toContain('+');
  });

  it('builds UPI payload with fixed decimal amount and reference ID', () => {
    const payload = buildUPIPayload({
      vpa: 'user@paytm',
      payeeName: 'Chai Point',
      amount: '45.50',
      currency: 'INR',
      transactionRef: 'INV-2026-001',
    });
    expect(payload).toContain('pa=user%40paytm');
    expect(payload).toContain('pn=Chai%20Point');
    expect(payload).toContain('am=45.50');
    expect(payload).toContain('tr=INV-2026-001');
  });

  it('handles Indian Rupee amounts with decimals and special characters in notes', () => {
    const payload = buildUPIPayload({
      vpa: 'bills@icici',
      payeeName: 'M/s Gupta & Sons',
      amount: '1250.75',
      transactionNote: 'Bill #99 & Service Charges',
    });
    expect(payload).toContain('am=1250.75');
    expect(payload).toContain('pn=M%2Fs%20Gupta%20%26%20Sons');
    expect(payload).toContain('tn=Bill%20%2399%20%26%20Service%20Charges');
  });

  it('sanitizes newlines in UPI input fields to prevent URI corruption', () => {
    const payload = buildUPIPayload({
      vpa: 'merchant\r\n@okhdfcbank',
      payeeName: 'Sharma\nStore',
      transactionNote: 'Line1\nLine2',
    });
    expect(payload).not.toContain('%0A');
    expect(payload).not.toContain('%0D');
    expect(payload).toContain('pa=merchant%40okhdfcbank');
    expect(payload).toContain('pn=Sharma%20Store');
    expect(payload).toContain('tn=Line1%20Line2');
  });

  it('builds WhatsApp click-to-chat URL with country code and message', () => {
    const payload = buildWhatsAppPayload({
      countryCode: '+91',
      phoneNumber: '9876543210',
      message: 'Hello, I want to order a coffee.',
    });
    expect(payload).toBe('https://wa.me/919876543210?text=Hello%2C%20I%20want%20to%20order%20a%20coffee.');
  });

  it('builds WhatsApp URL without duplicating country code if user already entered it', () => {
    const payload = buildWhatsAppPayload({
      countryCode: '+91',
      phoneNumber: '+919876543210',
    });
    expect(payload).toBe('https://wa.me/919876543210');
  });

  it('builds WhatsApp URL with digits only phone cleaning', () => {
    const payload = buildWhatsAppPayload({
      countryCode: '+91',
      phoneNumber: '98765-43210',
    });
    expect(payload).toBe('https://wa.me/919876543210');
  });

  it('builds URL payload prepending https if missing', () => {
    const payload = buildURLPayload({ url: 'quickqr.in' });
    expect(payload).toBe('https://quickqr.in');

    const fullUrl = buildURLPayload({ url: 'http://mywebsite.com/page?id=1' });
    expect(fullUrl).toBe('http://mywebsite.com/page?id=1');
  });

  it('builds Wi-Fi ZXing standard string with escaped characters', () => {
    const payload = buildWiFiPayload({
      ssid: 'Cafe;Special:WiFi',
      password: 'p@ssword;123',
      authType: 'WPA',
      hidden: false,
    });
    expect(payload).toBe('WIFI:S:Cafe\\;Special\\:WiFi;T:WPA;P:p@ssword\\;123;H:false;;');
  });

  it('builds Wi-Fi open network without password parameter', () => {
    const payload = buildWiFiPayload({
      ssid: 'Guest_Free_WiFi',
      authType: 'nopass',
      hidden: true,
    });
    expect(payload).toBe('WIFI:S:Guest_Free_WiFi;T:nopass;H:true;;');
  });

  it('builds standard vCard 3.0 string with RFC CRLF and escaped characters', () => {
    const payload = buildVCardPayload({
      firstName: 'Amit;Kumar',
      lastName: 'Patel, Jr.',
      organization: 'Tech\\Works',
      title: 'VP Engineering\nDirector',
      phone: '+91 11 2233 4455',
      mobile: '+91 98765 43210',
      email: 'amit@techworks.in',
      website: 'techworks.in',
      city: 'Bengaluru',
      country: 'India',
    });
    expect(payload).toContain('\r\n');
    expect(payload).toContain('BEGIN:VCARD\r\n');
    expect(payload).toContain('VERSION:3.0\r\n');
    expect(payload).toContain('N:Patel\\, Jr.;Amit\\;Kumar;;;\r\n');
    expect(payload).toContain('ORG:Tech\\\\Works\r\n');
    expect(payload).toContain('TITLE:VP Engineering\\nDirector\r\n');
    expect(payload).toContain('TEL;TYPE=CELL,VOICE:+919876543210\r\n');
    expect(payload).toContain('EMAIL;TYPE=PREF,INTERNET:amit@techworks.in\r\n');
    expect(payload).toContain('URL:https://techworks.in\r\n');
    expect(payload).toContain('ADR;TYPE=WORK:;;;Bengaluru;;;India\r\n');
    expect(payload).toContain('END:VCARD');
  });

  it('builds phone tel: URI preserving leading plus and stripping spaces', () => {
    const payload = buildPhonePayload({ phoneNumber: '+91 98765 43210' });
    expect(payload).toBe('tel:+919876543210');
  });

  it('builds email mailto: URI with subject and body using %20', () => {
    const payload = buildEmailPayload({
      email: 'contact@brand.in',
      subject: 'Inquiry',
      body: 'Can I get a quote?',
    });
    expect(payload).toBe('mailto:contact@brand.in?subject=Inquiry&body=Can%20I%20get%20a%20quote%3F');
  });

  it('builds plain text payload including unicode emojis', () => {
    const payload = buildTextPayload({ text: 'Namaste India! 🙏 Unique Voucher: SAVE2026' });
    expect(payload).toBe('Namaste India! 🙏 Unique Voucher: SAVE2026');
  });

  it('builds Google Maps query link if address passed', () => {
    const payload = buildMapsPayload({ queryOrUrl: 'Cyber Hub Gurugram' });
    expect(payload).toBe('https://www.google.com/maps/search/?api=1&query=Cyber%20Hub%20Gurugram');

    const mapsUrl = 'https://maps.app.goo.gl/xyz123';
    expect(buildMapsPayload({ queryOrUrl: mapsUrl })).toBe(mapsUrl);
  });

  it('builds Google Review, PDF, and Menu payloads correctly', () => {
    expect(buildGoogleReviewPayload({ reviewUrl: 'g.page/r/test/review' })).toBe('https://g.page/r/test/review');
    expect(buildPDFPayload({ pdfUrl: 'https://docs.site.in/brochure.pdf' })).toBe('https://docs.site.in/brochure.pdf');
    expect(buildMenuPayload({ menuUrl: 'bistro.in/menu' })).toBe('https://bistro.in/menu');
  });

  it('dispatches to correct builder via master buildQRPayload', () => {
    const upiResult = buildQRPayload('upi', {
      vpa: 'test@upi',
      payeeName: 'Test',
      amount: '100',
    });
    expect(upiResult).toContain('upi://pay?');
  });
});
