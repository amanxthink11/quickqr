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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://quickqr.amanxthink11.com'),
  title: {
    default: 'QuickQR — Open-Source QR Infrastructure',
    template: '%s | QuickQR',
  },
  description:
    'Open-source QR infrastructure for businesses — dynamic QR codes, analytics, UPI QR tools, website widgets, and developer APIs.',
  keywords: [
    'QuickQR',
    'Open-source QR',
    'Dynamic QR code',
    'QR analytics',
    'UPI QR code generator',
    'Website QR widget',
    'Developer QR API',
    'Free QR code generator India',
    'WhatsApp QR code generator',
    'Google review QR code',
    'Restaurant digital menu QR',
    'vCard QR code',
    'Wi-Fi QR code generator',
    'Printable QR code table tent',
  ],
  authors: [{ name: 'Aman Singh', url: 'https://amanxthink11.com' }],
  creator: 'Aman Singh',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://quickqr.amanxthink11.com',
    siteName: 'QuickQR',
    title: 'QuickQR — Open-Source QR Infrastructure',
    description:
      'Open-source QR infrastructure for businesses — dynamic QR codes, analytics, UPI QR tools, website widgets, and developer APIs.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuickQR — Open-Source QR Infrastructure',
    description:
      'Open-source QR infrastructure for businesses — dynamic QR codes, analytics, UPI QR tools, website widgets, and developer APIs.',
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
              name: 'QuickQR',
              url: 'https://quickqr.amanxthink11.com',
              description:
                'Open-source QR infrastructure for businesses — dynamic QR codes, analytics, UPI QR tools, website widgets, and developer APIs.',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://quickqr.amanxthink11.com/qr-code-generator?q={search_term_string}',
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
