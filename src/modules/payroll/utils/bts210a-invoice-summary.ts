/**
 * BTS210a purchase-ledger invoice summary.
 *
 * Class semantics (QuickBooks purchase ledger):
 * - Taxes:Taxable  — GST-exclusive value of standard-rated purchases
 * - Taxes:Partial  — GST-exclusive value that must be split by the partial-exemption ratio
 * - Taxes:GST      — GST paid on (Taxable + Partial), typically 12.5% of those exclusive bases
 *
 * Example: Taxable 100 ⇒ Taxes:GST includes 12.50 for that base.
 * Domestic GST paid is taken from Taxes:GST (not recalculated from Taxable × rate),
 * then only the share that relates to Taxable + taxed Partial is treated as payable.
 */

export type Bts210aInvoiceBuckets = {
  taxable: number;
  partial_raw: number;
  gst: number;
  imported: number;
  zero_rated: number;
  exempt: number;
  imported_gst: number;
  debit_credit_notes: number;
  non_taxable: number;
  other: number;
  all_classes: number;
};

export type Bts210aSummaryAmounts = {
  total_purchases: number;
  imports: number;
  standard_rated: number;
  zero_rated: number;
  exempt: number;
  imported_gst: number;
  domestic_gst: number;
  debit_credit_notes: number;
  total_input_tax: number;
  partial_adjusted: boolean;
};

export type Bts210aSummaryOptions = {
  /** Ratio of taxable GST income to (taxable + exempt) income — used for Partial. */
  taxableRatio: number;
  /** 1 − taxableRatio when provided by Results; otherwise derived. */
  complementRatio?: number | null;
};

function clampRatio(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * Build BTS210a money columns for one invoice group.
 */
export function summarizeBts210aInvoice(
  row: Bts210aInvoiceBuckets,
  options: Bts210aSummaryOptions,
): Bts210aSummaryAmounts {
  const taxableRatio = clampRatio(Number(options.taxableRatio ?? 0));
  // Prefer explicit taxable ratio for the taxed share of Partial / GST-on-Partial.
  // Complement is accepted so callers can pass Results values; when taxable ratio is 0
  // and only complement is meaningful, derive the taxed share from it.
  const complementRatio =
    options.complementRatio != null && Number.isFinite(Number(options.complementRatio))
      ? clampRatio(Number(options.complementRatio))
      : clampRatio(1 - taxableRatio);
  const taxedShare =
    options.taxableRatio != null && Number.isFinite(Number(options.taxableRatio))
      ? taxableRatio
      : clampRatio(1 - complementRatio);

  const partial = Number(row.partial_raw || 0);
  const taxable = Number(row.taxable || 0);
  // Taxes:GST is the GST paid on exclusive Taxable + Partial bases.
  const gstPaidOnTaxableAndPartial = Number(row.gst || 0);

  // Partial is GST-exclusive; only the taxable-ratio share is standard-rated.
  const taxedPartial = partial * taxedShare;
  const untaxedPartial = partial - taxedPartial;

  // Attribute Taxes:GST across the exclusive bases it covers.
  const exclusiveGstBase = taxable + partial;
  const gstOnTaxable =
    exclusiveGstBase > 0 ? gstPaidOnTaxableAndPartial * (taxable / exclusiveGstBase) : 0;
  const gstOnPartial = exclusiveGstBase > 0
    ? gstPaidOnTaxableAndPartial - gstOnTaxable
    : gstPaidOnTaxableAndPartial;

  // GST on Taxable is fully payable. GST on Partial follows the same taxable ratio.
  const payableGstOnPartial = partial > 0 ? gstOnPartial * (taxedPartial / partial) : 0;
  const payableGst =
    exclusiveGstBase > 0 ? gstOnTaxable + payableGstOnPartial : gstPaidOnTaxableAndPartial;
  const nonPayableGst = gstPaidOnTaxableAndPartial - payableGst;

  return {
    total_purchases: Number(row.all_classes || 0),
    imports: Number(row.imported || 0),
    // Exclusive bases only — do not divide by 1.125; GST lives in Taxes:GST.
    standard_rated: taxable + taxedPartial,
    zero_rated: Number(row.zero_rated || 0),
    exempt:
      Number(row.exempt || 0)
      + untaxedPartial
      + nonPayableGst
      + Number(row.non_taxable || 0)
      + Number(row.other || 0),
    imported_gst: Number(row.imported_gst || 0),
    domestic_gst: payableGst,
    debit_credit_notes: Number(row.debit_credit_notes || 0),
    total_input_tax: payableGst + Number(row.imported_gst || 0) - Number(row.debit_credit_notes || 0),
    partial_adjusted: partial !== 0 && taxedShare !== 1,
  };
}
