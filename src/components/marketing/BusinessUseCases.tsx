import React from 'react';
import { Store, Utensils, Laptop, Stethoscope, Building, Ticket } from 'lucide-react';

const USE_CASES = [
  {
    icon: Store,
    title: 'Retail & Kirana Stores',
    description: 'Print durable UPI QR counter stands with your shop name. Customers pay with any app in seconds, reducing checkout congestion.',
    tags: ['UPI Payment', 'Google Review', 'Customer Support'],
  },
  {
    icon: Utensils,
    title: 'Cafes & Dining Restaurants',
    description: 'Place acrylic QR stands on dining tables. Guests view your live digital menu, connect to customer Wi-Fi, and settle bills with zero paper.',
    tags: ['Digital Menu', 'Free Wi-Fi', 'Table Bill'],
  },
  {
    icon: Laptop,
    title: 'Freelancers & Tech Agencies',
    description: 'Add fixed-amount UPI QR codes directly onto PDF invoices. Clients scan and transfer fees instantly with zero gateway transaction charges.',
    tags: ['Invoice Payments', 'vCard Contact', 'Portfolio URL'],
  },
  {
    icon: Stethoscope,
    title: 'Clinics & Healthcare Practices',
    description: 'Enable patients to book appointments via WhatsApp click-to-chat QR and navigate straight to your clinic entrance using Google Maps.',
    tags: ['WhatsApp Booking', 'Location Navigation', 'Prescription PDF'],
  },
  {
    icon: Building,
    title: 'Real Estate & Property Agents',
    description: 'Display QR codes on site hoardings and printed flyers linking straight to downloadable PDF brochures, floor plans, and agent vCards.',
    tags: ['Brochure PDF', 'Location Pin', 'vCard Card'],
  },
  {
    icon: Ticket,
    title: 'Events, Popups & Exhibitions',
    description: 'Place scan-to-register QR posters at exhibition booths and distribute plain text or digital catalogs without physical print waste.',
    tags: ['Event Registration', 'WhatsApp Enquiries', 'Wi-Fi Access'],
  },
];

export const BusinessUseCases: React.FC = () => {
  return (
    <section className="py-16 md:py-20 bg-white border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Real Indian Commerce
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-3 tracking-tight">
            Built for Every Business Across Bharat
          </h2>
          <p className="text-neutral-600 text-sm mt-2">
            Explore how modern shopkeepers, restaurateurs, service professionals, and brands leverage QuickQR every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            return (
              <div
                key={uc.title}
                className="p-6 rounded-2xl border border-neutral-200/90 bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 text-neutral-800 flex items-center justify-center mb-4 shadow-2xs">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">{uc.title}</h3>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  {uc.description}
                </p>
                <div className="mt-4 pt-4 border-t border-neutral-200/60 flex flex-wrap gap-1.5">
                  {uc.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-neutral-200 text-neutral-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
