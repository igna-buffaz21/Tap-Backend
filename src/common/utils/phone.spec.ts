import { buildPhoneLookupCandidates, normalizePhone } from './phone';

describe('normalizePhone', () => {
  it.each([
    ['+5493534133580', '543534133580'],
    ['3534133580', '543534133580'],
    ['03534133580', '543534133580'],
    ['543534133580', '543534133580'],
    ['5403534133580', '543534133580'],
    ['54 9 353-413-3580', '543534133580'],
    ['', ''],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe('buildPhoneLookupCandidates', () => {
  it('keeps the canonical phone first and the digits-only input for legacy lookup', () => {
    expect(buildPhoneLookupCandidates('+5493534133580')).toEqual([
      '543534133580',
      '5493534133580',
    ]);
  });

  it('deduplicates already-normalized phones', () => {
    expect(buildPhoneLookupCandidates('543534133580')).toEqual([
      '543534133580',
    ]);
  });

  it('includes the previous trunk-prefixed format for legacy lookup', () => {
    expect(buildPhoneLookupCandidates('03534133580')).toEqual([
      '543534133580',
      '03534133580',
      '5403534133580',
    ]);
  });
});
