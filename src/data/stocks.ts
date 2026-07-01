export type Market = "KOSPI" | "KOSDAQ";

export interface Stock {
  code: string;
  name: string;
  market: Market;
  price: number;
  changeRate: number; // 등락률 (%)
}

// 더미 데이터 — 상승 종목
export const RISING_STOCKS: Stock[] = [
  { code: "005930", name: "삼성전자", market: "KOSPI", price: 78200, changeRate: 8.42 },
  { code: "247540", name: "에코프로비엠", market: "KOSDAQ", price: 312500, changeRate: 7.15 },
  { code: "000660", name: "SK하이닉스", market: "KOSPI", price: 189000, changeRate: 6.88 },
  { code: "086520", name: "에코프로", market: "KOSDAQ", price: 98700, changeRate: 6.31 },
  { code: "373220", name: "LG에너지솔루션", market: "KOSPI", price: 412000, changeRate: 5.72 },
  { code: "091990", name: "셀트리온헬스케어", market: "KOSDAQ", price: 71300, changeRate: 5.04 },
  { code: "035420", name: "NAVER", market: "KOSPI", price: 215500, changeRate: 4.63 },
  { code: "028300", name: "HLB", market: "KOSDAQ", price: 54200, changeRate: 4.11 },
  { code: "005380", name: "현대차", market: "KOSPI", price: 248000, changeRate: 3.57 },
  { code: "196170", name: "알테오젠", market: "KOSDAQ", price: 182600, changeRate: 3.02 },
  { code: "000270", name: "기아", market: "KOSPI", price: 112300, changeRate: 2.48 },
  { code: "068270", name: "셀트리온", market: "KOSPI", price: 178900, changeRate: 1.91 },
];

// 더미 데이터 — 하락 종목
export const FALLING_STOCKS: Stock[] = [
  { code: "051910", name: "LG화학", market: "KOSPI", price: 398500, changeRate: -6.73 },
  { code: "247540", name: "에코프로비엠", market: "KOSDAQ", price: 289000, changeRate: -5.94 },
  { code: "207940", name: "삼성바이오로직스", market: "KOSPI", price: 762000, changeRate: -5.22 },
  { code: "066970", name: "엘앤에프", market: "KOSDAQ", price: 143800, changeRate: -4.87 },
  { code: "035720", name: "카카오", market: "KOSPI", price: 41200, changeRate: -4.35 },
  { code: "293490", name: "카카오게임즈", market: "KOSDAQ", price: 21850, changeRate: -3.98 },
  { code: "006400", name: "삼성SDI", market: "KOSPI", price: 356000, changeRate: -3.41 },
  { code: "263750", name: "펄어비스", market: "KOSDAQ", price: 38900, changeRate: -2.87 },
  { code: "012330", name: "현대모비스", market: "KOSPI", price: 223500, changeRate: -2.33 },
  { code: "058470", name: "리노공업", market: "KOSDAQ", price: 187200, changeRate: -1.76 },
  { code: "015760", name: "한국전력", market: "KOSPI", price: 20450, changeRate: -1.24 },
  { code: "042700", name: "한미반도체", market: "KOSDAQ", price: 96800, changeRate: -0.82 },
];
