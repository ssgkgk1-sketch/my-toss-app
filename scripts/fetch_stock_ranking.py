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
    df = df[df["price"] > 0]
    return df[["code", "name", "market", "price", "changeRate"]]


def build_ranking(date: str, top_n: int = 10) -> dict:
    kospi = fetch_market_ranking(date, "KOSPI")
    kosdaq = fetch_market_ranking(date, "KOSDAQ")
    all_stocks = pd.concat([kospi, kosdaq], ignore_index=True)
    gainers = all_stocks.sort_values("changeRate", ascending=False).head(top_n)
    losers = all_stocks.sort_values("changeRate", ascending=True).head(top_n)

    def to_records(df: pd.DataFrame) -> list:
        records = []
        for rank, row in enumerate(df.itertuples(index=False), start=1):
            records.append({
                "rank": rank,
                "code": row.code,
                "name": row.name,
                "market": row.market,
                "price": int(row.price),
                "changeRate": round(float(row.changeRate), 2),
            })
        return records

    return {
        "baseDate": date,
        "updatedAt": datetime.now().isoformat(),
        "gainers": to_records(gainers),
        "losers": to_records(losers),
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
    print(f"상승 TOP{len(result['gainers'])} / 하락 TOP{len(result['losers'])}")

    upload_to_supabase(result)


if __name__ == "__main__":
    main()
