const WATCHLIST_KEY = "stock_watchlist_v1";

function loadCodes(): string[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveCodes(codes: string[]) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(codes));
}

export function getWatchlist(): string[] {
  return loadCodes();
}

export function isWatched(code: string): boolean {
  return loadCodes().includes(code);
}

/** 관심종목 상태를 토글하고, 토글 후 상태(true=관심종목에 추가됨)를 반환한다 */
export function toggleWatchlist(code: string): boolean {
  const codes = loadCodes();
  const idx = codes.indexOf(code);
  if (idx === -1) {
    codes.push(code);
    saveCodes(codes);
    return true;
  }
  codes.splice(idx, 1);
  saveCodes(codes);
  return false;
}
