import type { DailyClose } from "../data/stocks";

export type Period = "day" | "week" | "month" | "year";

/** "YYYY-MM-DD" → UTC 자정 Date (로컬 타임존에 의한 날짜 밀림 방지) */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** ISO 8601 주차 키 (예: "2026-W27") — 목요일 기준 계산 */
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // 월=0 ... 일=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // 이번 주 목요일로 이동
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNum = 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86400000));
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function yearKey(date: Date): string {
  return `${date.getUTCFullYear()}`;
}

/** 같은 그룹 키를 가진 포인트 중 마지막(가장 최근) 값만 남긴다 (입력은 날짜 오름차순이어야 함) */
function groupByLast(points: DailyClose[], keyFn: (dateStr: string) => string): DailyClose[] {
  const map = new Map<string, DailyClose>();
  for (const p of points) {
    map.set(keyFn(p.date), p);
  }
  return Array.from(map.values());
}

/**
 * 일별 종가 시계열을 기간 탭(일/주/월/년)에 맞게 리샘플링한다.
 * pykrx로는 인트라데이 데이터를 가져올 수 없어, 모든 기간이 이 일봉 시계열에서 파생된다.
 *  - day : 최근 30 거래일 원본
 *  - week: 최근 ~6개월(130 거래일)을 주 단위로 묶어 각 주의 마지막 종가
 *  - month: 최근 ~3년(750 거래일)을 월 단위로 묶어 각 달의 마지막 종가
 *  - year: 전체 기간(최대 5년)을 연 단위로 묶어 각 해의 마지막 종가
 */
export function resamplePriceHistory(daily: DailyClose[], period: Period): DailyClose[] {
  if (daily.length === 0) return [];
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));

  switch (period) {
    case "day":
      return sorted.slice(-30);
    case "week": {
      const window = sorted.length > 130 ? sorted.slice(-130) : sorted;
      return groupByLast(window, (d) => isoWeekKey(parseDate(d)));
    }
    case "month": {
      const window = sorted.length > 750 ? sorted.slice(-750) : sorted;
      return groupByLast(window, (d) => monthKey(parseDate(d)));
    }
    case "year":
      return groupByLast(sorted, (d) => yearKey(parseDate(d)));
    default:
      return sorted;
  }
}
