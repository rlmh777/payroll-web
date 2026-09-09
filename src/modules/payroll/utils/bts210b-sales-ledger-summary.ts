/**
 * BTS210b sales-ledger invoice summary.
 *
 * Raw class semantics:
 * - Taxable Sales — GST-exclusive at the standard rate from settings
 * - Exempt — never collected GST
 * - Non-Taxable Sales — should not be taxed (shown in raw; omitted from BTS210b)
 * - Zero Rate — rated at 0%
 *
 * Amount per line = Credit − Debit.
 */

export type SalesLedgerInvoiceBuckets = {
  /** Taxable sales net amount excluding GST. */
  taxable_exclusive: number;
  exempt: number;
  non_taxable: number;
  zero_rated: number;
};

export type SalesLedgerBts210bAmounts = {
  standard_rated: number;
  zero_rated: number;
  exempt: number;
  total_supplies: number;
  gst_payable: number;
  debit_credit_notes: number;
  gob_contracts: number;
  gst_withheld_gob: number;
};

export function salesClassBucket(className: string): 'taxable' | 'exempt' | 'non_taxable' | 'zero_rated' | 'total' | 'other' {
  const normalized = className.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalized) return 'other';
  if (normalized.startsWith('total ')) return 'total';
  if (normalized === 'taxable sales' || normalized === 'taxable') return 'taxable';
  if (normalized === 'exempt') return 'exempt';
  if (
    normalized === 'non-taxable sales'
    || normalized === 'non taxable sales'
    || normalized === 'non-taxable'
    || normalized === 'non taxable'
  ) {
    return 'non_taxable';
  }
  if (normalized === 'zero rate' || normalized === 'zero-rated' || normalized === 'zero rated') {
    return 'zero_rated';
  }
  return 'other';
}

export function summarizeBts210bInvoice(
  buckets: SalesLedgerInvoiceBuckets,
  gstRate = 0.125,
): SalesLedgerBts210bAmounts {
  const rate = Number.isFinite(gstRate) && gstRate > 0 ? gstRate : 0.125;
  const standardRated = Number(buckets.taxable_exclusive || 0);
  const gstPayable = standardRated * rate;
  const zeroRated = Number(buckets.zero_rated || 0);
  const exempt = Number(buckets.exempt || 0);

  return {
    standard_rated: standardRated,
    zero_rated: zeroRated,
    exempt,
    total_supplies: standardRated + zeroRated + exempt,
    gst_payable: gstPayable,
    debit_credit_notes: 0,
    gob_contracts: 0,
    gst_withheld_gob: 0,
  };
}
