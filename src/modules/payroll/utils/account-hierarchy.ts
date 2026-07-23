import type { Account } from '@core/types/models';

export interface AccountOption extends Account {
  depth: number;
  displayLabel: string;
  isSubaccount: boolean;
}

const INDENT = ' '; // em space — keeps hierarchy readable in selects

function compareByName(a: Account, b: Account): number {
  return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
}

/**
 * Flatten a flat account list into parent → children order with depth.
 * Accounts whose parent is missing from the list are treated as roots.
 */
export function flattenAccountsHierarchically(accounts: Account[]): AccountOption[] {
  if (!accounts.length) return [];

  const byId = new Map(accounts.map((account) => [account.id, account]));
  const childrenByParent = new Map<string | null, Account[]>();

  for (const account of accounts) {
    const parentId =
      account.parent_id && byId.has(account.parent_id) ? account.parent_id : null;
    const siblings = childrenByParent.get(parentId) ?? [];
    siblings.push(account);
    childrenByParent.set(parentId, siblings);
  }

  for (const siblings of childrenByParent.values()) {
    siblings.sort(compareByName);
  }

  const result: AccountOption[] = [];

  const visit = (parentId: string | null, depth: number) => {
    const children = childrenByParent.get(parentId) ?? [];
    for (const account of children) {
      result.push(toAccountOption(account, depth));
      visit(account.id, depth + 1);
    }
  };

  visit(null, 0);
  return result;
}

export function toAccountOption(account: Account, depth = 0): AccountOption {
  const isSubaccount = depth > 0 || Boolean(account.parent_id);
  const prefix = depth > 0 ? `${INDENT.repeat(depth)}↳ ` : '';
  return {
    ...account,
    depth,
    isSubaccount,
    displayLabel: `${prefix}${account.name}`,
  };
}

export function filterAccountOptions(
  options: AccountOption[],
  search: string
): AccountOption[] {
  const needle = search.trim().toLowerCase();
  if (!needle) return options;

  const matchedIds = new Set<string>();
  for (const option of options) {
    const haystack = [
      option.name,
      option.code1,
      option.code2,
      option.accountType?.name,
      option.parent?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (haystack.includes(needle)) {
      matchedIds.add(option.id);
    }
  }

  // Keep ancestors of matches so hierarchy stays readable while filtering
  const byId = new Map(options.map((option) => [option.id, option]));
  for (const id of [...matchedIds]) {
    let current = byId.get(id);
    while (current?.parent_id) {
      matchedIds.add(current.parent_id);
      current = byId.get(current.parent_id);
    }
  }

  return options.filter((option) => matchedIds.has(option.id));
}

export function accountDepthFromParentId(
  account: Account,
  byId: Map<string, Account>
): number {
  let depth = 0;
  let parentId = account.parent_id ?? null;
  const seen = new Set<string>();

  while (parentId && byId.has(parentId) && !seen.has(parentId)) {
    seen.add(parentId);
    depth += 1;
    parentId = byId.get(parentId)?.parent_id ?? null;
  }

  // Parent exists but is not in the current set (e.g. another page)
  if (account.parent_id && !byId.has(account.parent_id)) {
    return Math.max(depth, 1);
  }

  return depth;
}
