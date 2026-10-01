import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://quickqr.amanxthink11.com';
  const routes = [
    '',
    '/qr-code-generator',
    '/upi-qr-code-generator',
    '/whatsapp-qr-code-generator',
    '/url-qr-code-generator',
    '/wifi-qr-code-generator',
    '/vcard-qr-code-generator',
    '/phone-qr-code-generator',
    '/email-qr-code-generator',
    '/text-qr-code-generator',
    '/google-maps-qr-code-generator',
    '/google-review-qr-code-generator',
    '/pdf-qr-code-generator',
    '/menu-qr-code-generator',
    '/website-qr-widget',
    '/pricing',
  ];

  return routes.map((route) => {
    let priority = 0.8;
    if (route === '') priority = 1.0;
    else if (route === '/upi-qr-code-generator' || route === '/qr-code-generator' || route === '/website-qr-widget') priority = 0.9;

    return {
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: (route === '' ? 'daily' : 'weekly') as 'daily' | 'weekly',
      priority,
    };
  });
}
