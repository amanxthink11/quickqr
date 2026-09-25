import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://quickqr.in'),
  title: {
    default: 'QuickQR India — Free Production QR Tools for Modern Indian Businesses',
    template: '%s | QuickQR India',
  },
  description:
    'Generate standards-compliant UPI payment QR codes, WhatsApp click-to-chat QR stands, 5-star Google review signs, digital menus, and Wi-Fi codes. 100% free, client-side private, and 300 DPI print-ready.',
  keywords: [
    'UPI QR code generator',
    'Free QR code generator India',
    'WhatsApp QR code generator',
    'Google review QR code',
    'Restaurant digital menu QR',
    'vCard QR code',
    'Wi-Fi QR code generator',
    'Printable QR code table tent',
    'NPCI UPI payment QR',
  ],
  authors: [{ name: 'QuickQR India' }],
  creator: 'QuickQR India',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://quickqr.in',
    siteName: 'QuickQR India',
    title: 'QuickQR India — Free Production QR Tools for Modern Businesses',
    description:
      'Create, customize and download print-ready QR codes for UPI payments, WhatsApp, Google reviews, and menus.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuickQR India — Production QR Platform',
    description:
      'Zero fee, zero expiration QR codes for Indian retail, cafes, freelancers, and businesses.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'QuickQR India',
              url: 'https://quickqr.in',
              description:
                'Production QR platform for Indian businesses providing free UPI, WhatsApp, review, and menu QR tools.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://quickqr.in/qr-code-generator?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans antialiased selection:bg-indigo-600 selection:text-white">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
