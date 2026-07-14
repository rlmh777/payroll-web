const DEFAULT_FUZZY_THRESHOLD = 0.55;

export function levenshteinDistance(left: string, right: string): number {
  if (left === right) {
    return 0;
  }

  if (left.length === 0) {
    return right.length;
  }

  if (right.length === 0) {
    return left.length;
  }

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let i = 0; i < left.length; i += 1) {
    let previousDiagonal = previous[0] ?? 0;
    previous[0] = i + 1;

    for (let j = 0; j < right.length; j += 1) {
      const temp = previous[j + 1] ?? 0;
      const cost = left[i] === right[j] ? 0 : 1;
      previous[j + 1] = Math.min(
        (previous[j] ?? 0) + 1,
        (previous[j + 1] ?? 0) + 1,
        previousDiagonal + cost,
      );
      previousDiagonal = temp;
    }
  }

  return previous[right.length] ?? 0;
}

export function fuzzyMatchScore(search: string, target: string): number {
  const needle = search.trim().toLowerCase();
  const haystack = target.trim().toLowerCase();

  if (!needle) {
    return 1;
  }

  if (!haystack) {
    return 0;
  }

  if (haystack.includes(needle)) {
    return 1;
  }

  const tokens = haystack.split(/\s+/).filter(Boolean);
  let bestTokenScore = 0;

  for (const token of tokens) {
    if (token.startsWith(needle)) {
      bestTokenScore = Math.max(bestTokenScore, 0.95);
      continue;
    }

    const distance = levenshteinDistance(needle, token);
    const maxLength = Math.max(needle.length, token.length);
    const allowedDistance = Math.max(1, Math.floor(needle.length * 0.34));
    if (distance <= allowedDistance) {
      bestTokenScore = Math.max(bestTokenScore, 1 - distance / maxLength);
    }
  }

  if (bestTokenScore > 0) {
    return bestTokenScore;
  }

  const fullDistance = levenshteinDistance(needle, haystack);
  const fullMaxLength = Math.max(needle.length, haystack.length);
  const fullAllowedDistance = Math.max(2, Math.floor(needle.length * 0.4));

  if (fullDistance <= fullAllowedDistance) {
    return 1 - fullDistance / fullMaxLength;
  }

  return 0;
}

export function matchesFuzzySearch(
  search: string,
  targets: Array<string | null | undefined>,
  threshold = DEFAULT_FUZZY_THRESHOLD,
): boolean {
  const needle = search.trim();
  if (!needle) {
    return true;
  }

  return targets.some((target) => {
    if (!target) {
      return false;
    }

    return fuzzyMatchScore(needle, target) >= threshold;
  });
}

export function rankFuzzyMatches<T>(
  items: T[],
  search: string,
  getTargets: (item: T) => Array<string | null | undefined>,
  threshold = DEFAULT_FUZZY_THRESHOLD,
): T[] {
  const needle = search.trim();
  if (!needle) {
    return [...items];
  }

  return items
    .map((item) => {
      const score = Math.max(
        ...getTargets(item).map((target) => (target ? fuzzyMatchScore(needle, target) : 0)),
      );
      return { item, score };
    })
    .filter((entry) => entry.score >= threshold)
    .sort((left, right) => right.score - left.score)
    .map((entry) => entry.item);
}
