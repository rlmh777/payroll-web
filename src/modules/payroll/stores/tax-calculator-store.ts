import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type TaxCalculatorLineKind = 'qb_account' | 'net_total' | 'section';

export interface TaxCalculatorRate {
  id: string;
  category: string;
  code: string;
  name: string;
  rate: number;
  iris_line?: string | null;
  applies_to_accounts: boolean;
  sort_order: number;
  is_active: boolean;
}

export interface TaxRateAssignment {
  code: string;
  tax_basis: 'gross' | 'net';
  category: string;
}

export interface TaxCalculatorAccount {
  id: string;
  account_id?: string | null;
  parent_id?: string | null;
  qb_code?: string | null;
  qb_name?: string | null;
  line_kind?: TaxCalculatorLineKind;
  is_rollup?: boolean;
  business_tax_code?: string | null;
  gst_code?: string | null;
  business_tax_codes?: string[];
  gst_codes?: string[];
  rate_assignments?: TaxRateAssignment[];
  include_btb: boolean;
  sort_order: number;
  is_active: boolean;
  account?: { id: string; name: string; code1?: string | null } | null;
  parent?: Pick<TaxCalculatorAccount, 'id' | 'qb_code' | 'qb_name' | 'line_kind'> | null;
}

export interface TaxCalculatorLine {
  account_id?: string | null;
  account_code?: string | null;
  account_name: string;
  amount: number;
  business_tax_code?: string | null;
  gst_code?: string | null;
  business_tax_codes?: string[];
  gst_codes?: string[];
  tax_rate_assignments?: TaxRateAssignment[];
  include_btb: boolean;
  is_rollup?: boolean;
  row_type?: 'heading' | 'account' | 'total' | 'grand_total';
  group_index?: number;
  include_in_tax?: boolean;
  tax_basis?: 'none' | 'gross' | 'net';
  label_column?: 'A' | 'B' | 'C' | 'D';
  sort_order?: number;
}

export interface TaxCalculatorRunSummary {
  id: string;
  year: number;
  month: number;
  combined_total?: number | null;
  updated_at?: string | null;
}

export interface TaxCalculatorResults {
  business_tax: {
    income: number;
    professional_services: number;
    tour_operator: number;
    dividend: number;
    income_tax: number;
    professional_services_tax: number;
    tour_operator_tax: number;
    dividend_tax: number;
    custom?: Array<{ code: string; amount: number; tax: number }>;
    total_tax: number;
    iris: {
      line_10: number;
      line_20: number;
      line_120: number;
      line_110: number;
    };
  };
  gst: {
    line_100: number;
    line_110: number;
    line_120: number;
    line_130: number;
    line_140: number;
    line_210: number;
    line_220: number;
    line_230: number;
    line_250: number;
    line_300: number;
    line_360: number;
  };
  btb: {
    base: number;
    tax: number;
  };
  partial_exemption: {
    gst_income: number;
    zero_rated_income: number;
    exempt_income: number;
    total_value: number;
    gst_income_ratio: number;
    zero_rated_ratio: number;
    exempt_ratio: number;
    partial_exemptions_total: number;
    ratio_times_partial_exemptions: number;
    total_debits: number;
    gst_value_entered?: number;
    less_partial_exemptions: number;
    line_250: number;
    gst_rate: number;
    gst_due_before_exemptions: number;
    invoices_less_exemptions: number;
    net_gst_due: number;
    net_of_2251: number;
    additional_liability: number;
  };
  combined_total: number;
}

export type TaxCalculatorGstSheetRow = {
  row: number;
} & Record<string, string | number>;

export interface TaxCalculatorPurchaseLedgerSheet {
  format: 'transaction' | 'hierarchical';
  columns: string[];
  rows: TaxCalculatorGstSheetRow[];
  name_column: string;
  class_column?: string | null;
  debit_column: string;
  date_column?: string | null;
}

export interface TaxCalculatorPurchaseLedgerExcludedName {
  id: string;
  name: string;
}

export interface TaxCalculatorWorkspace {
  year: number;
  month: number;
  run?: { id: string; year: number; month: number } | null;
  lines: TaxCalculatorLine[];
  total_debits: number;
  gst_value_entered?: number;
  partial_exemptions_total: number;
  line_220: number;
  net_of_2251: number;
  import_filename?: string | null;
  imported_at?: string | null;
  import_gst_sheet?: TaxCalculatorGstSheetRow[];
  import_purchase_ledger?: TaxCalculatorPurchaseLedgerSheet;
  import_purchase_ledger_filename?: string | null;
  import_purchase_ledger_at?: string | null;
  purchase_ledger_excluded_names?: TaxCalculatorPurchaseLedgerExcludedName[];
  results: TaxCalculatorResults | null;
  rates: TaxCalculatorRate[];
  previous_runs: TaxCalculatorRunSummary[];
}

