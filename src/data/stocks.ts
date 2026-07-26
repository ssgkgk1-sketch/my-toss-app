export type Market = "KOSPI" | "KOSDAQ";

/** stock_ranking 테이블의 gainers/losers jsonb 아이템 */
export interface Stock {
  code: string;
  name: string;
  market: Market;
  price: number;
  changeRate: number; // 등락률 (%)
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap: number | null; // 시가총액 (원)
  per: number | null; // 주가수익비율, 결측/무의미 시 null
}

/** stock_ranking 테이블 행 */
export interface StockRankingRow {
  id: number;
  base_date: string;   // "2026-07-02" 형태
  updated_at: string;  // ISO 8601
  gainers: Stock[];
  losers: Stock[];
}

/** stock_history 테이블의 일별 종가 한 점 */
export interface DailyClose {
  date: string;  // "2026-07-02" 형태
  close: number;
}

/** stock_history 테이블 행 */
export interface StockHistoryRow {
  code: string;
  updated_at: string;
  daily: DailyClose[];
}
