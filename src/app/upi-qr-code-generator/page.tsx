import React from 'react';
import type { Metadata } from 'next';
import { QRGeneratorEngine } from '@/components/qr/QRGeneratorEngine';
import { SEOContentSection } from '@/components/marketing/SEOContentSection';

export const metadata: Metadata = {
  title: 'Free UPI QR Code Generator — Create Custom UPI QR',
  description:
    'Generate free, NPCI-compliant UPI payment QR codes for Indian bank accounts. Supports Google Pay, PhonePe, Paytm, CRED, and BHIM. Download print-ready table stands with zero fees.',
  alternates: {
    canonical: 'https://quickqr.in/upi-qr-code-generator',
  },
  openGraph: {
    title: 'Free UPI QR Code Generator — Create Custom UPI QR | QuickQR India',
    description:
      'Zero-fee NPCI compliant UPI QR generator. Open amount and fixed amount presets for kirana shops, cafes, and freelancers.',
    url: 'https://quickqr.in/upi-qr-code-generator',
  },
};

export default function UPIQRGeneratorPage() {
  return (
    <main className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            NPCI Standards Compliant
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Free UPI QR Code Generator — Create Custom UPI QR
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
            Create branded, zero-commission payment QR codes for your Indian retail counter, clinic, cafe, or freelance invoices. Works with Google Pay, PhonePe, Paytm, and all banking apps.
          </p>
        </div>

        {/* Generator Component pre-set to UPI */}
        <QRGeneratorEngine initialType="upi" allowTypeSwitching={false} />
      </div>

      {/* Educational & SEO Content */}
      <SEOContentSection
        type="upi"
        title="UPI QR Code Generator"
        introText="A UPI (Unified Payments Interface) QR code encodes a standardized payment intent URI defined by the National Payments Corporation of India (NPCI). When scanned by any UPI-enabled mobile application (such as Google Pay, PhonePe, Paytm, CRED, Amazon Pay, or BHIM), the customer's phone automatically parses your Virtual Payment Address (VPA), registered merchant name, requested amount, and reference note — eliminating manual typing errors."
        disclaimer="QuickQR is a static QR generation engine and does not operate as a payment gateway or payment aggregator. Scanning this QR initiates a direct transaction between payer and payee banks. QuickQR does not process payments or guarantee settlement. Always verify payment receipt inside your official banking application or SMS notifications before providing goods or services."
        steps={[
          {
            title: 'Enter Your UPI ID & Name',
            description: 'Provide your active Virtual Payment Address (e.g., yourname@okhdfcbank or 9876543210@paytm) and your business name exactly as registered with your bank.',
          },
          {
            title: 'Choose Fixed or Open Amount',
            description: 'Leave the amount empty for counter checkouts where customers enter their own total, or specify a fixed amount (e.g., ₹250.00) for specific invoices.',
          },
          {
            title: 'Customize Stand & Print',
            description: 'Select our emerald or navy payment theme, select the "Scan & Pay with Any UPI App" frame banner, and print an A4 counter stand or export vector SVG.',
          },
        ]}
        useCases={[
          {
            title: 'Kirana & Neighborhood Retail Counters',
            description: 'Laminate a durable tabletop QR stand at your cash register so customers can scan with their preferred payment app without delays.',
          },
          {
            title: 'Cafes, Food Trucks & Restaurants',
            description: 'Print UPI QR table tents so patrons can pay bills directly from their seats without waiting for a POS card machine.',
          },
          {
            title: 'Freelancers & Independent Consultants',
            description: 'Embed exact-amount UPI QR codes into PDF invoices so clients can settle professional fees with zero credit card gateway deduction.',
          },
          {
            title: 'Non-Profits, Temples & Donation Drives',
            description: 'Collect charitable contributions with a clear note indicating the donation cause or organization registration number.',
          },
        ]}
        faqs={[
          {
            question: 'Are there any transaction fees or commission cuts?',
            answer: 'No. QuickQR charges zero fees, and peer-to-peer/P2M UPI transactions on standard bank accounts are zero-fee under Indian banking regulations. 100% of the funds go straight into your bank account.',
          },
          {
            question: 'How do I know if a customer has actually completed payment?',
            answer: 'Scanning the QR code only initiates the transaction on the customer\'s smartphone. QuickQR does not verify payment. You must confirm payment receipt by checking your banking app, bank SMS notification, or linked Soundbox speaker before completing the order.',
          },
          {
            question: 'Can customers scan this with any UPI application in India?',
            answer: 'Yes. Our generated payloads conform strictly to the NPCI upi://pay standard format, ensuring full interoperability across Google Pay, PhonePe, Paytm, BHIM, CRED, MobiKwik, and bank apps from SBI, HDFC, ICICI, and Axis.',
          },
          {
            question: 'What is the difference between a Dynamic UPI QR and a Static UPI QR?',
            answer: 'A static UPI QR contains your permanent VPA and can either have an open amount or a fixed amount. A dynamic banking QR (typically generated by enterprise POS machines) contains an automated real-time transaction reference and webhook for automated ERP reconciliation.',
          },
        ]}
      />
    </main>
  );
}
