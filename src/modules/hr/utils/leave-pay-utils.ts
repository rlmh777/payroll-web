/**
 * Pay rate multiplier for an employee leave, derived from the leave type.
 * Paid leave types use 1.0; unpaid use 0.
 */
export function leavePayMultiplierFromType(leaveType?: { isPaid?: boolean } | null): number {
  return leaveType?.isPaid === false ? 0 : 1;
}
