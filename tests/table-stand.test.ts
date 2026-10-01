import { describe, it, expect } from 'vitest';
import {
  getDefaultTableStandConfig,
  getTableStandDimensions,
} from '../src/lib/qr/table-stand';

describe('Table Stand & Table Tent Infrastructure', () => {
  describe('getDefaultTableStandConfig', () => {
    it('returns UPI defaults with emerald accent and payment app supporting text', () => {
      const config = getDefaultTableStandConfig('upi', 'Gupta General Store');
      expect(config.businessName).toBe('Gupta General Store');
      expect(config.headlineCTA).toContain('SCAN & PAY');
      expect(config.supportingText).toContain('Google Pay');
      expect(config.format).toBe('table-tent');
      expect(config.accentColor).toBe('#059669');
      expect(config.showFoldLine).toBe(true);
    });

    it('returns WhatsApp defaults with chat CTA and green accent', () => {
      const config = getDefaultTableStandConfig('whatsapp', 'Cafe Bistro');
      expect(config.headlineCTA).toContain('CHAT WITH US ON WHATSAPP');
      expect(config.accentColor).toBe('#16a34a');
      expect(config.format).toBe('counter-stand');
    });

    it('returns Google Review defaults with review CTA and amber accent', () => {
      const config = getDefaultTableStandConfig('review', 'City Dental Care');
      expect(config.headlineCTA).toContain('REVIEW US ON GOOGLE');
      expect(config.supportingText).toContain('genuine experience');
      expect(config.accentColor).toBe('#d97706');
    });

    it('returns Digital Menu defaults with food menu CTA and orange accent', () => {
      const config = getDefaultTableStandConfig('menu', 'Tandoori Nights');
      expect(config.headlineCTA).toContain('VIEW OUR DIGITAL MENU');
      expect(config.accentColor).toBe('#ea580c');
    });

    it('returns Wi-Fi defaults with free Wi-Fi CTA and indigo accent', () => {
      const config = getDefaultTableStandConfig('wifi', 'Co-Work Hub');
      expect(config.headlineCTA).toContain('FREE GUEST WI-FI');
      expect(config.accentColor).toBe('#4f46e5');
    });
  });

  describe('getTableStandDimensions', () => {
    it('calculates 1:1 aspect ratio for square cards', () => {
      const portrait = getTableStandDimensions('square', 'portrait');
      expect(portrait.aspectRatio).toBe(1.0);
      expect(portrait.width).toBe(portrait.height);

      const landscape = getTableStandDimensions('square', 'landscape');
      expect(landscape.aspectRatio).toBe(1.0);
    });

    it('calculates standard ISO aspect ratio (1:1.414) for A4, A5, and A6', () => {
      const portrait = getTableStandDimensions('a4', 'portrait');
      expect(portrait.width).toBe(595);
      expect(portrait.height).toBe(842);
      expect(portrait.aspectRatio).toBeCloseTo(595 / 842, 3);

      const landscape = getTableStandDimensions('a4', 'landscape');
      expect(landscape.width).toBe(842);
      expect(landscape.height).toBe(595);
      expect(landscape.aspectRatio).toBeCloseTo(842 / 595, 3);
    });

    it('handles table-tent and counter-stand orientations correctly', () => {
      const tentPortrait = getTableStandDimensions('table-tent', 'portrait');
      const tentLandscape = getTableStandDimensions('table-tent', 'landscape');
      expect(tentPortrait.height).toBeGreaterThan(tentPortrait.width);
      expect(tentLandscape.width).toBeGreaterThan(tentLandscape.height);

      const standPortrait = getTableStandDimensions('counter-stand', 'portrait');
      const standLandscape = getTableStandDimensions('counter-stand', 'landscape');
      expect(standPortrait.height).toBeGreaterThan(standPortrait.width);
      expect(standLandscape.width).toBeGreaterThan(standLandscape.height);
    });
  });
});
