import { useState, useMemo } from "react";
import { RISING_STOCKS, FALLING_STOCKS, type Stock, type Market } from "./data/stocks";
import "./App.css";

type Tab = "rise" | "fall";
type Filter = "all" | Market;

const REFERENCE_TIME = "2026.07.02 15:30 기준";

const MARKET_LABELS: Record<Market, string> = {
  KOSPI: "코스피",
  KOSDAQ: "코스닥",
};

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR") + "원";
}

function formatRate(rate: number) {
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(2)}%`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("rise");
  const [filter, setFilter] = useState<Filter>("all");

  const baseList: Stock[] = tab === "rise" ? RISING_STOCKS : FALLING_STOCKS;

  const filtered = useMemo(() => {
    if (filter === "all") return baseList;
    return baseList.filter((s) => s.market === filter);
  }, [baseList, filter]);

  function switchTab(next: Tab) {
    setTab(next);
    setFilter("all");
  }

  return (
    <div className="screen">
      {/* 헤더 */}
      <header className="header">
        <div className="header-top">
          <h1 className="title">주식 순위</h1>
          <span className="ref-time">{REFERENCE_TIME}</span>
        </div>

        {/* 상승 / 하락 세그먼트 */}
        <div className="seg-wrap">
          <button
            className={`seg-btn${tab === "rise" ? " seg-rise-active" : ""}`}
            onClick={() => switchTab("rise")}
          >
            상승
          </button>
          <button
            className={`seg-btn${tab === "fall" ? " seg-fall-active" : ""}`}
            onClick={() => switchTab("fall")}
          >
            하락
          </button>
        </div>

        {/* 시장 필터 칩 */}
        <div className="chip-row">
          {(["all", "KOSPI", "KOSDAQ"] as const).map((f) => (
            <button
              key={f}
              className={`chip${filter === f ? " chip-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "전체" : MARKET_LABELS[f]}
            </button>
          ))}
        </div>
      </header>

      {/* 컬럼 헤더 */}
      <div className="col-header">
        <span className="col-rank">순위</span>
        <span className="col-name">종목</span>
        <span className="col-price">현재가 / 등락률</span>
      </div>

      {/* 종목 리스트 */}
      <main className="list">
        {filtered.length === 0 && (
          <p className="empty">해당하는 종목이 없습니다.</p>
        )}
        {filtered.map((stock, idx) => {
          const isRise = stock.changeRate > 0;
          const rateColor = isRise ? "#ff3b30" : "#007aff";
          return (
            <div key={`${stock.code}-${idx}`} className="stock-row">
              <span className="rank">{idx + 1}</span>
              <div className="stock-info">
                <span className="stock-name">{stock.name}</span>
                <div className="stock-meta">
                  <span className="stock-code">{stock.code}</span>
                  <span className="meta-dot">·</span>
                  <span className="stock-market">{MARKET_LABELS[stock.market]}</span>
                </div>
              </div>
              <div className="stock-price-col">
                <span className="stock-price">{formatPrice(stock.price)}</span>
                <span className="stock-rate" style={{ color: rateColor }}>
                  {formatRate(stock.changeRate)}
                </span>
              </div>
            </div>
          );
        })}
      </main>

      {/* 면책 문구 */}
      <footer className="footer">
        본 정보는 투자 참고용이며, 투자 권유가 아닙니다.
      </footer>
    </div>
  );
}
