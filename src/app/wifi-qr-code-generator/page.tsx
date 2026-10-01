import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Wi-Fi QR Code Generator — Connect Without Typing Passwords',
  description:
    'Generate free Wi-Fi QR codes for cafes, hotels, offices, and homes. Let guests connect to your wireless network instantly with one camera scan. Supports WPA/WPA2/WPA3 and hidden networks.',
  alternates: {
    canonical: 'https://quickqr.amanxthink11.com/wifi-qr-code-generator',
  },
  openGraph: {
    title: 'Wi-Fi QR Code Generator | QuickQR India',
    description:
      'Allow customers and office guests to connect to your Wi-Fi network instantly without asking for passwords.',
    url: 'https://quickqr.amanxthink11.com/wifi-qr-code-generator',
  },
};

export default function WiFiQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Instant Wireless Access
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Wi-Fi QR Code Generator — Scan to Connect
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Create printable Wi-Fi sign stands for your cafe, restaurant, coworking space, or home. Guests simply point their camera and tap &ldquo;Join Network&rdquo; without typing complex passwords.
          </p>
        </div>

        <QRGeneratorEngine initialType="wifi" allowTypeSwitching={false} />
      </div>

      <SEOContentSection
        type="wifi"
        title="Wi-Fi QR Code Generator"
        introText="Wi-Fi QR codes utilize the standard ZXing wireless network specification (WIFI:S:<SSID>;T:<WPA|WEP>;P:<password>;;). Both modern iOS and Android operating systems have native operating system support: when scanned by the default camera app, a notification pops up asking 'Join Network?'. Tapping it connects the device without displaying or manually typing the passphrase."
        steps={[
          {
            title: 'Enter Network SSID',
            description: 'Type your Wi-Fi network name exactly as configured on your router (case-sensitive).',
          },
          {
            title: 'Provide Password & Security',
            description: 'Select your encryption protocol (usually WPA/WPA2/WPA3) and enter the network security key.',
          },
          {
            title: 'Print Tabletop Stand',
            description: 'Export an A4 print stand or download a high-resolution PNG to frame at your reception or counter.',
          },
        ]}
        useCases={[
          {
            title: 'Cafes, Bakeries & Coffee Shops',
            description: 'Prevent staff from repeating the Wi-Fi password dozens of times daily by placing neat QR table tents on every dining table.',
          },
          {
            title: 'Hotels, Homestays & Airbnbs',
            description: 'Frame a welcome Wi-Fi QR in guest rooms so travelers can get online immediately upon arrival.',
          },
          {
            title: 'Offices & Coworking Spaces',
            description: 'Provide smooth wireless onboarding for visiting clients, interview candidates, and meeting guests.',
          },
          {
            title: 'Clinics & Salon Waiting Lounges',
            description: 'Offer complimentary Wi-Fi to waiting visitors while keeping your private administrative network separate.',
          },
        ]}
        faqs={[
          {
            question: 'Is my Wi-Fi password sent to your servers?',
            answer: 'No! Generation occurs 100% locally in your browser JavaScript. Your Wi-Fi network name and password are never uploaded, saved, or logged.',
          },
          {
            question: 'Does this work on iPhones and Android devices alike?',
            answer: 'Yes. Apple iOS (iOS 11 and later) and Google Android (Android 10 and later) natively support ZXing Wi-Fi QR codes directly inside the stock camera app.',
          },
        ]}
      />
    </main>
  );
}
