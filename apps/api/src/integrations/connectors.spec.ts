import { describe, expect, it } from 'vitest';
import { helixMattressName } from './connectors';

describe('helixMattressName', () => {
  it('keeps the size, the mattress and its firmness — size first', () => {
    expect(
      helixMattressName(
        'Helix Twilight 11.5" Firm Hybrid Mattress — Twin / Breeathe Knit Cover / ErgoAlign Support',
      ),
    ).toBe('Twin Helix Twilight 11.5" Firm Hybrid Mattress');
    expect(
      helixMattressName('Helix Midnight Luxe 13.5" Medium Hybrid Mattress — Cal King / GlacioTex'),
    ).toBe('Cal King Helix Midnight Luxe 13.5" Medium Hybrid Mattress');
    expect(helixMattressName('Helix Dawn 12" Firm Mattress — Twin XL')).toBe(
      'Twin XL Helix Dawn 12" Firm Mattress',
    );
  });

  it('leaves everything else alone', () => {
    expect(helixMattressName('Helix Adjustable Base — Queen')).toBe(
      'Helix Adjustable Base — Queen',
    );
    expect(helixMattressName('Twin Helix Twilight 11.5" Firm Hybrid Mattress')).toBe(
      'Twin Helix Twilight 11.5" Firm Hybrid Mattress',
    );
    expect(helixMattressName('Purple Restore Mattress — Queen / Soft')).toBe(
      'Purple Restore Mattress — Queen / Soft',
    );
  });
});
