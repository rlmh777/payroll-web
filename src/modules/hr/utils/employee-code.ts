/**
 * Client-side preview of employee codes.
 * Server regenerates if blank/colliding to guarantee uniqueness.
 *
 * Format: {LAST3}{FIRST3}{YYMMDD}{RAND4}
 */
export function buildEmployeeCodeBase(
  firstName: string,
  lastName: string,
  enteredAt: Date = new Date(),
): string {
  const last = nameFragment(lastName, 3);
  const first = nameFragment(firstName, 3);
  const yy = String(enteredAt.getFullYear()).slice(-2);
  const mm = String(enteredAt.getMonth() + 1).padStart(2, '0');
  const dd = String(enteredAt.getDate()).padStart(2, '0');
  return `${last}${first}${yy}${mm}${dd}`;
}

export function generateEmployeeCode(
  firstName: string,
  lastName: string,
  enteredAt: Date = new Date(),
): string {
  return `${buildEmployeeCodeBase(firstName, lastName, enteredAt)}${randomSuffix(4)}`;
}

function nameFragment(name: string, length: number): string {
  const normalized = (name || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'XXX';
  return normalized.slice(0, length).padEnd(length, 'X');
}

function randomSuffix(length: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < length; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return suffix;
}
