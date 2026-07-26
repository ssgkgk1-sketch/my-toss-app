"""
주식 등락률 순위 수집 스크립트 (pykrx 기반)
- 코스피 + 코스닥 전종목의 등락률을 가져와서
- 상승 TOP10 / 하락 TOP10을 뽑아 JSON 파일로 저장하고 Supabase에 업로드한다.

실행 전 설치:
    pip install pykrx pandas supabase --break-system-packages

실행:
    python3 fetch_stock_ranking.py
"""
import json
import os
from datetime import datetime, timedelta
import pandas as pd
from pykrx import stock
from supabase import create_client


def get_latest_business_day() -> str:
    today = datetime.now()
    for i in range(10):
        candidate = (today - timedelta(days=i)).strftime("%Y%m%d")
        try:
            df = stock.get_market_ohlcv(candidate, market="KOSPI")
            if not df.empty and df["거래량"].sum() > 0:
                return candidate
        except Exception:
            continue
    raise RuntimeError("최근 영업일을 찾지 못했습니다.")


def fetch_market_ranking(date: str, market: str) -> pd.DataFrame:
    df = stock.get_market_ohlcv(date, market=market)
    tickers = df.index.tolist()
    names = {t: stock.get_market_ticker_name(t) for t in tickers}
    df = df.reset_index().rename(columns={"티커": "code"})
    df["name"] = df["code"].map(names)
    df["market"] = market
    df["price"] = df["종가"]
    df["changeRate"] = df["등락률"]
    df["open"] = df["시가"]
    df["high"] = df["고가"]
    df["low"] = df["저가"]
    df["volume"] = df["거래량"]
    df = df[df["price"] > 0]
    return df[["code", "name", "market", "price", "changeRate", "open", "high", "low", "volume"]]


def fetch_market_extra(date: str, market: str) -> pd.DataFrame:
    """시가총액 · PER — 종목별이 아니라 시장 전체 1회 조회 후 나중에 code로 병합한다."""
    cap = stock.get_market_cap(date, market=market)[["시가총액"]]
    fundamental = stock.get_market_fundamental(date, market=market)[["PER"]]
    merged = cap.join(fundamental, how="left")
    merged = merged.reset_index().rename(
        columns={"티커": "code", "시가총액": "marketCap", "PER": "per"}
    )
    return merged[["code", "marketCap", "per"]]


def build_ranking(date: str, top_n: int = 10, popular_n: int = 20) -> dict:
    kospi = fetch_market_ranking(date, "KOSPI")
    kosdaq = fetch_market_ranking(date, "KOSDAQ")
    all_stocks = pd.concat([kospi, kosdaq], ignore_index=True)

    extra_kospi = fetch_market_extra(date, "KOSPI")
    extra_kosdaq = fetch_market_extra(date, "KOSDAQ")
    extra = pd.concat([extra_kospi, extra_kosdaq], ignore_index=True)
    all_stocks = all_stocks.merge(extra, on="code", how="left")

    gainers = all_stocks.sort_values("changeRate", ascending=False).head(top_n)
    losers = all_stocks.sort_values("changeRate", ascending=True).head(top_n)
    # "인기" 탭 — 시가총액 상위 종목 (대형 우량주는 등락률 TOP에 거의 안 나오므로 별도로 노출)
    popular = all_stocks.dropna(subset=["marketCap"]).sort_values("marketCap", ascending=False).head(popular_n)

    def to_records(df: pd.DataFrame) -> list:
        records = []
        for rank, row in enumerate(df.itertuples(index=False), start=1):
            per = row.per
            market_cap = row.marketCap
            records.append({
                "rank": rank,
                "code": row.code,
                "name": row.name,
                "market": row.market,
                "price": int(row.price),
                "changeRate": round(float(row.changeRate), 2),
                "open": int(row.open),
                "high": int(row.high),
                "low": int(row.low),
                "volume": int(row.volume),
                "marketCap": int(market_cap) if pd.notna(market_cap) else None,
                # PER 0 이하는 적자 기업 등 의미 없는 값이라 None(= "-" 표시) 처리
                "per": round(float(per), 2) if pd.notna(per) and per > 0 else None,
            })
        return records

    return {
        "baseDate": date,
        "updatedAt": datetime.now().isoformat(),
        "gainers": to_records(gainers),
        "losers": to_records(losers),
        "popular": to_records(popular),
    }


def upload_to_supabase(result: dict):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SECRET_KEY")

    if not url or not key:
        print("SUPABASE_URL / SUPABASE_SECRET_KEY 환경변수가 없어 업로드를 건너뜁니다.")
        return

    client = create_client(url, key)
    client.table("stock_ranking").upsert({
        "id": 1,
        "base_date": result["baseDate"],
        "updated_at": result["updatedAt"],
        "gainers": result["gainers"],
        "losers": result["losers"],
        "popular": result["popular"],
    }).execute()

    print("Supabase 업로드 완료.")


def main():
    date = get_latest_business_day()
    print(f"기준일: {date}")
    result = build_ranking(date, top_n=10)

    output_path = "stock_ranking.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"저장 완료: {output_path}")
    print(
        f"상승 TOP{len(result['gainers'])} / 하락 TOP{len(result['losers'])} "
        f"/ 인기(시가총액) TOP{len(result['popular'])}"
    )

    upload_to_supabase(result)


if __name__ == "__main__":
    main()
