import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SegmentedControl, ListRow, List } from "@toss/tds-mobile";
import { supabase } from "../lib/supabase";
import { type Stock, type StockRankingRow, type Market } from "../data/stocks";
import "../App.css";

type Tab = "rise" | "fall" | "popular";
type Filter = "all" | Market;

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

function formatBaseDate(dateStr: string) {
  return dateStr.replace(/-/g, ".");
}

export default function StockList() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("rise");
  const [filter, setFilter] = useState<Filter>("all");
  const [data, setData] = useState<StockRankingRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRanking() {
      setLoading(true);
      setError(null);
      let { data: rows, error: err } = await supabase
        .from("stock_ranking")
        .select("id, base_date, updated_at, gainers, losers, popular")
        .eq("id", 1)
        .single();

      // popular 컬럼을 아직 추가하지 않은 환경(마이그레이션 전)을 위한 하위 호환 재시도
      if (err && err.message?.includes("popular")) {
        ({ data: rows, error: err } = await supabase
          .from("stock_ranking")
          .select("id, base_date, updated_at, gainers, losers")
          .eq("id", 1)
          .single());
      }

      if (cancelled) return;
      if (err) setError(err.message);
      else setData(rows as StockRankingRow);
      setLoading(false);
    }

    fetchRanking();
    return () => { cancelled = true; };
  }, []);

  const baseList: Stock[] = useMemo(() => {
    if (!data) return [];
    if (tab === "rise") return data.gainers;
    if (tab === "fall") return data.losers;
    return data.popular ?? [];
  }, [data, tab]);

  const filtered = useMemo(
    () => (filter === "all" ? baseList : baseList.filter((s) => s.market === filter)),
    [baseList, filter],
  );

  function switchTab(next: Tab) {
    setTab(next);
    setFilter("all");
  }

  const refTime = data ? `${formatBaseDate(data.base_date)} 기준` : "";

  return (
    <div className="screen">
      {/* ── 헤더 ── */}
      <header className="header">
        <div className="header-top">
          <h1 className="title">주식 순위</h1>
          {refTime && <span className="ref-time">{refTime}</span>}
        </div>

        {/* ▶ TDS SegmentedControl — 상승/하락/인기 */}
        <div className={`seg-tds-wrap seg-${tab}`}>
          <SegmentedControl
            value={tab}
            onChange={(v) => switchTab(v as Tab)}
            size="large"
          >
            <SegmentedControl.Item value="rise">상승</SegmentedControl.Item>
            <SegmentedControl.Item value="fall">하락</SegmentedControl.Item>
            <SegmentedControl.Item value="popular">인기</SegmentedControl.Item>
          </SegmentedControl>
        </div>

        {/* 커스텀 필터 칩 (TDS 대응 컴포넌트 없음) */}
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

      {/* ── 본문 ── */}
      <main className="list">
        {loading && (
          <div className="state-box">
            <span className="spinner" />
            <p className="state-text">데이터를 불러오는 중...</p>
          </div>
        )}
        {!loading && error && (
          <div className="state-box">
            <p className="state-text error-text">⚠ 데이터를 불러오지 못했습니다</p>
            <p className="state-sub">{error}</p>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="empty">해당하는 종목이 없습니다.</p>
        )}

        {/* ▶ TDS List + ListRow — 종목 목록 */}
        {!loading && !error && filtered.length > 0 && (
          <List className="stock-list-tds">
            {filtered.map((stock, idx) => {
              const isRise = stock.changeRate > 0;
              const rateColor = isRise ? "#ff3b30" : "#007aff";
              return (
                <ListRow
                  key={`${stock.code}-${idx}`}
                  withTouchEffect
                  onClick={() => navigate(`/stock/${stock.code}`, { state: { stock } })}
                  /* 왼쪽: 순위 번호 (커스텀 span — 어두운 색) */
                  left={<span className="rank">{idx + 1}</span>}
                  /* 가운데: 종목명 + 코드/시장 (커스텀 스타일 — 어두운 배경 최적화) */
                  contents={
                    <div className="stock-info">
                      <span className="stock-name">{stock.name}</span>
                      <div className="stock-meta">
                        <span className="stock-code">{stock.code}</span>
                        <span className="meta-dot">·</span>
                        <span className="stock-market">{MARKET_LABELS[stock.market]}</span>
                      </div>
                    </div>
                  }
                  /* 오른쪽: 가격 + 등락률 (색상은 커스텀) */
                  right={
                    <div className="stock-price-col">
                      <span className="stock-price">{formatPrice(stock.price)}</span>
                      <span className="stock-rate" style={{ color: rateColor }}>
                        {formatRate(stock.changeRate)}
                      </span>
                    </div>
                  }
                />
              );
            })}
          </List>
        )}
      </main>

      <footer className="footer">
        본 정보는 투자 참고용이며, 투자 권유가 아닙니다.
      </footer>
    </div>
  );
}
