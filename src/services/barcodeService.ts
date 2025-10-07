/**
 * Generates EAN-13 barcode check digit
 */
export function generateCheckDigit(code: string): string {
  if (code.length !== 12) {
    throw new Error('EAN-13 code must be 12 digits long');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const char = code[i];
    if (!char) continue;
    const digit = parseInt(char, 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

/**
 * Generates a complete EAN-13 barcode
 */
export function generateEAN13(prefix = '460'): string {
  // Generate 9 random digits
  const randomDigits = Math.floor(Math.random() * 1000000000)
    .toString()
    .padStart(9, '0');

  // Combine prefix and random digits (12 digits total)
  const code12 = prefix + randomDigits;

  // Calculate and append check digit
  const checkDigit = generateCheckDigit(code12);

  return code12 + checkDigit;
}

/**
 * Validates EAN-13 barcode
 */
export function validateEAN13(barcode: string): boolean {
  if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
    return false;
  }

  const code12 = barcode.slice(0, 12);
  const providedCheckDigit = barcode[12];
  const calculatedCheckDigit = generateCheckDigit(code12);

  return providedCheckDigit === calculatedCheckDigit;
}
