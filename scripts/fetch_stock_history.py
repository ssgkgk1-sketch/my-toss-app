"""
종목별 5년치 일봉 종가 수집 스크립트 (pykrx 기반)
- Supabase의 stock_ranking(가장 최근 상승/하락 TOP10) 테이블에서 종목코드를 읽어와
- 종목별 최근 5년 일별 종가를 pykrx로 가져와 stock_history 테이블에 upsert한다.
- 장중 인트라데이 데이터는 pykrx로 가져올 수 없어, 앱의 "일/주/월/년" 차트는
  모두 이 일별 종가 시계열을 기간별로 리샘플링해서 만든다 (프론트엔드 src/lib/priceHistory.ts).

실행 전 설치:
    pip install -r requirements.txt

실행 (하루 1회, 장마감 후):
    python3 fetch_stock_history.py
"""
import json
import os
from datetime import datetime, timedelta
import pandas as pd
from pykrx import stock
from supabase import create_client

HISTORY_YEARS = 5


def get_client():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL / SUPABASE_SECRET_KEY 환경변수가 필요합니다.")
    return create_client(url, key)


def fetch_ranked_codes(client) -> list:
    res = client.table("stock_ranking").select("gainers, losers").eq("id", 1).single().execute()
    row = res.data or {}
    codes = [s["code"] for s in row.get("gainers", [])] + [s["code"] for s in row.get("losers", [])]
    # 중복 제거, 순서 유지
    seen = set()
    unique_codes = []
    for code in codes:
        if code not in seen:
            seen.add(code)
            unique_codes.append(code)
    return unique_codes


def fetch_daily_close(code: str, fromdate: str, todate: str) -> list:
    df = stock.get_market_ohlcv(fromdate, todate, code)
    df = df[df["종가"] > 0]
    records = []
    for date_idx, row in df.iterrows():
        records.append({
            "date": date_idx.strftime("%Y-%m-%d"),
            "close": int(row["종가"]),
        })
    return records


def main():
    client = get_client()
    codes = fetch_ranked_codes(client)
    if not codes:
        print("stock_ranking에 종목이 없어 종료합니다.")
        return

    today = datetime.now()
    fromdate = (today - timedelta(days=HISTORY_YEARS * 365 + 10)).strftime("%Y%m%d")
    todate = today.strftime("%Y%m%d")

    updated_at = datetime.now().isoformat()
    success, failed = 0, []

    for code in codes:
        try:
            daily = fetch_daily_close(code, fromdate, todate)
            if not daily:
                failed.append(code)
                continue
            client.table("stock_history").upsert({
                "code": code,
                "updated_at": updated_at,
                "daily": daily,
            }).execute()
            success += 1
            print(f"{code}: {len(daily)}개 일봉 저장 완료")
        except Exception as e:
            print(f"{code}: 실패 ({type(e).__name__}: {e})")
            failed.append(code)

    print(f"완료: {success}/{len(codes)} 종목 저장, 실패 {len(failed)}개 {failed}")


if __name__ == "__main__":
    main()