function parseError(body: { message?: string; errors?: Record<string, string[] | string> }, fallback: string) {
  if (body.errors) {
    const first = Object.values(body.errors)[0];
    if (Array.isArray(first) && first[0]) return first[0];
    if (typeof first === 'string') return first;
  }
  return body.message || fallback;
}

export const useTaxCalculatorStore = defineStore('taxCalculator', {
  state: () => ({
    rates: [] as TaxCalculatorRate[],
    accounts: [] as TaxCalculatorAccount[],
    workspace: null as TaxCalculatorWorkspace | null,
    isLoadingRates: false,
    isLoadingAccounts: false,
    isLoadingWorkspace: false,
    isSaving: false,
    isImporting: false,
    isImportingPurchaseLedger: false,
    isSavingPurchaseLedgerExclusion: false,
    error: null as string | null,
    rateToEdit: null as TaxCalculatorRate | null,
    isCreateRateOpen: false,
    accountToEdit: null as TaxCalculatorAccount | null,
    isCreateAccountOpen: false,
  }),

  getters: {
    businessTaxRates: (state) =>
      state.rates.filter((rate) => rate.category === 'business_tax' && rate.applies_to_accounts && rate.is_active),
    gstRates: (state) =>
      state.rates.filter((rate) => rate.category === 'gst' && rate.applies_to_accounts && rate.is_active),
  },

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchRates() {
      this.isLoadingRates = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/tax-calculator-rates`, { headers: this.buildHeaders() });
        if (!response.ok) throw new Error('Failed to load tax rates');
        this.rates = await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load tax rates';
      } finally {
        this.isLoadingRates = false;
      }
    },

    async createRate(payload: Partial<TaxCalculatorRate>) {
      const response = await fetch(`${API_URL}/tax-calculator-rates`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(parseError(body, 'Create failed'));
      await this.fetchRates();
    },

    async updateRate(id: string, payload: Partial<TaxCalculatorRate>) {
      const response = await fetch(`${API_URL}/tax-calculator-rates/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(parseError(body, 'Update failed'));
      await this.fetchRates();
    },

    async deleteRate(id: string) {
      const response = await fetch(`${API_URL}/tax-calculator-rates/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) throw new Error('Delete failed');
      this.rates = this.rates.filter((item) => item.id !== id);
    },

    async fetchAccounts() {
      this.isLoadingAccounts = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/tax-calculator-accounts`, { headers: this.buildHeaders() });
        if (!response.ok) throw new Error('Failed to load calculator accounts');
        this.accounts = await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load calculator accounts';
      } finally {
        this.isLoadingAccounts = false;
      }
    },

    async createAccount(payload: Partial<TaxCalculatorAccount>) {
      const response = await fetch(`${API_URL}/tax-calculator-accounts`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(parseError(body, 'Create failed'));
      await this.fetchAccounts();
    },

    async updateAccount(id: string, payload: Partial<TaxCalculatorAccount>) {
      const response = await fetch(`${API_URL}/tax-calculator-accounts/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(parseError(body, 'Update failed'));
      await this.fetchAccounts();
    },

    async deleteAccount(id: string) {
      const response = await fetch(`${API_URL}/tax-calculator-accounts/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) throw new Error('Delete failed');
      this.accounts = this.accounts.filter((item) => item.id !== id);
    },

    async fetchWorkspace(year: number, month: number) {
      this.isLoadingWorkspace = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ year: String(year), month: String(month) });
        const response = await fetch(`${API_URL}/tax-calculator-runs/workspace?${params}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load GST calculator');
        const workspace = (await response.json()) as TaxCalculatorWorkspace;
        workspace.total_debits = Number(workspace.total_debits ?? workspace.gst_value_entered ?? 0);
        workspace.net_of_2251 = Number(workspace.net_of_2251 ?? 0);
        this.workspace = workspace;
        this.rates = workspace.rates ?? this.rates;
        return workspace;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load GST calculator';
        return null;
      } finally {
        this.isLoadingWorkspace = false;
      }
    },

    async preview(payload: {
      lines: TaxCalculatorLine[];
      total_debits: number;
      partial_exemptions_total: number;
      line_220: number;
      net_of_2251: number;
    }) {
      const response = await fetch(`${API_URL}/tax-calculator-runs/preview`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(parseError(body, 'Preview failed'));
      if (this.workspace) {
        this.workspace.results = body.results;
      }
      return body.results as TaxCalculatorResults;
    },

    async save(payload: {
      year: number;
      month: number;
      lines: TaxCalculatorLine[];
      total_debits: number;
      partial_exemptions_total: number;
      line_220: number;
      net_of_2251: number;
    }) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/tax-calculator-runs`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(parseError(body, 'Save failed'));
        this.workspace = body.data;
        if (this.workspace) {
          this.workspace.total_debits = Number(this.workspace.total_debits ?? this.workspace.gst_value_entered ?? 0);
          this.workspace.net_of_2251 = Number(this.workspace.net_of_2251 ?? 0);
        }
        return this.workspace;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Save failed';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async importWorkbook(year: number, month: number, file: File) {
      this.isImporting = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        const formData = new FormData();
        formData.append('year', String(year));
        formData.append('month', String(month));
        formData.append('file', file);
        const headers: HeadersInit = {};
        if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
        const response = await fetch(`${API_URL}/tax-calculator-runs/import`, {
          method: 'POST',
          headers,
          body: formData,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(parseError(body, 'Import failed'));
        this.workspace = body.data;
        if (this.workspace) {
          this.workspace.total_debits = Number(this.workspace.total_debits ?? this.workspace.gst_value_entered ?? 0);
          this.workspace.net_of_2251 = Number(this.workspace.net_of_2251 ?? 0);
        }
        return {
          workspace: this.workspace,
          accountsSync: body.accounts_sync as { created?: number; updated?: number } | undefined,
        };
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Import failed';
        throw error;
      } finally {
        this.isImporting = false;
      }
    },

    async importPurchaseLedger(year: number, month: number, file: File) {
      this.isImportingPurchaseLedger = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        const formData = new FormData();
        formData.append('year', String(year));
        formData.append('month', String(month));
        formData.append('file', file);
        const headers: HeadersInit = {};
        if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
        const response = await fetch(`${API_URL}/tax-calculator-runs/purchase-ledger/import`, {
          method: 'POST',
          headers,
          body: formData,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(parseError(body, 'Purchase ledger import failed'));
        this.workspace = body.data;
        if (this.workspace) {
          this.workspace.total_debits = Number(this.workspace.total_debits ?? this.workspace.gst_value_entered ?? 0);
          this.workspace.net_of_2251 = Number(this.workspace.net_of_2251 ?? 0);
        }
        return this.workspace;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Purchase ledger import failed';
        throw error;
      } finally {
        this.isImportingPurchaseLedger = false;
      }
    },

    async addPurchaseLedgerExclusion(name: string) {
      this.isSavingPurchaseLedgerExclusion = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/tax-calculator-purchase-ledger/exclusions`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(parseError(body, 'Failed to exclude company'));
        const item = body as TaxCalculatorPurchaseLedgerExcludedName;
        if (this.workspace) {
          const existing = this.workspace.purchase_ledger_excluded_names ?? [];
          if (!existing.some((entry) => entry.id === item.id)) {
            this.workspace.purchase_ledger_excluded_names = [...existing, item].sort((a, b) => a.name.localeCompare(b.name));
          }
        }
        return item;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to exclude company';
        throw error;
      } finally {
        this.isSavingPurchaseLedgerExclusion = false;
      }
    },

    async removePurchaseLedgerExclusion(id: string) {
      this.isSavingPurchaseLedgerExclusion = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/tax-calculator-purchase-ledger/exclusions/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to remove excluded company');
        if (this.workspace?.purchase_ledger_excluded_names) {
          this.workspace.purchase_ledger_excluded_names = this.workspace.purchase_ledger_excluded_names.filter(
            (entry) => entry.id !== id,
          );
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to remove excluded company';
        throw error;
      } finally {
        this.isSavingPurchaseLedgerExclusion = false;
      }
    },

    async deleteRun(id: string) {
      const response = await fetch(`${API_URL}/tax-calculator-runs/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) throw new Error('Delete failed');
    },

    setRateToEdit(rate: TaxCalculatorRate | null) {
      this.rateToEdit = rate ? { ...rate } : null;
    },

    setAccountToEdit(account: TaxCalculatorAccount | null) {
      this.accountToEdit = account ? { ...account } : null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTaxCalculatorStore, import.meta.hot));
}
