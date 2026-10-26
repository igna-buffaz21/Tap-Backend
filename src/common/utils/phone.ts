export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  const withoutMobileNine =
    digits.startsWith('549') && digits.length >= 12
      ? `54${digits.slice(3)}`
      : digits;
  const withoutTrunkPrefix = withoutMobileNine.startsWith('540')
    ? `54${withoutMobileNine.slice(3)}`
    : withoutMobileNine.startsWith('0')
      ? withoutMobileNine.slice(1)
      : withoutMobileNine;

  return withoutTrunkPrefix.startsWith('54')
    ? withoutTrunkPrefix
    : `54${withoutTrunkPrefix}`;
}

export function buildPhoneLookupCandidates(phone: string): string[] {
  const digits = phone.replace(/\D/g, '');
  const normalized = normalizePhone(phone);
  const legacyTrunkPrefixed = digits.startsWith('0') ? `54${digits}` : '';

  return Array.from(
    new Set([normalized, digits, legacyTrunkPrefixed].filter(Boolean)),
  );
}
