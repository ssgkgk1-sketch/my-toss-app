import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Tab, Button } from "@toss/tds-mobile";
import { type Stock, type Market, type DailyClose } from "../data/stocks";
import { supabase } from "../lib/supabase";
import { resamplePriceHistory, type Period } from "../lib/priceHistory";
import { isWatched, toggleWatchlist } from "../lib/watchlist";
import { LineChart } from "../components/LineChart";
import "../styles/detail.css";

const MARKET_LABELS: Record<Market, string> = {
  KOSPI: "코스피",
  KOSDAQ: "코스닥",
};

const PERIODS: { label: string; key: Period }[] = [
  { label: "일", key: "day" },
  { label: "주", key: "week" },
  { label: "월", key: "month" },
  { label: "년", key: "year" },
];

function formatPrice(price: number) {
  return price.toLocaleString("ko-KR");
}

function formatRate(rate: number) {
  const sign = rate > 0 ? "+" : "";
  return `${sign}${rate.toFixed(2)}%`;
}

/** 시가/고가/저가 등 — 파이프라인 업그레이드 이전 데이터에는 값이 없을 수 있어 방어적으로 처리 */
function formatWon(value: number | null | undefined) {
  return value == null ? "-" : `${value.toLocaleString("ko-KR")}원`;
}

function formatVolume(volume: number | null | undefined) {
  return volume == null ? "-" : `${volume.toLocaleString("ko-KR")}주`;
}

/** 원 단위 시가총액을 "N조 M,MMM억" 형태로 */
function formatMarketCap(cap: number | null) {
  if (cap == null) return "-";
  const eok = Math.round(cap / 1e8);
  const jo = Math.floor(eok / 10000);
  const rest = eok % 10000;
  if (jo > 0) return rest > 0 ? `${jo}조 ${rest.toLocaleString("ko-KR")}억` : `${jo}조`;
  return `${eok.toLocaleString("ko-KR")}억`;
}

function formatPer(per: number | null) {
  return per == null ? "-" : per.toFixed(2);
}

export default function StockDetail() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state: { stock: Stock } | null };
  const stock = state?.stock;

  // hooks는 조건부로 호출 불가 → null일 때도 동일하게 호출하고 내부에서 가드
  const [periodIdx, setPeriodIdx] = useState(0);
  const [watched, setWatched] = useState(false);
  const [history, setHistory] = useState<DailyClose[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (stock) setWatched(isWatched(stock.code));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stock?.code]);

  useEffect(() => {
    if (!stock) return;
    let cancelled = false;

    async function fetchHistory() {
      setHistoryLoading(true);
      setHistoryError(null);
      const { data, error } = await supabase
        .from("stock_history")
        .select("daily")
        .eq("code", stock!.code)
        .maybeSingle();
      if (cancelled) return;
      if (error) setHistoryError(error.message);
      else setHistory((data?.daily as DailyClose[]) ?? []);
      setHistoryLoading(false);
    }

    fetchHistory();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stock?.code]);

  const resampled = useMemo(
    () => resamplePriceHistory(history, PERIODS[periodIdx].key),
    [history, periodIdx],
  );

  if (!stock) {
    return (
      <div className="detail-screen">
        <div className="detail-fallback">
          <p>종목 정보를 불러올 수 없습니다.</p>
          <button onClick={() => navigate("/")}>목록으로 돌아가기</button>
        </div>
      </div>
    );
  }

  const isRise = stock.changeRate > 0;
  const rateColor = isRise ? "#ff3b30" : "#007aff";

  function handleToggleWatch() {
    setWatched(toggleWatchlist(stock!.code));
  }

  return (
    <div className="detail-screen">
      {/* ── 헤더 (커스텀 — 네이티브 NavigationBar는 SDK 전용) ── */}
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="뒤로가기">
          ‹
        </button>
        <span className="detail-header-name">{stock.name}</span>
        <button
          className={`star-btn${watched ? " star-btn-active" : ""}`}
          onClick={handleToggleWatch}
          aria-label={watched ? "관심종목에서 제거" : "관심종목 추가"}
        >
          {watched ? "★" : "☆"}
        </button>
      </header>

      {/* ── 가격 섹션 ── */}
      <section className="price-section">
        <div className="ticker-row">
          <span className="ticker-code">{stock.code}</span>
          <span className="ticker-dot">·</span>
          <span className="ticker-market">{MARKET_LABELS[stock.market]}</span>
        </div>

        <div className="price-main">
          <span className="price-unit">₩</span>
          {formatPrice(stock.price)}
        </div>

        <div className="price-change-row">
          <span className="change-rate" style={{ color: rateColor }}>
            {formatRate(stock.changeRate)}
          </span>
          <span className="change-label">오늘</span>
        </div>

        {/* ▶ TDS Tab — 일/주/월/년 기간 선택 */}
        <div className="period-tab-tds">
          <Tab size="small" onChange={(idx) => setPeriodIdx(idx)}>
            {PERIODS.map(({ label }, idx) => (
              <Tab.Item key={label} selected={periodIdx === idx}>
                {label}
              </Tab.Item>
            ))}
          </Tab>
        </div>
      </section>

      {/* ── 차트 ── */}
      <div className="chart-area">
        {historyLoading ? (
          <div className="chart-state">
            <span className="spinner-sm" />
          </div>
        ) : historyError ? (
          <div className="chart-state chart-state-error">차트를 불러오지 못했습니다</div>
        ) : (
          <LineChart points={resampled} seed={stock.code} color={rateColor} />
        )}
      </div>

      {/* ── 지표 그리드 (커스텀 유지 — 6셀 3열 구성) ── */}
      <section className="stats-section">
        <div className="stats-grid">
          <StatItem label="시가" value={formatWon(stock.open)} muted={stock.open == null} />
          <StatItem label="고가" value={formatWon(stock.high)} color={stock.high != null && isRise ? "#ff3b30" : undefined} muted={stock.high == null} />
          <StatItem label="저가" value={formatWon(stock.low)} color={stock.low != null && !isRise ? "#007aff" : undefined} muted={stock.low == null} />
          <StatItem label="거래량" value={formatVolume(stock.volume)} muted={stock.volume == null} />
          <StatItem label="시가총액" value={formatMarketCap(stock.marketCap)} muted={stock.marketCap == null} />
          <StatItem label="PER" value={formatPer(stock.per)} muted={stock.per == null} />
        </div>
      </section>

      {/* ▶ TDS Button — 관심종목 추가 */}
      <div className="watchlist-btn-wrap">
        <Button
          display="block"
          color="dark"
          variant="weak"
          size="xlarge"
          onClick={handleToggleWatch}
          aria-label={watched ? "관심종목에서 제거" : "관심종목에 추가"}
        >
          {watched ? "★ 관심종목에 추가됨" : "☆ 관심종목에 추가"}
        </Button>
      </div>

      <footer className="detail-footer">
        본 정보는 투자 참고용이며, 투자 권유가 아닙니다.
      </footer>
    </div>
  );
}

/* ── StatItem 헬퍼 ── */
function StatItem({
  label,
  value,
  color,
  muted,
}: {
  label: string;
  value: string;
  color?: string;
  muted?: boolean;
}) {
  return (
    <div className="stat-item">
      <span className="stat-label">{label}</span>
      <span
        className={`stat-value${muted ? " stat-value-muted" : ""}`}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}
