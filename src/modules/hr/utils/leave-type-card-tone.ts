export function leaveTypeCardTone(input: { name: string; code?: string | null; isPaid?: boolean }): string {
  const key = `${input.code ?? ''} ${input.name}`.toLowerCase();
  if (key.includes('vacation')) return 'vacation';
  if (key.includes('uncertified')) return 'sick-uncertified';
  if (key.includes('sick')) return 'sick';
  if (key.includes('paternity') || key.includes('maternity') || key.includes('parent')) return 'family';
  if (key.includes('professional') || key.includes('study') || key.includes('training')) return 'professional';
  if (key.includes('paid time') || /\bpto\b/.test(key)) return 'pto';
  if (input.isPaid === false || key.includes('without pay') || key.includes('unpaid')) return 'unpaid';
  return 'default';
}
