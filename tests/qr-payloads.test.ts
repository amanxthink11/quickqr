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
  it('builds standard UPI payload with open amount', () => {
    const payload = buildUPIPayload({
      vpa: 'merchant@okhdfcbank',
      payeeName: 'Sharma General Store',
      currency: 'INR',
      transactionNote: 'Kirana Order',
    });
    expect(payload).toContain('upi://pay?');
    expect(payload).toContain('pa=merchant%40okhdfcbank');
    expect(payload).toContain('pn=Sharma+General+Store');
    expect(payload).toContain('cu=INR');
    expect(payload).toContain('tn=Kirana+Order');
    expect(payload).not.toContain('am=');
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
    expect(payload).toContain('pn=Chai+Point');
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
    expect(payload).toContain('pn=M%2Fs+Gupta+%26+Sons');
    expect(payload).toContain('tn=Bill+%2399+%26+Service+Charges');
  });

  it('builds WhatsApp click-to-chat URL with country code and message', () => {
    const payload = buildWhatsAppPayload({
      countryCode: '+91',
      phoneNumber: '9876543210',
      message: 'Hello, I want to order a coffee.',
    });
    expect(payload).toBe('https://wa.me/919876543210?text=Hello%2C%20I%20want%20to%20order%20a%20coffee.');
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

  it('builds Wi-Fi open network without password', () => {
    const payload = buildWiFiPayload({
      ssid: 'Guest_Free_WiFi',
      authType: 'nopass',
      hidden: true,
    });
    expect(payload).toBe('WIFI:S:Guest_Free_WiFi;T:nopass;P:;H:true;;');
  });

  it('builds standard vCard 3.0 string', () => {
    const payload = buildVCardPayload({
      firstName: 'Amit',
      lastName: 'Patel',
      organization: 'Tech Works',
      title: 'VP Engineering',
      phone: '+911122334455',
      mobile: '+919876543210',
      email: 'amit@techworks.in',
      website: 'techworks.in',
      city: 'Bengaluru',
      country: 'India',
    });
    expect(payload).toContain('BEGIN:VCARD');
    expect(payload).toContain('VERSION:3.0');
    expect(payload).toContain('N:Patel;Amit;;;');
    expect(payload).toContain('FN:Amit Patel');
    expect(payload).toContain('ORG:Tech Works');
    expect(payload).toContain('TEL;TYPE=CELL,VOICE:+919876543210');
    expect(payload).toContain('EMAIL;TYPE=PREF,INTERNET:amit@techworks.in');
    expect(payload).toContain('URL:https://techworks.in');
    expect(payload).toContain('ADR;TYPE=WORK:;;;Bengaluru;;;India');
    expect(payload).toContain('END:VCARD');
  });

  it('builds phone tel: URI', () => {
    const payload = buildPhonePayload({ phoneNumber: '+91 98765 43210' });
    expect(payload).toBe('tel:+919876543210');
  });

  it('builds email mailto: URI with subject and body', () => {
    const payload = buildEmailPayload({
      email: 'contact@brand.in',
      subject: 'Inquiry',
      body: 'Can I get a quote?',
    });
    expect(payload).toBe('mailto:contact@brand.in?subject=Inquiry&body=Can+I+get+a+quote%3F');
  });

  it('builds plain text payload', () => {
    const payload = buildTextPayload({ text: 'Unique Voucher Code: SAVE2026' });
    expect(payload).toBe('Unique Voucher Code: SAVE2026');
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
